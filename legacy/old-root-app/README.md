# Archived: stale pre-migration root app scaffold

`app/`, `src/`, `contexts/`, `contact/`, `about/`, `assets/` — an **older duplicate** of the
HoundShield app that lived at the repo root before everything was moved into
`compliance-firewall-agent/`.

Why it's dead:
- `vercel.json` builds **only** `compliance-firewall-agent/` (routes rewrite there).
- The root `package.json` has no build script; root `next.config.ts` is empty.
- The root `app/layout.tsx` differs from (is older than) the live one.
- Build + 404 tests stayed green after archiving it.

Kept for reference/history on 2026-06-06; not wired into any build.
