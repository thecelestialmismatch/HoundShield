# KAELUS.AI — SPRINT 1 TASK TRACKER
*7 days to live deployment. Execute in order. Check off as done.*
*Full specs for every task are in `CLAUDE-CODE-MISSION.md` Section 6.*

---

## PHASE 0: DEPLOYMENT UNBLOCK (Before Any Feature Work)

- [ ] **P0.1** — Fill all env vars in `.env.local` (all 15+ variables)
- [ ] **P0.2** — Fill all env vars in Vercel dashboard → Settings → Environment Variables (Production)
- [ ] **P0.3** — Apply Supabase migrations to production:
  ```bash
  npx supabase db push
  # OR manually run in Supabase SQL editor:
  # 001_initial_schema.sql → 002_shieldready_schema.sql → 003_profiles_and_subscriptions.sql
  ```
- [ ] **P0.4** — Run `npm run build` — must pass with zero errors
- [ ] **P0.5** — Confirm Vercel Root Directory = `compliance-firewall-agent`
- [ ] **P0.6** — Check Vercel deployment of commit 3072fed — confirm no longer "Blocked"

---

## GAP 1: DEMO MODE BANNER (CRITICAL — 2–4 hours)

**Files to create/modify:**
- [ ] `lib/supabase/client.ts` — verify `isSupabaseConfigured()` checks all 3 env vars
- [ ] `components/ui/demo-banner.tsx` — NEW: amber warning bar component
- [ ] `app/command-center/layout.tsx` — ADD: demo banner when demo mode active
- [ ] `app/api/stripe/checkout/route.ts` — ADD: early return block in demo mode
- [ ] `app/command-center/shield/assessment/page.tsx` — ADD: demo mode note

**Done when:** App without Supabase shows amber banner. App with Supabase shows nothing.
**Build check:** `npm run build` passes.

---

## GAP 2: SUBSCRIPTION GATING (CRITICAL — 1 day)

**Files to create/modify:**
- [ ] `lib/subscription/check.ts` — NEW: getUserSubscription() + canAccessGateway() + getApiCallLimit()
- [ ] `app/api/gateway/intercept/route.ts` — ADD: subscription check, return 402 for free users
- [ ] `app/api/gateway/stream/route.ts` — ADD: same subscription check
- [ ] `app/api/reports/generate/route.ts` — ADD: Enterprise+ only gate on PDF (Growth+ on JSON)

**Done when:** Free user hitting gateway gets `{ error: "Upgrade required", upgrade_url: "/pricing" }` with HTTP 402. Pro user passes through normally.
**Build check:** `npm run build` passes.

---

## GAP 3: STRIPE WEBHOOK SYNC (CRITICAL — 4–6 hours)

**Files to modify:**
- [ ] `app/api/stripe/webhook/route.ts` — verify handles: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed
- [ ] Cross-check column names against `supabase/migrations/003_profiles_and_subscriptions.sql`

**Test procedure (document results in tasks/lessons-deployment.md):**
- [ ] Install Stripe CLI
- [ ] Run: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] Trigger: `stripe trigger checkout.session.completed`
- [ ] Verify Supabase subscriptions table has new row

**Done when:** Stripe CLI test shows webhook handled, Supabase row created.

---

## GAP 4: PRICING PAGE + UPDATED STRIPE TIERS (HIGH — 1 day)

**New prices to set up:**
| Tier | USD/mo | Stripe env var |
|------|--------|----------------|
| Pro | $199 | STRIPE_PRO_MONTHLY_PRICE_ID |
| Growth | $499 | STRIPE_GROWTH_MONTHLY_PRICE_ID |
| Enterprise | $999 | STRIPE_ENTERPRISE_MONTHLY_PRICE_ID |
| Agency | $2,499 | STRIPE_AGENCY_MONTHLY_PRICE_ID |

**Files to create/modify:**
- [ ] `setup-stripe.mjs` — update/add new tier prices (or create via Stripe dashboard)
- [ ] `.env.local` + Vercel dashboard — add new price ID env vars
- [ ] `app/pricing/page.tsx` — CREATE or rewrite with full tier comparison table
- [ ] `app/api/stripe/checkout/route.ts` — handle new tier price IDs
- [ ] Landing page `app/page.tsx` — update pricing section link → `/pricing`

**Done when:** `/pricing` page shows all 5 tiers with correct USD prices and feature comparison. Checkout works for at least Pro tier with test card.

---

## GAP 5: DASHBOARD NAV CLEANUP (HIGH — 2–4 hours)

**File to modify:** `app/command-center/layout.tsx`

**Action per route:**
- [ ] `pixeloffice` → remove from nav (keep file)
- [ ] `memory` → remove from nav (keep file)
- [ ] `workspace` → remove from nav (keep file)
- [ ] `agents` → remove from nav (keep file)
- [ ] `knowledge` → remove from nav (keep file)
- [ ] `calendar` → remove from nav (keep file)
- [ ] `timeline` → remove from nav (keep file)
- [ ] `pipeline` → READ the page. If compliance remediation tasks: rename "Remediation Tasks" and keep. If generic: remove from nav.
- [ ] `events` → READ the page. If compliance/audit events: rename "Audit Log" and keep. If generic: remove.
- [ ] `team` → KEEP as-is

**Reorder nav to:** Dashboard → ShieldReady → Gaps → Real-time → Scanner → Quarantine → Audit Log → Reports → Remediation Tasks → Team → Settings

**Done when:** Every visible nav item is directly compliance-related. Zero "what is this?" items.

---

## GAP 6: PDF COMPLIANCE REPORTS (HIGH — 2–3 days)

**Files to create/modify:**
- [ ] `npm install jspdf jspdf-autotable` — add dependencies
- [ ] `lib/reports/pdf-generator.ts` — NEW: generateCompliancePDF() function
- [ ] `app/api/reports/generate/route.ts` — ADD: `?format=pdf` param → return PDF response
- [ ] `app/command-center/shield/reports/page.tsx` — ADD: "Download PDF Report" button
- [ ] Gate PDF behind Growth tier subscription check

**PDF must include:**
- [ ] Cover page: Kaelus logo, org name, date range, compliance score
- [ ] Executive summary: total events, violation rate, risk breakdown
- [ ] Threat breakdown table: event type, count, action, CMMC control
- [ ] CMMC control status table: control ID, family, Pass/Fail/Partial
- [ ] Incident log: top 20 events
- [ ] Footer: Merkle root, timestamp, "Generated by Kaelus.ai"

**Done when:** PDF downloads from the dashboard with real data. Never shows demo data.

---

## GAP 7: LANDING PAGE REWRITE (HIGH — 1 day)

**File to modify:** `app/page.tsx`

**Required sections:**
- [ ] Hero: CMMC-specific headline + subheadline + dual CTA + trust bar
- [ ] Problem section: "3 things defense contractors leak to ChatGPT every day"
- [ ] How it works: 3-step visual (employee → Kaelus scans → dashboard visibility)
- [ ] Stats: 80,000+ contractors / 0.5% certified / $76,000 assessment cost / <50ms latency
- [ ] Pricing preview: link to /pricing
- [ ] Australia section: DISP + Essential Eight mention

**Hero copy (use exactly):**
```
H1: "Your team is one ChatGPT session away from a CMMC violation."
H2: "Kaelus.ai intercepts every AI query before it leaves your network.
     Protect CUI. Pass your C3PAO assessment. Keep your DoD contracts."
CTA1: "Start Free Assessment →"
CTA2: "See a Live Demo"
Trust bar: "CMMC Level 2 | NIST SP 800-171 | Real-time Protection | <50ms Latency"
```

**Done when:** Landing page speaks directly to a CMMC compliance officer. No generic "AI compliance" phrasing.

---

## GAP 8: ONBOARDING FLOW + EMAIL TRIGGERS (MEDIUM — 1 day)

**Files to create/modify:**
- [ ] `app/command-center/shield/onboarding/page.tsx` — READ then verify/add 4-step flow
- [ ] `app/api/email/welcome/route.ts` — NEW: welcome email trigger via Resend
- [ ] `app/api/email/assessment-reminder/route.ts` — NEW: 24h reminder if assessment incomplete
- [ ] `app/api/email/first-threat/route.ts` — NEW: trigger when first event detected

**4-step onboarding flow:**
1. "Tell us about your organization" → save to Supabase
2. "Complete your CMMC gap assessment" → link to /shield/assessment
3. "Connect your first AI tool" → show integration snippet
4. "Your protection is active" → show first event or demo event

**Done when:** New signup completes onboarding in under 10 minutes and receives welcome email.

---

## GAP 9: CMMC THREAT PATTERNS (MEDIUM — 1–2 days)

**Files to create/modify:**
- [ ] `lib/classifier/cmmc-patterns.ts` — NEW: CUI detection patterns
- [ ] `lib/gateway/stream-scanner.ts` — ADD: run CMMC patterns alongside existing
- [ ] `app/command-center/quarantine/page.tsx` — ADD: show cmmc_control field on events

**Patterns to implement:**
- CONTRACT_NUMBER (N00019-XX-C-XXXX format) → MP.L2-3.8.1
- CAGE_CODE (5-char alphanumeric) → MP.L2-3.8.1
- ITAR_MARKER (ITAR/EAR/22 CFR/15 CFR) → SC.L2-3.13.1 CRITICAL
- DFARS_REFERENCE (DFARS XXX.XXXX) → CA.L2-3.12.1
- DD_FORM (DD-250, DD-1750) → MP.L2-3.8.1
- CLEARANCE_REFERENCE (TS/SCI, Q clearance) → PS.L2-3.9.1 CRITICAL
- CUI_MARKER (CUI/, FOUO, For Official Use Only) → MP.L2-3.8.1 CRITICAL

**Done when:** Test prompt containing "this DD-250 form is ITAR controlled for contract N00019-22-C-1234" triggers CRITICAL severity alert with correct CMMC control mapping.

---

## GAP 10: INTEGRATION DOCUMENTATION (MEDIUM — 1 day)

**File to modify:** `app/docs/page.tsx`

**Required sections:**
- [ ] Quick Start: 4-step setup (signup → API key → change baseURL → done)
- [ ] Code examples: OpenAI (Node + Python), Anthropic Node, Azure OpenAI, cURL, SDK
- [ ] What gets scanned: PII, CUI, credentials, PHI, source code
- [ ] Compliance mapping: scan category → CMMC control table
- [ ] Enterprise gateway: proxy config for Agency/Enterprise tiers

**Done when:** A developer can integrate Kaelus in 30 minutes using only the docs page.

---

## FINAL DEPLOYMENT CHECKLIST (Day 7 — WITH EXPLICIT USER CONFIRMATION)

- [ ] All 10 gaps completed
- [ ] `npm run build` passes clean
- [ ] All env vars set in Vercel production
- [ ] Supabase migrations applied to production
- [ ] Stripe live keys configured (TEST keys → LIVE keys with user confirmation)
- [ ] Stripe webhook pointing to production URL
- [ ] PostHog tracking verified
- [ ] Demo mode banner tested end-to-end
- [ ] Full E2E test: signup → assessment → checkout → gateway intercept → PDF download
- [ ] **USER CONFIRMS: "Deploy to production"**
- [ ] Merge feat/branding-shieldready-polish → main
- [ ] Vercel production deployment triggered
- [ ] Production URL verified working

---

## PROGRESS SUMMARY

| Gap | Priority | Est. Time | Status | Completed |
|-----|----------|-----------|--------|-----------|
| Phase 0: Env vars + migrations | CRITICAL | 1–2 hrs | ⬜ Pending | — |
| Gap 1: Demo mode banner | CRITICAL | 2–4 hrs | ⬜ Pending | — |
| Gap 2: Subscription gating | CRITICAL | 1 day | ⬜ Pending | — |
| Gap 3: Stripe webhook sync | CRITICAL | 4–6 hrs | ⬜ Pending | — |
| Gap 4: Pricing page + tiers | HIGH | 1 day | ⬜ Pending | — |
| Gap 5: Nav cleanup | HIGH | 2–4 hrs | ⬜ Pending | — |
| Gap 6: PDF reports | HIGH | 2–3 days | ⬜ Pending | — |
| Gap 7: Landing page | HIGH | 1 day | ⬜ Pending | — |
| Gap 8: Onboarding + emails | MEDIUM | 1 day | ⬜ Pending | — |
| Gap 9: CMMC patterns | MEDIUM | 1–2 days | ⬜ Pending | — |
| Gap 10: Docs page | MEDIUM | 1 day | ⬜ Pending | — |
| Final deployment | — | 2–4 hrs | ⬜ Pending | — |

Update this table as gaps are completed. Never mark a gap complete until `npm run build` passes.
