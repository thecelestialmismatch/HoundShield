# HoundShield Detection Patterns

16 patterns covering CMMC/CUI, HIPAA/PHI, PII, credentials, and IP.
All patterns enforced locally — zero data transmitted externally.

Each pattern maps to one or more NIST SP 800-171 Rev 2 controls.

---

## CMMC / CUI Patterns (4)

| Pattern | Risk | Action | NIST Controls |
|---------|------|--------|---------------|
| CUI marking | CRITICAL | BLOCK | AC.L2-3.1.3, SI.L2-3.14.1 |
| Classification markings | CRITICAL | BLOCK | AC.L2-3.1.3 |
| Contract / CAGE identifiers | HIGH | QUARANTINE | AC.L2-3.1.3, AU.L2-3.3.1 |
| Export control markers (ITAR/EAR) | CRITICAL | BLOCK | AC.L2-3.1.3 |

**Examples detected:**
- `CUI//SP-CTI` — CUI with specified category
- `TOP SECRET`, `FOUO`, `NOFORN`, `SBU`
- `Contract No. W911NF-23-1-0001`, `CAGE Code: 1A2B3`
- `ITAR`, `EAR99`, `Export Controlled`

---

## HIPAA / PHI Patterns (3)

| Pattern | Risk | Action | NIST Controls |
|---------|------|--------|---------------|
| Medical Record Number | HIGH | BLOCK | SC.L2-3.13.1 |
| Health Insurance Identifier | HIGH | QUARANTINE | SC.L2-3.13.1 |
| Diagnosis / procedure codes | MEDIUM | QUARANTINE | SC.L2-3.13.1 |

**Examples detected:**
- `MRN: 1234567`, `Medical Record #00123456`
- `NPI: 1234567890`, `Member ID: H12345678`
- `ICD-10: Z87.891`, `CPT 99213`

---

## PII Patterns (5)

| Pattern | Risk | Action | NIST Controls |
|---------|------|--------|---------------|
| Social Security Number | CRITICAL | BLOCK | SI.L2-3.14.1, AC.L2-3.1.3 |
| Credit card number | CRITICAL | BLOCK | SI.L2-3.14.1 |
| Passport / driver's license | HIGH | QUARANTINE | SI.L2-3.14.1 |
| Bank account / routing | HIGH | QUARANTINE | SI.L2-3.14.1 |
| Date of birth | MEDIUM | QUARANTINE | — |

**Examples detected:**
- `SSN: 123-45-6789`, `Social: 123456789`
- `4111 1111 1111 1111` (Visa/MC/Amex patterns, Luhn-validated)
- `Passport: 123456789`, `DL: A1234567`
- `ABA: 021000021`, `Account: 123456789012`

---

## Credential Patterns (3)

| Pattern | Risk | Action | NIST Controls |
|---------|------|--------|---------------|
| API keys | CRITICAL | BLOCK | IA.L2-3.5.3, SC.L2-3.13.10 |
| Private keys (PEM) | CRITICAL | BLOCK | IA.L2-3.5.3 |
| Generic secrets | HIGH | QUARANTINE | IA.L2-3.5.3 |

**Examples detected:**
- `sk-proj-...` (OpenAI), `sk-ant-...` (Anthropic), `AIza...` (Google)
- `-----BEGIN RSA PRIVATE KEY-----`, `-----BEGIN EC PRIVATE KEY-----`
- `password=supersecret`, `secret_key = "abc123"`, `bearer_token: xyz`

---

## Intellectual Property Patterns (1)

| Pattern | Risk | Action | NIST Controls |
|---------|------|--------|---------------|
| Patent numbers | MEDIUM | QUARANTINE | AC.L2-3.1.3 |

**Examples detected:**
- `US Patent 10,123,456`, `Patent No. 9876543`
- `US20230123456A1` (patent application)

---

## Pattern Confidence Notes

- **CRITICAL / BLOCK**: High precision, low false-positive rate. Block on first match.
- **HIGH / QUARANTINE**: Hold for review — legitimate use possible in context.
- **MEDIUM / QUARANTINE**: Context-dependent — flag for human review.

Luhn algorithm validation is applied to credit card patterns to reduce false positives.
SSN patterns use hyphenated and non-hyphenated forms with context keywords.

---

## Adding Patterns

Submit a PR to `proxy/patterns/index.ts`. New patterns must include:
1. `name` — human-readable
2. `category` — `CUI | PII | PHI | IP | CREDENTIAL`
3. `regex` — tested with `gi` flags
4. `risk_level` — `CRITICAL | HIGH | MEDIUM | LOW`
5. `action` — `BLOCK | QUARANTINE | ALLOW`
6. `nist_controls` — array of applicable NIST 800-171 Rev 2 control IDs

See [NIST SP 800-171 Rev 2](https://csrc.nist.gov/publications/detail/sp/800-171/rev-2/final) for control reference.
