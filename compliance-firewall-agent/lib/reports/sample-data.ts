import type { ReportData, BlockEventEvidence } from "./pdf-generator";

/**
 * Synthetic-but-representative data for the public sample CMMC AI Risk
 * Assessment Report. `demo: true` watermarks the PDF as a sample; no real
 * customer data is ever involved. This is the asset every RPO/MSP and HIPAA
 * outreach email links to ("here's a sample of the $499 report").
 */
export function buildSampleReportData(now: Date = new Date()): ReportData {
  const end = new Date(now);
  const start = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14-day window

  const blockEvents: BlockEventEvidence[] = [
    {
      timestamp: new Date(start.getTime() + 2 * 86_400_000).toISOString(),
      action: "BLOCKED",
      risk_level: "CRITICAL",
      pattern_name: "CUI — CAGE code + contract number",
      nist_control: "SC.L2-3.13.1",
      control_name: "Monitor and control communications at system boundaries",
      sprs_impact: -5,
      dcsa_reportable: true,
    },
    {
      timestamp: new Date(start.getTime() + 5 * 86_400_000).toISOString(),
      action: "BLOCKED",
      risk_level: "HIGH",
      pattern_name: "PHI — patient name + MRN",
      nist_control: "AC.L2-3.1.3",
      control_name: "Control the flow of CUI in accordance with approved authorizations",
      sprs_impact: -3,
      dcsa_reportable: false,
    },
    {
      timestamp: new Date(start.getTime() + 9 * 86_400_000).toISOString(),
      action: "QUARANTINED",
      risk_level: "HIGH",
      pattern_name: "Secret — cloud API key",
      nist_control: "AU.L2-3.3.1",
      control_name: "Create and retain system audit logs and records",
      sprs_impact: -3,
      dcsa_reportable: false,
    },
    {
      timestamp: new Date(start.getTime() + 12 * 86_400_000).toISOString(),
      action: "BLOCKED",
      risk_level: "MEDIUM",
      pattern_name: "PII — SSN",
      nist_control: "AC.L2-3.1.1",
      control_name: "Limit system access to authorized users",
      sprs_impact: -1,
      dcsa_reportable: false,
    },
  ];

  return {
    organization: "Sample Defense Contractor LLC",
    demo: true,
    generated_at: now.toISOString(),
    summary: {
      period: { start: start.toISOString(), end: end.toISOString() },
      total_events: 4187,
      total_violations: 63,
      violation_rate: 0.015,
      avg_processing_time_ms: 7,
    },
    breakdown: {
      by_risk_level: { CRITICAL: 4, HIGH: 21, MEDIUM: 38, LOW: 0, NONE: 4124 },
      by_category: { CUI: 9, PHI: 14, PII: 22, IP: 6, SECRET: 12 },
      by_action: { BLOCKED: 49, QUARANTINED: 14, ALLOWED: 4124 },
    },
    integrity: {
      merkle_root: null, // demo
      events_with_seeds: 63,
      events_without_seeds: 0,
    },
    sprs_score: { current: 98, baseline: 86 },
    compliance_status: {
      "SC.L2-3.13.1": "Met — AI egress monitored and blocked at the boundary",
      "AC.L2-3.1.3": "Met — CUI flow control enforced on every prompt",
      "AU.L2-3.3.1": "Met — SHA-256 hash-chained audit log retained",
      "AC.L2-3.1.1": "Met — access limited to authorized users",
      "SI.L2-3.14.1": "Met — flaws (data leaks) identified and remediated in <10ms",
    },
    block_events: blockEvents,
  };
}
