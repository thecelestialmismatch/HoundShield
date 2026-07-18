/**
 * pdf-brand — the shared premium look for every HoundShield PDF.
 *
 * One place owns the brand cover, the running header/footer, section titles and
 * body typography, so the compliance report and the SSP/POAM/Evidence artifacts
 * all read like they came from the same company — a real letterhead, not a bare
 * jsPDF dump. Palette is HoundShield steel on white (print-premium), with the
 * site URL and a confidentiality line on every page.
 *
 * Robustness: the fancier primitives (triangle, setLineWidth, GState) are
 * feature-detected, so these helpers render fully under real jsPDF and degrade
 * silently under the unit-test mock in pdf-generator.test.ts — no test needs a
 * bigger mock surface.
 */
import type { jsPDF } from "jspdf";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = jsPDF & Record<string, any>;

export const PAGE_W = 210; // A4 mm
export const PAGE_H = 297;
export const MARGIN = 18;
export const CONTENT_W = PAGE_W - MARGIN * 2;

/* ── Steel palette ────────────────────────────────────────────────────── */
export const INK = "#0B1622"; // near-black steel ink (body headings)
export const STEEL = "#2B4F6B"; // brand-800 — primary
export const STEEL_DEEP = "#132638"; // cover band
export const STEEL_ACCENT = "#3D6A8A"; // brand-700 — badge / accents
export const SKY = "#AACDDC"; // brand-300 — light accents on the band
export const SKY_SOFT = "#DCE9F3";
export const DARK_GREY = "#334155";
export const MID_GREY = "#64748B";
export const LIGHT_GREY = "#EDF1F6";
export const FAINT = "#F6F8FB";
export const WHITE = "#FFFFFF";
export const RED = "#B91C1C";
export const GREEN = "#047857";
export const AMBER = "#B45309";

export const SITE = "houndshield.com";
export const LEGAL_NAME = "HoundShield";

/* ── Small utilities ──────────────────────────────────────────────────── */

export function formatDate(iso: string): string {
  const d = new Date(iso);
  // Never let a bad timestamp print "Invalid Date" on a customer-facing report.
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/** A short, human report id derived from org + date — looks official, is stable. */
export function reportId(prefix: string, org: string, iso: string): string {
  const slug = org.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "ORG";
  const date = iso.slice(0, 10).replace(/-/g, "");
  return `HS-${prefix}-${date}-${slug}`;
}

function setLineWidth(doc: Doc, w: number) {
  if (typeof doc.setLineWidth === "function") doc.setLineWidth(w);
}

/**
 * The HoundShield mark: a steel shield badge with a white "HS" monogram. Drawn
 * from primitives (no embedded image) so it is weightless and works in Node.
 */
export function drawBadge(doc: Doc, x: number, y: number, size = 14, onDark = true) {
  const bg = onDark ? SKY : STEEL;
  const fg = onDark ? STEEL_DEEP : WHITE;
  // Shield: rounded-top rectangle + a pointed base via a triangle when available.
  doc.setFillColor(bg);
  const bodyH = size * 0.72;
  doc.roundedRect(x, y, size, bodyH, 2.4, 2.4, "F");
  if (typeof doc.triangle === "function") {
    doc.triangle(x, y + bodyH - 1, x + size, y + bodyH - 1, x + size / 2, y + size, "F");
  } else {
    doc.rect(x, y + bodyH - 1, size, size * 0.28, "F");
  }
  // Monogram
  doc.setTextColor(fg);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size * 0.5);
  doc.text("HS", x + size / 2, y + bodyH * 0.72, { align: "center" });
}

/* ── Cover ────────────────────────────────────────────────────────────── */

export interface CoverOptions {
  title: string;
  subtitle: string;
  org: string;
  /** Key/value rows shown in the metadata card. */
  meta: Array<[string, string]>;
  /** Small pill on the band, e.g. "CONFIDENTIAL". */
  tag?: string;
}

/** Full-width branded cover header + metadata card. Returns the Y below it. */
export function coverBanner(doc: Doc, opts: CoverOptions): number {
  const bandH = 62;
  // Band
  doc.setFillColor(STEEL_DEEP);
  doc.rect(0, 0, PAGE_W, bandH, "F");
  // Accent rule at the band foot
  doc.setFillColor(SKY);
  doc.rect(0, bandH, PAGE_W, 1.4, "F");

  // Brand lockup
  drawBadge(doc, MARGIN, 12, 15, true);
  doc.setTextColor(WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("HOUNDSHIELD", MARGIN + 20, 19);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(SKY);
  doc.text("AI Compliance Firewall  ·  " + SITE, MARGIN + 20, 25);

  // Confidentiality pill (top-right)
  if (opts.tag) {
    const pillW = 34;
    doc.setFillColor(STEEL_ACCENT);
    doc.roundedRect(PAGE_W - MARGIN - pillW, 12, pillW, 8, 2, 2, "F");
    doc.setTextColor(WHITE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(opts.tag.toUpperCase(), PAGE_W - MARGIN - pillW / 2, 17.2, { align: "center" });
  }

  // Document title
  doc.setTextColor(WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(23);
  doc.text(opts.title, MARGIN, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(SKY);
  doc.text(opts.subtitle, MARGIN, 53);

  // Metadata card
  let y = bandH + 12;
  const rows = opts.meta;
  const cardH = 12 + rows.length * 7.5;
  doc.setFillColor(FAINT);
  doc.setDrawColor(SKY_SOFT);
  setLineWidth(doc, 0.3);
  doc.roundedRect(MARGIN, y, CONTENT_W, cardH, 2.5, 2.5, "FD");
  y += 9;
  for (const [k, v] of rows) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(MID_GREY);
    doc.text(k.toUpperCase(), MARGIN + 6, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(INK);
    doc.text(v, MARGIN + 52, y);
    y += 7.5;
  }
  return y + 6;
}

/* ── Section + body ───────────────────────────────────────────────────── */

export function sectionTitle(doc: Doc, y: number, text: string): number {
  // steel tab + label
  doc.setFillColor(STEEL);
  doc.rect(MARGIN, y - 3.6, 2.4, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(INK);
  doc.text(text, MARGIN + 5, y);
  doc.setDrawColor(SKY_SOFT);
  setLineWidth(doc, 0.4);
  doc.line(MARGIN, y + 2.4, PAGE_W - MARGIN, y + 2.4);
  doc.setFont("helvetica", "normal");
  return y + 9;
}

/** Body paragraph, wrapped to content width. Returns the Y below it. */
export function paragraph(
  doc: Doc,
  y: number,
  text: string,
  opts: { size?: number; color?: string; gap?: number } = {},
): number {
  const size = opts.size ?? 9.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(size);
  doc.setTextColor(opts.color ?? DARK_GREY);
  const lines = doc.splitTextToSize(text, CONTENT_W) as string[];
  doc.text(lines, MARGIN, y);
  const lineH = size * 0.52;
  return y + lines.length * lineH + (opts.gap ?? 4);
}

/** A labelled KPI box. */
export function statBox(
  doc: Doc,
  x: number,
  y: number,
  w: number,
  label: string,
  value: string,
  color: string = INK,
) {
  doc.setFillColor(FAINT);
  doc.setDrawColor(SKY_SOFT);
  setLineWidth(doc, 0.3);
  doc.roundedRect(x, y, w, 19, 2, 2, "FD");
  doc.setFontSize(7);
  doc.setTextColor(MID_GREY);
  doc.setFont("helvetica", "bold");
  doc.text(label.toUpperCase(), x + w / 2, y + 6, { align: "center" });
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(color);
  doc.text(value, x + w / 2, y + 14, { align: "center" });
  doc.setFont("helvetica", "normal");
}

/* ── Running header + footer on every page ────────────────────────────── */

export interface StampOptions {
  title: string;
  org: string;
  generatedAt: string;
}

/**
 * Stamp the running header (page 2+) and the footer (every page). Call once,
 * last, after all pages exist — it walks every page.
 */
export function stampChrome(doc: Doc, opts: StampOptions) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);

    // Header on content pages only (cover already has the full lockup)
    if (i > 1) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(STEEL);
      doc.text("HOUNDSHIELD", MARGIN, 11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(MID_GREY);
      doc.text(opts.title, PAGE_W / 2, 11, { align: "center" });
      doc.text(`Page ${i} of ${pages}`, PAGE_W - MARGIN, 11, { align: "right" });
      doc.setDrawColor(LIGHT_GREY);
      setLineWidth(doc, 0.3);
      doc.line(MARGIN, 13.5, PAGE_W - MARGIN, 13.5);
    }

    // Footer on every page
    const fy = PAGE_H - 10;
    doc.setDrawColor(LIGHT_GREY);
    setLineWidth(doc, 0.3);
    doc.line(MARGIN, fy - 3.5, PAGE_W - MARGIN, fy - 3.5);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(STEEL);
    doc.text(SITE, MARGIN, fy);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MID_GREY);
    doc.text(`Confidential · Prepared for ${opts.org}`, PAGE_W / 2, fy, { align: "center" });
    doc.text(`Generated ${formatDate(opts.generatedAt)}`, PAGE_W - MARGIN, fy, { align: "right" });
  }
}

/** Italic legal disclaimer block. Returns nothing (draws at y). */
export function disclaimer(doc: Doc, y: number, text: string) {
  doc.setFillColor(FAINT);
  doc.setDrawColor(SKY_SOFT);
  setLineWidth(doc, 0.3);
  const lines = doc.splitTextToSize(text, CONTENT_W - 8) as string[];
  const h = 8 + lines.length * 3.8;
  doc.roundedRect(MARGIN, y - 5, CONTENT_W, h, 2, 2, "FD");
  doc.setFontSize(7.5);
  doc.setTextColor(MID_GREY);
  doc.setFont("helvetica", "italic");
  doc.text(lines, MARGIN + 4, y);
  doc.setFont("helvetica", "normal");
}
