-- ============================================================
-- Migration 017: One human = one account (email dedupe) + report→account linkage
-- Date: 2026-07-03
-- Priority: HIGH — prevents duplicate accounts (Google OAuth vs email/password
-- for the same address) and reconciles $499 report purchases to accounts.
-- Additive only; no edits to prior migrations.
-- ============================================================


-- ============================================================
-- PART A: Merge existing duplicate profiles (same email, different id)
--
-- Survivor = the OLDEST profile row for a given lower(email).
-- Repoint child rows (subscriptions, usage_tracking) to the survivor BEFORE
-- deleting the duplicate profile rows, so no billing/usage data is lost.
-- auth.users rows are left intact (only the app-level profile is merged);
-- verified-email identity auto-linking in the Supabase dashboard is the
-- long-term fix for the auth layer.
-- ============================================================

do $$
declare
  dup record;
begin
  -- For each email with more than one profile, keep the oldest as survivor.
  for dup in
    select lower(email) as norm_email,
           (array_agg(id order by created_at asc))[1] as survivor_id,
           array_agg(id order by created_at asc) as all_ids
    from profiles
    where email is not null and email <> ''
    group by lower(email)
    having count(*) > 1
  loop
    -- Repoint subscriptions from every duplicate to the survivor.
    update subscriptions s
      set user_id = dup.survivor_id
      where s.user_id = any(dup.all_ids)
        and s.user_id <> dup.survivor_id
        -- avoid colliding with the partial-unique active-subscription index:
        and not exists (
          select 1 from subscriptions s2
          where s2.user_id = dup.survivor_id
            and s2.status in ('active', 'trialing', 'past_due')
            and s.status in ('active', 'trialing', 'past_due')
        );

    -- Repoint usage_tracking, avoiding (user_id, period_start) collisions.
    update usage_tracking u
      set user_id = dup.survivor_id
      where u.user_id = any(dup.all_ids)
        and u.user_id <> dup.survivor_id
        and not exists (
          select 1 from usage_tracking u2
          where u2.user_id = dup.survivor_id
            and u2.period_start = u.period_start
        );

    -- Delete the now-orphaned duplicate profile rows (keep the survivor).
    delete from profiles
      where id = any(dup.all_ids)
        and id <> dup.survivor_id;
  end loop;
end $$;


-- ============================================================
-- PART B: Make duplicate emails structurally impossible
-- Case-insensitive unique index on profiles.email.
-- (Non-null only; the trigger always writes an email, but be defensive.)
-- ============================================================

create unique index if not exists profiles_email_unique
  on profiles (lower(email))
  where email is not null and email <> '';


-- ============================================================
-- PART C: Make the signup trigger defensive
-- If a profile with this id already exists (retry / race), do nothing rather
-- than error. The unique email index above still blocks a genuinely new
-- duplicate-email identity from creating a second profile.
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;


-- ============================================================
-- PART D: Link $499 report orders to accounts
-- report_orders was email-keyed and disjoint from auth.users. Add a nullable
-- user_id so a purchase reconciles to an account when one exists (now or later),
-- and backfill from any matching profile by email.
-- ============================================================

alter table report_orders
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_report_orders_user on report_orders(user_id);

update report_orders ro
  set user_id = p.id
  from profiles p
  where ro.user_id is null
    and ro.email is not null
    and lower(p.email) = lower(ro.email);
