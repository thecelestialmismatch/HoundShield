# HoundShield — Operation HOUND Audit
**Date:** 2026-05-07 | **Branch:** claude/romantic-dewdney-ca6898

---

## CRITICAL BLOCKERS (Revenue is literally blocked)

### B1 — Stripe Webhook URL (CRITICAL)
- **Problem:** Webhook endpoint at dashboard.stripe.com still points to houndshield.com, not houndshield.com
- **Impact:** Zero subscriptions complete in production. Every payment attempt = silent failure.
- **File:** `compliance-firewall-agent/app/api/stripe/webhook/route.ts` (logic is correct, URL is wrong)
- **Fix:** Manual step — update at dashboard.stripe.com/webhooks → `https://houndshield.com/api/stripe/webhook`
- **Also:** Set `STRIPE_WEBHOOK_SECRET` in Vercel dashboard if not already set

### B2 — Three-Way Pricing Incoherence (CRITICAL)
- **Problem:** Three conflicting pricing structures exist simultaneously:
  - `app/pricing/page.tsx`: $0 / $69 / $199 / $499
  - `app/api/stripe/checkout/route.ts` PRICE_MAP comment: Solo $29 / Pro $99 / Growth $249 / Enterprise $599 / Agency $1,499
  - `docs/PRD.md`: $299 / $599 / $1,499 / $2,499
- **Impact:** Checkout route and pricing page are mismatched — no one can buy correctly
- **Fix:** Standardize to: Free | Pro $199 | Growth $499 | Enterprise $999 | Agency $2,499/mo
  - Update `app/pricing/page.tsx`
  - Update `app/api/stripe/checkout/route.ts` PRICE_MAP (remove `solo` tier, align tier names)
  - Update `docs/PRD.md`

### B3 — .env.example Wrong URLs (HIGH)
- **Problem:** `NEXT_PUBLIC_APP_URL=https://houndshield.com` bakes wrong URL into every deployment
- **Impact:** Every new deployment gets wrong app URLs. Auth redirects, email links, webhook callbacks all break.
- **Fix:** Update all URL references to `https://houndshield.com`

### B4 — Supabase Migrations Not in Prod (HIGH)
- **Problem:** Migrations 003-010 exist locally but not applied to production DB
- **Impact:** Dashboard routes fail for authenticated users — `profiles` table, `usage_logs`, `audit_trail` tables may be missing
- **Fix:** `cd compliance-firewall-agent && npx supabase db push` (requires prod env vars)

---

## HIGH SEVERITY

### H1 — 147 HoundShield References (HIGH)
- **Problem:** 147 source files contain "HoundShield" — company/product names, URLs, metadata
- **Critical files:**
  - `app/layout.tsx` — title, metadataBase, authors, openGraph, twitter (all show houndshield.com)
  - `app/page.tsx` — imports `WhyHoundShield` component
  - `components/landing/WhyHoundShield.tsx` — user-visible component, wrong name
  - `app/sitemap.ts`, `app/robots.ts` — URL references
  - `app/api/health/houndshield.ts` — wrong filename AND wrong API keys checked
- **Fix:** Phase 2 batch sed rename + manual file renames/deletes

### H2 — health/houndshield.ts Checks Wrong Keys (HIGH)
- **Problem:** `app/api/health/houndshield.ts` checks `ANTHROPIC_API_KEY` but product uses OpenRouter
- **Code:**
  ```typescript
  const primary = !!process.env.ANTHROPIC_API_KEY; // WRONG
  ```
- **Fix:** DELETE this file, CREATE `app/api/health/houndshield.ts` checking `OPENROUTER_API_KEY`

### H3 — OPENROUTER_API_KEY Missing from Vercel (HIGH)
- **Problem:** Brain AI module returns errors on live site — API key not set in Vercel dashboard
- **Impact:** Brain knowledge graph is inaccessible to all users
- **Fix:** Manual step — set `OPENROUTER_API_KEY` in Vercel dashboard

### H4 — Dead Code: price-ids.ts (MEDIUM)
- **File:** `app/pricing/price-ids.ts`
- **Problem:** Hardcoded Stripe price IDs that are orphaned — checkout route correctly uses env vars
- **Fix:** DELETE this file

---

## WHAT WORKS (DO NOT TOUCH)

| System | Status | Notes |
|--------|--------|-------|
| Proxy server | ✅ Working | `proxy/server.ts` — DO NOT modify regex patterns |
| 16 CUI detection patterns | ✅ Working | `proxy/patterns/index.ts` — extend, never replace |
| PDF/C3PAO report generation | ✅ Working | 105/105 tests passing |
| Supabase auth | ✅ Working | Signup/login flow functional |
| Stripe checkout flow (logic) | ✅ Working | Logic correct, webhook URL wrong |
| Brain AI knowledge graph | ✅ Working (offline) | Missing OPENROUTER_API_KEY in Vercel |
| `/docs/quickstart` | ✅ Working | Jordan onboarding flow correct |
| All 105 tests | ✅ Passing | Keep passing — never break this |

---

## MANUAL STEPS (Cannot Automate — Require Credentials)

1. **Stripe webhook URL** — dashboard.stripe.com/webhooks → update to `https://houndshield.com/api/stripe/webhook`
2. **STRIPE_WEBHOOK_SECRET** — set in Vercel dashboard (required for webhook validation)
3. **OPENROUTER_API_KEY** — set in Vercel dashboard (required for Brain AI)
4. **Supabase push** — `cd compliance-firewall-agent && npx supabase db push` (with prod env vars)

---

## RENAME SCOPE

```bash
# Verify after Phase 2 completes — target: 0
grep -ri houndshield . --include="*.ts" --include="*.tsx" --include="*.json" | wc -l
```

Files requiring rename/delete:
- `app/api/health/houndshield.ts` → DELETE, replace with `houndshield.ts`
- `components/landing/WhyHoundShield.tsx` → RENAME to `WhyHoundShield.tsx`
- `app/pricing/price-ids.ts` → DELETE (dead code)
- All remaining 142 files → batch sed: `HoundShield` → `HoundShield`, `houndshield.com` → `houndshield.com`

---

## OPERATION HOUND — PHASE CHECKLIST

- [ ] Phase 0: This audit (DONE)
- [ ] Phase 1: Fix 4 blockers (pricing, .env.example, checkout route, health endpoint)
- [ ] Phase 2: Kill 147 HoundShield references
- [ ] Phase 3: Full light-mode UI rebuild
- [ ] Phase 4: Delete dead code
- [ ] Phase 5: Rewrite CLAUDE.md with HERMES doctrine
- [ ] Phase 6: Update docs (PRD, ROADMAP, ai-architecture, secondary-ideas)
- [ ] Phase 7: Verify + PR
