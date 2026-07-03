-- ============================================================
-- Migration 018: Fix RLS on profiles / subscriptions / usage_tracking
-- Date: 2026-07-03
-- Priority: CRITICAL — apply before any production traffic.
--
-- The "Service role full access" policies from migration 003 used
-- `using (true)` with NO `to` clause. Postgres defaults such policies to
-- PUBLIC and OR's permissive policies together, so they granted EVERY role
-- (including the anon key that ships to every browser) full read/write on all
-- customer profiles, subscriptions, and usage rows. This is the exact bug
-- class migration 010 fixed for the other tables — but 003's three tables
-- were never corrected. This migration closes it.
--
-- Also hardens self-update so a user cannot escalate their own `role` or
-- `tier` (entitlements are set server-side / by the Stripe webhook only).
-- Additive only; no edits to prior migrations.
-- ============================================================


-- ── profiles ───────────────────────────────────────────────────────────────
drop policy if exists "Service role full access on profiles" on profiles;
drop policy if exists "Users can update own profile" on profiles;

-- Service role (webhook, server routes) keeps full access — scoped to the role.
create policy "service_role_all_profiles"
  on profiles
  for all
  to service_role
  using (true)
  with check (true);

-- Users may update their own profile, but NOT their role or tier
-- (those are entitlements, granted only by the service role / Stripe webhook).
create policy "auth_users_update_own_profile"
  on profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from profiles where id = auth.uid())
    and tier = (select tier from profiles where id = auth.uid())
  );
-- (The existing "Users can view own profile" SELECT policy from 003 is correct
--  and remains in place.)


-- ── subscriptions ────────────────────────────────────────────────────────────
drop policy if exists "Service role full access on subscriptions" on subscriptions;

create policy "service_role_all_subscriptions"
  on subscriptions
  for all
  to service_role
  using (true)
  with check (true);
-- (The existing "Users can view own subscription" SELECT policy remains.)


-- ── usage_tracking ───────────────────────────────────────────────────────────
drop policy if exists "Service role full access on usage_tracking" on usage_tracking;

create policy "service_role_all_usage"
  on usage_tracking
  for all
  to service_role
  using (true)
  with check (true);
-- (The existing "Users can view own usage" SELECT policy remains.)


-- ============================================================
-- VERIFICATION (run after apply): expects zero rows
--   select tablename, policyname, roles, cmd
--   from pg_policies
--   where schemaname = 'public'
--     and tablename in ('profiles','subscriptions','usage_tracking')
--     and qual = 'true'
--     and (roles = '{}' or 'anon' = any(roles) or 'public' = any(roles));
-- ============================================================
