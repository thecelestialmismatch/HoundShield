# KAELUS.ONLINE — MASTER PROMPT v2.0
# Token budget: ~1,200 tokens (90% reduction from v1)
# Paste this as your FIRST message each session. Nothing else needed.

---

## STEP 1: LOAD THESE FILES (in parallel, before anything else)

```
compliance-firewall-agent/.claude-memory.md
compliance-firewall-agent/.claude-session-state.md
advisory/ROADMAP.md
```

If `.claude-session-state.md` is missing, read `advisory/ROADMAP.md` and start from the top of ACTIVE PRIORITIES.

---

## STEP 2: REPORT BACK (10 lines max, exact format)

```
KAELUS — SESSION RESUME
Phase: [current phase]
Done: [last completed task]
Next: [exact next action — be specific, not vague]
Blockers: [or "none"]
Branch: [active git branch]
```

Then ask ONE question if genuinely ambiguous. Start working immediately after.

---

## IDENTITY

Product: Kaelus.online — one AI compliance firewall enforcing SOC 2, HIPAA, and CMMC Level 2 simultaneously.
Stack: Next.js 15, React 19, TypeScript, Supabase, Stripe, Tailwind, Framer Motion, Recharts
App root: `compliance-firewall-agent/`
Live URL: https://kaelus.online
Revenue target: $10K MRR, YC S26/W27
Market: 80,000+ US contractors need CMMC L2. November 2026 enforcement deadline.

---

## NON-NEGOTIABLE RULES

| Rule | Detail |
|------|--------|
| Branch | Never push to main. Always `feat/*` or `fix/*` branch. |
| Build | `npm run build` must pass before every commit. |
| Design | Tailwind only. `bg-[#07070b]` dark background. `brand-*` tokens. Components under 500 lines. |
| Types | Strict TypeScript. No `any`. Document if unavoidable. |
| Auth | Supabase SSR client for server components. Browser client for client components only. |
| Database | RLS policy required on every new Supabase table. |
| Text | No em-dashes in code, comments, or docs. Use periods or commas instead. |
| SSR | `PlatformDashboard` and all Recharts components must be `dynamic(() => import(...), { ssr: false })`. |
| Errors | Every endpoint needs try/catch plus user-facing error message. |

---

## ACTIVE PRIORITIES (execute in this order)

```
P0  MCP Server endpoint        — biggest moat, enables AI agent integrations
P0  REST API v1                — /api/v1/* for MSP/consultant integrations
P1  PostHog analytics          — instrument key conversion events
P1  Sentry error tracking      — production error visibility
P2  Product Hunt launch        — "AI Compliance Firewall for Defense Contractors"
P2  Reddit posts               — r/cmmc, r/cybersecurity, r/netsec
P3  Cold outreach              — 50 defense contractors
```

---

## PHASE MAP

```
Phase 1 — Revenue Launch    [ACTIVE]    $1K MRR, first paying customers
Phase 2 — Engineering       [NEXT]      MCP Server, REST API v1, AI Agent v2, alerts
Phase 3 — GTM               [PARALLEL]  PH, Reddit, LinkedIn, cold outreach
Phase 4 — Scale             [Q2 2026]   Multi-tenant, MSP/Agency dashboard
Phase 5 — Enterprise        [Q3 2026]   Custom deployments, Five Eyes, Government
```

---

## KEY FILES (never search for these)

```
Landing:       app/page.tsx (7 sections, SectionSpotlight wrappers)
Auth:          app/signup/page.tsx, app/login/page.tsx, middleware.ts
Stripe:        app/api/stripe/{checkout,webhook,portal}/route.ts
Dashboard:     app/command-center/page.tsx, app/command-center/layout.tsx
Gateway:       app/api/gateway/route.ts, lib/gateway/stream-proxy.ts
Scanner:       lib/gateway/stream-scanner.ts, lib/classifier/risk-engine.ts
CMMC:          app/command-center/shield/*, lib/shieldready/*
Brain AI:      app/api/brain-ai/*, lib/brain-ai/*
SIEM:          lib/integrations/siem/*
Reports:       app/api/reports/generate/route.ts
Migrations:    supabase/migrations/ (001-009 applied)
Config:        next.config.js, tailwind.config.js, .env.local
```

---

## DESIGN TOKENS

```
Background:  bg-[#07070b]  /  bg-[#0d0d14]
Primary:     text-indigo-500, border-indigo-600
Accent:      text-emerald-400, bg-emerald-500/10
Gold:        brand-400 CSS var (never raw amber-* or yellow-*)
Fonts:       font-editorial (display), font-mono (metrics/code)
Cards:       bg-gray-800/50 border border-gray-700/50 rounded-lg p-4
Buttons:     px-4 py-2 rounded-lg font-semibold transition-colors
Inputs:      px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white
```

---

## ADVISORY FOLDER

All research, decisions, and audit findings live in `advisory/`:

```
advisory/ROADMAP.md      — current sprint, revenue targets, phase status
advisory/DECISIONS.md    — architectural decisions with WHY
advisory/AUDIT.md        — code quality findings, bugs, tech debt
advisory/LINKS.md        — researched external resources and integration plans
advisory/LEGACY.md       — what moved to /legacy/ and why
```

---

## SESSION END PROTOCOL

Run this in order before closing every session:

1. Update `compliance-firewall-agent/.claude-session-state.md`:
   - Move completed tasks to "DONE THIS SESSION"
   - Set NEXT TASK to exact next action
   - Add session entry to HISTORY

2. Update `compliance-firewall-agent/.claude-memory.md`:
   - Add new architectural decisions only
   - Update component status if changed

3. Commit:
   ```bash
   git add compliance-firewall-agent/.claude-memory.md
   git add compliance-firewall-agent/.claude-session-state.md
   git add [any files changed]
   git commit -m "chore: session sync — [one-line summary]"
   git push origin [branch]
   ```

4. Report:
   ```
   SESSION SAVED
   Done: [list]
   Pushed: yes
   Next session: [exact task]
   ```

---

## ENVIRONMENT VARIABLES

All must be set in Vercel production + `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_PRO_MONTHLY_PRICE_ID
STRIPE_PRO_ANNUAL_PRICE_ID
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID
STRIPE_AGENCY_MONTHLY_PRICE_ID
OPENROUTER_API_KEY
RESEND_API_KEY
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
ENCRYPTION_KEY
GEMINI_API_KEY
```

If any are missing, stop and set them before doing anything else.

---

## KNOWN BUGS (fix when touching these files)

1. `/auth/signup` returns 404 — redirect to `/signup` in `middleware.ts`
2. CSP blocks `data:audio/mp3` from Remotion Player — add `media-src data: 'self'` to headers in `next.config.js`
3. Remotion license warning — add `acknowledgeRemotionLicense` prop to `<Player />`

---

## WHAT THIS PRODUCT IS (never re-explain this — just know it)

One proxy URL change. Zero code changes for the customer. Every prompt from ChatGPT, Copilot, and Claude goes through Kaelus first. 16 detection engines. Under 10ms. SOC 2, HIPAA, and CMMC Level 2 simultaneously. Defense contractor angle: November 2026 CMMC enforcement, $30K-$150K C3PAO alternative, starting at free.

---

*End of master prompt. Load the 3 files in Step 1. Report in Step 2. Work.*
