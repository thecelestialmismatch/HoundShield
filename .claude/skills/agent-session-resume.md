---
name: agent-session-resume
description: Use when continuing work from a previous AI coding-agent session, handoff transcript, chat log, exported conversation, saved artifact set, or session summary. Reconstructs prior context before acting — never re-does completed work.
---

# Agent Session Resume

## Purpose

Resume prior coding-agent work with continuity. Reconstruct what happened before acting, then continue from the real stopping point.

## Core Workflow

1. **Identify the source.**
   - If the user names a platform (Claude Code, Codex, Cursor), read the matching reference.
   - Inspect workspace for session folders, exports, summaries, artifacts: `.claude/`, `handoff.md`, `.claude-session-state.md`, `memory/*.md`.
   - If a session title or name is provided, prefer exact or fuzzy title matches over recency.

2. **Locate the transcript or best available substitute.**
   - Prefer full transcript over summaries.
   - Prefer workspace-local session data over global history when both are plausible.
   - Prefer explicit user-provided paths over discovered paths.
   - In this project: check `primer.md`, `STATE.md`, `DECISIONS.md`, `tasks/todo.md`, `memory/*.md`, `.claude-session-state.md`.

3. **Read the full available session record before taking action.**
   - For large transcripts, read in chunks until complete.
   - Include user messages, assistant messages, tool calls, tool outputs, summaries, plans, artifacts.
   - Do NOT edit files, run fix commands, or repeat prior work before this pass is complete.

4. **Reconstruct context.**
   - Summarize the session goal.
   - List important decisions, constraints, style choices, user preferences.
   - Identify completed work, changed files, commands run, tests run, verification results.
   - Identify the exact stopping point: last command, edit, failure, or pending instruction.

5. **Extract tasks.**
   - Capture explicit TODOs, checklists, plans, open questions from `tasks/todo.md`.
   - Infer implicit tasks from failing tests, unfinished edits, "next step" language, partially applied changes.
   - Classify each item:
     - `DONE`: completed and verified, or clearly no longer needed
     - `PARTIALLY DONE`: started but missing implementation, tests, review, commit, push, or user confirmation
     - `NOT DONE`: not started or only discussed

6. **Validate against the workspace.**
   - Inspect git status before editing.
   - Read files touched or discussed in the prior session.
   - Preserve unrelated user changes.
   - If transcript claims conflict with current files, **trust current files** for implementation state and note the discrepancy.

7. **Continue from the first unfinished step.**
   - Do not repeat completed work.
   - Follow the established approach, style, naming, decisions unless clearly broken.
   - If context is missing, inspect related files and logs.
   - Ask the user only when progress is blocked by missing info or an unsafe choice.

## Project-Specific Sources (Hound Shield)

When resuming in this project, check in order:
1. `~/.claude/primer.md` — active state, last completed, next step
2. `compliance-firewall-agent/tasks/todo.md` — sprint tasks with status
3. `STATE.md` — extended session state
4. `memory/*.md` — user preferences, decisions, learned rules
5. `.claude-session-state.md` in project root if it exists
6. Recent git log: `git log --oneline -10`
7. Git diff vs main: `git diff main...HEAD --name-only`

## Required Response Shape

Before continuing execution, report:

```text
## Session Resume

**Goal**: [what was being worked on]

**Completed**:
- [task 1] ✅
- [task 2] ✅

**In Progress**:
- [task 3] — [where it stopped]

**Not Started**:
- [task 4]
- [task 5]

**Next action**: [specific first step]
```

Then continue immediately unless blocked.

## Guardrails

- Never assume the newest file is the right transcript if the user supplied a title or path.
- Never summarize from filenames alone — read the content.
- Never reset, revert, or discard existing changes unless the user explicitly asks.
- Never treat a compact summary as equivalent to the full transcript when full is available.
- Never mark a task `DONE` only because it was planned.
- Never mark a task `PARTIALLY DONE` only because it appeared in a plan — there must be evidence work started.
- Follow CLAUDE.md manager-mode rules: check sprint alignment before starting new work.
