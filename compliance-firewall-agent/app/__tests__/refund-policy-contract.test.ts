import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  REFUND_WINDOW_DAYS,
  REFUND_TERMS,
  REFUND_CONTACT,
  EXCLUSIONS,
} from "@/lib/legal/refund-policy";
import { RISK_REPORT } from "@/lib/pricing/plans";

/**
 * Guards on the refund guarantee.
 *
 * The failure this exists to prevent already happened: "30-day money-back
 * guarantee" was published on FOUR surfaces — /pricing, /terms, the FAQPage
 * JSON-LD, and the order-confirmation email a paying buyer receives — with no
 * `/refund` page and no statement anywhere of how to claim one, what the window
 * runs from, or how long it takes.
 *
 * Two things are asserted, and the second matters more than the first:
 *   1. the policy exists and is reachable, and
 *   2. no surface may advertise a window that the policy does not honour.
 * A page saying 14 days while /pricing still promises 30 is worse than the
 * original gap, because now the company is on record contradicting itself.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/** Every place the guarantee is advertised to a buyer. */
const CLAIM_SURFACES = [
  "app/pricing/page.tsx",
  "app/terms/page.tsx",
  "lib/seo/faqs.ts",
  "lib/email/templates/report-order.ts",
] as const;

describe("the refund policy is published and reachable", () => {
  it("has a page at /refund", () => {
    expect(existsSync(join(ROOT, "app/refund/page.tsx"))).toBe(true);
  });

  it("is linked from the footer, on both footer variants", () => {
    // Reachability is the point. A legal page nobody can navigate to is the same
    // as no legal page for the procurement reviewer who goes looking before a PO.
    const footer = read("components/layout/FooterV3.tsx");
    const links = footer.match(/href="\/refund"/g) ?? [];
    expect(links.length, "both the dark and light footer variants need the link").toBe(2);
  });

  it("is in the sitemap", () => {
    expect(read("app/sitemap.ts")).toMatch(/\/refund`/);
  });

  it("is reachable from the Terms of Service", () => {
    expect(read("app/terms/page.tsx")).toMatch(/href="\/refund"/);
  });
});

describe("no surface advertises a window the policy does not honour", () => {
  it.each(CLAIM_SURFACES)("%s promises exactly the policy's window", (rel) => {
    const src = read(rel);
    // Find every "<n>-day money-back" / "<n> days of purchase" style claim and
    // require it to match the single source. Scoped to refund language so the
    // 14-day assessment period and the 30-day price-change notice are not caught.
    const claims = [...src.matchAll(/(\d+)[- ]day[s]?\s+(?:money-back|refund)/gi)].map((m) =>
      Number(m[1]),
    );
    for (const days of claims) {
      expect(days, `${rel} advertises a ${days}-day guarantee`).toBe(REFUND_WINDOW_DAYS);
    }
  });

  it("every surface that mentions a refund at all is a known surface", () => {
    // Stops a fifth surface appearing without being covered by the check above.
    // Scoped to buyer-facing copy; lib/legal and tests are the policy itself.
    const unscanned = ["app/page.tsx", "app/security/page.tsx", "app/trust/page.tsx"];
    for (const rel of unscanned) {
      if (!existsSync(join(ROOT, rel))) continue;
      const src = read(rel);
      if (/money-back/i.test(src)) {
        throw new Error(
          `${rel} advertises a money-back guarantee but is not in CLAIM_SURFACES — ` +
            `add it there so its window is checked against the policy.`,
        );
      }
    }
  });
});

describe("the policy says what a buyer actually needs to know", () => {
  it("states the window, the contact, and the settlement time", () => {
    const bodies = REFUND_TERMS.map((t) => `${t.heading} ${t.body}`).join(" ");
    expect(bodies).toMatch(new RegExp(`${REFUND_WINDOW_DAYS} days`));
    expect(bodies).toContain(REFUND_CONTACT);
    expect(bodies).toMatch(/business days/);
  });

  it("prices the covered product from the single pricing source", () => {
    // Not a hardcoded "$499" — the page must move if the price does.
    const bodies = REFUND_TERMS.map((t) => t.body).join(" ");
    expect(bodies).toContain(`$${RISK_REPORT.oneTimePrice}`);
    expect(bodies).toContain(`$${RISK_REPORT.wholesalePrice}`);
  });

  it("says the window runs from PURCHASE, not from delivery", () => {
    // The report needs a 14-day assessment run before the PDF exists. Measuring
    // the guarantee from delivery would silently halve it.
    const bodies = REFUND_TERMS.map((t) => t.body).join(" ");
    expect(bodies).toMatch(/from the date of payment/i);
  });

  it("does not void the refund once the report is delivered", () => {
    const bodies = REFUND_TERMS.map((t) => t.body).join(" ");
    expect(bodies).toMatch(/even after the report has been generated/i);
  });

  it("carries no exclusion that would make the guarantee unclaimable", () => {
    // EXCLUSIONS is deliberately empty. If one is ever added it must be a
    // reviewed decision, not an accident — and it must not be one of these,
    // each of which describes normal use of the product.
    for (const exclusion of EXCLUSIONS) {
      expect(
        /delivered|used|ran the proxy|generated|completed/i.test(exclusion),
        `"${exclusion}" excludes ordinary use, which makes the guarantee a technicality`,
      ).toBe(false);
    }
  });
});

describe("no subscription language survives where nothing is sold by subscription", () => {
  it("the Terms no longer describe cancelling a billing period", () => {
    // /pricing sells one one-time report. Terms describing monthly/annual
    // subscription cancellation documented a product that does not exist, while
    // leaving the real product's refund terms unstated.
    const terms = read("app/terms/page.tsx");
    expect(terms).not.toMatch(/billed in advance on a monthly or annual basis/i);
    expect(terms).not.toMatch(/end of your current billing period/i);
  });

  it("the pricing FAQ does not advertise an annual discount on plans", () => {
    // This shipped inside FAQPage JSON-LD, which answer engines quote verbatim,
    // and its 20% contradicted the 17% recorded in CLAUDE.md.
    const faqs = read("lib/seo/faqs.ts");
    const answers = faqs.replace(/\/\/.*$/gm, ""); // drop the comment explaining the fix
    expect(answers).not.toMatch(/billed annually at a \d+% discount/i);
    expect(answers).not.toMatch(/Every paid HoundShield plan/i);
  });
});
