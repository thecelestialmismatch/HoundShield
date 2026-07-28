# Fix Checkout — 5 Minutes, Founder Only

**This is blocker #1. Until it is done, HoundShield cannot accept money from anyone.**

Nobody but you can do this. It is not a code change — it is two values pasted into
Vercel. No amount of engineering substitutes for it.

---

## What is wrong, in one sentence

Stripe shows you **two** keys that look almost identical. The **publishable** key
(`pk_live_…`) is visible by default. The **secret** key (`sk_live_…`) is hidden behind a
**Reveal** button. The publishable one was pasted into `STRIPE_SECRET_KEY`.

Check it yourself right now:

```bash
curl -s https://www.houndshield.com/api/health
```

If you see `"payments":"malformed_key"`, checkout is dead. The endpoint even tells you
why — it detects that the value starts with `pk_`.

---

## Fix 1 — the secret key (this one unblocks revenue)

1. Go to <https://dashboard.stripe.com/apikeys>
2. Confirm you are in **Live mode** — the toggle is top-right. Test mode keys start
   `sk_test_` and will not take real money.
3. Find the row **Secret key**. It shows dots, not the value.
4. Click **Reveal live key token**. Copy the value.
5. **Before pasting, look at it.** It must start with `sk_live_`.
   If it starts with `pk_`, you copied the wrong row — go back to step 3.
6. Go to <https://vercel.com> → project **compliance-firewall-agent** → **Settings** →
   **Environment Variables**.
7. Find `STRIPE_SECRET_KEY` → **Edit** → paste the `sk_live_…` value.
8. **Tick the `Production` checkbox.** This is the step people miss — a value saved only
   to Preview leaves production exactly as broken as before.
9. **Save**.
10. Go to **Deployments** → newest → **⋯** → **Redeploy**. Environment variables are
    baked in at build time; without a redeploy nothing changes.

---

## Fix 2 — the webhook secret (do it in the same sitting)

Without this, a customer's card can be charged and **no order is recorded and you get no
alert**. You would have their money and no idea who they are.

1. Go to <https://dashboard.stripe.com/webhooks>
2. **Add endpoint** → URL: `https://houndshield.com/api/stripe/webhook`
3. Under events, select **`checkout.session.completed`**.
4. Save, then open the endpoint and click **Reveal** under **Signing secret**.
   It starts with `whsec_`.
5. In Vercel → **Environment Variables** → **Add New**:
   - Name: `STRIPE_WEBHOOK_SECRET`
   - Value: the `whsec_…` value
   - **Tick `Production`**
6. **Save**, then **Redeploy** again.

---

## Verify — do not skip this

```bash
curl -s https://www.houndshield.com/api/health
```

**Passing looks like:**

```json
"payments":"connected"
"payments_webhook":"configured"
```

If `payments` still reads `malformed_key`, the value still starts with `pk_` — you
copied the publishable row again. If it reads `missing_key`, the Production checkbox was
not ticked, or you did not redeploy.

### Then buy your own product

The only test that counts. Use a real card:

1. Open <https://houndshield.com/pricing> in a private window.
2. Buy the $499 report.
3. Confirm all three: the charge appears in Stripe → a row appears in the `report_orders`
   table in Supabase → you receive the founder sale alert email.
4. Refund yourself in Stripe (Payments → the charge → **Refund**).

A purchase that charges but records no order means Fix 2 did not take. Go back to it.

---

## Why this matters more than any feature

The health endpoint has been reporting this failure, in plain English, with the fix
included, the entire time a 20-page command center was being built. Nothing else in the
roadmap produces a dollar until these two values are correct.

**Do this before you write or ask for another line of code.**
