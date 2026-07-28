import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PURCHASABLE_OFFER } from "../entitlements";
import { findFaqAnswer } from "@/lib/brain-ai/faq";

/* ──────────────────────────────────────────────────────────────────────
 * Offer-honesty contract for AUTOMATED SALES SURFACES.
 *
 * /pricing collapsed to a single $499 one-time offer, but the surfaces that
 * answer "how much?" without a human in the loop did not follow:
 *
 *   - Brain AI's keyword FAQ still quoted five subscription tiers
 *     (Free / $199 / $499-mo / $999 / $2,499) and a 14-day free trial.
 *   - The site-wide chat system prompt still listed $299/$799/$1499 monthly
 *     "monitoring subscriptions" that no checkout can sell.
 *   - The day-7 lifecycle email still said "Upgrade to Pro — $199/mo".
 *
 * A buyer quoted a price the checkout cannot honour is worse than a buyer
 * quoted nothing. These surfaces must read from PURCHASABLE_OFFER.
 *
 * Scope note: this scans the surfaces that quote price AUTONOMOUSLY. It does
 * not police lib/pricing/plans.ts or the Stripe route, which still carry the
 * dormant subscription machinery behind an unsold code path.
 * ────────────────────────────────────────────────────────────────────── */

const ROOT = join(__dirname, "..", "..", "..");

const SALES_SURFACES = [
  join(ROOT, "lib", "brain-ai"),
  join(ROOT, "lib", "email", "templates"),
  join(ROOT, "components", "GlobalChat.tsx"),
];

function collect(target: string, acc: string[] = []): string[] {
  if (!statSync(target).isDirectory()) {
    acc.push(target);
    return acc;
  }
  for (const entry of readdirSync(target)) {
    if (entry === "__tests__" || entry.startsWith(".")) continue;
    const full = join(target, entry);
    if (statSync(full).isDirectory()) collect(full, acc);
    else if ((entry.endsWith(".ts") || entry.endsWith(".tsx")) && !entry.includes(".test."))
      acc.push(full);
  }
  return acc;
}

/** "$199/mo", "$1,499 / month", "$799 per month" — a recurring price we cannot sell. */
const MONTHLY_PRICE = /\$\s?\d[\d,]*\s*(?:\/\s*(?:mo\b|month)|\s+per\s+month)/i;

/** Promises of a tier that does not exist. */
const FREE_PROMISE = /free trial|no credit card|start free/i;

describe("automated sales surfaces quote only the offer we can sell", () => {
  const files = SALES_SURFACES.flatMap((t) => collect(t));

  it("scans the expected surfaces", () => {
    expect(files.length).toBeGreaterThan(5);
    expect(files.some((f) => f.endsWith("GlobalChat.tsx"))).toBe(true);
    expect(files.some((f) => f.includes(join("brain-ai", "faq.ts")))).toBe(true);
  });

  it("quotes no monthly HoundShield price", () => {
    const violations = files
      .filter((f) => MONTHLY_PRICE.test(readFileSync(f, "utf8")))
      .map((f) => f.replace(ROOT + "/", ""));
    expect(violations, `quotes an unsellable monthly price: ${violations.join(", ")}`).toEqual([]);
  });

  it("promises no free tier, trial, or card-free signup", () => {
    const violations = files
      .filter((f) => FREE_PROMISE.test(readFileSync(f, "utf8")))
      .map((f) => f.replace(ROOT + "/", ""));
    expect(violations, `promises a tier we do not sell: ${violations.join(", ")}`).toEqual([]);
  });

  it("Brain AI answers a pricing question with the real offer", () => {
    // Asserted through the public entry point — this is the exact string a
    // visitor gets back when they type the question into the chat widget.
    for (const question of ["how much does HoundShield cost", "what is your pricing"]) {
      const answer = findFaqAnswer(question);
      expect(answer, `Brain AI had no answer for "${question}"`).toBeTruthy();
      expect(answer!).toContain(PURCHASABLE_OFFER.price);
      expect(answer!).toContain(PURCHASABLE_OFFER.name);
      expect(answer!).not.toMatch(MONTHLY_PRICE);
    }
  });

  it("Brain AI does not sell the cancelled CMMC deadline", () => {
    const answer = findFaqAnswer("when is the CMMC enforcement deadline");
    expect(answer, "Brain AI had no answer about the deadline").toBeTruthy();
    expect(answer!).toMatch(/suspend/i);
  });

  it("the free proof-of-value link is the zero-commitment ask, not a free tier", () => {
    // "Try the free scan" is honest — the in-browser snapshot needs no account
    // and sells nothing. It must point at the demo, never at signup or pricing.
    expect(PURCHASABLE_OFFER.tryHref).toBe("/demo#snapshot");
    expect(PURCHASABLE_OFFER.href).toBe("/pricing");
  });
});
