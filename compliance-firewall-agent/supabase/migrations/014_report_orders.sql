-- 014_report_orders.sql
-- Stage 1 primary product: the $499 one-time "CMMC AI Risk Assessment Report".
-- A $499 PO bypasses procurement review; the subscription does not. This table
-- records each one-time report purchase so fulfillment (14-day proxy run → SHA-256
-- signed PDF) can be tracked independently of the recurring `subscriptions` table.
--
-- Additive only. No edits to prior migrations. Service-role writes only.

create table if not exists report_orders (
  id                       uuid primary key default gen_random_uuid(),
  email                    text not null,
  full_name                text,
  company                  text,
  vertical                 text,                       -- 'defense' | 'healthcare' | 'legal' | null
  -- Stripe linkage
  stripe_session_id        text unique,
  stripe_payment_intent_id text,
  stripe_customer_id       text,
  amount_cents             integer not null default 49900,
  currency                 text not null default 'usd',
  -- Co-brand / channel attribution (RPO/MSP wholesale = $299)
  partner_ref              text,                        -- RPO/MSP referral code, if any
  is_wholesale             boolean not null default false,
  -- Fulfillment lifecycle: paid → proxy_deployed → report_delivered
  status                   text not null default 'paid',
  fulfillment_note         text,
  report_delivered_at      timestamptz,
  created_at               timestamptz not null default now()
);

create index if not exists idx_report_orders_email      on report_orders (email);
create index if not exists idx_report_orders_status     on report_orders (status);
create index if not exists idx_report_orders_partner    on report_orders (partner_ref) where partner_ref is not null;
create index if not exists idx_report_orders_created_at on report_orders (created_at desc);

-- RLS: this table is written only by the Stripe webhook (service role, which
-- bypasses RLS). No anon/authenticated access — report orders are operational
-- records, not user-facing rows. Enabling RLS with no policy denies all
-- non-service access by default.
alter table report_orders enable row level security;

comment on table report_orders is
  'Stage 1 $499 one-time CMMC AI Risk Assessment Report purchases. Service-role (Stripe webhook) writes only.';
