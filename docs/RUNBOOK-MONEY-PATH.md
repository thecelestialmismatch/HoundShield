# Runbook: the money path

**How a $499 CMMC AI Risk Assessment Report turns into a row, a receipt and an
alert — and every way that can fail.**

Companion to `docs/GO-LIVE-STRIPE.md` (the setup steps) and
`docs/WEBHOOK-KEYLESS-ORDER-RECORDING.md` (why the webhook stopped needing the
API key, 2026-07-29). This document is the layer above both: it describes the
whole path, names the failure modes, and says what to do about each one.

Shipped 2026-09-02.

---

## The path

```
Buyer clicks "Buy the $499 report"
        │
        ├── STRIPE_SECRET_KEY usable ──→ dynamic Checkout Session
        │                                 (promo codes, /report/thank-you)
        └── key missing/mis-pasted ────→ Stripe-hosted Payment Link
                                          (buy.stripe.com/…, always live)
        │
        ▼
   Stripe charges the card.  ← the money is now real, whatever happens next
        │
        ├── RAIL 1 (seconds): POST /api/stripe/webhook
        │      needs STRIPE_WEBHOOK_SECRET only
        │      → report_orders row · buyer receipt · founder sale alert
        │
        └── RAIL 2 (≤24h):    GET /api/cron/reconcile-orders   [daily 15:00 UTC]
               needs STRIPE_SECRET_KEY + CRON_SECRET
               → re-reads paid Checkout Sessions out of Stripe
               → replays anything rail 1 missed through the SAME recorder
               → founder alert marked "RECOVERED: webhook did not deliver"
               → also reconciles refunds rail 1 missed
```

Both rails call one function — `recordReportOrder()` in
`lib/stripe/report-fulfillment.ts`. There is no second definition of what a
report order is, and `lib/stripe/__tests__/report-fulfillment.test.ts` fails if
a route grows one.

### Why rail 2 exists

Before 2026-09-02, rail 1 was the only rail. `STRIPE_WEBHOOK_SECRET` unset
means `POST /api/stripe/webhook` answers **503 to every delivery**: no order
row, no buyer receipt, no founder alert — and after enough failed deliveries
Stripe **disables the endpoint**, so the hole widens quietly. A real customer
could pay $499 and nobody would ever know. That single env var was a single
point of failure for the company's only product.

Rail 2 removes the single point of failure. Worst case a sale is recorded and
alerted **late**, not never.

---

## Configuration matrix

| `STRIPE_WEBHOOK_SECRET` | `STRIPE_SECRET_KEY` | `CRON_SECRET` | What happens to a $499 sale |
|---|---|---|---|
| set | set | set | **Whole.** Recorded in seconds, reconciler is a silent no-op. |
| set | missing | any | Sells on the Payment Link, recorded in seconds. No promo codes, Stripe's hosted confirmation instead of `/report/thank-you`. Reconciler cannot run (no key) — acceptable, because rail 1 works. |
| **missing** | **set** | **set** | **Recovered within 24h** by the reconciler. Founder alert says RECOVERED. This is the row rail 2 was built for. |
| missing | missing | any | **Invisible.** Sells on the Payment Link; nothing records it. Neither rail can see it. Check Stripe → Payments by hand. |
| any | any | missing | Reconciler returns 503 and never runs. Vercel sets `CRON_SECRET` automatically for scheduled invocations, so this only happens if it was explicitly removed. |

Row 4 is the only remaining silent state, and it needs **both** variables to be
absent. Setting **either one** makes a sale visible.

---

## Failure modes and what to do

### "I think someone bought and I never heard about it"

1. Stripe → Payments. That is the source of truth for money; nothing in this
   app can hide a charge from it.
2. Run the reconciler by hand over a wide window (see below). Any paid session
   with no `report_orders` row is recorded and alerted on the spot.
3. If it recovers something, the webhook is broken — fix it (next section).

### The webhook is not recording sales

Symptom: reconciler recoveries with a `RECOVERED` subject line, or Stripe →
Developers → Webhooks showing failed deliveries.

Fix: Stripe → Developers → Webhooks → the
`https://www.houndshield.com/api/stripe/webhook` endpoint → Signing secret →
Reveal → paste into Vercel (`compliance-firewall-agent` → Settings →
Environment Variables, **Production** ticked) → redeploy.

Note the `www`. The apex host 308-redirects, and Stripe counts a non-2xx as a
failed delivery — enough of them and Stripe disables the endpoint.

If deliveries were already failing, **replay them**: Stripe → Developers →
Webhooks → the endpoint → Events → resend. Or just let the reconciler pick
them up on its next run; it looks back 30 days.

### The reconciler is not running

Symptom: no `[reconcile-orders]` lines in Vercel logs around 15:00 UTC.

- Vercel Hobby runs crons approximately, not exactly, once a day. A few hours'
  drift is normal; a missing day is not.
- Check `CRON_SECRET` exists in Vercel (Production).
- Check the cron is registered in `compliance-firewall-agent/vercel.json`.
- Vercel Hobby allows **2 cron jobs**. There are exactly 2 (`email-drip`,
  `reconcile-orders`). A third would be rejected at deploy time.

### Running the reconciler by hand

```bash
# Normal window (30 days)
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  https://www.houndshield.com/api/cron/reconcile-orders | jq

# Deep sweep after fixing a long-broken webhook (max 90 days)
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.houndshield.com/api/cron/reconcile-orders?days=90" | jq

# Force the degraded-money-path alert on a non-Monday, to test delivery
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.houndshield.com/api/cron/reconcile-orders?alert=force" | jq
```

Response shape:

```json
{
  "ok": true,
  "windowDays": 30,
  "scanned": 12,          // Checkout Sessions Stripe returned in the window
  "reportSessions": 3,    // of those, paid $499 report sales
  "recovered": 1,         // sales rail 1 had never recorded  ← the number that matters
  "recoveredSessionIds": ["cs_live_…"],
  "reversed": 0,          // refunds rail 1 had never applied
  "reversedPaymentIntentIds": [],
  "errors": [],
  "moneyPath": { "keyOk": true, "webhookOk": false, "degraded": true, "…": "…" },
  "alerted": false
}
```

`recovered` counts only sales that were genuinely unseen. Re-running the same
window tomorrow returns `recovered: 0` — the daily re-scan cannot inflate it.

---

## The weekly alarm

While the money path is degraded, the reconciler emails the founder **once a
week** (Mondays, UTC) with which rail is broken and the exact fix. It stops the
moment the variables are set. It is not a marketing message and carries no
unsubscribe link — an operator should not be able to mute their own outage
alarm.

Why weekly and not daily: a daily nag for a five-minute fix gets filtered
within a week, and then the alarm is worth nothing. Why not "on state change":
that needs storage this app does not have, and a stateless weekday check is
exactly one alert per week with no table to keep correct.

---

## Invariants (each one has a test that fails if it breaks)

| Invariant | Test |
|---|---|
| A paid sale is recorded and alerted **exactly once, ever** | `report-fulfillment.test.ts` → idempotency |
| Re-scanning the same window recovers nothing twice | `reconcile-orders/route.test.ts` → "counts nothing on the second run" |
| A fulfillment status is never walked backwards | `report-fulfillment.test.ts` → "never walks a fulfillment status backwards" |
| A database outage still alerts the founder | `report-fulfillment.test.ts` → "still emails the founder when the database write fails" |
| ACH/SEPA authorisations are not counted as paid | both suites |
| A partial refund does not erase a sale from revenue | `reconcile-orders/route.test.ts` → "leaves a PARTIAL refund counted" |
| Both rails share one recorder | `report-fulfillment.test.ts` → "one definition, two rails" |
| The buyer's address is never logged unmasked | `report-fulfillment.test.ts` |
| The reconciler is not open to the internet | `reconcile-orders/route.test.ts` → auth |

Each of these was confirmed to *discriminate* — the test was run against a
deliberately broken version of the code and failed, before being trusted. A
test that also passes against the bug is not a test.

---

## What this does NOT fix

- **It does not take a payment.** Both rails are about *knowing* about money.
  Zero paid customers is a demand problem, not a plumbing one.
- **It does not make the hosted plane CUI-safe.** Vercel is not FedRAMP
  authorised; the CUI claim holds in Mode B (Docker) only.
- **It cannot see a sale with both variables unset.** See row 4 of the matrix.
