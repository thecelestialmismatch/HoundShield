/**
 * Zero-Trust Mode — Deny by Default, Allowlist per Team
 *
 * When KAELUS_ZERO_TRUST=true, ALL AI requests are blocked by default.
 * Access is granted only to explicitly allowlisted:
 *   - AI providers (e.g. "openai", "anthropic")
 *   - AI models (e.g. "gpt-4o-mini", "claude-3-haiku")
 *   - User groups / teams
 *   - Time windows (e.g. business hours only)
 *
 * This implements CMMC AC.1.001 (Limit system access to authorized users)
 * and AC.1.002 (Limit system access to permitted transactions).
 *
 * Supabase table: zero_trust_rules
 *   id          UUID PRIMARY KEY
 *   org_id      TEXT NOT NULL
 *   rule_type   TEXT NOT NULL  -- 'provider' | 'model' | 'team' | 'time_window'
 *   value       TEXT NOT NULL  -- the allowlisted value
 *   enabled     BOOLEAN DEFAULT true
 *   created_at  TIMESTAMPTZ DEFAULT NOW()
 *
 * Example rules:
 *   { rule_type: 'provider', value: 'openai' }           -- allow OpenAI only
 *   { rule_type: 'model',    value: 'gpt-4o-mini' }      -- allow specific model
 *   { rule_type: 'team',     value: 'engineering' }       -- allow engineering team
 *   { rule_type: 'time_window', value: '09:00-17:00 UTC' } -- business hours only
 */

export type ZeroTrustRuleType = "provider" | "model" | "team" | "time_window";

export interface ZeroTrustRule {
  id: string;
  org_id: string;
  rule_type: ZeroTrustRuleType;
  value: string;
  enabled: boolean;
}

export interface ZeroTrustDecision {
  allowed: boolean;
  reason: string;
  /** Which rule granted access, if allowed */
  matched_rule?: ZeroTrustRule;
}

// ---------------------------------------------------------------------------
// Global zero-trust mode toggle
// ---------------------------------------------------------------------------

export function isZeroTrustEnabled(): boolean {
  return process.env.KAELUS_ZERO_TRUST === "true";
}

// ---------------------------------------------------------------------------
// In-memory rule cache per org
// ---------------------------------------------------------------------------

interface RuleCache {
  rules: ZeroTrustRule[];
  expiresAt: number;
}

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 min — tighter than pattern cache for security
const ruleCache = new Map<string, RuleCache>();

export async function loadZeroTrustRules(orgId: string): Promise<ZeroTrustRule[]> {
  const cached = ruleCache.get(orgId);
  if (cached && cached.expiresAt > Date.now()) return cached.rules;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("zero_trust_rules")
      .select("*")
      .eq("org_id", orgId)
      .eq("enabled", true);

    if (error) {
      console.error("[zero-trust] Failed to load rules:", error.message);
      return [];
    }

    const rules = (data ?? []) as ZeroTrustRule[];
    ruleCache.set(orgId, { rules, expiresAt: Date.now() + CACHE_TTL_MS });
    return rules;
  } catch {
    return [];
  }
}

export function invalidateZeroTrustCache(orgId: string): void {
  ruleCache.delete(orgId);
}

// ---------------------------------------------------------------------------
// Decision engine
// ---------------------------------------------------------------------------

/**
 * Evaluate whether a request is allowed under zero-trust rules.
 *
 * @param orgId    — org making the request
 * @param provider — AI provider being called (e.g. "openai")
 * @param model    — model being requested (e.g. "gpt-4o-mini")
 * @param team     — team/group of the requesting user (optional)
 */
export async function evaluateZeroTrust(
  orgId: string,
  provider: string,
  model: string,
  team?: string
): Promise<ZeroTrustDecision> {
  if (!isZeroTrustEnabled()) {
    return { allowed: true, reason: "zero-trust disabled" };
  }

  const rules = await loadZeroTrustRules(orgId);

  if (rules.length === 0) {
    // Zero-trust is on but no allowlist configured → deny all
    return {
      allowed: false,
      reason: "Zero-trust mode is active but no allowlist rules are configured. Add rules at Settings → Zero Trust.",
    };
  }

  // Check provider allowlist
  const providerRules = rules.filter((r) => r.rule_type === "provider");
  if (providerRules.length > 0) {
    const match = providerRules.find(
      (r) => r.value.toLowerCase() === provider.toLowerCase()
    );
    if (!match) {
      return {
        allowed: false,
        reason: `Provider "${provider}" is not on your allowlist. Allowed: ${providerRules.map((r) => r.value).join(", ")}`,
      };
    }
  }

  // Check model allowlist
  const modelRules = rules.filter((r) => r.rule_type === "model");
  if (modelRules.length > 0) {
    const match = modelRules.find(
      (r) => r.value.toLowerCase() === model.toLowerCase()
    );
    if (!match) {
      return {
        allowed: false,
        reason: `Model "${model}" is not on your allowlist. Allowed: ${modelRules.map((r) => r.value).join(", ")}`,
      };
    }
  }

  // Check team allowlist
  if (team) {
    const teamRules = rules.filter((r) => r.rule_type === "team");
    if (teamRules.length > 0) {
      const match = teamRules.find(
        (r) => r.value.toLowerCase() === team.toLowerCase()
      );
      if (!match) {
        return {
          allowed: false,
          reason: `Team "${team}" is not authorized to use AI tools. Contact your compliance admin.`,
        };
      }
    }
  }

  // Check time window allowlist
  const timeRules = rules.filter((r) => r.rule_type === "time_window");
  if (timeRules.length > 0) {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMin = now.getUTCMinutes();
    const currentMinutes = utcHour * 60 + utcMin;

    const inWindow = timeRules.some((r) => {
      const [start, end] = r.value.replace(" UTC", "").split("-");
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      const startMin = sh * 60 + (sm ?? 0);
      const endMin = eh * 60 + (em ?? 0);
      return currentMinutes >= startMin && currentMinutes <= endMin;
    });

    if (!inWindow) {
      return {
        allowed: false,
        reason: `AI access is restricted to business hours. Allowed windows: ${timeRules.map((r) => r.value).join(", ")}`,
      };
    }
  }

  return {
    allowed: true,
    reason: "All zero-trust checks passed",
    matched_rule: rules[0],
  };
}
