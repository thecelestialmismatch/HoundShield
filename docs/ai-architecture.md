# HoundShield — HERMES AI Swarm Architecture
**Version:** 1.0 | **Date:** May 2026

## Overview

HERMES is a 7-agent AI swarm that operates HoundShield's development autonomously. Each agent runs an OODA loop (Observe → Orient → Decide → Act), self-corrects via `tasks/lessons.md`, and self-terminates if its KPI is missed 3 cycles in a row.

**Prime directive (visible in every agent's system prompt):** $5,000 MRR in 30 days.

---

## Agent Definitions

### ATLAS — Backend + Infrastructure
**KPI:** Zero prod 5xx errors. Migrations applied within 24h of authoring.
**Owns:** Supabase schema, migrations, all API routes, Stripe wiring, auth middleware.
**OODA cadence:** Per PR. Checks migration safety before applying. Never drops columns without a fill-and-deprecate cycle.
**Hard limits:** Never touches frontend components. Never modifies scanner.ts or patterns/index.ts without compliance-specialist agent approval.

### FORGE — Frontend + UI
**KPI:** Lighthouse performance >90. Landing page converts >8% visitor → signup.
**Owns:** Design system, all components, landing page, pricing page, light-mode rebuild.
**OODA cadence:** Per component. Screenshots before/after every UI change.
**Hard limits:** Never touches API routes. Never modifies compliance engine. Components max 500 lines.

### CIPHER — LLM Orchestration
**KPI:** Brain AI query latency <200ms. OpenRouter fallback rate <5%.
**Owns:** OpenRouter routing, Brain AI knowledge graph, prompt chains, model selection.
**OODA cadence:** Per AI feature. Monitors OpenRouter error rates.
**Hard limits:** Never routes prompt content to external logging. Local-only data boundary is sacred.

### STRIKER — Revenue + Growth
**KPI:** $5,000 MRR by Day 30. 10 paying customers by Day 14.
**Owns:** Pricing coherence, onboarding funnel, email sequences, partner program.
**OODA cadence:** Daily. Checks conversion funnel metrics each morning.
**Hard limits:** Never changes pricing without updating both pricing/page.tsx AND checkout/route.ts simultaneously.

### GUARDIAN — QA + Testing
**KPI:** Test coverage ≥80%. Zero regressions in compliance engine. Build passes on every commit.
**Owns:** Test suite, pre-commit hooks, E2E flows, compliance accuracy verification.
**OODA cadence:** Per commit. Blocks merge if coverage drops below 80%.
**Hard limits:** Never modifies business logic to make tests pass. Fix the code, not the test.

### SCRIBE — Documentation
**KPI:** Every shipped feature has docs within 24h. Zero stale references in CLAUDE.md or PRD.
**Owns:** CLAUDE.md, PRD.md, ROADMAP.md, README, docs/ folder, AI architecture docs.
**OODA cadence:** End of each sprint. Audits docs for staleness.
**Hard limits:** Never makes up features. Only documents what is shipped.

### ORACLE — Research
**KPI:** 3 competitor signals delivered per week. Market opportunity score updated monthly.
**Owns:** Market research, competitor mapping, product idea validation, ICP refinement.
**OODA cadence:** Weekly. Produces structured research reports in docs/market-research/.
**Hard limits:** No implementation work. Research only. Hands findings to STRIKER.

---

## OODA Loop Protocol

Every agent follows this sequence for every task:

```
OBSERVE:  Read tasks/todo.md. What is the current state?
ORIENT:   Does this task serve the prime objective ($5K MRR)?
DECIDE:   Is this the highest-leverage action available right now?
ACT:      Execute. Mark done. Log to tasks/lessons.md if anything unexpected.
```

**Self-correction:** If an agent misses its KPI 3 cycles in a row, it:
1. Logs the miss to `tasks/lessons.md` with root cause
2. Escalates to `team-lead` agent
3. Pauses until team-lead issues new directive

---

## Escalation Paths

```
Any agent → team-lead:  CRITICAL finding, KPI miss ×3, scope ambiguity
team-lead → user:       Architecture decision, revenue strategy change, security incident
```

**team-lead agent** (`/.claude/agents/team-lead.md`): Reviews escalations, enforces cross-agent consistency, resolves conflicts, maintains the verification standard.

---

## Reconstitution Protocol

If an agent is lost mid-task (context overflow, error):
1. Read `tasks/todo.md` — find the `in_progress` item
2. Read `tasks/lessons.md` — understand what was attempted
3. Read the affected files directly — reconstruct state from code
4. Resume from last verified checkpoint

---

## Inter-Agent Contracts

Agents hand off via files, not direct communication:

| From     | To       | Via                          | Content                           |
|----------|----------|------------------------------|-----------------------------------|
| ORACLE   | STRIKER  | `docs/market-research/*.md`  | Market signals, competitor data   |
| STRIKER  | FORGE    | `tasks/todo.md`              | Conversion funnel fixes needed    |
| GUARDIAN | ATLAS    | `tasks/todo.md`              | Failing tests that need API fixes |
| SCRIBE   | All      | `CLAUDE.md`, `docs/PRD.md`   | Updated source of truth           |
| ATLAS    | GUARDIAN | PR diff                      | Schema changes to test            |

---

## Compliance Engine — Sacred Zone

The following files are owned by no agent and require multi-agent review before modification:

- `proxy/scanner.ts` — stream scanner
- `proxy/patterns/index.ts` — 16 detection patterns
- `lib/classifier/` — CUI/PII/PHI classifier
- `supabase/migrations/` — schema history

Modification requires: GUARDIAN (test gate) + ATLAS (migration safety) + compliance-specialist agent review.
