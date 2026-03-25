import {
  BUILTIN_PATTERNS,
  decodeObfuscation,
  type DetectionPattern,
} from "./patterns";
import { detectHIPAA, hasMedicalContext } from "./hipaa-patterns";
import type {
  ClassificationResult,
  DetectedEntity,
  RiskLevel,
  RuleCategory,
} from "@/lib/supabase/types";

// Risk level priority for determining the highest risk
const RISK_PRIORITY: Record<RiskLevel, number> = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

/**
 * Multi-stage risk classification pipeline.
 *
 * Stage 1: Decode potential obfuscation (base64, hex).
 * Stage 2: Run all regex patterns against the text and decoded variants.
 * Stage 3: Aggregate results — highest risk wins, entities are merged.
 * Stage 4: Compute confidence score based on match density and pattern specificity.
 *
 * Performance target: <100ms for prompts up to 50K characters.
 * For prompts >100K chars, we truncate to first + last 50K and log a warning.
 *
 * Tradeoff: We use regex-only classification (no ML model) to keep this
 * free-tier compatible and sub-100ms. A future version could add an ML
 * classifier as a second stage for ambiguous cases.
 */
export async function classifyRisk(
  promptText: string
): Promise<ClassificationResult> {
  // Handle extremely large prompts
  let textToScan = promptText;
  if (textToScan.length > 100_000) {
    // Scan first and last 50K chars — sensitive data often appears at boundaries
    textToScan =
      textToScan.slice(0, 50_000) + "\n...\n" + textToScan.slice(-50_000);
  }

  // Stage 1: Generate text variants (original + decoded obfuscations)
  const variants = decodeObfuscation(textToScan);

  // Stage 2: Run all patterns across all variants
  const allEntities: DetectedEntity[] = [];
  const matchedRules: string[] = [];
  const categoriesFound = new Set<RuleCategory>();

  for (const variant of variants) {
    for (const pattern of BUILTIN_PATTERNS) {
      const entities = runPattern(pattern, variant);
      if (entities.length > 0) {
        allEntities.push(...entities);
        matchedRules.push(pattern.name);
        categoriesFound.add(pattern.category);
      }
    }
  }

  // Stage 3: Determine highest risk level
  let highestRisk: RiskLevel = "NONE";
  let shouldBlock = false;
  let shouldQuarantine = false;

  for (const entity of allEntities) {
    const pattern = BUILTIN_PATTERNS.find(
      (p) => p.name === entity.pattern_matched
    );
    if (!pattern) continue;

    if (RISK_PRIORITY[pattern.risk_level] > RISK_PRIORITY[highestRisk]) {
      highestRisk = pattern.risk_level;
    }
    if (pattern.action === "BLOCK") shouldBlock = true;
    if (pattern.action === "QUARANTINE") shouldQuarantine = true;
  }

  // If blocking, quarantine flag is redundant
  if (shouldBlock) shouldQuarantine = false;

  // Stage 4: Confidence score
  const confidence = computeConfidence(allEntities, textToScan.length);

  // Deduplicate entities by value
  const uniqueEntities = deduplicateEntities(allEntities);

  return {
    risk_level: highestRisk,
    classifications: Array.from(categoriesFound),
    entities: uniqueEntities,
    confidence,
    should_block: shouldBlock,
    should_quarantine: shouldQuarantine,
    matched_rules: Array.from(new Set(matchedRules)),
  };
}

/**
 * Runs a single detection pattern against text, returning matched entities.
 */
function runPattern(
  pattern: DetectionPattern,
  text: string
): DetectedEntity[] {
  const entities: DetectedEntity[] = [];
  // Reset regex state for global patterns
  pattern.regex.lastIndex = 0;

  let match: RegExpExecArray | null;
  // Cap matches to prevent ReDoS on adversarial input
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
 * Redacts a matched value so it can be stored safely.
 * Shows the first 2 and last 2 characters, replacing the middle with asterisks.
 */
function redactValue(value: string): string {
  if (value.length <= 6) return "***";
  return value.slice(0, 2) + "*".repeat(Math.min(value.length - 4, 10)) + value.slice(-2);
}

/**
 * Per-match confidence based on pattern specificity.
 * Longer matches and more specific patterns get higher scores.
 */
function patternConfidence(
  pattern: DetectionPattern,
  matchedValue: string
): number {
  let score = 0.5; // base

  // Specific patterns (SSN, credit card, keys) get high base confidence
  if (pattern.risk_level === "CRITICAL") score = 0.9;
  else if (pattern.risk_level === "HIGH") score = 0.75;
  else if (pattern.risk_level === "MEDIUM") score = 0.6;

  // Longer matches are more likely to be real
  if (matchedValue.length > 20) score = Math.min(score + 0.1, 1.0);

  return Math.round(score * 100) / 100;
}

/**
 * Overall confidence score for the classification result.
 * Factors: number of entities found, variety of categories, text length ratio.
 */
function computeConfidence(
  entities: DetectedEntity[],
  textLength: number
): number {
  if (entities.length === 0) return 0;

  // More entities → higher confidence (diminishing returns)
  const entityFactor = Math.min(entities.length / 5, 1.0);

  // Avg per-entity confidence
  const avgEntityConfidence =
    entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;

  // Category variety bonus — if multiple categories are hit, it's more likely real
  const categories = new Set(entities.map((e) => e.type));
  const varietyBonus = Math.min((categories.size - 1) * 0.1, 0.2);

  const finalScore = Math.min(
    avgEntityConfidence * 0.6 + entityFactor * 0.3 + varietyBonus + 0.1,
    1.0
  );

  return Math.round(finalScore * 100) / 100;
}

/**
 * Deduplicates entities that match the same value at the same position.
 */
function deduplicateEntities(entities: DetectedEntity[]): DetectedEntity[] {
  const seen = new Set<string>();
  return entities.filter((e) => {
    const key = `${e.type}:${e.position.start}:${e.position.end}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * HIPAA-specific classification.
 *
 * Runs only HIPAA PHI patterns against the text. Use this for
 * dedicated healthcare compliance scanning separate from the
 * general-purpose classifyRisk() pipeline.
 *
 * The general classifyRisk() already includes HIPAA patterns in its
 * BUILTIN_PATTERNS array, so this function is for when you want
 * HIPAA-only results (e.g., the /hipaa landing page scanner,
 * healthcare-specific dashboards, or HIPAA audit reports).
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

  // Boost confidence if medical context is present
  const baseConfidence = result.found
    ? result.severity === "CRITICAL"
      ? 0.9
      : 0.75
    : 0;
  const confidence = result.found && medicalCtx
    ? Math.min(baseConfidence + 0.1, 1.0)
    : baseConfidence;

  const riskLevel: RiskLevel = result.found
    ? result.severity
    : "NONE";

  return {
    risk_level: riskLevel,
    found: result.found,
    patterns: result.patterns,
    severity: result.severity,
    matchCount: result.matchCount,
    hasMedicalContext: medicalCtx,
    confidence: Math.round(confidence * 100) / 100,
  };
}
