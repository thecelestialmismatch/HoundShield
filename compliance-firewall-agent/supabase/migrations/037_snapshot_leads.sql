-- 037_snapshot_leads.sql
-- Persist the /demo#snapshot lead capture.
--
-- WHY: /api/report/snapshot-lead sent two emails and wrote NOTHING. If Resend
-- was down, rate-limited, or the alert landed in spam, the lead was gone with
-- no record anywhere — and when RESEND_API_KEY was unset the route returned 503
-- and dropped the lead entirely. That is the same defect class as the Stripe
-- webhook ("a buyer can pay and you would never hear about it"), one step
-- earlier in the funnel, on the only ungated lead capture the site has.
--
-- The route now writes here FIRST and emails second, so the two rails fail
-- independently: losing a lead requires both to fail.
--
-- PRIVACY BOUNDARY — read before adding a column. This table stores finding
-- COUNTS ONLY. There is deliberately no column for prompt text, matched
-- substrings, or anything derived from the pasted content. The product promise
-- is that prompt content never leaves the visitor's device; a column here would
-- be the first place that promise breaks, and it would break silently.
-- `lib/reports/__tests__/snapshot-lead-schema.test.ts` pins the column list
-- against the route's .strict() zod schema so the two cannot drift.
--
-- Additive only. No edits to prior migrations. Service-role writes only.

create table if not exists snapshot_leads (
  id              uuid primary key default gen_random_uuid(),
  -- Contact
  email           text not null,
  full_name       text not null,
  company         text,
  vertical        text,                        -- 'defense' | 'healthcare' | 'legal' | null
  -- Findings: COUNTS ONLY. Never add a content column here.
  critical_count  integer not null default 0,
  high_count      integer not null default 0,
  medium_count    integer not null default 0,
  total_matches   integer not null default 0,
  prompts_scanned integer not null default 0,
  -- NIST control ids only (e.g. 'SC.L2-3.13.1') — identifiers, not content.
  controls        text[] not null default '{}',
  created_at      timestamptz not null default now()
);

create index if not exists idx_snapshot_leads_email      on snapshot_leads (email);
create index if not exists idx_snapshot_leads_created_at on snapshot_leads (created_at desc);
create index if not exists idx_snapshot_leads_vertical   on snapshot_leads (vertical) where vertical is not null;

-- RLS: written only by the snapshot-lead route via the service role, which
-- bypasses RLS. No anon/authenticated access — these are operational sales
-- records, not user-facing rows. Enabling RLS with no policy denies all
-- non-service access by default (same posture as report_orders in 014).
alter table snapshot_leads enable row level security;

comment on table snapshot_leads is
  'Leads from the free in-browser AI risk snapshot (/demo#snapshot). Finding COUNTS ONLY — never prompt content. Service-role writes only.';
