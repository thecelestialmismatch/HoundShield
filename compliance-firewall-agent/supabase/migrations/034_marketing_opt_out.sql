-- ============================================================
-- Migration 034: Marketing opt-out (CAN-SPAM)
--   15 U.S.C. §7704(a)(3)-(a)(5)
-- Date: 2026-08-14
--
-- Why this exists:
--   The day-3/7/14 onboarding emails and the upgrade email are commercial
--   messages under CAN-SPAM. They shipped with no unsubscribe link, no postal
--   address, and — the part that made the other two unfixable — nowhere to
--   RECORD an opt-out. `onboarding_email_sequence` (migration 012) tracks only
--   what was sent, never whether the recipient asked us to stop.
--
--   §7704(a)(4) requires an opt-out to be honoured within 10 business days.
--   That is impossible to satisfy without somewhere to store it, so this column
--   is the precondition for the rest of the fix rather than a detail of it.
--
-- WHY A COLUMN AND NOT A TABLE:
--   Every marketing recipient is already a row in `profiles` — the drip joins
--   it for the address, and the upgrade email is keyed on the same id. A
--   separate suppression table would need its own join, its own RLS, and its
--   own drift risk, to hold one timestamp. If we ever mail people who are not
--   users (a newsletter, an imported list), that is when a real suppression
--   table earns its place.
--
-- NULL means "has not opted out" — not "has opted in". The distinction matters
-- for a future consent-based flow; this column records refusal only.
--
-- Idempotent: safe to re-run.
-- ============================================================

alter table if exists profiles
  add column if not exists marketing_opt_out_at timestamptz;

comment on column profiles.marketing_opt_out_at is
  'When the user unsubscribed from marketing email (CAN-SPAM 15 U.S.C. 7704(a)(4)). NULL = never opted out. Transactional mail — receipts, password resets, security notices — is unaffected and must still be sent.';

-- The drip filters on this every run, over a table that grows with signups.
-- Partial index: only the rows that matter to the query are indexed.
create index if not exists profiles_marketing_opt_out_idx
  on profiles (id)
  where marketing_opt_out_at is not null;
