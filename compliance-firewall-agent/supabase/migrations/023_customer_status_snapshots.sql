-- ============================================================
-- Migration 023: Customer status snapshots (progress over time)
-- Date: 2026-07-05
-- Evolves the customer-status feature from session-only into progress-aware: a
-- small, non-CUI snapshot of the customer's OWN compliance posture is stored so
-- the dashboard (and Brain AI) can show a trend — "SPRS +18 since your last visit".
--
-- Privacy posture (continues migration 022's model):
--   • Snapshots hold ONLY compliance-posture metadata — SPRS score, completion %,
--     journey stage, open-gap count, and the next-step title/link. NEVER raw
--     assessment answers, evidence, CUI, or PHI.
--   • Own-row only: a user reads only their own snapshots (RLS auth.uid()); the
--     service role (snapshot API) writes. No cross-customer visibility.
--   • Written ONLY when the user has granted Brain AI data access (migration 022)
--     — the same consent gate governs whether their posture is stored at all.
-- Additive only.
-- ============================================================

create table if not exists customer_status_snapshots (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  sprs_score         integer,               -- −203..110, or null if not assessed
  completion_percent numeric(5,1),          -- 0.0..100.0
  stage              text not null,          -- not_started | assessing | report_pending | remediating | report_delivered | monitoring
  gap_count          integer,               -- open control gaps, or null
  next_step_title    text,                   -- e.g. "Fix AC.3.021 — Monitor remote access" (no CUI)
  next_step_href     text,
  captured_at        timestamptz not null default now()
);

create index if not exists idx_status_snapshots_user_time
  on customer_status_snapshots (user_id, captured_at desc);

-- RLS: a user reads only their own snapshots; the service role manages all.
alter table customer_status_snapshots enable row level security;

create policy "auth_users_read_own_status_snapshots"
  on customer_status_snapshots
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "service_role_all_status_snapshots"
  on customer_status_snapshots
  for all
  to service_role
  using (true)
  with check (true);

comment on table customer_status_snapshots is
  'Non-CUI compliance-posture snapshots (SPRS score, stage, gap count, next step) for showing progress over time. Own-row RLS; written only under Brain AI data consent (migration 022).';
