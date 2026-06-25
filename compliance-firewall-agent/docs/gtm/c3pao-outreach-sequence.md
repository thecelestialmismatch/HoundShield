# C3PAO Outreach Sequence — HoundShield  · ⚠️ SECONDARY / ARMS-LENGTH ONLY

> **DOCTRINE ALIGNMENT (read first).** The Stage-1 mission makes **RPO/MSP the primary channel**
> (`rpo-msp-outreach-sequence.md`). A **C3PAO is legally barred from endorsing or reselling tools it
> assesses** — assessor independence (CMMC AB Code of Professional Conduct; cf. NIST SP 800-171A
> independence expectations). So this sequence is **secondary and strictly arms-length**:
> - ✅ A C3PAO may **refer** a contractor it is *not* engaged to assess to HoundShield, or share
>   educational material, or use HoundShield's evidence output *that the client independently chose*.
> - ❌ Never position HoundShield as something a C3PAO recommends to a client whose assessment that same
>   C3PAO will perform. That compromises their independence and our credibility.
>
> If you only have time for one channel, run RPO/MSP, not this. Use this only where the independence
> boundary is unambiguous.

**Goal:** awareness + arms-length referrals into the **$499 CMMC AI Risk Assessment Report**.

**Owner:** STRIKER (Revenue/Growth) · **Status:** secondary asset · **Last updated:** 2026-06-23

> Pair with the live trust assets — `/security`, `/dpa`, `/partners` — which make the pitch
> procurement-credible. Link them; don't re-explain them.

---

## The one-line wedge (every touch repeats it)

> Every cloud AI-DLP tool sends your client's CUI to its servers to scan it — that transfer is
> itself a potential CUI spill under DFARS 7012. HoundShield scans locally. **Nothing leaves the
> client's network.** A cloud vendor structurally cannot match that.

For a C3PAO this is existential: recommending a cloud DLP could implicate *their* assessment integrity.

---

## Target sourcing

- **Primary list:** the official C3PAO directory at `cyberab.org` (Cyber AB marketplace). ~50–60 authorized C3PAOs.
- **Qualify** for: firms publishing CMMC content/webinars (already educating the market), 5–50 employees
  (big enough to have client volume, small enough to talk to a founder), active on LinkedIn.
- **Find the human:** Managing Partner / Practice Lead / Director of CMMC Services. Avoid generic info@.
- **Per-prospect research (2 min):** one specific, true detail — a recent webinar, a LinkedIn post, a
  blog. It becomes the `{{personal_hook}}` token. No hook → don't send; pick another prospect.

Track in a simple sheet: `company · contact · role · email · LinkedIn · personal_hook · touch_1..5 dates · status`.

---

## Cadence (5 touches over ~16 business days)

| Touch | Day | Channel | Purpose |
|------:|----:|---------|---------|
| 1 | 0 | Email | Wedge + the "you can't recommend cloud DLP" insight |
| 2 | 2 | LinkedIn connect | Light, no pitch — name + one line |
| 3 | 4 | Email reply (to T1) | The referral economics + 10-min ask |
| 4 | 9 | Email | Value-first: send the DFARS-7012 one-pager, no ask |
| 5 | 16 | Email | Respectful break-up |

Stop the sequence the moment they reply. Personalize `{{first_name}}`, `{{company}}`, `{{personal_hook}}`.

---

## Touch 1 — Email (Day 0)

**Subject:** A DLP recommendation that won't fail your clients' assessment
**Alt subject:** Quick CMMC question for {{company}}

> Hi {{first_name}},
>
> {{personal_hook}} — which is exactly why I'm reaching out.
>
> Most AI data-loss tools your clients evaluate (Nightfall, Strac, Purview) scan prompts in the
> vendor's cloud. For a CUI environment that transfer is itself a potential DFARS 252.204-7012
> spill — so as their assessor, it's a tool you can't cleanly endorse.
>
> HoundShield is the opposite by design: it scans every AI prompt **locally**, on the client's own
> network. Nothing leaves. It maps detections to NIST 800-171 controls and exports a tamper-evident,
> C3PAO-ready PDF — the evidence you ask for, generated without a spill.
>
> Worth a 10-minute look as something to point clients to? I can also show how our referral program works.
>
> — {{sender_name}}
> {{sender_title}}, HoundShield · houndshield.com/security

---

## Touch 2 — LinkedIn connection request (Day 2)

> Hi {{first_name}} — I work on HoundShield, a local-only AI compliance firewall built for CMMC L2
> (nothing leaves the client's network). Following {{company}}'s CMMC work — would value connecting.

No pitch in the request. If accepted, do **not** dump a sales message; let the email thread carry it.

---

## Touch 3 — Email, reply on the Touch-1 thread (Day 4)

**Subject:** Re: A DLP recommendation that won't fail your clients' assessment

> Hi {{first_name}},
>
> Quick follow-up — and I want to be precise about independence: I'm **not** asking you to endorse a
> tool to a client you're assessing. That's your independence and I won't touch it.
>
> Where it works is arms-length: a contractor you're *not* engaged to assess, or simply pointing
> clients who ask "what about ChatGPT?" to our $499 AI Risk Assessment Report so they arrive at their
> own decision. If a referral relationship ever fits within your independence rules, we have one.
>
> Could I grab 10 minutes to show the report and the local-only architecture, so you know what clients
> are choosing on their own?
>
> Partner overview: houndshield.com/partners · The offer: houndshield.com/assessment
>
> — {{sender_name}}

---

## Touch 4 — Email, value-first (Day 9)

**Subject:** The 1-pager: why cloud AI-DLP violates DFARS 7012

> Hi {{first_name}},
>
> No ask today — just something useful. We wrote up why cloud-based AI DLP creates a DFARS 7012
> exposure and what to look for instead. Several C3PAOs are sharing it with clients who ask about
> ChatGPT/Copilot usage:
>
> → houndshield.com/answers/dfars-7012-ai-tools
>
> If it's helpful to your clients, use it freely. And if you'd ever like the 10-minute walkthrough,
> the door's open.
>
> — {{sender_name}}

---

## Touch 5 — Break-up email (Day 16)

**Subject:** Closing the loop, {{first_name}}

> Hi {{first_name}},
>
> I don't want to crowd your inbox, so this is my last note for now. If governing clients' AI usage —
> with evidence that never leaves their network — becomes relevant, just reply and I'll make it easy.
>
> Either way, good luck with the assessments ahead. The November 2026 deadline is going to be a busy
> stretch for all of us.
>
> — {{sender_name}}

---

## Objection handling

| They say | You say |
|---|---|
| "We stay tool-neutral." | "Understood — this isn't about endorsement, it's about giving clients a local-only option so they don't unknowingly pick a cloud tool that complicates your assessment." |
| "Our clients already have a DLP." | "Most DLPs don't inspect AI prompt traffic, and the AI ones are cloud-based. That gap is exactly the assessment risk we close — locally." |
| "Is this just regex?" | "16 detection engines plus a behavioral OODA layer, mapped to all 110 NIST 800-171 controls, sub-10ms. Happy to show the coverage map." |
| "Send info, I'll look later." | "Done — here's the security + partner overview. Mind if I check back in two weeks?" (then keep the cadence) |
| "What's the commission?" | "Recurring revenue share per referred client — I'll put exact terms in front of you on a 10-minute call." |

---

## What "yes" looks like → handoff

1. 10-minute call booked → demo the local-only (Mode B) flow + the PDF report.
2. Arms-length awareness/referral set up (never for a client they're assessing).
3. Contractors arrive at the **$499 AI Risk Assessment Report** on their own decision.
4. Log the outcome in `tasks/todo.md`; record the pattern in `tasks/lessons.md`.

**Metric that matters (Stage 1):** this is a *secondary* awareness channel. The hard targets —
≥3 paid $499 reports and ≥1 signed referral agreement — are owned by the **RPO/MSP** sequence.

---

## Compliance & deliverability notes

- Cold B2B email is permitted under CAN-SPAM with: a truthful subject, a real physical address in the
  footer, and a working opt-out. Add both before the first send.
- Warm the sending domain; keep volume low and personalized (this is 1:1 outreach, not a blast).
- Requires DNS: **SPF / DKIM / DMARC** on `houndshield.com` (also on the pre-launch blocker list).
