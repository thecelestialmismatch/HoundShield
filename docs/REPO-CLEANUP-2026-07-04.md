# Repo Cleanup — 2026-07-04

Removed **7,363 non-shipping files** from git tracking (repo went from ~13,500 → ~6,100
tracked files). Vercel builds **only** from `compliance-firewall-agent/` (see `vercel.json`);
nothing removed here was part of the deploy, the test suite, or any import graph.

## What was removed from the repo (kept on disk)

| Path | What it was | Size |
|------|-------------|------|
| `archive/` | binaries, legacy-projects, old-brand, sql-root-copies, claude-nested-dups | 121M |
| `legacy/` | old-root-app, struere-site | 22M |
| `FUTUREPARK/` | backups, `CLAUDE copy.md`, evaluation/prompt scratch | 14M |
| `OldVersions/` | `files-1-stray-copy` (duplicate CLAUDE/HERMES variants) | 6.9M |
| `files/`, `future/`, `FutureApp/`, `FutureUse/`, `legacy-command-shims/` | planning scratch / shims | ~1.4M |
| `docs/{legacy,app,lib,components,supabase,sdk,public,…}` + top-level code/config | a **stale duplicate Next.js app** (`docs/package.json` = houndshield@2.0.0) tangled into `docs/` | large |

`docs/` retains its **97 `.md` + 3 `.pdf`** reference files, so every CLAUDE.md / primer doc
pointer still resolves. Only the duplicate app code was stripped.

## Security — rotate these

`FUTUREPARK/Backup_/` contained committed recovery/backup codes:
`github-recovery-codes.txt`, `recovery-codesvercel.txt`, `stripe_backup_code.txt`.
They are removed from tracking but **remain in git history**. Rotate:
- GitHub two-factor recovery codes
- Vercel recovery codes
- Stripe backup code

To purge history entirely, run `git filter-repo` on those paths (separate op, force-push required).

## Where the files went

Nothing was deleted from the machine. Full backup outside the repo (211M):
`~/Desktop/HoundShield-repo-junk-backup-20260704/`

The worktree also still has every file on disk (now untracked + gitignored). After this
branch merges, a `git pull` on the main checkout will drop the tracked copies there — the
backup above is the durable local copy.

## Guardrail

`.gitignore` now ignores all removed paths so they cannot silently re-enter the repo.
`compliance-firewall-agent/tsconfig.json` dropped the now-absent `v1` exclude (kept
`legacy`/`sdk`, which still exist inside the app and stay out of type-checking).
