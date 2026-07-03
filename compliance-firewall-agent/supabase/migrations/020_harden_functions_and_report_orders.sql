-- ============================================================
-- Migration 020: Clear residual security-advisor findings
-- Date: 2026-07-03
-- 1) report_orders had RLS enabled but no policies (service-role-only by
--    accident). Make intent explicit: service role manages; a signed-in
--    customer can read their own orders (now that 017 added user_id).
-- 2) Revoke EXECUTE on SECURITY DEFINER trigger/helper functions from anon and
--    authenticated so they can't be invoked via the PostgREST /rpc endpoint.
--    (Verified: no app code calls these via rpc; triggers still fire regardless
--    of EXECUTE grants because they run as the table owner.)
-- Additive only.
-- ============================================================

-- ── report_orders policies ───────────────────────────────────────────────────
create policy "service_role_all_report_orders"
  on report_orders
  for all
  to service_role
  using (true)
  with check (true);

create policy "auth_users_read_own_report_orders"
  on report_orders
  for select
  to authenticated
  using (user_id = auth.uid());

-- ── Lock down SECURITY DEFINER functions from the public API ──────────────────
revoke execute on function public.handle_new_user()             from anon, authenticated;
revoke execute on function public.increment_usage(text, integer) from anon, authenticated;
revoke execute on function public.shieldready_set_updated_at()  from anon, authenticated;

-- rls_auto_enable() may not exist in every environment; guard it.
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    execute 'revoke execute on function public.rls_auto_enable() from anon, authenticated';
  end if;
end $$;
