# Demo telemetry seed

The Command Center dashboard reads one table: `compliance_events`. In production
that table is empty, so every panel correctly renders its "connect your proxy"
empty state — right for a customer who has not deployed yet, and useless for
showing or testing the product.

This is the fixture that fills it, for **one account only**.

```bash
# .env.local
DEMO_ACCOUNT_EMAIL=you@yourdomain.com

npm run seed:demo             # insert (idempotent — replaces any previous seed)
npm run seed:demo -- --dry    # generate + summarise, write nothing
npm run seed:demo -- --clear  # remove the seed, back to the empty state
```

## Why it writes rows instead of faking the API

The dashboard, the events table (`/command-center/events`), the audit export and
the $499 report all read the same table through the same queries with the same
tenant filter. Seeding rows means every one of those works, including every
drill-down link on the overview — click a heatmap cell and the events table
really does show that hour.

Synthesising a response at `/api/dashboard/overview` instead would have been less
code and would have left every drill-through landing on an empty page, plus a
second render path that can drift from the real one. The whole value of this
fixture is that **nothing in the render path knows the data is synthetic.**

## How it stays honest

The dashboard is sold as audit evidence. Presenting numbers we generated as
numbers we measured is on the NEVER-DO list in `CLAUDE.md`. Three things keep
this fixture on the right side of that line:

1. **Every row is marked.** `metadata.synthetic = true` and
   `metadata.demo_seed = "houndshield-demo-v1"`.
2. **The dashboard says so.** `aggregateOverview` sets `synthetic: true` if *any*
   row in the window is marked, and the overview renders a **“Demo data”** tag
   beside the title. Locked by
   `components/dashboard/__tests__/OperatorOverview.test.tsx`.
3. **It is reversible.** One `DELETE` on `(user_id, metadata->>demo_seed)` removes
   the seed and nothing else.

Do not strip the marker to make a screenshot look cleaner. That is the moment
this stops being a fixture and becomes the thing the NEVER-DO list is about.

## Safety rails

| Rail | Enforced by |
|---|---|
| One account, from the environment | `demoAccountEmail()` — no default, no CLI flag, no positional arg. Unset ⇒ the script stops. |
| Never touches unmarked rows | Both insert and clear filter on `user_id` **and** the seed tag. |
| Refuses to overwrite real traffic | The script counts unmarked rows on the account and aborts if it finds any. |
| Address never committed | This repo is public. Same rule as `FOUNDER_EMAIL` in `lib/email/identity.ts`. |

## The data

`lib/dashboard/demo-telemetry-seed.ts` is pure and deterministic — same seed,
byte-identical rows, which is what makes re-running idempotent rather than
doubling. It models a ~60-person AI company running a gateway pilot:

- **~4,100 events over 30 days**, deliberately under the 5,000-row aggregation
  cap in `app/api/dashboard/overview/route.ts`. A dataset that trips that cap
  makes the product look like it silently drops evidence.
- **Weekday-heavy**, quiet at weekends, volume ramping as seats onboard.
- **A working-hours peak** across 12:00–23:00 UTC, so the heatmap and
  hour-of-day profile show a habit rather than a flat line.
- **~3% blocked, ~4% quarantined.** A 40% block rate is a broken integration,
  not an impressive one.
- **p50 3ms, p99 9ms** — consistent with the product's "<10ms" claim, and never
  `0`, which renders as "0ms" and reads as a broken counter.
- **Only categories the shipped engines emit** (`PII`, `HIPAA_PHI`, `IP`,
  `FINANCIAL`, `STRATEGIC`). Inventing a label would put a detection on the
  dashboard that no rule in `lib/classifier` can produce.
- **A real SHA-256 chain** in time order, so the integrity section of the $499
  report verifies against this data the way it would against real traffic.

All of the above is asserted in `lib/dashboard/__tests__/demo-telemetry-seed.test.ts`
(30 tests), not just described here.

## If you ever seed straight from SQL

The production fill on 2026-08-07 was done through the Supabase SQL editor
because the sandbox could not reach the database. One trap cost a full re-seed
and is worth writing down:

```sql
-- WRONG: evaluated ONCE for the entire statement.
select (select h from hours where cum >= random() * tot order by cum limit 1)
from events;
```

That sublink references no outer column, so PostgreSQL hoists it into an
**InitPlan** and evaluates it a single time — putting all 4,000+ events into one
hour of one day. The volatility of `random()` does not save you; the whole
subquery is what gets hoisted.

```sql
-- RIGHT: a constant array, indexed by a per-row random().
with pool as (select array_agg(h) as p from (select h from hours, generate_series(1, w)) t)
select (select p from pool)[1 + floor(random() * 555)::int] from events;
```

Here the InitPlan is the *array* (correctly constant) and the index varies per
row. Always verify a seed by its distribution afterwards —
`count(distinct extract(hour from created_at))` would have caught this in one
query, and `select count(*)` would not have caught it at all.
