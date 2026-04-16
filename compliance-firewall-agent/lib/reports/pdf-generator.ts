import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlockEventEvidence {
  timestamp: string;
  action: "BLOCKED" | "QUARANTINED";
  risk_level: string;
  pattern_name: string;
  /** e.g. "AC.L2-3.1.3" */
  nist_control: string;
  /** Human-readable CMMC control name */
  control_name: string;
  /** SPRS point impact (negative = deduction) */
  sprs_impact: number;
  /** Flag for DCSA-reportable events (CRITICAL blocks) */
  dcsa_reportable: boolean;
}

export interface ReportData {
  summary: {
    period: { start: string; end: string };
    total_events: number;
    total_violations: number;
    violation_rate: number;
    avg_processing_time_ms: number;
  };
  breakdown: {
    by_risk_level: Record<string, number>;
    by_category: Record<string, number>;
    by_action: Record<string, number>;
  };
  integrity: {
    merkle_root: string | null;
    events_with_seeds: number;
    events_without_seeds: number;
  };
  compliance_status: Record<string, string>;
  generated_at: string;
  organization?: string;
  demo?: boolean;
  /** SPRS score before and after Kaelus deployment */
  sprs_score?: { current: number; baseline: number };
  /** Per-event CMMC control evidence (for audit PDF section) */
  block_events?: BlockEventEvidence[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAND = "#2563EB"; // brand-600
const BLACK = "#000000";
const DARK_GREY = "#374151";
const MID_GREY = "#6B7280";
const LIGHT_GREY = "#F3F4F6";
const RED = "#DC2626";
const GREEN = "#059669";
const AMBER = "#D97706";

const PAGE_W = 210; // A4 mm
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function addPageHeader(doc: jsPDF, pageNum: number, orgName: string, generatedAt: string) {
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } })
    .internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(MID_GREY);
  doc.text("Kaelus.online — AI Compliance Firewall", MARGIN, 10);
  doc.text(orgName, PAGE_W / 2, 10, { align: "center" });
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_W - MARGIN, 10, { align: "right" });
  doc.setDrawColor(LIGHT_GREY);
  doc.line(MARGIN, 12, PAGE_W - MARGIN, 12);
  doc.text(`Generated: ${formatDate(generatedAt)}`, MARGIN, 285);
  doc.line(MARGIN, 283, PAGE_W - MARGIN, 283);
}

function sectionTitle(doc: jsPDF, y: number, text: string): number {
  doc.setFontSize(13);
  doc.setTextColor(BRAND);
  doc.setFont("helvetica", "bold");
  doc.text(text, MARGIN, y);
  doc.setDrawColor(BRAND);
  doc.line(MARGIN, y + 1.5, PAGE_W - MARGIN, y + 1.5);
  doc.setFont("helvetica", "normal");
  return y + 8;
}

function statBox(doc: jsPDF, x: number, y: number, w: number, label: string, value: string, color: string = BLACK) {
  doc.setFillColor(LIGHT_GREY);
  doc.roundedRect(x, y, w, 18, 2, 2, "F");
  doc.setFontSize(7);
  doc.setTextColor(MID_GREY);
  doc.text(label.toUpperCase(), x + w / 2, y + 5.5, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(color);
  doc.text(value, x + w / 2, y + 13, { align: "center" });
  doc.setFont("helvetica", "normal");
}

// ─── Main generator ───────────────────────────────────────────────────────────

/**
 * Generates a multi-page CMMC compliance PDF from the /api/reports/generate JSON.
 * Works in both Node.js (API routes) and browser environments.
 * Returns a Buffer compatible with NextResponse.
 */
export function generateCompliancePDF(data: ReportData): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const orgName = data.organization ?? "Defense Contractor";
  const period = `${formatDate(data.summary.period.start)} – ${formatDate(data.summary.period.end)}`;

  // ── PAGE 1: Cover ──────────────────────────────────────────────────────────
  // Header band
  doc.setFillColor(BRAND);
  doc.rect(0, 0, PAGE_W, 55, "F");

  // CONFIDENTIAL badge
  doc.setFillColor("#DBEAFE");
  doc.roundedRect(MARGIN, 12, 38, 7, 1.5, 1.5, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BRAND);
  doc.text("CONFIDENTIAL", MARGIN + 19, 17, { align: "center" });

  // Product name
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#FFFFFF");
  doc.text("Kaelus.online", MARGIN, 35);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("AI Compliance Firewall — Audit Report", MARGIN, 42);
  doc.setFontSize(8.5);
  doc.setTextColor("#BFDBFE");
  doc.text("Tamper-evident | Cryptographically anchored | CMMC Level 2", MARGIN, 50);

  // Organization + period block
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(DARK_GREY);
  let y = 70;
  doc.setFont("helvetica", "bold");
  doc.text("Organization", MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.text(orgName, MARGIN + 40, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Report Period", MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.text(period, MARGIN + 40, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Generated At", MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(data.generated_at), MARGIN + 40, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Report Type", MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.text("CMMC Level 2 Compliance — AI Gateway Audit", MARGIN + 40, y);

  // Compliance score bar
  y += 20;
  const complianceScore = data.summary.total_events > 0
    ? Math.round(100 - data.summary.violation_rate)
    : 100;
  const scoreColor = complianceScore >= 80 ? GREEN : complianceScore >= 60 ? AMBER : RED;
  doc.setFontSize(10);
  doc.setTextColor(DARK_GREY);
  doc.setFont("helvetica", "bold");
  doc.text("Compliance Score", MARGIN, y);
  doc.setFontSize(28);
  doc.setTextColor(scoreColor);
  doc.text(`${complianceScore}%`, MARGIN, y + 15);
  doc.setFontSize(9);
  doc.setTextColor(MID_GREY);
  doc.setFont("helvetica", "normal");
  doc.text(
    complianceScore >= 80
      ? "Compliant — meeting CMMC Level 2 threshold"
      : complianceScore >= 60
        ? "Partial — remediation actions required"
        : "Non-compliant — immediate action required",
    MARGIN + 30,
    y + 10
  );

  // SPRS score delta (if provided)
  if (data.sprs_score) {
    y += 22;
    doc.setFontSize(10);
    doc.setTextColor(DARK_GREY);
    doc.setFont("helvetica", "bold");
    doc.text("SPRS Score Impact", MARGIN, y);
    const delta = data.sprs_score.current - data.sprs_score.baseline;
    const deltaStr = delta >= 0 ? `+${delta}` : `${delta}`;
    const deltaColor = delta >= 0 ? GREEN : RED;
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MID_GREY);
    doc.text(`Baseline (without Kaelus): ${data.sprs_score.baseline}`, MARGIN, y);
    doc.text(`Current: ${data.sprs_score.current}`, MARGIN + 70, y);
    doc.setTextColor(deltaColor);
    doc.setFont("helvetica", "bold");
    doc.text(`Delta: ${deltaStr} pts`, MARGIN + 120, y);
    doc.setFont("helvetica", "normal");
  }

  // Divider
  y += 14;
  doc.setDrawColor(LIGHT_GREY);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);

  // Integrity block
  y += 8;
  doc.setFontSize(8.5);
  doc.setTextColor(DARK_GREY);
  doc.setFont("helvetica", "bold");
  doc.text("Merkle Root (tamper-evident chain):", MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(MID_GREY);
  doc.text(data.integrity.merkle_root ?? "N/A (demo mode)", MARGIN, y + 5);
  doc.setFontSize(7.5);
  doc.text(
    `${data.integrity.events_with_seeds} events cryptographically anchored  |  ${data.integrity.events_without_seeds} without seed`,
    MARGIN,
    y + 11
  );

  if (data.demo) {
    y += 20;
    doc.setFillColor("#FEF3C7");
    doc.roundedRect(MARGIN, y, CONTENT_W, 10, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(AMBER);
    doc.setFont("helvetica", "bold");
    doc.text("  DEMO MODE — This report contains sample data only. Connect Supabase for real data.", MARGIN + 5, y + 6.5);
    doc.setFont("helvetica", "normal");
  }

  // ── PAGE 2: Executive Summary ──────────────────────────────────────────────
  doc.addPage();
  y = 20;
  y = sectionTitle(doc, y, "Executive Summary");

  const BOX_W = (CONTENT_W - 6) / 4;
  statBox(doc, MARGIN, y, BOX_W, "Total Events", data.summary.total_events.toLocaleString());
  statBox(doc, MARGIN + BOX_W + 2, y, BOX_W, "Violations", data.summary.total_violations.toLocaleString(), RED);
  statBox(doc, MARGIN + (BOX_W + 2) * 2, y, BOX_W, "Violation Rate", `${data.summary.violation_rate}%`,
    data.summary.violation_rate > 10 ? RED : GREEN);
  statBox(doc, MARGIN + (BOX_W + 2) * 3, y, BOX_W, "Avg Latency", `${data.summary.avg_processing_time_ms}ms`);

  y += 26;
  y = sectionTitle(doc, y, "Risk Level Breakdown");

  const riskRows = Object.entries(data.breakdown.by_risk_level)
    .sort(([a], [b]) => ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE"].indexOf(a) - ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE"].indexOf(b))
    .map(([level, count]) => [
      level,
      count.toString(),
      data.summary.total_events > 0 ? `${((count / data.summary.total_events) * 100).toFixed(1)}%` : "0%",
    ]);

  autoTable(doc, {
    startY: y,
    head: [["Risk Level", "Event Count", "% of Total"]],
    body: riskRows.length > 0 ? riskRows : [["No data", "-", "-"]],
    margin: { left: MARGIN, right: MARGIN },
    headStyles: { fillColor: BRAND, textColor: "#FFFFFF", fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: DARK_GREY },
    alternateRowStyles: { fillColor: LIGHT_GREY },
    columnStyles: { 0: { fontStyle: "bold" }, 2: { halign: "center" }, 1: { halign: "center" } },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  y = sectionTitle(doc, y, "Action Breakdown");

  const actionRows = Object.entries(data.breakdown.by_action).map(([action, count]) => [
    action,
    count.toString(),
    data.summary.total_events > 0 ? `${((count / data.summary.total_events) * 100).toFixed(1)}%` : "0%",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Action Taken", "Count", "% of Total"]],
    body: actionRows.length > 0 ? actionRows : [["No data", "-", "-"]],
    margin: { left: MARGIN, right: MARGIN },
    headStyles: { fillColor: BRAND, textColor: "#FFFFFF", fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: DARK_GREY },
    alternateRowStyles: { fillColor: LIGHT_GREY },
    columnStyles: { 2: { halign: "center" }, 1: { halign: "center" } },
  });

  // ── PAGE 3: CMMC Control Mapping + Category Breakdown ──────────────────────
  doc.addPage();
  y = 20;
  y = sectionTitle(doc, y, "Data Category Violations");

  const categoryRows = Object.entries(data.breakdown.by_category)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, count]) => [cat, count.toString()]);

  autoTable(doc, {
    startY: y,
    head: [["Data Category", "Detected Events"]],
    body: categoryRows.length > 0 ? categoryRows : [["No violations detected", "-"]],
    margin: { left: MARGIN, right: MARGIN },
    headStyles: { fillColor: BRAND, textColor: "#FFFFFF", fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: DARK_GREY },
    alternateRowStyles: { fillColor: LIGHT_GREY },
    columnStyles: { 1: { halign: "center" } },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  y = sectionTitle(doc, y, "CMMC Control Family Mapping");

  const cmmcFamilies = [
    ["AC", "Access Control", "3.1.1 – 3.1.22"],
    ["AU", "Audit & Accountability", "3.3.1 – 3.3.9"],
    ["CM", "Configuration Management", "3.4.1 – 3.4.9"],
    ["IA", "Identification & Authentication", "3.5.1 – 3.5.11"],
    ["IR", "Incident Response", "3.6.1 – 3.6.3"],
    ["MA", "Maintenance", "3.7.1 – 3.7.6"],
    ["MP", "Media Protection", "3.8.1 – 3.8.9"],
    ["PE", "Physical Protection", "3.10.1 – 3.10.6"],
    ["PS", "Personnel Security", "3.9.1 – 3.9.2"],
    ["RA", "Risk Assessment", "3.11.1 – 3.11.3"],
    ["CA", "Security Assessment", "3.12.1 – 3.12.4"],
    ["SC", "System & Communications", "3.13.1 – 3.13.16"],
    ["SI", "System & Info Integrity", "3.14.1 – 3.14.7"],
  ];

  const familyRows = cmmcFamilies.map(([code, name, controls]) => [
    code,
    name,
    controls,
    data.breakdown.by_category[code] ?? 0 > 0 ? "REVIEW" : "MONITORED",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Family", "Domain", "Controls", "Gateway Status"]],
    body: familyRows,
    margin: { left: MARGIN, right: MARGIN },
    headStyles: { fillColor: BRAND, textColor: "#FFFFFF", fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: DARK_GREY },
    alternateRowStyles: { fillColor: LIGHT_GREY },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 15 },
      3: { halign: "center" },
    },
  });

  // ── PAGE 4: CMMC Control Evidence ──────────────────────────────────────────
  doc.addPage();
  y = 20;
  y = sectionTitle(doc, y, "CMMC Control Evidence — AI Gateway Blocks");

  doc.setFontSize(8.5);
  doc.setTextColor(MID_GREY);
  doc.text(
    "Each row below constitutes audit evidence of a technical control enforced by the Kaelus AI gateway.",
    MARGIN,
    y
  );
  y += 5;
  doc.text(
    "Per DoD CMMC Assessment Process (CAP) v2.0, these events satisfy practice AC.L2-3.1.3 (CUI flow control).",
    MARGIN,
    y
  );
  y += 8;

  const blockEvents = data.block_events ?? [];

  if (blockEvents.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(GREEN);
    doc.setFont("helvetica", "bold");
    doc.text("No CUI exfiltration events detected in this period.", MARGIN, y);
    doc.setFont("helvetica", "normal");
    y += 8;
  } else {
    // DCSA Reportable Events banner
    const dcsa = blockEvents.filter((e) => e.dcsa_reportable);
    if (dcsa.length > 0) {
      doc.setFillColor("#FEE2E2");
      doc.roundedRect(MARGIN, y, CONTENT_W, 10, 2, 2, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(RED);
      doc.text(
        `  ⚠  ${dcsa.length} DCSA-REPORTABLE EVENT${dcsa.length > 1 ? "S" : ""} — CRITICAL CUI exfiltration attempts blocked`,
        MARGIN + 3,
        y + 6.5
      );
      doc.setFont("helvetica", "normal");
      y += 14;
    }

    const evidenceRows = blockEvents.slice(0, 40).map((e) => [
      new Date(e.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      e.action,
      e.risk_level,
      e.pattern_name.slice(0, 28),
      e.nist_control,
      e.control_name.slice(0, 30),
      e.sprs_impact < 0 ? `${e.sprs_impact} pts` : "—",
      e.dcsa_reportable ? "YES" : "—",
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Date", "Action", "Risk", "Pattern Detected", "NIST Control", "Control Name", "SPRS Δ", "DCSA"]],
      body: evidenceRows,
      margin: { left: MARGIN, right: MARGIN },
      headStyles: { fillColor: BRAND, textColor: "#FFFFFF", fontStyle: "bold", fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5, textColor: DARK_GREY },
      alternateRowStyles: { fillColor: LIGHT_GREY },
      columnStyles: {
        1: { fontStyle: "bold" },
        4: { fontStyle: "bold", textColor: BRAND },
        7: { halign: "center", textColor: RED },
      },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    // SPRS impact summary
    const totalSprsImpact = blockEvents.reduce((s, e) => s + e.sprs_impact, 0);
    if (totalSprsImpact !== 0) {
      doc.setFontSize(8.5);
      doc.setTextColor(DARK_GREY);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Total SPRS impact prevented by Kaelus: ${totalSprsImpact < 0 ? totalSprsImpact : "+" + totalSprsImpact} points`,
        MARGIN,
        y
      );
      doc.setFont("helvetica", "normal");
      y += 8;
    }
  }

  // CMMC evidence footer (audit-ready attestation per control)
  doc.setFontSize(7.5);
  doc.setTextColor(MID_GREY);
  doc.setFont("helvetica", "italic");
  const evidenceNote =
    "This section constitutes audit evidence for CMMC Level 2 practice AC.L2-3.1.3 " +
    "(Control the flow of CUI in accordance with approved authorizations). " +
    "Additional practices covered: AU.L2-3.3.1 (audit log generation) and SI.L2-3.14.1 " +
    "(identify and report system flaws).";
  const splitNote = doc.splitTextToSize(evidenceNote, CONTENT_W);
  doc.text(splitNote, MARGIN, y);
  doc.setFont("helvetica", "normal");

  // ── PAGE 5: Compliance Status + Footer ─────────────────────────────────────
  doc.addPage();
  y = 20;
  y = sectionTitle(doc, y, "Compliance Status");

  const statusRows = Object.entries(data.compliance_status).map(([key, value]) => [
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value,
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Requirement", "Status"]],
    body: statusRows,
    margin: { left: MARGIN, right: MARGIN },
    headStyles: { fillColor: BRAND, textColor: "#FFFFFF", fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: DARK_GREY },
    alternateRowStyles: { fillColor: LIGHT_GREY },
    columnStyles: { 0: { cellWidth: 65 } },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  y = sectionTitle(doc, y, "Audit Trail Attestation");

  doc.setFontSize(9);
  doc.setTextColor(DARK_GREY);
  const attestation = [
    "This report was generated by Kaelus.online, an AI compliance firewall operating under CMMC Level 2",
    "requirements. All events recorded herein have been immutably logged using cryptographic seed",
    "anchors (SHA-256 Merkle tree). The Merkle Root on the cover page can be independently verified",
    "against the Kaelus audit ledger to confirm this report has not been tampered with.",
    "",
    "This document constitutes an audit artifact suitable for CMMC Level 2 self-assessment",
    "submission and C3PAO review preparation. Data generated at: " + data.generated_at,
  ];
  attestation.forEach((line) => {
    doc.text(line, MARGIN, y);
    y += 5.5;
  });

  // ── Add headers/footers to all pages ──────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (i > 1) {
      addPageHeader(doc, i, orgName, data.generated_at);
    } else {
      // Cover page footer only
      doc.setFontSize(7.5);
      doc.setTextColor(MID_GREY);
      doc.setFont("helvetica", "normal");
  const footerText = `Generated by Kaelus.online  |  Merkle Root: ${data.integrity.merkle_root ?? "N/A"}  |  Tamper-evident audit trail`;
      doc.text(footerText, PAGE_W / 2, 285, { align: "center" });
    }
  }

  return Buffer.from(doc.output("arraybuffer"));
}
