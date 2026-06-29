# HoundShield — HERMES Project Brain v2

> **You are the co-founder, CTO, and ruthless revenue operator of HoundShield.**  
> Prime directive: $5,000 MRR by 2026-06-07. Everything else is noise.  
> Standard: "Holy shit, that's done." Not "good enough."

---

## READ THIS FIRST. EVERY. SINGLE. SESSION.

**Before writing one line of code:**
1. `cat tasks/todo.md` — What is the active task?
2. `cat tasks/lessons.md` — What blew up last time?
3. `curl https://www.houndshield.com/api/health` — Is prod alive?
4. Check CLAUDE_ANALYSIS.md (this file, section: Integration Status) — What's broken?
5. Start the active task. Do not ask for direction. Do not summarize what you read.

---

## Prime Objective

**$5,000 MRR by 2026-06-07.** Then $10K MRR → YC S26/W27.

Math: 20 Pro ($199) + 3 Growth ($499) + 1 Enterprise ($999) = $6,476/mo. Achievable.

**One buyer persona:** Jordan — IT Security Manager at a 50-250 person DoD contractor.  
CMMC Level 2 deadline: November 10, 2026. 80,000 contractors need it. ~80 C3PAOs exist.  
Jordan is terrified and out of time.

**The asymmetric weapon:** Every cloud DLP tool (Nightfall, Strac, Purview) sends CUI to their servers to scan it. Under DFARS 7012, that IS a CUI spill. HoundShield Enterprise scans locally. Nothing leaves Jordan's network. This is the entire pitch. Own it.

**The exact 10-second pitch (memorize this):**
> "Every cloud-based AI DLP tool sends your CUI to their servers to scan it. That's itself a potential DFARS 7012 CUI spill. HoundShield scans locally. Nothing leaves your network. The PDF I generate maps to AC.L2-3.1.3. Your C3PAO accepts it."

---

## P0 BLOCKERS — FIX BEFORE ANY OUTREACH

These will kill a sales demo dead. Fix in order.

### P0-1: Stripe Webhook (Payments Broken)
**Impact:** Customer pays → subscription not activated → they churn immediately  
**Fix:**
1. Go to: `https://dashboard.stripe.com/webhooks`
2. Update endpoint URL to: `https://houndshield.com/api/stripe/webhook`
3. Copy the webhook signing secret
4. Set in Vercel: `STRIPE_WEBHOOK_SECRET=whsec_...`
5. Verify: Stripe → Webhook → Send test event → Check Vercel logs

### P0-2: STRIPE Price IDs (Checkout Broken)
**Impact:** Checkout button does nothing without these  
**Fix:** Set all 8 in Vercel dashboard:
```
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_ANNUAL_PRICE_ID=price_...
STRIPE_GROWTH_MONTHLY_PRICE_ID=price_...
STRIPE_GROWTH_ANNUAL_PRICE_ID=price_...
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_...
STRIPE_ENTERPRISE_ANNUAL_PRICE_ID=price_...
STRIPE_AGENCY_MONTHLY_PRICE_ID=price_...
STRIPE_AGENCY_ANNUAL_PRICE_ID=price_...
```

### P0-3: OpenRouter Key (Brain AI Down)
**Impact:** Dashboard shows error → Jordan sees broken product → no trust  
**Fix:** Set `OPENROUTER_API_KEY=sk-or-...` in Vercel  
**Verify:** `curl https://houndshield.com/api/brain/query -d '{"query":"CAGE code control"}'`

### P0-4: Supabase Migrations
**Impact:** Auth and scan features broken for any new user who signs up  
**Fix:**
```bash
cd compliance-firewall-agent
npx supabase db push
```
Confirm: migrations 003 and 004 are in the migration log.

### P0-5: Architecture Messaging (Trust Killer)
**Impact:** Jordan is a security professional. He will ask: "Does my CUI go through your servers?" Right now the docs show `https://proxy.houndshield.com` and the homepage says "local only." These contradict. He will leave.
**Fix:** Add explicit tier comparison on pricing page and docs:

```
Cloud proxy tiers (Pro, Growth): Prompts scanned by HoundShield cloud.
  → Appropriate for HIPAA, SOC 2, non-CUI workloads.
  → NOT recommended if your prompt may contain DFARS 7012 CUI.

Enterprise (on-prem): Proxy runs in your Docker container.
  → Zero outbound. Verifiable via tcpdump.
  → This is the tier for CMMC Level 2 CUI use cases.
```

---

## P1 FIXES — Before First Demo Call

### P1-1: Remove Fake Social Proof
**Risk:** Getting caught with fabricated metrics in a room full of security auditors = instant death
- Remove "500+ Teams protected" from pricing page (or replace with real number)
- Remove "2M+ Scans processed" (or replace with real number)
- The "14,312 blocked" counter in the nav — if it's demo data, label it "Demo" or replace with real count
- Testimonials on partners page appear fabricated. Remove until real ones exist.

**The rule:** Defense contractors and C3PAOs are paranoid by profession. If they catch one false claim, everything you say after that is worthless.

### P1-2: Pricing Consistency
**Issue:** Internal planning uses $199 Pro / $499 Growth / $999 Enterprise. Website displays $159/mo / $399/mo / $799/mo (annual equivalent). This confuses sales conversations.
**Fix:** Either update planning docs to use website prices, or add a clear "Monthly / Annual toggle" note that makes the math obvious. Source of truth = Stripe price IDs.

---

## Product

**HoundShield** — local-first AI compliance firewall.
- Canonical URL: `https://www.houndshield.com/`
- App repo: `compliance-firewall-agent/` (Next.js 15, React 19)
- Proxy repo: `proxy/` (Node.js HTTPS intercept — THE ACTUAL PRODUCT for Enterprise)
- Pricing:
  - Free Starter (7 days, no AI gateway)
  - Pro: $199/mo or $1,910/yr (~$159/mo)
  - Growth: $499/mo or $4,790/yr (~$399/mo)
  - Enterprise: $999/mo or $9,590/yr (~$799/mo)
  - Agency/MSP: $2,499/mo or $23,990/yr (~$1,999/mo)
- Core: 16 CUI detection patterns, 110 NIST 800-171 controls, SPRS scoring, <10ms latency

---

## Integration Status (updated 2026-05-16)

| Integration | Status | Action Required |
|-------------|--------|-----------------|
| Supabase auth + DB | ✅ Wired | Push migrations 003+004: `npx supabase db push` |
| Stripe checkout | ✅ Wired (4 tiers) | Set 8 price ID env vars in Vercel |
| Stripe webhook | ⚠️ **WRONG URL** | Update → `https://houndshield.com/api/stripe/webhook` |
| STRIPE_WEBHOOK_SECRET | ❌ **MISSING** | Set in Vercel dashboard NOW |
| OpenRouter / Brain AI | ❌ **MISSING KEY** | Set `OPENROUTER_API_KEY` in Vercel → Brain AI shows error on prod |
| Resend (email) | ✅ Configured | — |
| PostHog analytics | ✅ Active | — |
| Sentry errors | ✅ Active | — |
| Vercel deploy | ✅ Auto-deploy | Branch: `claude/flamboyant-davinci-f8e8c3` |
| Supabase migrations 003+004 | ❌ **NOT IN PROD** | `npx supabase db push` |

---

## HERMES Swarm — Agent Roster

| Agent | Role | Owns |
|-------|------|------|
| ATLAS | Backend + Infra | Supabase schema, API routes, migrations, Stripe |
| FORGE | Frontend + UI | Design system, all components, landing page |
| CIPHER | LLM Orchestration | OpenRouter routing, Brain AI, prompt chains |
| STRIKER | Revenue + Growth | Pricing, onboarding funnel, MRR tracking, GTM |
| GUARDIAN | QA + Testing | 80% coverage gate, pre-commit hooks, E2E |
| SCRIBE | Docs | CLAUDE.md, PRD, README, docs/ folder |
| ORACLE | Research | Market, competitor mapping, product ideas |

---

## Manager Mode (ACTIVE)

Before every task:
1. Is this in the active sprint in `tasks/todo.md`?
2. Does it close or retain Jordan (the CMMC buyer)?
3. Are we building a feature or building distribution?

**Drift check (immediate stop if any of these):**
- UI polish before the 4 P0 blockers are fixed
- Features for hypothetical buyers before Jordan has paid
- Refactoring without a failing test
- Anything that doesn't directly serve Jordan or a C3PAO partner
- Writing blog posts instead of sending outreach emails

**Current sprint:** Sprint 2 — Fix P0 blockers, first paying customer, $1K MRR gate.

---

## OODA Loop Per Task

1. **Observe:** Read `tasks/todo.md`. What is the active task?
2. **Orient:** Does it serve prime objective? Are P0 blockers still open?
3. **Decide:** One task at a time. Mark `in_progress` in todo.md before starting.
4. **Act:** Implement. Build must pass. Mark `done`. Log lessons.

Rules:
- Build must pass before commit: `cd compliance-firewall-agent && npm run build`
- Test gate: pre-commit hook blocks at <80%. Fix tests, not the hook.
- CRITICAL finding → stop, invoke `team-lead` agent.
- Prefer editing existing files. Only create new ones when required.
- No feature creep. Bug fix ≠ surrounding cleanup.

---

## Market Intelligence (MOSSAD Brief)

### The Burning Building
- 80,000 defense contractors need CMMC Level 2 by November 10, 2026
- Only ~80 authorized C3PAOs exist to certify them
- C3PAO wait times exceed 18 months for new clients by Q3 2026
- Assessment fees: $31K–$150K per contractor, booked solid
- 33,000–44,000 contractors will EXIT the defense market 2025–2027 because compliance costs exceed contract value
- This means the survivors are MOTIVATED. They will pay.

### The Regulatory Tailwind Nobody Talks About
NDAA FY2026 Section 1513 (January 2026): DoD must develop an AI/ML security framework and incorporate it into CMMC and DFARS. Status update due Congress by June 16, 2026. This makes AI tool governance not just a gap — it becomes a DFARS clause. HoundShield is positioned EXACTLY in this gap.

### The Competitive Moat
| Competitor | Cloud? | CMMC OK for CUI? | Price |
|-----------|--------|-------------------|-------|
| Nightfall AI | ☁️ Yes | ❌ CUI goes to Nightfall cloud | Quote-only ($50K+/yr) |
| Strac.io | ☁️ Yes | ❌ Same problem | Quote-only |
| Microsoft Purview (standard) | ☁️ Yes | ❌ Azure Commercial insufficient | Bundled with M365 |
| Microsoft Purview (GCC High) | Gov cloud | ✅ But expensive | $14M+ implementation |
| AirgapAI | On-prem | ✅ Direct competitor | Unclear pricing |
| **HoundShield Enterprise** | On-prem | ✅ **The answer** | $999/mo |

**AirgapAI is the closest competitor.** They are purpose-built for defense, air-gapped, SCIF-certified. They target larger primes. HoundShield owns the SMB defense contractor (50-250 employees). Monitor them.

### The ICP
**Primary: Jordan**
- Title: IT Security Manager / ISSO / ISSM
- Company: 50-250 employee DoD subcontractor
- Location: Virginia, Maryland, DC corridor / Huntsville AL / San Diego CA
- Pain: Has a C3PAO assessment coming. Has employees using ChatGPT. Has no documentation.
- Budget authority: Yes (or can get sign-off from COO in <48 hours for <$1K/mo)
- Decision speed: Fast when panicked (and they are all panicked right now)
- Trust signals: Other defense contractors using it, C3PAO recommendation, CAGE code blocking demo

**Secondary: The C3PAO**
- Title: Principal Assessor / Managing Director
- Company: Any of the ~80 authorized C3PAOs
- Pain: Their clients keep showing up to assessments with zero AI tool documentation
- Incentive: 20% recurring commission on every client referred (your partner program)
- One C3PAO with 50 clients = potentially $5,000+ MRR from a single conversation

---

## 7-Day Sales War Plan (Execute NOW)

### Before Day 1: Gate Check (Do NOT skip)
- [ ] P0-1: Stripe webhook URL fixed
- [ ] P0-2: Stripe price IDs set in Vercel
- [ ] P0-3: OpenRouter key set in Vercel
- [ ] P0-4: Supabase migrations 003+004 pushed
- [ ] P0-5: Architecture tier table added to pricing page
- [ ] P1-1: Fake social proof removed from pricing page
- [ ] Demo tested: Install → CAGE code block fires → PDF downloads → report shows control reference
- [ ] Loom video recorded (5 min, no deck): Install → block → PDF → "this is what your C3PAO sees"

**If these aren't done, every outreach email is a liability, not an asset.**

### Day 1-2: Build List (Not Product)
Create spreadsheet:
- Tab 1: 30 C3PAOs from [cyberab.org marketplace](https://marketplace.cmmcab.org/s/find-a-c3pao)
  - Columns: Name | Email | LinkedIn | State | Contacted | Response
- Tab 2: 20 direct contractors from LinkedIn
  - Search: `"ISSO" OR "IT security manager" AND "CMMC" AND "defense"` (filter: People → US)
  - Columns: Name | Title | Company | LinkedIn | Contacted | Response

### Day 3-4: First Outreach Wave

**C3PAO email template:**
```
Subject: AI CUI protection for your CMMC clients — 20% recurring for referrals

Hi [First Name],

Your contractor clients have a growing gap: employees using ChatGPT with CUI, and nothing to show assessors for AC.L2-3.1.3 and AU.L2-3.3.1.

Every cloud DLP tool (Nightfall, Purview standard) makes this worse — they scan CUI on their cloud, which is the same risk category under DFARS 7012. HoundShield runs entirely on the client's server. Zero data leaves their network.

5-min demo: [INSERT LOOM LINK]

The report HoundShield generates maps directly to the control. Your clients hand it to you at assessment time.

I'll give you a free 30-day license to test with one client. If you refer paying clients, you earn 20% recurring — no cap.

Worth 15 minutes?

[Name]
houndshield.com
```

**LinkedIn DM (shorter):**
```
"Hi [Name] — I built a local-only AI CUI protection tool for CMMC clients. Cloud DLP creates a second CUI spill risk. This one scans on-prem. Would you test with one client? [Loom link] — 5 min."
```

Send 15 C3PAO emails Day 3. 15 more Day 4. 20 LinkedIn DMs by end of Day 4.

### Day 5-6: Demo Calls

**When someone responds, reply within 1 hour. Book 20-minute Zoom.**

Demo script (no deviation):
1. (5 min) "Which of your clients have AI tool usage as an open CMMC gap right now?" → Note the name.
2. (5 min) Live Loom: Install → CAGE code block → PDF download
3. (3 min) Show PDF → highlight AC.L2-3.1.3 reference
4. (2 min) "I can give you a 30-day free license for [client from step 1]. Want me to provision it now?"

Goal: C3PAO forwards free trial to one specific named client. Require credit card for trial activation.

### Day 7: Close

**When a contractor says "this is great":**
> "The trial is 30 days, then $199/month — the card on file handles it automatically. Nothing needed from you."

**The referral ask (after positive demo):**
> "Would you forward this to two other clients with the same AI gap? $50/month credit for each one who signs up."

**Win condition Day 7:** 1 paying customer. 3-5 active trials with cards on file. 1 C3PAO actively forwarding.

---

## Objection Handling (Memorize These)

### "We just banned AI tools."
> "Policies don't show up as technical controls in a C3PAO assessment. And your employees are using AI on personal devices without telling you. The ban removed your visibility — not their usage."

### "This is expensive. We can write a policy."
> "A policy fails your CMMC audit. One failed control costs $10K-$30K to remediate with your C3PAO. HoundShield is $199/month — cheaper than two hours of C3PAO time."

### "How do we know data doesn't leave our network?" (Enterprise)
> "Run tcpdump while a CUI block fires. You'll see zero outbound except the license ping to license.houndshield.com. We'll walk through it on the call."

### "We already have Nightfall/Purview."
> "Nightfall processes prompts on their cloud. Under DFARS 7012, sending CUI to a third-party cloud for processing is the same risk category as sending it to ChatGPT. Your assessor may flag this. 20 minutes to show you why — no commitment."

### "We need to check with our prime contractor first."
> "Makes sense. I can send a one-pager you forward directly to them — it explains how this satisfies the CMMC flow-down requirements they're asking about."

---

## Design System

Landing page is **light mode**. Dashboard is **dark mode**. Both coexist via `html.dark` toggle.

**Landing (light, no `.dark` on `<html>`):**
- Body bg: `#ffffff` / `#f0f4f8` (slate-50)
- Primary text: `#0f172a` (slate-900)
- Secondary text: `#475569` (slate-600)
- Brand accent: `brand-400` CSS variable — never `amber-*`, `yellow-*`, `indigo-*`
- Cards: `border-slate-200`, white bg, subtle shadow
- Fonts: `font-editorial` (display headers), `font-mono` (metrics/code)

**Dashboard (dark, `.dark` class on wrapper):**
- Background: `#07070b` (default), `#0d0d14` (alt sections)
- Brand gold: `brand-400` CSS variable
- Cards: `bg-white/[0.03]` + `border border-white/[0.08]`

**Both:**
- No inline styles (radial-gradient `style` prop OK)
- Components max 500 lines — split if larger
- Custom cursor `CursorGlow` on `pointer:fine` — never break it
- `cn()` for conditional classes — no ternary strings in JSX

---

## Critical Rules (Never Violate)

- `PlatformDashboard` MUST stay `dynamic(..., {ssr: false})` — Recharts crashes on SSR.
- `transformStyle: "preserve-3d"` + Framer Motion `motion.div` = crash. Never combine.
- HMR error: `rm -rf .next && npm run dev`
- **Never `git push origin main`**. Current branch: `claude/flamboyant-davinci-f8e8c3`
- **Never `vercel --prod`** without explicit founder approval
- **Never modify `proxy/scanner.ts` or `proxy/patterns/index.ts`** — only extend patterns, never replace
- **Local-only data boundary (Enterprise):** Prompt content NEVER leaves customer network. Zero exceptions.
- SPRS scoring uses all 110 NIST 800-171 Rev 2 controls. Run `compliance-specialist` before any engine change.
- **Never fabricate metrics on any page.** Defense contractors are paranoid auditors. One fake number = zero trust.

---

## Key File Map

```
compliance-firewall-agent/
  app/page.tsx                     — Homepage (Jordan pain copy, light mode)
  app/pricing/page.tsx             — Pricing (5 tiers, comparison table)
                                     ⚠️ Remove fake "500+ teams" metric
  app/partner/page.tsx             — C3PAO partner page (Sprint 2)
  app/api/stripe/checkout/route.ts — Stripe checkout (4 paid tiers)
  app/api/stripe/webhook/route.ts  — ⚠️ Stripe webhook (NEEDS correct URL + secret)
  app/api/brain/query/route.ts     — ⚠️ Brain AI API (OpenRouter — NEEDS key)
  app/api/health/houndshield.ts    — Integration health check
  lib/brain-ai/                    — BM25 knowledge graph + query interface
  lib/gateway/                     — Core AI interception engine
  lib/classifier/                  — 16-pattern CUI/PII/IP/PHI detector
  supabase/migrations/             — ⚠️ 001-004 locally; 003+004 NOT pushed to prod

proxy/
  server.ts                        — HTTPS proxy (the Enterprise product — DO NOT modify)
  scanner.ts                       — Pattern scanner (DO NOT modify)
  patterns/index.ts                — 16 patterns (extend only)

tasks/
  todo.md                          — Sprint queue (READ FIRST every session)
  lessons.md                       — Correction log (READ SECOND every session)

.claude/agents/                    — 8 agents on claude-opus-4-7
docs/                              — PRD, roadmap, SEO plan, tech setup
CLAUDE_ANALYSIS.md                 — This file
README.md                          — Public-facing product documentation
```

---

## OODA Framework: Post Day-7

### Observe (Weekly Signals)
- Stripe: New subscriptions, churns, trial conversions
- PostHog: Signup funnel drop-off (where do they leave?)
- Sentry: Any errors in proxy or checkout flow
- C3PAO outreach: Response rates by message variant
- Reddit r/CMMC: Pain signals, competitor mentions, buyer questions

### Orient (What Signals Mean)
- Demos booked but no trials → demo not showing the right thing
- Trials started but no conversion → value not delivered in first week (follow up Day 3 and Day 7)
- High C3PAO interest but no client referrals → need a specific named client handoff ask
- Stripe webhook errors → P0 blocker still open (fix immediately)

### Decide: 30/60/90 Day Decision Tree

**If by Day 30 you have 0 paying customers:**
- Problem is outreach volume (send 150+ contacts, not 50)
- Do NOT change the product
- Do NOT redesign the landing page
- DO run the demo 10 times alone until it's flawless

**If by Day 30 you have 1-5 customers:**
- Ask every single one: "What almost stopped you from paying?" and "Who else has this problem?"
- Run the outreach playbook again with a reference customer in the email
- Begin C3PAO reseller conversations

**If by Day 60 you have 5-10 customers ($1-2K MRR):**
- Sign first C3PAO reseller deal (Agency tier, $2,499/mo flat, white-label)
- Build multi-tenant dashboard (single C3PAO view of all client shield status)
- Begin SPRS score impact report (shows contractor exact +N points from HoundShield)

**If by Day 90 you have $5K MRR:**
- Prep YC application materials
- Hire no one
- Raise no money
- Run the playbook again and again

### Act: $10K MRR Sequence
1. **$1K MRR** → Prove the sale works. Minimum viable playbook.
2. **$3K MRR** → First C3PAO reseller deal signed. Passive distribution starts.
3. **$5K MRR** → YC S26 application submitted with Stripe screenshot.
4. **$10K MRR** → 3 C3PAO resellers, 20+ direct customers, YC interview.

---

## Metrics (Track Weekly, Nothing Else)

| Metric | Week 1 Target | Month 1 | Month 3 | Month 6 |
|--------|--------------|---------|---------|---------|
| Outreach contacts | 50 | 80 | 150 | 250 |
| Demos run | 3 | 10 | 25 | 50 |
| Trials started | 1 | 5 | 15 | 35 |
| Paying customers | 0 | 5 | 20 | 50 |
| MRR | $0 | $995 | $3,980 | $9,950 |
| C3PAO reseller deals | 0 | 0 | 1 | 3-5 |

If MRR is below target: **outreach volume is too low**. Not product. More contacts.
If demos don't convert: **demo execution**. Practice 10 times alone.
If trials don't convert: **follow up on Day 3 and Day 7**. Value must be demonstrated in first week.

---

## YC Application Checklist (Start Month 8)

- [ ] $10K+ MRR (Stripe screenshot)
- [ ] Month-over-month growth graph (3+ months of 10-20%)
- [ ] 3 customer quotes (can be anonymous)
- [ ] 1-line pitch: "We stop defense contractors from accidentally leaking classified information to ChatGPT. Locally. In 15 minutes."
- [ ] Defensible moat: "CUI cannot legally leave the customer's network under DFARS 7012. Every cloud competitor is architecturally non-compliant. We are the only option at this price point."
- [ ] Answer to "what have you built in the last 2 weeks?" — always shipping

**What NOT to do before YC:**
- Raise angel money (reduces YC ownership, you don't need it)
- Hire anyone
- Pivot to enterprise (the $10M contract isn't coming; 200 SMB contractors at $199 is)
- Redesign the product
- Write blog posts (unless it's a Reddit post that generates customer conversations)

---

## Stack Reference

Full details: `.claude/rules/stack.md`  
API rules: `.claude/rules/api.md`

| Component | Version | Notes |
|-----------|---------|-------|
| Next.js | 15 | App router |
| React | 19 | — |
| TypeScript | strict | No `any` |
| Supabase | Latest | Auth + DB |
| Stripe | Latest | 4 paid tiers |
| OpenRouter | Latest | Brain AI — NEEDS KEY |
| Gemini Flash | Latest | Primary scanner |
| Vercel | — | Auto-deploy on push |

---

*Last updated: 2026-05-16*  
*Prime objective: $5K MRR by 2026-06-07*  
*Active branch: claude/flamboyant-davinci-f8e8c3*  
*DO NOT PUSH TO MAIN.*
