# HoundShield Detection Patterns

**40 patterns** covering CMMC/CUI, HIPAA/PHI, PII, credentials and IP.
Every pattern is a local regex — no prompt content is transmitted to score it.

> This file is GENERATED FROM `proxy/patterns/index.ts` and pinned by
> `compliance-firewall-agent/lib/detection/__tests__/patterns-doc.test.ts`, which
> fails the build if the two disagree. The previous hand-maintained version had
> drifted badly: its table listed a fraction of the registry under a headline
> count several times larger, named patterns that were never in the registry at
> all (bank account / routing, date of birth, patent numbers, generic secrets
> among them), and credited the card patterns with a form of validation the
> registry does not perform. It is a page customers read before deploying, and a
> page an assessor could reasonably rely on, so it is derived now rather than
> described. (The retired claims are named verbatim in the guard test rather than
> here: the guard scans THIS file for those exact words, so remembering them here
> would trip it.)

Not every pattern carries a NIST mapping yet; the ones that do are listed.
Category names are the registry's own (`CUI | PII | PHI | IP | CREDENTIAL`) and
are broader than their labels suggest — most CMMC contracting patterns are
filed under `IP`.

---

## CMMC / CUI markings — `CUI` (2)

| Pattern | Risk | Action | NIST 800-171 Rev 2 |
|---|---|---|---|
| Classification markings | CRITICAL | BLOCK | AC.L2-3.1.3 |
| CUI marking | CRITICAL | BLOCK | AC.L2-3.1.3, SI.L2-3.14.1 |

## Defense contracting, network and intellectual property — `IP` (16)

| Pattern | Risk | Action | NIST 800-171 Rev 2 |
|---|---|---|---|
| CAGE code | CRITICAL | BLOCK | AC.L2-3.1.3 |
| DoD contract number | CRITICAL | BLOCK | AC.L2-3.1.3, AU.L2-3.3.1 |
| ITAR controlled technology | CRITICAL | BLOCK | AC.L2-3.1.3, AC.L2-3.1.22 |
| Contract number contextual | HIGH | BLOCK | AU.L2-3.3.1 |
| DD-250 / DD form references | HIGH | BLOCK | AU.L2-3.3.1 |
| DUNS / UEI number | HIGH | BLOCK | AC.L2-3.1.3 |
| Military specification / standard references | HIGH | QUARANTINE | AC.L2-3.1.3 |
| NIPRNet / SIPRNet references | HIGH | BLOCK | AC.L2-3.1.3, SC.L2-3.13.1 |
| Program office / DoD system identifier | HIGH | QUARANTINE | AC.L2-3.1.3 |
| Task order / delivery order | HIGH | QUARANTINE | AU.L2-3.3.1 |
| Technical data package references | HIGH | QUARANTINE | AC.L2-3.1.3 |
| CDRL reference | MEDIUM | QUARANTINE | AU.L2-3.3.1 |
| DoD IPv4 ranges (DISA) | MEDIUM | QUARANTINE | SC.L2-3.13.1 |
| IPv4 private range — internal network exposure | MEDIUM | QUARANTINE | — |
| Trade-secret / strategic terms | MEDIUM | QUARANTINE | SC.L2-3.13.16 |
| Source code markers | LOW | ALLOW | — |

## HIPAA / PHI — `PHI` (7)

| Pattern | Risk | Action | NIST 800-171 Rev 2 |
|---|---|---|---|
| Health plan beneficiary number | CRITICAL | BLOCK | — |
| Medical record number | CRITICAL | BLOCK | — |
| Lab result values | HIGH | BLOCK | — |
| Medical diagnosis / ICD code | HIGH | BLOCK | — |
| Prescription / medication context | HIGH | QUARANTINE | — |
| Provider NPI number | HIGH | BLOCK | — |
| PHI context indicators | MEDIUM | QUARANTINE | — |

## PII — `PII` (9)

| Pattern | Risk | Action | NIST 800-171 Rev 2 |
|---|---|---|---|
| Credit card number | CRITICAL | BLOCK | — |
| Credit card number (separated) | CRITICAL | BLOCK | SC.L2-3.13.16 |
| Security clearance level | CRITICAL | BLOCK | AC.L2-3.1.3 |
| SF-86 / personnel security | CRITICAL | BLOCK | AC.L2-3.1.3 |
| SSN (Social Security Number) | CRITICAL | BLOCK | AC.L2-3.1.3 |
| Driver license | HIGH | BLOCK | — |
| Passport number | HIGH | BLOCK | — |
| Email address | LOW | QUARANTINE | — |
| US phone number | LOW | QUARANTINE | — |

## Credentials and secrets — `CREDENTIAL` (6)

| Pattern | Risk | Action | NIST 800-171 Rev 2 |
|---|---|---|---|
| API key / access token assignment | CRITICAL | BLOCK | IA.L2-3.5.2, SC.L2-3.13.16 |
| AWS access key id | CRITICAL | BLOCK | IA.L2-3.5.2, SC.L2-3.13.16 |
| AWS secret key | CRITICAL | BLOCK | — |
| Database connection string | CRITICAL | BLOCK | IA.L2-3.5.2, SC.L2-3.13.16 |
| Private key block | CRITICAL | BLOCK | IA.L2-3.5.2, SC.L2-3.13.16 |
| Generic bearer token | HIGH | BLOCK | — |

---

## What the risk levels mean

- **CRITICAL / BLOCK** — high precision. The prompt is stopped before it leaves
  the network and an audit entry is written.
- **HIGH / BLOCK or QUARANTINE** — stopped or held for review; legitimate use is
  possible in context.
- **MEDIUM / QUARANTINE** — context-dependent, flagged for human review.
- **LOW / ALLOW** — recorded in the audit trail, not blocked. `Source code
  markers` is deliberately here: this product sits in front of Copilot, and
  blocking every function signature would make it unusable.

Two patterns may fire on the same text (a card number matches both the
separated and unseparated forms); the scanner reports one entity per pattern
name.

---

## Adding patterns

The registry is **extend-only** — never edit or delete a shipped expression, per
`CLAUDE.md`. Open a PR against `proxy/patterns/index.ts` with:

1. `name` — human-readable, and unique
2. `category` — `CUI | PII | PHI | IP | CREDENTIAL`
3. `regex` — with the `g` flag; add `i` if case-insensitive
4. `risk_level` — `CRITICAL | HIGH | MEDIUM | LOW`
5. `action` — `BLOCK | QUARANTINE | ALLOW`
6. `nist_controls` — applicable NIST 800-171 Rev 2 control IDs

Then regenerate this file; the doc guard will otherwise fail the build.

See [NIST SP 800-171 Rev 2](https://csrc.nist.gov/publications/detail/sp/800-171/rev-2/final).
