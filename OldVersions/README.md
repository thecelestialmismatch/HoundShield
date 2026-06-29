# 🗄️ OldVersions — Archive / Deprecated

Things we don't run anymore but keep for history, reference, or rollback. **Nothing here is
imported by the live app** (`compliance-firewall-agent/`) or the proxy — verified before move.

| Folder / file              | What it is                                              | Why archived |
|----------------------------|--------------------------------------------------------|--------------|
| `archive/`                 | Prior archive zone: binaries, brand assets, legacy projects (Brain.Ai, Kaelus.Online), reference docs, root SQL copies | Superseded; embedded git histories preserved |
| `legacy/`                  | Old root app (`old-root-app`), `struere-site`          | Replaced by `compliance-firewall-agent/` |
| `legacy-command-shims/`    | Back-compat shims for renamed slash commands           | Commands migrated to `.claude/commands/` |
| `redundant-root-docs/`     | Duplicate root docs: `CONTRIBUTING 2.md`, `LICENSE 2`, `README.zh-CN.md` | Exact/near duplicates of canonical versions |

## Rules
- **Read-only.** Don't build new work here.
- Safe to delete entirely once you're confident nothing references it.
- Some subfolders (`archive/legacy-projects/*`) contain their own `.git` history — that's intentional, it preserves those projects' commits.
