# KAELUS.AI — 7-DAY STARTUP ACCELERATION BLUEPRINT
*Generated: 2026-03-16 | Replaces all prior PRDs and roadmaps*

---

## BRUTAL HONESTY ASSESSMENT — PROCEED OR PIVOT?

**Verdict: STRONG GO. Do not pivot. Accelerate.**

Here's why this is one of the most timely product bets in the market right now:

- **80,000–300,000** US defense contractors must achieve CMMC Level 2 certification
- Only **0.5%** have done it — the wave has barely started
- Phase 2 enforcement (mandatory third-party C3PAO assessments) begins **November 2026 — 8 months away**
- Contractors need 12–18 months to get certified. The math means anyone not moving RIGHT NOW is already late
- **No competitor bundles an AI firewall + CMMC compliance assessment in a single product.** CalypsoAI, Prompt Security, Lakera, Nightfall — all target generic enterprise, not the defense industrial base
- C3PAO assessment fees are $30,000–$76,000 and rising. A $199–$499/month SaaS that helps avoid rework is an obvious ROI

The one risk: defense sales cycles are slow and trust-dependent. This is manageable — lead with the ShieldReady assessment module (fast value) rather than the gateway (requires IT integration). Let the assessment pull the gateway sale.

**What Kaelus.ai is (one sentence):** A real-time AI compliance firewall that intercepts and sanitizes LLM API traffic before it exits the enterprise perimeter, purpose-built for CMMC Level 2 defense contractors who use AI tools and must protect Controlled Unclassified Information (CUI).

**Who pays:** CMMC Level 2 compliance officers, IT security leads, and owners of defense contractors with 50–500 employees who use AI tools (ChatGPT, Copilot, Claude) in their workflows and face contract loss if they're caught exposing CUI to external AI providers.

---

## PART 1: MARKET-ALIGNED PRD

### Market Analysis (US Primary, Australia Secondary)

**US Market:**
| Metric | Data |
|--------|------|
| Total addressable market | 80,000–300,000 contractors need CMMC Level 2 |
| Certified today | ~400 (0.5%) — near-zero saturation |
| Enforcement deadline (Phase 2) | November 2026 |
| Typical time to certify | 12–18 months |
| C3PAO assessment cost | $30,000–$76,000 (rising to $150K by late 2026) |
| AI governance SaaS market CAGR | 15.8% through 2035 |
| AI firewall pricing range (competitors) | $120–$300/seat/year (Prompt Security); custom enterprise (CalypsoAI, Lakera) |

**Key insight:** Competitors price by seat or API volume with no CMMC context. Kaelus can own the "compliance value" narrative and price 2–3x higher than generic tools by tying directly to contract risk and certification cost avoidance.

**Australia Secondary Market:**
| Metric | Data |
|--------|------|
| Equivalent framework | DISP (Defence Industry Security Program) + ASD Essential Eight Maturity Level 2 |
| AI governance mandate | ACSC AI security guidance (2025); no hard mandate yet but embedded in DISP requirements |
| Competitive landscape | Near-zero AI governance vendors targeting DISP specifically |
| Opportunity | Earlier-stage but less crowded; Five Eyes alignment with US CMMC means similar CUI requirements |

---

### Feature Set: MVP (7 Days) vs. Phase 2

#### MVP — Ship in 7 Days
These features are already coded. The goal is to get them working end-to-end against real credentials.

| Feature | Status | Priority |
|---------|--------|----------|
| ShieldReady CMMC Assessment (gap analysis, scoring, controls) | Built | P0 — lead product, drives signups |
| AI Traffic Interceptor (LLM API scanner for PII/credentials/PHI) | Built | P0 — core value prop |
| Dashboard (command center with threat feed, compliance score) | Built | P0 — retention driver |
| Auth (Supabase + Google/GitHub/Microsoft OAuth) | Built | P0 — blocks all else |
| Stripe billing (Free/Pro/Enterprise/Agency tiers) | Built | P0 — revenue |
| Compliance reports (JSON export) | Built | P1 |
| SDK for gateway consumers | Built | P1 |
| WebSocket gateway (real-time intercept) | Built but Vercel-incompatible | P1 — SSE mode ships first |

#### Cut from MVP (not in 7 days)
- PDF report generation (jsPDF) — defer to Phase 2, Week 2
- Multi-tenant MSP dashboard — Phase 3
- WebSocket mode on Vercel — requires Docker/Railway, defer until funding
- CMMC automated remediation workflows — Phase 2

#### Phase 2 — Weeks 2–4 Post-Launch
1. PDF compliance reports (highest conversion driver per architecture notes)
2. Gateway proxy mode (enterprise, highest revenue driver)
3. PDF report white-labeling for Agency tier
4. Automated CMMC gap remediation task assignments
5. Australia DISP assessment module (parallel to ShieldReady)

---

### Architecture Notes for MVP Deployment

**Critical constraint:** `output: "standalone"` in next.config.js is fine for Vercel but means the Docker path diverges. Keep it for now.

**WebSocket on Vercel:** NOT supported. SSE path (`app/api/gateway/`) is the Vercel deployment target. Document this clearly. WS mode is Docker-only until infrastructure budget exists.

**Supabase migrations:** 3 files must be applied to production BEFORE deploy:
- `001_initial_schema.sql`
- `002_shieldready_schema.sql`
- `003_profiles_and_subscriptions.sql`

---

## PART 2: PRICING & TIER STRATEGY

### Current vs. Recommended Pricing

**Current:** Free | $69/mo | $249/mo | $599/mo
**Problem:** $69/month is 60–70% below market for a compliance product in the defense space. When a lost DoD contract costs $500K–$5M, a $69/month tool signals low credibility, not affordability.

### Recommended Tier Structure

| Tier | Price (USD/mo) | Price (AUD/mo) | Who It's For |
|------|---------------|----------------|--------------|
| **Starter (Free)** | $0 | $0 | Evaluation; ShieldReady assessment only, 1 user, no AI gateway |
| **Pro** | $199/mo | $309/mo | Small contractors, 1–10 users, AI gateway + ShieldReady, up to 50,000 API calls/mo |
| **Growth** | $499/mo | $774/mo | Mid-size contractors, up to 25 users, 200,000 API calls/mo, compliance reports |
| **Enterprise** | $999/mo | $1,549/mo | 25+ users, unlimited API calls, custom policies, dedicated support, SSO |
| **Agency** | $2,499/mo | $3,874/mo | MSPs/C3PAOs serving multiple contractors; white-label, multi-tenant, 10 client orgs |

### Tier Feature Matrix

| Feature | Starter | Pro | Growth | Enterprise | Agency |
|---------|---------|-----|--------|------------|--------|
| ShieldReady Assessment | ✅ (read-only) | ✅ Full | ✅ Full | ✅ Full | ✅ White-label |
| AI Gateway (SSE intercept) | ❌ | ✅ | ✅ | ✅ | ✅ |
| API calls/month | 0 | 50K | 200K | Unlimited | Unlimited |
| Users | 1 | 10 | 25 | Unlimited | Unlimited per tenant |
| Compliance reports (JSON) | ❌ | ✅ | ✅ | ✅ | ✅ |
| PDF reports | ❌ | ❌ | ✅ | ✅ | ✅ White-label |
| Custom detection policies | ❌ | ❌ | ✅ | ✅ | ✅ |
| SSO (SAML/OIDC) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Multi-tenant org management | ❌ | ❌ | ❌ | ❌ | ✅ |
| Dedicated support | ❌ | Email | Email + Chat | Email + Chat + Phone | Named CSM |
| SLA | None | None | 99.5% | 99.9% | 99.9% |

### Pricing Rationale

**Why $199 (not $69):**
Prompt Security charges $120/seat/year ($10/seat/month). A 10-user team at $10/seat = $100/month. Kaelus at $199 for 10 users delivers more value (CMMC-specific + assessment module + compliance reports). The price signals seriousness to compliance buyers. Defense contractors routinely pay $300–$500/month for compliance tooling. $69 reads as "side project."

**Why $499 Growth tier:**
Bridges the gap between $199 and $999. Mid-size contractors (50–250 employees) are the highest-volume segment. $499 is 1% of the cost of a single compliance failure.

**Why $2,499 Agency:**
C3PAOs and MSPs serving CMMC contractors are a force multiplier channel. At $2,499/month with 10 client orgs, they're paying $250/org — a trivial add-on to their $30K–$76K assessment fees. This is where the high ARR comes from.

**Annual discount:** Offer 2 months free on annual (equivalent to 16.7% discount). This improves cash flow and reduces churn.

**Australia pricing:** AUD prices calculated at 1.55 USD/AUD. Round to nearest $9 for psychological pricing. Consider listing in AUD on a separate `/au` landing page.

### Free Trial Strategy
- 14-day free trial of Pro tier (no credit card required for first 7 days, required to continue)
- ShieldReady assessment is permanently free (lead generation tool — every completed assessment is a qualified prospect)
- Free tier users see "upgrade" prompts whenever they try to use the AI gateway

---

## PART 3: GO-TO-MARKET & INVESTOR PLAYBOOK

### 7-Day Execution Checklist

**Day 1 (Today — March 16):**
- [x] Fix Vercel git identity blocker (DONE — commit 3072fed)
- [ ] Fill ALL env vars in Vercel dashboard + .env.local
- [ ] Apply 3 Supabase migrations to production
- [ ] Verify npm run build passes clean
- [ ] Confirm Vercel Root Directory = `compliance-firewall-agent`

**Day 2 (March 17):**
- [ ] Deploy to Vercel Preview — walk through full user journey
- [ ] Test Supabase auth (Google OAuth + email)
- [ ] Test Stripe checkout (Pro tier, use Stripe test keys first)
- [ ] Verify ShieldReady assessment completes end-to-end
- [ ] Fix any runtime errors found in Vercel logs
- [ ] Update pricing in Stripe dashboard to match new tier structure

**Day 3 (March 18):**
- [ ] Merge feat/branding-shieldready-polish → main
- [ ] Deploy to Vercel Production (with explicit confirmation before pushing)
- [ ] Verify production domain resolves correctly
- [ ] Set up PostHog analytics (fill NEXT_PUBLIC_POSTHOG_KEY)
- [ ] Do one full end-to-end paid checkout test with Stripe test cards
- [ ] Screenshot every page — share with 3 trusted contacts for gut-check feedback

**Day 4 (March 19):**
- [ ] Write 3 pieces of content: "Why CMMC contractors can't use ChatGPT safely," "ShieldReady: free CMMC gap assessment," "What happens when your subcontractor leaks CUI to OpenAI?"
- [ ] Post to r/CMMC (not salesy — genuinely helpful post with tool mentioned as resource)
- [ ] Create LinkedIn post: problem-agitating narrative about AI tools and CUI leakage
- [ ] Set up Resend for transactional email (fill RESEND_API_KEY)
- [ ] Configure Stripe webhooks to point to production URL

**Day 5 (March 20):**
- [ ] Cold outreach to 20 CMMC-adjacent LinkedIn connections (focus on compliance officers, IT leads at defense contractors)
- [ ] Submit to Product Hunt for a future launch (set a launch date 7–10 days out)
- [ ] Post in 2 LinkedIn CMMC groups (join: "CMMC Compliance Community," "DoD Cybersecurity")
- [ ] Identify 5 C3PAO firms — draft a partnership/referral email offering to co-brand ShieldReady assessments
- [ ] Switch Stripe to LIVE keys (confirm with user before this step)

**Day 6 (March 21):**
- [ ] Australia GTM: Post to AIDN (Australian Industry Defence Network) LinkedIn group
- [ ] Contact 3 Australian defence IT consultancies about DISP + AI governance gap
- [ ] Create `/au` landing page variant with AUD pricing and DISP/Essential Eight messaging
- [ ] Set up Google Analytics or PostHog funnel tracking for signup → paid conversion
- [ ] Write 1-page investor brief (see template below)

**Day 7 (March 22):**
- [ ] First customer target: reach out to 5 warm leads from Days 4–5 with free trial offer
- [ ] Send 3 investor cold emails (In-Q-Tel, Shield Capital, one warm intro if available)
- [ ] Record a 3-minute Loom demo of ShieldReady assessment + AI gateway intercept
- [ ] Post Loom to LinkedIn, r/CMMC, Product Hunt upcoming
- [ ] Weekly review: what's working, what's not, update CLAUDE.md and lessons files

---

### Channels to Reach First 100 Users

**US (Target: 70 users in 30 days)**

| Channel | Tactic | Est. Users | Cost |
|---------|--------|-----------|------|
| r/CMMC | 2 helpful posts/week; free tool promotion | 15–25 | Free |
| LinkedIn CMMC groups | Problem-agitation posts + direct DMs | 20–30 | Free |
| Cold email to SAM-registered companies | New DoD contract registrants = CMMC-bound | 10–20 | Free ($0 with Hunter.io free tier) |
| C3PAO referral partnerships | Each C3PAO firm has 20–50 active clients | 10–20 | Free (rev share offer) |
| Product Hunt launch | 24-hour launch blitz | 5–10 | Free |
| NDIA LinkedIn page engagement | Comment on CMMC posts | 5–10 | Free |

**Australia (Target: 30 users in 30 days)**

| Channel | Tactic | Est. Users | Cost |
|---------|--------|-----------|------|
| AIDN LinkedIn group | DISP + AI governance angle | 10–15 | Free |
| Australian Cyber Security Centre mailing list | Subscribe + engage with their AI guidance | 5–10 | Free |
| Cold email to DISP-registered firms | LinkedIn + company websites | 10–15 | Free |

**Key insight on messaging:** Don't lead with "AI firewall." Lead with "You're one ChatGPT session away from a CMMC violation." Fear of contract loss converts faster than feature benefit in this market.

---

### Investor 1-Pager Framework

```
KAELUS.AI — AI Compliance Firewall for Defense Contractors

THE PROBLEM
80,000 US defense contractors must achieve CMMC Level 2 by 2028.
Most use AI tools (ChatGPT, Copilot, Claude) daily.
Every AI query containing CUI is a potential compliance violation worth millions in lost contracts.
Zero products exist specifically to prevent this.

THE SOLUTION
Kaelus.ai is the only AI compliance firewall purpose-built for CMMC Level 2.
It intercepts LLM API traffic in real-time, scans for CUI/PII/credentials, blocks or sanitizes before data exits.
Includes ShieldReady: a free CMMC gap assessment that converts to paid within 14 days.

TRACTION
[Fill in at Day 7: signups, trials, any paid users]
Live at [production URL]

MARKET
$2.2B AI governance market growing at 15.8% CAGR.
80,000+ US defense contractors mandated to comply by Nov 2026 enforcement.
No direct competitor serves CMMC specifically. Closest: CalypsoAI (enterprise only, no CMMC).

BUSINESS MODEL
SaaS: $199–$2,499/month. Agency tier targets MSPs/C3PAOs (force multiplier).
Land with free ShieldReady assessment → upgrade to gateway within 30 days.
Target ARR at 100 customers: $360K–$600K.

THE ASK
$[X] seed to hire 1 sales/BD person and 1 backend engineer.
18-month runway to 500 paying customers and $1.5M ARR.

FOUNDERS
[Your name, background, why you're uniquely positioned to win this market]

CONTACT
[Email] | [LinkedIn] | kaelus.ai
```

---

### Specific Investor Targets

**US Investors (Priority Order):**

| Investor | Why They're Right | How to Reach |
|---------|------------------|--------------|
| **In-Q-Tel (IQT)** | CIA-backed, funds defense tech and AI security, backed Palantir. CMMC is directly in their mandate. | iqt.org/contact — submit via portfolio form. Best intro: via Booz Allen connection. |
| **Shield Capital** | Mission-focused defense × commercial tech. Early-stage. Exactly this thesis. | shieldcap.com — warm intro preferred; cold LinkedIn DM to partners works. |
| **Paladin Capital Group** | $372M Cyber Fund II. Founded by NSA/CIA/DARPA alumni. SMB defense cyber is their sweet spot (see: RADICL $12M investment). | paladincapgroup.com — submit via site or LinkedIn. |
| **Booz Allen Ventures** | $300M fund, 4–6 deals/year, defense + AI focus. Backed CMMC-adjacent companies. | Cold email to ventures@boozallen.com; LinkedIn to fund leads. |
| **Lockheed Martin Ventures** | Co-invests with Booz Allen. Strategic interest in supply chain security. | venturesteam@lm.com |

**Australia Investors:**

| Investor | Why | How |
|---------|-----|-----|
| **CSIRO Main Sequence Ventures** | Deep tech, national security adjacency | mainsequence.vc |
| **ACP (Australian Capital Partners)** | Defence-aligned, govtech | Direct LinkedIn outreach |
| **Blackbird Ventures** | Largest Australian VC, AI-forward | blackbird.vc — warm intro strongly preferred |

**SBIR/STTR (Non-Dilutive, Apply Immediately):**
- DoD SBIR Topic: Cybersecurity for defense industrial base AI tools — multiple open topics each cycle
- Apply at dodsbirsttr.mil — Phase I awards are $50K–$250K, non-dilutive
- This also serves as validation signal for VCs

---

### Avoiding startups.rip Failure Patterns

Common patterns from failed startups — and specifically how they apply to Kaelus:

| Failure Pattern | How It Kills Startups | Kaelus-Specific Prevention |
|----------------|----------------------|---------------------------|
| **Building for imaginary customers** | Spending months on features no one asked for | Run ShieldReady for free to 50 real defense contractors this week. Let their gap reports tell you what features matter. |
| **Underpricing out of fear** | $69/month signals "side project" to enterprise buyers; attracts price-sensitive churners | New pricing ($199–$2,499) signals serious compliance tool. Maintain it. |
| **No distribution strategy** | Great product, zero users | r/CMMC and C3PAO partnerships are warm channels with real urgency. Start Day 4. |
| **Premature optimization** | Perfecting WebSocket before anyone uses SSE | Ship SSE on Vercel. Defer WebSocket until 50+ paid users request it. |
| **Founder identity not tied to market** | VCs fund people as much as products | Emphasize any DoD/defense background. If none: get 1 advisor with CMMC credibility immediately. |
| **Ignoring existing data** | Not using what's already in the codebase (PostHog, analytics) | Set up PostHog funnel tracking Day 3. Know your activation rate from Day 1. |
| **Single point of failure GTM** | Relying on one channel (e.g., only Product Hunt) | 5 parallel channels: Reddit, LinkedIn, cold email, C3PAO partnerships, SBIR |
| **No retention mechanism** | Acquires users, can't keep them | ShieldReady is a recurring stickiness driver — CMMC requires annual reassessments. Build reminder emails Day 6. |
| **Raises too early, wrong investors** | Dilutes equity without strategic value | Defense-specific investors (IQT, Paladin, Shield Capital) add distribution, not just cash. Wait for the right check. |

---

## PART 4: PERSISTENT LEARNING SYSTEM — STATUS

These files are now live in the repo:

| File | Location | Status |
|------|----------|--------|
| Session state | `compliance-firewall-agent/.claude-session-state.md` | ✅ Created |
| Error log | `compliance-firewall-agent/tasks/lessons.md` | ✅ Created |
| Deployment log | `compliance-firewall-agent/tasks/lessons-deployment.md` | ✅ Created |

**Rules already logged:**
1. Git committer identity must match Vercel account owner → verified and fixed (commit 3072fed)
2. Env vars are empty → Phase 0, must fill before any feature work
3. WebSocket incompatible with Vercel → SSE mode for production
4. Supabase migrations must run before deployment
5. State files must never be deleted — they are project infrastructure

---

## PART 5: DEPLOYMENT SAFETY PROTOCOL

### Pre-Deployment Checklist (Run Before EVERY Push to Production)

```
PRE-DEPLOYMENT VERIFICATION — KAELUS.AI
Date: ___________
Branch: ___________
Deploying to: [ ] Preview  [ ] Production

IDENTITY
[ ] git config user.email = thecelestialmismatch@gmail.com
[ ] git config user.name = thecelestialmismatch

ENVIRONMENT
[ ] All 15 env vars filled in Vercel dashboard (Production environment)
[ ] NEXT_PUBLIC_APP_URL set to production URL (not localhost)
[ ] STRIPE_WEBHOOK_SECRET matches Stripe dashboard webhook
[ ] ENCRYPTION_KEY is 64-char hex (openssl rand -hex 32)

DATABASE
[ ] Supabase migrations applied: 001, 002, 003
[ ] RLS enabled on all new tables
[ ] Supabase production project URL confirmed (not staging)

BUILD
[ ] npm run build passes locally with 0 errors
[ ] No TypeScript errors (even with ignoreBuildErrors: true — fix them anyway)
[ ] Vercel Root Directory = compliance-firewall-agent

ARCHITECTURE
[ ] WebSocket: confirmed NOT used in this deploy (SSE only on Vercel)
[ ] No hardcoded localhost URLs in any component
[ ] No API keys in client-side code

USER CONFIRMATION
[ ] User has reviewed the exact list of changed files
[ ] User has confirmed deployment is safe to proceed
[ ] User has approved: YES / NO

Files changed in this deployment:
1.
2.
3.
```

---

## PART 6: PATTERN EXTRACTION FROM REFERENCE REPOS

Based on analysis of the referenced repositories and their applicable patterns:

**From context-mode (mksglu):** Session state persistence is the single highest-leverage investment in an AI-assisted codebase. Every token saved on re-explaining context is a token available for actual work. The `.claude-session-state.md` + `.claude-memory.md` pattern has been implemented and must be maintained.

**From everything-claude-code (affaan-m):** System prompt skills (like kaelus-dev) should encode the project's full context so no session starts cold. The kaelus-dev skill already does this — the gap was that state files were deleted. Never delete them again.

**From ccg-workflow (fengshao1227):** Error recovery workflows work best when failure modes are pre-categorized. The lessons-deployment.md file serves this function — every deployment error has a category (identity, env vars, database, build) and a standard recovery procedure.

**From gstack (garrytan):** The best startup stacks minimize surface area. Kaelus's stack (Next.js 15 + Supabase + Stripe) is correct for this stage. Resist the urge to add infrastructure (Redis, separate auth service, custom analytics) until revenue justifies it.

**From autoresearch (karpathy):** Iterative refinement with checkpoints beats single-pass perfection. Apply to Kaelus: ship ShieldReady assessment today, iterate on gateway tomorrow, add PDF reports next week. Don't wait for perfect.

---

## APPENDIX: KEY NUMBERS TO REMEMBER

| Metric | Value |
|--------|-------|
| Total US TAM (contractors) | 80,000–300,000 |
| CMMC certified today | ~400 (0.5%) |
| Phase 2 enforcement | November 2026 |
| C3PAO assessment cost | $30K–$76K (rising) |
| Time to get certified | 12–18 months |
| Kaelus Pro price | $199/month |
| Kaelus Agency price | $2,499/month |
| 100 customers ARR (blended) | ~$360K–$600K |
| Target investor: IQT | CIA-backed, defense AI focus |
| Target investor: Shield Capital | Early-stage defense × commercial |
| Target investor: Paladin | $372M Cyber Fund II, CMMC-adjacent |
| Australia equivalent | DISP + ASD Essential Eight |

---

*This document replaces all prior PRDs and roadmaps. Next revision due: 2026-03-23 (Day 7 review).*
*Owner: thecelestialmismatch | Last updated: 2026-03-16*
