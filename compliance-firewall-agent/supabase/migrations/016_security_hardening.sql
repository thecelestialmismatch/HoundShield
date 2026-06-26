-- 016_security_hardening.sql
-- Clears the remaining Supabase security-advisor findings on existing objects.
-- Additive only; no edits to prior migrations.
--
-- 1) security_definer_view (linter 0010) — partner_client_summary was a
--    SECURITY DEFINER view that BYPASSES the caller's RLS and exposes
--    `docker_api_key` (a secret). Any authenticated user who could query it
--    would see every partner's API keys. Switching to security_invoker makes
--    the view enforce the querying user's RLS: a partner sees only their own
--    client rows (partner_organizations.partner_user_id = auth.uid()), and the
--    service role still sees everything. The view is not queried by app code,
--    so this is zero-risk to the product.
--
-- 2) function_search_path_mutable (linter 0011) — the updated_at trigger
--    functions had a mutable search_path (a privilege-escalation vector if a
--    schema is shadowed). They only call now(); pinning search_path to empty is
--    safe and removes the finding.

-- ── 1) Make the partner summary view enforce caller RLS ────────────────────
alter view public.partner_client_summary set (security_invoker = on);

-- ── 2) Pin trigger-function search_path ────────────────────────────────────
alter function public.update_partner_application_timestamp() set search_path = '';
alter function public.update_org_patterns_updated_at()       set search_path = '';
alter function public.update_sso_configs_updated_at()        set search_path = '';
alter function public.update_updated_at_column()             set search_path = '';
