-- ============================================================
-- Migration 032: Authentication audit trail
--   NIST 800-171 3.3.1 / 3.3.2 · CMMC AU.2.041, AU.2.042, AU.3.046
-- Date: 2026-08-12
--
-- Why this exists:
--   HoundShield's entire pitch is that it turns AI usage into evidence an
--   assessor will accept: SHA-256 hash-chained logs, control mappings, a
--   signed PDF. It kept no such record of its OWN authentication. Every
--   sign-in, every failure, every lockout, every password reset happened with
--   no durable trail — only `console.log` into Vercel's rolling retention,
--   which is not an audit log: it is unqueryable, unretained, and mutable by
--   anyone with project access.
--
--   3.3.1 requires system audit records sufficient to "monitor, analyze,
--   investigate, and report unlawful or unauthorized system activity." An
--   authentication event is the canonical example. A vendor that grades its
--   customers on AU.2.041 while failing it internally is the finding that
--   costs a deal in the assessment room, not merely a gap in a checklist.
--
-- WHY NOT `compliance_events`:
--   That table is NOT a general audit sink. Migration 001 constrains
--   `action_taken` to ('ALLOWED','BLOCKED','QUARANTINED'), and
--   lib/dashboard/gateway-traffic.ts reads it to render the operator's gateway
--   telemetry. Writing sign-in events there would either violate the CHECK or
--   silently inflate a customer's "prompts scanned" figures with rows that
--   were never prompts. The dashboard's honesty guarantee depends on that
--   table meaning exactly one thing, so authentication gets its own.
--
-- ENUMERATION (the constraint that shapes the schema):
--   Rows are keyed on a SHA-256 prefix of the SUBMITTED address — the same
--   `lockoutKey()` used by migration 031 — and written whether or not the
--   address resolves to an account. If only real accounts produced rows, the
--   presence of a row would itself prove existence, re-opening the oracle the
--   rest of this work closes. `user_id` is therefore NULLABLE and is set only
--   once identity is already established.
--   NEVER add a plaintext email column to this table.
--
-- Privacy posture:
--   Stores an email hash, an IP hash, a coarse user-agent family, an event
--   name and a timestamp. Never an address, never a raw IP, never a password,
--   never a token, never prompt content. Nothing here is CUI or PHI, which is
--   what makes it safe to retain for the two years an assessor expects.
-- ============================================================

create table if not exists public.auth_audit_events (
  id             bigserial primary key,

  -- What happened. Constrained so a typo cannot invent an event type that
  -- silently never appears in a report.
  event_type     text not null check (event_type in (
                   'login_success',
                   'login_failure',
                   'signup_requested',
                   'password_reset_requested',
                   'password_reset_completed',
                   'lockout_triggered',
                   'email_verified',
                   'logout'
                 )),

  -- SHA-256 prefix of the normalized submitted address (lockoutKey).
  -- Correlates with auth_lockouts.email_hash without either table holding PII.
  email_hash     text not null check (char_length(email_hash) between 16 and 64),

  -- Set ONLY when identity is already established. Null for every failure and
  -- for any event about an address that may not exist — see ENUMERATION above.
  user_id        uuid null,

  -- Hashed, not raw. An assessor needs "same origin or not", not an address,
  -- and a raw IP is personal data in the EU.
  ip_hash        text null,

  -- Coarse family ('chrome','safari','firefox','edge','other','unknown'), not
  -- the raw string, which is a fingerprinting vector and often carries
  -- corporate build identifiers.
  user_agent     text null,

  -- Free-form, non-identifying context: failure reason category, lock minutes
  -- remaining, whether CAPTCHA was required. Must never receive an address.
  detail         jsonb not null default '{}'::jsonb,

  created_at     timestamptz not null default now()
);

-- "Show me everything for this address in the last 90 days" — the single most
-- common assessor and incident-response question.
create index if not exists auth_audit_events_email_hash_idx
  on public.auth_audit_events (email_hash, created_at desc);

-- "Show me all failures across the tenant this week" — brute-force review.
create index if not exists auth_audit_events_type_time_idx
  on public.auth_audit_events (event_type, created_at desc);

-- Per-account history once identity is known.
create index if not exists auth_audit_events_user_idx
  on public.auth_audit_events (user_id, created_at desc)
  where user_id is not null;

-- ── Access control ──────────────────────────────────────────────────────────
-- RLS on with NO permissive policy: PostgREST reaches this table through the
-- anon and authenticated roles, and with RLS enabled and no policy they get
-- nothing. Writes go through the service role, which bypasses RLS. That is
-- deliberate — an audit trail a user can read is a map of who else uses the
-- product, and one a user can write is not evidence.
alter table public.auth_audit_events enable row level security;

revoke all on public.auth_audit_events from anon, authenticated;

-- ── Integrity ───────────────────────────────────────────────────────────────
-- Append-only. An audit record that can be updated or deleted by the
-- application is not evidence — the whole claim this product sells rests on
-- that distinction, so it is enforced by the database rather than by
-- convention. The service role is included ON PURPOSE: the application must
-- not be able to rewrite history even by accident. Retention pruning is a
-- migration or a superuser job, not an app code path.
create or replace function public.auth_audit_events_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'auth_audit_events is append-only (attempted %)', tg_op;
end;
$$;

drop trigger if exists auth_audit_events_no_update on public.auth_audit_events;
create trigger auth_audit_events_no_update
  before update or delete on public.auth_audit_events
  for each row execute function public.auth_audit_events_immutable();

comment on table public.auth_audit_events is
  'Append-only authentication audit trail. NIST 800-171 3.3.1/3.3.2, CMMC AU.2.041. '
  'Keyed on an email HASH, never an address — see migration 032 for why. '
  'Do not write gateway or prompt events here; those belong in compliance_events.';
