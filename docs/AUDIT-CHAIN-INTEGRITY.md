# What the Audit Hash Chain Actually Proves

**Status:** pass 2 fixed and pass 3 added 2026-08-05 (migration 030). Guarded by
`compliance-firewall-agent/lib/audit/__tests__/seed-anchor.test.ts`.

The $499 CMMC AI Risk Assessment Report is sold on a tamper-evident SHA-256
audit log. This is the honest statement of what that chain detects, what it does
not, and what changed — written down because the previous version of it lived
only in a docstring that overclaimed.

## The defect

`verifySeedChain` documented two passes. The second one had **never executed**:

> 2. Content integrity — re-computes SHA-256(content + previous_hash) and
>    compares to the stored content_hash to detect tampering of log content.

The loop body was guarded by `if (seed.content && seed.content_hash)`, and there
was no `content` column — `seed_anchors` carried only `(id, created_at,
entity_type, entity_id, content_hash, previous_hash, merkle_root,
verification_status)` from migration 001 through 029, and `createSeedAnchor`
never wrote one. `seed.content` was always `undefined`, so every row skipped the
check in silence and the function still returned `{ valid: true }`.

What was actually verified was pass 1 alone: chain linkage. That detects a
deleted or reordered **anchor**. It is completely blind to an edited
`compliance_events` row — the actual attack. Nothing was ever re-hashed against
anything.

## Why storing the content was not enough on its own

Two options were on the table. Neither works alone:

**(a) Store the hashed content and recompute.** Necessary, but self-referential:
it proves the anchor row is internally consistent. An attacker who edits
`compliance_events` and leaves `seed_anchors` untouched still passes. This was
verified empirically — with content stored and pass 2 working, neutering only
the pass-3 comparison let a downgraded `risk_level` through undetected.

**(b) Recompute from the source row, no new column.** The obvious "real" check,
and **impossible as stated.** The anchored EVENT content is:

```js
{ prompt_hash, risk_level, action_taken, classifications,
  timestamp: new Date().toISOString() }   // ← anchor-build time
```

That `timestamp` is the instant the anchor was built. It is stored in no table:
`compliance_events.created_at` is a separate `now()` from the insert, a
different instant by design. The hash cannot be re-derived from the row, and
changing the hash input to fix that would orphan every existing anchor — pinned
by the "hash format compatibility" test.

**So the shipped fix is (a) + (b).** Store the content so recomputation is
possible at all, then cross-check it against the live source row so it means
something.

## The three passes

| Pass | Checks | Detects | Blind to |
|---|---|---|---|
| 1. Linkage | `previous_hash` → prior `content_hash` | deleted / reordered **anchor** | anything in the log's contents |
| 2. Content | re-derives the hash from stored `content` | edit to the **anchor row** | edits to `compliance_events` |
| 3. Source | re-reads the live `compliance_events` row | **edited or deleted log row** | non-EVENT entity types |

Pass 3 is the one that catches what the product is sold against: someone
downgrading a logged violation, stripping a classification, or deleting the row
outright. Passes 1 and 2 never look outside `seed_anchors`.

## Limits, stated rather than hidden

- **Pass 3 is EVENT-only.** POLICY / REPORT / HITL anchors record an *operation*
  (a diff, an approval, a period summary), not a snapshot of a row, so there is
  no row whose current state they should still equal. `source_checked` in the
  return reports how many anchors actually reached pass 3, so the gap is visible
  rather than assumed.
- **Pre-030 anchors can never be content-verified.** They have no stored
  content, and backfilling one would mean inventing the object that was hashed —
  fabricated evidence. They are counted in `unverifiable` and reported.
  `valid: true` with `unverifiable: N` means *no tampering detected, and N
  anchors whose contents were never provable*. **Any caller must surface that
  number** — a skipped check that reads as a passed check is the original defect.
- **Nested keys are outside the hash.** The hash passes
  `Object.keys(content).sort()` as a `JSON.stringify` replacer *array*, which is
  a recursive key allowlist, so keys inside a child object never reach the
  hashed string. Editing POLICY `content.changes.severity` does not move
  `content_hash`. Fixing this means changing the hash input, which orphans every
  existing anchor. EVENT content has no nested objects (`classifications` is an
  array, and replacer arrays do not filter array elements), so **EVENT anchors
  are unaffected** — and they are the ones pass 3 covers anyway.
- **ALLOWED events are recorded but not anchored.** `logComplianceEvent` only
  anchors when `action_taken !== "ALLOWED"`. The merkle root in a generated
  report therefore covers violations, not all traffic.
- **`timestamp` is not compared.** It has no column to disagree with. Treating
  it as a source field would report tampering on every healthy row.

## The open thread

**`verifySeedChain` has no production caller.** It is exported, now correct, and
invoked only from its own tests. Until something runs it, the detection above is
capability, not practice. The natural home is the `integrity` block of
`/api/reports/generate` — the section of the $499 deliverable that already
claims a merkle root and an anchored-event count, and the exact place an
assessor looks. That is a change to customer-facing report output, so it is
called out here rather than slipped in.

See also: [GATEWAY-DATA-RAIL.md](./GATEWAY-DATA-RAIL.md) for the write path that
feeds this chain, and migration `029_seed_anchor_chain_integrity.sql` for why
concurrent writers cannot fork it.
