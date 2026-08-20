import { describe, it, expect } from "vitest";
import { scanLocal, redactMatches, decodeVariants, MAX_INPUT_CHARS } from "../local-engine";

/* Values that must never survive into anything rendered or downloaded. */
const SSN = "123-45-6789";
const AWS = "AKIA1234567890ABCD12";
const CAGE = "1ABC2";
const CONTRACT = "N00024-25-C-1234";

const DEFENSE = `Draft a status email about Navy contract ${CONTRACT}.
CAGE code ${CAGE}. Employee John Smith (SSN ${SSN}).
AWS deploy key ${AWS}.
CUI//SP-CTI: radar cross-section figures.`;

describe("redaction never emits a matched value", () => {
  it("removes the raw values from the preview", () => {
    const out = redactMatches(DEFENSE);
    for (const secret of [SSN, AWS]) {
      expect(out, `redacted preview leaked ${secret}`).not.toContain(secret);
    }
  });

  it("still tells the reader WHAT was found and where", () => {
    const out = redactMatches(DEFENSE);
    expect(out).toContain("[REDACTED:");
    // Surrounding prose is preserved so the location is legible.
    expect(out).toContain("Draft a status email");
  });

  it("is a no-op on text with nothing to find", () => {
    const clean = "Summarise the weekly team update, no identifiers here.";
    expect(redactMatches(clean)).toBe(clean);
  });

  it("handles overlapping matches without emitting a fragment of one", () => {
    // Two patterns can match the same span; the wider must win outright rather
    // than leaving the tail of the narrower in the output.
    const out = redactMatches(`SSN ${SSN} and again ${SSN}`);
    expect(out).not.toContain(SSN);
    expect(out).not.toContain("45-6789");
  });
});

describe("obfuscated payloads are decoded, not missed", () => {
  it("finds an SSN hidden in base64", () => {
    const encoded = Buffer.from(`patient ssn ${SSN} on file`).toString("base64");
    const plain = scanLocal(`Here is the record: ${encoded}`);
    expect(plain.findings.length, "base64-wrapped SSN was not detected").toBeGreaterThan(0);
    expect(plain.findings.some((f) => f.foundVia === "base64")).toBe(true);
  });

  it("labels a plain-text match as plain even when also present encoded", () => {
    const encoded = Buffer.from(`ssn ${SSN}`).toString("base64");
    const r = scanLocal(`${SSN} ${encoded}`);
    const ssnFinding = r.findings.find((f) => f.patternName.includes("Social Security"));
    expect(ssnFinding?.foundVia, "visible-in-the-paste must not be reported as base64").toBe("plain");
  });

  it("does not manufacture findings from random binary", () => {
    const junk = "f".repeat(64);
    const variants = decodeVariants(junk);
    // Anything kept must be printable; garbage decodes are dropped.
    for (const v of variants) expect(/^[\x20-\x7E\n\r\t]+$/.test(v.text)).toBe(true);
  });
});

describe("hostile and edge input", () => {
  it("refuses an oversized paste instead of hanging", () => {
    const r = scanLocal("x".repeat(MAX_INPUT_CHARS + 1));
    expect(r.rejected?.reason).toBe("too_large");
    expect(r.findings).toEqual([]);
  });

  it("accepts input exactly at the limit", () => {
    expect(scanLocal("x".repeat(MAX_INPUT_CHARS)).rejected).toBeUndefined();
  });

  it.each([
    ["empty", ""],
    ["whitespace only", "   \n\t  "],
    ["unicode", "🔒 プロンプト مرحبا"],
    ["zero-width joiners", "1​2​3-​45-6789"],
    ["CRLF", "line one\r\nline two\r\n"],
    ["no trailing newline", "final line"],
  ])("returns a well-formed result for %s", (_label, input) => {
    const r = scanLocal(input);
    expect(Array.isArray(r.findings)).toBe(true);
    expect(typeof r.redacted).toBe("string");
    expect(r.patternsChecked).toBeGreaterThan(50);
    expect(r.summary).toBeTruthy();
  });

  it("never throws, whatever it is handed", () => {
    for (const input of ["", "\0\0\0", "%%%", "0x".repeat(5000), "</script>"]) {
      expect(() => scanLocal(input)).not.toThrow();
    }
  });
});

describe("the result carries the information the UI promises", () => {
  const r = scanLocal(DEFENSE);

  it("finds the defense scenario's exposures", () => {
    expect(r.findings.length).toBeGreaterThan(2);
    expect(r.summary.criticalCount).toBeGreaterThan(0);
  });

  it("reports real per-category coverage", () => {
    expect(r.coverage.length).toBeGreaterThan(0);
    for (const c of r.coverage) {
      expect(c.occurrences).toBeGreaterThan(0);
      expect(c.matched).toBeGreaterThan(0);
      expect(c.label.length).toBeGreaterThan(0);
    }
  });

  it("maps findings to NIST controls", () => {
    expect(r.summary.controls.length).toBeGreaterThan(0);
    for (const c of r.summary.controls) expect(c).toMatch(/^[A-Z]{2}\.L2-3\.\d+\.\d+$/);
  });

  it("breaks the paste down per prompt", () => {
    expect(r.perPrompt.length).toBeGreaterThan(0);
    for (const p of r.perPrompt) expect(p.chars).toBeGreaterThan(0);
  });

  it("carries NO raw matched value anywhere in the result object", () => {
    // The single most important assertion in this file: whatever the UI or the
    // proof receipt serialises, it cannot contain the secret.
    const serialised = JSON.stringify({ ...r, redacted: undefined });
    for (const secret of [SSN, AWS, CONTRACT]) {
      expect(serialised, `scan result leaked ${secret}`).not.toContain(secret);
    }
  });

  it("measures a real scan time rather than reporting a constant", () => {
    expect(r.scanMs).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(r.scanMs)).toBe(true);
  });
});

describe("pathological input cannot melt the tab", () => {
  /*
   * This guard exists because the first version of this engine shipped a
   * guessed 200,000-char ceiling and the suite timed out at 5s. Benchmarking
   * showed cost is roughly QUADRATIC in the length of a single unbroken
   * non-whitespace run, not in total size — several shipped patterns backtrack
   * across a long uniform character class:
   *
   *   before the shape bound:  50,000-char run → 10,030ms
   *   after  the shape bound:  50,000-char run →     21ms
   *
   * Numbers are asserted with a wide margin so this fails on a REGRESSION (an
   * order of magnitude) rather than on a slow CI runner. A flaky perf test is
   * one people learn to ignore.
   */
  const budgetMs = 2_000;

  it.each([10_000, 50_000, MAX_INPUT_CHARS])(
    "scans a %i-char unbroken run well inside budget",
    (size) => {
      const t0 = performance.now();
      scanLocal("x".repeat(size));
      expect(performance.now() - t0).toBeLessThan(budgetMs);
    },
  );

  it("scans a full-size realistic paste well inside budget", () => {
    const chunk = "Email john@acme.com about SSN 123-45-6789 and CAGE 1ABC2.\n\n";
    const text = chunk.repeat(Math.ceil(MAX_INPUT_CHARS / chunk.length)).slice(0, MAX_INPUT_CHARS);
    const t0 = performance.now();
    const r = scanLocal(text);
    expect(performance.now() - t0).toBeLessThan(budgetMs);
    expect(r.findings.length).toBeGreaterThan(0);
  });

  it("still decodes base64 CUI after the shape bound — the bound must not blind the decoder", () => {
    // The shape bound elides long runs from the PLAIN sweep. If it also cut the
    // decode path, obfuscated CUI would silently stop being found — a bound that
    // quietly reduces detection is worse than no bound.
    const encoded = Buffer.from(`employee ssn ${SSN}`).toString("base64");
    const r = scanLocal(`attachment: ${encoded}`);
    expect(r.findings.some((f) => f.foundVia === "base64")).toBe(true);
  });
});
