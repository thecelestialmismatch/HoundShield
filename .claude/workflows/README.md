# HoundShield — Dynamic Workflows

This directory makes **dynamic workflows** a first-class capability of the HoundShield
project. Dynamic workflows let Claude Code fan work out across tens–hundreds of parallel
subagents in one session, verify each result, and converge — for migrations, audits,
codebase-wide builds, and content generation that are too big for one pass.

## What's here

| File | What it does |
|------|--------------|
| `houndshield-port.js` | Re-ports / extends the Direction-A marketing surface (industry product pages + AEO answer pages), wires the NavV3 mega-menu + sitemap, then build-gates to green with a self-healing fix loop. |
| `houndshield-aeo-pages.js` | AEO engine: turns a list of buyer questions into sourced, schema-marked `/answers/[slug]` entries (draft → adversarial fact-check → build-gate). This is how you run the "1 answer page / week" plan. |

## How to run them

Dynamic workflows run inside Claude Code (CLI, Desktop, or VS Code) on Pro
(enable in `/config`), Max, Team, or Enterprise.

1. Open Claude Code in the repo root.
2. Turn on **auto mode** and the **`ultracode`** effort setting (effort menu) — or just
   ask Claude to "create/run a workflow".
3. Run a saved workflow:
   ```
   Run the .claude/workflows/houndshield-port.js workflow.
   ```
   or with arguments:
   ```
   Run .claude/workflows/houndshield-aeo-pages.js with questions
   ["Is ChatGPT HIPAA compliant?", "CMMC AI compliance tool"].
   ```

Claude shows what's about to run and asks you to confirm the first time. Workflows use
**substantially more tokens** than a normal session — start scoped.

## Important: subagent write permission

Workflow subagents need permission to **Write/Edit** files. In a locked-down sandbox
where subagent file writes are blocked, the agents will burn their turns hitting
permission walls and produce nothing. Run these in your **own authenticated Claude Code**
with auto mode (so agents can write), or in a session where Edit/Write are allowed for
subagents. (The initial port in this repo was authored directly in the main session for
exactly this reason.)

## Writing your own

A workflow is a plain-JS script that starts with a `meta` literal, then uses
`agent()`, `parallel()`, `pipeline()`, `phase()`, and `log()`. See Anthropic's
[dynamic workflows docs](https://code.claude.com/docs/en/workflows). Keep the
build-gate + fix-loop pattern at the end so every run lands green.
