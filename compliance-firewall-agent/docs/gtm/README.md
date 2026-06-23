# HoundShield GTM — Stage 1 Channel Strategy

Aligned to the compass-corrected doctrine (`CLAUDE.md`, PR #120).

**Prime objective (Stage 1, by 2026-06-25):** first revenue —
≥3 paid **$499 CMMC AI Risk Assessment Reports** + ≥1 signed **RPO/MSP referral agreement**.

**Lead product:** the **$499 one-time report** (offer page: `/assessment`), *not* a subscription.
A $499 PO clears without procurement review; recurring spend doesn't. Prove the PDF sells first.

**CUI-safe claim is true only in Mode B (self-hosted Docker).** Never claim the hosted Vercel trial
endpoint is CUI-safe.

## Channels, in priority order

| Priority | Channel | Doc | Why |
|---:|---|---|---|
| **1 — primary** | RPO / MSP / vCISO | [`rpo-msp-outreach-sequence.md`](./rpo-msp-outreach-sequence.md) | They can recommend & resell tools to clients. 10–100 regulated SMBs each. Multi-vertical (HIPAA/CMMC/legal). |
| 2 — secondary (arms-length) | C3PAO | [`c3pao-outreach-sequence.md`](./c3pao-outreach-sequence.md) | Awareness only. C3PAOs are **legally barred from endorsing tools they assess** — strictly arms-length referral / education. |

## Buyers (run the sequence per persona)

- **Rachel** — HIPAA-first (healthcare practice / MSP). Pain: staff pasting PHI into ChatGPT. *Lead vertical.*
- **Jordan** — IT Security Manager at a DoD contractor. Pain: CMMC L2 / DFARS 7012, AI usage ungoverned.
- **Marcus** — broader regulated SMB (legal/finance). Pain: client confidential data in AI tools.

## Asset status

- ✅ Outreach sequences (both channels), objection handling, sourcing, CAN-SPAM notes.
- ✅ `/assessment` offer page + one-time $499 checkout path (`tier: "report"`).
- ✅ Transactional emails: report-purchase confirmation, partner-applicant confirmation.
- ⏳ Founder config: `STRIPE_REPORT_PRICE_ID` (one-time $499 price), SPF/DKIM/DMARC, email aliases.
