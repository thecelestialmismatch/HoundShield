# RPO / MSP Outreach Sequence — HoundShield

**Channel:** Registered Practitioner Organizations (RPOs) and Managed Service Providers (MSPs) serving
regulated SMBs. **This is the primary channel** (per the Stage-1 doctrine) because — unlike C3PAOs —
RPOs/MSPs *can* recommend and resell the tools their clients use to remediate. C3PAOs are legally
barred from endorsing tools they assess (assessor-independence rule); see
`c3pao-outreach-sequence.md` for the narrow arms-length exception.

**Goal (Stage 1, by 2026-06-25):** ≥1 signed RPO/MSP referral agreement **and** support of the
≥3 paid **$499 CMMC AI Risk Assessment Reports**. One RPO/MSP carries 10–100 regulated SMB clients
who already trust them for compliance — the highest-leverage path to first revenue.

**Lead product:** the **$499 one-time CMMC AI Risk Assessment Report** — not a subscription. A $499 PO
clears without procurement review; recurring spend does not. Sell the PDF first.

**Owner:** STRIKER (Revenue/Growth) · **Status:** ready to send · **Updated:** 2026-06-23

---

## The wedge (every touch repeats it)

> Your clients' staff are pasting client data into ChatGPT and Copilot right now. Every cloud AI-DLP
> tool scans that data *on the vendor's servers* — itself a potential HIPAA/DFARS 7012 exposure.
> HoundShield scans **locally, in <10ms** (Docker on the client's own infra — Mode B), blocks the
> leak, and produces the audit evidence an assessor asks for. You can offer it as a service and a
> referral line; the cloud tools structurally can't match the data boundary.

**Honesty guardrail:** the local-only/CUI-safe claim is true **only in Mode B (self-hosted Docker)**.
Never tell a partner the hosted Vercel trial endpoint is CUI-safe.

---

## Why an RPO/MSP says yes

1. **New revenue line** — resell the $499 assessment report and/or recurring monitoring; keep margin.
2. **Stickier clients** — AI governance is a fresh, board-level worry they can own first.
3. **No conflict** — RPOs/MSPs implement and advise; recommending tooling is their job (unlike C3PAOs).
4. **Multi-vertical** — same wedge lands for healthcare (HIPAA), defense (CMMC/DFARS), and legal.

---

## Target sourcing

- **RPOs:** the Cyber AB marketplace RPO directory (`cyberab.org`). Filter for firms also doing
  managed services / vCISO (they implement, not just advise).
- **MSPs/MSSPs:** healthcare- and defense-focused MSPs; vCISO practices; HIPAA security-risk-assessment
  firms. LinkedIn search: "vCISO", "HIPAA risk assessment", "CMMC managed services", "MSSP defense."
- **Qualify:** serves 10+ regulated SMBs; publishes compliance content; an owner/practice-lead reachable directly.
- **Per-prospect (2 min):** one true, specific detail → `{{personal_hook}}`. No hook → pick another prospect.

Track: `firm · contact · role · email · LinkedIn · vertical · personal_hook · touch_1..5 · status`.

---

## Cadence (5 touches over ~16 business days)

| Touch | Day | Channel | Purpose |
|------:|----:|---------|---------|
| 1 | 0 | Email | Wedge + the AI-governance gap their clients have today |
| 2 | 2 | LinkedIn connect | Light, no pitch |
| 3 | 4 | Email reply | The $499 report + referral economics, 15-min ask |
| 4 | 9 | Email | Value-first: the partner one-pager + a sample report, no ask |
| 5 | 16 | Email | Respectful break-up |

Stop the moment they reply. Personalize `{{first_name}}`, `{{firm}}`, `{{vertical}}`, `{{personal_hook}}`.

---

## Touch 1 — Email (Day 0)

**Subject:** Your clients are leaking data into ChatGPT — a fix you can resell
**Alt:** AI governance gap at {{firm}}'s clients

> Hi {{first_name}},
>
> {{personal_hook}} — so you already know {{vertical}} clients are under pressure. Here's a gap most
> of them have right now: their staff paste sensitive data into ChatGPT and Copilot daily, with zero
> governance and no audit trail.
>
> HoundShield closes it. It's an OpenAI-compatible proxy that runs **on the client's own infrastructure
> (Docker)**, scans every prompt locally in under 10ms across 16 detection engines (PHI / CUI / PII /
> IP / ITAR), blocks violations, and writes a tamper-evident, NIST 800-171-mapped audit log.
>
> For a firm like {{firm}} it's two things at once: a **$499 AI Risk Assessment Report** you can deliver
> to clients this quarter, and a **referral line** on ongoing monitoring.
>
> Worth 15 minutes to see the report and how the partner economics work?
>
> — {{sender_name}}, HoundShield · houndshield.com/security

---

## Touch 2 — LinkedIn connection request (Day 2)

> Hi {{first_name}} — I work on HoundShield (local-only AI prompt firewall for HIPAA/CMMC; runs on the
> client's own infra). Following {{firm}}'s {{vertical}} compliance work — would value connecting.

No pitch in the request; let the email thread carry it.

---

## Touch 3 — Email reply on the Touch-1 thread (Day 4)

**Subject:** Re: Your clients are leaking data into ChatGPT

> Hi {{first_name}},
>
> The part most partners care about: the economics.
>
> The lead product is a fixed **$499 CMMC/HIPAA AI Risk Assessment Report** — local scan of a client's
> AI usage, findings mapped to controls, delivered as a PDF. It's an easy yes for a client (one PO, no
> procurement cycle) and an easy margin for you. From there, ongoing monitoring is a recurring referral.
>
> Could I grab 15 minutes this week? I'll walk through a sample report and the partner agreement.
>
> Partner overview: houndshield.com/partners · The offer: houndshield.com/assessment
>
> — {{sender_name}}

---

## Touch 4 — Email, value-first (Day 9)

**Subject:** Sample AI Risk Assessment Report + the 1-pager

> Hi {{first_name}},
>
> No ask — just the goods. Here's a sample of the $499 AI Risk Assessment Report and a one-pager on
> why cloud AI-DLP creates a HIPAA/DFARS exposure that a local scan doesn't:
>
> → Sample report (PDF): houndshield.com/api/reports/sample
> → The offer: houndshield.com/assessment
> → The 1-pager: houndshield.com/answers/dfars-7012-ai-tools
>
> Useful for clients asking about ChatGPT/Copilot. And if you ever want the 15-minute partner walkthrough,
> the door's open.
>
> — {{sender_name}}

---

## Touch 5 — Break-up email (Day 16)

**Subject:** Closing the loop, {{first_name}}

> Hi {{first_name}},
>
> Last note for now — I don't want to crowd your inbox. If governing your clients' AI usage (with
> evidence that never leaves their network) becomes relevant, reply and I'll make it easy: a sample
> report, the partner terms, and a 15-minute call.
>
> Either way, good luck with the assessments ahead.
>
> — {{sender_name}}

---

## Objection handling

| They say | You say |
|---|---|
| "My clients already have a DLP." | "Traditional DLP doesn't inspect AI prompt traffic, and the AI-specific tools are cloud-based — which re-introduces the exposure. We close that gap locally, on their infra." |
| "Is the data really staying local?" | "In Mode B — Docker on the client's own infrastructure — yes, prompts never leave their boundary. The hosted trial is for non-sensitive evaluation only; I'll never tell you otherwise." |
| "What do I make on this?" | "Margin on the $499 report and a recurring referral share on monitoring. I'll put exact terms in front of you on a 15-minute call." |
| "Is this just regex?" | "16 detection engines plus a behavioral layer, mapped to all 110 NIST 800-171 controls, sub-10ms. Happy to show the coverage map and a sample report." |
| "Send info, I'll look later." | "Done — sample report + partner overview below. Mind if I check back in two weeks?" (keep the cadence) |

---

## What "yes" looks like → handoff

1. 15-minute call → show a sample $499 report + the local-only (Mode B) flow.
2. Partner application via `/partners` → triggers applicant confirmation + founder alert.
3. Referral/reseller terms agreed.
4. First client → deliver a $499 AI Risk Assessment Report (counts toward the Stage-1 ≥3).
5. Log the win in `tasks/todo.md`; record the pattern in `tasks/lessons.md`.

**Metrics that matter (Stage 1):** signed RPO/MSP agreements (≥1) and paid $499 reports closed (≥3).

---

## Compliance & deliverability

- Cold B2B email is permitted under CAN-SPAM with a truthful subject, a real physical address in the
  footer, and a working opt-out. Add both before sending.
- Warm the domain; keep volume low and 1:1 personalized.
- Requires DNS: **SPF / DKIM / DMARC** on `houndshield.com`.
