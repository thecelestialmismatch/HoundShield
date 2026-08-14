-- ============================================================
-- Migration 033: Explicit deny on the Better Auth tables
--   NIST 800-171 3.1.1 / 3.1.2 · CMMC AC.L1-3.1.1, AC.L1-3.1.2
-- Date: 2026-08-14
--
-- Audit finding #16b (docs/SECURITY-PHASE-2-AUDIT.md).
--
-- WHAT IS ALREADY TRUE. Migration 024 enabled RLS on all four tables and
-- revoked the implicit PostgREST grants from `anon` and `authenticated`. Both
-- are correct and neither is being replaced here. `account` holds password
-- hashes and OAuth tokens, so the sensitivity was clearly understood at the
-- time.
--
-- WHAT IS MISSING, and it is not tidiness. "RLS on, no policies" denies
-- everything only for as long as NO policy exists. The moment any future
-- migration adds one permissive policy — for a support view, an admin screen,
-- a reporting job — the table opens to whatever that policy allows, and the
-- deny that everyone was relying on evaporates without anyone editing it. The
-- protection is currently a property of the ABSENCE of code, which is the
-- hardest kind of protection to notice you have removed.
--
-- WHY `restrictive`. Permissive policies are OR-ed together; restrictive
-- policies are AND-ed with the result. A restrictive `using (false)` therefore
-- cannot be overridden by adding a permissive policy later — a future author
-- who genuinely needs API access to these tables has to delete this policy by
-- name, which is a deliberate act that shows up in review, rather than an
-- accident that shows up in an incident.
--
-- WHO IS UNAFFECTED. RLS is bypassed by the table owner and by `service_role`
-- (BYPASSRLS). Better Auth connects with the owner role over its own pg Pool,
-- so its reads and writes are untouched — the same reasoning migration 024
-- recorded when it deliberately did NOT use FORCE ROW LEVEL SECURITY. Adding
-- FORCE here would lock Better Auth out of its own tables; it is omitted on
-- purpose.
--
-- Idempotent: safe to re-run, and safe to apply after 029/030 land.
-- ============================================================

do $$
declare
  t text;
begin
  foreach t in array array['user', 'session', 'account', 'verification']
  loop
    -- Only act on tables that exist. 024/025 create them, but the Better Auth
    -- stack is optional (AUTH_PROVIDER), so a deployment may not have them.
    if to_regclass(format('public.%I', t)) is null then
      continue;
    end if;

    -- RLS must be on for a policy to mean anything. 024 already did this; the
    -- statement is repeated so this migration is correct standing alone.
    execute format('alter table public.%I enable row level security', t);

    -- Re-assert 024's revoke. Cheap, idempotent, and closes the window where a
    -- later `grant` re-exposed the table through PostgREST.
    execute format('revoke all on public.%I from anon, authenticated', t);

    execute format('drop policy if exists %I on public.%I', t || '_deny_api_roles', t);
    execute format(
      'create policy %I on public.%I as restrictive to anon, authenticated using (false) with check (false)',
      t || '_deny_api_roles',
      t
    );
  end loop;
end
$$;
