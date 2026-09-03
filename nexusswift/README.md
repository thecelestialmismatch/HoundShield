# NexusSwift

A zero-trust, production-grade cross-border financial messaging and clearing
hub. It implements the modern SWIFT settlement stack as it actually works
today: **ISO 20022 `pacs.008.001.10`** customer credit transfers, RSA-4096 /
RSASSA-PSS non-repudiation, UETR-keyed idempotency, and an atomic,
hash-chained double-entry settlement ledger.

Zero application dependencies beyond `cryptography` and `aiosqlite`.
Everything else — XML, hashing, UUIDs, async, and the 75-test harness — is
the Python standard library.

```bash
pip install -r requirements.txt
python run.py                        # migrate, seed, run the validation loop
python -m unittest discover -s tests -t . -v
docker build -t nexusswift . && docker run --rm -v nexus-data:/data nexusswift
```

---

## What SWIFT actually is, and what this replicates

The most common misconception is that SWIFT moves money. It does not.
**SWIFT is a messaging network.** It carries authenticated *instructions*
between financial institutions. The money moves through correspondent
banking — reciprocal nostro/vostro accounts that institutions hold with each
other — and through domestic real-time gross settlement systems (Fedwire for
USD, T2 for EUR, CHAPS for GBP).

So a cross-border payment is two separate things:

1. **The message.** A signed, structured instruction saying "debit this
   party, credit that one, this amount, this currency."
2. **The settlement.** Debiting and crediting the correspondent accounts the
   two institutions hold, atomically.

NexusSwift implements both, and that is the whole of the technical problem.
The parts it deliberately does not implement are not technical at all — see
[What this cannot give you](#what-this-cannot-give-you).

| SWIFT / CBPR+ concept | Where it lives here |
|---|---|
| `pacs.008.001.10` customer credit transfer | `core/schemas.py` |
| BIC (ISO 9362) validation | `core/schemas.py` — `BIC_PATTERN` |
| UETR — end-to-end tracking (gpi) | `core/models.py` — UUIDv4 primary key |
| PKI non-repudiation | `core/crypto.py` — RSA-4096 / PSS |
| Idempotency / replay defence | `core/engine.py` + UNIQUE constraints |
| Correspondent settlement accounts | `accounts` table, nostro/vostro balances |
| Atomic gross settlement (RTGS model) | `core/engine.py` — `_settle` |
| Immutable audit trail | `ledger_entries` + `audit_log`, SHA-256 chained |
| Rejection reason codes | `RejectionReason` — mapped to ISO status codes |

---

## Architecture

```
              ┌───────────────────────────────────────────────┐
  signed      │  ClearingEngine.clear(raw_payload, signature) │
  pacs.008 ──▶│                                               │
              │  1  PARSE         namespace + structure       │
              │  2  IDEMPOTENCY   UETR / (sender, MsgId)      │
              │  3  IDENTITY      registered, active agents   │
              │  4  AUTHENTICITY  RSA-PSS verify              │
              │  5  SETTLEMENT    atomic double-entry         │
              └───────────────────────────────────────────────┘
                       │                        │
                       ▼                        ▼
              ClearingResult          payments · ledger_entries · audit_log
```

**The order of those five steps is a security property, not a style
choice.**

- *Idempotency before signature verification.* Verification is the most
  expensive step in the pipeline. If a replay could force it, an attacker
  gets an amplification primitive — cheap to send, expensive to reject.
  Checking the index first makes a replay cost a B-tree lookup.
- *Identity before authenticity.* You cannot authenticate a party you cannot
  identify: resolving the public key requires knowing the institution.
- *Authenticity before settlement, always.* No balance is read, no lock
  taken, and no row written against an unverified document. An engine that
  checks liquidity first leaks balances to unauthenticated callers through
  error codes and timing.

### Attributable vs unattributable rejection

Where a rejection is *recorded* depends on whether the hub can prove who
sent the message. This distinction was found by the test suite and is the
subtlest thing in the codebase.

A message failing at or before step 4 is **unattributable** — the hub cannot
name a responsible party. It is written to the append-only audit log and
nowhere else, and it does **not** consume the UETR. The alternative is a free
denial-of-service primitive: anyone who observes a UETR in flight could
submit it with a garbage signature and permanently block the genuine payment
behind it.

A message reaching step 5 has a cryptographically proven sender and is
**attributable**. Its rejection is journalled, consuming the UETR and
terminating that payment's lifecycle — which is the SWIFT gpi semantic. The
payer retries under a new UETR rather than resurrecting a closed one.

---

## Design decisions worth knowing

**Money is never a float, and never a bare `Decimal` in storage.** Values are
persisted as integer minor units alongside their ISO 4217 currency. The
minor-unit exponent is looked up, never assumed: JPY has 0, BHD has 3, CLF
has 4. An unknown currency code is rejected rather than defaulted to 2 —
defaulting is exactly how a three-decimal dinar amount gets silently
truncated. An amount carrying more precision than its currency admits is
*rejected*, not rounded: rounding would settle a different number than the
one the debtor signed, and the ledger and the signed document would disagree.

**`raw_payload` is invariant.** The exact signed bytes are stored and never
re-serialised. The moment you round-trip a signed document through a DOM you
have destroyed the ability to re-verify it, because XML serialisers disagree
about attribute order and whitespace. A settled payment in this system still
verifies against its signature straight out of the database, years later.

**PSS with a pinned 32-byte salt, not PKCS#1 v1.5.** v1.5 has no security
proof and a long history of forgery bugs in lenient parsers. The salt is
pinned to the digest length rather than the library's `MAX_LENGTH` sentinel
(446 bytes at 4096 bits) because Java and most HSMs default to 32, and a
verifier configured for 32 rejects a 446-byte-salted signature.

**PSS is randomised, so replay defence cannot key on signature equality.**
Signing identical bytes twice yields two different valid signatures. Replay
detection keys on the UETR, enforced by the storage engine.

**Idempotency is a database constraint, not an application check.** A
SELECT-then-INSERT has a race window between the two statements, and in
asyncio every `await` is a scheduling point — twenty concurrent submissions
can all pass the existence check before any of them inserts. The engine
*attempts* the insert and treats `IntegrityError` as the duplicate signal.
A test submits the same payment twenty times concurrently and asserts that
exactly one settles.

**`BEGIN IMMEDIATE`, not `DEFERRED`.** A deferred transaction takes its write
lock lazily, so two settlements can both read a balance, both decide there
is cover, and only then contend — after work is done. IMMEDIATE takes the
lock at BEGIN, so the loser blocks before reading a balance it is not
entitled to act on.

**MsgId uniqueness is scoped per sender**, matching ISO 20022. A global
unique index would let one participant deny service to another by burning
identifiers.

**The five settlement statuses are a closed set** enforced by a SQL CHECK.
Precise causes live in a separate `rejection_reason` column carrying codes
mapped to ISO 20022 external status codes (`AM04`, `AC01`, `FF01`…). Status
answers *what happened to the money*; reason answers *why*.

---

## Security controls

| Threat | Control | Test |
|---|---|---|
| In-flight amount manipulation | RSA-PSS over invariant bytes | `TamperingAttackTest` |
| Beneficiary redirection | same | `test_creditor_account_redirection_is_rejected` |
| Replay | UETR primary key + MsgId unique index | `ReplayAttackTest` |
| Concurrent replay race | DB constraint, not read-then-write | `test_concurrent_replay_burst_settles_exactly_once` |
| Double-spend (TOCTOU) | settlement lock + `BEGIN IMMEDIATE` | `test_concurrent_double_spend_is_prevented` |
| Overdraw | balance check + SQL CHECK backstop | `LiquidityEnforcementTest` |
| Cross-institution forgery | per-BIC key registry | `test_signature_from_a_different_institution_is_rejected` |
| Debiting another bank's account | account-to-agent ownership check | `test_account_not_held_by_the_named_agent_is_rejected` |
| Message-type confusion (pacs.009 as pacs.008) | namespace URI pinned exactly | `test_wrong_namespace_is_rejected` |
| XXE / billion laughs | DTD rejected pre-parse + 1 MiB cap | `test_doctype_is_rejected` |
| Post-hoc ledger mutation | SHA-256 hash chain | `test_post_hoc_row_mutation_is_detected` |
| Silent value creation | conservation reconciliation | `reconcile()` |
| Retired key still accepted | registry re-parses on PEM change | `test_key_rotation_invalidates_the_old_key` |
| UETR denial-of-service | unattributable rejections not journalled | `test_a_forged_attempt_cannot_burn_a_genuine_uetr` |

---

## Test suite

75 tests, standard-library `unittest` only — a security harness that needs a
plugin installed before it runs is a harness people stop running.

```
EndToEndSettlementTest      valid clearing, balances, double-entry, JPY scaling
TamperingAttackTest         12 mutation vectors, all rejected
ReplayAttackTest            replay, re-signed replay, MsgId reuse, 20-way race
LiquidityEnforcementTest    boundaries, overdraft lines, 50-way concurrent burst
ParticipantControlTest      unregistered, suspended, key rotation
SchemaValidationTest        namespace, XXE, amount precision, BIC, UETR
LedgerIntegrityTest         chain linkage, mutation and deletion detection
CryptographicEngineTest     PSS randomisation, cross-key, PEM, malformed input
ProductionDefaultsTest      guards that the test shortcut cannot ship
```

The suite generates 2048-bit keys for speed; `ProductionDefaultsTest`
separately asserts the production default really is 4096 and that weak keys
are refused, so the shortcut cannot leak into deployment.

---

## What this cannot give you

The engineering above is the complete technical core. Being a **participant
in the real SWIFT network** is not a software problem, and no amount of code
substitutes for it:

- **SWIFT membership** requires being a supervised financial institution or
  other eligible entity, plus a registered BIC and annual attestation
  against the Customer Security Controls Framework (mandatory since the 2016
  Bangladesh Bank theft).
- **Moving money** requires either correspondent accounts with real banks,
  or direct access to an RTGS system via a central-bank account, or — for a
  non-bank — money-transmitter licensing (in the US, FinCEN MSB registration
  plus roughly 50 state licences with surety-bond and net-worth
  requirements; in the EU, an EMI or PI authorisation under PSD2).
- **A BSA/AML programme**: customer identification, sanctions screening,
  SAR/CTR filing, and Travel Rule compliance.

If the goal is to move money across borders without becoming a bank, the
practical routes are Banking-as-a-Service providers, or local-rails
netting — which is how Wise operates and why it is cheap. What NexusSwift
gives you is the part those providers cannot: a correct, auditable,
attack-resistant clearing core you fully control.

## Licence

MIT.
