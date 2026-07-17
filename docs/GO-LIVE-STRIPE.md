# Go Live: take money for the $499 report

_Last updated 2026-07-17. Written for the founder — no code required. Follow top to bottom._

> **2026-07-17 (later) — buyers can pay again, via the fallback rail.**
> The site's $499 buttons no longer error while `STRIPE_SECRET_KEY` is broken:
> when dynamic checkout can't run, the button now sends the buyer to the
> Stripe-hosted **Payment Link** for the same $499 price —
> `https://buy.stripe.com/aFa00lgzIgJx3Aqb7qgUM00` (verified **active** against
> the live account by API on 2026-07-17; the 07-12 "expired" note is outdated).
> That page is hosted and billed by Stripe, so no Vercel env var can take it
> down. You can also paste that URL directly into outreach emails.
>
> **This does NOT replace Step 1 or Step 2 below.** The fallback rail has no
> promo codes and skips the /report/thank-you flow, wholesale ($299) still
> needs the real key — and above all, until `STRIPE_WEBHOOK_SECRET` lands
> (Step 2), a sale on EITHER rail is charged but never recorded in
> `report_orders` and no founder sale-alert email goes out. Watch the Stripe
> dashboard (or its merchant receipt emails) for sales until Step 2 is done.

> **2026-07-17 update — checkout is DOWN again, and it's a one-paste fix.**
> `/api/health` reads `payments: malformed_key`: the value in `STRIPE_SECRET_KEY`
> is set (107 characters) but starts with `pk_` — that's the **publishable** key,
> not the secret key. Stripe shows the two side by side and they look identical
> in length; the publishable one is visible by default, the **Secret key is the
> one hidden behind the "Reveal" button**. The fix:
> Stripe → **Developers → API keys** → row named **"Secret key"** → **Reveal** →
> copy → Vercel project **compliance-firewall-agent** → Settings → Environment
> Variables → `STRIPE_SECRET_KEY` (Production ticked) → paste → **check it starts
> with `sk_live_`** → Save → Redeploy. Health must read `payments: connected`.
> While you're in there, do Step 2 (the webhook secret) in the same sitting —
> health also still reads `payments_webhook: missing_secret`.
>
> Ground truth from the Stripe account itself (checked via API 2026-07-17): the
> $499 report price is live and active, and the account has **zero charges ever**
> — nobody has been able to pay yet. These two variables are the entire gap.

> **2026-07-14 update — the paste keeps "coming out empty":**
> 1. **Check you are in the right project.** Your Vercel team has TWO projects:
>    **`compliance-firewall-agent`** (this is houndshield.com — set the key HERE)
>    and `aibudgetguard` (a different product — a key set there does nothing for
>    HoundShield). This alone explains a paste that "never lands."
> 2. **Delete-and-recreate walkthrough:** Vercel → project
>    **compliance-firewall-agent** → Settings → Environment Variables → find any
>    row named `STRIPE_SECRET_KEY` → ⋯ → **Delete** (repeat until none remain) →
>    **Add New** → Key: `STRIPE_SECRET_KEY` → Value: paste the key → make sure
>    the **Production** checkbox is ticked → Save → Deployments tab → ⋯ on the
>    newest deployment → **Redeploy**. (Note: after saving, Vercel HIDES the
>    value — the field looking "empty" when you reopen it is normal and does NOT
>    mean it saved empty.)
> 3. **The app now forgives messy pastes.** Quotes, spaces, trailing newlines,
>    invisible characters from a password manager, even pasting the whole
>    `STRIPE_SECRET_KEY=sk_live_…` line into the value box — all auto-cleaned.
> 4. **The health check now tells you exactly what's wrong.** Open
>    `https://www.houndshield.com/api/health`: `payments` reads `connected`,
>    `missing_key` (not set / wrong project / Production unticked), or
>    `malformed_key` (set, but the value isn't a Stripe secret key — e.g. you
>    pasted the publishable `pk_` key). A `payments_hint` field spells out the fix.

The $499 **CMMC AI Risk Assessment Report** is the Stage-1 product. The site, the
checkout button, the thank-you page, the order database, and the emails are all
built and shipped. The **only** thing standing between you and a live sale is
connecting Stripe. This is a dashboard task, not a coding task.

---

## Where you are right now

**⚠️ STEP 1 REGRESSED on ~2026-07-16 — redo it with the SECRET key.**
It *was* green on 2026-07-14 (the full buyer flow reached a live
`checkout.stripe.com` page showing "CMMC AI Risk Assessment Report — $499.00"),
so everything downstream is proven to work. Then the key was re-pasted and the
**publishable `pk_live_` key** landed in `STRIPE_SECRET_KEY` — both keys are the
same length, so the mistake is invisible unless you check the prefix. Health now
reads:

```json
"payments": "malformed_key"
```

The `payments_hint` field on `https://www.houndshield.com/api/health` now names
this exact mistake and the fix. Rule of thumb forever: **the value you paste
into `STRIPE_SECRET_KEY` must start with `sk_live_` — look at the first eight
characters before you hit Save.**

**Step 2 (the webhook) is equally urgent and still open.** Until
`STRIPE_WEBHOOK_SECRET` is set, a card can be charged but the order is never
recorded and no "go fulfill this" alert is sent — you'd only find out from
Stripe's own dashboard. The health endpoint now reports this too:

```json
"payments_webhook": "configured"   ← what you want
"payments_webhook": "missing_secret" + payments_webhook_hint   ← do Step 2
```

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
`docs/OUTREACH-PACK.md` (direct cold emails: healthcare / legal / defense, plus
the how-to-send steps) and `docs/EMAIL-SEQUENCES.md` (the RPO/MSP partner
3-touch sequence). Start with Healthcare or Legal (fastest close, no FedRAMP
blocker).

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
