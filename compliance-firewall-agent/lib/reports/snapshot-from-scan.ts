import type { RiskLevel, RuleAction } from "@/lib/supabase/types";
import { BUILTIN_PATTERNS, type DetectionPattern } from "@/lib/classifier/patterns";
import { CMMC_PATTERNS } from "@/lib/classifier/cmmc-patterns";
import { HIPAA_PATTERNS } from "@/lib/classifier/hipaa-patterns";
import type { ReportData } from "./pdf-generator";
import {
  CATEGORY_NIST_MAP,
  blockEventFromFinding,
  type SnapshotFinding,
} from "./category-nist-map";

/**
 * In-browser "Instant AI Risk Snapshot" engine.
 *
 * Scans pasted text with the SAME local pattern engines the product uses
 * (`BUILTIN_PATTERNS` + `CMMC_PATTERNS` + `HIPAA_PATTERNS` — all pure regex, no
 * network, no cloud), then shapes the findings into a `ReportData` for a
 * PREVIEW snapshot PDF. Everything here runs client-side: the pasted text never
 * leaves the browser, which is both the honest implementation and a live proof
 * of the core "nothing leaves your network" claim.
 *
 * Only `risk-engine.ts` pulls the cloud (Gemini) scanner — it is deliberately
 * NOT imported here so the client bundle stays local-only.
 */

export type { SnapshotFinding } from "./category-nist-map";

// The local engines, combined once. Type-only import of RuleCategory etc. is
// erased at build, so this pulls no server/supabase runtime into the bundle.
const LOCAL_ENGINES: DetectionPattern[] = [
  ...BUILTIN_PATTERNS,
  ...CMMC_PATTERNS,
  ...HIPAA_PATTERNS,
];

const RISK_RANK: Record<RiskLevel, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  NONE: 0,
};

const ACTION_RANK: Record<RuleAction, number> = {
  BLOCK: 3,
  QUARANTINE: 2,
  WARN: 1,
  ALLOW: 0,
};

/** Count non-overlapping matches of a pattern in `text` (reset shared lastIndex). */
function countMatches(pattern: DetectionPattern, text: string): number {
  pattern.regex.lastIndex = 0;
  const m = text.match(pattern.regex);
  return m ? m.length : 0;
}

/**
 * Scan a single string and return one finding per pattern that matched
 * (deduped by pattern name; counts summed). Findings carry the pattern NAME and
 * classification only — never the matched substring.
 */
export function scanForSnapshot(text: string): SnapshotFinding[] {
  const byName = new Map<string, SnapshotFinding>();

  for (const pattern of LOCAL_ENGINES) {
    if (pattern.risk_level === "NONE") continue;
    const count = countMatches(pattern, text);
    if (count === 0) continue;

    const existing = byName.get(pattern.name);
    if (existing) {
      existing.count += count;
    } else {
      byName.set(pattern.name, {
        patternName: pattern.name,
        category: pattern.category,
        risk: pattern.risk_level,
        action: pattern.action,
        count,
      });
    }
  }

  return [...byName.values()].sort(
    (a, b) => RISK_RANK[b.risk] - RISK_RANK[a.risk] || b.count - a.count
  );
}

/** Split a paste into prompt-like segments (blank-line separated). */
export function splitPrompts(text: string): string[] {
  const segments = text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (segments.length > 0) return segments;
  const single = text.trim();
  return single ? [single] : [];
}

export interface SnapshotOptions {
  organization?: string;
  /** Real measured local-scan time (ms), surfaced as proof of <10ms local scan. */
  scanMs?: number;
  now?: Date;
}

/**
 * Build the `ReportData` for a preview snapshot from pasted text.
 *
 * Grain convention matches the signed sample report:
 *  - `by_action` is prompt-grained (one segment → BLOCKED / QUARANTINED / ALLOWED)
 *  - `by_category` / `by_risk_level` / `block_events` are detection-grained
 * so `BLOCKED + QUARANTINED === total_violations` and
 * `+ ALLOWED === total_events`, keeping the numbers internally consistent.
 *
 * Flagged `snapshot: true` so the PDF renderer strips every tamper-evident /
 * Merkle / C3PAO / audit-evidence claim. `sprs_score` is intentionally omitted
 * (a snapshot measures nothing over time — the block-event SPRS sum is labelled
 * "estimated exposure" instead).
 */
export function buildSnapshotReportData(text: string, opts: SnapshotOptions = {}): ReportData {
  const now = opts.now ?? new Date();
  const iso = now.toISOString();
  const segments = splitPrompts(text);

  const allFindings: SnapshotFinding[] = [];
  let blocked = 0;
  let quarantined = 0;
  let clean = 0;

  for (const seg of segments) {
    const findings = scanForSnapshot(seg);
    if (findings.length === 0) {
      clean += 1;
      continue;
    }
    allFindings.push(...findings);
    const worst = findings.reduce(
      (rank, f) => Math.max(rank, ACTION_RANK[f.action]),
      0
    );
    if (worst === ACTION_RANK.BLOCK) blocked += 1;
    else quarantined += 1;
  }

  const totalEvents = segments.length;
  const totalViolations = blocked + quarantined;

  // Detection-grained breakdowns.
  const byRisk: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  for (const f of allFindings) {
    byRisk[f.risk] = (byRisk[f.risk] ?? 0) + f.count;
    const label = CATEGORY_NIST_MAP[f.category] ? f.category : "OTHER";
    byCategory[label] = (byCategory[label] ?? 0) + f.count;
  }

  // One evidence row per distinct finding, staggered timestamps within "now".
  const blockEvents = allFindings.map((f, i) =>
    blockEventFromFinding(f, new Date(now.getTime() - i * 1000).toISOString())
  );

  // Compliance status: the distinct controls the findings implicate.
  const complianceStatus: Record<string, string> = {};
  for (const f of allFindings) {
    const control = CATEGORY_NIST_MAP[f.category].control;
    complianceStatus[control] =
      "Exposure detected — the signed 14-day report shows this control enforced";
  }
  if (Object.keys(complianceStatus).length === 0) {
    complianceStatus["No sensitive data detected"] =
      "Clean — nothing in this paste would have violated a control";
  }

  const violationRate =
    totalEvents > 0 ? Math.round((totalViolations / totalEvents) * 100) : 0;

  return {
    organization: opts.organization?.trim() || "Your organization (preview)",
    snapshot: true,
    demo: false,
    generated_at: iso,
    summary: {
      period: { start: iso, end: iso },
      total_events: totalEvents,
      total_violations: totalViolations,
      violation_rate: violationRate,
      avg_processing_time_ms:
        typeof opts.scanMs === "number" ? Math.max(0, Math.round(opts.scanMs)) : 0,
    },
    breakdown: {
      by_risk_level: byRisk,
      by_category: byCategory,
      by_action: {
        BLOCKED: blocked,
        QUARANTINED: quarantined,
        ALLOWED: clean,
      },
    },
    integrity: {
      merkle_root: null, // no cryptographic chain in a browser preview
      events_with_seeds: 0,
      events_without_seeds: totalViolations,
    },
    compliance_status: complianceStatus,
    block_events: blockEvents,
  };
}

/** Aggregate counts for the on-screen summary (severity + category rollups). */
export interface SnapshotSummary {
  findings: SnapshotFinding[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  totalMatches: number;
  /** Distinct NIST 800-171 controls implicated. */
  controls: string[];
  estimatedSprsImpact: number;
}

export function summarizeFindings(findings: SnapshotFinding[]): SnapshotSummary {
  let critical = 0;
  let high = 0;
  let medium = 0;
  let totalMatches = 0;
  let estimatedSprsImpact = 0;
  const controls = new Set<string>();

  for (const f of findings) {
    totalMatches += f.count;
    if (f.risk === "CRITICAL") critical += 1;
    else if (f.risk === "HIGH") high += 1;
    else if (f.risk === "MEDIUM") medium += 1;
    controls.add(CATEGORY_NIST_MAP[f.category].control);
    const ev = blockEventFromFinding(f, "1970-01-01T00:00:00.000Z");
    estimatedSprsImpact += ev.sprs_impact;
  }

  return {
    findings,
    criticalCount: critical,
    highCount: high,
    mediumCount: medium,
    totalMatches,
    controls: [...controls],
    estimatedSprsImpact,
  };
}
