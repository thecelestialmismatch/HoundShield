-- ============================================================
-- Migration 021: Revoke SECURITY DEFINER function EXECUTE from PUBLIC
-- Date: 2026-07-03
-- Postgres grants EXECUTE to PUBLIC by default, so revoking only from anon /
-- authenticated left the functions callable. Revoke from PUBLIC (covers anon +
-- authenticated) and re-grant to service_role for any server-side use. Trigger
-- functions still fire because triggers execute as the table owner regardless
-- of EXECUTE grants.
-- Additive only.
-- ============================================================

revoke execute on function public.handle_new_user()              from public;
revoke execute on function public.increment_usage(text, integer) from public;
revoke execute on function public.shieldready_set_updated_at()   from public;

grant execute on function public.increment_usage(text, integer) to service_role;

do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    execute 'revoke execute on function public.rls_auto_enable() from public';
  end if;
end $$;
