# Rachel / HIPAA Direct Outreach — 3 ready-to-send emails

**Persona:** Rachel — Privacy Officer / CISO at a 50–300-person physician group, clinic, or
healthcare MSP. **Fastest close of the three buyers** (30–90 days, no FedRAMP blocker).

**Pain (real, cited):** clinical and back-office staff paste patient data into ChatGPT/Copilot daily.
ChatGPT is **not HIPAA-compliant without a BAA** (only Enterprise/API tiers offer one), and 81% of
healthcare data-policy violations involve regulated data (Netskope, May 2025).

**Offer:** the **$499 one-time CMMC/HIPAA AI Risk Assessment Report** — a local scan of the practice's
AI usage, PHI findings mapped to controls, delivered as a PDF. Easy PO, no procurement cycle.

**Honesty guardrail (do not violate):** the local-only/PHI-safe claim is true **only in Mode B
(self-hosted Docker)**. The hosted trial is for **non-PHI evaluation only and carries no BAA**. Never
tell a prospect the hosted endpoint is safe for live PHI.

**Assets to link:**
`houndshield.com/assessment` · sample PDF `houndshield.com/api/reports/sample` ·
`houndshield.com/hipaa` · `houndshield.com/security`

**Cadence:** Email 1 (day 0) → Email 2 (day 4, value-first) → Email 3 (day 11, break-up).
Personalize `{{first_name}}`, `{{practice}}`, `{{personal_hook}}`. Stop the moment they reply.

> CAN-SPAM: truthful subject, a real physical address in the footer, a working opt-out. Add both
> before the first send. Requires SPF/DKIM/DMARC on houndshield.com.

---

## Email 1 — Day 0 (the wedge)

**Subject:** Is your staff pasting PHI into ChatGPT?
**Alt subject:** A HIPAA gap at {{practice}} that has no audit trail

> Hi {{first_name}},
>
> {{personal_hook}} — so you already feel the pressure on patient-data governance. Here's a gap most
> practices have right now and can't see: staff paste patient names, MRNs, and notes into ChatGPT and
> Copilot to save time. ChatGPT isn't HIPAA-compliant without a BAA, and there's **no log** of any of it —
> so you couldn't evidence it in an audit or a breach review even if you wanted to.
>
> HoundShield closes the gap. It's an OpenAI-compatible proxy that runs **on your own infrastructure
> (Docker)** and scans every prompt locally in under 10ms — PHI, PII, secrets — blocking the leak
> *before* it reaches the AI, and writing a tamper-evident audit trail.
>
> The fastest way to see where you stand is our **$499 AI Risk Assessment Report**: a local scan of your
> AI usage with PHI findings mapped to controls, delivered as a PDF you can hand to your compliance
> committee. Here's a sample: houndshield.com/api/reports/sample
>
> Worth 15 minutes to walk through it?
>
> — {{sender_name}}, HoundShield · houndshield.com/hipaa

---

## Email 2 — Day 4 (value-first, no hard ask)

**Subject:** The 60-second version: ChatGPT + HIPAA in 2026

> Hi {{first_name}},
>
> No pitch — just the two things every Privacy Officer I talk to wants nailed down:
>
> 1. **The BAA reality.** Consumer ChatGPT has no BAA, so any PHI pasted into it is an unauthorized
>    disclosure. Even with an Enterprise BAA, you still need to *prove* what left and what didn't.
> 2. **Local vs. cloud DLP.** Cloud AI-DLP tools scan prompts on *their* servers — which moves your PHI
>    to another vendor to "protect" it. HoundShield scans on your infrastructure (Mode B); the data
>    never leaves your network. That's the difference between evidence and another disclosure.
>
> Short read for your team: houndshield.com/hipaa · the offer: houndshield.com/assessment
>
> If a 15-minute walkthrough of the $499 report would help, I'll make it easy.
>
> — {{sender_name}}

---

## Email 3 — Day 11 (respectful break-up)

**Subject:** Closing the loop, {{first_name}}

> Hi {{first_name}},
>
> Last note for now — I don't want to crowd your inbox. If governing AI use at {{practice}} (with a PHI
> audit trail that never leaves your network) moves up your list, just reply and I'll send the sample
> report, a one-pager for your committee, and a 15-minute time.
>
> Either way, good luck keeping the AI genie in the bottle — it's the question every practice is going
> to have to answer in 2026.
>
> — {{sender_name}}

---

## Objection handling (Rachel-specific)

| She says | You say |
|---|---|
| "We told staff not to use ChatGPT." | "Policy without enforcement isn't evidence. 81% of healthcare data-policy violations involve regulated data anyway — the assessment shows you whether the policy is actually holding." |
| "We have an Enterprise ChatGPT BAA." | "Great — that covers the contract. You still need to prove what PHI did and didn't go to it, and the BAA doesn't cover Copilot, Claude, or Gemini. The local proxy gives you one audit trail across all of them." |
| "Is the hosted version PHI-safe?" | "No — and I'll always tell you that. The hosted trial is for non-PHI evaluation only, no BAA. For live PHI you run Mode B on your own infrastructure, where prompts never leave your boundary." |
| "$499 — what do I actually get?" | "A 14-day local scan, PHI/PII findings mapped to controls, an SPRS-style score, and a PDF for your compliance committee. Here's a sample: houndshield.com/api/reports/sample" |

---

## What "yes" looks like → handoff

1. 15-minute call → walk the sample report + the local-only (Mode B) flow.
2. Practice buys the **$499 AI Risk Assessment Report** (counts toward the Stage-1 ≥3).
3. Deliver the report; offer ongoing monitoring as the Stage-2 expansion.
4. Log the win in `tasks/todo.md`; note the pattern in `tasks/lessons.md`.

**Metric (Stage 1):** paid $499 reports closed. Rachel is the fastest path — lead here in parallel with RPO/MSP.
