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
| **1 — parallel direct** | Healthcare Privacy Officer / CISO (Rachel) | [`rachel-hipaa-outreach.md`](./rachel-hipaa-outreach.md) | Fastest close (30–90 days, no FedRAMP blocker). 3 ready-to-send emails. Lead here in parallel with RPO/MSP. |
| 2 — secondary (arms-length) | C3PAO | [`c3pao-outreach-sequence.md`](./c3pao-outreach-sequence.md) | Awareness only. C3PAOs are **legally barred from endorsing tools they assess** — strictly arms-length referral / education. |

## Buyers (run the sequence per persona)

- **Rachel** — HIPAA-first (healthcare practice / MSP). Pain: staff pasting PHI into ChatGPT. *Lead vertical.*
- **Jordan** — IT Security Manager at a DoD contractor. Pain: CMMC L2 / DFARS 7012, AI usage ungoverned.
- **Marcus** — broader regulated SMB (legal/finance). Pain: client confidential data in AI tools.

## Asset status

- ✅ Outreach sequences (RPO/MSP, Rachel/HIPAA, C3PAO arms-length), objection handling, sourcing, CAN-SPAM notes.
- ✅ `/assessment` offer page + no-auth `/api/stripe/report-checkout` ($499 / $299 wholesale).
- ✅ **Downloadable sample report PDF** — `houndshield.com/api/reports/sample` (linked from /assessment, /trust, and every outreach sequence).
- ✅ `/trust` Trust Center (framework alignment + honest SOC 2 roadmap + subprocessors).
- ✅ Transactional emails: report-order confirmation, partner-applicant confirmation.
- ⏳ Founder config: `STRIPE_REPORT_PRICE_ID` (optional — inline $499 fallback works), SPF/DKIM/DMARC, email aliases, `OPENROUTER_API_KEY` **or** `NVIDIA_API_KEY` for Brain AI.
