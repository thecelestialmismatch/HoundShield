-- ============================================
-- Migration 030: seed_anchors.content
-- ============================================
--
-- `verifySeedChain` documented a second pass — "Content integrity — re-computes
-- SHA-256(content + previous_hash) and compares to the stored content_hash to
-- detect tampering of log content" — that had never once executed.
--
-- The loop body was guarded by `if (seed.content && seed.content_hash)`, and
-- there was no `content` column: `seed_anchors` has carried only
-- (id, created_at, entity_type, entity_id, content_hash, previous_hash,
-- merkle_root, verification_status) since migration 001, and
-- `createSeedAnchor` never wrote one. `seed.content` was therefore always
-- undefined and every row skipped the check silently.
--
-- What was actually verified was Pass 1 alone — chain linkage. That detects a
-- deleted or reordered anchor. It cannot detect an edited `compliance_events`
-- row, because nothing was ever re-hashed against anything. On a product sold
-- on a tamper-evident SHA-256 audit log, the docstring claimed a detection the
-- code did not perform.
--
-- This column stores the exact object that was hashed, so the recomputation is
-- possible at all. It is what makes the source-row cross-check in Pass 3
-- meaningful: without a stored record of what was anchored, there is nothing to
-- compare the live row against.
--
-- THE HASH INPUT IS UNCHANGED. `content_hash` is still
-- SHA-256(JSON.stringify(content, Object.keys(content).sort()) + "|" +
-- previous_hash). This column is written alongside that expression, never into
-- it, so every anchor written before this migration stays byte-identical and
-- verifiable, and chains spanning the migration still link.
--
-- DATA AT REST — why this is safe under the local-only boundary:
--
-- Every field this column will hold is ALREADY stored, in this same database,
-- in the row being anchored. For entity_type='EVENT' the anchored object is
-- {prompt_hash, risk_level, action_taken, classifications, timestamp} — all
-- four data fields are columns of `compliance_events`. `prompt_hash` is the
-- SHA-256 of the prompt; no prompt text is present, here or there.
--
-- Notably the anchored object does NOT include `detected_entities`, the one
-- `compliance_events` column that carries matched substrings
-- (`value_redacted`, `pattern_matched`). So this column is strictly LESS
-- sensitive than the row it anchors: it is a duplicate of existing at-rest
-- data, not a new exposure class, and it adds no new data category to a
-- Mode B deployment's boundary.
--
-- Nullable on purpose. Anchors written before this migration have no content
-- and can never acquire one — backfilling would mean inventing the object that
-- was hashed, which is fabricated evidence. `verifySeedChain` counts those rows
-- as `unverifiable` and reports the number rather than passing them silently,
-- because a skipped check that reads as a passed check is the exact defect this
-- migration exists to close.

alter table seed_anchors
  add column if not exists content jsonb;

comment on column seed_anchors.content is
  'The exact object hashed into content_hash, stored so verifySeedChain can re-derive the hash and cross-check the live source row. Never an input to the hash. NULL for anchors written before migration 030 — those are reported as unverifiable, never as verified.';
