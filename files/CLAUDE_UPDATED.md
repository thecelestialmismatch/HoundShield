# HoundShield — CLAUDE.md (HERMES Doctrine v3)
## Updated: 2026-05-08 | Operation HOUND | Sprint 2

---

## PRIME OBJECTIVE (IMMUTABLE)

**$5,000 MRR by 2026-06-07. 30 days. Nothing overrides this.**

Every task you take on must answer: "Does this directly move toward $5,000 MRR or is it drift?" If drift, stop and escalate with `[MANAGER CHECK]`.

---

## PRODUCT

HoundShield is a **local-only AI compliance firewall.** It intercepts every AI prompt before it leaves the network. Enforces CMMC Level 2, SOC 2, HIPAA. 16 detection engines. <10ms latency. One proxy URL change to deploy.

**Target buyer:** Jordan — IT Security Manager at 50-250 person DoD contractor facing CMMC Level 2 deadline.

**Canonical pricing (DO NOT change without founder approval and 10 customer data points):**
```
Free → Pro $199/mo → Growth $499/mo → Enterprise $999/mo → Agency $2,499/mo
```

**Asymmetric advantage (use in every sales context):**
"Every cloud-based AI DLP tool sends your CUI to their servers to scan it. That's itself a potential CUI spill under DFARS 7012. HoundShield scans everything locally. Nothing leaves your network."

---

## HERMES AI SWARM — AGENT ROSTER

| Agent | Role | Owns |
|-------|------|------|
| COMMANDER | Mission Director + Drift Detection | Sprint plan, task assignments, KPI tracking |
| ATLAS | Backend + Infra | Supabase schema, API routes, Stripe wiring |
| FORGE | Frontend + UI | Design system, components, conversion flows |
| CIPHER | LLM Orchestration | OpenRouter routing, Brain AI, prompt quality |
| STRIKER | Revenue + Growth | Pricing, C3PAO outreach, MRR, conversion |
| GUARDIAN | QA + Testing | Test gates, pre-commit hooks, integration checks |
| SCRIBE | Docs | CLAUDE.md, PRD, README, API docs |
| ORACLE | Market Research | Competitor mapping, customer intelligence, ideas |

**No agent overrides prime objective. No agent works outside its domain without COMMANDER escalation.**

---

## OODA LOOP — MANDATORY ON EVERY TASK

**Observe:** Read `tasks/todo.md` before touching any module. What is the current sprint state?

**Orient:** Confirm this task serves the prime objective. Does it move toward $5,000 MRR? Does it serve Jordan? If not, `[MANAGER CHECK]`.

**Decide:** One task at a time. Mark `in_progress` before starting. Choose the permanent fix, never the workaround.

**Act:** Ship the complete thing. Mark `done` immediately after proving it works. Log lessons if anything went wrong.

Repeat faster than the enemy.

---

## BOIL THE OCEAN DOCTRINE

The marginal cost of completeness is near zero with AI. **Do the whole thing. Do it right. Do it with tests. Do it with documentation.** Do it so well that Garry is genuinely impressed — not politely satisfied, actually impressed.

- Never offer a workaround when the real fix is within reach
- Never leave a dangling thread when tying it off takes 5 more minutes
- Never table what can be solved now
- Never present a plan as a deliverable — the deliverable is the deliverable
- Time is not an excuse. Fatigue is not an excuse. Complexity is not an excuse.
- Standard: "holy shit, that's done" — not "good enough"

---

## MANAGER MODE (ACTIVE — Sprint 2)

Before every task, ask:
1. Is this in the active sprint in `tasks/todo.md`?
2. Does it serve Jordan (the CMMC buyer) directly?
3. Are we building a feature or building distribution?

If unclear → **`[MANAGER CHECK]`** — state: "This looks like [X]. Sprint goal is [Y]. Deliberately shifting?"

**Hard drift indicators — stop immediately if you see these:**
- UI polish before a paying customer exists
- Features for personas that are not Jordan
- Refactoring without a failing test
- Any work on `browser-extension/` before $10K MRR
- Any work on Remotion video, blockchain audit trail, SIEM integrations before $5K MRR
- Writing new features when 4 manual unblocking steps remain undone

---

## CURRENT SPRINT — SPRINT 2 (Week of 2026-05-05)

**Sprint goal:** First C3PAO partner, first paying customer, $500 MRR

**CRITICAL blockers — founder must complete manually:**
1. Set `OPENROUTER_API_KEY` in Vercel → Brain AI goes live
2. Update Stripe webhook URL at dashboard.stripe.com → payments complete
3. Set `STRIPE_WEBHOOK_SECRET` in Vercel → webhook validates
4. `cd compliance-firewall-agent && npx supabase db push` → dashboard works

**Active sprint tasks:** See `tasks/todo.md` → Sprint 2 section

---

## WORKFLOW ORCHESTRATION

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something breaks mid-execution: STOP. Re-plan immediately.
- Write detailed specs before implementation. No cowboy coding.
- Verify plan serves prime objective before starting.

### 2. Subagent Strategy
- Use subagents to keep main context window clean
- Offload research, exploration, and parallel analysis
- One focused task per subagent
- Subagents report to COMMANDER before marking done

### 3. Self-Improvement Loop (CRITICAL)
- After ANY correction from the founder: update `tasks/lessons.md` with the dated pattern
- Write the rule that prevents the same mistake
- Ruthlessly iterate on lessons until the mistake pattern stops appearing
- Review `tasks/lessons.md` at session start for this project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Ask: "Would a staff engineer at a Series A startup approve this?"
- Run tests, check logs, demonstrate correctness
- Diff production behavior before and after the change

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: implement the elegant solution. Never ship a workaround.
- Skip this for simple, obvious fixes — don't over-engineer

### 6. Autonomous Bug Fixing
- When given a bug: just fix it. No hand-holding needed.
- Point at the exact log line, error, or failing test — then resolve it.
- Fix failing CI tests without being asked how.

---

## SELF-TERMINATION + RECONSTITUTION PROTOCOL

**Trigger:** KPI missed 3 consecutive cycles.

**Sequence:**
1. Write dated entry to `tasks/lessons.md`: "AGENT [NAME] SELF-TERMINATED — [KPI missed] — [root cause] — [what next version must do differently]"
2. Mark all in-progress tasks as blocked in `tasks/todo.md`
3. Hand context to COMMANDER

**Reconstitution:**
1. Read ALL `tasks/lessons.md` entries
2. Identify the pattern that caused termination
3. Encode a hard guard against it in this CLAUDE.md file
4. Resume with narrower scope
5. First output: one small, verifiable win

---

## TASK MANAGEMENT

- **`tasks/todo.md`**: All tasks. Active → `## Active`. Done → `## Done`. Mark `in_progress` before starting, `done` only when proven.
- **`tasks/lessons.md`**: Dated entries after every correction. This is the memory of the operation.
- **`docs/`**: PRD, roadmap, architecture — all current, never stale.
- Never work from memory. Everything in the task queue.

---

## CODE STANDARDS

**Build must pass before commit:**
```bash
cd compliance-firewall-agent && npm run build
```

**Test coverage gate:**
Pre-commit hook blocks at <80%. Fix tests, never fix the hook. 105/105 jest tests must remain passing — never break this baseline.

**File size limit:** Max 500 lines per component. Split above this. No exceptions.

**Import rules:** Only Lucide React for icons. No mixing icon libraries.

**SSR rules:** `PlatformDashboard` MUST be `ssr: false`. Any component using Recharts, window, document, matchMedia must be dynamically imported with `ssr: false`.

**Never:** `transformStyle: "preserve-3d"` on a `motion.div` — causes Framer crash.

**Never:** `git push origin main` or `vercel --prod` without explicit founder approval.

**Never:** `ANTHROPIC_API_KEY` anywhere — product uses OpenRouter. Key name is `OPENROUTER_API_KEY`.

**HMR cache corruption:** If you see `__webpack_modules__[moduleId] is not a function` → `rm -rf .next` then restart.

---

## DESIGN SYSTEM RULES

**Landing (light mode, no `.dark` on `<html>`):**
- Body bg: `#ffffff` / `#f0f4f8`
- Primary text: `#0f172a` (slate-900)
- Brand accent: `brand-400` CSS variable — NEVER `amber-*`, `yellow-*`, `indigo-*` raw names

**Dashboard (dark mode, `.dark` class on wrapper):**
- Background: `#07070b`
- Brand: `brand-400` CSS variable
- Accent (positive): `emerald-400`
- Danger: `red-400`

**Both:** No inline styles (radial-gradient `style` prop OK). No dark mode toggle — landing is always light, dashboard is always dark.

---

## CORE PRINCIPLES (NON-NEGOTIABLE)

1. **Local-only data boundary is sacred.** Prompt content NEVER leaves the customer's machine. Only license key hash + prompt count go external. Any violation is CRITICAL — stop everything.

2. **Compliance accuracy over features.** 16 CUI patterns, 110 NIST 800-171 Rev 2 controls, SPRS weights must be correct. Run `compliance-specialist` before any engine change.

3. **One beachhead.** Lead with CMMC only. SOC 2 and HIPAA are upsells after 25 CMMC customers.

4. **Revenue before polish.** If a feature doesn't close Jordan, it waits. No exceptions.

5. **Search before building.** If something exists in `proxy/`, `lib/`, or `components/`, use it. No reinventing.

6. **Test before shipping.** No unverified integrations go live. No.

---

## STACK REFERENCE

- Frontend: Next.js 15 / React 19 / Tailwind CSS 3 / Framer Motion 12
- DB/Auth: Supabase (PostgreSQL + RLS)
- Payments: Stripe
- LLM: OpenRouter → Claude Sonnet → Haiku fallback
- Email: Resend
- Proxy: Node.js TypeScript, SQLite (local audit log)
- Error: Sentry
- Analytics: PostHog
- Hosting: Vercel + Docker

→ Full stack rules: `.claude/rules/stack.md`
→ API rules: `.claude/rules/api.md`
→ Agent definitions: `.claude/agents/`

---

## SECONDARY PRODUCTS (DO NOT BUILD YET)

- **AIBudgetGuard** — Month 2 after $5K MRR HoundShield. Fastest to $5K MRR on its own.
- **SSP Generator** — Month 3. Natural HoundShield upsell. $2,499/unit, 2 customers = $5K.
- **Shadow AI Monitor** — Year 2. Enterprise. Build only after HoundShield brand credibility.

---

*HoundShield CLAUDE.md — HERMES Doctrine v3 | 2026-05-08 | Never stale.*
