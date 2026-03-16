@.claude-memory.md
@.claude-session-state.md

# ⚡ SESSION START — READ THIS FIRST

Before doing ANYTHING else, read these in order:
1. `CLAUDE-CODE-MISSION.md` — full architecture, all 10 gaps, all rules (THIS IS THE MASTER FILE)
2. `tasks/lessons.md` — apply every documented rule
3. `tasks/lessons-deployment.md` — apply every deployment rule
4. `.claude-session-state.md` — resume from exact last task

Then tell the user:
  📍 KAELUS.AI — SESSION RESUME
  Phase: [from state file]
  ✅ Last done: [from state file]
  🎯 NEXT TASK: [exact Gap # + step from CLAUDE-CODE-MISSION.md Section 6]
  ⛔ Blockers: [from state file]
  Branch: [active branch]

Do NOT re-scan the project. Do NOT re-explain the architecture. Read the mission file and go.

# ⚡ SESSION END — DO THIS BEFORE STOPPING
1. Update .claude-session-state.md: move done→completed, set new NEXT TASK, add session entry
2. Add any user corrections to tasks/lessons.md
3. Update tasks/lessons-deployment.md if any deployment was attempted
4. Run: git add .claude-session-state.md tasks/lessons.md tasks/lessons-deployment.md [changed files] && git commit -m "chore: session sync — [summary]" && git push origin [branch]
5. Tell user: ✅ SESSION SAVED + what was committed + next session starts at [task]

---

## PROJECT CONTEXT
Product: Kaelus.ai — AI compliance firewall for CMMC Level 2 defense contractors
Stack: Next.js 15, React 19, Supabase, Stripe, Tailwind CSS, Framer Motion, PostHog, OpenRouter
Pricing: Starter FREE | Pro $199/mo | Growth $499/mo | Enterprise $999/mo | Agency $2,499/mo
Active branch: feat/branding-shieldready-polish
Markets: US (primary — CMMC Level 2) | Australia (secondary — DISP + ASD Essential Eight)
Master brief: CLAUDE-CODE-MISSION.md (read this for full detail — not this file)

## ARCHITECTURE
- `app/` — Next.js App Router (15+ routes, 13 API endpoints)
- `components/` — 35+ components (landing, dashboard, UI)
- `lib/` — Core logic (gateway, agent, audit, classifier, interceptor, quarantine, shieldready, supabase)
- `sdk/` — Client SDK for gateway consumers
- `server.ts` — WebSocket gateway server (Docker ONLY — NOT Vercel)
- `supabase/migrations/` — 3 migration files (apply before every production deploy)

## RULES (non-negotiable — full detail in CLAUDE-CODE-MISSION.md)
- Always use Tailwind CSS — never inline styles
- Design: bg-surface (#F8FAFC), brand-400/500/600 (indigo), emerald accent
- Typography: Inter (body), Outfit (display)
- Auth: Supabase Auth with Google + GitHub + Microsoft OAuth
- Logo: Always use `<Logo />` and `<TextLogo />` — never inline Shield/Zap icons
- Colors: Use `brand-*` tokens (NOT `blue-*`) for all accent colors
- Every new feature must include error boundary + loading state
- Keep components under 500 lines — split if larger
- Run `npm run build` before claiming anything works
- RLS on every new Supabase table
- TypeScript strict — no `any` unless unavoidable
- WebSocket: server.ts is Docker ONLY. Vercel deployment = SSE only
- NEVER deploy to Vercel without explicit user confirmation

## THE 10 GAPS (Execute in Order — Full Specs in CLAUDE-CODE-MISSION.md Section 6)
1. Demo mode banner (CRITICAL — 2–4 hrs)
2. Subscription gating on gateway API (CRITICAL — 1 day)
3. Stripe webhook → Supabase subscription sync (CRITICAL — 4–6 hrs)
4. Pricing page + updated tiers $199/$499/$999/$2,499 (HIGH — 1 day)
5. Dashboard nav cleanup — hide non-compliance routes (HIGH — 2–4 hrs)
6. PDF compliance reports with jsPDF (HIGH — 2–3 days)
7. Landing page rewrite — CMMC messaging (HIGH — 1 day)
8. Onboarding flow + activation emails via Resend (MEDIUM — 1 day)
9. CMMC-specific threat detection patterns (MEDIUM — 1–2 days)
10. Integration documentation /docs page (MEDIUM — 1 day)
