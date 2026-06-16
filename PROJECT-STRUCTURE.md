# HoundShield — Project Structure Map

> **Nothing here is junk-by-default.** This file labels every top-level folder
> and key file so valuable material is *findable and reusable later*, never lost.
> For the Claude Code control folder specifically, see **`.claude/README.md`**.

Legend:  🟢 product code (don't break) · 📚 reusable library · 📄 docs · ⚙️ config · 🧪 tests · 🗄️ archive/backup

---

## 🟢 The actual product (this is the app)

| Path | What it is |
|------|-----------|
| `compliance-firewall-agent/` | **The Next.js 15 app** — houndshield.com. Pages, API routes, Brain AI, classifier, gateway. This is the shipping product. |
| `proxy/` | **The HTTPS intercept proxy** (Mode B / self-hosted). `server.ts`, `scanner.ts`, `patterns/`. Never replace pattern regex — extend only. |
| `browser-extension/` | Browser extension client. |
| `supabase/` | DB migrations (001–004). |
| `public/` | Static assets served by the app. |

## ⚙️ Build / tooling config

| Path | What it is |
|------|-----------|
| `package.json` · `package-lock.json` · `yarn.lock` | Node deps |
| `next.config.ts` · `postcss.config.mjs` · `tsconfig.json` | Next/TS/CSS build |
| `eslint.config.js` · `eslint.config.mjs` · `commitlint.config.js` | Lint/commit rules |
| `vitest.config.ts` | Test runner config |
| `vercel.json` | Vercel deploy config |
| `pyproject.toml` | Python tooling (scripts/harness) |
| `config/` · `manifests/` · `schemas/` · `mcp-configs/` | Install/config/JSON-schema/MCP server definitions |
| `install.sh` · `install.ps1` · `dev-start.sh` · `commit-sync.sh` | Setup & dev scripts |
| `.githooks/` · `hooks/` | Git/automation hooks |
| `tools/` · `scripts/` | Agent harness + helper scripts |

## 📚 Reusable libraries (kept for future use — NOT deleted)

These are large starter/template collections. They are **not wired into the app**
but are a valuable grab-bag you can pull from later. Labeled so you know what's there.

| Path | Count | What it is |
|------|-------|-----------|
| `agents/`   | 63 files  | Template **subagent** library (root). Your *active* project agents live in `.claude/agents/`. |
| `skills/`   | 401 files | Template **skill** library (root). Active project skills live in `.claude/skills/`. |
| `commands/` | 80 files  | Template **slash-command** library (root). Active commands live in `.claude/commands/`. |
| `rules/`    | —         | Template rules library (root). Active rules live in `.claude/rules/`. |
| `plugins/`  | —         | Plugin bundles. |
| `integrations/` | —     | AI-integration configs/snippets. |
| `examples/` | —         | Example code/snippets. |
| `legacy/` · `legacy-command-shims/` | — | Old code + back-compat shims (each has its own README). |

## 📄 Documentation & planning

| Path | What it is |
|------|-----------|
| `README.md` · `README.zh-CN.md` | Project readme (EN + 中文) |
| `CLAUDE.md` · `AGENTS.md` · `GEMINI.md` | AI-tool project rules (Claude / generic / Gemini) |
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

## 🗄️ Archive / backup (kept, low-priority)

| Path | What it is |
|------|-----------|
| `FUTUREPARK/` | Archived backups & experiments (`Backup_*`). |
| `archive/` | Binaries & old artifacts. |
| `files/` | 48 misc playbooks/notes. |
| `files 1/` | ⚠️ **45 files — appears to be a duplicate copy of `files/`** (e.g. `7DAY_PLAYBOOK 2.md`). Kept per "lose nothing," but a strong candidate to merge/dedupe later. |

## 🧪 Tests & AI control

| Path | What it is |
|------|-----------|
| `__tests__/` | Test suite. |
| `.claude/` | **Claude Code control folder** → fully labeled in `.claude/README.md`. |
| `.claire/` · `.playwright-mcp/` | Other AI-tool / Playwright-MCP working data. |
| `agent.yaml` · `gemini-extension.json` | Agent + Gemini extension manifests. |

---

## Notes for future cleanup (when you're ready — none done here)

1. **`files 1/`** looks like an accidental duplicate of `files/`. Diff them, keep one.
2. **Root `agents/` `skills/` `commands/` `rules/`** are template *libraries*; the
   app only uses the curated copies under `.claude/`. You could move the root
   libraries into a single `library/` folder to declutter the root — but that's a
   reorg with reference risk, so it's deliberately left for a separate pass.
3. Everything in this map is **committed and safe** — reusable whenever you want it.
