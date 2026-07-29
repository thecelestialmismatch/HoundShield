# Healthcare Outreach — Ready to Send

**From:** `Gaurav@houndshield.com` · **Sign as:** Gaurav, Founder — HoundShield

> **Mailbox status corrected 2026-07-29:** `Gaurav@houndshield.com` **exists**
> (founder-confirmed, along with `contact@` and `info@`). The earlier note here said
> only `info@` was provisioned — that came from one `/api/v1/me` read and was never
> re-verified. Nothing is blocked on the mailbox.
>
> **Before the first real send,** run the deliverability smoke test in
> `docs/FOUNDER-EMAIL-IDENTITY.md`. Sending and receiving are separate systems
> (Resend sends, Hostinger receives) — a send can succeed while replies bounce.

> **These drafts are now also in code**, at
> `compliance-firewall-agent/lib/email/outreach.ts`, where they are guard-tested
> against claims that would cost the sale (no suspended-deadline selling, no
> subscription tier, no SOC 2) and where rendering **throws** rather than emailing
> `Hi [First name]` to a real person. Send with `npm run email:preview` /
> `npm run email:send`. The versions below are the human-readable reference;
> the code is what ships.
>
> Recipient sourcing — including what counts as a genuine address and why guessing
> one risks the domain that carries password resets — is
> `docs/OUTREACH-SOURCING-RUNBOOK.md`.

**These are drafts. Nothing has been sent.** Sending is your call.

---

## The strategy in three lines

The ask is a **15-minute interview, not a sale.** You are not trying to close on email;
you are trying to find out whether the problem is real enough that someone will pay $499.
Ten honest conversations are worth more than a hundred opens.

**Send 30. Expect ~10 replies. Convert 3 to paid.** Send them one at a time from your own
inbox, not a sequencing tool — a founder writing personally is the entire advantage.

---

## Email 1 — The primary ask (send this to 25 of the 30)

> **Subject:** quick question about ChatGPT at [Clinic Name]
>
> Hi [First name],
>
> I'm building a tool that shows a Privacy Officer exactly what PHI staff pasted into
> ChatGPT — scanned on your own hardware, so nothing leaves your network.
>
> Before I build more of it, I'd rather find out whether this is even a real problem for
> you. Do you have 15 minutes this week? I'm not selling anything — I genuinely want to
> know if I'm wrong about this.
>
> If it's easier to just see it: you can paste a sample prompt at
> houndshield.com/demo — it scans in your browser, nothing is sent to us.
>
> Gaurav
> Founder, HoundShield

**Why it works:** under 90 words, names the specific role and specific fear, asks for
time rather than money, and offers a zero-risk way to verify the core claim without
talking to you. "I want to know if I'm wrong" is disarming and true.

**Do not** add a calendar link, a deck, a case study, or a P.S. Every addition makes it
look more like marketing and less like a person.

---

## Email 2 — For a clinic that has publicly announced AI adoption

> **Subject:** your AI rollout + the HIPAA gap nobody mentions
>
> Hi [First name],
>
> Saw that [Clinic] is rolling out [AI tool] — congratulations, genuinely.
>
> One thing that tends to surface a few months in: staff also use their *personal*
> ChatGPT accounts for the quick stuff. Netskope's 2025 data puts that at 43% of
> healthcare workers, and 89% of healthcare AI policy violations involve regulated data.
> Personal accounts are the ones security teams can't see.
>
> I built a scanner that shows you exactly what's been pasted, running on your own
> hardware. Worth 15 minutes?
>
> Gaurav
> Founder, HoundShield

---

## Email 3 — Follow-up (one only, 5 days later, reply to your own thread)

> Hi [First name] — following up once, then I'll leave you alone.
>
> If the answer is "we've got this handled," that's genuinely useful for me to know —
> just hit reply with "handled" and I'll stop.
>
> If it's more "we suspect it's happening but can't prove it," that's exactly the
> conversation I'm after.
>
> Gaurav

**Send one follow-up. Never two.** "Reply with one word" makes the no cheap, and a fast
no is worth more than a slow maybe.

---

## Defense variant — for contractors who already self-attested

Use this **only** for firms with a filed SPRS score. It sells liability, not a deadline —
the November deadline no longer exists.

> **Subject:** your SPRS score after the Phase 2 suspension
>
> Hi [First name],
>
> Now that CMMC Phase 2 is suspended, your self-attested SPRS score is the only thing the
> government sees — and it's your representation, with no C3PAO in between.
>
> DOJ has settled 15 False Claims Act cases on exactly that. MORSECORP paid $4.6M for a
> score higher than an assessment supported. LOGZONE paid $507,144 for certifying a
> perfect 110 with controls unimplemented.
>
> If someone asked you to evidence your score tomorrow, could you? That's the gap I built
> for. 15 minutes?
>
> Gaurav
> Founder, HoundShield

**Every claim here is verifiable** — that is the point. Do not embellish the numbers.

---

## On the call: ask this, then stop talking

1. "Walk me through how your staff use AI today." *(listen — do not pitch)*
2. "How would you know if someone pasted patient data into ChatGPT last Tuesday?"
3. "What happens to you personally if that turns up in an audit?"
4. **"If this existed today, would you pay $499 for the report?"** ← the whole point
5. "Who else would need to say yes?"

Then be quiet. The silence after question 4 is the most valuable data you will get.

**Record the answer to Q4 verbatim for all 10 calls.** If fewer than 3 say yes, the
problem is the offer, not the outreach — and that is worth knowing in two weeks rather
than two quarters.

---

## Tracking

| # | Name | Role | Clinic | Sent | Replied | Call | Would pay $499? |
|---|---|---|---|---|---|---|---|
| 1 | | | | | | | |

Copy that row 30 times. **Column 8 is the only one that matters.**

---

## Where to find 30 names

- **AHIMA** and **HCCA** member directories and local chapter events
- State medical association compliance officers
- LinkedIn: `"Privacy Officer" OR "Compliance Director"` + healthcare, 50–300 employees
- Regional **HIMSS** chapters
- **MSPs and vCISOs already serving clinics** — they have the trust and the access, and
  they are also your channel-partner pipeline

Aim for 50–300 provider groups. Smaller has no budget owner; larger has procurement,
which is exactly what the $499 price is designed to avoid.
