---
name: ship
description: Full HERMES orchestrator — from task to deployed code. Security, design, code, tests, PR, Vercel. Learns from mistakes automatically.
---

# /ship — HERMES Full Orchestrator

**One command. Everything runs. Nothing skipped.**

You are the HERMES orchestrator. Run every phase below in order. Do not skip phases. Do not ask the user for confirmation between phases except where explicitly marked **[CONFIRM]**.

---

## PHASE 0 — LOAD MEMORY (always run first, takes 30 seconds)

Read all of these in parallel before touching any code:

```
tasks/lessons.md          — mistakes made, never repeat these
tasks/todo.md             — active sprint, current priorities
tasks/audit.md            — known blockers and severity
memory/decisions.md       — architectural decisions and WHY
memory/feedback.md        — what user hates, what they love
memory/preferences.md     — workflow preferences
docs/PRD.md               — what we're building and for whom
CLAUDE.md                 — prime objective and design system rules
```

After reading: state in one sentence what the task is and which HERMES agent owns it. If task is ambiguous, state your best interpretation — do not ask.

**Mistake check:** Search `tasks/lessons.md` for any lesson related to this task type. If found, read it aloud before proceeding: "Past mistake: [X]. Avoiding by: [Y]."

---

## PHASE 1 — ORIENT (OODA)

Answer these 3 questions internally before writing a single line:

1. Does this serve Jordan (the CMMC buyer) directly? If not → log to `tasks/todo.md` backlog, tell user why it's deferred.
2. Is this a fix, feature, or design change? Determines which agents run.
3. What files will change? Read them all now.

**Agent assignment:**
- Backend / API / DB → ATLAS (invoke `code-reviewer` + `security-auditor` agents)
- Frontend / UI / components → FORGE (invoke `code-reviewer` agent, check design system)
- LLM / Brain AI / prompts → CIPHER (invoke `security-auditor` for data boundary check)
- Pricing / onboarding / funnel → STRIKER (check PRD.md pricing section first)
- Compliance engine → ALL agents + `compliance-specialist` mandatory

---

## PHASE 2 — SECURITY AUDIT (runs before any code is written)

Invoke the `security-auditor` agent on the files that will be modified.

If `security-auditor` returns CRITICAL → stop. Fix before proceeding. Log to `tasks/lessons.md`.

Mandatory checks regardless:
- [ ] No hardcoded secrets, API keys, or tokens
- [ ] All new API routes call `supabase.auth.getUser()` — never trust client-sent user IDs
- [ ] No prompt content leaving customer's network (local-only boundary)
- [ ] No new `any` types in TypeScript
- [ ] No SQL injection surface (use Supabase typed client, not raw SQL strings)

---

## PHASE 3 — IMPLEMENT

### If design change (UI/landing/components):
- Read `CLAUDE.md` design system section first — never violate palette or font rules
- Landing page: light mode only (`bg-white`, `text-slate-900`, `brand-400` accent)
- Dashboard: dark mode only (`.dark` class wrapper)
- Run `code-reviewer` agent after writing each component
- Max 500 lines per component — split if larger
- No inline styles (radial-gradient `style` prop exception only)

### If backend/API change:
- Read existing route file before touching it
- Run `security-auditor` agent after writing
- If new Supabase table: write migration in `supabase/migrations/` — never alter schema directly
- If Stripe: raw body for webhook, `constructEvent()` signature validation always

### If compliance engine change:
- STOP. Run `compliance-specialist` agent first.
- 16 detection patterns minimum — never reduce
- 110 NIST controls — never remove a mapping
- Run full test suite before and after

### For all changes:
- Edit existing files. Create new files only when the task requires it.
- No feature creep. Fix only what was asked.

---

## PHASE 4 — CODE REVIEW

Invoke `code-reviewer` agent on every file modified.

Fix all CRITICAL and HIGH findings before continuing.
Fix MEDIUM findings if they take under 5 minutes.
Log unfixed findings to `tasks/todo.md` backlog with severity.

---

## PHASE 5 — TESTS

### Run existing tests:
```bash
cd compliance-firewall-agent && npm test -- --silent
```

If failures → fix them. Never skip. Never comment out. Log root cause.

### Write new tests if:
- New API route added (integration test)
- New compliance pattern added (unit test)
- Bug fixed (regression test for that specific bug)

Invoke `test-writer` agent for new tests. Target: 80%+ coverage gate.

---

## PHASE 6 — BUILD

```bash
cd compliance-firewall-agent && node_modules/.bin/next build 2>&1
```

Must pass with zero errors. Fix all TypeScript and build errors.

Common fixes:
- `rm -rf .next` then rebuild if HMR/cache error
- `PlatformDashboard` must stay `ssr: false` — never change this
- `transformStyle: "preserve-3d"` + `motion.div` = crash — never combine

---

## PHASE 7 — COMMIT AND PR

```bash
git add [specific files only — never git add -A blindly]
git commit -m "[type]: [description]

[body explaining WHY, not just what]"

git push origin [current-branch] -u
```

Create PR with:
```bash
gh pr create --title "[type]: [description]" --body "..."
```

PR body must include:
- Summary bullets (what changed and why)
- Files modified
- Test results (X/X passing)
- Any manual steps required (Stripe webhook, env vars, migrations)
- **Lessons applied** section: "Past mistake X was avoided by doing Y"

---

## PHASE 8 — VERCEL DEPLOY **[CONFIRM]**

Before deploying, run:
```bash
vercel env ls 2>&1 | head -20
```

Verify these env vars are set:
- `STRIPE_SECRET_KEY` ✓
- `STRIPE_WEBHOOK_SECRET` ✓
- `NEXT_PUBLIC_SUPABASE_URL` ✓
- `SUPABASE_SERVICE_ROLE_KEY` ✓
- `OPENROUTER_API_KEY` ✓

If any missing → tell user. Do not deploy with missing vars.

**Ask user:** "Build passes. Tests pass. PR #[N] created. Deploy to production now? (yes/no)"

If yes:
```bash
vercel --prod 2>&1
```

Watch for errors. If deploy fails → read logs, fix, redeploy.

Post-deploy smoke test (run these):
```bash
curl -s https://houndshield.com/api/health | python3 -m json.tool
```

Check: `status: "ok"`, all services configured.

---

## PHASE 9 — LEARN (never skip)

After every ship, append to `tasks/lessons.md`:

```markdown
## [date] — [task type]
**What:** [brief description of task]
**Mistake made (if any):** [what went wrong, or "none"]
**Root cause:** [why it happened]
**Fix applied:** [what was done]
**Never do:** [the specific thing to avoid next time]
**Pattern:** [generalizable rule for similar tasks]
```

If no mistakes: still log "no mistakes — pattern that worked: [X]."

---

## PHASE 10 — UPDATE MEMORY

If any new architectural decisions, preferences, or facts emerged:
- Update `memory/decisions.md` with decision + rationale
- Update `memory/feedback.md` if user corrected approach
- Update `tasks/todo.md` — move completed items to Done
- Update `primer.md` with: what was just completed, exact next step

---

## QUICK REFERENCE — Agent Roster

| Agent CLI name       | When to invoke                                      |
|---------------------|-----------------------------------------------------|
| `security-auditor`  | Before AND after any API/auth/Stripe/compliance change |
| `code-reviewer`     | After writing any code                              |
| `test-writer`       | New routes, new patterns, bug fixes                 |
| `compliance-specialist` | Any change touching scanner.ts or patterns/     |
| `debugger`          | Recurring error, root cause not obvious             |
| `team-lead`         | CRITICAL finding, blocked, KPI missed 3× in a row   |

---

## ABORT CONDITIONS

Stop immediately and tell user if:
- Security audit returns CRITICAL with no obvious fix
- Compliance engine test coverage drops below 100% on patterns
- Build fails after 2 attempts with different approaches
- Prompt content would leave customer's network

Format: **[ABORT]** [reason] [what user should do]
