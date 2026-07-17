# Outreach Pack — direct cold emails for the $499 report

> Rebuilt 2026-07-17 (the original lived in a session scratchpad and was lost —
> this copy is in the repo so it can't evaporate). Ready to send; personalization
> in [brackets]. Every claim is verifiable — the NEVER-DO list (no fabricated
> metrics, no C3PAO channel, no CUI-safe claims for the hosted trial) applies to
> email exactly as it applies to the site. Plain text on purpose.
>
> The RPO/MSP **partner** sequence (3-touch) lives in `docs/EMAIL-SEQUENCES.md`.
> This file is the **direct buyer** side: healthcare first, then legal, then
> defense.

---

## How to send (the whole process, ~45 min/day)

1. **Pick ONE vertical for the week.** Healthcare first — fastest close, no
   FedRAMP blocker. Legal second. Defense third (longest cycle; still start it).
2. **Find 10 contacts.** LinkedIn search: `"Privacy Officer" OR "CISO"` +
   `physician group / clinic / medical group`, 50–300 employees, US. For legal:
   `"IT Director"` + `law firm`, 50–500 attorneys. For defense:
   `"IT Security Manager" OR "FSO"` + `defense contractor`. Get emails via the
   firm's website or a finder tool; guess `first.last@domain` as a fallback.
3. **Send 10/day, personalized in one line** (the [one-line observation] slot —
   their EHR vendor, a recent post, their practice size). Do not automate;
   10 real emails beat 200 template blasts to spam.
4. **Reply → book a 20-minute call.** Run the demo script
   (`docs/DEMO-SCRIPT.md`) — it always ends on the PDF. A prospect who won't
   book yet can **prove it themselves**: `houndshield.com/demo#snapshot` — they
   paste a real prompt, the scan and preview gap-report PDF run **in their own
   browser** (nothing is transmitted), and they see their own NIST-mapped
   exposure. Drop that link in the first email or the follow-up; it does the
   demo's "ends on the PDF" moment without a meeting.
5. **Yes → invoice.** If `/api/health` shows `payments: connected`, send them
   `houndshield.com/pricing` (the $499 button). If the site key is broken, the
   button now falls back to the Stripe-hosted payment link automatically — or
   send that link directly: `https://buy.stripe.com/aFa00lgzIgJx3Aqb7qgUM00`
   (verified active 2026-07-17; billed by Stripe, works even when site checkout
   is down). A manual Stripe invoice also works — never make a yes wait.
6. **Track it.** One spreadsheet row per contact: name, org, vertical, sent,
   reply, call, outcome. 40 sends with zero replies = change the subject line
   and the first sentence, not the offer.

---

## Email 1 — RACHEL (Healthcare Privacy Officer / CISO)

**Subject:** Nurses pasting patient info into ChatGPT — 14-day visibility

[First name] —

[One-line observation about their org.]

Netskope's May 2025 healthcare study found 81% of data-policy violations in
healthcare involve regulated data — and the newest leak path is staff pasting
patient details into ChatGPT, which has no BAA outside the Enterprise/API
tiers. Most privacy officers have a policy against it and zero visibility into
whether it's happening.

We run a 14-day AI-usage risk assessment for physician groups your size:

- A proxy on YOUR infrastructure watches prompts going to ChatGPT/Copilot/
  Claude — PHI is flagged and blocked before it leaves your network. Prompt
  content never reaches us or any cloud scanner.
- Day 14 you get a signed PDF: every AI-prompt event risk-scored, mapped to
  the HIPAA Security Rule, with a tamper-evident (SHA-256 hash-chained) log.
- $499 flat, one-time. No subscription, no seat licenses, 30-day money-back.

It's the document that answers "are we exposed?" before an OCR auditor — or a
breach — asks it. Worth 20 minutes this week?

[Signature]

## Email 2 — MARCUS (Law Firm IT Director)

**Subject:** Attorneys + ChatGPT: the privilege problem your bar has already ruled on

[First name] —

[One-line observation about the firm.]

NY, California, and Florida bar ethics opinions (2024–2025) all reached the
same conclusion: putting client-confidential material into a public AI tool
risks privilege. Attorneys are doing it anyway — usually with the best
intentions and no audit trail.

We run a 14-day AI-usage risk assessment built for firms of [size]:

- A local proxy on your network flags and blocks privileged/confidential
  content headed to ChatGPT, Copilot, or Claude — nothing is sent to a cloud
  scanner, which matters because a cloud DLP vendor reading privileged text is
  itself a disclosure problem.
- You get a signed PDF inventory of every AI-prompt event, scored, with a
  tamper-evident log — the artifact your GC or malpractice carrier will ask
  for.
- $499 one-time. No subscription. 30-day money-back.

Happy to show the block-and-report flow live in 20 minutes — it ends with the
PDF in your hands.

[Signature]

## Email 3 — JORDAN (Defense IT Security Manager / FSO)

**Subject:** Employees pasting CUI into ChatGPT — evidence for your C3PAO in 14 days

[First name] —

[One-line observation about the company / contract vehicle.]

DoD counts 76,598 DIB orgs needing CMMC Level 2 and roughly 1.4% have
completed it. When your assessment comes, "how do you control AI tool usage?"
is now on the checklist — SC.3.177 and AU.2.041 in NIST 800-171 terms — and a
written policy with no enforcement log doesn't hold up.

We run a 14-day AI-usage risk assessment, deployed inside your boundary:

- Docker container on your own infrastructure (one URL change). Prompts to
  ChatGPT/Copilot/Claude are scanned locally in under 10ms; CUI patterns are
  blocked and logged. Prompt content never leaves your network — unlike
  cloud-scanning DLP tools, which route your CUI through their servers (itself
  a DFARS 7012 exposure).
- Day 14: a SHA-256-signed PDF mapping every event to NIST 800-171 Rev 2
  controls — evidence you can hand your C3PAO.
- $499 one-time. No subscription, no procurement cycle — it fits on a P-card.

Worth 20 minutes to see the block → audit-log → PDF flow live?

[Signature]

---

## Follow-up (day 4, any vertical, no reply)

**Subject:** Re: [original subject]

[First name] — one number and I'll stop: [vertical stat — healthcare: "81% of
healthcare data-policy violations involve regulated data (Netskope, May
2025)" / legal: "three state bars have now issued formal AI ethics opinions" /
defense: "of 76,598 DIB orgs required to reach CMMC L2, about 1.4% have"].

The 14-day assessment answers whether that's happening in YOUR org, for $499,
without touching your existing tools. If the answer's clean, the report proves
that too — that's still worth having on file.

20 minutes this week or next?

[Signature]

## Breakup (day 10, no reply)

**Subject:** Re: [original subject]

[First name] — closing the loop. If AI usage visibility comes up later — an
auditor asks, an incident happens, or [vertical: OCR / your carrier / your
C3PAO] raises it — the 14-day assessment is here: houndshield.com/assessment.
Sample report on request, no call needed.

[Signature]

---

## Subject-line bank (rotate when a vertical goes quiet)

Healthcare: "Nurses pasting patient info into ChatGPT — 14-day visibility" ·
"ChatGPT has no BAA — what your staff sends it anyway" · "The AI question
before your next OCR audit"
Legal: "Attorneys + ChatGPT: the privilege problem" · "Your bar already ruled
on AI — is the firm following it?" · "Privileged text in public AI tools —
14-day audit"
Defense: "Employees pasting CUI into ChatGPT — C3PAO evidence in 14 days" ·
"SC.3.177 and your AI usage — the missing log" · "CMMC and ChatGPT: what your
assessor will ask"

## The $499 offer, one paragraph (paste anywhere)

The CMMC AI Risk Assessment Report: we run a local proxy in your environment
for 14 days, watching prompts your staff sends to ChatGPT, Copilot, and
Claude. Sensitive content (CUI/PHI/PII/privileged) is flagged and blocked at
your boundary — prompt content never leaves your network. You get a
SHA-256-signed PDF risk-scoring every AI-prompt event against NIST 800-171
Rev 2 (or the HIPAA Security Rule), with a tamper-evident audit log. $499
one-time, 30-day money-back. Deploys in about 10 minutes via Docker.

## Rules (do not break in email)

- Never pitch a C3PAO to refer/resell — legally barred (32 CFR Part 170).
  RPOs/MSPs only, via `docs/EMAIL-SEQUENCES.md`.
- Never claim the hosted trial is CUI-safe. CUI conversations = Mode B
  (Docker, their infra) explicitly.
- No invented metrics, customers, or testimonials. The numbers above (81%
  Netskope, 76,598 / ~1.4% DoD, bar opinions) are the citable set.
- Lead with the $499 report. Subscriptions only if THEY ask about ongoing
  monitoring.
