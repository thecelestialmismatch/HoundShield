import { describe, it, expect } from "vitest";
import { cleanAnswer, hasMarkdownArtifacts } from "../format-answer";

describe("cleanAnswer", () => {
  it("strips bold and italic emphasis", () => {
    expect(cleanAnswer("This is **bold** and *italic* and __also__ and _too_.")).toBe(
      "This is bold and italic and also and too.",
    );
  });

  it("converts dash and star bullets to • (never a star/dash)", () => {
    const out = cleanAnswer("Coverage:\n- CUI\n- PHI\n* PII");
    expect(out).toBe("Coverage:\n• CUI\n• PHI\n• PII");
    expect(out).not.toMatch(/\*/);
    expect(out.split("\n").slice(1).join("\n")).not.toMatch(/^- /m);
  });

  it("PRESERVES real hyphens in content", () => {
    const out = cleanAnswer("NIST 800-171 Rev 2, SPRS −203 to +110, $30K-$150K.");
    expect(out).toBe("NIST 800-171 Rev 2, SPRS −203 to +110, $30K-$150K.");
  });

  it("removes heading markers but keeps the text", () => {
    expect(cleanAnswer("## CMMC Level 2\nText")).toBe("CMMC Level 2\nText");
  });

  it("strips inline code and fenced code blocks", () => {
    expect(cleanAnswer("Use `baseURL` here.")).toBe("Use baseURL here.");
    expect(cleanAnswer("```ts\nconst x = 1;\n```")).toBe("const x = 1;");
  });

  it("rewrites markdown links to text (url)", () => {
    expect(cleanAnswer("See [the report](https://x.com/r).")).toBe(
      "See the report (https://x.com/r).",
    );
  });

  it("removes blockquote markers", () => {
    expect(cleanAnswer("> quoted line")).toBe("quoted line");
  });

  it("strips horizontal rules (--- *** ___) without harming real hyphens", () => {
    expect(cleanAnswer("Before\n---\nAfter")).toBe("Before\n\nAfter");
    expect(cleanAnswer("A\n***\nB")).toBe("A\n\nB");
    expect(cleanAnswer("Section\n- - -\nNext")).toBe("Section\n\nNext");
    // a real hyphenated token on its own is NOT a rule
    expect(cleanAnswer("800-171")).toBe("800-171");
  });

  it("collapses excessive blank lines and trims", () => {
    expect(cleanAnswer("\n\nA\n\n\n\nB\n\n")).toBe("A\n\nB");
  });

  it("leaves clean prose untouched and emits no stars or dashes-as-bullets", () => {
    const clean = "HoundShield scans every prompt locally in under 10ms.";
    expect(cleanAnswer(clean)).toBe(clean);
  });

  it("fully de-markdowns a realistic FAQ answer", () => {
    const faq =
      "I'm **Brain AI** — built into **HoundShield**.\n\nExpert in:\n- **CMMC Level 2** & 110 NIST 800-171 controls\n- **SPRS scoring** (−203 to +110)";
    const out = cleanAnswer(faq);
    expect(out).not.toMatch(/\*\*/);
    expect(out).not.toMatch(/^\s*[-*]\s/m);
    expect(out).toContain("• CMMC Level 2 & 110 NIST 800-171 controls");
    expect(out).toContain("800-171"); // hyphen preserved
    expect(hasMarkdownArtifacts(out)).toBe(false);
  });
});
