-- ============================================================
-- Migration 019: api_keys table (gateway authentication)
-- Date: 2026-07-03
-- Priority: CRITICAL — the gateway routes already query `api_keys`, but the
-- table was never created, so every key check fell through to "accept any
-- non-empty string". This creates the table so validation can fail CLOSED and
-- so the gateway can resolve the caller's identity/tier server-side (never from
-- the client-supplied x-user-id header).
-- Additive only.
-- ============================================================

create table if not exists api_keys (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  -- SHA-256 hash of the raw key; the raw key is shown to the user exactly once.
  key_hash     text not null unique,
  -- Non-secret display prefix, e.g. "hs_live_a1b2…", for the UI key list.
  key_prefix   text not null,
  name         text not null default 'Default key',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz
);

create index if not exists idx_api_keys_user on api_keys(user_id);
create index if not exists idx_api_keys_hash on api_keys(key_hash) where is_active = true;

alter table api_keys enable row level security;

-- Users can see and revoke their own keys (key_hash is a hash, not the secret).
create policy "auth_users_own_api_keys"
  on api_keys
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "auth_users_revoke_own_api_keys"
  on api_keys
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Service role (gateway validation, key issuance) has full access.
create policy "service_role_all_api_keys"
  on api_keys
  for all
  to service_role
  using (true)
  with check (true);
