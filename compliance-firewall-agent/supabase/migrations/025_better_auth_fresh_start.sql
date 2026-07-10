-- 025_better_auth_fresh_start.sql
-- Fresh-start re-key for the Supabase Auth → Better Auth migration (the
-- founder-confirmed path; see docs/BETTER-AUTH-MIGRATION.md).
--
-- WHAT THIS DOES
--   A) `profiles` becomes the provider-agnostic identity root: drop its FK to
--      auth.users. Legacy rows keep their uuid ids (== auth.users ids), new
--      Better Auth signups get fresh uuids linked via better_auth_user_id.
--   B) Every public-schema FK that pointed at auth.users now points at
--      profiles(id) with the SAME on-delete behavior. Semantics-preserving:
--      profiles.id == auth.users.id for every existing row (verified: 3 users,
--      3 profiles, 0 orphans at apply time), and the app already treats the
--      profile as the user's public identity.
--   C) Better Auth signups auto-provision a profile via trigger on "user" —
--      the Better Auth twin of handle_new_user (migration 003/017). If an
--      unlinked legacy profile shares the email, it is LINKED rather than
--      duplicated, so a returning customer keeps their tier/orders/history.
--
-- Additive/behavior-neutral until AUTH_PROVIDER=better-auth is set: the
-- trigger only fires on "user" inserts (none happen while Better Auth is
-- dormant) and the FK re-point changes no data.

-- ── A) profiles: standalone identity root ───────────────────────────────────
alter table profiles drop constraint if exists profiles_id_fkey;

-- ── B) re-point public FKs auth.users → profiles(id), same on-delete ────────
alter table ai_traces drop constraint if exists ai_traces_user_id_fkey;
alter table ai_traces add constraint ai_traces_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

alter table api_keys drop constraint if exists api_keys_user_id_fkey;
alter table api_keys add constraint api_keys_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

alter table assessment_responses drop constraint if exists assessment_responses_answered_by_fkey;
alter table assessment_responses add constraint assessment_responses_answered_by_fkey
  foreign key (answered_by) references profiles(id);

alter table assessments drop constraint if exists assessments_created_by_fkey;
alter table assessments add constraint assessments_created_by_fkey
  foreign key (created_by) references profiles(id);

alter table customer_status_snapshots drop constraint if exists customer_status_snapshots_user_id_fkey;
alter table customer_status_snapshots add constraint customer_status_snapshots_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

alter table evidence_files drop constraint if exists evidence_files_uploaded_by_fkey;
alter table evidence_files add constraint evidence_files_uploaded_by_fkey
  foreign key (uploaded_by) references profiles(id);

alter table generated_documents drop constraint if exists generated_documents_generated_by_fkey;
alter table generated_documents add constraint generated_documents_generated_by_fkey
  foreign key (generated_by) references profiles(id);

alter table org_members drop constraint if exists org_members_user_id_fkey;
alter table org_members add constraint org_members_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

alter table partner_organizations drop constraint if exists partner_organizations_partner_user_id_fkey;
alter table partner_organizations add constraint partner_organizations_partner_user_id_fkey
  foreign key (partner_user_id) references profiles(id) on delete cascade;

alter table report_orders drop constraint if exists report_orders_user_id_fkey;
alter table report_orders add constraint report_orders_user_id_fkey
  foreign key (user_id) references profiles(id) on delete set null;

alter table subscriptions drop constraint if exists subscriptions_user_id_fkey;
alter table subscriptions add constraint subscriptions_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

alter table usage_tracking drop constraint if exists usage_tracking_user_id_fkey;
alter table usage_tracking add constraint usage_tracking_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

-- ── C) auto-provision profiles for Better Auth signups ──────────────────────
-- Better Auth twin of handle_new_user. Link-by-email first so a returning
-- customer (legacy Supabase account, same email) keeps their profile, tier,
-- and order history; otherwise create a fresh profile. A unique_violation
-- (duplicate-email race) must never abort the signup transaction — the app
-- tolerates a missing profile by falling back to least privilege.
create or replace function handle_new_better_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles
     set better_auth_user_id = new."id",
         updated_at = now()
   where better_auth_user_id is null
     and email is not null
     and lower(email) = lower(new."email");

  if not found then
    insert into profiles (id, better_auth_user_id, full_name, email, avatar_url)
    values (
      gen_random_uuid(),
      new."id",
      coalesce(new."name", ''),
      new."email",
      coalesce(new."image", '')
    );
  end if;
  return new;
exception when unique_violation then
  return new;
end;
$$;

drop trigger if exists on_better_auth_user_created on "user";
create trigger on_better_auth_user_created
  after insert on "user"
  for each row execute function handle_new_better_auth_user();

-- Hardening — same posture as migrations 020/021 for handle_new_user.
revoke execute on function public.handle_new_better_auth_user() from public;
revoke execute on function public.handle_new_better_auth_user() from anon, authenticated;

comment on function public.handle_new_better_auth_user() is
  'Auto-provisions (or email-links) a profiles row when Better Auth creates a user. Security definer; execute revoked from API roles; never aborts a signup on unique_violation.';
