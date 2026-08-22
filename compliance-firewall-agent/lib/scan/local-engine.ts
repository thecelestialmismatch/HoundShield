import type { RiskLevel, RuleCategory } from "@/lib/supabase/types";
import {
  scanForSnapshot,
  splitPrompts,
  summarizeFindings,
  type SnapshotFinding,
  type SnapshotSummary,
} from "@/lib/reports/snapshot-from-scan";
import { BUILTIN_PATTERNS } from "@/lib/classifier/patterns";
import { CMMC_PATTERNS } from "@/lib/classifier/cmmc-patterns";
import { HIPAA_PATTERNS } from "@/lib/classifier/hipaa-patterns";
import { CATEGORY_LABEL } from "@/lib/reports/category-nist-map";

/**
 * The hardened, browser-only scan core. One engine, used by BOTH the public
 * `/demo` snapshot and the after-login `/command-center/scanner`.
 *
 * ─── The boundary this file exists to hold ────────────────────────────────
 * Every function here is pure and synchronous over a string. There is no
 * `fetch`, no `XMLHttpRequest`, no dynamic import of anything that performs
 * I/O, and none may ever be added: `lib/scan/__tests__/no-network.test.ts`
 * fails the build if this module's import graph reaches a network-calling
 * module. The pasted text never leaves the device, and that is enforced by a
 * test rather than by a comment.
 *
 * This replaced a dashboard scanner that POSTed the customer's text to
 * `/api/scan`, which forwarded it to Bytez and Google Gemini. On a product sold
 * to people handling CUI and PHI, the one place a logged-in customer was invited
 * to paste a real prompt was the one place it left their machine.
 * ──────────────────────────────────────────────────────────────────────────
 */

/** Every local pattern, in the same combination `scanForSnapshot` uses. */
const ALL_PATTERNS = [...BUILTIN_PATTERNS, ...CMMC_PATTERNS, ...HIPAA_PATTERNS];

/**
 * Hard input ceiling. MEASURED, not guessed.
 *
 * Realistic text scans linearly and cheaply — 100,000 characters of prose with
 * ordinary whitespace sweeps all 56 patterns in ~38ms.
 *
 * The first draft of this file set the ceiling at 200,000 and the test suite
 * caught it: the scan blew past a 5-second timeout. Benchmarking showed size
 * was not the variable. Cost is roughly QUADRATIC in the length of a single
 * unbroken non-whitespace RUN, because several shipped patterns backtrack
 * across a long uniform character class:
 *
 *   realistic, whitespace  100,000 chars →     38ms
 *   one unbroken run        10,000 chars →    358ms
 *   one unbroken run        25,000 chars →  2,441ms
 *   one unbroken run        50,000 chars → 10,030ms
 *
 * So the ceiling stays generous and `MAX_TOKEN_CHARS` bounds the shape that
 * actually costs. Fixing the patterns themselves would be the deeper repair,
 * but CLAUDE.md forbids modifying them without `compliance-specialist`, and a
 * defensive bound in the caller is the correct place for it regardless.
 *
 * ponytail: bounded + synchronous, deliberately no Web Worker. Worst case is
 * now well under a frame budget on realistic input; a worker would be
 * speculative complexity. Move the sweep into one (same-origin, still no
 * network) if this ceiling ever has to rise materially.
 */
export const MAX_INPUT_CHARS = 100_000;

/**
 * Longest unbroken non-whitespace run the plain-text sweep will scan.
 *
 * Real prompts, prose and code have whitespace. A 2,000-character run without
 * any is not a sentence — it is a blob: a base64 attachment, a minified bundle,
 * a data URI. Those are elided from the PLAIN sweep (where they cost quadratic
 * time and find nothing, since patterns match human-shaped strings) but are
 * still handed to `decodeVariants`, so base64-wrapped CUI is caught by the
 * decode path, which is where it was always going to be found.
 */
export const MAX_TOKEN_CHARS = 2_000;

/**
 * Elide over-long unbroken runs, preserving offsets so the redacted preview
 * still lines up with what the user pasted.
 */
function boundLongRuns(text: string): string {
  return text.replace(/\S{2001,}/g, (run) => `${run.slice(0, MAX_TOKEN_CHARS)} `);
}

/** Where a finding was discovered — plain text, or inside an encoded blob. */
export type FoundVia = "plain" | "base64" | "hex";

export interface LocalFinding extends SnapshotFinding {
  /**
   * `base64` / `hex` mean the match was only visible AFTER decoding an encoded
   * span. That is the interesting case: it is exfiltration that a naive
   * "search the prompt for an SSN" control does not see.
   */
  foundVia: FoundVia;
}

export interface CategoryCoverage {
  category: RuleCategory;
  label: string;
  /** Distinct patterns in this category that matched. */
  matched: number;
  /** Total matches across those patterns. */
  occurrences: number;
}

export interface LocalScanResult {
  summary: SnapshotSummary;
  findings: LocalFinding[];
  /** Per data-category rollup — real mapping, never an invented one. */
  coverage: CategoryCoverage[];
  /** Prompt-level breakdown, in paste order. */
  perPrompt: Array<{ index: number; chars: number; findings: number; worst: RiskLevel }>;
  /** The paste with every match masked in place. Contains no matched value. */
  redacted: string;
  /** Patterns actually evaluated. Reported so a clean result is legible. */
  patternsChecked: number;
  /** Real `performance.now()` delta for the sweep. */
  scanMs: number;
  /** Set when the input was refused for exceeding MAX_INPUT_CHARS. */
  rejected?: { reason: "too_large"; chars: number; limit: number };
}

/* ─────────────────────────── obfuscation ─────────────────────────── */

/**
 * Browser-safe decode of base64 / hex spans.
 *
 * `decodeObfuscation` in `lib/classifier/patterns.ts` does this for the SERVER
 * engine — but it is built on `Buffer`, a Node global, so it cannot run here.
 * That is exactly why the browser scan never had it, and why base64-encoded CUI
 * passed the demo while the shipped product caught it: the demo UNDER-reported
 * its own engine. This is the same idea on `atob` + `TextDecoder`.
 *
 * Deliberately conservative — a decode is kept only when it yields printable
 * text, so random hex and binary blobs do not manufacture phantom findings.
 */
export function decodeVariants(text: string): Array<{ text: string; via: FoundVia }> {
  const out: Array<{ text: string; via: FoundVia }> = [];
  const seen = new Set<string>();

  const printable = (s: string) => s.length > 0 && /^[\x20-\x7E\n\r\t]+$/.test(s);
  const push = (s: string, via: FoundVia) => {
    if (!printable(s) || seen.has(s)) return;
    seen.add(s);
    out.push({ text: s, via });
  };

  for (const m of text.matchAll(/[A-Za-z0-9+/]{20,}={0,2}/g)) {
    try {
      const bin = atob(m[0]);
      // atob yields a binary string; widen it to real UTF-8.
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      push(new TextDecoder("utf-8", { fatal: false }).decode(bytes), "base64");
    } catch {
      // not valid base64 — skip, never throw out of a scan
    }
  }

  for (const m of text.matchAll(/(?:0x)?([0-9a-fA-F]{20,})/g)) {
    const hex = m[1];
    if (hex.length % 2 !== 0) continue;
    try {
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
      }
      push(new TextDecoder("utf-8", { fatal: false }).decode(bytes), "hex");
    } catch {
      // not valid hex — skip
    }
  }

  return out;
}

/* ─────────────────────────── redaction ─────────────────────────── */

/**
 * Replace every match with a label naming WHAT was found, never the value.
 *
 * This is the single most sensitive function in the feature: it takes the
 * user's text and produces something rendered on screen. It is written to be
 * obviously correct — spans are collected, merged, and the output is built by
 * copying only the gaps BETWEEN matches. A matched substring is never copied
 * into the result, so there is no ordering or escaping mistake that could leak
 * one. `__tests__/redaction.test.ts` asserts it against every sample fixture.
 */
export function redactMatches(text: string): string {
  type Span = { start: number; end: number; name: string };
  const spans: Span[] = [];

  // Same shape bound as the sweep — this re-runs every pattern, so an unbounded
  // run costs here too. Offsets are preserved because the elision keeps length
  // parity to within one space per run.
  if (/\S{2001,}/.test(text)) text = boundLongRuns(text);

  for (const p of ALL_PATTERNS) {
    if (p.risk_level === "NONE") continue;
    const re = new RegExp(p.regex.source, p.regex.flags.includes("g") ? p.regex.flags : `${p.regex.flags}g`);
    for (const m of text.matchAll(re)) {
      if (m.index === undefined || m[0].length === 0) continue;
      spans.push({ start: m.index, end: m.index + m[0].length, name: p.name });
    }
  }

  if (spans.length === 0) return text;

  spans.sort((a, b) => a.start - b.start || b.end - a.end);

  let out = "";
  let cursor = 0;
  for (const s of spans) {
    if (s.start < cursor) continue; // overlapped by an earlier, wider span
    out += text.slice(cursor, s.start); // gap only — never the match itself
    out += `[REDACTED: ${s.name}]`;
    cursor = s.end;
  }
  out += text.slice(cursor);
  return out;
}

/* ─────────────────────────── the scan ─────────────────────────── */

const RISK_RANK: Record<RiskLevel, number> = {
  CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, NONE: 0,
};

function worstRisk(findings: SnapshotFinding[]): RiskLevel {
  return findings.reduce<RiskLevel>(
    (worst, f) => (RISK_RANK[f.risk] > RISK_RANK[worst] ? f.risk : worst),
    "NONE",
  );
}

/**
 * Scan text with every local engine, including inside encoded spans.
 *
 * Never throws. A scanner that crashes on hostile input is worse than one that
 * reports nothing, because the user cannot tell the difference from a clean
 * result — so every decode is individually guarded and the sweep always returns
 * a well-formed result.
 */
export function scanLocal(text: string): LocalScanResult {
  const started = typeof performance !== "undefined" ? performance.now() : 0;

  const empty = (rejected?: LocalScanResult["rejected"]): LocalScanResult => ({
    summary: summarizeFindings([]),
    findings: [],
    coverage: [],
    perPrompt: [],
    redacted: "",
    patternsChecked: ALL_PATTERNS.length,
    scanMs: 0,
    ...(rejected ? { rejected } : {}),
  });

  if (text.length > MAX_INPUT_CHARS) {
    return empty({ reason: "too_large", chars: text.length, limit: MAX_INPUT_CHARS });
  }
  if (text.trim().length === 0) return empty();

  // Plain text first, then anything hidden inside an encoded span.
  const byName = new Map<string, LocalFinding>();
  const add = (findings: SnapshotFinding[], via: FoundVia) => {
    for (const f of findings) {
      const existing = byName.get(f.patternName);
      if (existing) {
        existing.count += f.count;
        // "plain" wins as the provenance label: if it is visible in the paste,
        // saying it was "found inside base64" would be misleading.
        if (via === "plain") existing.foundVia = "plain";
      } else {
        byName.set(f.patternName, { ...f, foundVia: via });
      }
    }
  };

  // Plain sweep runs over the shape-bounded text; decoding still sees the
  // original, so a long base64 blob is decoded rather than regex-swept.
  add(scanForSnapshot(boundLongRuns(text)), "plain");
  for (const variant of decodeVariants(text)) {
    add(scanForSnapshot(variant.text), variant.via);
  }

  const findings = [...byName.values()].sort(
    (a, b) => RISK_RANK[b.risk] - RISK_RANK[a.risk] || b.count - a.count,
  );

  // Per-category coverage — a real mapping off RuleCategory, not an invented
  // pattern→engine table. Inventing one would be a fabricated metric.
  const byCategory = new Map<RuleCategory, CategoryCoverage>();
  for (const f of findings) {
    const c = byCategory.get(f.category);
    if (c) {
      c.matched += 1;
      c.occurrences += f.count;
    } else {
      byCategory.set(f.category, {
        category: f.category,
        label: CATEGORY_LABEL[f.category],
        matched: 1,
        occurrences: f.count,
      });
    }
  }

  const perPrompt = splitPrompts(text).map((seg, index) => {
    const segFindings = scanForSnapshot(boundLongRuns(seg));
    return {
      index,
      chars: seg.length,
      findings: segFindings.length,
      worst: worstRisk(segFindings),
    };
  });

  const scanMs = (typeof performance !== "undefined" ? performance.now() : 0) - started;

  return {
    summary: summarizeFindings(findings),
    findings,
    coverage: [...byCategory.values()].sort((a, b) => b.occurrences - a.occurrences),
    perPrompt,
    redacted: redactMatches(text),
    patternsChecked: ALL_PATTERNS.length,
    scanMs,
  };
}
