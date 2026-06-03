-- AIBudgetGuard — initial schema
-- Run against your Supabase project via Dashboard > SQL editor or `supabase db push`

-- ── Orgs ─────────────────────────────────────────────────────────────────────
create table if not exists public.orgs (
  id                 uuid        primary key default gen_random_uuid(),
  owner_id           uuid        references auth.users on delete cascade,
  name               text        not null,
  slug               text        unique not null,
  plan               text        not null default 'starter'
                                 check (plan in ('starter', 'growth', 'enterprise')),
  stripe_customer_id text,
  slack_webhook_url  text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.orgs enable row level security;

create policy "Owners can manage their org"
  on public.orgs
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ── Budgets ───────────────────────────────────────────────────────────────────
-- scope_type='org'     scope_id='*'            → org-wide budget
-- scope_type='project' scope_id='<project_id>' → per-project budget
-- scope_type='user'    scope_id='<user_id>'    → per-user budget
create table if not exists public.budgets (
  id               uuid        primary key default gen_random_uuid(),
  org_id           uuid        not null references public.orgs on delete cascade,
  scope_type       text        not null default 'org'
                               check (scope_type in ('org', 'project', 'user')),
  scope_id         text        not null default '*',
  limit_usd        numeric(12,4) not null check (limit_usd > 0),
  period           text        not null default 'monthly'
                               check (period in ('daily', 'weekly', 'monthly')),
  soft_alert_pct   integer     not null default 80
                               check (soft_alert_pct between 0 and 100),
  hard_block_pct   integer     not null default 100
                               check (hard_block_pct between 0 and 100),
  created_at       timestamptz not null default now(),
  unique (org_id, scope_type, scope_id, period)
);

alter table public.budgets enable row level security;

create policy "Org owners can manage budgets"
  on public.budgets
  using (
    exists (
      select 1 from public.orgs
      where orgs.id = budgets.org_id and orgs.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.orgs
      where orgs.id = budgets.org_id and orgs.owner_id = auth.uid()
    )
  );

-- ── Usage events ──────────────────────────────────────────────────────────────
create table if not exists public.usage_events (
  id            uuid          primary key default gen_random_uuid(),
  org_id        uuid          not null references public.orgs on delete cascade,
  user_id       text          not null default 'anonymous',
  project_id    text          not null default 'default',
  model_id      text          not null,
  provider      text          not null,
  input_tokens  integer       not null default 0,
  output_tokens integer       not null default 0,
  cost_usd      numeric(12,8) not null default 0,
  blocked       boolean       not null default false,
  recorded_at   timestamptz   not null default now()
);

alter table public.usage_events enable row level security;

create policy "Org owners can view usage"
  on public.usage_events
  using (
    exists (
      select 1 from public.orgs
      where orgs.id = usage_events.org_id and orgs.owner_id = auth.uid()
    )
  );

-- Proxy uses service role (bypasses RLS) so no INSERT policy needed for anon

-- Indexes
create index if not exists ue_org_month_idx
  on public.usage_events (org_id, date_trunc('month', recorded_at));

create index if not exists ue_org_project_idx
  on public.usage_events (org_id, project_id, date_trunc('month', recorded_at));

create index if not exists ue_org_user_idx
  on public.usage_events (org_id, user_id, date_trunc('month', recorded_at));

create index if not exists ue_org_day_idx
  on public.usage_events (org_id, date_trunc('day', recorded_at));

-- ── Aggregation view (dashboard queries) ─────────────────────────────────────
create or replace view public.daily_spend as
  select
    org_id,
    project_id,
    user_id,
    provider,
    date_trunc('day', recorded_at)::date as day,
    sum(cost_usd)      as cost_usd,
    sum(input_tokens)  as input_tokens,
    sum(output_tokens) as output_tokens,
    count(*)           as request_count
  from public.usage_events
  group by 1, 2, 3, 4, 5;

-- ── RPC: efficient budget sum ─────────────────────────────────────────────────
create or replace function public.sum_usage_since(
  p_org_id  uuid,
  p_since   timestamptz
) returns numeric
  language sql
  stable
  security definer
as $$
  select coalesce(sum(cost_usd), 0)
  from public.usage_events
  where org_id = p_org_id
    and recorded_at >= p_since;
$$;

-- ── updated_at auto-maintain ──────────────────────────────────────────────────
create or replace function public.set_updated_at()
  returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orgs_updated_at
  before update on public.orgs
  for each row execute function public.set_updated_at();
