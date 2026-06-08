# HOUNDSHIELD — FULL PRD + 30-DAY ROADMAP
## Product Requirements Document v3.0 | Operation HOUND | 2026-05-08

---

# PART 1: PRODUCT REQUIREMENTS DOCUMENT

---

## Product Vision

HoundShield is the compliance firewall for the AI era. It sits between your team and every AI provider in the world, scans every prompt in under 10ms, and enforces CMMC Level 2, HIPAA, and SOC 2 — before a single byte of controlled data leaves your network.

**The one sentence:** Stop your team from leaking CUI to ChatGPT.

**Mission statement:** Every DoD contractor handling Controlled Unclassified Information has a legal obligation to prevent that data from flowing to third-party AI systems. HoundShield makes that obligation trivially enforceable with one URL change — instead of a $150,000 consultant engagement.

---

## Problem Statement

When an engineer at a 50-person DoD contractor pastes a defense contract number into ChatGPT, they've potentially committed a DFARS 7012 violation. They didn't know. Their manager didn't know. The CMMC assessor finds it 6 months later and the company fails their audit.

This is not a hypothetical. It is happening at thousands of contractors right now.

Every cloud-based solution to this problem — Nightfall, Strac, Microsoft Purview, Cyberhaven — solves it by sending your prompts to their cloud for scanning. That is itself a potential CUI spill. The only legitimate solution scans locally. That is HoundShield.

**The regulation forcing urgency:** CMMC Phase 2 enforcement begins November 10, 2026. ~80,000 DoD contractors need Level 2 certification. ~400 have it. C3PAOs are booked 18 months out. The window is right now.

---

## Target Customer (ICP)

**Primary Buyer: Jordan**

| Attribute | Detail |
|-----------|--------|
| Job title | IT Security Manager, IT Director, CISO |
| Company size | 50–250 employees |
| Industry | DoD defense subcontractor |
| CMMC status | Pursuing Level 2, assessment 6–18 months away |
| Budget authority | $0–$1,000/mo unilateral; $1,000+ needs VP/COO approval |
| Tech fluency | Sets up proxies, reads documentation, gets Docker running |
| Primary fear | Failing CMMC assessment because of a ChatGPT use incident |
| Secondary fear | Being the one who signed off on a non-compliant tool |
| Current state | Either has no AI governance at all, or is managing 50 different API keys by hand |
| Discovery channel | C3PAO recommendation, LinkedIn, Google "CMMC ChatGPT compliance" |

**What Jordan is willing to pay for immediately:** Evidence she can hand to her C3PAO auditor. That's the PDF report. The dashboard is nice. The PDF is the purchase driver.

**Who influences Jordan's decision:**
- C3PAO / Registered Practitioner: If her assessor recommends it, she buys same-day
- Peer IT manager at another defense contractor: "We use HoundShield, it passed our audit" is the most powerful testimonial possible
- Prime contractor: If Raytheon or Lockheed says "all subs need CMMC AI governance," the problem is solved at the prime level

**Secondary ICP:** Compliance Officer at a 50–200 person healthcare organization (HIPAA), Series B SaaS company (SOC 2). Same product, different compliance framework. Address after HoundShield has 25 CMMC customers.

---

## Core Feature Set (v1 — Shipped)

### Feature 1: Local Proxy Gateway
**What it does:** Intercepts every AI API call before it leaves the network. One URL change deploys it.
**Acceptance criteria:** 
- Any API call routed through `https://houndshield.com/api/gateway/intercept` is scanned in <10ms
- Supports OpenAI, Anthropic, Gemini, Cohere, and any OpenAI-compatible endpoint
- Requests that fail scanning are blocked, not silently dropped — caller receives a structured error
- Test: `proxy/server.ts` 49/49 vitest passing

### Feature 2: 16 CUI Detection Engines
**What it does:** Scans every prompt for 16 categories of Controlled Unclassified Information using regex + behavioral analysis.
**Acceptance criteria:**
- All 16 patterns from `proxy/patterns/index.ts` correctly identify their target CUI categories
- False positive rate <5% on the test suite
- OODA behavioral engine adds temporal and velocity signals to risk scoring
- Test: `proxy/ooda/` 49/49 vitest passing

### Feature 3: C3PAO-Ready PDF Report
**What it does:** Generates a 5-page PDF audit report suitable for C3PAO review.
**Acceptance criteria:**
- Report contains: incident log, control coverage map, SPRS improvement estimate, executive summary
- PDF is generated in <30 seconds from dashboard
- Growth tier: full report. Pro tier: 5-page summary. Free: demo watermark.
- Test: 105/105 jest tests passing

### Feature 4: Brain AI Compliance Advisor
**What it does:** Chat widget (bottom right, live on houndshield.com) that answers CMMC/HIPAA/SOC2 questions in natural language.
**Acceptance criteria:**
- Answers reference specific NIST control IDs, not general guidance
- Latency <5 seconds for typical CMMC question
- Does NOT log prompt content — only query intent category and response quality signal
- **BLOCKED:** Requires `OPENROUTER_API_KEY` set in Vercel (not yet done as of 2026-05-08)

### Feature 5: Supabase Dashboard
**What it does:** Shows Jordan her organization's scan history, risk levels, blocked prompts, and SPRS score improvement.
**Acceptance criteria:**
- Requires auth (Supabase auth working ✓)
- All charts are `ssr: false` (Recharts pattern)
- Dashboard loads in <3 seconds for organizations with <10,000 scan events
- **PARTIAL BLOCKER:** Migrations 003-010 not pushed to production (Supabase db push required)

### Feature 6: Stripe Subscription + Tier Gating
**What it does:** Users subscribe via Stripe checkout. Features are gated by tier.
**Acceptance criteria:**
- Checkout creates a Supabase subscription record
- Tier gating correctly limits PDF to Growth+, full dashboard to Pro+
- Webhook validates `stripe-signature` header
- **BLOCKED:** Stripe webhook URL needs manual update in dashboard.stripe.com

---

## Canonical Pricing (v1 — Locked)

| Tier | Price | Users | Who It's For |
|------|-------|-------|--------------|
| Free | $0 | 1 user | Jordan evaluating |
| Pro | $199/mo | 10 users | Small contractor team, full dashboard |
| Growth | $499/mo | 50 users | Growing contractor, PDF reports |
| Enterprise | $999/mo | 250 users | Mid-size contractor, priority support |
| Agency/C3PAO | $2,499/mo | Unlimited | C3PAO managing multiple client dashboards |

**This pricing is locked until 50 paying customers.** Do not change it without 10 data points from Jordan conversations. The $199 Pro tier is the primary conversion target.

---

## Technical Architecture

**Stack (all confirmed working):**
- Frontend: Next.js 15, React 19, Tailwind CSS 3, Framer Motion 12
- Database: Supabase (PostgreSQL + RLS + Auth)
- Payments: Stripe (subscriptions, webhooks)
- LLM: OpenRouter (Claude Sonnet primary, Haiku fallback)
- Email: Resend
- Proxy: Node.js TypeScript server with SQLite for local audit log
- Error tracking: Sentry
- Analytics: PostHog
- Hosting: Vercel (dashboard) + Docker (proxy self-hosted)

**Critical rules:**
- `PlatformDashboard` always `ssr: false` — Recharts crashes on SSR
- Local proxy never sends prompt content externally — only license key hash + prompt count
- `transformStyle: "preserve-3d"` never on `motion.div` — Framer conflict

---

## Success Metrics

| Metric | Day 7 Target | Day 14 Target | Day 30 Target |
|--------|-------------|---------------|---------------|
| MRR | $0 (setup week) | $500 | $5,000 |
| Paying customers | 0 | 2–5 | 25 |
| C3PAO partners | 0 | 1 | 3 |
| Free trial signups | 10 | 30 | 100 |
| Trial → paid conversion | — | 10% | 15% |
| Stripe webhook functional | ✓ (Day 2) | — | — |
| Brain AI live | ✓ (Day 1) | — | — |
| Supabase migrations pushed | ✓ (Day 1) | — | — |

**Leading indicators (predict $5K MRR):**
- Week 1: Number of C3PAOs who responded to outreach (target: 3 of 10 respond)
- Week 2: Number of free trials that open the PDF report (target: 50% of signups)
- Week 3: Trial-to-paid conversion rate (target: 10%+)

**Lagging indicator:** MRR. If the leading indicators are on track, MRR follows.

---

## Out of Scope (Until $10K MRR)

The following are explicitly not being built in the current operation:

- Browser extension (in repo, do not touch — no Jordan use case)
- Mobile app (no Jordan use case)
- Blockchain-anchored audit trail (in README as shipped feature — leave as-is, don't build more)
- SIEM integration suite (Azure Sentinel, Splunk) — listed in backlog, correct
- Multi-tenant C3PAO portal — Sprint 4 at earliest
- Gemini Flash as secondary scanner — post-revenue optimization
- HITL review workflow improvements
- Shadow AI Monitor (separate product, post $10K MRR)
- AIBudgetGuard (separate product, Month 2)
- SSP Generator (separate product, Month 3)

Any feature not on this list that gets proposed in a session → **[MANAGER CHECK]**

---

# PART 2: 30-DAY ROADMAP TO $5,000 MRR

---

## WEEK 1 (Days 1–7): Unblock Everything, Deploy Nothing New

**Goal:** The product works end-to-end for a paying customer. No new features. Just unblock what's already built.

**Owner:** ATLAS + GUARDIAN

### Day 1 (Today — 2026-05-08)

- [ ] **Manual — FOUNDER:** Set `OPENROUTER_API_KEY` in Vercel dashboard → Brain AI goes live on houndshield.com
- [ ] **Manual — FOUNDER:** Update Stripe webhook URL at dashboard.stripe.com to `https://houndshield.com/api/stripe/webhook`
- [ ] **Manual — FOUNDER:** Set `STRIPE_WEBHOOK_SECRET` in Vercel dashboard
- [ ] **Manual — FOUNDER:** `cd compliance-firewall-agent && npx supabase db push`

**These 4 steps are the entire Day 1 agenda. Nothing else happens until these are done.**

### Day 2

- [ ] **ATLAS:** Fix `.env.example` — change `NEXT_PUBLIC_APP_URL` from `https://kaelus.ai` to `https://houndshield.com`
- [ ] **ATLAS:** Delete `compliance-firewall-agent/app/pricing/price-ids.ts`
- [ ] **ATLAS:** Delete `compliance-firewall-agent/app/api/health/houndshield.ts`, create replacement checking `OPENROUTER_API_KEY` + `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_SUPABASE_URL`
- [ ] **ATLAS:** Fix three-way pricing incoherence:
  - `app/pricing/page.tsx` → Free / $199 / $499 / $999 / $2,499
  - `app/api/stripe/checkout/route.ts` PRICE_MAP → align to same tiers
  - `docs/PRD.md` → same
- [ ] **GUARDIAN:** Verify Stripe webhook responds 200 to test event (Stripe CLI: `stripe trigger payment_intent.succeeded`)

### Day 3

- [ ] **FORGE:** Add PostHog funnel events: `signup_started`, `signup_completed`, `checkout_started`, `checkout_completed`, `first_scan`, `pdf_exported`
- [ ] **FORGE:** Fix Brain AI widget to show a clear "API key not configured" state if OPENROUTER is absent (replace silent spinner)
- [ ] **SCRIBE:** Update CLAUDE.md to reflect canonical pricing and current sprint state

### Day 4

- [ ] **STRIKER:** Build the C3PAO outreach list — 20 contacts from marketplace.cmmcab.org (name, email, number of contractor clients)
- [ ] **ATLAS:** Build `/partner` landing page — C3PAO referral program with 20% commission structure
- [ ] **CIPHER:** Verify Brain AI responds correctly to 10 test CMMC questions (output checked manually)

### Day 5

- [ ] **STRIKER:** Send first 10 C3PAO outreach emails (use exact script from ROADMAP.md)
- [ ] **GUARDIAN:** Run full test suite — confirm 105/105 passing post all Day 1-4 changes
- [ ] **SCRIBE:** Review `/docs/quickstart` — is Jordan's onboarding path still accurate? Fix anything stale.

### Day 6–7 (Weekend Sprint Review)

- [ ] **COMMANDER:** Write Week 1 SITREP — what shipped, what's blocked, MRR status
- [ ] **STRIKER:** Check Stripe for any organic signups that came through this week
- [ ] **ORACLE:** Scan Reddit/HN for "CMMC ChatGPT" mentions — any inbound opportunities?

**Week 1 acceptance criteria:**
- Stripe webhook functional (verified with test event)
- Brain AI live on houndshield.com
- Supabase dashboard accessible for authenticated users
- Pricing consistent across all files
- PostHog funnel events firing

---

## WEEK 2 (Days 8–14): First Paying Customer

**Goal:** One paying customer. One C3PAO partner engaged. $500 MRR minimum.

**Owner:** STRIKER (primary) + CIPHER (Sprint 3 begins)

### Day 8

- [ ] **STRIKER:** Follow up with C3PAOs who didn't respond to Day 5 outreach
- [ ] **CIPHER:** Begin Sprint 3 — wire `brain-query.ts` to Brain AI API route
- [ ] **FORGE:** Build first-time user empty states in Command Center (Jordan sees nothing useful on first login — this is a churn risk)

### Day 9

- [ ] **STRIKER:** Record the 3-minute demo video: CUI paste → ChatGPT block → PDF report export → SPRS improvement
- [ ] **CIPHER:** Ingest CMMC framework docs into Brain AI knowledge graph
- [ ] **ATLAS:** Write the 3-email onboarding sequence (Day 1: "Your proxy is live. Here's what it just protected." Day 3: "Your risk report is ready." Day 7: "Your C3PAO presentation is one click away.")

### Day 10

- [ ] **STRIKER:** Post in r/govcontracting and r/netsec: "We built a local AI compliance firewall for CMMC — AMA." No hard sell. Answer questions. Build trust.
- [ ] **CIPHER:** Test 20 Brain AI CMMC questions — all must return correct answers
- [ ] **GUARDIAN:** Add Supabase health check to CI — verify prod DB tables exist

### Day 11-12

- [ ] **STRIKER:** Follow up with any C3PAOs who showed interest
- [ ] **FORGE:** Implement CMMC control coverage map in dashboard (shows Jordan which of 110 controls HoundShield covers)
- [ ] **ORACLE:** Monitor Stripe for signups. For any free tier signup that doesn't convert in 48 hours, STRIKER sends a personal "Why didn't you upgrade?" email

### Day 13-14

- [ ] **ALL:** Week 2 SITREP + retrospective
- [ ] **STRIKER:** Count: MRR, paying customers, C3PAO partners engaged, free trials
- [ ] **COMMANDER:** If $500 MRR not achieved: escalate immediately — identify the exact conversion blocker, fix it before Sprint 3 starts

**Week 2 acceptance criteria:**
- 1+ paying customer
- 1+ C3PAO partner engaged (had a call, interested in referral arrangement)
- Brain AI answering CMMC questions correctly
- Onboarding email sequence active

---

## WEEK 3 (Days 15–21): 10 Customers, $2,000 MRR

**Goal:** 10 paying customers. 2 C3PAO partners with active referral arrangements. $2,000 MRR.

**Owner:** STRIKER + ATLAS (C3PAO white-label MVP)

### Key activities

- [ ] **STRIKER:** Activate C3PAO partner #1's client list — send HoundShield recommendation through their channel
- [ ] **ATLAS:** Build C3PAO white-label dashboard MVP (rebrandable, tier: Agency $2,499/mo)
- [ ] **FORGE:** SPRS improvement estimate displayed prominently in dashboard ("+18 to +30 points" shown as the headline metric)
- [ ] **CIPHER:** CMMC control coverage map fully functional
- [ ] **STRIKER:** Publish blog post: "Why cloud-based AI DLP violates DFARS 7012" — this is the SEO anchor + sales enablement piece

**Week 3 acceptance criteria:**
- 10 paying customers
- 2 C3PAO partners with signed referral arrangements
- SPRS estimate live in dashboard (retention mechanic — Jordan checks it every week)
- Blog post published and indexed

---

## WEEK 4 (Days 22–30): $5,000 MRR

**Goal:** $5,000 MRR. 25 customers. 3 C3PAO partners active.

**The math:**
```
Tier breakdown to $5,000 MRR:
Option A (all Pro):       25 × $199 = $4,975 ✓
Option B (mixed):         15 Pro × $199 + 5 Growth × $499 = $5,480 ✓  
Option C (C3PAO-led):     3 Agency × $2,499 = $7,497 ✓ (if C3PAO channel works faster)
Most likely:              20 Pro + 3 Growth + 1 Enterprise = $5,475 ✓
```

**The customer math:**
- 3 C3PAO partners, each with 20-50 clients
- Assume 15% conversion from C3PAO recommendation to HoundShield trial
- Assume 50% trial-to-paid from C3PAO-referred leads (trust transfer from C3PAO recommendation)
- 3 partners × 30 avg clients × 15% trial × 50% conversion = 6.75 paying customers per partner = ~20 customers from the C3PAO channel alone
- Plus 5 organic/direct = 25 customers

**Week 4 key activities:**
- [ ] **STRIKER:** Activate all 3 C3PAO partners simultaneously
- [ ] **STRIKER:** Run a limited-time promotion for C3PAO-referred leads: 2 months free with annual Pro subscription
- [ ] **ORACLE:** Monitor PostHog for churn signals in Week 3 customers — fix any activation gaps before they churn
- [ ] **ATLAS:** Build MRR dashboard for founder (live Stripe revenue, churn rate, trial conversion rate) — you need to know the number every day
- [ ] **ALL:** Day 30 SITREP: $5K MRR confirmed? If yes, initiate AIBudgetGuard build plan. If no, root cause analysis and 30-day extension with revised approach.

**Week 4 acceptance criteria:**
- $5,000 MRR (verified in Stripe)
- 25+ active paying customers
- Churn rate <10% from Week 2–3 customers
- AIBudgetGuard build plan written and ready to execute

---

## $5K MRR RISK ASSESSMENT

| Risk | Probability | Mitigation |
|------|------------|------------|
| Stripe webhook not fixed before outreach | HIGH if not done Day 1 | Do the manual step today |
| C3PAO channel takes longer than 14 days | MEDIUM | Start organic content in parallel (blog post Week 3) |
| Jordan doesn't buy without a demo call | MEDIUM | Record demo video Day 9. Link in every email. |
| CMMC Phase 2 timeline shifts | LOW | Product still prevents real CUI exposure regardless of regulatory timeline |
| Well-funded competitor builds local-first | LOW in 30 days | Move first, win the brand position |

**The single biggest risk:** The manual steps at the top of this document are not completed in the first 48 hours, causing the entire outreach campaign to fail because incoming trial users can't subscribe.

---

*HoundShield PRD v3.0 + 30-Day Roadmap | HERMES Operation HOUND | 2026-05-08*
