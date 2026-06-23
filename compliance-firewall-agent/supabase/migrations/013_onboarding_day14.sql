-- 013_onboarding_day14.sql
-- Extends the onboarding drip with a day-14 finale that pushes the user to
-- generate their first C3PAO evidence report (the purchase unlock).
-- Additive only — never edits 012. Safe to run on top of existing data.

alter table onboarding_email_sequence
  add column if not exists day14_sent_at timestamptz;

create index if not exists idx_onboarding_day14_pending
  on onboarding_email_sequence (enrolled_at)
  where day14_sent_at is null;
