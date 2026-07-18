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
import {
  coverBanner,
  sectionTitle as brandSectionTitle,
  stampChrome,
  paragraph,
  disclaimer as brandDisclaimer,
  reportId,
  STEEL,
} from "./pdf-brand";

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

// ─── Palette — HoundShield steel (shared with lib/reports/pdf-brand.ts) ──────
const BRAND = STEEL; // #2B4F6B — replaces the old generic #2563EB blue
const DARK_GREY = "#334155";
const MID_GREY = "#64748B";
const LIGHT_GREY = "#EDF1F6";
const RED = "#B91C1C";
const GREEN = "#047857";
const AMBER = "#B45309";

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

/** One-paragraph executive summary explaining what each artifact is + how to use it. */
const ABOUT_TEXT: Record<ArtifactType, (org: string) => string> = {
  ssp: (org) =>
    `This System Security Plan documents how ${org} implements each of the 110 NIST SP 800-171 ` +
    `Rev 2 security requirements that scope CMMC Level 2. For every control it records the current ` +
    `implementation status and the SPRS point weight at stake, giving your team and a prospective ` +
    `C3PAO one current picture of your control posture. Read it alongside the POA&M, which tracks ` +
    `every requirement not yet fully met.`,
  poam: (org) =>
    `This Plan of Action & Milestones lists every NIST SP 800-171 Rev 2 requirement that ${org} has ` +
    `not yet fully met, ordered by risk so the highest-impact gaps surface first. Each item states ` +
    `the weakness, its SPRS impact, the planned remediation and an effort estimate — the working ` +
    `backlog that moves your SPRS score toward the posture a CMMC Level 2 assessment expects.`,
  evidence: (org) =>
    `This Evidence Pack maps each implemented control to the specific artifacts a C3PAO assessor will ` +
    `ask to see, so ${org} can assemble the assessment package before the formal review rather than ` +
    `during it. Controls marked Met are ready for evidence collection; use the register below as your ` +
    `assessor-preparation checklist.`,
};

function coverPage(doc: jsPDF, type: ArtifactType, input: ArtifactInput): number {
  const meta: Array<[string, string]> = [
    ["Organization", input.orgName],
    ["Framework", `NIST SP 800-171 Rev 2 · CMMC Level ${input.cmmcLevel}`],
    // ASCII hyphen only — U+2212 MINUS is outside jsPDF's WinAnsi font encoding.
    ["SPRS Score", `${input.sprs.total}  (range -203 to +110)`],
    [
      "Assessment",
      `${input.sprs.metCount} met · ${input.sprs.partialCount} partial · ${input.sprs.unmetCount} unmet · ${input.controls.length - input.sprs.assessedCount} not assessed`,
    ],
    ["Prepared", formatDate(input.generatedAt)],
    ["Report ID", reportId(ARTIFACT_META[type].filePrefix, input.orgName, input.generatedAt)],
  ];
  let y = coverBanner(doc, {
    title: ARTIFACT_META[type].title,
    subtitle: "NIST SP 800-171 Rev 2 · CMMC Level 2 self-assessment",
    org: input.orgName,
    meta,
    tag: "Confidential",
  });
  y = brandSectionTitle(doc, y + 2, "About this report");
  y = paragraph(doc, y, ABOUT_TEXT[type](input.orgName));
  return y + 2;
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

const DISCLAIMER_TEXT =
  "This artifact is generated by HoundShield from your organization's own self-assessment data for " +
  "internal planning and C3PAO preparation. It does not constitute an official CMMC assessment or DoD " +
  "certification. Official SPRS scores must be submitted via https://www.sprs.csd.disa.mil/.";

// Local wrappers keep every call site below unchanged while delegating to the
// shared premium brand layer (steel lockup, section tabs, disclaimer card).
function sectionTitle(doc: jsPDF, y: number, text: string): number {
  return brandSectionTitle(doc, y, text);
}

function disclaimer(doc: jsPDF, y: number): void {
  brandDisclaimer(doc, y, DISCLAIMER_TEXT);
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

  // Disclaimer on the final page; running header + website/confidentiality
  // footer stamped on every page by the shared brand layer.
  disclaimer(doc, 262);
  stampChrome(doc, {
    title: ARTIFACT_META[type].title,
    org: input.orgName,
    generatedAt: input.generatedAt,
  });

  return {
    bytes: doc.output("arraybuffer"),
    pageCount: doc.getNumberOfPages(),
    filename: artifactFilename(type, input.orgName, input.generatedAt),
  };
}
