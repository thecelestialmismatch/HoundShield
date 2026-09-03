/**
 * Zero-Trust Mode — Deny by Default, Allowlist per Team
 *
 * ponytail: BUILT, TESTED, NOT WIRED (confirmed 2026-09-03). No request path
 * imports this module, and HOUNDSHIELD_ZERO_TRUST is not in .env.example, so
 * an operator following the docs cannot switch it on. It is kept rather than
 * deleted because a deny-by-default access control is a product capability,
 * not tidy-up: removing it is a founder decision, and wiring it into the live
 * gateway is a behaviour change that needs its own PR and its own risk review.
 * Decide one way or the other — an unwired security control that reads as
 * shipped is the worst of both.
 *
 * When HOUNDSHIELD_ZERO_TRUST=true, ALL AI requests are blocked by default.
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
  return process.env.HOUNDSHIELD_ZERO_TRUST === "true";
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
// Time window parsing
// ---------------------------------------------------------------------------

/**
 * Parses a `"09:00-17:00 UTC"` style window into minutes-since-midnight.
 *
 * Returns null for anything it cannot read. Previously this was inlined and
 * unguarded: a value without a "-" left `end` undefined, and `end.split(":")`
 * threw a TypeError that escaped `evaluateZeroTrust` entirely. One malformed
 * row — user-editable data — turned an access-control decision into an
 * unhandled exception at the gateway.
 *
 * Callers treat null as "this rule allows nothing", so a bad row narrows
 * access rather than widening it.
 */
function parseTimeWindow(
  value: string
): { startMin: number; endMin: number } | null {
  const [start, end] = value.replace(" UTC", "").trim().split("-");
  if (!start || !end) return null;

  const toMinutes = (part: string): number | null => {
    const [h, m] = part.trim().split(":").map(Number);
    if (!Number.isInteger(h) || h < 0 || h > 23) return null;
    const minutes = m === undefined ? 0 : m;
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 59) return null;
    return h * 60 + minutes;
  };

  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  if (startMin === null || endMin === null) return null;

  return { startMin, endMin };
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
      const parsed = parseTimeWindow(r.value);
      if (!parsed) return false; // unparseable rule grants nothing — fail closed
      const { startMin, endMin } = parsed;

      // A window whose end is before its start crosses midnight
      // ("22:00-02:00"). Comparing with && can never be true in that case,
      // which silently locked out every org on a night shift. Wrapping
      // windows are a union of two ranges, not an intersection.
      return endMin < startMin
        ? currentMinutes >= startMin || currentMinutes <= endMin
        : currentMinutes >= startMin && currentMinutes <= endMin;
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
