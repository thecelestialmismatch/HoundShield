/**
 * pdf-brand — unit tests for the shared premium PDF layer.
 *
 * Uses REAL jsPDF (isomorphic in Node) so the drawing helpers are exercised end
 * to end: every helper must render onto a page without throwing and the pure
 * helpers must produce stable, official-looking output.
 */
import { describe, it, expect } from "vitest";
import { jsPDF } from "jspdf";
import {
  reportId,
  formatDate,
  drawBadge,
  coverBanner,
  sectionTitle,
  paragraph,
  statBox,
  stampChrome,
  disclaimer,
  SITE,
  STEEL,
} from "../pdf-brand";

describe("pure helpers", () => {
  it("reportId is stable, uppercased and shaped HS-PREFIX-DATE-SLUG", () => {
    const id = reportId("SSP", "Aegis Defense Systems", "2026-07-18T06:00:00Z");
    expect(id).toBe("HS-SSP-20260718-AEGI");
  });

  it("reportId tolerates punctuation and short/empty names", () => {
    expect(reportId("POAM", "  ", "2026-01-02T00:00:00Z")).toBe("HS-POAM-20260102-ORG");
    expect(reportId("EV", "A/b!", "2026-01-02")).toBe("HS-EV-20260102-AB");
  });

  it("formatDate renders a human date and passes through garbage", () => {
    expect(formatDate("2026-07-18T00:00:00Z")).toMatch(/2026/);
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });

  it("SITE and STEEL are the brand constants", () => {
    expect(SITE).toBe("houndshield.com");
    expect(STEEL).toMatch(/^#/);
  });
});

describe("drawing helpers render without throwing (real jsPDF)", () => {
  function doc() {
    return new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }) as jsPDF &
      Record<string, unknown>;
  }

  it("drawBadge draws on light and dark surfaces", () => {
    const d = doc();
    expect(() => drawBadge(d, 18, 12, 14, true)).not.toThrow();
    expect(() => drawBadge(d, 18, 40, 10, false)).not.toThrow();
  });

  it("coverBanner returns a Y below the banner", () => {
    const d = doc();
    const y = coverBanner(d, {
      title: "System Security Plan",
      subtitle: "NIST SP 800-171 Rev 2",
      org: "Aegis Defense Systems",
      meta: [
        ["Organization", "Aegis Defense Systems"],
        ["SPRS Score", "72"],
      ],
      tag: "Confidential",
    });
    expect(y).toBeGreaterThan(60);
  });

  it("sectionTitle / paragraph / statBox advance the cursor and render", () => {
    const d = doc();
    let y = 80;
    y = sectionTitle(d, y, "About this report");
    const afterPara = paragraph(d, y, "A ".repeat(120));
    expect(afterPara).toBeGreaterThan(y);
    expect(() => statBox(d, 18, afterPara, 40, "SPRS", "72")).not.toThrow();
  });

  it("stampChrome + disclaimer walk every page and produce a real PDF", () => {
    const d = doc();
    coverBanner(d, { title: "Evidence Pack", subtitle: "CMMC L2", org: "Acme", meta: [["Org", "Acme"]] });
    d.addPage();
    disclaimer(d, 250, "Self-assessment artifact. Not an official certification.");
    stampChrome(d, { title: "Evidence Pack", org: "Acme", generatedAt: "2026-07-18T00:00:00Z" });
    const bytes = d.output("arraybuffer");
    const magic = new TextDecoder().decode(new Uint8Array(bytes.slice(0, 5)));
    expect(magic).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(3000);
    expect(d.getNumberOfPages()).toBe(2);
  });
});
