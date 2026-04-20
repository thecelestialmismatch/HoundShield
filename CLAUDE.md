# Hound Shield — Project Brain

## Product
Local-only AI compliance firewall. Intercepts every AI prompt (ChatGPT, Copilot, Claude) before it leaves the network. Simultaneously enforces SOC 2, HIPAA, CMMC Level 2. 16 detection engines. <10ms latency. One proxy URL change to deploy.

Target buyer: Jordan — CISO or Compliance Manager at a 50-250 person DoD contractor facing CMMC Level 2 deadline.
Pricing: Free → $199 → $499 → $999 → $2,499/mo
Mission: $10K MRR → YC S26/W27

---

## Workflow Orchestration

1. **Read before touch.** Before editing any file, read it. Before exploring any module, check `tasks/todo.md` for existing context.
2. **One task at a time.** Mark the current item `in_progress` in `tasks/todo.md` before starting. Mark `done` immediately on completion — never batch.
3. **No feature creep.** Only implement what the current task requires. A bug fix does not need surrounding cleanup. A one-shot operation does not need a helper.
4. **Build must pass before commit.** Run `cd compliance-firewall-agent && npm run build` before every commit. A failing build is not done.
5. **Test coverage gate.** The pre-commit hook blocks at <80% coverage. Fix the tests, not the hook.
6. **Escalate blocking issues.** If a CRITICAL finding appears (security, compliance engine break, secret exposure), stop all work on affected files and invoke the `team-lead` agent.

---

## Task Management

1. All tasks live in `tasks/todo.md`. Active work goes under `## Active`. Completed work moves to `## Done`.
2. When given a new task, add it to the backlog before starting — don't start from memory.
3. After any correction or resolved escalation, add a dated entry to `tasks/lessons.md` with: what happened, root cause, rule that prevents recurrence.
4. Prefer editing existing files over creating new ones. Only create new files when the task explicitly requires it.
5. When uncertain, check `tasks/lessons.md` for prior decisions before asking the user.
6. At session end: update `tasks/todo.md` to reflect current state, update `tasks/lessons.md` if any new patterns emerged.

---

## Core Principles

1. **Local-only data boundary is sacred.** Prompt content never leaves the customer's machine. The only external call is license key hash + prompt count. No exceptions. Any change that could exfiltrate prompt content is a CRITICAL security finding.
2. **Compliance accuracy over features.** 16 CUI detection patterns, all 110 NIST 800-171 Rev 2 controls, SPRS deduction weights — these must be correct before anything else ships. Run the compliance-specialist agent before any compliance engine change.
3. **One beachhead.** Lead with CMMC only in all copy and messaging. SOC 2 and HIPAA are upsells. Three vague compliance claims are weaker than one crisp forcing-function.

---

## Stack

```
compliance-firewall-agent/          Next.js 15, React 19, Tailwind, Framer Motion, Recharts
  app/                              App Router (Server Components by default)
  components/landing/               Landing page sections (max 500 lines each)
  lib/gateway/                      Core AI interception proxy engine
  lib/classifier/                   16-pattern CUI/PII/IP/PHI detector
  lib/agent/memory.ts               Memory system — reuse for Brain AI module
  lib/agent/memory-dna.ts           Compressed memory pattern
  supabase/migrations/              001-004 locally, 003+004 pending prod push

proxy/                              Node.js HTTPS proxy (the actual product)
  server.ts                         HTTP proxy server
  scanner.ts                        Pattern scanner (COMPLETE — reuse as-is)
  patterns/index.ts                 16 detection patterns (extend, never replace)
  storage.ts, webhook.ts            Audit log + webhook delivery
  license.ts                        License validation (hash only, zero prompt content)

brain/
  research.md                       Static research log (not queryable — Brain AI module pending)

.claude/
  agents/                           8 agents (code-reviewer, debugger, test-writer,
                                    security-auditor, compliance-specialist, refactorer,
                                    doc-writer, team-lead)
  skills/                           4 user-invocable skills
  hooks/pre-commit.sh               tsc + eslint + npm test gates
  settings.json                     model: claude-sonnet-4-6, autoMemoryEnabled: true
tasks/
  todo.md                           Task queue (Boris Cherny pattern)
  lessons.md                        Self-improvement loop
```

## Key Commands

```bash
# Development
cd compliance-firewall-agent
npm run dev                    # Start dev server (port 3000)
npm run build                  # Must pass before commit
npm test -- --silent           # Run test suite
npx tsc --noEmit               # Type check only

# Supabase
npx supabase db push           # Push pending migrations to prod
npx supabase gen types typescript --local > lib/database.types.ts

# Git (NEVER push to main directly)
git push origin <branch>       # Branch only
# PR target: main
```

## Design System (Never Violate)

- Dark mode always on: `<html className="dark scroll-smooth">`
- Background: `#07070b` (homepage), `#0d0d14` (alt sections)
- Brand gold: `brand-400` CSS variable — never raw `amber-*` or `yellow-*`
- Fonts: `font-editorial` for display headers, `font-mono` for metrics/code
- No inline styles — Tailwind only (radial-gradient bg OK as `style` prop only)
- Components max 500 lines — split if larger
- Custom cursor active on desktop (pointer:fine) — never break CursorGlow

## Critical Rules

- `PlatformDashboard` MUST stay `ssr: false` — Recharts crashes on SSR
- `transformStyle: "preserve-3d"` conflicts with Framer Motion — never on `motion.div`
- Webpack HMR error: `rm -rf .next` then restart dev server
- `SectionSpotlight` calculates mouse pos via `getBoundingClientRect` (NOT CSS vars)
- Never `git push origin main` directly
- Never `vercel --prod` without explicit user approval
