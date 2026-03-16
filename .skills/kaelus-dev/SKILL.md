---
name: kaelus-dev
description: >
  Session continuity skill for Kaelus.ai development. ALWAYS load this skill at the very
  start of any session involving the Kaelus.ai project — before writing any code, reading
  any files, or answering any questions. Triggers on: "continue", "next step", "where did
  we leave off", "what's next", "kaelus", "compliance firewall", "CMMC", "ShieldReady",
  any mention of working on the Kaelus.ai codebase, or any development task in the
  compliance-firewall-agent project. When loaded, immediately read the state files and
  report current status — do not scan the project from scratch.
---

# Kaelus.ai Session Continuity Skill

This skill eliminates token waste from re-scanning the project every session.
At session start: read state → report status → start working.
At session end: update state → commit to GitHub → done.

---

## SESSION START PROTOCOL (run this EVERY time — no exceptions)

**Step 1 — Read these two files immediately (in parallel, before anything else):**
- `compliance-firewall-agent/.claude-memory.md` — persistent project knowledge (full context)
- `compliance-firewall-agent/.claude-session-state.md` — current progress tracker

**Step 2 — Report to user in this exact format (under 10 lines, no walls of text):**
```
📍 KAELUS.AI — SESSION RESUME
Phase: [current phase from state file]
✅ Last done: [last completed task]
🎯 NEXT TASK: [the exact next action — be specific]
⛔ Blockers: [anything blocking, or "none"]
Branch: [active branch name]
```

**Step 3 — Ask ONE question if needed, then start working immediately.**
Do not re-explain the project. Do not re-scan files. Read the state files and go.
The user knows what Kaelus.ai is. Just say where we are and what we're doing next.

---

## PROJECT IDENTITY

**What it is:** Kaelus.ai — AI compliance firewall for CMMC Level 2 defense contractors.
**Stack:** Next.js 15, React 19, TypeScript, Supabase, Stripe, OpenRouter, Tailwind, Framer Motion
**Root path:** `compliance-firewall-agent/`
**Design system:** Dark theme, bg-[#07070b], brand-* tokens (indigo), emerald accent
**Rules:** Tailwind only, no inline styles, components < 500 lines, always `<Logo />` never inline icons

---

## CODING RULES (always follow)

1. **Auth:** Supabase SSR client for server, browser client for client components
2. **Stripe:** Never store price IDs in frontend — always from env vars
3. **Error handling:** Every new feature needs error boundary + loading state
4. **TypeScript:** Strict types always — no `any` unless unavoidable
5. **Build check:** Run `npm run build` before declaring anything done
6. **RLS:** Every new Supabase table needs Row Level Security enabled

---

## ENV VARS NEEDED (check `.env.local` — if empty, these must be set first)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRO_MONTHLY_PRICE_ID
STRIPE_PRO_ANNUAL_PRICE_ID
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID
STRIPE_AGENCY_MONTHLY_PRICE_ID
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
OPENROUTER_API_KEY
RESEND_API_KEY
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
ENCRYPTION_KEY
```

If these are empty → the ONLY next step is filling them in. Do not build features until env vars exist.

---

## SESSION END PROTOCOL (run when user says "done", "end session", "wrap up", "commit", or hits token limit)

**Step 1 — Update `.claude-session-state.md`:**
- Move completed tasks from "IN PROGRESS" to "COMPLETED (this session)"
- Update NEXT TASK to the actual next thing
- Add session entry to HISTORY with date + what was done

**Step 2 — Update `.claude-memory.md`:**
- Add any new architectural decisions made
- Update component status if changed
- Add any discovered issues or gotchas

**Step 3 — Commit everything to GitHub:**
```bash
cd /path/to/compliance-firewall-agent
git add .claude-memory.md .claude-session-state.md
git add [any files changed this session]
git commit -m "chore: session sync — [one-line summary of what was done]

Session work: [2-3 sentences]
Next: [next task]"
git push origin main
```

**Step 4 — Tell the user:**
```
✅ SESSION SAVED
Done this session: [list]
Committed to GitHub: yes
Next session starts with: [next task]
```

---

## PHASE MAP (reference — don't re-read project to find this)

```
Phase 0 — ENV VARS          → Set all 15 env vars (Supabase, Stripe, OpenRouter, Resend)
Phase 1 — LAUNCH PREP       → Apply migrations, deploy Vercel, wire real data to dashboard
Phase 2 — STRIPE LIVE       → Switch to live keys, test checkout, test webhook
Phase 3 — FIRST CUSTOMERS   → Post r/CMMC, LinkedIn, Product Hunt, get 1 paying user
Phase 4 — PDF REPORTS        → jsPDF compliance reports (biggest conversion driver)
Phase 5 — GATEWAY MODE      → Proxy endpoint for enterprise, biggest revenue driver
Phase 6 — MULTI-TENANT      → MSP/Agency dashboard, $499/mo tier
```

Read `.claude-session-state.md` to know which phase we're in right now.

---

## KEY FILES MAP (so you never need to search)

```
Auth:          app/login/page.tsx, app/signup/page.tsx
               middleware.ts (protects /command-center)
               lib/supabase/browser.ts, lib/supabase/server.ts

Stripe:        app/api/stripe/checkout/route.ts
               app/api/stripe/webhook/route.ts
               app/api/stripe/portal/route.ts

Dashboard:     app/command-center/page.tsx (805 lines, main)
               app/command-center/layout.tsx (sidebar + nav)

AI:            app/api/chat/route.ts
               app/api/agent/execute/route.ts
               lib/agent/orchestrator.ts

Shield/CMMC:   app/command-center/shield/ (assessment, gaps, reports, resources)
               lib/shieldready/ (controls, scoring)

Gateway:       app/api/gateway/ (intercept + stream)
               lib/gateway/ (stream-proxy, ws-handler, scanner)

Reports:       app/api/reports/generate/route.ts (JSON only — PDF still needed)

Database:      supabase/migrations/ (3 migration files, apply to Supabase)

Config:        .env.local (must fill in)
               next.config.js
               tailwind.config.js
```

---

## HOW TO USE CLAUDE SKILLS FOR EACH TASK

When working on a specific task, copy the matching skill from `KAELUS-BEAST-REPORT.md`:
- Supabase work → SKILL 1: KAELUS SUPABASE ENGINEER
- Stripe work → SKILL 2: KAELUS STRIPE ENGINEER
- UI/Frontend → SKILL 3: KAELUS FRONTEND ENGINEER
- CMMC/Compliance → SKILL 4: KAELUS COMPLIANCE ENGINE ENGINEER
- AI agents/API → SKILL 5: KAELUS API/AGENT ENGINEER
- Deployment → SKILL 6: KAELUS LAUNCH ENGINEER
