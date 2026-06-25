-- 015_secure_rls_org_metadata.sql
-- SECURITY FIX (Supabase linter 0015 — rls_references_user_metadata).
--
-- The org-scoped RLS policies on org_patterns, zero_trust_rules, and sso_configs
-- gated access on `auth.jwt() -> 'user_metadata' ->> 'org_id'`. `user_metadata`
-- is END-USER EDITABLE (supabase.auth.updateUser({ data: { org_id } })), so a
-- user could set their own org_id to a victim org and read/write that org's
-- patterns, zero-trust rules, and SSO config — a cross-tenant escalation.
--
-- Fix: read `app_metadata` instead, which is server-controlled (settable only
-- via the service-role admin API, never by the end user). The app currently
-- populates NEITHER metadata field for org_id, so legitimate dashboard access
-- already flows through the `org_id = auth.uid()::text` (personal-org) clause —
-- this change is behavior-preserving for real users and closes the hole. It is
-- also forward-compatible: assigning org via app_metadata (the correct, secure
-- path) will work without further policy edits.
--
-- Additive only. No edits to migrations 008/009.

-- ── org_patterns ───────────────────────────────────────────────────────────
drop policy if exists "org_patterns_select" on org_patterns;
create policy "org_patterns_select" on org_patterns for select
  using (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id') or org_id = auth.uid()::text);

drop policy if exists "org_patterns_insert" on org_patterns;
create policy "org_patterns_insert" on org_patterns for insert
  with check (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id') or org_id = auth.uid()::text);

drop policy if exists "org_patterns_update" on org_patterns;
create policy "org_patterns_update" on org_patterns for update
  using (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id') or org_id = auth.uid()::text);

drop policy if exists "org_patterns_delete" on org_patterns;
create policy "org_patterns_delete" on org_patterns for delete
  using (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id') or org_id = auth.uid()::text);

-- ── zero_trust_rules ───────────────────────────────────────────────────────
drop policy if exists "zero_trust_rules_select" on zero_trust_rules;
create policy "zero_trust_rules_select" on zero_trust_rules for select
  using (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id') or org_id = auth.uid()::text);

drop policy if exists "zero_trust_rules_insert" on zero_trust_rules;
create policy "zero_trust_rules_insert" on zero_trust_rules for insert
  with check (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id') or org_id = auth.uid()::text);

drop policy if exists "zero_trust_rules_update" on zero_trust_rules;
create policy "zero_trust_rules_update" on zero_trust_rules for update
  using (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id') or org_id = auth.uid()::text);

drop policy if exists "zero_trust_rules_delete" on zero_trust_rules;
create policy "zero_trust_rules_delete" on zero_trust_rules for delete
  using (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id') or org_id = auth.uid()::text);

-- ── sso_configs ────────────────────────────────────────────────────────────
drop policy if exists "sso_configs_select" on sso_configs;
create policy "sso_configs_select" on sso_configs for select
  using (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id') or org_id = auth.uid()::text);

drop policy if exists "sso_configs_insert" on sso_configs;
create policy "sso_configs_insert" on sso_configs for insert
  with check (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id') or org_id = auth.uid()::text);

drop policy if exists "sso_configs_update" on sso_configs;
create policy "sso_configs_update" on sso_configs for update
  using (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id') or org_id = auth.uid()::text);

-- Note: sso_configs_service_role_select (service-role read for SSO discovery)
-- is unchanged — it does not reference user_metadata.
