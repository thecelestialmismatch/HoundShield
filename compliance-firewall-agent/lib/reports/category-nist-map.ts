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

/**
 * Remediation guidance per data category, shown beside each finding and in the
 * demo. Keyed by CATEGORY rather than by individual pattern for a reason: the
 * engine ships 56 patterns and grows, so per-pattern copy would rot the moment
 * a pattern is added. Category is the axis the NIST control already hangs off,
 * so guidance and control stay in step by construction.
 *
 * Ported from the remediation tips that used to live in the demo page's own
 * 9-pattern scanner. That scanner was deleted because it duplicated — and
 * understated — the real engine on the same page; this content was the one part
 * worth keeping, so it moved here rather than being thrown away with it.
 */
export interface CategoryRemediation {
  /** What goes wrong if this reaches a third-party model. */
  impact: string;
  /** Something the reader can do today. */
  quickFix: string;
  /** The control that stops it recurring. */
  permanentFix: string;
}

export const CATEGORY_REMEDIATION: Record<RuleCategory, CategoryRemediation> = {
  IP: {
    impact:
      "Controlled technical data and credentials in a third-party prompt leave your control boundary. For a DoD contractor that is a DFARS 252.204-7012 exposure with no audit trail to show an assessor.",
    quickFix:
      "Rotate any exposed key immediately, and strip CUI markings, CAGE codes and contract numbers before pasting. Never paste a key to test whether it is still valid.",
    permanentFix:
      "Route AI traffic through an inline proxy that blocks the request before it leaves the network, and keep a hash-chained record of every block as evidence.",
  },
  HIPAA_PHI: {
    impact:
      "PHI sent to a general-purpose model is a disclosure to a party with no BAA. ChatGPT is not HIPAA-compliant without one (only Enterprise/API carry a BAA), so the paste itself is the reportable event.",
    quickFix:
      "De-identify before pasting — remove names, dates, MRNs and SSNs. A summary written without the identifiers usually gets the same answer.",
    permanentFix:
      "Enforce de-identification at the gateway rather than by policy memo, and log each intercepted disclosure so a Privacy Officer can evidence the control.",
  },
  PII: {
    impact:
      "Names, SSNs, dates of birth, emails and card numbers are regulated identifiers. Exposure drives breach-notification duties, and card data additionally puts PCI-DSS scope on a system you never intended to bring in scope.",
    quickFix:
      "Tokenize or mask identifiers before the prompt — replace with placeholders such as [SSN] or j***@company.com.",
    permanentFix:
      "Apply tokenization at the boundary so masking does not depend on each person remembering, and alert on repeat offenders.",
  },
  FINANCIAL: {
    impact:
      "Account numbers, routing numbers and revenue figures in a prompt become third-party retained data, and the paste is invisible to the audit logging your framework requires.",
    quickFix:
      "Replace real figures with representative ones — a model reasons the same way about $10M as about your actual number.",
    permanentFix:
      "Create and retain audit records for AI egress the same way you do for any other system that touches financial data.",
  },
  STRATEGIC: {
    impact:
      "M&A terms, pricing strategy and roadmap detail are trade secrets. Disclosure to a third party can weaken trade-secret protection, which depends on demonstrating reasonable steps to keep the information secret.",
    quickFix:
      "Anonymize the deal — drop counterparty names and real numbers before asking for help with the wording.",
    permanentFix:
      "Encrypt or block strategic content in transit, and keep the block record — that log is itself the evidence of reasonable steps.",
  },
};
