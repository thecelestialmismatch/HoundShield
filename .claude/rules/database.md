---
paths:
  - "compliance-firewall-agent/supabase/**"
  - "compliance-firewall-agent/lib/supabase*"
---

# Database Rules — HoundShield

## Supabase
- RLS enabled on EVERY new table — no exceptions
- Never trust client-sent user IDs — always derive from `supabase.auth.getUser()`
- No sensitive data (CUI, PII, SPRS scores) in error messages
- Immutable patterns — return new objects, never mutate

## Migrations
- File pattern: `supabase/migrations/00X_description.sql`
- Never edit existing migrations — always create new ones
- Test locally before pushing: `npx supabase db push`
- Migration files in repo: `compliance-firewall-agent/supabase/migrations/` (001–034)
- Applied to production: 001–027, plus 028 (rate-limit buckets), 031 (auth lockouts)
  and 032 (auth audit trail), applied 2026-08-12
- NOT applied: 029 + 030 (seed-anchor chain), 033 (Better Auth restrictive deny) and 034 (marketing opt-out)
- `/api/health` reports `rate_limit_store` / `auth_lockout_store` as degraded when a
  migration is missing, so check there before assuming a table exists

## Query Patterns
- Parameterized queries only — no string concatenation
- Handle all Supabase errors explicitly — never silently swallow
- Audit trail writes: SHA-256 hash, append-only, atomic operations
