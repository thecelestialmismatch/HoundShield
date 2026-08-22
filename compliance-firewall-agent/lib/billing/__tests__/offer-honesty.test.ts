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

/*
 * Surfaces that quote price autonomously, plus every public page and
 * component.
 *
 * The original scope was the three automated surfaces below. That was too
 * narrow, and the gap was not theoretical: the site-wide nav flyout kept
 * quoting four monthly tiers (Free/$199/$499/$999) on EVERY page, each row
 * linking to a /pricing that sells none of them. A browser check caught it;
 * this suite did not, because components/layout was outside the net.
 */
const SALES_SURFACES = [
  join(ROOT, "lib", "brain-ai"),
  join(ROOT, "lib", "email", "templates"),
  join(ROOT, "app"),
  join(ROOT, "components"),
];

/*
 * Files allowed to contain a monthly price, each for a stated reason. This is
 * a named allowlist rather than a looser regex on purpose: relaxing the
 * pattern would silently re-admit the whole class of defect this guard exists
 * to catch.
 *
 * Anything added here needs a reason that survives being read aloud to a
 * buyer.
 */
const MONTHLY_PRICE_ALLOWED = new Map<string, string>([
  // app/api/stripe/checkout/route.ts was allowlisted here for its header comment
  // documenting the dormant subscription SKUs. PR #244 deleted the route as a
  // second pricing grid surviving in the API surface, and the allowlist-rot test
  // below caught the stale entry on the very next run. Left as a comment because
  // the deletion is the point: there is no longer any route that sells a tier.
  [
    "app/pricing/page.tsx",
    "Header comment explaining WHY the monthly grid was removed. Deleting the explanation invites someone to add the grid back. The page body is guarded by pricing-single-offer.test.tsx.",
  ],
  [
    "components/dashboard/ReportsPanel.tsx",
    "Authenticated in-product upsell. Telling a logged-in user which tier unlocks a locked feature is the honest form of a paywall — it quotes a tier, it does not promise a public price.",
  ],
  // app/partner/billing/page.tsx was allowlisted here for "a separate per-client
  // rate card ($75/client/mo) unrelated to the public offer", flagged for
  // reconciliation and then left alone. The entry was doing the opposite of its
  // job: it made a whole invented recurring pricing model — $75/$65/$55 volume
  // tiers, a "Next Invoice" date computed as today + 1 month, "billed
  // automatically via Stripe" — permanently invisible to this guard, on the one
  // surface read by a partner who has already signed something else. Its own
  // reason text had gone stale too, citing a "$299 wholesale model" that the
  // 2026-08-19 founder ruling replaced with the flat $100 discount.
  //
  // Reconciled 2026-08-22: the page now reads its numbers from
  // lib/pricing/plans.ts and quotes one-time-per-report economics only, so
  // nothing needs excusing. `partner-offer-coherence.test.ts` bans the recurring
  // shape from every partner surface, dashboard included.
]);

/*
 * Files allowed to mention a trial. A dated changelog is a historical record;
 * rewriting it to match today's offer would be falsifying the past, the same
 * reason the blog posts got a dated correction note instead of a silent edit.
 */
const TRIAL_ALLOWED = new Map<string, string>([
  [
    "app/changelog/page.tsx",
    "Dated release-history entry (January 2026). A changelog records what shipped then, not what we sell now.",
  ],
]);

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

/**
 * A trial is always false: a trial implies a paid plan you are trying before
 * buying, and there is no purchasable subscription to try.
 */
const TRIAL_PROMISE = /free trial|trial period|\d+[- ]day (?:free |no[- ]charge )?trial/i;

/**
 * "start free" / "no credit card" is NOT in the list above, deliberately.
 * ENTITLEMENTS.free is a real record — it grants aiGateway, 1,000 scans and a
 * seat for $0, and signup takes no card. A public page saying so is telling
 * the truth. What must never happen is an AUTOMATED price-quoting surface
 * dangling it as the offer, which is why this pattern still applies to the
 * chat and email surfaces below.
 */
const FREE_TIER_PROMISE = /no credit card|start free/i;

/** The surfaces that answer "how much?" with no human in the loop. */
const AUTOMATED_QUOTING = [
  join(ROOT, "lib", "brain-ai"),
  join(ROOT, "lib", "email", "templates"),
  join(ROOT, "components", "GlobalChat.tsx"),
];

/** Files flagged by `pattern`, minus those the allowlist excuses by name. */
function violations(files: string[], pattern: RegExp, allowed: Map<string, string>): string[] {
  return files
    .filter((f) => pattern.test(readFileSync(f, "utf8")))
    .map((f) => f.replace(ROOT + "/", ""))
    .filter((rel) => !allowed.has(rel));
}

describe("sales surfaces quote only the offer we can sell", () => {
  const files = SALES_SURFACES.flatMap((t) => collect(t));

  it("scans every public page and component, not just the chat surfaces", () => {
    // Guards the guard: a scan that silently walked nothing would pass every
    // assertion below. The nav is named explicitly because it is the file
    // that slipped through the original, narrower scope.
    expect(files.length).toBeGreaterThan(200);
    expect(files.some((f) => f.endsWith(join("layout", "NavV3.tsx")))).toBe(true);
    expect(files.some((f) => f.endsWith("GlobalChat.tsx"))).toBe(true);
    expect(files.some((f) => f.includes(join("brain-ai", "faq.ts")))).toBe(true);
  });

  it("every allowlist entry still exists and still needs excusing", () => {
    // An allowlist that outlives its reason is how a guard rots. If a file is
    // renamed, or someone removes the price it was excused for, the entry
    // must go too.
    for (const [rel, reason] of [...MONTHLY_PRICE_ALLOWED, ...TRIAL_ALLOWED]) {
      expect(reason.length, `${rel} needs a real reason`).toBeGreaterThan(40);
      const match = files.find((f) => f.replace(ROOT + "/", "") === rel);
      expect(match, `allowlisted file no longer exists: ${rel}`).toBeTruthy();
    }
    for (const [rel] of MONTHLY_PRICE_ALLOWED) {
      const src = readFileSync(join(ROOT, rel), "utf8");
      expect(MONTHLY_PRICE.test(src), `${rel} no longer needs its allowlist entry`).toBe(true);
    }
  });

  it("quotes no monthly HoundShield price", () => {
    const bad = violations(files, MONTHLY_PRICE, MONTHLY_PRICE_ALLOWED);
    expect(bad, `quotes an unsellable monthly price: ${bad.join(", ")}`).toEqual([]);
  });

  it("promises no trial of a plan that cannot be bought", () => {
    const bad = violations(files, TRIAL_PROMISE, TRIAL_ALLOWED);
    expect(bad, `promises a trial we do not sell: ${bad.join(", ")}`).toEqual([]);
  });

  it("automated quoting surfaces dangle no free tier", () => {
    const automated = AUTOMATED_QUOTING.flatMap((t) => collect(t));
    const bad = violations(automated, FREE_TIER_PROMISE, new Map());
    expect(bad, `chat/email surface offers a free tier as the deal: ${bad.join(", ")}`).toEqual([]);
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
