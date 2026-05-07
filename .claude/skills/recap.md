---
name: recap
description: >
  Session recap skill. Invoke with /recap or auto-triggers near context limit (80%+ window)
  or on session return. Produces structured summary: built, decisions, next step, blockers.
  Zero scrolling — full context in one shot.
triggers:
  - /recap
  - context window approaching 80%
  - session resume after gap
---

# Recap — Session Context Restore

## When to Run

Auto-trigger on ANY of these:
- User types `/recap`
- Context window approaching limit (infer from long session or user hint)
- Returning to session after compaction or break
- Before starting a new major task block (clears fog)

## Recap Format

Produce exactly this structure — no preamble, no filler:

```
## Session Recap — [date]

### Built / Changed
- [file or feature]: [what changed, one line each]

### Decisions Made
- [decision]: [reason, one line]

### Open Questions / Blockers
- [blocker]: [what's blocking it]

### Next Step
→ [single concrete next action, file + task]
```

## Rules

1. **One next step only.** Not a list. Single clearest action.
2. **File paths included.** "Fix auth" useless. "Fix null check in `lib/auth/session.ts:84`" useful.
3. **Decisions include rationale.** "Used BM25 (k1=1.5, b=0.75) — better recall than cosine on short CUI patterns."
4. **Blockers are concrete.** "Supabase migration 003 not pushed to prod — run `npx supabase db push`."
5. **No narration.** Don't explain what recap is. Just do it.

## Auto-Recap Before Context Limit

Claude Code sessions have a ~5-hour / context window limit. Near the limit:

1. Run `/recap` before compaction clears context
2. The recap output gets persisted in `.claude-session-state.md`
3. On next session, read `.claude-session-state.md` first — skip re-discovery

**Trigger signal:** User says "compact", "/compact", context feels heavy, or >80 tool calls in session.

### Auto-Save Protocol

After any recap, append to `.claude-session-state.md`:
```
## [ISO date] Recap
[paste recap output here]
```

This gives future-self full context without re-reading transcript.

## Enable Auto-Recap on Session Return

Add to `.claude/settings.json` `SessionStart` hooks to echo a reminder:
```json
{
  "type": "command",
  "command": "echo 'RECAP: Run /recap if continuing prior work'",
  "timeout": 1000
}
```

Or the session primer approach: `primer.md` already captures active project + next step.
`/recap` is the richer version — includes all decisions + blockers from the current session.

## HoundShield Quick State

Current sprint: **Sprint 1** — Jordan deploys in <10 min, exports PDF for C3PAO.

Active branch: `claude/modest-chaplygin-8bfe99`

Immediate next: `proxy/install.sh` — curl pipe bash, starts Docker, sets proxy URL in <5 min.

Blockers: Stripe webhook (kaelus.online → houndshield.com) · Supabase migrations 003+004 not in prod.
