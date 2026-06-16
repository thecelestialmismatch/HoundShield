# OldVersions/ — superseded & stray copies (kept, never deleted)

> **The graveyard with a guest list.** Nothing here is wired into the app or the
> Vercel build. It's material that was duplicated, replaced, or stranded at the
> repo root — moved here so the root stays clean **without losing anything**.
> Mine it freely; delete only after you've confirmed a file is truly redundant.

Legend: ♻️ stray/duplicate · 🕰️ superseded version · 🔎 has unique content worth reading

| Path | Why it's here | Status |
|------|---------------|--------|
| `files-1-stray-copy/` | Was `files 1/` at the repo root — a divergent parallel copy of `files/`. The directory name literally had a space in it (a shell footgun). | 🔎 **Has unique files** — see below. Not a clean duplicate. |

## `files-1-stray-copy/` — read before deleting

A `diff -rq files "files 1"` showed this is **not** an exact duplicate of `files/`.
It contains files that exist *only* here, e.g.:

- `BrainData.md`, `BrainData_v2.md` (Brain AI knowledge dumps)
- `CLAUDE 2.md`, `CLAUDE (1).md`, `CLAUDE_INSTRUCTIONS.txt`, `CLAUDE_UPDATED.md` (alternate project-instruction drafts)
- `CURRENT_SITUATION_REPORT.md`, `GCC_HIGH_SEO_ARTICLE.md`, `GIT_WORKFLOW.md`

**Action when you're ready:** diff each unique file against its counterpart in
`files/`, fold anything still valuable back into `files/` (or `brain/`), then this
folder can be removed in a dedicated cleanup commit. Until then it lives here,
safe and findable.

## Rules for this folder

1. **Move, don't delete** — anything you're 90% sure is dead but haven't verified.
2. **Always leave a row in the table above** saying what it was and why it moved.
3. Reference-safety: only move things with no inbound references from app code,
   config, or scripts (`grep -rIl` first).
4. App code (`compliance-firewall-agent/`, `proxy/`) **never** comes here.
