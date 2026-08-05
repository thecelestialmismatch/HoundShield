-- ============================================
-- Migration 029: seed_anchors chain integrity
-- ============================================
--
-- `createSeedAnchor` builds the audit hash chain by reading the newest anchor
-- and then inserting one that points at it. Those are two statements, so two
-- concurrent writers could read the same tip and insert two anchors claiming
-- the same parent — a forked chain, which `verifySeedChain` reports as
-- CHAIN_BROKEN. On a product whose deliverable is a tamper-evident SHA-256
-- audit log, that is a false tampering signal from ordinary concurrency.
--
-- These indexes make the fork unrepresentable. The writer that loses the race
-- gets a 23505 and re-links against the new tip. The guarantee lives in the
-- database, so a writer that bypasses the application still cannot fork the
-- chain.
--
-- No historical row is modified and no hash is recomputed: existing anchors
-- stay byte-identical and verifiable.
--
-- PRE-FLIGHT — this migration fails loudly if the table already contains a
-- fork. Run these first; both must return zero rows:
--
--   select entity_type, previous_hash, count(*)
--     from seed_anchors
--    where previous_hash is not null
--    group by 1, 2 having count(*) > 1;
--
--   select entity_type, count(*)
--     from seed_anchors
--    where previous_hash is null
--    group by 1 having count(*) > 1;
--
-- If either returns rows, the chain is already forked and needs a decision
-- (repair vs. archive) before this constraint can be applied.

-- At most one anchor may claim any given parent, per chain.
create unique index if not exists idx_seed_anchors_chain_link
  on seed_anchors (entity_type, previous_hash)
  where previous_hash is not null;

-- At most one genesis anchor per chain. Needed as a separate partial index
-- because Postgres treats NULLs as distinct in a plain unique index, which
-- would let two concurrent writers both start a chain.
create unique index if not exists idx_seed_anchors_genesis
  on seed_anchors (entity_type)
  where previous_hash is null;

comment on index idx_seed_anchors_chain_link is
  'Audit hash chain must stay linear: one anchor per parent. Violations surface as 23505 and are retried by createSeedAnchor.';

comment on index idx_seed_anchors_genesis is
  'Exactly one genesis anchor per entity_type. Prevents a concurrent (or failed-read) second chain root.';
