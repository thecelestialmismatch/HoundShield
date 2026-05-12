-- ============================================================
-- Migration 010: Fix RLS User Isolation + AI Observability Tables
-- Date: 2026-05-08
-- Priority: CRITICAL — apply before any production traffic
-- ============================================================


-- ============================================================
-- PART A: FIX RLS — Drop overly broad policies, add user-scoped ones
--
-- CRIT-01 from security audit:
-- The original "Service role full access" policies used `using (true)`
-- without a role qualifier, allowing anon users to read all rows.
-- ============================================================

-- Drop the broken blanket policies from migration 001
drop policy if exists "Service role full access" on compliance_events;
drop policy if exists "Service role full access" on quarantine_queue;
drop policy if exists "Service role full access" on policy_rules;
drop policy if exists "Service role full access" on audit_reports;
drop policy if exists "Service role full access" on hitl_approvals;
drop policy if exists "Service role full access" on seed_anchors;

-- compliance_events: users see only their own rows
create policy "auth_users_own_events"
  on compliance_events
  for select
  to authenticated
  using (user_id = auth.uid()::text);

create policy "service_role_all_events"
  on compliance_events
  for all
  to service_role
  using (true)
  with check (true);

-- quarantine_queue: service role only (contains encrypted prompt content)
create policy "service_role_all_quarantine"
  on quarantine_queue
  for all
  to service_role
  using (true)
  with check (true);

-- policy_rules: authenticated users read active rules; service role manages
create policy "auth_users_read_active_rules"
  on policy_rules
  for select
  to authenticated
  using (is_active = true);

create policy "service_role_all_rules"
  on policy_rules
  for all
  to service_role
  using (true)
  with check (true);

-- audit_reports: authenticated users read (scoped by service role writes)
create policy "auth_users_read_reports"
  on audit_reports
  for select
  to authenticated
  using (true);

create policy "service_role_all_reports"
  on audit_reports
  for all
  to service_role
  using (true)
  with check (true);

-- hitl_approvals: requestor sees their own; service role sees all
create policy "auth_users_own_hitl"
  on hitl_approvals
  for select
  to authenticated
  using (requested_by = auth.uid()::text);

create policy "service_role_all_hitl"
  on hitl_approvals
  for all
  to service_role
  using (true)
  with check (true);

-- seed_anchors: read-only for authenticated; service role manages
create policy "auth_users_read_anchors"
  on seed_anchors
  for select
  to authenticated
  using (true);

create policy "service_role_all_anchors"
  on seed_anchors
  for all
  to service_role
  using (true)
  with check (true);


-- ============================================================
-- PART B: AI OBSERVABILITY TABLES
-- Implements Steps 1-8 of the observability guide
-- ============================================================

-- ai_traces: one row per AI request, full trace data
create table if not exists ai_traces (
  id           uuid primary key default uuid_generate_v4(),
  trace_id     text not null unique,
  session_id   text not null,
  user_id      uuid not null references auth.users(id) on delete cascade,
  model_name   text not null,
  prompt_version text not null default 'unknown',
  temperature  real not null default 0.7,
  environment  text not null default 'production'
               check (environment in ('production', 'staging', 'development')),

  -- Timing
  start_ms     bigint not null,
  end_ms       bigint,

  -- Full span tree (Step 2: TRACE)
  spans        jsonb not null default '[]',

  -- Aggregated metrics (Step 4: METRICS)
  metrics      jsonb,

  -- Quality scores (Step 5: SCORE)
  quality_scores jsonb,

  -- Flagging results (Step 6: FLAG)
  flags        jsonb not null default '[]',
  is_flagged   boolean not null default false,
  flag_severity text check (flag_severity in ('warning', 'error', 'critical')),

  created_at   timestamptz not null default now()
);

create index idx_traces_user       on ai_traces(user_id);
create index idx_traces_flagged    on ai_traces(is_flagged) where is_flagged = true;
create index idx_traces_severity   on ai_traces(flag_severity) where is_flagged = true;
create index idx_traces_model      on ai_traces(model_name);
create index idx_traces_created    on ai_traces(created_at desc);
create index idx_traces_version    on ai_traces(prompt_version);

-- RLS on ai_traces
alter table ai_traces enable row level security;

create policy "auth_users_own_traces"
  on ai_traces
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "service_role_all_traces"
  on ai_traces
  for all
  to service_role
  using (true)
  with check (true);


-- ai_rag_contexts: RAG retrieval context per trace (Step 3)
create table if not exists ai_rag_contexts (
  id                   uuid primary key default uuid_generate_v4(),
  trace_id             text not null references ai_traces(trace_id) on delete cascade,
  span_id              text not null,
  retrieved_documents  jsonb not null default '[]',
  passed_to_model      text[] not null default '{}',
  similarity_scores    jsonb not null default '{}',
  source_names         text[] not null default '{}',
  created_at           timestamptz not null default now()
);

create unique index idx_rag_trace on ai_rag_contexts(trace_id);
create index idx_rag_sources on ai_rag_contexts using gin(source_names);

alter table ai_rag_contexts enable row level security;

create policy "service_role_all_rag"
  on ai_rag_contexts
  for all
  to service_role
  using (true)
  with check (true);


-- brain_consolidation_log: Dream consolidation run history (Pattern 4)
create table if not exists brain_consolidation_log (
  id        uuid primary key default uuid_generate_v4(),
  run_at    timestamptz not null default now(),
  updated   integer not null default 0,
  pruned    integer not null default 0,
  added     integer not null default 0,
  details   jsonb default '{}'
);

alter table brain_consolidation_log enable row level security;

create policy "service_role_all_consolidation"
  on brain_consolidation_log
  for all
  to service_role
  using (true)
  with check (true);


-- ============================================================
-- PART C: VERIFICATION QUERY
-- Run this after applying migration to verify RLS is correct
-- ============================================================
-- Expected: zero rows (no blanket anon or public access)
--
-- select tablename, policyname, roles, cmd, qual
-- from pg_policies
-- where schemaname = 'public'
--   and qual = 'true'
--   and (roles = '{}' or 'anon' = any(roles));
-- ============================================================
