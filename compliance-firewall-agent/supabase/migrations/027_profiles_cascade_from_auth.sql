-- 027: profiles must die with their auth.users row.
--
-- Incident (2026-07-20): deleting an auth user via the admin API left its
-- public.profiles row behind — profiles.id had NO foreign key to auth.users.
-- The orphaned row then blocked every re-signup for that email with
-- `duplicate key value violates unique constraint "profiles_email_unique"`
-- (signup 500s, account permanently locked out).
--
-- Fix: remove existing orphans, then add the missing FK with ON DELETE CASCADE
-- so an auth-user deletion always removes the profile (and, via the existing
-- profile FKs, its cascading children). report_orders keeps SET NULL, so
-- revenue records survive account deletion.

-- 1) Clean up orphans (rows whose auth user no longer exists).
delete from public.profiles p
where not exists (select 1 from auth.users u where u.id = p.id);

-- 2) Guarantee it can never happen again.
alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users (id) on delete cascade;
