# C3PAO Outreach Sequence — HoundShield

**Goal (Sprint 2):** sign the first C3PAO referral partner. One C3PAO has 20–100 defense-contractor
clients actively shopping for CMMC tooling, so the channel beats cold contractor outreach ~10:1.

**Owner:** STRIKER (Revenue/Growth) · **Status:** ready to send · **Last updated:** 2026-06-21

> Pair this with the now-live trust assets — `/security`, `/dpa`, `/partners` — which make the
> pitch procurement-credible. Link them; don't re-explain them.

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
> Following up with the part most C3PAOs care about: the economics.
>
> HoundShield pays a recurring referral commission on every client you send, and clients land on a
> tool that strengthens — never compromises — the assessment you'll run. You look good twice: better
> evidence, and a recommendation that holds up under your own scrutiny.
>
> Could I grab 10 minutes this week or next? I'll walk through the local-only architecture and the
> evidence report, and you can judge whether it's something to put in front of clients.
>
> Partner overview: houndshield.com/partners
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
> → houndshield.com/answers/cloud-ai-dlp-dfars-7012  *(confirm/seed this answer page before sending)*
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

1. 10-minute call booked → demo the local-only flow + the C3PAO PDF report.
2. Partner application via `/partners` → triggers the applicant confirmation email + founder alert.
3. Referral terms agreed → first client referral.
4. Log the win in `tasks/todo.md`; record the pattern in `tasks/lessons.md`.

**Metric that matters:** signed C3PAO partners (not contractors emailed). Target: **1** to clear the Sprint 2 gate.

---

## Compliance & deliverability notes

- Cold B2B email is permitted under CAN-SPAM with: a truthful subject, a real physical address in the
  footer, and a working opt-out. Add both before the first send.
- Warm the sending domain; keep volume low and personalized (this is 1:1 outreach, not a blast).
- Requires DNS: **SPF / DKIM / DMARC** on `houndshield.com` (also on the pre-launch blocker list).
