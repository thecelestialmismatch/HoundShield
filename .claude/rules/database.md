---
paths:
  - "compliance-firewall-agent/supabase/**"
  - "compliance-firewall-agent/lib/supabase*"
---

# Database Rules — Hound Shield

## Supabase
- RLS enabled on EVERY new table — no exceptions
- Never trust client-sent user IDs — always derive from `supabase.auth.getUser()`
- No sensitive data (CUI, PII, SPRS scores) in error messages
- Immutable patterns — return new objects, never mutate

## Migrations
- File pattern: `supabase/migrations/00X_description.sql`
- Never edit existing migrations — always create new ones
- Test locally before pushing: `npx supabase db push`
- Current production state: migrations 001–004 applied

## Query Patterns
- Parameterized queries only — no string concatenation
- Handle all Supabase errors explicitly — never silently swallow
- Audit trail writes: SHA-256 hash, append-only, atomic operations
