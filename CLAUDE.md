# HoundShield — Project Brain

## Product
Local-only AI compliance firewall. Intercepts every AI prompt before it leaves the network. Enforces CMMC Level 2, SOC 2, HIPAA. 16 detection engines. <10ms latency. One proxy URL change to deploy.

Target buyer: Jordan — IT Security Manager at 50-250 person DoD contractor facing CMMC Level 2 deadline.
Pricing: Free → $199 → $499 → $999 → $2,499/mo. Mission: $10K MRR → YC S26/W27.

---

## Manager Mode (ACTIVE)

Before every task, check:
1. Is this in the active sprint in `tasks/todo.md`?
2. Does it serve Jordan (the CMMC buyer) directly?
3. Are we building a feature or building distribution?

If unclear → ask with: **[MANAGER CHECK]** This looks like [X]. Sprint goal is [Y]. Deliberately shifting?

**Drift indicators:** UI polish before paying customers · features for hypothetical buyers · refactoring without a failing test · non-Jordan work before Sprint 1 complete.

**Current sprint:** Sprint 1 — Jordan deploys in under 10 minutes and exports a PDF for her C3PAO.

---

## Workflow

1. Read before touch. Check `tasks/todo.md` before any module.
2. One task at a time. Mark `in_progress` before starting, `done` immediately after.
3. No feature creep. Bug fix ≠ surrounding cleanup. One-shot ≠ needs a helper.
4. Build must pass before commit: `cd compliance-firewall-agent && npm run build`.
5. Test coverage gate: pre-commit hook blocks at <80%. Fix tests, not the hook.
6. CRITICAL finding → stop, invoke `team-lead` agent.

---

## Task Management

- All tasks in `tasks/todo.md`. Active → `## Active`. Done → `## Done`.
- Add to backlog before starting. Never work from memory.
- Corrections → dated entry in `tasks/lessons.md`.
- Prefer editing existing files. Only create new files when the task requires it.

---

## Core Principles

1. **Local-only data boundary is sacred.** Prompt content never leaves the customer's machine. Only license key hash + prompt count go external. Any violation is CRITICAL.
2. **Compliance accuracy over features.** 16 CUI patterns, 110 NIST 800-171 Rev 2 controls, SPRS weights must be correct first. Run compliance-specialist before any engine change.
3. **One beachhead.** Lead with CMMC only. SOC 2 and HIPAA are upsells.

---

## Design System (Never Violate)

- Dark mode always: `<html className="dark scroll-smooth">`
- Background: `#07070b` (home), `#0d0d14` (alt). Brand gold: `brand-400` — never `amber-*`.
- Fonts: `font-editorial` (headers), `font-mono` (metrics). No inline styles (radial-gradient `style` prop OK).
- Components max 500 lines. Custom cursor on `pointer:fine` — never break CursorGlow.

## Critical Rules

- `PlatformDashboard` MUST stay `ssr: false` — Recharts crashes on SSR.
- `transformStyle: "preserve-3d"` + Framer Motion `motion.div` = crash.
- HMR error: `rm -rf .next` then restart.
- Never `git push origin main`. Never `vercel --prod` without explicit approval.

→ Stack details: `.claude/rules/stack.md` · API rules: `.claude/rules/api.md`
