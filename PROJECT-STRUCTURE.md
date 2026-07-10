# HoundShield — Project Structure Map

> **One page, total clarity.** Every top-level folder and key file is labeled so you
> always know *what it is* and *where to find it*. **Nothing is junk-by-default** —
> anything not active is parked (not deleted) in a labeled holding folder.
>
> - Claude Code control folder details → **`.claude/README.md`**
> - AgentHarness deep-research agents → **`agents/agentharness/README.md`**
> - Verify this layout anytime → `npm run verify:structure`

Legend:  🟢 product (don't break) · 📚 reusable library · 📄 docs · ⚙️ config · 🧪 tests · 🗄️ holding (kept) · 🤖 AI control

---

## ⚡ Find anything in 5 seconds

| I'm looking for… | Go to |
|------------------|-------|
| **The actual app / website code** | `compliance-firewall-agent/` (Next.js 15 — Vercel builds *only* this) |
| **The proxy product (Mode B)** | `proxy/` (`server.ts`, `scanner.ts`, `patterns/`) |
| **What Claude Code reads first** | `.claude/` → map in `.claude/README.md` |
| **Project rules for AI tools** | `CLAUDE.md` (Claude) · `AGENTS.md` · `GEMINI.md` · `.cursorrules` · `.windsurfrules` |
| **Active subagents** | `.claude/agents/` (the curated set the app uses) |
| **The big subagent library** | `agents/` (63+ templates) · AgentHarness bridges in `agents/agentharness/` |
| **Skills / slash-commands** | active: `.claude/skills/` · `.claude/commands/` — libraries: `skills/` · `commands/` |
| **Dynamic (multi-agent) workflows** | `.claude/workflows/` (start from `_template.dynamic-workflow.js`) |
| **Hooks / rules / output-styles** | `.claude/hooks/` · `.claude/rules/` · `.claude/output-styles/` |
| **Docs (PRD, roadmap, launch, SEO)** | `docs/` · plus `ROADMAP.md` `BACKLOG.md` `DECISIONS.md` `DESIGN.md` |
| **Sprint queue / lessons** | `tasks/todo.md` · `tasks/lessons.md` (read first each session) |
| **Brain AI knowledge data** | `brain/` |
| **Deploy config** | `vercel.json` (root) · crons in `compliance-firewall-agent/vercel.json` |
| **AgentHarness (deep research)** | `tools/agent-harness/` (submodule) + bridge `tools/agent-harness-bridge/` |
| **How to launch the app locally** | `dev-start.sh` · `.claude/launch.json` |

---

## 🗺️ Canonical layout (the clean Claude Code setup, applied here)

This is the standard Claude Code project shape — what the reference "Claude Code
Setup" looks like — mapped onto HoundShield:

```
HoundShield/                         Project root Claude Code reads
├── CLAUDE.md                        Project rules / HERMES brain
├── CLAUDE.local.md.example          Template → copy to CLAUDE.local.md (gitignored)
├── .mcp.json.example                Template → copy to .mcp.json (MCP servers, gitignored)
├── .gitignore                       Ignores *.local.*, .mcp.json, *.docx, secrets
├── AGENTS.md / GEMINI.md            Cross-tool agent rules (other AI CLIs)
├── PROJECT-STRUCTURE.md             ← THIS FILE (the whole-repo map)
│
├── .claude/                         ← Claude Code looks here FIRST (see .claude/README.md)
│   ├── README.md                    Labeled control-folder map
│   ├── agents/                      Active subagents — one job each, isolated context
│   ├── skills/                      Model-invokable, load on demand
│   ├── commands/                    Slash commands (/deploy /ship …)
│   ├── hooks/                       Deterministic — fire every matching event
│   ├── rules/                       Path-scoped guidance (loads on glob match)
│   ├── output-styles/               Custom response formats (opt-in: terse.md)
│   ├── plugins/                     Plugin bundles (pointer → root /plugins)
│   ├── workflows/                   Dynamic multi-agent workflows (+ _template)
│   ├── settings.json                Permissions, model, hook registry (TRACKED)
│   ├── launch.json                  Dev launch config (npm run dev → :3000)
│   ├── statusline.sh                Custom bottom-bar (opt-in)
│   └── worktrees/                   Transient agent worktrees (build isolation)
│
├── compliance-firewall-agent/       🟢 THE APP (Vercel builds this subdir)
├── proxy/                           🟢 HTTPS intercept proxy (Mode B)
│
├── agents/ skills/ commands/ rules/ 📚 reusable LIBRARIES (root) — supersets of .claude/
│   └── agents/agentharness/         🤖 AgentHarness deep-research agent bridges
├── tools/                           agent-harness (submodule) + agent-harness-bridge
│
├── docs/  brain/  tasks/  research/  advisory/   📄 docs / knowledge / planning
└── scripts/ config/ schemas/ manifests/ integrations/  ⚙️ tooling & config
```

> **Why the app sits in a subfolder:** `vercel.json` builds
> `compliance-firewall-agent/package.json` only. The **repo root is a control/meta
> layer** (agents, skills, commands, docs, `.claude/`). Reorganizing root folders
> therefore **cannot break the production build** — proven by the Vercel preview on
> every PR.

---

## 🟢 The actual product (this is the app)

| Path | What it is |
|------|-----------|
| `compliance-firewall-agent/` | **The Next.js 15 app** — houndshield.com. Pages, API routes, Brain AI, classifier, gateway. The shipping product; **Vercel builds this subdir.** |
| `proxy/` | **The HTTPS intercept proxy** (Mode B / self-hosted). `server.ts`, `scanner.ts`, `patterns/`. Never replace pattern regex — extend only. |
| `browser-extension/` | Browser extension client. |
| `supabase/` | DB migrations (001–004). |
| `public/` | Static assets served by the app. |

## 🤖 AI control & automation

| Path | What it is |
|------|-----------|
| `.claude/` | **Claude Code control folder** — fully labeled in `.claude/README.md`. Canonical layout above. |
| `.claude/workflows/` | **Dynamic workflows** — fan work across many subagents in one session. Start from `_template.dynamic-workflow.js`; see `.claude/workflows/README.md`. |
| `tools/agent-harness/` | **AgentHarness** (git submodule → `github.com/ApodexAI/AgentHarness`) — the Apodex-1.0 deep-research ReAct eval harness. Materialize with `git submodule update --init --recursive tools/agent-harness`. |
| `tools/agent-harness-bridge/` | HoundShield ↔ AgentHarness glue: gateway benchmark + `brain_smoke_eval.py` (demo-critical Brain AI regression). |
| `agents/agentharness/` | **AgentHarness agent bridges** — Claude Code subagents that drive the harness (deep-research, keep5, gateway-benchmark, brain-smoke-eval). Index: `agents/agentharness/README.md`. |
| `.claire/` · `.playwright-mcp/` | Other AI-tool / Playwright-MCP working data. |
| `agent.yaml` · `gemini-extension.json` | Agent + Gemini extension manifests. |

## 📚 Reusable libraries (kept for future use — NOT deleted)

Large starter/template collections — **not wired into the app**, a grab-bag to pull
from. Active, curated copies live under `.claude/`.

| Path | Count | What it is |
|------|-------|-----------|
| `agents/`   | 63 files (+ `agentharness/`) | Template **subagent** library (root). Active agents → `.claude/agents/`. |
| `skills/`   | ~400 files | Template **skill** library (root). Active skills → `.claude/skills/`. |
| `commands/` | ~80 files  | Template **slash-command** library (root). Active → `.claude/commands/`. |
| `rules/`    | —          | Template rules library (root). Active → `.claude/rules/`. |
| `plugins/`  | —          | Plugin bundles. |
| `integrations/` | —      | AI-integration configs/snippets. |
| `examples/` | —          | Example code/snippets. |
| `legacy/` · `legacy-command-shims/` | — | Old code + back-compat shims (each has its own README). |

## ⚙️ Build / tooling config

| Path | What it is |
|------|-----------|
| `package.json` (root) | Workspace marker + `verify:structure` script. App deps live in `compliance-firewall-agent/`. |
| `vercel.json` | Vercel deploy config (builds `compliance-firewall-agent/`). |
| `next.config.ts` · `postcss.config.mjs` · `tsconfig.json` | Next/TS/CSS build |
| `eslint.config.js` · `eslint.config.mjs` · `commitlint.config.js` | Lint/commit rules |
| `vitest.config.ts` | Test runner config |
| `pyproject.toml` | Python tooling (scripts/harness) |
| `config/` · `manifests/` · `schemas/` · `mcp-configs/` | Install/config/JSON-schema/MCP definitions |
| `install.sh` · `install.ps1` · `dev-start.sh` · `commit-sync.sh` | Setup & dev scripts |
| `.githooks/` · `hooks/` | Git/automation hooks |
| `scripts/` | Helper scripts — incl. `verify-structure.mjs` (asserts this map). |

## 📄 Documentation & planning

| Path | What it is |
|------|-----------|
| `README.md` · `README.zh-CN.md` | Project readme (EN + 中文) |
| `CLAUDE.md` · `AGENTS.md` · `GEMINI.md` | AI-tool project rules |
| `CLAUDE.local.md.example` | Template → copy to `CLAUDE.local.md` (personal, gitignored) |
| `.cursorrules` · `.windsurfrules` | IDE-specific rule files |
| `docs/` | 100+ docs (PRD, roadmap, SEO, launch checklists) |
| `advisory/` · `research/` | Architecture advisory + codebase analysis |
| `ROADMAP.md` · `BACKLOG.md` · `DECISIONS.md` · `DESIGN.md` · `RULES.md` | Planning & decisions |
| `STATE.md` · `WORKING-CONTEXT.md` · `LEARNED-RULES.md` | Working state / accumulated context |
| `CHANGELOG.md` · `VERSION` | Release history |
| `CONTRIBUTING.md` · `CODE_OF_CONDUCT.md` · `SECURITY.md` · `LICENSE` | Project governance |
| `COMMANDS-QUICK-REF.md` · `TROUBLESHOOTING.md` | Quick references |
| `SPONSORS.md` · `SPONSORING.md` | Sponsorship |
| `SKILL.md` · `caveman.skill` | Top-level skill manifests |
| `tasks/` | `todo.md` (sprint queue) + `lessons.md` (correction log) — read first each session |
| `brain/` | Brain AI knowledge data (`BrainData.md`) |

## 🗄️ Holding folders (removed in PR #146)

The former holding buckets (`OldVersions/`, `FutureUse/`, `FutureApp/`,
`FUTUREPARK/`, `archive/`, `files/`) were intentionally deleted in the PR #146
repo cleanup (−7,363 files). Their contents live in git history; recover with
`git log --all -- <path>` + `git checkout <sha> -- <path>` if ever needed.

## 🧪 Tests

| Path | What it is |
|------|-----------|
| `scripts/verify-structure.mjs` | **Structure test** — asserts this map (`npm run verify:structure`, exit non-zero on drift; also runs in CI as the Repo Structure Guard). |
| `compliance-firewall-agent/` | App tests (vitest) live with the app; CI runs tsc + lint + tests + build. |
| `proxy/` | Proxy tests (vitest) live with the proxy; CI runs tsc + tests + build (Proxy Build & Test job). |

---

## Maintenance rules

1. **Git history is the archive.** Superseded material is deleted, not parked —
   the old holding folders were removed in PR #146; recover anything via git history.
2. **Reference-safety before any move or delete** — `grep -rIl` the path first.
   App code (`compliance-firewall-agent/`, `proxy/`) never gets bulk-moved.
3. **Keep this map true** — after structural changes, run `npm run verify:structure`
   and update the tables here. The two are meant to agree.
4. **Active vs library** — wire things into `.claude/` to make them active; leave the
   root `agents/ skills/ commands/ rules/` supersets as the library.
