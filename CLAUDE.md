# HoundShield — Project Brain (HERMES Doctrine)

## Product
Local-only AI compliance firewall. Intercepts every AI prompt before it leaves the network. Enforces CMMC Level 2, SOC 2, HIPAA. 16 detection engines. <10ms latency. One proxy URL change to deploy.

Target buyer: Jordan — IT Security Manager at 50-250 person DoD contractor facing CMMC Level 2 deadline.
Pricing: Free → $199 Pro → $499 Growth → $999 Enterprise → $2,499 Agency/mo.
**Prime objective: $5,000 MRR in 30 days → $10K MRR → YC S26/W27.**

---

## HERMES AI Swarm — Agent Roster

Each agent runs OODA loop (Observe → Orient → Decide → Act). Self-corrects via `tasks/lessons.md`. Self-terminates if KPI missed 3 cycles.

| Agent    | Role                  | Owns                                                              |
|----------|-----------------------|-------------------------------------------------------------------|
| ATLAS    | Backend + Infra       | Supabase schema, API routes, migrations, Stripe wiring            |
| FORGE    | Frontend + UI         | Design system, all components, landing page, light-mode rebuild   |
| CIPHER   | LLM Orchestration     | OpenRouter routing, Brain AI, prompt chains                       |
| STRIKER  | Revenue + Growth      | Pricing coherence, onboarding funnel, MRR tracking                |
| GUARDIAN | QA + Testing          | Test coverage gates, pre-commit hooks, E2E                        |
| SCRIBE   | Docs                  | CLAUDE.md, PRD, README, docs/ folder                             |
| ORACLE   | Research              | Market research, competitor mapping, product ideas                |

**No agent overrides prime objective. No agent works outside its domain without team-lead escalation.**

---

## Manager Mode (ACTIVE)

Before every task:
1. Is this in the active sprint in `tasks/todo.md`?
2. Does it serve Jordan (the CMMC buyer) directly?
3. Are we building a feature or building distribution?

If unclear → **[MANAGER CHECK]** This looks like [X]. Sprint goal is [Y]. Deliberately shifting?

**Drift indicators:** UI polish before paying customers · features for hypothetical buyers · refactoring without a failing test · non-Jordan work before Sprint 2 complete.

**Current sprint:** Sprint 2 — 10 paying customers by Day 14, $5K MRR by Day 30.

---

## Workflow (OODA Loop Per Task)

1. **Observe:** Read `tasks/todo.md` before touching any module.
2. **Orient:** Confirm task serves prime objective. If not, escalate.
3. **Decide:** One task at a time. Mark `in_progress` before starting.
4. **Act:** Mark `done` immediately after. Log lessons if anything went wrong.

Rules:
- Build must pass before commit: `cd compliance-firewall-agent && npm run build`
- Test coverage gate: pre-commit hook blocks at <80%. Fix tests, not the hook.
- CRITICAL finding → stop, invoke `team-lead` agent.
- Prefer editing existing files. Only create new files when required.
- No feature creep. Bug fix ≠ surrounding cleanup. One-shot ≠ needs a helper.

---

## Task Management

- All tasks in `tasks/todo.md`. Active → `## Active`. Done → `## Done`.
- Add to backlog before starting. Never work from memory.
- Corrections → dated entry in `tasks/lessons.md`.

---

## Core Principles

1. **Local-only data boundary is sacred.** Prompt content never leaves the customer's machine. Only license key hash + prompt count go external. Any violation is CRITICAL.
2. **Compliance accuracy over features.** 16 CUI patterns, 110 NIST 800-171 Rev 2 controls, SPRS weights must be correct. Run `compliance-specialist` before any engine change.
3. **One beachhead.** Lead with CMMC only. SOC 2 and HIPAA are upsells.
4. **Revenue before polish.** If a feature doesn't close Jordan, it waits.

---

## Design System

Landing page is light mode. Dashboard is dark mode. Both coexist via `html.dark` class toggle.

**Landing (light, no `.dark` on `<html>`):**
- Body bg: `#ffffff` / `#f0f4f8` (slate-50)
- Primary text: `#0f172a` (slate-900)
- Secondary text: `#475569` (slate-600)
- Brand accent: `brand-400` CSS variable — never `amber-*`, `yellow-*`, `indigo-*`
- Cards: light glass with `border-slate-200`, white bg
- Fonts: `font-editorial` (headers), `font-mono` (metrics)

**Dashboard (dark, `.dark` class on wrapper):**
- Background: `#07070b` (home), `#0d0d14` (alt sections)
- Brand gold: `brand-400` — never raw color names

**Both:**
- No inline styles (radial-gradient `style` prop OK)
- Components max 500 lines — split if larger
- Custom cursor `CursorGlow` on `pointer:fine` — never break it

---

## Critical Rules

- `PlatformDashboard` MUST stay `ssr: false` — Recharts crashes on SSR.
- `transformStyle: "preserve-3d"` + Framer Motion `motion.div` = crash.
- HMR error: `rm -rf .next` then restart.
- Never `git push origin main`. Never `vercel --prod` without explicit approval.

→ Stack details: `.claude/rules/stack.md` · API rules: `.claude/rules/api.md`
