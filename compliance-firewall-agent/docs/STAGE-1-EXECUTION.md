# Stage 1 Execution — $499 Report + RPO/MSP Channel

> Mission: FIRST REVENUE. Stage 1 milestone by **2026-06-25**:
> ≥3 paid **$499 CMMC AI Risk Assessment Reports** + ≥1 **RPO/MSP signed referral agreement**.

This document records what shipped to make the $499 report sellable and to bring the
site in line with the compass-corrected doctrine.

## What shipped

### Revenue rail (the $499 report is purchasable end-to-end)
- **`POST /api/stripe/report-checkout`** — one-time (`mode: 'payment'`) Stripe Checkout for the
  $499 report. No Supabase auth required (a $499 PO is an impulse buy; signup friction kills it).
  Uses `STRIPE_REPORT_PRICE_ID` if set, otherwise builds an inline $499 price so the product
  sells **before** the dashboard SKU exists. Wholesale ($299) is gated behind a `partner_ref`.
- **Stripe webhook** — `checkout.session.completed` now branches on `mode === 'payment'`:
  records a row in `report_orders` and sends the fulfillment email. The subscription path is
  untouched.
- **`report_orders` table** (migration `014_report_orders.sql`) — service-role writes only,
  RLS-locked. Tracks email, amount, vertical, partner attribution, wholesale flag, fulfillment status.
- **`reportOrderEmail`** — receipt + 14-day onboarding (deploy Mode B → signed PDF). Carries the
  CUI / Mode-B disclosure.
- **`/report/thank-you`** — post-checkout success page with the 14-day path and Mode-B notice.

### Pricing page (one grid, $499 report is the hero)
- $499 report hero card at the top with its own checkout button.
- Subscriptions reframed as "add continuous monitoring" (Stage 2), not the lead.
- **Removed fabricated metrics** ("2M+ scans", "500+ teams") — replaced the stats bar with the
  honest deployment-modes notice. (NEVER DO list: no fictional metrics.)

### Architecture honesty (Mode-B / Vercel boundary)
- **`<ModeBNotice />`** reusable component (`full` + `inline` variants) stating: CUI-safe = Mode B
  (Docker on your infra); the hosted Vercel trial is **not FedRAMP-authorized**, non-CUI eval only.
- Placed on **/pricing**, **/security**, **/partners**, and **/report/thank-you**.

### Brain AI CUI warning (mandatory disclosure now live)
- `GlobalChat` shows a persistent warning above the input: *"Do not input CUI, PHI, or PII.
  Brain AI routes to a commercial cloud endpoint (not FedRAMP-authorized)."*
- System prompt corrected to lead with the $499 report and the three deployment modes.

### RPO/MSP channel (NOT C3PAOs)
- **`/partners`** rewritten: C3PAO-endorsement framing removed (a C3PAO can't recommend tools to
  clients it assesses). Now leads with the $499 report co-brand ($299 wholesale / 40% referral),
  with an explicit C3PAO-exclusion note.
- NavV3 "C3PAO Referral" item → "RPO / MSP Referral".
- **`docs/gtm/rpo-outreach-list.md`** — 7 named targets + sourcing + message frame + tracking.

### Docker (Mode B distribution)
- **`.github/workflows/docker-publish.yml`** — builds `proxy/Dockerfile` on every proxy PR (so it
  can't silently break) and publishes `houndshield/proxy:latest` on a `proxy-v*` tag once
  `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` secrets are set.

## Config required to go live (founder / ops)

| Item | Where | Status |
|------|-------|--------|
| `STRIPE_SECRET_KEY` | Vercel env | required (already used by subscriptions) |
| `STRIPE_REPORT_PRICE_ID` | Vercel env | optional — inline $499 price works without it |
| `STRIPE_WEBHOOK_SECRET` | Vercel env | required for fulfillment |
| `RESEND_API_KEY` | Vercel env | required for the fulfillment email (best-effort) |
| Migration `014_report_orders` | `npx supabase db push` | apply to prod |
| `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` | GitHub secrets | needed to publish the image |

## How to verify the report path locally

1. Set `STRIPE_SECRET_KEY` (test mode) in `.env.local`.
2. `POST /api/stripe/report-checkout` with `{}` → returns a Stripe Checkout `url`.
3. Complete test checkout → webhook records a `report_orders` row + sends the email (if Resend set).
4. Land on `/report/thank-you`.

## Not in scope for Stage 1 (deliberately deferred)
- Subscription tiers stay live as Stage 2; no second pricing grid was introduced.
- The actual 14-day PDF generation already exists (`/api/reports/generate`); wiring per-order
  delivery automation is Stage 2 ops.
