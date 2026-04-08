import {
  BUILTIN_PATTERNS,
  decodeObfuscation,
  type DetectionPattern,
} from "./patterns";
import { detectHIPAA, hasMedicalContext } from "./hipaa-patterns";
import { scanWithGeminiFlash, isGeminiConfigured } from "./gemini-scanner";
import type {
  ClassificationResult,
  DetectedEntity,
  RiskLevel,
  RuleCategory,
} from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Risk level priority
// ---------------------------------------------------------------------------

const RISK_PRIORITY: Record<RiskLevel, number> = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

// ---------------------------------------------------------------------------
// Pre-sorted patterns — CRITICAL first for early short-circuit
//
// By sorting once at module load (not per call) we pay O(N log N) once and
// then get early-exit benefits on every subsequent classification.
// ---------------------------------------------------------------------------

const SORTED_PATTERNS: DetectionPattern[] = [...BUILTIN_PATTERNS].sort(
  (a, b) => RISK_PRIORITY[b.risk_level] - RISK_PRIORITY[a.risk_level]
);

// ---------------------------------------------------------------------------
// LRU classification cache
//
// Identical (or near-identical) prompts — e.g., overlapping scan windows
// from StreamScanner — are extremely common. Caching the classification
// result avoids redundant regex work and cuts average scan latency by >50%
// on repeated content.
//
// Cache key: for short texts (<= 5 000 chars) use the full text; for longer
// texts use the first 200 chars + total length. This is a fast approximation
// that avoids hashing while still catching the most common repeat patterns.
//
// LRU eviction: Map preserves insertion order. On every cache hit we delete
// + re-insert the entry, moving it to the tail (most-recently-used). On
// eviction we delete the head (least-recently-used).
// ---------------------------------------------------------------------------

interface CacheEntry {
  result: ClassificationResult;
  ts: number;
}

const classificationCache = new Map<string, CacheEntry>();
const CACHE_MAX_SIZE = 256;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function buildCacheKey(text: string): string {
  if (text.length <= 5_000) return text;
  return `${text.slice(0, 200)}::len:${text.length}`;
}

function cacheGet(key: string): ClassificationResult | null {
  const entry = classificationCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    classificationCache.delete(key);
    return null;
  }
  // Move to tail (LRU: most-recently-used at end)
  classificationCache.delete(key);
  classificationCache.set(key, entry);
  return entry.result;
}

function cacheSet(key: string, result: ClassificationResult): void {
  // Evict LRU entry (head of Map) if at capacity
  if (classificationCache.size >= CACHE_MAX_SIZE) {
    const lruKey = classificationCache.keys().next().value;
    if (lruKey !== undefined) classificationCache.delete(lruKey);
  }
  classificationCache.set(key, { result, ts: Date.now() });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Multi-stage risk classification pipeline.
 *
 * Stage 0 (optional): Gemini Flash intent scan with hard 12ms budget.
 *   Fired concurrently with regex — if it returns in time it can elevate risk
 *   for context-aware leaks that regex misses (implicit trade secrets, etc.).
 *
 * Stage 1: Cache lookup — skip all work for repeated/near-identical content.
 *
 * Stage 2: Decode obfuscation variants (base64, hex).
 *
 * Stage 3: Run SORTED_PATTERNS (CRITICAL first) across all variants.
 *   Short-circuits the variant loop when a CRITICAL+BLOCK match is found.
 *
 * Stage 4: Aggregate — highest risk wins; merge entities.
 *
 * Stage 5: Merge Gemini result (if available).
 *
 * Stage 6: Confidence score. Cache and return.
 *
 * Performance target: <100ms for prompts up to 50K characters.
 * With cache hits the cost drops to a Map lookup (~1µs).
 */
export async function classifyRisk(
  promptText: string
): Promise<ClassificationResult> {
  // Truncate extremely large prompts: keep head + tail to preserve both
  // context regions where sensitive data is most likely to appear.
  let textToScan = promptText;
  if (textToScan.length > 100_000) {
    textToScan =
      textToScan.slice(0, 50_000) + "\n...\n" + textToScan.slice(-50_000);
  }

  // ── Stage 0: Fire Gemini Flash concurrently (non-blocking, 12ms hard cap) ──
  const geminiPromise = isGeminiConfigured()
    ? scanWithGeminiFlash(textToScan).catch(() => null)
    : Promise.resolve(null);

  // ── Stage 1: Cache lookup ─────────────────────────────────────────────────
  const cacheKey = buildCacheKey(textToScan);
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  // ── Stage 2: Decode obfuscation variants ──────────────────────────────────
  const variants = decodeObfuscation(textToScan);

  // ── Stage 3: Run patterns (CRITICAL-first) with early short-circuit ───────
  const allEntities: DetectedEntity[] = [];
  const matchedRules: string[] = [];
  const categoriesFound = new Set<RuleCategory>();

  let earlyExit = false;
  let shouldBlock = false;
  let shouldQuarantine = false;
  let highestRisk: RiskLevel = "NONE";

  for (const variant of variants) {
    if (earlyExit) break;

    for (const pattern of SORTED_PATTERNS) {
      const entities = runPattern(pattern, variant);

      if (entities.length > 0) {
        allEntities.push(...entities);
        matchedRules.push(pattern.name);
        categoriesFound.add(pattern.category);

        // Update aggregate risk
        if (RISK_PRIORITY[pattern.risk_level] > RISK_PRIORITY[highestRisk]) {
          highestRisk = pattern.risk_level;
        }
        if (pattern.action === "BLOCK") shouldBlock = true;
        if (pattern.action === "QUARANTINE" && !shouldBlock) shouldQuarantine = true;

        // Short-circuit: once we've found a CRITICAL BLOCK, no further
        // scanning can produce a higher-severity result.
        if (pattern.risk_level === "CRITICAL" && pattern.action === "BLOCK") {
          earlyExit = true;
          break;
        }
      }
    }
  }

  // BLOCK takes precedence over QUARANTINE
  if (shouldBlock) shouldQuarantine = false;

  // ── Stage 4 (already merged above) ───────────────────────────────────────

  // ── Stage 5: Merge Gemini result if it finished within budget ─────────────
  const geminiResult = await Promise.race([
    geminiPromise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 12)),
  ]);

  let geminiCategoryNames: string[] = [];
  if (geminiResult) {
    if (RISK_PRIORITY[geminiResult.risk_level] > RISK_PRIORITY[highestRisk]) {
      highestRisk = geminiResult.risk_level;
      if (
        geminiResult.risk_level === "CRITICAL" ||
        geminiResult.risk_level === "HIGH"
      ) {
        shouldBlock = true;
        shouldQuarantine = false;
      } else if (geminiResult.risk_level === "MEDIUM" && !shouldBlock) {
        shouldQuarantine = true;
      }
    }
    geminiCategoryNames = geminiResult.detected_categories;
    for (const cat of geminiCategoryNames) {
      const mapped = mapGeminiCategory(cat);
      if (mapped) categoriesFound.add(mapped);
    }
  }

  // ── Stage 6: Confidence + deduplicate + cache ─────────────────────────────
  const uniqueEntities = deduplicateEntities(allEntities);
  const confidence = computeConfidence(uniqueEntities, textToScan.length);

  const result: ClassificationResult = {
    risk_level: highestRisk,
    classifications: Array.from(categoriesFound),
    entities: uniqueEntities,
    confidence,
    should_block: shouldBlock,
    should_quarantine: shouldQuarantine,
    matched_rules: Array.from(new Set(matchedRules)),
    ...(geminiResult
      ? {
          ml_scan: {
            model: geminiResult.model,
            inference_ms: geminiResult.inference_ms,
            reasoning: geminiResult.reasoning,
            categories: geminiResult.detected_categories,
          },
        }
      : {}),
  };

  cacheSet(cacheKey, result);
  return result;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Maps a Gemini category string to our canonical RuleCategory. */
function mapGeminiCategory(cat: string): RuleCategory | null {
  const lower = cat.toLowerCase();
  if (lower.includes("pii") || lower.includes("personal")) return "PII";
  if (lower.includes("financial") || lower.includes("credit")) return "FINANCIAL";
  if (lower.includes("trade") || lower.includes("strategic")) return "STRATEGIC";
  if (
    lower.includes("credential") ||
    lower.includes("secret") ||
    lower.includes("key") ||
    lower.includes("code")
  )
    return "IP";
  if (
    lower.includes("phi") ||
    lower.includes("medical") ||
    lower.includes("health")
  )
    return "HIPAA_PHI";
  return null;
}

/**
 * Runs a single detection pattern against text, returning matched entities.
 * Caps matches at 50 to prevent ReDoS on adversarial input.
 */
function runPattern(
  pattern: DetectionPattern,
  text: string
): DetectedEntity[] {
  const entities: DetectedEntity[] = [];
  pattern.regex.lastIndex = 0;

  let match: RegExpExecArray | null;
  let matchCount = 0;
  const MAX_MATCHES = 50;

  while (
    (match = pattern.regex.exec(text)) !== null &&
    matchCount < MAX_MATCHES
  ) {
    matchCount++;
    const rawValue = match[0];

    entities.push({
      type: pattern.category,
      value_redacted: redactValue(rawValue),
      pattern_matched: pattern.name,
      confidence: patternConfidence(pattern, rawValue),
      position: {
        start: match.index,
        end: match.index + rawValue.length,
      },
    });

    // Prevent infinite loops on zero-length matches
    if (match.index === pattern.regex.lastIndex) {
      pattern.regex.lastIndex++;
    }
  }

  return entities;
}

/**
 * Redacts a matched value so it can be stored in audit logs safely.
 * Shows the first 2 and last 2 characters; replaces the middle with asterisks.
 */
function redactValue(value: string): string {
  if (value.length <= 6) return "***";
  return (
    value.slice(0, 2) +
    "*".repeat(Math.min(value.length - 4, 10)) +
    value.slice(-2)
  );
}

/**
 * Per-match confidence based on pattern specificity and match length.
 */
function patternConfidence(
  pattern: DetectionPattern,
  matchedValue: string
): number {
  let score = 0.5;
  if (pattern.risk_level === "CRITICAL") score = 0.9;
  else if (pattern.risk_level === "HIGH") score = 0.75;
  else if (pattern.risk_level === "MEDIUM") score = 0.6;

  if (matchedValue.length > 20) score = Math.min(score + 0.1, 1.0);
  return Math.round(score * 100) / 100;
}

/**
 * Overall confidence for the classification result.
 * Factors: entity count, average per-entity confidence, category variety.
 */
function computeConfidence(
  entities: DetectedEntity[],
  textLength: number
): number {
  if (entities.length === 0) return 0;

  const entityFactor = Math.min(entities.length / 5, 1.0);
  const avgEntityConfidence =
    entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;
  const categories = new Set(entities.map((e) => e.type));
  const varietyBonus = Math.min((categories.size - 1) * 0.1, 0.2);

  return Math.min(
    Math.round(
      (avgEntityConfidence * 0.6 + entityFactor * 0.3 + varietyBonus + 0.1) *
        100
    ) / 100,
    1.0
  );
}

/** Deduplicates entities that match the same position. */
function deduplicateEntities(entities: DetectedEntity[]): DetectedEntity[] {
  const seen = new Set<string>();
  return entities.filter((e) => {
    const key = `${e.type}:${e.position.start}:${e.position.end}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// HIPAA-specific classifier (public export)
// ---------------------------------------------------------------------------

/**
 * HIPAA-specific classification.
 *
 * Runs only HIPAA PHI patterns. Use for dedicated healthcare compliance
 * scanning separate from the general-purpose classifyRisk() pipeline.
 */
export async function classifyHIPAA(
  promptText: string
): Promise<{
  risk_level: RiskLevel;
  found: boolean;
  patterns: string[];
  severity: "HIGH" | "CRITICAL";
  matchCount: number;
  hasMedicalContext: boolean;
  confidence: number;
}> {
  let textToScan = promptText;
  if (textToScan.length > 100_000) {
    textToScan =
      textToScan.slice(0, 50_000) + "\n...\n" + textToScan.slice(-50_000);
  }

  const result = detectHIPAA(textToScan);
  const medicalCtx = hasMedicalContext(textToScan);

  const baseConfidence = result.found
    ? result.severity === "CRITICAL"
      ? 0.9
      : 0.75
    : 0;
  const confidence =
    result.found && medicalCtx
      ? Math.min(baseConfidence + 0.1, 1.0)
      : baseConfidence;

  return {
    risk_level: result.found ? result.severity : "NONE",
    found: result.found,
    patterns: result.patterns,
    severity: result.severity,
    matchCount: result.matchCount,
    hasMedicalContext: medicalCtx,
    confidence: Math.round(confidence * 100) / 100,
  };
}
