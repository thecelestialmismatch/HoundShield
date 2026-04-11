/**
 * Custom Pattern Library — Per-Tenant Compliance Rules
 *
 * Allows organizations to define their own sensitive data patterns
 * on top of Kaelus's built-in 16+ detection rules.
 *
 * Use cases:
 *   - Defense contractors: custom contract number formats, program codes
 *   - Healthcare: internal patient ID formats, facility codes
 *   - Financial: proprietary account number schemes
 *   - Legal: matter numbers, client codes
 *
 * Storage: Supabase `org_patterns` table (see migration below)
 * Cache: In-memory LRU per org_id (TTL: 5 min) — avoids DB call on every scan
 *
 * Supabase migration:
 *   CREATE TABLE org_patterns (
 *     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     org_id TEXT NOT NULL,
 *     name TEXT NOT NULL,
 *     pattern TEXT NOT NULL,           -- regex string
 *     risk_level TEXT NOT NULL DEFAULT 'HIGH',  -- LOW|MEDIUM|HIGH|CRITICAL
 *     description TEXT,
 *     enabled BOOLEAN NOT NULL DEFAULT true,
 *     created_at TIMESTAMPTZ DEFAULT NOW(),
 *     updated_at TIMESTAMPTZ DEFAULT NOW()
 *   );
 *   CREATE INDEX ON org_patterns (org_id, enabled);
 *   ALTER TABLE org_patterns ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "org members only" ON org_patterns
 *     USING (org_id = auth.jwt()->>'org_id');
 */

export type PatternRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface OrgPattern {
  id: string;
  org_id: string;
  name: string;
  /** Raw regex string — compiled on load */
  pattern: string;
  risk_level: PatternRiskLevel;
  description?: string;
  enabled: boolean;
}

export interface CompiledOrgPattern extends OrgPattern {
  regex: RegExp;
}

export interface CustomScanResult {
  matched: boolean;
  pattern_name: string;
  risk_level: PatternRiskLevel;
  match_count: number;
}

// ---------------------------------------------------------------------------
// In-memory LRU cache per org_id
// ---------------------------------------------------------------------------

interface CacheEntry {
  patterns: CompiledOrgPattern[];
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 500;

const patternCache = new Map<string, CacheEntry>();

function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of patternCache) {
    if (entry.expiresAt <= now) patternCache.delete(key);
  }
  // If still over limit, evict oldest (first inserted)
  if (patternCache.size > MAX_CACHE_ENTRIES) {
    const oldest = patternCache.keys().next().value;
    if (oldest) patternCache.delete(oldest);
  }
}

/** Compile a pattern string to a RegExp, or null if invalid. */
function compilePattern(p: OrgPattern): CompiledOrgPattern | null {
  try {
    return { ...p, regex: new RegExp(p.pattern, "gi") };
  } catch (err) {
    console.error(`[custom-patterns] Invalid regex for "${p.name}": ${err}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Supabase loader
// ---------------------------------------------------------------------------

/** Load and cache compiled patterns for an org from Supabase. */
export async function loadOrgPatterns(orgId: string): Promise<CompiledOrgPattern[]> {
  evictExpired();

  const cached = patternCache.get(orgId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.patterns;
  }

  try {
    // Dynamic import to avoid top-level Supabase initialization issues
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("org_patterns")
      .select("*")
      .eq("org_id", orgId)
      .eq("enabled", true);

    if (error) {
      console.error(`[custom-patterns] Supabase error for org ${orgId}:`, error.message);
      return [];
    }

    const compiled = (data as OrgPattern[])
      .map(compilePattern)
      .filter((p): p is CompiledOrgPattern => p !== null);

    patternCache.set(orgId, {
      patterns: compiled,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return compiled;
  } catch (err) {
    console.error("[custom-patterns] Load failed:", err);
    return [];
  }
}

/** Invalidate cached patterns for an org (call after pattern CRUD). */
export function invalidateOrgPatternCache(orgId: string): void {
  patternCache.delete(orgId);
}

// ---------------------------------------------------------------------------
// Scanner
// ---------------------------------------------------------------------------

/**
 * Scan text against an org's custom patterns.
 * Returns an array of matches (one per matching pattern).
 */
export function scanWithCustomPatterns(
  text: string,
  patterns: CompiledOrgPattern[]
): CustomScanResult[] {
  const results: CustomScanResult[] = [];

  for (const p of patterns) {
    // Reset regex lastIndex for global flag
    p.regex.lastIndex = 0;
    const matches = text.match(p.regex);
    if (matches && matches.length > 0) {
      results.push({
        matched: true,
        pattern_name: p.name,
        risk_level: p.risk_level,
        match_count: matches.length,
      });
    }
  }

  return results;
}

/**
 * Full custom scan — loads patterns for org, runs scan, returns results.
 * Returns empty array if org has no custom patterns or patterns can't load.
 */
export async function customScan(
  text: string,
  orgId: string
): Promise<CustomScanResult[]> {
  if (!orgId) return [];
  const patterns = await loadOrgPatterns(orgId);
  if (patterns.length === 0) return [];
  return scanWithCustomPatterns(text, patterns);
}

/** Get the highest risk level from a set of custom scan results. */
export function maxRiskLevel(results: CustomScanResult[]): PatternRiskLevel | null {
  const order: PatternRiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  let max = -1;
  for (const r of results) {
    const idx = order.indexOf(r.risk_level);
    if (idx > max) max = idx;
  }
  return max >= 0 ? order[max] : null;
}
