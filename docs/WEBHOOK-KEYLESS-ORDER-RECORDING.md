# The $499 sale no longer depends on the Stripe secret key

**Shipped 2026-07-29.** Companion to `docs/GO-LIVE-STRIPE.md`.

## The hole this closed

Production on 2026-07-29 (`/api/health`):

```
payments:         missing_key
payments_webhook: missing_secret
```

That reads like "checkout is dead." It wasn't. `/api/stripe/report-checkout`
has carried a fallback rail since 2026-07-17: when `STRIPE_SECRET_KEY` is
missing or mis-pasted, retail buyers are redirected to the Stripe-hosted
**Payment Link**, which Stripe bills against the account directly and which no
env mistake in this app can take down. Verified live against production:

```bash
curl -sS -X POST https://www.houndshield.com/api/stripe/report-checkout \
  -H 'Content-Type: application/json' -d '{"vertical":"healthcare"}'
# {"url":"https://buy.stripe.com/…?client_reference_id=report-healthcare","rail":"payment_link"}
```

**So the storefront was open the whole time — but the till was not wired up.**

`POST /api/stripe/webhook` opened with:

```ts
if (!getStripeSecretKey() || !webhookSecret) {
  return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
}
```

A real buyer could pay $499 on the Payment Link and the webhook would answer
Stripe with **503**. Result: no `report_orders` row, no receipt to the buyer,
no founder sale alert. The money lands in Stripe and HoundShield never learns
of it. The one product Stage 1 exists to sell could be bought silently.

## Why the key was never needed

`stripe.webhooks.constructEvent()` is a **local HMAC check** over the raw body.
It uses the signing secret. It makes no network call and needs no API key.

`handleReportOrder()` reads the session off the event payload and writes to
Supabase. It never calls Stripe either.

Across the whole webhook there is exactly **one** Stripe API call —
`stripe.subscriptions.retrieve()` in the subscription branch:

```bash
grep -n "stripe\.\(subscriptions\|customers\|checkout\|invoices\)" \
  app/api/stripe/webhook/route.ts
# 225:  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
```

So the API key gated a path that never used it.

## The change

1. **The gate requires only `STRIPE_WEBHOOK_SECRET`.** Setting that one
   variable now makes the money path whole, regardless of the key's state.
2. **Subscription events acknowledge instead of failing.** Without a usable key
   the branch logs loudly and returns **2xx**. This matters: a non-2xx makes
   Stripe retry and eventually **disable the endpoint**, which would take the
   report-order path down with it — re-creating the very outage being fixed.
3. **`getStripe(secretKey)` takes the key explicitly.** stripe-node 22.x throws
   `Neither apiKey nor config.authenticator provided` on a falsy key (verified
   against the installed version), so key-free deliveries pass a placeholder
   used solely for signature verification. It is deliberately not `sk_`-shaped
   so it cannot trip a secret scanner or be misread as a credential.

## Operator impact

| `STRIPE_WEBHOOK_SECRET` | `STRIPE_SECRET_KEY` | $499 sale outcome |
|---|---|---|
| set | set | Full path: dynamic checkout, promo codes, branded thank-you page |
| **set** | **missing** | **Sells on the Payment Link · order recorded · buyer receipt · founder alert** |
| missing | either | Sells, but the sale is invisible — nothing recorded, nobody notified |

The second row is what this change created. It used to behave like the third.

`/api/health` hints were rewritten to match, because the diagnostics were the
only window the founder has and they still described the old behavior:

- `payments_hint` (key missing) now states the report **still sells** on the
  fallback rail, and names the webhook secret as what recovers the sale.
- `payments_webhook_hint` now states plainly that a buyer can pay right now and
  go unheard, and that the secret **does not depend on** the API key.

## Also removed: the orphaned subscription route

`app/api/stripe/checkout/route.ts` was deleted. Evidence it was dead:

- **Zero references repo-wide** — not a UI caller, not a doc, not a test.
- It sold `pro` / `growth` / `enterprise` / `agency` — tiers removed from
  `/pricing` in #243 when the page collapsed to the single $499 offer.
- Its docblock still claimed *"All prices match /pricing page exactly. No
  orphaned tiers."* That statement had become false.

It was a live POST endpoint that could create $199–$2,499/mo subscriptions with
a 14-day trial for plans the company does not sell — a second pricing grid
surviving in the API surface after being removed from the page.

`/api/stripe/portal` was **kept**: it manages existing subscriptions and has two
real callers (`app/command-center/settings/page.tsx`,
`app/partner/billing/page.tsx`). The rule being enforced is about *selling* new
recurring plans, not about abandoning anyone already on one.

A new guard, `app/api/stripe/__tests__/single-offer-api-surface.test.ts`, fails
if the route returns, if the Stripe route set changes, or if any route creates a
`mode: 'subscription'` session. The single-offer rule is now enforced on the API
surface, not just the page.

## Verification

| Gate | Result |
|---|---|
| App tests | **1538 passed** (baseline 1531), exit 0 |
| Discrimination check | Both new money-path tests **fail** against the old gate, pass against the new |
| `tsc --noEmit` | 0 errors |
| `eslint .` | 0 errors (40 pre-existing Next-16 warnings, none new) |
| `npm run build` | exit 0 — build output lists 3 Stripe routes, `checkout` gone |
| Proxy tests | 61 passed, exit 0 |
| `npm run bench` | p99 **0.481 ms** (budget 10 ms) |
| `npm run verify:structure` | PASS |

A passing test proves nothing if it also passes against the bug, so the new
tests were run against the old gate to confirm they discriminate:

```
× records the payment-link sale and alerts the founder with no API key set
× ACKNOWLEDGES (2xx) a subscription event it cannot expand, instead of failing
Tests  2 failed | 23 skipped (25)
```

## Founder action

Set **`STRIPE_WEBHOOK_SECRET`** in Vercel (Production) — Stripe → Developers →
Webhooks → Add endpoint `https://houndshield.com/api/stripe/webhook` → copy the
`whsec_` signing secret → redeploy. That single variable turns on order
recording, the buyer receipt, and the sale alert. `STRIPE_SECRET_KEY` remains
worth fixing (promo codes, branded thank-you page, subscription events) but no
longer blocks getting paid and knowing about it.

**Check Stripe → Payments first.** The Payment Link has been live and sellable
since 2026-07-17; the last confirmed "zero charges" read was that same day. Any
sale since then would have been recorded nowhere and answered by nobody.
