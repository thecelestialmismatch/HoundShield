import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Regression guard for the "capability with no caller" dangling thread
 * (tasks/lessons.md 2026-07-04). The /api/partners/apply route, the
 * partner_applications table, and the branded welcome email all existed for
 * months while EVERY /partners CTA pointed at the generic /contact form — so
 * the structured RPO funnel (Stage-1 channel #1) never actually ran.
 *
 * These assertions fail the build if that wiring is ever severed again.
 */

const root = process.cwd();
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

describe("RPO/MSP application funnel is wired end-to-end", () => {
  it("the form is the caller the /api/partners/apply route needs", () => {
    const form = read("app/partners/apply/PartnerApplyForm.tsx");
    expect(form).toContain('fetch("/api/partners/apply"');
  });

  it("the /partners/apply page renders the application form", () => {
    const page = read("app/partners/apply/page.tsx");
    expect(page).toMatch(/<PartnerApplyForm\s*\/>/);
  });

  it("the partners overview page routes its CTAs to /partners/apply, not /contact", () => {
    const partners = read("app/partners/page.tsx");
    expect(partners).toContain('href="/partners/apply"');
    // Both application CTAs must be repointed — no partner CTA falls back to
    // the generic contact form (which never reaches partner_applications).
    expect(partners).not.toContain('href="/contact"');
  });

  it("the partner kit's primary CTA routes to /partners/apply", () => {
    const kit = read("app/partners/kit/page.tsx");
    expect(kit).toContain('href="/partners/apply"');
  });

  it("the application page is listed in the sitemap for crawl/AEO", () => {
    const sitemap = read("app/sitemap.ts");
    expect(sitemap).toContain("/partners/apply");
  });
});

describe("the form honors the no-fake-success contract", () => {
  const form = read("app/partners/apply/PartnerApplyForm.tsx");

  it("only shows success on an ok response", () => {
    expect(form).toMatch(/res\.ok\s*&&\s*data\.success/);
    expect(form).toContain("setSubmitted(true)");
  });

  it("does not simulate success with a timer (the 2026-07-12 lead-shredder pattern)", () => {
    expect(form).not.toMatch(/setTimeout[\s\S]{0,80}setSubmitted/);
  });

  it("degrades to a real, reachable inbox on failure", () => {
    expect(form).toContain("contact@houndshield.com");
  });
});

describe("channel doctrine (32 CFR Part 170) survives in the funnel", () => {
  it("the form states the C3PAO exclusion", () => {
    const form = read("app/partners/apply/PartnerApplyForm.tsx");
    expect(form).toMatch(/C3PAOs are not eligible/i);
  });
});
