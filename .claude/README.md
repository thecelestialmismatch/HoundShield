# `.claude/` — Claude Code Control Folder

> This folder is where Claude Code looks **first**. Everything here is committed
> and shared with the team (see `.gitignore:69`). Personal/secret files
> (`*.local.json`, `CLAUDE.local.md`, `.mcp.json`) are gitignored on purpose.

Every entry below is labeled, the way a clean Claude Code setup should be.

```
HoundShield/                          Project root Claude Code reads
├── CLAUDE.md                         Project rules / HERMES brain (< 200 lines ideal)
├── CLAUDE.local.md.example           Template → copy to CLAUDE.local.md (gitignored)
├── .mcp.json.example                 Template → copy to .mcp.json (MCP servers, gitignored)
├── .gitignore                        Ignores *.local.*, .mcp.json, secrets
├── AGENTS.md / GEMINI.md             Cross-tool agent rules (other AI CLIs)
│
└── .claude/                          ← YOU ARE HERE — Claude Code looks here first
    ├── README.md                     This labeled map
    ├── agents/                       Subagents — isolated context, one job each
    │   ├── hermes-build.md           FORGE+ATLAS — ships features (front + back)
    │   ├── hermes-growth.md          STRIKER — pricing, funnel, GTM, MRR
    │   ├── hermes-ops.md             Infra — Supabase, Stripe, Vercel env
    │   ├── hermes-qa.md              GUARDIAN — 80% coverage gate, E2E
    │   ├── hermes-seo.md             SEO — keywords, on-page, AI citation
    │   ├── brain-updater.md          Updates Brain AI knowledge graph at session end
    │   ├── compliance-specialist.md  Validates SPRS / CUI / PHI / SOC2 mapping
    │   ├── code-reviewer.md          Reviews diffs, returns a summary
    │   ├── security-auditor.md       Deep security pass before risky deploys
    │   ├── debugger.md               Root-cause tracer (no guessing)
    │   ├── refactorer.md             Safe, graph-powered cleanup
    │   ├── test-writer.md            Writes tests BEFORE implementation (TDD)
    │   ├── doc-writer.md             Generates/updates docs after features
    │   └── team-lead.md              Governance — handles escalations & conflicts
    │
    ├── skills/                       Model-invokable, load on demand
    │   ├── everything-claude-code.md Reference skill for Claude Code itself
    │   ├── explore-codebase.md       How to explore this repo fast
    │   ├── refactor-safely.md        Safe refactor playbook
    │   ├── review-changes.md         Pre-commit change review
    │   ├── saas-playbook.md          GTM / SaaS growth moves
    │   ├── token-efficiency.md       Keep context lean
    │   ├── frontend-design/          (folder) UI/design skill bundle
    │   └── …21 total                 Full list: `ls .claude/skills`
    │
    ├── commands/                     Slash commands — /deploy /ship etc.
    │   ├── deploy.md                 /deploy — deployment flow
    │   ├── ship.md                   /ship — finish + push a change
    │   ├── pr-review.md              /pr-review — review a pull request
    │   ├── fix-issue.md              /fix-issue — triage + fix a GitHub issue
    │   ├── plan-ceo.md               /plan-ceo — strategy planning
    │   └── ralph.md                  /ralph — long-running loop helper
    │
    ├── hooks/                        Deterministic — fire every time, not model-judged
    │   ├── lint-on-save.sh           Runs on Edit|Write (PostToolUse)
    │   └── pre-commit.sh             Runs before commits (PreCommit gate)
    │
    ├── rules/                        Path-scoped guidance, loads on glob match
    │   ├── api.md                    Loads for API routes
    │   ├── database.md               Loads for Supabase / DB work
    │   ├── frontend.md               Loads for UI work  (NOTE: marked STALE in primer)
    │   └── stack.md                  Stack conventions
    │
    ├── workflows/                    Multi-agent JS workflow scripts
    │   ├── houndshield-aeo-pages.js  Generates AEO/FAQ pages
    │   └── houndshield-port.js       Direction-A page porting
    │
    ├── output-styles/                Custom response formats (opt-in)
    │   └── terse.md                  Code-only, minimal prose
    │
    ├── plugins/                      Bundled commands + agents + MCP (see note)
    │   └── README.md                 Pointer — repo plugins live in root /plugins
    │
    ├── settings.json                 Permissions, model, hook registry  (TRACKED)
    ├── settings.local.json.example   Template for personal settings (gitignored real file)
    ├── launch.json                   Dev launch config (npm run dev → :3000)
    ├── statusline.sh                 Custom bottom-bar (opt-in — see below)
    └── worktrees/                    Transient agent worktrees (build isolation)
```

## How the pieces fit

| Folder | Loaded… | Who triggers it |
|--------|---------|-----------------|
| `agents/`     | when delegated | you, or another agent |
| `skills/`     | on demand | model decides relevance |
| `commands/`   | on `/name` | you type the slash command |
| `hooks/`      | every matching event | the harness (deterministic) |
| `rules/`      | on file-path glob match | the harness |
| `output-styles/` | when selected | you opt in |

## Opt-in extras (safe — off until you enable them)

**Custom statusline** — wire `statusline.sh` in by adding to `settings.json`:
```json
"statusLine": { "type": "command", "command": ".claude/statusline.sh" }
```

**Terse output style** — activate from an interactive Claude Code session via the
output-style picker, or set it as default in your personal `settings.local.json`.

## ⚠️ One real thing to know (not changed here — labeling only)

`settings.json` hook commands point at
`/Users/yantr/Desktop/HoundShield.Online-main/.claude/hooks/…`
— note the `.Online`, which is a **different directory** than this repo
(`HoundShield-main`). If those hooks silently no-op for you, that stale absolute
path is why. Left untouched on purpose (changing it alters behavior, not labels).
