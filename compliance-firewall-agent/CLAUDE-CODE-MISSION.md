# KAELUS.AI — CLAUDE CODE MASTER MISSION BRIEF
*Read this ENTIRE file before touching a single line of code. No exceptions.*
*Last updated: 2026-03-16 (v2 — nav cleaned, dead routes redirected, design system confirmed) | This file is the single source of truth for all sessions.*

---

## 0. WHO YOU ARE AND WHAT YOU'RE DOING

You are the sole engineer on Kaelus.ai. Your mission is to ship a market-ready, revenue-generating product in 7 days. The architecture is built. The market analysis is complete. The gaps are identified and prioritized. Your job is to close those gaps in exact priority order without drifting, without building features not on the list, and without deploying without explicit user confirmation.

**You will be corrected. When corrected, immediately add the correction to `tasks/lessons.md` and never repeat it.**

---

## 1. WHAT KAELUS.AI IS (Memorize This)

**One sentence:** Kaelus.ai is a real-time AI compliance firewall that intercepts and sanitizes LLM API traffic before it exits the enterprise perimeter, purpose-built for CMMC Level 2 defense contractors who use AI tools and must protect Controlled Unclassified Information (CUI).

**Why it matters right now:**
- 80,000–300,000 US defense contractors must achieve CMMC Level 2 certification
- Only 0.5% (~400 companies) have done it — the wave is just starting
- Phase 2 enforcement (mandatory C3PAO third-party audits) begins **November 2026** — 8 months away
- Contractors need 12–18 months to certify. The urgency is extreme right now
- **No competitor bundles an AI firewall + CMMC gap assessment in one product**
- C3PAO assessment costs: $30,000–$76,000 (rising to $150K by late 2026)
- A $199/month SaaS that helps avoid a $76,000 assessment failure is a trivial ROI

**Australia secondary market:**
- DISP (Defence Industry Security Program) = Australia's CMMC equivalent
- ASD Essential Eight Maturity Level 2 required for DISP membership
- Near-zero AI governance tools targeting Australian defence contractors
- AUD pricing: multiply USD × 1.55, round to nearest $9

**The paying customer:** Compliance officers and IT security leads at defense contractors with 50–500 employees. Pain: "I don't know if my team is leaking CUI to ChatGPT, and if an auditor finds out, I lose the contract."

---

## 2. TECH STACK (Exact)

```
Framework:     Next.js 15 (App Router)
UI:            React 19, Tailwind CSS, Framer Motion, Radix UI/shadcn
Auth:          Supabase Auth (Google + GitHub + Microsoft OAuth)
Database:      Supabase (PostgreSQL with RLS)
Billing:       Stripe (checkout, webhooks, customer portal)
AI:            OpenRouter (multi-model gateway)
Email:         Resend
Analytics:     PostHog
WebSocket:     ws library (Docker only — NOT Vercel)
SDK:           Custom gateway consumer SDK in /sdk/
Language:      TypeScript (strict mode)
Styling:       Tailwind CSS ONLY — no inline styles ever
Deploy:        Vercel (SSE mode) OR Docker (WebSocket mode)
```

**Build commands:**
```bash
cd compliance-firewall-agent
npm run dev          # development
npm run build        # MUST pass before any deployment claim
npm run start        # production (SSE only on Vercel)
npx tsx server.ts    # development with WebSocket support
```

**Root path for ALL work:** `compliance-firewall-agent/`

---

## 3. ARCHITECTURE MAP (Never Search for Files — Use This)

```
AUTH
  app/login/page.tsx
  app/signup/page.tsx
  app/auth/page.tsx
  app/forgot-password/page.tsx
  middleware.ts              ← protects /command-center routes
  lib/supabase/browser.ts    ← client-side Supabase
  lib/supabase/server.ts     ← server-side Supabase (SSR)
  lib/supabase/client.ts     ← service client + isSupabaseConfigured()

BILLING
  app/api/stripe/checkout/route.ts
  app/api/stripe/webhook/route.ts
  app/api/stripe/portal/route.ts
  setup-stripe.mjs           ← Stripe product/price setup script

DASHBOARD (Command Center)
  app/command-center/page.tsx          ← MAIN (805 lines — do not make larger)
  app/command-center/layout.tsx        ← sidebar nav, top bar
  app/command-center/realtime/         ← live threat feed
  app/command-center/quarantine/       ← quarantined events + human review
  app/command-center/scanner/          ← scan interface
  app/command-center/settings/         ← user settings

SHIELDREADY (CMMC Assessment — CORE PRODUCT)
  app/command-center/shield/page.tsx
  app/command-center/shield/assessment/page.tsx   ← gap assessment
  app/command-center/shield/gaps/page.tsx         ← failing controls
  app/command-center/shield/reports/page.tsx      ← compliance reports UI
  app/command-center/shield/resources/page.tsx    ← CMMC reference docs
  app/command-center/shield/onboarding/page.tsx   ← new user flow

CMMC CONTROL LIBRARY
  lib/shieldready/controls/ac.ts                  ← Access Control
  lib/shieldready/controls/at-au-cm.ts            ← Awareness, Audit, Config Mgmt
  lib/shieldready/controls/ia-ir-ma-mp.ts         ← Auth, Incident, Maintenance, Media
  lib/shieldready/controls/ps-pe-ra-ca-sc-si.ts   ← Personnel, Physical, Risk, etc.
  lib/shieldready/controls/families.ts            ← All 14 CMMC Level 2 domains
  lib/shieldready/controls/index.ts               ← Exports
  lib/shieldready/scoring.ts                      ← Gap scoring engine
  lib/shieldready/storage.ts                      ← Assessment persistence
  lib/shieldready/types.ts                        ← TypeScript types

AI GATEWAY (Core Product)
  app/api/gateway/intercept/route.ts  ← HTTP intercept (Vercel-compatible)
  app/api/gateway/stream/route.ts     ← SSE streaming (Vercel-compatible)
  lib/gateway/stream-proxy.ts         ← Proxy logic
  lib/gateway/stream-scanner.ts       ← Real-time content scanning
  lib/gateway/ws-handler.ts           ← WebSocket (Docker only)
  lib/gateway/event-bus.ts            ← Event dispatch
  lib/gateway/providers/             ← Provider-specific adapters (OpenAI, etc.)
  server.ts                           ← Custom HTTP+WS server (Docker only)

CLASSIFICATION ENGINE
  lib/classifier/                     ← Content classification (PII, credentials, etc.)
  app/api/scan/route.ts               ← Scan endpoint

COMPLIANCE INFRASTRUCTURE
  lib/audit/                          ← Merkle tree, cryptographic anchoring
  lib/hitl/                           ← Human-in-the-loop gating
  lib/interceptor/                    ← Pre/post processing pipeline
  lib/quarantine/                     ← Quarantine logic
  app/api/quarantine/review/          ← Human review endpoint
  app/api/compliance/events/          ← Compliance event recording

REPORTS
  app/api/reports/generate/route.ts   ← JSON report (PDF MISSING — Gap #1)

DEMO MODE
  lib/demo-data.ts                    ← Auto-activates when Supabase not configured
  lib/env.ts                          ← Environment detection helpers

DATABASE MIGRATIONS (run in order before deploy)
  supabase/migrations/001_initial_schema.sql
  supabase/migrations/002_shieldready_schema.sql
  supabase/migrations/003_profiles_and_subscriptions.sql

LANDING / MARKETING
  app/page.tsx                        ← Main landing page
  app/features/page.tsx
  app/about/page.tsx
  app/docs/page.tsx                   ← Integration docs (sparse — needs content)
  app/pricing/page.tsx                ← (Verify this exists; create if not)
  app/contact/page.tsx
  app/changelog/page.tsx

SDK
  sdk/                                ← Gateway consumer SDK

DEAD ROUTES — Nav removed, pages replaced with redirect("/command-center")
  app/command-center/pixeloffice/     ← REDIRECTED — game feature
  app/command-center/memory/          ← REDIRECTED — no compliance value
  app/command-center/workspace/       ← REDIRECTED — generic agent workspace
  app/command-center/agents/          ← REDIRECTED — generic agent builder
  app/command-center/knowledge/       ← REDIRECTED — generic knowledge base
  app/command-center/calendar/        ← REDIRECTED — no compliance value
  app/command-center/pipeline/        ← REDIRECTED — content pipeline

DEAD COMPONENTS (not imported, safe to ignore, delete manually on local machine):
  components/dashboard/{agent-builder,agent-workspace,calendar-view,content-pipeline,
                         knowledge-base,memory-view,openclaw-templates}.tsx
  components/dashboard/pixel-office/ (3 files)

  TO DELETE LOCALLY: cd compliance-firewall-agent && rm -rf app/command-center/{pixeloffice,calendar,memory,workspace,agents,knowledge,pipeline} && rm -rf components/dashboard/pixel-office && rm -f components/dashboard/agent-builder.tsx components/dashboard/agent-workspace.tsx components/dashboard/calendar-view.tsx components/dashboard/content-pipeline.tsx components/dashboard/knowledge-base.tsx components/dashboard/memory-view.tsx components/dashboard/openclaw-templates.ts

ACTIVE NAV — 3 sections, compliance-only (layout.tsx updated):
  Firewall: Overview | Real-Time Feed | Threat Timeline | Live Scanner | Audit Log | Quarantine
  CMMC Shield: SPRS Dashboard | Assessment | Gap Analysis | Reports | Resources
  Response: Compliance AI | Remediation Tasks | Team
  (Settings always visible in bottom bar)
```

---

## 4. ENVIRONMENT VARIABLES (All Must Be Set)

**RULE: Never build a feature before these are confirmed in `.env.local` AND Vercel dashboard.**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_PRO_ANNUAL_PRICE_ID=
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=
STRIPE_AGENCY_MONTHLY_PRICE_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# AI
OPENROUTER_API_KEY=

# Email
RESEND_API_KEY=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Security
ENCRYPTION_KEY=                        # Generate: openssl rand -hex 32 (must be 64 chars)

# App
NEXT_PUBLIC_APP_URL=                   # Production: https://your-domain.vercel.app

# Optional
BYTEZ_API_KEY=
SLACK_WEBHOOK_URL=
```

**Vercel-specific:**
- Root Directory: `compliance-firewall-agent` (NOT repo root)
- Node.js Version: 20.x
- Build Command: `npm run build`
- Output Directory: `.next` (Vercel auto-detects with standalone)

---

## 4b. DESIGN SYSTEM — CONFIRMED TRUTH (Read Before Every UI Change)

**Theme split — DO NOT confuse these:**
| Layer | Theme | Background | Text |
|-------|-------|-----------|------|
| Dashboard / Command Center | **DARK** | `bg-[#07070b]` (main) / `bg-[#0d0d14]` (sidebar) | `text-white`, `text-slate-300/400/500` |
| Landing / Marketing pages | **LIGHT** | `bg-surface` / `bg-white` / `bg-[#F8FAFC]` | `text-slate-800/700/600` |

**Brand color is BLUE — NOT indigo:**
- `brand-400` = `#60A5FA` (blue-400)
- `brand-500` = `#3B82F6` (blue-500)
- `brand-600` = `#2563EB` (blue-600)
- Accent emerald = `#10B981` (success.DEFAULT in tailwind.config)
- **Never use `blue-*` hardcoded** — always `brand-*` tokens
- **Never use `indigo-*`** — there are no indigo tokens in this design system

**Dashboard UI rules (dark theme):**
- Sidebar bg: `bg-[#0d0d14]`, border: `border-white/[0.06]`
- Main content bg: `bg-[#07070b]`
- Cards: `bg-white/5` or `bg-white/[0.03]` with `border border-white/[0.08]`
- Active nav: `bg-brand-500/10 text-brand-400`
- Muted text: `text-slate-500`, secondary text: `text-slate-400`, primary text: `text-white`
- Input fields: `bg-white/5 border border-white/10`
- Hover states: `hover:bg-white/5 hover:text-slate-300`

**Marketing/Landing UI rules (light theme):**
- Backgrounds: `bg-surface` (#F8FAFC), `bg-white`, `bg-surface-100`
- Primary text: `text-slate-900` / `text-slate-800`
- Secondary text: `text-slate-600` / `text-slate-500`
- Borders: `border-slate-200` / `border-surface-200`
- Cards: `bg-white border border-slate-200 shadow-card`
- CTAs: `bg-brand-600 text-white hover:bg-brand-700`

**Never mix dark dashboard styles into light marketing pages and vice versa.**

## 5. CODING RULES (Non-Negotiable)

1. **Tailwind CSS only** — never inline styles, never CSS modules for new components
2. **Design system:** Light theme primary — `bg-surface` (#F8FAFC), `brand-400/500/600` (indigo), `emerald` accent
3. **Typography:** Inter (body), Outfit (display) — import via layout.tsx, never add new font imports
4. **Auth:** Supabase SSR client in server components, browser client in `'use client'` components
5. **Stripe:** Never store price IDs in frontend code — always from `process.env.STRIPE_*_PRICE_ID`
6. **Error handling:** Every new feature needs an error boundary AND a loading state
7. **TypeScript:** Strict types always. No `any` unless truly unavoidable (comment why)
8. **Component size:** Max 500 lines per component. Split if larger
9. **Build check:** Run `npm run build` before declaring ANYTHING done. Zero exceptions
10. **RLS:** Every new Supabase table must have Row Level Security enabled
11. **Logo:** Always use `<Logo />` and `<TextLogo />` components — never raw Shield/Zap icons
12. **Colors:** Use `brand-*` tokens NOT `blue-*` for all accent colors
13. **No WebSocket on Vercel:** server.ts is Docker-only. All Vercel routes use SSE
14. **Demo mode guard:** Any feature that writes real data must check `isSupabaseConfigured()` first

---

## 6. THE 10 GAPS — EXECUTE IN THIS EXACT ORDER

This is your complete backlog. Do not skip gaps. Do not reorder. Do not add scope.

---

### GAP 1: Demo Mode Banner (CRITICAL — 2–4 hours)
**The problem:** When Supabase isn't configured, the app looks fully functional with fake demo data. Real users will think they're getting real results when they're not. A paying customer completing a fake assessment is a support disaster.

**Exact fix:**
1. In `lib/supabase/client.ts`, verify `isSupabaseConfigured()` checks for all 3 Supabase env vars
2. Create a `components/ui/demo-banner.tsx` component:
   - Bright amber warning bar at top of every dashboard page
   - Text: "⚠️ Demo Mode — Your data is not being saved. Connect your account to go live."
   - Link to `/settings` or `/docs` for setup instructions
   - Dismissible per session (localStorage or React state — NOT cookies)
3. Add the banner to `app/command-center/layout.tsx` — renders when `isSupabaseConfigured()` returns false
4. In `app/api/stripe/checkout/route.ts` — add early return if demo mode: `{ error: "Connect your Supabase account before subscribing" }`
5. In `app/command-center/shield/assessment/` — add a note when demo: "Complete your setup to save assessment results"

**Verification:** Start the app without Supabase env vars. Banner must appear. Start with Supabase configured. Banner must NOT appear.

---

### GAP 2: Subscription Gating on Gateway API (CRITICAL — 1 day)
**The problem:** The AI gateway intercept endpoint (`app/api/gateway/intercept/route.ts`) likely doesn't check if the user is on a paid plan. Free users can potentially use the full gateway without paying.

**Exact fix:**
1. Create `lib/subscription/check.ts`:
```typescript
import { createServiceClient } from '@/lib/supabase/client'

export type SubscriptionTier = 'free' | 'pro' | 'growth' | 'enterprise' | 'agency'

export async function getUserSubscription(userId: string): Promise<SubscriptionTier> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('subscriptions')        // verify table name against migration 003
    .select('tier, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
  return (data?.tier as SubscriptionTier) ?? 'free'
}

export function canAccessGateway(tier: SubscriptionTier): boolean {
  return ['pro', 'growth', 'enterprise', 'agency'].includes(tier)
}

export function getApiCallLimit(tier: SubscriptionTier): number {
  const limits: Record<SubscriptionTier, number> = {
    free: 0,
    pro: 50_000,
    growth: 200_000,
    enterprise: Infinity,
    agency: Infinity,
  }
  return limits[tier]
}
```
2. In `app/api/gateway/intercept/route.ts` — add subscription check after auth:
```typescript
const tier = await getUserSubscription(user.id)
if (!canAccessGateway(tier)) {
  return NextResponse.json(
    { error: 'Gateway access requires a Pro plan or higher', upgrade_url: '/pricing' },
    { status: 402 }
  )
}
```
3. Apply same check to `app/api/gateway/stream/route.ts`
4. Apply same check to `app/api/reports/generate/route.ts` (Enterprise+ only for reports)

**Verify:** Test with a free user account — must get 402. Test with pro user — must pass through.

---

### GAP 3: Stripe Webhook → Supabase Subscription Sync (CRITICAL — 4–6 hours)
**The problem:** Stripe checkout may complete but if the webhook isn't correctly updating the Supabase `subscriptions` table, Gap 2's gating won't work. The webhook must be the source of truth for subscription state.

**Exact fix:**
1. Open `app/api/stripe/webhook/route.ts` — verify it handles ALL of these events:
   - `checkout.session.completed` → insert/update subscription record as 'active'
   - `customer.subscription.updated` → update tier and status
   - `customer.subscription.deleted` → set status to 'canceled'
   - `invoice.payment_failed` → set status to 'past_due'
2. Verify the Supabase upsert uses the correct table and column names from `003_profiles_and_subscriptions.sql`
3. Verify `STRIPE_WEBHOOK_SECRET` in env matches the webhook endpoint configured in Stripe dashboard
4. Log webhook events to console in production (for debugging) — remove before v2

**Test procedure:**
```bash
# Install Stripe CLI
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# In another terminal:
stripe trigger checkout.session.completed
# Verify Supabase subscriptions table updated
```

---

### GAP 4: Pricing Page + Updated Tier Structure (HIGH — 1 day)
**The problem:** Current pricing ($69/$249/$599) is 65–75% below market for a compliance product in defense. A $69/month tool signals "side project" to a compliance buyer who just paid $50K for a gap assessment.

**New pricing to implement:**
| Tier | Monthly USD | Annual USD | Stripe Product |
|------|-------------|------------|----------------|
| Starter | FREE | FREE | No product needed |
| Pro | $199 | $1,990 (~$166/mo) | Create in Stripe |
| Growth | $499 | $4,990 (~$416/mo) | Create in Stripe |
| Enterprise | $999 | $9,990 (~$833/mo) | Create in Stripe |
| Agency | $2,499 | $24,990 (~$2,083/mo) | Create in Stripe |

**Exact fix:**
1. Run `node setup-stripe.mjs` to create new products/prices in Stripe (verify the script supports new tiers, update if needed)
2. Update `.env.local` and Vercel env vars with new price IDs:
   - `STRIPE_PRO_MONTHLY_PRICE_ID`
   - `STRIPE_PRO_ANNUAL_PRICE_ID`
   - `STRIPE_GROWTH_MONTHLY_PRICE_ID`
   - `STRIPE_GROWTH_ANNUAL_PRICE_ID`
   - `STRIPE_ENTERPRISE_MONTHLY_PRICE_ID`
   - `STRIPE_ENTERPRISE_ANNUAL_PRICE_ID`
   - `STRIPE_AGENCY_MONTHLY_PRICE_ID`
   - `STRIPE_AGENCY_ANNUAL_PRICE_ID`
3. Create `app/pricing/page.tsx` if it doesn't exist. It must include:
   - Full tier comparison table with features per tier
   - Monthly/annual toggle (annual = 2 months free messaging)
   - Clear CTA per tier → Stripe checkout
   - "Start Free" for Starter tier → /signup
   - AUD pricing note: "Australian customers: prices shown in AUD at checkout"
4. Update Stripe checkout route to handle new tier price IDs

**Tier feature matrix (implement in pricing page):**
```
Feature                    | Starter | Pro  | Growth | Enterprise | Agency
---------------------------|---------|------|--------|------------|-------
ShieldReady Assessment     | ✅ RO   | ✅   | ✅     | ✅         | ✅ WL
AI Gateway (SSE)           | ❌      | ✅   | ✅     | ✅         | ✅
API calls/month            | 0       | 50K  | 200K   | Unlimited  | Unlimited
Users                      | 1       | 10   | 25     | Unlimited  | Unlimited/tenant
Compliance reports (JSON)  | ❌      | ✅   | ✅     | ✅         | ✅
PDF reports                | ❌      | ❌   | ✅     | ✅         | ✅ WL
Custom policies            | ❌      | ❌   | ✅     | ✅         | ✅
SSO                        | ❌      | ❌   | ❌     | ✅         | ✅
Multi-tenant               | ❌      | ❌   | ❌     | ❌         | ✅
Support                    | None    | Email| E+Chat | E+C+Phone  | Named CSM
```
*WL = White-label, RO = Read-only*

---

### GAP 5: Dashboard Nav Cleanup — Hide Non-Compliance Routes (HIGH — 2–4 hours)
**The problem:** The sidebar shows PixelOffice, Memory, Workspace, Agents, Knowledge, Calendar, Timeline, Pipeline alongside actual compliance features. This destroys product credibility with a defense compliance buyer in under 3 seconds.

**Exact fix:**
1. Open `app/command-center/layout.tsx` — find the nav/sidebar configuration
2. Remove these from the navigation array (DO NOT delete the files):
   - pixeloffice → remove entirely
   - memory → remove
   - workspace → remove
   - agents → remove (the generic agents page, not compliance agents)
   - knowledge → remove
   - calendar → remove
   - timeline → remove
3. Handle ambiguous routes:
   - `pipeline` → read `app/command-center/pipeline/page.tsx`. If it shows compliance remediation tasks, rename nav label to "Remediation Tasks". If generic project management, remove.
   - `events` → read `app/command-center/events/page.tsx`. If it shows compliance events/audit log, rename to "Audit Log". If generic events, remove.
   - `team` → KEEP. Multi-user is needed for Enterprise/Agency tier.
4. Reorder the nav to match compliance priority:
   ```
   1. Dashboard (command center home)
   2. ShieldReady (CMMC assessment)
   3. Gaps (failing controls)
   4. Real-time (live threat feed)
   5. Scanner
   6. Quarantine
   7. Audit Log (events)
   8. Reports
   9. Remediation Tasks (if compliance-relevant)
   10. Team
   11. Settings
   ```

**Verification:** Open the dashboard. Every nav item must be directly relevant to compliance. Zero "what does this do?" items.

---

### GAP 6: PDF Compliance Reports (HIGH — 2–3 days)
**The problem:** CMMC auditors (C3PAOs) require printed documentation. The backend already generates rich JSON data. It just needs to be rendered as a professional PDF. This is the single highest-converting feature missing.

**Exact fix:**
1. Install jsPDF and jspdf-autotable:
```bash
npm install jspdf jspdf-autotable
```
2. Create `lib/reports/pdf-generator.ts`:
   - Accept the JSON output from `app/api/reports/generate/`
   - Generate a multi-page PDF with:
     - Cover page: Kaelus.ai logo, organization name, date range, compliance score, "CONFIDENTIAL"
     - Executive summary: total events, violation rate, risk breakdown pie chart reference
     - Threat breakdown table: event type, count, action taken, CMMC control violated
     - CMMC control mapping table: control ID, family, status (Pass/Fail/Partial)
     - Incident log: top 20 events with timestamp, content type, action, severity
     - Footer: "Generated by Kaelus.ai | Merkle Root: [hash] | Tamper-evident audit trail"
3. Add `?format=pdf` to `app/api/reports/generate/route.ts`:
```typescript
const format = req.nextUrl.searchParams.get('format')
if (format === 'pdf') {
  const pdf = await generateCompliancePDF(reportData)
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="kaelus-compliance-report-${from}-to-${to}.pdf"`,
    },
  })
}
```
4. Add "Download PDF Report" button to `app/command-center/shield/reports/page.tsx`
5. Gate PDF download behind Growth tier and above (per subscription check)

**Design requirements:**
- Professional, not flashy. This is an auditor's document.
- Color scheme: white background, brand-600 (indigo) headings, black body text
- Include page numbers, date/time generated, organization name on every page
- NEVER put demo data in a downloaded PDF — check `isSupabaseConfigured()` first

---

### GAP 7: Landing Page Rewrite — CMMC Buyer Focus (HIGH — 1 day)
**The problem:** The landing page likely uses generic "AI compliance" messaging. A CMMC compliance officer needs to see within 3 seconds that this product was built for them specifically.

**Exact fix — Hero section (`app/page.tsx`):**
Replace current hero with:
```
HEADLINE: "Your team is one ChatGPT session away from a CMMC violation."
SUBHEADLINE: "Kaelus.ai intercepts every AI query before it leaves your network.
              Protect CUI. Pass your C3PAO assessment. Keep your DoD contracts."
CTA 1: "Start Free Assessment →" (→ /command-center/shield/onboarding)
CTA 2: "See a Live Demo" (→ /demo)
TRUST BAR: "CMMC Level 2 | NIST SP 800-171 | Real-time Protection | <50ms Latency"
```

**Social proof section (add below hero):**
```
"3 things defense contractors leak to ChatGPT every day:"
  → Contract numbers and CAGE codes
  → DD-250 form data and technical specs
  → Personnel records and security clearance info
"Kaelus catches all of it. Before it's too late."
```

**How it works section (visual, 3 steps):**
```
Step 1: [Employee icon] "Your team uses AI tools as normal. No behavior change required."
Step 2: [Shield icon] "Every query passes through the Kaelus firewall in <50ms. CUI is detected and flagged."
Step 3: [Dashboard icon] "You see everything. Every threat. Every action. Every audit trail."
```

**Stats section:**
```
"80,000+" defense contractors must certify
"0.5%" have done it — the deadline is coming
"$76,000" average C3PAO assessment cost
"<50ms" Kaelus intercept latency
```

**Pricing section:** Link to `/pricing` page (created in Gap 4)

**Australia section (at bottom):**
```
"Australian Defence Contractors" heading
"Kaelus maps to DISP and ASD Essential Eight requirements.
 Built for the Five Eyes supply chain."
```

---

### GAP 8: Onboarding Flow Verification and Activation Email (MEDIUM — 1 day)
**The problem:** `app/command-center/shield/onboarding/page.tsx` exists but its functionality is unverified. A new user who signs up and doesn't get immediate value within 10 minutes will never return.

**Exact fix:**
1. Read `app/command-center/shield/onboarding/page.tsx` in full. Map the existing flow.
2. The onboarding flow MUST accomplish these 4 steps in sequence:
   - Step 1: "Tell us about your organization" (name, size, DoD contract type — save to Supabase)
   - Step 2: "Complete your CMMC gap assessment" — link to `/command-center/shield/assessment`
   - Step 3: "Connect your first AI tool" — show the integration snippet (how to route OpenAI through Kaelus)
   - Step 4: "Your first threat detected" — either show demo event OR wait for first real event
3. If the onboarding page doesn't cover all 4 steps, add the missing ones
4. Wire Resend email triggers:
   - **On signup:** Welcome email with "Complete your assessment →" CTA
   - **24 hours after signup, if assessment incomplete:** "Your CMMC gap score is waiting" reminder
   - **On first threat detected:** "Kaelus just blocked a potential CUI exposure" trigger email
5. Create `app/api/email/` route if none exists. Use Resend SDK.

---

### GAP 9: CMMC-Specific Threat Detection Patterns (MEDIUM — 1–2 days)
**The problem:** The scanner likely detects generic PII (SSNs, credit cards, emails). Defense contractors need detection of CUI-specific patterns that CMMC auditors care about.

**Exact fix:**
1. Open `lib/classifier/` — read existing pattern files
2. Add a new `lib/classifier/cmmc-patterns.ts` file:
```typescript
// CMMC-specific CUI detection patterns
export const CMMC_PATTERNS = [
  {
    id: 'CONTRACT_NUMBER',
    label: 'DoD Contract Number',
    pattern: /[A-Z]\d{5}-\d{2}-[A-Z]-\d{4}/g,
    cmmc_control: 'MP.L2-3.8.1',
    severity: 'HIGH',
    description: 'DoD contract number detected — potential CUI exposure'
  },
  {
    id: 'CAGE_CODE',
    label: 'CAGE Code',
    pattern: /\b[A-Z0-9]{5}\b/g,  // refine with context
    cmmc_control: 'MP.L2-3.8.1',
    severity: 'MEDIUM',
    description: 'Potential CAGE code detected'
  },
  {
    id: 'ITAR_MARKER',
    label: 'ITAR Technical Data',
    pattern: /(ITAR|EAR|export controlled|22 CFR|15 CFR)/gi,
    cmmc_control: 'SC.L2-3.13.1',
    severity: 'CRITICAL',
    description: 'ITAR/EAR export control marker detected'
  },
  {
    id: 'DFARS_REFERENCE',
    label: 'DFARS Clause',
    pattern: /DFARS\s+\d{3}\.\d{3,4}/gi,
    cmmc_control: 'CA.L2-3.12.1',
    severity: 'HIGH',
    description: 'DFARS clause reference detected in AI query'
  },
  {
    id: 'DD_FORM',
    label: 'DD Form Data',
    pattern: /(DD-250|DD-1750|DD Form \d{3,4})/gi,
    cmmc_control: 'MP.L2-3.8.1',
    severity: 'HIGH',
    description: 'Military form reference detected — may contain CUI'
  },
  {
    id: 'CLEARANCE_REFERENCE',
    label: 'Security Clearance Reference',
    pattern: /(top secret|secret clearance|TS\/SCI|SCI access|Q clearance)/gi,
    cmmc_control: 'PS.L2-3.9.1',
    severity: 'CRITICAL',
    description: 'Security clearance reference in AI query'
  },
  {
    id: 'CONTROLLED_UNCLASSIFIED',
    label: 'CUI Marker',
    pattern: /(controlled unclassified|CUI\/|FOUO|For Official Use Only)/gi,
    cmmc_control: 'MP.L2-3.8.1',
    severity: 'CRITICAL',
    description: 'CUI classification marker detected'
  },
]
```
3. Import and run `CMMC_PATTERNS` in `lib/gateway/stream-scanner.ts` alongside existing patterns
4. Update the threat event schema to include `cmmc_control` field (the CMMC control that's at risk)
5. Show the CMMC control ID on the quarantine review page — auditors want to see exactly which control was at risk

---

### GAP 10: Integration Documentation (MEDIUM — 1 day)
**The problem:** A defense contractor's IT lead needs to configure their team's AI tools to route through Kaelus. If they can't do it in 30 minutes with no support, they churn. The `/docs` page currently has sparse or placeholder content.

**Exact fix:**
Rewrite `app/docs/page.tsx` with these sections:

**Section 1: Quick Start (5 minutes)**
```
1. Sign up and complete your ShieldReady assessment
2. Get your API key from Settings → API Keys
3. Change one line in your app:
   BEFORE: const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
   AFTER:  const client = new OpenAI({
             apiKey: process.env.OPENAI_API_KEY,
             baseURL: 'https://[your-kaelus-url]/api/gateway/intercept'
           })
4. That's it. Your AI traffic is now protected.
```

**Section 2: Code Examples**
- OpenAI Node.js SDK
- OpenAI Python SDK
- Anthropic Node.js SDK
- Azure OpenAI
- cURL example for any provider
- SDK (`import { KaelusGateway } from '@kaelus/sdk'`)

**Section 3: What Gets Scanned**
- PII (SSN, email, phone, credit card)
- Defense-specific CUI (contract numbers, ITAR markers, DD forms)
- Credentials (API keys, passwords, tokens)
- PHI (for healthcare-adjacent contractors)
- Source code (prevents IP leakage to LLM providers)

**Section 4: Compliance Mapping**
- How each scan category maps to CMMC Level 2 controls
- NIST SP 800-171 practice reference table
- How to use Kaelus to demonstrate compliance to a C3PAO auditor

**Section 5: Enterprise Gateway (Agency/Enterprise tiers)**
- Proxy configuration for organization-wide deployment
- Policy customization
- Webhook integration for SIEM

---

## 7. DEPLOYMENT RULES (Read Before Every Push)

**CRITICAL: Never deploy to Vercel without explicit user confirmation. Always:**
1. List the exact files being changed
2. Show the diff or summary of changes
3. Ask: "Ready to deploy? Y/N"
4. Wait for confirmation before executing any push

**Pre-deployment checklist:**
- [ ] `git config user.email` = thecelestialmismatch@gmail.com
- [ ] `npm run build` passes with zero errors
- [ ] All 15 env vars filled in Vercel dashboard
- [ ] Supabase migrations 001, 002, 003 applied to production
- [ ] `NEXT_PUBLIC_APP_URL` = production URL (not localhost)
- [ ] `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- [ ] Demo mode banner tested (shows without Supabase, hidden with Supabase)
- [ ] No hardcoded localhost URLs anywhere
- [ ] Vercel Root Directory = `compliance-firewall-agent`

**Known Vercel constraints:**
- WebSocket (server.ts) = Docker/Railway ONLY. Never attempt to deploy ws-handler on Vercel
- `output: "standalone"` = fine for Vercel but is Docker-optimized; don't change it
- Vercel builds from `compliance-firewall-agent/` subdirectory — verify this in project settings

---

## 8. ERROR HISTORY (Apply These Rules Every Session)

From `tasks/lessons.md`:

1. **Git identity** — commits with wrong user identity cause Vercel to block deployment as "unauthorized collaboration." Always verify: `git config user.email` = thecelestialmismatch@gmail.com before any push.

2. **Env vars empty** — app runs in demo mode without Supabase/Stripe/OpenRouter. Always confirm all 15 env vars are set before claiming the app "works."

3. **Supabase migrations** — production DB is likely empty. Run `npx supabase db push` or apply migration SQL files manually in Supabase SQL editor before deploying.

4. **WebSocket on Vercel** — will fail silently or error. server.ts is Docker-only. Use SSE.

5. **State files deleted** — `.claude-session-state.md` and `.claude-memory.md` were cleaned in a commit. Never delete them. They are project infrastructure.

6. **Design system conflict** — CLAUDE.md says "Light theme" but kaelus-dev skill says "Dark theme." Source of truth: check `tailwind.config.js` and existing components. Do not assume.

---

## 9. PRICING (Memorize This — Implement Exactly)

| Tier | USD/mo | AUD/mo | Users | API calls | Key feature |
|------|--------|--------|-------|-----------|-------------|
| Starter | Free | Free | 1 | 0 | ShieldReady assessment (read-only) |
| Pro | $199 | $309 | 10 | 50K | Full gateway + reports |
| Growth | $499 | $774 | 25 | 200K | PDF reports + custom policies |
| Enterprise | $999 | $1,549 | Unlimited | Unlimited | SSO + dedicated support |
| Agency | $2,499 | $3,874 | Unlimited/tenant | Unlimited | White-label + multi-tenant |

Annual: 2 months free (16.7% discount)
Free trial: 14 days of Pro (no credit card for first 7 days)

---

## 10. WHAT SUCCESS LOOKS LIKE IN 7 DAYS

- [ ] Live on Vercel Production (main branch, not preview)
- [ ] Real Supabase auth working (not demo mode)
- [ ] Stripe Pro checkout works end-to-end
- [ ] ShieldReady assessment saves real data
- [ ] Gateway intercepts and classifies a real OpenAI API call
- [ ] PDF report generates and downloads
- [ ] Demo mode banner working correctly
- [ ] Non-compliance nav items hidden
- [ ] PostHog tracking signups and assessment completions
- [ ] First paying customer or committed trial user

---

## 11. SESSION START PROTOCOL (Do This Every Single Session)

```
1. Read this file (CLAUDE-CODE-MISSION.md) — completely
2. Read tasks/lessons.md — apply every rule listed
3. Read tasks/lessons-deployment.md — apply every deployment rule
4. Read .claude-session-state.md — resume from exact last task
5. Report to user:
   📍 KAELUS.AI — SESSION RESUME
   Last done: [from state file]
   Next task: [exact gap + step]
   Blockers: [anything blocking]
6. Ask one clarifying question if needed. Then start working immediately.
```

---

## 12. SESSION END PROTOCOL

```
1. Update .claude-session-state.md:
   - Move completed tasks to DONE
   - Set exact next task
   - Add session entry with date and summary

2. Update tasks/lessons.md with any new corrections from the user

3. Update tasks/lessons-deployment.md if any deployment was attempted

4. Git commit:
   cd compliance-firewall-agent
   git add .claude-session-state.md tasks/lessons.md tasks/lessons-deployment.md [changed files]
   git commit -m "chore: session sync — [one-line summary]"
   git push origin [branch]

5. Tell user:
   ✅ SESSION SAVED
   Done this session: [list]
   Next: [exact task]
   Committed: yes
```

---

*This file is permanent. Update it when new architectural decisions are made, new errors are discovered, or rules change. Never delete it. Never let it go stale.*
