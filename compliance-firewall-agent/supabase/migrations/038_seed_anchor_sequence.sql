-- ============================================
-- Migration 038: seed_anchors monotonic sequence
-- ============================================
--
-- WHY
-- ---
-- Both sides of the audit hash chain order by `created_at`, and `created_at` is
-- not a total order. Two anchors written in the same clock tick — ordinary
-- under concurrency, and `now()` in Postgres is the TRANSACTION timestamp, so
-- two transactions that begin together share it exactly — sort arbitrarily
-- relative to each other.
--
-- That costs two different things:
--
--   1. WRITE SIDE (a nuisance). `createSeedAnchor` reads the newest anchor to
--      chain from. Reading a non-tip means the insert violates the migration
--      029 unique index, returns 23505, and burns one of ten retries. Correct
--      but wasteful, and it narrows the supported burst width.
--
--   2. VERIFY SIDE (the serious one). `verifySeedChain` pass 1 walks the rows
--      in `created_at DESC` order and asserts each row's `previous_hash`
--      equals the next row's `content_hash`. If two anchors tie on
--      `created_at` and sort against the true chain order, that assertion
--      fails on a chain that is perfectly intact — and the function reports
--      CHAIN_BROKEN.
--
-- A false tampering signal is the worst failure this product has. The entire
-- $499 deliverable is a tamper-evident log; a customer whose healthy chain
-- reports as tampered in front of an assessor is worse off than if we had
-- shipped nothing. Migration 029 made a real fork unrepresentable; this
-- migration removes the remaining way to *look* forked.
--
-- WHAT
-- ----
-- A `seq` column fed by a sequence: strictly monotonic, gap-tolerant, and
-- assigned by the database at insert rather than by a clock. It gives both the
-- tip read and the verifier a genuine total order.
--
-- BACKFILL ORDER — deliberately `created_at`, not the chain itself.
-- Historical rows are numbered in exactly the order `verifySeedChain` already
-- reads them today, so this migration cannot change the verdict on any
-- existing chain. It is ordering-preserving by construction: a chain that
-- verifies today verifies identically afterwards, and one that does not is not
-- silently "repaired" into passing. `id` breaks ties so the backfill is itself
-- deterministic and re-runnable.
--
-- No hash is recomputed and no existing column is modified, so every anchor
-- stays byte-identical and previously-issued reports remain reproducible.
--
-- SAFE TO RUN TWICE. Every statement is guarded.

-- 1. The column, nullable for now so the backfill can fill it.
alter table seed_anchors
  add column if not exists seq bigint;

-- 2. Number the existing rows in the order verification already uses.
--    Scoped to rows that have no seq yet, so a re-run is a no-op.
with ordered as (
  select id,
         row_number() over (order by created_at, id) as rn
    from seed_anchors
   where seq is null
)
update seed_anchors s
   set seq = o.rn
  from ordered o
 where s.id = o.id
   and s.seq is null;

-- 3. A sequence for every future insert, started past the backfill.
create sequence if not exists seed_anchors_seq_seq as bigint owned by seed_anchors.seq;

select setval(
  'seed_anchors_seq_seq',
  coalesce((select max(seq) from seed_anchors), 0) + 1,
  false
);

alter table seed_anchors
  alter column seq set default nextval('seed_anchors_seq_seq');

-- 4. Now that every row has a value, make it required.
alter table seed_anchors
  alter column seq set not null;

-- 5. Monotonicity is only a guarantee if it is enforced.
create unique index if not exists idx_seed_anchors_seq
  on seed_anchors (seq);

-- 6. The shape both hot queries actually use: newest-first within one chain.
create index if not exists idx_seed_anchors_chain_seq
  on seed_anchors (entity_type, seq desc);

comment on column seed_anchors.seq is
  'Monotonic insert order. The audit chain orders by this, never by created_at: created_at is a transaction timestamp, so concurrent anchors can tie and sort against the true chain order, which verifySeedChain would report as CHAIN_BROKEN on an intact chain.';

comment on index idx_seed_anchors_chain_seq is
  'Serves the chain-tip read in createSeedAnchor and the ordered scan in verifySeedChain.';
