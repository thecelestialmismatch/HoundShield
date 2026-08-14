import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { LEGAL_DOCUMENTS } from "@/lib/legal/index-registry";
import { STORED_ITEMS, itemsByCategory, requiresConsent } from "@/lib/legal/cookies";
import { CONSENT_KEY } from "@/lib/consent";

/**
 * Guards on the legal surface as a whole.
 *
 * A legal index is the one kind of page where a dead link IS the defect: it
 * advertises a policy that does not exist, to exactly the reader — a privacy
 * officer, a procurement reviewer — who is checking whether we are the sort of
 * vendor that publishes things it has not done.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const routeExists = (href: string) =>
  existsSync(join(ROOT, "app", href.replace(/^\//, ""), "page.tsx"));

describe("every document in the legal index is real", () => {
  it.each(LEGAL_DOCUMENTS.map((d) => [d.href, d.title] as const))(
    "%s (%s) has a page behind it",
    (href) => {
      expect(routeExists(href), `${href} is listed on /legal but has no page.tsx`).toBe(true);
    },
  );

  it("names the instrument for each document, not a vague regime", () => {
    // A citation a reviewer can look up. Matching on SHAPE, not on length —
    // the first draft of this guard used `length > 8` as a proxy for
    // specificity and flagged "CalOPPA", which is a named statute and about as
    // specific as a citation gets.
    const SPECIFIC =
      /\bArt\.|\bArticle\b|§|\bDirective\b|\bRegulation\b|\bAct\b|\bGDPR\b|\bCCPA\b|\bCPRA\b|\bCalOPPA\b|\bWCAG\b|\bEN \d|\bSection \d|\bFTC\b|\bNIST\b|\bStripe\b|\bSCC|Standard Contractual/i;
    for (const doc of LEGAL_DOCUMENTS) {
      expect(doc.required.length, `${doc.href} cites nothing`).toBeGreaterThan(0);
      // Only STATUTORY documents must name a checkable instrument. An
      // acceptable-use policy is a contract term, not a statutory obligation,
      // and inventing a citation for it would be the dishonest way to pass.
      if (doc.basis !== "statutory") continue;
      expect(
        doc.required.some((r) => SPECIFIC.test(r)),
        `${doc.href} cites only [${doc.required.join(", ")}] — none names a checkable instrument`,
      ).toBe(true);
    }
  });

  it("covers the documents EU and US law actually ask a SaaS vendor for", () => {
    const hrefs = LEGAL_DOCUMENTS.map((d) => d.href);
    for (const required of [
      "/privacy", // GDPR Art. 13-14, CCPA, CalOPPA
      "/cookies", // ePrivacy Art. 5(3)
      "/terms", // contract + e-Commerce Directive Art. 5
      "/dpa", // GDPR Art. 28(3)
      "/subprocessors", // GDPR Art. 28(2)
      "/refund", // Stripe + FTC guarantee guidance
      "/accessibility", // EAA 2019/882, EN 301 549, ADA/508
    ]) {
      expect(hrefs, `${required} missing from the legal index`).toContain(required);
    }
  });

  it("every statutory document EU/US law expects is present and marked so", () => {
    const statutory = LEGAL_DOCUMENTS.filter((d) => d.basis === "statutory").map((d) => d.href);
    for (const href of ["/privacy", "/cookies", "/dpa", "/subprocessors", "/accessibility"]) {
      expect(statutory, `${href} should be marked statutory`).toContain(href);
    }
  });

  it("is reachable from the footer", () => {
    const footer = read("components/layout/FooterV3.tsx");
    expect((footer.match(/href="\/legal"/g) ?? []).length).toBe(2);
  });
});

describe("the cookie policy describes what the code actually stores", () => {
  it("lists the consent key under its real name, from the single source", () => {
    // If lib/consent.ts bumps CONSENT_KEY (it is versioned on purpose), the
    // policy must move with it rather than naming a key nothing writes.
    const names = STORED_ITEMS.map((i) => i.name);
    expect(names).toContain(CONSENT_KEY);
  });

  it("carries an in-repo evidence path for every item, and the file exists", () => {
    for (const item of STORED_ITEMS) {
      expect(existsSync(join(ROOT, item.evidence)), `${item.name}: ${item.evidence}`).toBe(true);
    }
  });

  it("classifies analytics as consent-gated and essential as not", () => {
    expect(requiresConsent("analytics")).toBe(true);
    expect(requiresConsent("essential")).toBe(false);
    expect(itemsByCategory("essential").length).toBeGreaterThan(0);
    expect(itemsByCategory("analytics").length).toBeGreaterThan(0);
  });

  it("only claims analytics is gated if PostHog is genuinely gated in code", () => {
    // The policy's central promise. If PostHogProvider ever initialises without
    // consulting consent, this page becomes a false statement about tracking.
    const provider = read("components/PostHogProvider.tsx");
    expect(provider).toMatch(/hasAnalyticsConsent/);
    expect(provider).toMatch(/if \(!key \|\| !consented\) return/);
  });

  it("does not list cookies this domain does not set", () => {
    // Stripe.js is not loaded here (checkout is Stripe-hosted) and Turnstile is
    // not configured. Listing either would be a published inaccuracy about data
    // handling — the exact thing this product is sold to prevent.
    const names = STORED_ITEMS.map((i) => i.name).join(" ");
    expect(names).not.toMatch(/__stripe_(mid|sid)/);
    expect(names).not.toMatch(/cf_clearance|__cf_bm/);
  });
});

describe("the consent banner obtains INFORMED consent", () => {
  it("links to the cookie inventory, not only to the privacy policy", () => {
    // ePrivacy Art. 5(3) consent must be informed. The banner previously linked
    // only to /privacy, whose cookie section named nothing at all.
    expect(read("components/CookieConsent.tsx")).toMatch(/href="\/cookies"/);
  });

  it("still offers a way to decline analytics", () => {
    const banner = read("components/CookieConsent.tsx");
    expect(banner).toMatch(/Accept essential/);
    expect(banner).toMatch(/setConsent\("rejected"\)/);
  });

  it("privacy §7 points at the full inventory", () => {
    expect(read("app/privacy/page.tsx")).toMatch(/href="\/cookies"/);
  });
});

describe("the accessibility statement does not overclaim", () => {
  const page = () => read("app/accessibility/page.tsx");

  /**
   * The rendered copy, with comments removed.
   *
   * The first draft of the overclaim check ran against the raw file and failed
   * on this page's own JSDoc, which quotes the sentence we refuse to write
   * ("HoundShield is fully conformant with…") in order to explain why. A guard
   * that reads a disclaimer as the claim is the same defect as the CSP drift
   * check that diffed comment prose — assert on what ships, not on what the
   * file says about itself.
   */
  const copy = () => page().replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  it("says PARTIALLY conformant, never fully", () => {
    // We have no manual audit, no assistive-tech testing and no VPAT. Claiming
    // full WCAG 2.1 AA conformance to a Section 508 buyer would be a
    // representation we cannot support.
    expect(copy()).toMatch(/partially conformant/i);
    expect(copy()).not.toMatch(/\bis fully conformant|fully conformant with WCAG/i);
  });

  it("states plainly what automated testing does not prove", () => {
    const src = copy();
    expect(src).toMatch(/manual WCAG 2\.1 AA audit/i);
    expect(src).toMatch(/screen readers/i);
    expect(src).toMatch(/VPAT/);
  });

  it("publishes the gate value from the config that enforces it", async () => {
    // Not a hardcoded "0.9" that drifts the first time the threshold is raised.
    const rc = JSON.parse(read(".lighthouserc.json")) as {
      ci: { assert: { assertions: Record<string, [string, { minScore: number }]> } };
    };
    const configured = rc.ci.assert.assertions["categories:accessibility"][1].minScore;
    const { A11Y_GATE_MIN_SCORE } = await import("@/lib/legal/accessibility");
    expect(Number(A11Y_GATE_MIN_SCORE)).toBe(configured);
  });

  it("keeps accessibility a hard CI gate, so the page is describing something real", () => {
    const rc = JSON.parse(read(".lighthouserc.json")) as {
      ci: { assert: { assertions: Record<string, [string, { minScore: number }]> } };
    };
    expect(rc.ci.assert.assertions["categories:accessibility"][0]).toBe("error");
  });
});
