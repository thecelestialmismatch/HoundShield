# Live Production Audit — 2026-08-15

**First audit of the real site since production started deploying again.** Every
finding below was read from `https://www.houndshield.com` in production, not from
a build, a test, or the repository. Where something could not be checked from
this container, it says so.

Context that makes this urgent: the Sep 1 kill gate is **17 days out** and reads
TRUE on two of three criteria (0 paid customers, 0 signed partners). Production
was undeployable from #288 until today, so the site below has effectively never
been in front of a buyer.

---

## BOTTOM LINE

**The $499 report is sellable right now, and a sale would be silently lost.**
`/api/health` says so in its own words:

> *"A buyer CAN pay right now and you would never hear about it: no order
> recorded, no receipt to the buyer, no sale alert to you."*

That is the single highest-value fix on this list, it costs one environment
variable, and it does not depend on anything else being done first.

---

## 1. Revenue path — WORKS, but sales fall on the floor

`/pricing` returns 200 and shows exactly one grid: **$499 one-time** (20
mentions), plus `$299` wholesale for partners. No competing subscription tier is
live, which matches the Stage 1 rule in `CLAUDE.md`. Good.

The buy rail does not depend on `STRIPE_SECRET_KEY`: `lib/stripe/` falls back to
a hardcoded, test-guarded Stripe Payment Link
(`buy.stripe.com/aFa00lgzIgJx3Aqb7qgUM00`), and
`lib/stripe/__tests__/report-payment-link.test.ts` enforces that a bad override
degrades to the known-good link rather than emitting a phishing URL.

**So money can be taken. What is missing is everything after the payment:**

| Missing | Consequence |
|---|---|
| `STRIPE_WEBHOOK_SECRET` | No order recorded · no receipt to the buyer · no alert to you |
| `STRIPE_SECRET_KEY` | No promo codes · no branded `/report/thank-you` · no subscription events |

**Not verified from here:** whether that Payment Link is still live and priced at
$499 in the Stripe dashboard — `buy.stripe.com` is blocked by this container's
egress policy. **Open it once in a browser before sending any traffic.** A dead
or mispriced link is the one failure mode that would make everything else here
moot.

## 2. Security controls that are silently inert

Two are worth separating from the "not configured yet" noise, because they look
enabled from outside and are not:

- **`captcha: not_configured`** — `TURNSTILE_SECRET_KEY` is unset, and
  `verifyCaptcha()` **returns true for every token**. The CAPTCHA escalation
  after repeated auth failures is a no-op today. Rate limiting and lockout *are*
  live (`rate_limit_store: shared`, `auth_lockout_store: enforcing`), so this is
  a weakened layer rather than an open door — but it is the layer that stops a
  patient attacker.
- **`quarantine_encryption: unavailable`** — `ENCRYPTION_KEY` is missing or not
  64 hex chars. This one **fails closed**: quarantine writes are refused rather
  than storing a flagged prompt unencrypted. Correct behaviour, but the
  quarantine feature is effectively dead until the key exists. Generate with
  `openssl rand -hex 32`.

## 3. Middleware is confirmed executing

The `#288` fix is verified live, not assumed. `/api/health` returns a full CSP,
HSTS, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and
`x-ratelimit-limit: 60` / `x-ratelimit-remaining: 59`. Rate-limit headers can
only come from middleware, so the 2026-07-29 finding is closed by observation.

## 4. Email — correctly dark, in the right order

`marketing_email: disabled` and `marketing_opt_out_store: missing_migration`.
Both are the **correct** state today: the CAN-SPAM gate fails closed rather than
sending mail without a postal address, and the opt-out column does not exist yet.

**Order matters and is easy to get backwards.** Apply migration
`034_marketing_opt_out.sql` **BEFORE** setting `MARKETING_POSTAL_ADDRESS`. Doing
it the other way opens the gate onto a column that does not exist, and every drip
run throws while looking configured from outside.

## 5. The partner offer contradicts itself — LIVE

Verified on the deployed page, not just in source:

| Surface | Offer |
|---|---|
| `https://www.houndshield.com/partners` (live) | **20% revenue share** (×2) |
| `CLAUDE.md:108` | **40–50% revenue share** |

Any partner reading the site today gets a number less than half what the channel
strategy directs. Sources put managed-DLP gross margin at 60–70%
(`docs/gtm/MSP-CHANNEL-RESEARCH.md`), so 20% is the likelier reason a partner
declines. **Founder decision — deliberately not resolved in code**, because
picking one silently would set channel economics by side effect.

---

## Founder action list, ordered by revenue impact

Every item is a dashboard or SQL action. None requires a code change.

1. **`STRIPE_WEBHOOK_SECRET`** → Stripe: Developers → Webhooks → Add endpoint
   `https://www.houndshield.com/api/stripe/webhook`, copy the `whsec_` secret into
   Vercel (Production checked), redeploy. *Stops sales being lost. Highest value,
   no dependencies.*
2. **Open the Payment Link in a browser** and confirm it is live at $499.
   *Cannot be checked from CI; one dead link makes items 1 and 3 pointless.*
3. **Settle 20% vs 40–50%** before any partner outreach. *Free, and it poisons
   every conversation while it stands.*
4. **Apply migration `034`**, then set **`MARKETING_POSTAL_ADDRESS`** — in that
   order.
5. **`ENCRYPTION_KEY`** = `openssl rand -hex 32`. *Revives quarantine.*
6. **`TURNSTILE_SECRET_KEY`**. *Makes CAPTCHA escalation real.*
7. **`STRIPE_SECRET_KEY`**. *Promo codes and the branded thank-you page.*
8. `NEXT_PUBLIC_APP_URL` — cosmetic; links already fall back correctly.

## What this audit does NOT establish

- That anyone wants to buy. The site works; that is not the same as demand, and
  the kill gate measures demand.
- That the Payment Link is live (egress-blocked, see item 2).
- Anything about the proxy product in a customer environment — this audit covers
  the Vercel marketing/dashboard plane only, which is **not** the CUI data path.
