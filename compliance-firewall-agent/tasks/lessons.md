# Kaelus.ai — Error & Correction Log

Read this file at the START of every session. Apply every rule before touching code.
Format: [YYYY-MM-DD] | what went wrong | rule to prevent next time

---

## RULES IN EFFECT

[2026-03-16] | State files (.claude-session-state.md, .claude-memory.md) were deleted in cleanup commit, losing session continuity | Never delete state files — they are project infrastructure, not artifacts. Add to .gitignore if needed but NEVER delete.

[2026-03-16] | .env.local only contains Vercel OIDC token, no real credentials — app cannot connect to Supabase, Stripe, or OpenRouter | Before ANY feature work, confirm ALL env vars in .env.example are filled in .env.local AND in Vercel dashboard environment variables.

[2026-03-16] | output: "standalone" in next.config.js is Docker-optimized — verify this doesn't conflict with Vercel deployment before pushing | Always run `npm run build` locally before claiming anything is deployable.

[2026-03-16] | WebSocket server (server.ts) is NOT supported on Vercel serverless — it requires a persistent Node.js process | Vercel deployment = SSE mode only. WebSocket mode requires Docker/Railway/Render. Document this clearly before any deployment.

[2026-03-16] | Supabase migrations not applied to production — 3 migration files exist locally but production DB may be empty | Run `npx supabase db push` against production BEFORE deploying the app, or the app will crash on DB operations.

[2026-03-16] | CLAUDE.md says "Light theme is primary" but kaelus-dev skill says "Dark theme, bg-[#07070b]" — conflicting design system docs | Source of truth: check tailwind.config.js and the actual components. Update CLAUDE.md to match reality after verification.

---

[2026-03-16] | Vercel deployment BLOCKED on Hobby plan — "could not associate committer with a GitHub user" — commits were made with a git identity that doesn't match the GitHub account owner (thecelestialmismatch) | Always run `git config user.email` before pushing. Set to thecelestialmismatch@gmail.com. Use empty commit to re-trigger Vercel if identity was wrong.

## TEMPLATE FOR NEW ENTRIES
[YYYY-MM-DD] | [what failed or what the user corrected] | [exact rule to follow next time]
[2026-03-16] | TASK: Gap 2 subscription gating | PATTERN: Import subscription check after API key validation, before body parse — keeps auth chain clean | ANTI-PATTERN: Don't trust x-user-id as authoritative identity — it's client-supplied; link to api_keys.user_id once that table has the column
[2026-03-16] | TASK: Gap 3 webhook | PATTERN: invoice.paid is the recovery handler — without it, past_due stays stuck even after successful retry | ANTI-PATTERN: Don't assume customer.subscription.updated covers all recovery paths — Stripe event ordering can be non-deterministic
[2026-03-16] | TASK: Gap 4 pricing + Growth tier | PATTERN: New tier needs 4 simultaneous changes — DB migration, TS type, Stripe price map, UI. Do all in one commit or you'll have a window where the code references a type the DB doesn't know about | ANTI-PATTERN: Don't use price*12 for annual display — always store annualTotal explicitly for exact pricing
