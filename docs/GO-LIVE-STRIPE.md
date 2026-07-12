# Go Live: take money for the $499 report

_Last updated 2026-07-12. Written for the founder — no code required. Follow top to bottom._

The $499 **CMMC AI Risk Assessment Report** is the Stage-1 product. The site, the
checkout button, the thank-you page, the order database, and the emails are all
built and shipped. The **only** thing standing between you and a live sale is
connecting Stripe. This is a dashboard task, not a coding task.

---

## Where you are right now

`https://www.houndshield.com/api/health` reports:

```json
"payments": "missing_key"
```

You said you added the Stripe secret key — but prod already redeployed after that
(the health endpoint shows a fresh boot) and it **still** reads `missing_key`.

**So "add the key and redeploy" is already done and it didn't take.** That rules
out the usual cause. It is now one of exactly three things (see Step 1). This is
the single most important fix on the whole project — do it first.

---

## Step 1 — Make `STRIPE_SECRET_KEY` actually land (fixes `missing_key`)

The code reads an environment variable named **exactly** `STRIPE_SECRET_KEY`.
In the **Vercel dashboard** → your project → **Settings → Environment Variables**,
check all three of these — one of them is why it isn't working:

1. **Scope is Production.** The variable must be enabled for the **Production**
   environment, not only Preview/Development. If the checkbox for Production
   isn't ticked, prod can't see it. This is the most common cause.
2. **Name is exact.** It must be `STRIPE_SECRET_KEY` — not `STRIPE_KEY`,
   `STRIPE_SECRET`, `STRIPE_SECRET_KEY ` (trailing space), or lowercase. Any
   difference = invisible to the app.
3. **Value is clean.** The value should start with `sk_live_` (or `sk_test_` while
   testing) with **no surrounding quotes and no leading/trailing spaces**. Paste
   it raw. If you wrapped it in `"..."`, remove the quotes.

Then **redeploy** (Vercel → Deployments → ⋯ on the latest → **Redeploy**).
Environment variables only take effect on the next deployment.

### Verify it worked
Open `https://www.houndshield.com/api/health` and confirm:

```json
"payments": "connected"
```

If it still says `missing_key`, it's still one of the three above — recheck scope
first. Do not move on until this says `connected`.

> **Good news:** you do **not** need to create a Stripe product first. The
> checkout builds the $499 price inline, so `STRIPE_SECRET_KEY` alone is enough to
> charge a card. (Optional polish later: create a $499 product in Stripe and set
> `STRIPE_REPORT_PRICE_ID` to its price ID.)

---

## Step 2 — Register the webhook (so paid orders get recorded + you get alerted)

Charging a card works with Step 1 alone. But to **record the order** and **email
you "go fulfill this,"** Stripe has to notify the app when a payment completes.

In the **Stripe dashboard** → **Developers → Webhooks → Add endpoint**:

- **Endpoint URL:** `https://houndshield.com/api/stripe/webhook`
- **Events to send:** at minimum `checkout.session.completed`. For the
  subscription tiers later, also add `customer.subscription.updated`,
  `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.
- Click **Add endpoint**, then copy the **Signing secret** (starts with `whsec_`).

Back in **Vercel → Settings → Environment Variables**, add (Production scope):

- `STRIPE_WEBHOOK_SECRET` = the `whsec_...` value you just copied.

Then **redeploy** again.

Without this step, a card still gets charged, but no order row is written and no
email goes out — so **do this before taking a real payment.**

---

## Step 3 — Set who gets the "you made a sale" alert

The report is fulfilled **by hand** (you run the 14-day assessment and generate
the PDF). So when a sale lands, the app emails you an actionable alert — buyer,
vertical, retail vs wholesale, and "start their 14-day assessment."

In **Vercel → Settings → Environment Variables** (Production scope):

- `FOUNDER_EMAIL` = the inbox you want sale alerts sent to.

If you skip this, alerts go to `contact@houndshield.com` by default. Email sending
also requires `RESEND_API_KEY` to be set (it already is, per the health check /
your contact form working). Stripe **also** emails you its own generic receipt —
this alert is the version that tells you what to *do*.

---

## Step 4 — Do a test run before going live

1. In Stripe, switch to **Test mode** (toggle, top of the dashboard).
2. Temporarily set `STRIPE_SECRET_KEY` to your **test** key (`sk_test_...`) and use
   the test webhook signing secret. Redeploy.
3. Go to `https://houndshield.com/pricing`, click **Get your $499 report**.
4. Pay with Stripe's test card: **`4242 4242 4242 4242`**, any future expiry, any
   CVC, any ZIP.
5. Confirm all four:
   - You land on the **thank-you** page.
   - You (as the buyer email) get the **order-confirmed** email.
   - **You (`FOUNDER_EMAIL`)** get the **"💰 $499 CMMC report sold"** alert.
   - Stripe → Payments shows the test charge.
6. Switch back to **Live mode** and swap the env vars to your `sk_live_` key and
   the live webhook secret. Redeploy. You're taking real money.

---

## While Stripe is still off: don't wait to sell

You do **not** need Stripe live to close your first customer. If someone says yes:

- Send them a **Stripe Payment Link** (create one in the Stripe dashboard in two
  minutes — no code), **or**
- Send a **manual invoice** for $499.

Get the yes first. The outreach emails to send are in
`scratchpad/outreach-pack.md`. Start with Healthcare or Legal (fastest close, no
FedRAMP blocker).

---

## What "done" looks like

| Check | How to confirm |
|-------|----------------|
| Key is live | `/api/health` → `"payments": "connected"` |
| Webhook registered | Stripe → Webhooks shows the endpoint, recent deliveries `200` |
| Alert wired | Test purchase → you receive the "💰 sold" email |
| Can charge | Test card `4242...` completes → thank-you page |

Once all four are green, a visitor can buy the $499 report end-to-end and you'll
know the moment it happens.
