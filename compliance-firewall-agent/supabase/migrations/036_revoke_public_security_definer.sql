-- Migration 036: Least-privilege RPC execution for security-definer functions
--
-- Supabase's database advisor confirmed that these functions are currently
-- executable through PostgREST by anon and authenticated roles. They are only
-- invoked by server-side code using the service-role client (or a trusted
-- maintenance job), so public execution is unnecessary attack surface.
--
-- This migration is deliberately additive and idempotent. It does not change the
-- function bodies, RLS posture, or rate-limit/audit semantics; it only narrows
-- who may invoke privileged functions.

-- Authentication audit trigger helper: called by a database trigger only, never
-- by a browser or API caller. EXECUTE is revoked from every external role.
revoke all on function public.auth_audit_events_immutable() from public, anon, authenticated;

-- Shared rate-limit RPCs: application server code calls these through the
-- service-role key. Explicit service_role grants keep shared enforcement working
-- while preventing an attacker from spending or sweeping buckets via PostgREST.
revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.sweep_rate_limit_buckets() from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
grant execute on function public.sweep_rate_limit_buckets() to service_role;

-- RLS-without-policy advisories for auth_audit_events, auth_lockouts,
-- rate_limit_buckets and Better Auth tables are intentional: RLS is enabled and
-- no client policy exists, so anon/authenticated PostgREST access is denied.
-- Server-side service-role code bypasses RLS for protected maintenance paths.
