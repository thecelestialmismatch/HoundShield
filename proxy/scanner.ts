/**
 * Hound Shield Proxy — CUI/PII/PHI scanner.
 *
 * Pure function — no I/O, no Supabase, no Next.js.
 * Takes text → returns ScanResult in <10ms for typical prompts.
 *
 * Uses LRU cache (256 entries, 5-min TTL) to short-circuit repeated content.
 */

import { ALL_PATTERNS, decodeObfuscation } from "./patterns/index.js";
import type {
  RiskLevel,
  Action,
  DetectedEntity,
  ScanResult,
} from "./patterns/index.js";

// ── LRU cache ──────────────────────────────────────────────────────────────

interface CacheEntry {
  result: ScanResult;
  expires: number;
}

const CACHE_SIZE = 256;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Map insertion order = LRU ordering via delete+re-insert on hit
const _cache = new Map<string, CacheEntry>();

function cacheGet(key: string): ScanResult | undefined {
  const entry = _cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    _cache.delete(key);
    return undefined;
  }
  // Move to end (most recently used)
  _cache.delete(key);
  _cache.set(key, entry);
  return entry.result;
}

function cacheSet(key: string, result: ScanResult): void {
  if (_cache.size >= CACHE_SIZE) {
    // Evict oldest (first inserted key)
    const first = _cache.keys().next().value;
    if (first !== undefined) _cache.delete(first);
  }
  _cache.set(key, { result, expires: Date.now() + CACHE_TTL_MS });
}

// ── Risk ordering ──────────────────────────────────────────────────────────

const RISK_ORDER: Record<RiskLevel, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  NONE: 4,
};

const ACTION_ORDER: Record<Action, number> = {
  BLOCK: 0,
  QUARANTINE: 1,
  ALLOW: 2,
};

function maxRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  return RISK_ORDER[a] <= RISK_ORDER[b] ? a : b;
}

function maxAction(a: Action, b: Action): Action {
  return ACTION_ORDER[a] <= ACTION_ORDER[b] ? a : b;
}

// ── Core scan ──────────────────────────────────────────────────────────────

const MAX_TEXT_LENGTH = 128_000; // 128 KB hard cap

/**
 * Scans a single text string for CUI/PII/PHI.
 * Patterns are sorted CRITICAL-first; first BLOCK exits early.
 */
function scanText(text: string): ScanResult {
  const start = performance.now();
  const entities: DetectedEntity[] = [];
  let aggregateRisk: RiskLevel = "NONE";
  let aggregateAction: Action = "ALLOW";

  // Decode any obfuscation before scanning
  const expanded = decodeObfuscation(text.slice(0, MAX_TEXT_LENGTH));

  for (const pattern of ALL_PATTERNS) {
    // Clone regex to reset lastIndex between calls (non-global flags auto-reset)
    const re = new RegExp(pattern.regex.source, pattern.regex.flags);
    const match = expanded.match(re);
    if (!match) continue;

    const snippet = match[0];
    entities.push({
      pattern_name: pattern.name,
      category: pattern.category,
      risk_level: pattern.risk_level,
      action: pattern.action,
      nist_controls: pattern.nist_controls,
      // Redacted snippet — never leaves proxy, used only in local log
      match_snippet: snippet.slice(0, 20) + (snippet.length > 20 ? "…" : ""),
    });

    aggregateRisk = maxRisk(aggregateRisk, pattern.risk_level);
    aggregateAction = maxAction(aggregateAction, pattern.action);

    // Early exit: found a CRITICAL BLOCK — no need to keep scanning
    if (aggregateRisk === "CRITICAL" && aggregateAction === "BLOCK") break;
  }

  return {
    risk_level: aggregateRisk,
    action: aggregateAction,
    entities,
    scan_ms: Math.round((performance.now() - start) * 100) / 100,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────

export type { ScanResult, DetectedEntity, RiskLevel, Action };

/**
 * Extracts all text from an OpenAI-format messages array and scans it.
 * Checks every role (system, user, assistant, tool) — CUI can appear anywhere.
 * Uses cache keyed on full text content.
 */
export function scanMessages(
  messages: Array<{ role: string; content: unknown }>
): ScanResult {
  // Extract all text content
  const parts: string[] = [];
  for (const msg of messages) {
    if (typeof msg.content === "string") {
      parts.push(msg.content);
    } else if (Array.isArray(msg.content)) {
      for (const block of msg.content as Array<{
        type: string;
        text?: string;
      }>) {
        if (block.type === "text" && block.text) {
          parts.push(block.text);
        }
      }
    }
  }

  const combined = parts.join("\n");
  const cached = cacheGet(combined);
  if (cached) return { ...cached, scan_ms: 0 }; // cache hit

  const result = scanText(combined);
  cacheSet(combined, result);
  return result;
}

/**
 * Scans a raw string directly (for tool call args, MCP inputs, etc.).
 */
export function scanString(text: string): ScanResult {
  const cached = cacheGet(text);
  if (cached) return { ...cached, scan_ms: 0 };
  const result = scanText(text);
  cacheSet(text, result);
  return result;
}

export function clearScanCache(): void {
  _cache.clear();
}
