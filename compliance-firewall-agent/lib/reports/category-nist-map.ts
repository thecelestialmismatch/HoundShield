import type { RuleCategory, RiskLevel, RuleAction } from "@/lib/supabase/types";
import type { BlockEventEvidence } from "./pdf-generator";

/**
 * Canonical mapping from a detection category to the NIST 800-171 Rev 2 /
 * CMMC Level 2 control it implicates, plus the SPRS weighting per risk level.
 *
 * This is the single source of truth for "which control does a finding map to"
 * so the interactive in-browser snapshot (`snapshot-from-scan.ts`) and any other
 * report builder produce consistent, defensible control references. Control
 * choices align with the hand-authored public sample (`sample-data.ts`):
 * CUI/IP → boundary comms, PHI → CUI flow, PII → access limits,
 * secrets/financial → audit logging.
 */

export interface NistControl {
  /** e.g. "SC.L2-3.13.1" */
  control: string;
  /** Human-readable CMMC control name */
  name: string;
}

export const CATEGORY_NIST_MAP: Record<RuleCategory, NistControl> = {
  IP: {
    control: "SC.L2-3.13.1",
    name: "Monitor and control communications at system boundaries",
  },
  HIPAA_PHI: {
    control: "AC.L2-3.1.3",
    name: "Control the flow of CUI in accordance with approved authorizations",
  },
  PII: {
    control: "AC.L2-3.1.1",
    name: "Limit system access to authorized users",
  },
  FINANCIAL: {
    control: "AU.L2-3.3.1",
    name: "Create and retain system audit logs and records",
  },
  STRATEGIC: {
    control: "SC.L2-3.13.8",
    name: "Use cryptography to prevent unauthorized disclosure of CUI in transit",
  },
};

/** Human-readable label for a data category, for on-screen + PDF display. */
export const CATEGORY_LABEL: Record<RuleCategory, string> = {
  IP: "CUI / IP",
  HIPAA_PHI: "PHI",
  PII: "PII",
  FINANCIAL: "Secrets / Financial",
  STRATEGIC: "Strategic",
};

/**
 * SPRS point impact per risk level. Negative = deduction against the 110-point
 * NIST 800-171 self-assessment score. Matches the sample report weighting
 * (CRITICAL −5, HIGH −3, MEDIUM −1).
 */
export function sprsImpactForRisk(risk: RiskLevel): number {
  switch (risk) {
    case "CRITICAL":
      return -5;
    case "HIGH":
      return -3;
    case "MEDIUM":
      return -1;
    default:
      return 0;
  }
}

/**
 * A finding is DCSA-reportable when it is a CRITICAL exposure of controlled
 * defense information (CUI / ITAR / contract data → the IP category). A public
 * AI paste of that class is the kind of event a defense contractor must report.
 */
export function isDcsaReportable(category: RuleCategory, risk: RiskLevel): boolean {
  return risk === "CRITICAL" && category === "IP";
}

/** Map a detection rule action to the audit action label used in the report. */
export function actionLabel(action: RuleAction): "BLOCKED" | "QUARANTINED" {
  // BLOCK → BLOCKED; everything else that is still a violation (QUARANTINE / WARN)
  // is surfaced as QUARANTINED. ALLOW findings are not violations and never reach here.
  return action === "BLOCK" ? "BLOCKED" : "QUARANTINED";
}

/** Shape of a single detection surfaced by the local scan. */
export interface SnapshotFinding {
  patternName: string;
  category: RuleCategory;
  risk: RiskLevel;
  action: RuleAction;
  /** Number of times this pattern matched the pasted text. */
  count: number;
}

/**
 * Convert a scan finding into a per-event evidence row for the PDF. Carries the
 * pattern NAME and control mapping only — never the matched substring — so the
 * generated preview contains no raw pasted content.
 */
export function blockEventFromFinding(
  finding: SnapshotFinding,
  timestamp: string
): BlockEventEvidence {
  const nist = CATEGORY_NIST_MAP[finding.category];
  return {
    timestamp,
    action: actionLabel(finding.action),
    risk_level: finding.risk,
    pattern_name: finding.patternName,
    nist_control: nist.control,
    control_name: nist.name,
    sprs_impact: sprsImpactForRisk(finding.risk),
    dcsa_reportable: isDcsaReportable(finding.category, finding.risk),
  };
}
