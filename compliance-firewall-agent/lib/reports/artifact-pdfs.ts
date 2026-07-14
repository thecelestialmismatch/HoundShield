import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  AssessmentResponse,
  ControlStatus,
  NISTControl,
  SPRSScore,
} from "@/lib/shieldready/types";
import { CONTROL_FAMILIES } from "@/lib/shieldready/controls/families";
import { getRemediationPriorities } from "@/lib/shieldready/scoring";

/**
 * The three downloadable compliance artifacts on the console Reports tab:
 *
 *   ssp      — System Security Plan (self-assessment edition): full 110-control
 *              inventory with per-control status and SPRS impact.
 *   poam     — Plan of Action & Milestones: every open (non-MET) control with
 *              its weakness, priority, planned remediation and effort estimate.
 *   evidence — C3PAO Evidence Pack: what an assessor will ask to see for each
 *              implemented control, plus the assessment attestation.
 *
 * All three are generated FROM THE OPERATOR'S OWN local assessment data — the
 * assessment lives client-side by design (privacy boundary: it never reaches
 * our servers), so the PDFs are built in the browser too. Pure functions,
 * jsPDF works identically in Node, so every generator is unit-testable.
 *
 * Honest labeling: these are SELF-ASSESSMENT artifacts for C3PAO preparation,
 * never presented as an official CMMC certification (see disclaimer block).
 */

export type ArtifactType = "ssp" | "poam" | "evidence";

export interface ArtifactInput {
  orgName: string;
  cmmcLevel: 1 | 2;
  /** ISO timestamp the artifact is generated at. */
  generatedAt: string;
  sprs: SPRSScore;
  controls: NISTControl[];
  responses: AssessmentResponse[];
}

export interface GeneratedArtifact {
  bytes: ArrayBuffer;
  pageCount: number;
  filename: string;
}

export const ARTIFACT_META: Record<ArtifactType, { title: string; filePrefix: string }> = {
  ssp: { title: "System Security Plan", filePrefix: "SSP" },
  poam: { title: "Plan of Action & Milestones", filePrefix: "POAM" },
  evidence: { title: "C3PAO Evidence Pack", filePrefix: "Evidence" },
};

// ─── Palette (matches lib/reports/pdf-generator.ts) ──────────────────────────
const BRAND = "#2563EB";
const DARK_GREY = "#374151";
const MID_GREY = "#6B7280";
const LIGHT_GREY = "#F3F4F6";
const RED = "#DC2626";
const GREEN = "#059669";
const AMBER = "#D97706";

const PAGE_W = 210; // A4 mm
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Pure row builders (the tested contract) ─────────────────────────────────

function statusFor(controlId: string, responses: AssessmentResponse[]): ControlStatus {
  return responses.find((r) => r.controlId === controlId)?.status ?? "NOT_ASSESSED";
}

const STATUS_LABEL: Record<ControlStatus, string> = {
  MET: "Met",
  PARTIAL: "Partially met",
  UNMET: "Not met",
  NOT_ASSESSED: "Not assessed",
};

/** SSP inventory: one row per control in scope — id, title, status, SPRS weight. */
export function buildSspRows(input: ArtifactInput): string[][] {
  return input.controls.map((c) => [
    c.id,
    c.title,
    c.familyName,
    STATUS_LABEL[statusFor(c.id, input.responses)],
    `${c.sprsDeduction}`,
  ]);
}

/** POA&M: every open (non-MET) control, most impactful first. */
export function buildPoamRows(input: ArtifactInput): string[][] {
  return getRemediationPriorities(input.controls, input.responses).map((c) => [
    c.id,
    c.title,
    c.status === "PARTIAL" ? "In progress" : "Open",
    c.riskPriority,
    `${c.deductionApplied}`,
    c.remediationSteps[0] ?? "Define remediation plan",
    `${c.estimatedHours}h`,
  ]);
}

/** Evidence pack: implemented controls with what a C3PAO will ask to see. */
export function buildEvidenceRows(input: ArtifactInput): string[][] {
  return input.controls
    .filter((c) => statusFor(c.id, input.responses) === "MET")
    .map((c) => [c.id, c.title, c.evidenceRequired.slice(0, 2).join("; ") || "Implementation record"]);
}

/** Total estimated remediation effort across open controls, in hours. */
export function totalOpenHours(input: ArtifactInput): number {
  return getRemediationPriorities(input.controls, input.responses).reduce(
    (sum, c) => sum + (c.estimatedHours || 0),
    0,
  );
}

/** Filesystem-safe filename: "SSP_Vector-Defense_2026-07-14.pdf". */
export function artifactFilename(type: ArtifactType, orgName: string, generatedAt: string): string {
  const org = orgName.trim().replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "Organization";
  return `${ARTIFACT_META[type].filePrefix}_${org}_${generatedAt.slice(0, 10)}.pdf`;
}

// ─── Shared layout helpers ────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return iso;
  }
}

function coverPage(doc: jsPDF, type: ArtifactType, input: ArtifactInput): number {
  doc.setFillColor(BRAND);
  doc.rect(0, 0, PAGE_W, 52, "F");
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#FFFFFF");
  doc.text("HoundShield", MARGIN, 24);
  doc.setFontSize(13);
  doc.text(ARTIFACT_META[type].title, MARGIN, 34);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#BFDBFE");
  doc.text("NIST SP 800-171 Rev 2 · CMMC Level 2 self-assessment artifact", MARGIN, 44);

  let y = 66;
  const kv = (k: string, v: string) => {
    doc.setFontSize(10);
    doc.setTextColor(DARK_GREY);
    doc.setFont("helvetica", "bold");
    doc.text(k, MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.text(v, MARGIN + 42, y);
    y += 7;
  };
  kv("Organization", input.orgName);
  kv("Generated", formatDate(input.generatedAt));
  kv("CMMC Level", String(input.cmmcLevel));
  // ASCII hyphen only — U+2212 MINUS is outside jsPDF's WinAnsi font encoding
  // and prints as a stray quote character.
  kv("SPRS Score", `${input.sprs.total} (range -203 to +110)`);
  kv(
    "Assessment",
    `${input.sprs.metCount} met · ${input.sprs.partialCount} partial · ${input.sprs.unmetCount} unmet · ${input.controls.length - input.sprs.assessedCount} not assessed`,
  );
  return y + 4;
}

function familyTable(doc: jsPDF, y: number, input: ArtifactInput): number {
  autoTable(doc, {
    startY: y,
    head: [["Family", "Domain", "Met", "Partial", "Unmet", "Score"]],
    body: CONTROL_FAMILIES.map((f) => {
      const s = input.sprs.byFamily[f.code];
      return [f.code, f.name, `${s?.met ?? 0}`, `${s?.partial ?? 0}`, `${s?.unmet ?? 0}`, `${s?.score ?? 0}`];
    }),
    margin: { left: MARGIN, right: MARGIN },
    headStyles: { fillColor: BRAND, textColor: "#FFFFFF", fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: DARK_GREY },
    alternateRowStyles: { fillColor: LIGHT_GREY },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 16 }, 2: { halign: "center" }, 3: { halign: "center" }, 4: { halign: "center" }, 5: { halign: "center" } },
  });
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
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

function disclaimer(doc: jsPDF, y: number): void {
  const text =
    "This artifact is generated by HoundShield from your organization's own self-assessment data for " +
    "internal planning and C3PAO preparation. It does not constitute an official CMMC assessment or DoD " +
    "certification. Official SPRS scores must be submitted via https://www.sprs.csd.disa.mil/.";
  doc.setFontSize(7.5);
  doc.setTextColor(MID_GREY);
  doc.setFont("helvetica", "italic");
  doc.text(doc.splitTextToSize(text, CONTENT_W), MARGIN, y);
  doc.setFont("helvetica", "normal");
}

function stampHeaders(doc: jsPDF, input: ArtifactInput, title: string): void {
  const pages = doc.getNumberOfPages();
  for (let i = 2; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(MID_GREY);
    doc.text(`HoundShield — ${title}`, MARGIN, 10);
    doc.text(input.orgName, PAGE_W / 2, 10, { align: "center" });
    doc.text(`Page ${i} of ${pages}`, PAGE_W - MARGIN, 10, { align: "right" });
    doc.setDrawColor(LIGHT_GREY);
    doc.line(MARGIN, 12, PAGE_W - MARGIN, 12);
  }
}

// ─── The generator ────────────────────────────────────────────────────────────

export function generateArtifactPdf(type: ArtifactType, input: ArtifactInput): GeneratedArtifact {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = coverPage(doc, type, input);

  if (type === "ssp") {
    y = sectionTitle(doc, y + 4, "Control Family Summary");
    familyTable(doc, y, input);
    doc.addPage();
    y = sectionTitle(doc, 20, "Control Inventory — NIST SP 800-171 Rev 2");
    autoTable(doc, {
      startY: y,
      head: [["Control", "Requirement", "Family", "Status", "SPRS wt."]],
      body: buildSspRows(input),
      margin: { left: MARGIN, right: MARGIN, top: 16 },
      headStyles: { fillColor: BRAND, textColor: "#FFFFFF", fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: DARK_GREY },
      alternateRowStyles: { fillColor: LIGHT_GREY },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 20 }, 3: { cellWidth: 24 }, 4: { halign: "center", cellWidth: 16 } },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 3) {
          const v = String(data.cell.raw);
          data.cell.styles.textColor = v === "Met" ? GREEN : v === "Partially met" ? AMBER : v === "Not met" ? RED : MID_GREY;
          data.cell.styles.fontStyle = "bold";
        }
      },
    });
  }

  if (type === "poam") {
    const rows = buildPoamRows(input);
    y = sectionTitle(doc, y + 4, "Open Items — Most Impactful First");
    if (rows.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(GREEN);
      doc.setFont("helvetica", "bold");
      doc.text("No open items — every assessed control is met.", MARGIN, y + 2);
      doc.setFont("helvetica", "normal");
    } else {
      doc.setFontSize(9);
      doc.setTextColor(DARK_GREY);
      doc.text(
        `${rows.length} open item${rows.length === 1 ? "" : "s"} · estimated total effort ${totalOpenHours(input)}h`,
        MARGIN,
        y,
      );
      autoTable(doc, {
        startY: y + 4,
        // "SPRS" not "SPRS Δ" — Greek delta is outside WinAnsi and misprints.
        head: [["Control", "Weakness", "Status", "Priority", "SPRS", "Planned remediation", "Est."]],
        body: rows,
        margin: { left: MARGIN, right: MARGIN, top: 16 },
        headStyles: { fillColor: BRAND, textColor: "#FFFFFF", fontStyle: "bold", fontSize: 7.5 },
        bodyStyles: { fontSize: 7, textColor: DARK_GREY },
        alternateRowStyles: { fillColor: LIGHT_GREY },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 18 },
          2: { cellWidth: 18 },
          3: { cellWidth: 17 },
          4: { halign: "center", cellWidth: 13, textColor: RED },
          6: { halign: "center", cellWidth: 11 },
        },
      });
    }
  }

  if (type === "evidence") {
    const rows = buildEvidenceRows(input);
    y = sectionTitle(doc, y + 4, "Control Family Summary");
    y = familyTable(doc, y, input);
    doc.addPage();
    y = sectionTitle(doc, 20, "Evidence Register — Implemented Controls");
    if (rows.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(AMBER);
      doc.text("No controls marked Met yet — complete the assessment to build your evidence register.", MARGIN, y + 2);
    } else {
      autoTable(doc, {
        startY: y,
        head: [["Control", "Requirement", "Evidence a C3PAO will ask to see"]],
        body: rows,
        margin: { left: MARGIN, right: MARGIN, top: 16 },
        headStyles: { fillColor: BRAND, textColor: "#FFFFFF", fontStyle: "bold", fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: DARK_GREY },
        alternateRowStyles: { fillColor: LIGHT_GREY },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 20 } },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    y = sectionTitle(doc, y, "Attestation");
    doc.setFontSize(9);
    doc.setTextColor(DARK_GREY);
    const attestation =
      `This evidence register reflects ${input.orgName}'s NIST SP 800-171 Rev 2 self-assessment as of ` +
      `${formatDate(input.generatedAt)} (SPRS ${input.sprs.total}). It is formatted for C3PAO review preparation; ` +
      "supporting artifacts listed per control should be collected before a formal assessment.";
    doc.text(doc.splitTextToSize(attestation, CONTENT_W), MARGIN, y);
  }

  // Disclaimer on the final page, headers on every page after the cover.
  disclaimer(doc, 280);
  stampHeaders(doc, input, ARTIFACT_META[type].title);

  return {
    bytes: doc.output("arraybuffer"),
    pageCount: doc.getNumberOfPages(),
    filename: artifactFilename(type, input.orgName, input.generatedAt),
  };
}
