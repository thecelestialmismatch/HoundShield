-- 012_onboarding_email_sequence.sql
-- Tracks 3-email drip sequence enrollment per user.
-- day1 is sent immediately on welcome; day3/day7 are stamped after Resend confirms.

create table if not exists onboarding_email_sequence (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  enrolled_at      timestamptz not null default now(),
  day3_sent_at     timestamptz,
  day7_sent_at     timestamptz,
  constraint uq_onboarding_user unique (user_id)
);

-- Allow service client to read/write; block direct row access from anon/authenticated roles.
alter table onboarding_email_sequence enable row level security;

create policy "service_role_full_access" on onboarding_email_sequence
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create index idx_onboarding_day3_pending on onboarding_email_sequence (enrolled_at)
  where day3_sent_at is null;

create index idx_onboarding_day7_pending on onboarding_email_sequence (enrolled_at)
  where day7_sent_at is null;
