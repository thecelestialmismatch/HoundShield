# houndshield — Production Deployment Runbook

**Time to complete: ~30 minutes**
**Audience: Founder / ISSO running first production deploy**

---

## Pre-flight: What you need

- [ ] Supabase project at https://supabase.com (free tier works)
- [ ] Stripe account with products/prices created (test → live keys)
- [ ] Vercel account (hobby tier sufficient for launch)
- [ ] Domain `houndshield.com` pointed to Vercel

---

## Step 1 — Apply Supabase Migrations

All 9 migration files are in `supabase/migrations/`. They must be applied in order.

### Option A: Supabase CLI (recommended)

```bash
# Install CLI
brew install supabase/tap/supabase    # macOS
# or: npm i -g supabase

# Login
supabase login

# Link to your project (get project-ref from Supabase dashboard URL)
cd compliance-firewall-agent
supabase link --project-ref cxmewtvhsddwjrmvqjqf

# Push all migrations
supabase db push
```

Expected output: 9 migrations applied, no errors.

### Option B: Manual SQL Editor (if CLI fails)

1. Go to https://supabase.com/dashboard/project/cxmewtvhsddwjrmvqjqf/sql
2. Run each file in order:

```
001_initial_schema.sql          → compliance_events table + indexes
002_shieldready_schema.sql      → CMMC controls, assessments, gaps
003_profiles_and_subscriptions.sql  → profiles, subscriptions, usage_tracking
004_add_growth_tier.sql         → growth tier support
005_partner_applications.sql    → partner program table
006_blockchain_anchors.sql      → audit chain anchors
007_webhook_dlq.sql             → Stripe webhook dead-letter queue
008_custom_patterns.sql         → per-org custom detection patterns
009_zero_trust_and_sso.sql      → SSO + zero trust config
```

### Verify migrations applied

```sql
-- Run in Supabase SQL Editor
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables: `compliance_events`, `profiles`, `subscriptions`, `usage_tracking`,
`org_patterns`, `webhook_dlq`, `cmmc_controls`, `assessments`, and more.

### Fix signup "Failed to fetch"

In Supabase dashboard → Authentication → URL Configuration:
- **Site URL:** `https://houndshield.com`
- **Redirect URLs:** Add `https://houndshield.com/**` and `http://localhost:3000/**`

---

## Step 2 — Wire Stripe Webhook

The webhook handler at `/api/stripe/webhook` is already implemented and handles:
- `checkout.session.completed` → provisions subscription
- `customer.subscription.updated` → updates tier
- `customer.subscription.deleted` → downgrades to free
- `invoice.payment_failed` → marks past_due
- `invoice.paid` → restores active

**Your `STRIPE_WEBHOOK_SECRET` is already set in `.env.local`.**

Verify the webhook endpoint is registered:

1. Go to https://dashboard.stripe.com/test/webhooks (test) or `/webhooks` (live)
2. Find or create endpoint: `https://houndshield.com/api/stripe/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the signing secret → should match your `STRIPE_WEBHOOK_SECRET`

### Test the webhook (once deployed)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward to local for testing
stripe listen --forward-to localhost:3000/api/stripe/webhook

# In another terminal, trigger a test event
stripe trigger checkout.session.completed
```

Expected: `[Stripe Webhook] checkout.session.completed: user=... tier=pro status=active`

---

## Step 3 — Set Vercel Environment Variables

Go to https://vercel.com/thecelestialmismatch-9194s-projects/compliance-firewall-agent/settings/environment-variables

All variables from `.env.local` must be added for **Production** environment.
Critical ones (mark as **Production** + **Preview**):

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (service_role) |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys (use `sk_live_...` for production) |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → your endpoint → Signing secret |
| `ENCRYPTION_KEY` | Already set (keep same value) |
| `OPENROUTER_API_KEY` | https://openrouter.ai/keys |
| `RESEND_API_KEY` | https://resend.com/api-keys |

### Switch to live Stripe keys for production

When ready to charge real money:
1. Replace `sk_test_...` with `sk_live_...` in Vercel env vars
2. Create a **new** webhook endpoint at `https://houndshield.com/api/stripe/webhook` in the **live** Stripe dashboard
3. Update `STRIPE_WEBHOOK_SECRET` with the live webhook signing secret
4. Update all `STRIPE_*_PRICE_ID` vars with live price IDs

---

## Step 4 — Deploy to Vercel

```bash
# From compliance-firewall-agent/
npx vercel --prod

# Or push to main branch (auto-deploy if connected)
git push origin main
```

After deploy:
- Visit https://houndshield.com
- Sign up with a test account
- Verify dashboard loads
- Try a test checkout (use Stripe test card `4242 4242 4242 4242`)

---

## Step 5 — Smoke Test Checklist

```
[ ] https://houndshield.com loads (no errors)
[ ] /api/health returns 200
[ ] Signup creates a Supabase user + profiles row
[ ] Dashboard loads at /command-center
[ ] Stripe checkout → test card 4242 → subscription created
[ ] Webhook fires: check Supabase profiles.tier = 'pro'
[ ] PDF audit export works (GET /api/reports/generate)
[ ] Gateway intercept: POST /api/gateway/intercept with x-user-id header
[ ] robots.txt blocks /api/, /command-center/
[ ] sitemap.xml has 11 URLs
```

---

## Step 6 — Docker Local Deploy (for CMMC customers)

For defense contractors who need everything on-premises:

```bash
# Clone the repo on their server
git clone https://github.com/thecelestialmismatch/Kaelus.Online
cd Kaelus.Online/compliance-firewall-agent

# Copy and fill in their env vars
cp .env.local .env.docker

# Build and run
docker compose up -d

# Verify
curl http://localhost:3000/api/health
# → {"status":"ok","version":"1.0.0"}
```

Customer then sets in their AI tool config:
```
OPENAI_BASE_URL=http://localhost:3000/api/gateway/intercept
```

---

## Known Issues / Gotchas

| Issue | Root cause | Fix |
|-------|-----------|-----|
| Signup "Failed to fetch" | Supabase redirect URL not set | Add houndshield.com to Supabase Auth → URL Config |
| Webhook returns 400 | Wrong signing secret | Re-copy from Stripe dashboard → Webhooks → Signing secret |
| "Stripe not configured" on checkout | STRIPE_SECRET_KEY empty in Vercel | Add to Vercel env vars → redeploy |
| PDF export empty | Migrations not applied | Run `supabase db push` |
| images.unoptimized: true | Performance issue in next.config.js | Remove after launch once images are in /public |

