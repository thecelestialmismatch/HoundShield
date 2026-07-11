# Email Sequences — RPO Outreach + Customer Onboarding

> Ready-to-send copy. Personalization slots in [brackets]. Every claim below is
> verifiable on the site (no fabricated metrics — NEVER-DO list applies to
> email exactly as it applies to pages). Plain-text friendly on purpose:
> compliance buyers and RPO principals read email in preview panes.

---

## Sequence A — RPO/MSP partner outreach (the 10 drafts)

**Targets (from the brain):** Summit 7, MAD Security, CyberSheath,
CompliancePoint, BEMO, Steel Root, Etactics + 3 from the Cyber AB Marketplace
RPO directory. **Never a C3PAO.**

### A1 — First touch (day 0)

**Subject:** A $499 AI-risk deliverable for your CMMC clients (co-branded)

[First name] —

Your CMMC clients' employees are pasting contract data into ChatGPT right
now, and their assessor will ask about it. Most RPOs don't have a deliverable
for that conversation yet.

We built one you can put your name on: a 14-day AI risk assessment that runs
entirely on the client's own infrastructure (Docker, one URL change — prompt
content never leaves their network), then produces a SHA-256-signed PDF
mapping every AI prompt event to NIST 800-171 Rev 2 controls.

- Co-branded under [RPO name], $299 wholesale — you set the retail
- Client keeps their AI tools; CUI gets blocked at their boundary, logged
  tamper-evidently
- The PDF slots straight into the SSP work you're already doing

The kit (sample report, client one-pager, deployment runbook) is here:
https://houndshield.com/partners/kit

Worth 15 minutes this week? I'll send the sample report either way.

[Signature]

### A2 — Follow-up (day 4, no reply)

**Subject:** Re: A $499 AI-risk deliverable for your CMMC clients

[First name] — one data point and I'll leave you alone: DoD counts 76,598 DIB
orgs needing CMMC Level 2 and roughly 1.4% have completed it. Every one of
the rest is a readiness engagement — and AI usage is the newest gap none of
their checklists cover.

The assessor questions their clients will face are listed here (useful for
your team even if we never talk):
https://houndshield.com/blog/c3pao-ai-usage-checklist-cmmc-assessment

Sample co-branded report still available — one reply and it's in your inbox.

[Signature]

### A3 — Breakup (day 10, no reply)

**Subject:** Closing the loop

[First name] — closing the loop so I'm not noise in your inbox. If AI-usage
evidence comes up in a client engagement later, the partner terms
($299 wholesale, your brand, no exclusivity) will be at
https://houndshield.com/partners/kit — and the free control reference your
team can use today regardless is https://houndshield.com/controls.

Good luck with the November crunch.

[Signature]

---

## Sequence B — $499 report buyer onboarding (day 1 / 3 / 7)

Trigger: `report_orders` row created (Stripe webhook). Send from Resend.
**Status: copy ready — wiring these as automated sends is a separate build
task; until then, send manually from the founder inbox on those days.**

### B1 — Day 1 (after purchase)

**Subject:** Your CMMC AI Risk Assessment: 15-minute setup

Thanks for the order — here's the whole setup:

1. Deploy the proxy on your own infrastructure (Docker, ~15 min):
   https://houndshield.com/docs
2. Point your team's AI tools at your proxy URL (one base-URL change; no
   per-machine agents)
3. That's it. Scanning runs locally — prompt content never leaves your
   network. We literally cannot see it.

Your report generates after 14 days of traffic. Day-14 reminder comes
automatically; reply to this email any time and a human answers.

### B2 — Day 3 (setup check)

**Subject:** Is your proxy seeing traffic yet?

Quick check — by day 3 most teams have the proxy running and events flowing
into the console (https://houndshield.com/console). If yours isn't:

- Most common fix #1: the AI tool's base URL wasn't changed everywhere —
  the quickstart has per-tool instructions: https://houndshield.com/docs
- Most common fix #2: Docker port not reachable from workstations — the
  runbook's network section covers it.

Stuck for more than 10 minutes? Reply with what you're seeing and we'll get
on it. Fourteen quiet days produces an empty report — we'd rather fix it now.

### B3 — Day 7 (mid-run value + policy template)

**Subject:** Halfway there — two things to do before your report lands

You're a week from your signed PDF. Two things that make it land harder:

1. Adopt the AI use policy now, so the report becomes the enforcement
   evidence behind a written policy (assessors test the pair):
   https://houndshield.com/blog/cmmc-ai-use-policy-template
2. Skim the 12 questions your assessor will ask about AI — your report
   answers most of them, and it's better to know which ones it doesn't:
   https://houndshield.com/blog/c3pao-ai-usage-checklist-cmmc-assessment

Day 14: the PDF arrives signed (SHA-256), mapped to NIST 800-171 Rev 2,
ready for your SSP and your C3PAO conversation.

---

## Rules for all sequences

1. No fabricated numbers — the only stats allowed are the sourced ones in
   CLAUDE.md (DoD Feb 2026, Netskope May 2025, G2 Apr 2026).
2. CUI-safety claims always carry the self-hosted (Mode B) qualifier.
3. C3PAOs are never a target of Sequence A. If a C3PAO replies asking to
   partner, the answer is the on-page exclusion note at /partners/kit.
4. One CTA per email. Reply-to goes to a monitored human inbox.
