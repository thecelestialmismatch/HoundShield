# KAELUS.AI — PRODUCT REQUIREMENTS DOCUMENT
*Version 1.0 — 2026-03-16 | Replaces all prior roadmaps and specs*
*This PRD reflects what's actually in the codebase, what the market needs, and the exact gaps between them.*

---

## EXECUTIVE SUMMARY

Hound Shield.ai is an AI compliance firewall purpose-built for CMMC Level 2 defense contractors. The core technical architecture is sound and genuinely differentiated. The problem is that the codebase has drifted: significant engineering effort has gone into features (PixelOffice, memory, workspace, agents, calendar, pipeline) that have no relevance to the CMMC buyer. Meanwhile, the features that actually convert defense contractors to paying customers — PDF compliance reports, subscription-gated feature access, a functional onboarding flow, and CMMC-specific threat patterns in the scanner — are either missing, incomplete, or not wired together.

This PRD defines:
1. What the market needs (with specifics)
2. What Hound Shield currently offers (honest assessment)
3. Every gap between them
4. How to fix each gap (prioritized)
5. What gets cut entirely

---

## SECTION 1: WHAT THE MARKET NEEDS

### The Buyer: CMMC Level 2 Defense Contractor

**Profile:**
- 50–500 employees
- Holds or bids on DoD contracts involving Controlled Unclassified Information (CUI)
- Uses AI tools daily: ChatGPT, GitHub Copilot, Microsoft Copilot, Claude, Gemini
- Has a compliance officer or IT security lead responsible for CMMC
- Currently paying $8K–$76K for gap assessments and C3PAO evaluations
- Faces contract loss — potentially millions — if found non-compliant

**Their actual pain points (in order of urgency):**

1. **"I don't know if my team is leaking CUI to ChatGPT."** They have no visibility into what employees are sending to external AI providers. This is their biggest fear.

2. **"I need to show an auditor I have controls in place."** CMMC auditors (C3PAOs) need documented evidence of access controls, incident response, and data protection. A JSON file doesn't satisfy this — they need a signed PDF audit trail.

3. **"I don't know which CMMC controls I'm failing."** Most contractors have done no self-assessment. The gap between "what CMMC requires" and "where I am today" is invisible to them.

4. **"I don't have 6 months and $100K to get compliant."** They need a path to compliance that fits their budget and timeline. Tools that help them self-certify or reduce the scope of a C3PAO assessment are extremely valuable.

5. **"I can't ask my employees to stop using AI."** They need protection that works without changing employee behavior — a transparent proxy, not a ban.

**What makes them pay:**
- Immediate visibility into AI traffic risks (dashboard + threat feed)
- A compliance gap report they can show to an auditor
- Proof that their AI tools are not leaking CUI
- Something that helps them pass or prepare for a C3PAO assessment

**What does NOT make them pay:**
- A virtual pixel office
- An AI memory system
- A generic task pipeline
- A workspace/knowledge base
- A calendar or timeline view

---

## SECTION 2: WHAT KAELUS.AI CURRENTLY OFFERS

### Core Compliance Features (Built — Verified in Codebase)

| Feature | Location | State | Notes |
|---------|----------|-------|-------|
| CMMC Gap Assessment | `app/command-center/shield/assessment/` | ✅ Built | Controls mapped: AC, AT-AU-CM, IA-IR-MA-MP, PS-PE-RA-CA-SC-SI |
| Gap Analysis View | `app/command-center/shield/gaps/` | ✅ Built | Shows failing controls |
| Compliance Score | `lib/shieldready/scoring.ts` | ✅ Built | Scoring logic present |
| CMMC Resources | `app/command-center/shield/resources/` | ✅ Built | Reference material |
| ShieldReady Onboarding | `app/command-center/shield/onboarding/` | ⚠️ Exists | Functionality unverified |
| Compliance Reports | `app/command-center/shield/reports/` | ⚠️ Exists | UI present; backend returns JSON only |
| AI Traffic Intercept (SSE) | `app/api/gateway/intercept/route.ts` | ✅ Built | Core product |
| AI Traffic Stream (SSE) | `app/api/gateway/stream/route.ts` | ✅ Built | SSE mode (Vercel-compatible) |
| WebSocket Gateway | `server.ts` + `lib/gateway/ws-handler.ts` | ⚠️ Docker only | Not deployable on Vercel |
| Real-time Threat Feed | `app/command-center/realtime/page.tsx` | ✅ Built | Live event stream |
| Quarantine System | `app/command-center/quarantine/` | ✅ Built | With human review (`api/quarantine/review`) |
| Scanner | `app/command-center/scanner/` + `app/api/scan/` | ✅ Built | Classification engine |
| Compliance Event Log | `app/api/compliance/events/` | ✅ Built | Event recording |
| JSON Report Generation | `app/api/reports/generate/` | ✅ Built | JSON only — PDF missing |
| HITL (Human-in-the-Loop) | `lib/hitl/` | ✅ Built | Gating for destructive ops |
| Audit/Merkle Anchoring | `lib/audit/` | ✅ Built | Cryptographic event integrity |
| Demo Mode | `lib/demo-data.ts` | ✅ Built | Auto-activates without Supabase |
| Auth (Supabase + OAuth) | `app/auth/`, `app/login/`, `app/signup/` | ✅ Built | Google + GitHub + Microsoft |
| Stripe Billing | `app/api/stripe/` (checkout, webhook, portal) | ✅ Built | Needs live keys + webhook config |
| SDK | `sdk/` | ✅ Built | Gateway consumer SDK |

### Non-Compliance Features (Built — Should Not Exist in MVP)

| Feature | Location | Problem |
|---------|----------|---------|
| PixelOffice | `app/command-center/pixeloffice/` + component | No compliance value. Confuses buyers. Signals "toy product." Remove from nav. |
| Memory View | `app/command-center/memory/` | Not relevant to CMMC buyer |
| Workspace | `app/command-center/workspace/` | Generic; dilutes the product identity |
| Agents Page | `app/command-center/agents/` + `app/agents/` | Separate from compliance; confused positioning |
| Knowledge Base | `app/command-center/knowledge/` | Not differentiated |
| Calendar | `app/command-center/calendar/` | Has nothing to do with compliance |
| Timeline | `app/command-center/timeline/` | Ditto |
| Pipeline | `app/command-center/pipeline/` | Unclear purpose for CMMC buyer |
| Events (generic) | `app/command-center/events/` | Duplicates compliance events? Confusing |

---

## SECTION 3: GAP ANALYSIS — WHAT'S MISSING

These are the specific gaps between what the market needs and what's currently built or working. Each is rated by impact on conversion.

---

### GAP 1: No PDF Compliance Reports
**Impact: CRITICAL — Biggest single conversion driver missing**

**What the market needs:** CMMC auditors require printed/signed documentation. A compliance officer cannot hand a C3PAO auditor a JSON file. They need a PDF that says: "Hound Shield.ai monitored AI traffic for this organization from [date] to [date], detected [X] potential CUI exposure events, took [Y] actions, and the following CMMC controls were tested."

**What exists:** `app/api/reports/generate/` returns JSON with event breakdown and compliance status. `app/command-center/shield/reports/` has a UI. The architecture notes explicitly flag this as the "biggest conversion driver."

**What's missing:** jsPDF or Puppeteer rendering of the JSON data into a formatted, downloadable, client-branded PDF.

**How to fix:**
```
Priority: P0 — build in Week 2 (Day 8–14)
Approach: Use jsPDF (already likely a known dependency) or react-pdf
Output: /api/reports/generate?format=pdf returns a signed PDF
PDF includes: Executive summary, threat breakdown table, CMMC control mapping, Merkle root for tamper-evidence, Hound Shield.ai logo, client org name, date range
Time estimate: 2–3 days engineering
```

---

### GAP 2: Subscription Gating Is Probably Not Enforced
**Impact: CRITICAL — Revenue leakage; free users may access paid features**

**What the market needs:** Users who haven't paid should not access the AI gateway, advanced reports, or multi-user features. Stripe billing exists but it's unclear if the gateway API routes check for an active subscription before processing.

**What exists:** Stripe checkout, webhook, and portal routes are built. Supabase has a `profiles_and_subscriptions` migration. The middleware protects `/command-center`. But does `app/api/gateway/intercept/route.ts` verify the user is on a paid plan?

**What's missing:** Subscription tier check in API routes. A user on the free plan should get a 402 or redirect-to-upgrade response when they hit the gateway.

**How to fix:**
```
Priority: P0 — must ship before going live
Approach: Create a lib/subscription/check.ts helper that reads Supabase subscription status
Apply to: app/api/gateway/intercept, app/api/gateway/stream, app/api/reports/generate
Response for unpaid: { error: "Upgrade required", upgrade_url: "/pricing" }
Time estimate: 1 day engineering
```

---

### GAP 3: No Integration Guide / SDK Documentation
**Impact: HIGH — Customers can't self-onboard without knowing how to route AI traffic through Hound Shield**

**What the market needs:** A defense contractor's IT lead needs a clear, step-by-step guide to configure their team's AI tools to route through Hound Shield. If they can't integrate in 30 minutes, they churn. The SDK exists but there are no docs showing how to use it.

**What exists:** `sdk/` client SDK. `app/docs/page.tsx` exists (docs page). `app/api/health/route.ts` exists.

**What's missing:** Actual integration documentation. Specifically:
- "Point your OpenAI base URL to: https://kaelus.ai/api/gateway/intercept"
- Example code snippets for OpenAI, Anthropic, and Azure OpenAI clients
- Environment variable setup guide
- A "test your integration" verification endpoint

**How to fix:**
```
Priority: P1 — needed for activation, not launch-blocking
Approach: Write /app/docs/page.tsx content with integration guides
Provide curl examples + Node.js/Python SDK snippets
Add a /api/gateway/test endpoint that returns a safe "integration verified" response
Time estimate: 1 day content work, no new engineering
```

---

### GAP 4: Scanner Lacks CMMC-Specific Threat Patterns
**Impact: HIGH — Generic PII detection misses the patterns that CMMC auditors actually care about**

**What the market needs:** Defense contractors need detection of CUI-specific data, not just generic PII. CMMC-specific sensitive patterns include:
- Contract numbers (N00019-XX-C-XXXX format)
- CAGE codes and DUNS numbers
- DD-250/DD-1750 form data
- ITAR-controlled technical data markers
- DFARS clause numbers in documents
- Military base names + operations language (potential OPSEC violation)
- SSN/EIN in contractor personnel records (classified as CUI under privacy category)

**What exists:** `lib/classifier/` has a classification engine. `app/api/scan/route.ts` scans content.

**What's missing:** CMMC-specific regex patterns and classification categories in the classifier. The scanner likely detects generic PII (SSNs, credit cards, emails) but not defense-specific CUI patterns.

**How to fix:**
```
Priority: P1 — differentiator for CMMC market
Approach: Extend lib/classifier/ with CMMC CUI pattern library
Add detection categories: CONTRACT_NUMBER, CAGE_CODE, ITAR_DATA, DFARS_REFERENCE, DD_FORM_DATA
Map each detection category to the CMMC control it violates (e.g., MP.L2-3.8.1)
Time estimate: 1–2 days (research + regex patterns)
```

---

### GAP 5: No Functional Onboarding Flow
**Impact: HIGH — Activation rate will be near zero without this**

**What the market needs:** A first-time user (compliance officer at a defense contractor) lands, signs up, and within 10 minutes should: (1) understand their CMMC gap score, (2) see a simulated threat event, (3) know what to do next. If they don't get value in the first session, they never return.

**What exists:** `app/command-center/shield/onboarding/page.tsx` exists. Demo mode (`lib/demo-data.ts`) auto-populates with fake threat data when Supabase isn't configured.

**What's missing:**
- A step-by-step onboarding wizard that walks new users through: ShieldReady assessment → view gaps → connect AI tool → see first intercept event
- A "you've achieved X" milestone to celebrate activation
- Email sequence triggered after signup (Resend is in the stack but not verified as wired)

**How to fix:**
```
Priority: P1 — build in Week 2
Approach: Validate shield/onboarding page is functional and covers the 4-step flow
Wire Resend email: (1) welcome email on signup, (2) "complete your assessment" reminder at 24h if assessment incomplete, (3) "you intercepted your first threat" trigger email
Time estimate: 2 days
```

---

### GAP 6: Landing Page / Pricing Page Not CMMC-Optimized
**Impact: HIGH — First impression for buyers and investors is generic**

**What the market needs:** A CMMC compliance officer landing on the site needs to see within 3 seconds: "This is built for me. It will help me protect CUI and pass my CMMC assessment." The pricing page needs to show exactly what's in each tier in a way that maps to their compliance needs.

**What exists:** Landing page rebuilt (per last commit). Features page exists. Pricing is presumably on the landing page or a separate page.

**What's missing:**
- CMMC-specific headline: "Stop your team from leaking CUI to ChatGPT" beats "AI Compliance Firewall"
- Trust signals: "CMMC Level 2 Compliant," "NIST SP 800-171 Mapped," DoD contractor logos (if any)
- A live threat ticker or "X CUI exposures blocked today" counter
- Clear pricing page with tier comparison matrix mapped to CMMC controls
- AUD pricing page for Australia visitors

**How to fix:**
```
Priority: P1 — GTM-blocking; update before Product Hunt launch
Approach: Update app/page.tsx hero section copy
Add social proof / trust signals section
Create /pricing page with full tier table (from the pricing strategy in this blueprint)
Time estimate: 1 day
```

---

### GAP 7: Non-Compliance Routes Pollute the Dashboard
**Impact: MEDIUM — UX/positioning damage; signals "everything app" rather than "compliance tool"**

**What the market needs:** A compliance officer opening the dashboard should see compliance. Every sidebar link should scream "security" and "compliance." PixelOffice, calendar, timeline, and pipeline make the product look like a project management tool that cosplays as security software.

**What's in the codebase that needs to go (from the sidebar nav):**
- PixelOffice — remove entirely from nav (component can stay in codebase for later if needed)
- Calendar — remove or park behind a "Coming Soon" flag
- Timeline — remove or park
- Pipeline — unclear purpose; if it's a task pipeline for compliance remediation, rename it "Remediation Tasks" and keep it. If it's generic, remove.
- Events — if this is compliance events, keep and rename "Audit Log." If generic, remove.
- Memory — remove from nav

**How to fix:**
```
Priority: P1 — navigation config change, not new development
Approach: Audit command-center/layout.tsx sidebar links
Remove or hide non-compliance routes from nav
"Pipeline" → rename to "Remediation Tasks" if compliance-relevant
Time estimate: 2–4 hours
```

---

### GAP 8: Demo Mode Masks Real Broken State
**Impact: MEDIUM — Risk of shipping "working" demo with broken real functionality**

**What exists:** When Supabase isn't configured, `lib/demo-data.ts` populates everything with fake data. The reports endpoint explicitly returns `demo: true`. This means the app looks great locally without any real credentials.

**The risk:** You may ship to production with env vars still missing and the app will show demo data to real users without any indication they're not connected. A user who completes a ShieldReady assessment against demo data thinks they got real results — they didn't.

**How to fix:**
```
Priority: P0 — must ship before going live
Approach: Add a visible "DEMO MODE — Connect your account" banner when isSupabaseConfigured() returns false
Prevent real assessment data from being saved to demo state
Block Stripe checkout when in demo mode (no point charging for a non-functional account)
Time estimate: 2–4 hours
```

---

### GAP 9: No Australia-Specific Positioning
**Impact: LOW-MEDIUM — Secondary market untapped**

**What's missing:** `/au` landing page with DISP + ASD Essential Eight framing, AUD pricing, Australian trust signals (ASD partnership if achievable, Australian defence contractor logos).

**How to fix:**
```
Priority: P2 — after US launch
Approach: Create /app/au/page.tsx as a thin wrapper of the main landing page with AU-specific copy
Map ShieldReady controls to ASD Essential Eight maturity levels (significant engineering but high-value for AU market)
Time estimate: 1 day (landing page only); 1 week (Essential Eight mapping)
```

---

### GAP 10: No "How Am I Protected?" Explainer for Non-Technical Buyers
**Impact: MEDIUM — Sales friction**

**What the market needs:** A compliance officer (not a developer) needs to understand how Hound Shield works without reading API documentation. "Your employees' AI queries pass through our firewall before reaching OpenAI. We scan each one in <50ms. Anything containing sensitive data is flagged, logged, and optionally blocked. You see it all in the dashboard."

**What's missing:** A simple visual explainer on the landing page and inside the dashboard onboarding.

**How to fix:**
```
Priority: P1 — content/design work only
Approach: Add a 3-step visual to the landing page: [Employee uses AI] → [Hound Shield scans in real-time] → [CUI blocked/logged, you stay compliant]
Add the same explainer to the onboarding flow
Time estimate: 2–4 hours
```

---

## SECTION 4: WHAT GETS CUT FROM MVP

These features should be removed from the navigation and deprioritized completely. They are NOT cut from the codebase — but they will not be accessible in the MVP product:

| Feature | Why Cut | Action |
|---------|---------|--------|
| PixelOffice | Novelty feature with zero compliance value; damages credibility with defense buyers | Remove from sidebar nav entirely |
| Memory View | No compliance relevance for MVP | Remove from sidebar nav |
| Generic Workspace | Unfocused; competes with Notion/Linear | Remove from sidebar nav |
| Generic Agents | Confuses positioning (is this an AI assistant app?) | Remove from sidebar nav |
| Generic Knowledge Base | Not differentiated | Remove from sidebar nav |
| Calendar | No compliance function | Remove from sidebar nav |
| Timeline | No compliance function | Remove from sidebar nav |
| WebSocket mode (Vercel) | Requires persistent server; incompatible with Vercel | Document as Docker-only; SSE is the Vercel path |

---

## SECTION 5: MVP FEATURE COMPLETENESS CHECKLIST

Before calling the product market-ready, every item below must be verified working end-to-end against real credentials (not demo mode):

**Authentication**
- [ ] Signup with email/password creates Supabase user
- [ ] Google OAuth works in production
- [ ] GitHub OAuth works in production
- [ ] Middleware correctly redirects unauthenticated users to login
- [ ] User profile created in Supabase on first login

**Billing**
- [ ] Free tier user can access ShieldReady assessment
- [ ] Free tier user is blocked from AI gateway with upgrade prompt
- [ ] Pro tier Stripe checkout completes successfully
- [ ] Stripe webhook updates Supabase subscription record
- [ ] User gains gateway access after successful payment
- [ ] Stripe customer portal allows plan management

**ShieldReady Assessment**
- [ ] New user can complete full CMMC gap assessment
- [ ] Scoring engine returns accurate gap score
- [ ] Gaps page shows failing controls with remediation guidance
- [ ] Assessment data saves to Supabase (not demo data)

**AI Gateway (SSE mode)**
- [ ] Intercept endpoint correctly proxies an OpenAI API call
- [ ] Scanner detects PII in a test prompt and flags it
- [ ] Flagged events appear in the real-time dashboard
- [ ] Quarantine system correctly holds flagged events for review
- [ ] Allowed events are proxied through without modification

**Reports**
- [ ] JSON report generates with real event data
- [ ] Report covers correct date range
- [ ] Merkle root is calculated and included

**Demo Mode Guard**
- [ ] Banner displayed when Supabase not configured
- [ ] Stripe checkout blocked in demo mode

---

## SECTION 6: TECHNICAL DEBT TO TRACK (NOT FIX NOW)

These are real issues in the codebase that don't block launch but will matter at scale:

| Issue | Impact | Fix Timing |
|-------|--------|-----------|
| `command-center/page.tsx` is 805 lines | Maintainability; split needed | Month 2 |
| WebSocket mode not tested in production | Enterprise feature blocked | After first 10 paying customers |
| `output: "standalone"` adds Docker complexity without benefit on Vercel | Build complexity | After funding |
| TypeScript `any` types (despite ignoreBuildErrors: true) | Type safety | Ongoing |
| No rate limiting on gateway intercept endpoint | DDoS risk at scale | Month 2 |
| RLS not verified on all Supabase tables | Security risk | Before enterprise tier launch |
| No automated test suite | Manual QA is slow | Month 2 |
| ENCRYPTION_KEY generation not documented in setup | Security risk if weak key used | Day 2 |

---

## SECTION 7: SUCCESS METRICS

These are the metrics to track from Day 1 (set up in PostHog):

| Metric | Target (30 days) | Notes |
|--------|-----------------|-------|
| Signups | 100+ | Free tier, ShieldReady |
| Assessment completions | 60%+ of signups | Activation event |
| Free → Paid conversion | 8–12% | Industry benchmark |
| Paying customers | 8–12 | At $199 avg = ~$1,600–$2,400 MRR |
| Churn rate | <5% monthly | Compliance = sticky |
| Gateway API calls/month | 500K+ | Signals real usage |
| NPS after first assessment | 7+ | Qualitative health check |

---

## APPENDIX: CMMC CONTROL FAMILIES IN CODEBASE

The following CMMC Level 2 control families are already mapped in `lib/shieldready/controls/`:

| File | CMMC Families Covered |
|------|-----------------------|
| `ac.ts` | Access Control (AC) |
| `at-au-cm.ts` | Awareness & Training, Audit & Accountability, Configuration Management |
| `ia-ir-ma-mp.ts` | Identification & Authentication, Incident Response, Maintenance, Media Protection |
| `ps-pe-ra-ca-sc-si.ts` | Personnel Security, Physical Protection, Risk Assessment, Security Assessment, System & Comm. Protection, System & Information Integrity |
| `families.ts` | All 14 CMMC Level 2 domains |

All 110 NIST SP 800-171 practices appear to be mapped. This is a genuine competitive differentiator — most tools don't do this mapping at this depth.

---

*PRD Owner: thecelestialmismatch*
*Last Updated: 2026-03-16*
*Review Date: 2026-03-23 (after first 7 days live)*
