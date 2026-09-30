# The Asset Lane: HoundShield, 90 days

Written 2026-09-08. Review date 2026-11-08.

One buyer. One offer. One catalyst. No feature work. The full reasoning is in
01-VERDICT.md; this is the execution.

## 1. The single change that matters most

The offer is invisible. Fixing the words on the pricing page is worth more than
every remaining item in this document combined, and it costs nothing.

The page currently says:

> Review a defined AI workflow, its control boundary, and the assessment
> materials needed for your internal evidence process. Scope, compatible
> integrations, deployment mode, retention, and commercial terms are confirmed
> before sensitive data or production traffic is used.

Replace it with this. This is final copy, not a brief.

> ## Find out what your team already pasted into ChatGPT.
>
> We run a scanner inside your network for 14 days. It reads the prompts your
> staff send to ChatGPT, Copilot and Claude, and flags the ones containing
> patient data, contract numbers, source code, credentials, or client
> confidential information.
>
> At the end you get a signed PDF: every incident, who sent it, what was in it,
> and which NIST 800-171 and HIPAA controls it touches.
>
> The prompts never leave your network. We never see them.
>
> **499 dollars, once.** No subscription, no contract, no seat counting.
> Delivered in 14 days. Full refund for 30 days if it is not useful.
>
> [Start the assessment — 499 dollars]
>
> Not ready? [See a real sample report first (PDF)]

Every hedge that must legally remain moves below the fold, under a heading that
says "Scope and limits," where a serious buyer will read it and a browsing
buyer will not be repelled by it. The claims stay true. They stop being the
first thing a stranger reads.

The same rewrite applies to the homepage hero. "Keep regulated data inside your
control boundary" describes a category. "Find out what your team already pasted
into ChatGPT" describes a thing that happened to them.

Rule going forward: a sentence on a page that a stranger cannot act on is a
sentence that costs money. Hedges belong in the contract, not the headline.

## 2. The buyer, corrected

Dale, the MSP owner or vCIO. Full profile in 02-PERSONAS.md.

The correction is one word and it resolves the contradiction between CLAUDE.md,
which lists MSP reselling as channel priority one, and
docs/gtm/MSP-CHANNEL-RESEARCH.md, which correctly found that a one time report
is a poor channel product because MSPs buy per seat, recurring, multi tenant,
RMM deployed.

The MSP is not a reseller. The MSP is a customer.

He does not resell the report. He buys it once and uses it to win a client.
That requires no per seat pricing, no RMM deployment, no multi tenancy and no
PSA integration. It works with exactly what is deployed today.

## 3. The catalyst, dated

The CMMC Reform Task Force delivered findings to the DoW CIO on 2026-09-13 and
the public report is expected on or about 2026-09-28.

That is a guaranteed news event with a guaranteed audience of MSPs and defense
contractors, and it will produce a surge of "what does this mean" searches for
about 72 hours. One article, published within 24 hours of the report going
public, is worth more traffic than a month of ordinary SEO.

The article: "The CMMC Task Force report: what actually changed, and what did
not." The angle is the one nobody else will lead with, because it is the
unwelcome one: enforcement paused, obligation did not. DFARS 252.204-7012, all
110 NIST 800-171 Rev 2 controls, the annual SPRS self assessment and False
Claims Act liability for a false affirmation are all untouched. Only the audit
moved.

Write it before 2026-09-27, holding the specific findings blank. Fill the blanks
and publish the same day the report lands. A piece published three days late
gets none of this.

This is worth one article. It is not worth an outreach campaign, because the
defense buyer's cycle is 90 to 180 days and that does not intersect with any
date in this plan.

## 4. The 90 day sequence

Days 1 to 7. Fix the words. Pricing page, homepage hero, and the partner page.
Move every hedge below the fold. Confirm the Stripe link at
buy.stripe.com/aFa00lgzIgJx3Aqb7qgUM00 completes a real purchase end to end by
buying one and refunding it. Set STRIPE_WEBHOOK_SECRET in Vercel, which has
never been set, and confirm the daily reconciler at /api/cron/reconcile-orders
is running. Until a purchase is provably recordable, "zero customers" is not a
measurement.

Days 8 to 37. Contact. 200 MSPs. Twenty per working day, which is roughly 40
minutes. Named human, specific first line, one message, one follow up seven
days later, then stop. Log every one. This is the only activity in this window
and no feature work happens during it.

Days 38 to 60. Read the results and change exactly one variable. If replies are
above 5 percent but nobody buys, the offer is wrong. If replies are below 2
percent, the message is wrong. If people buy but do not use it, the product is
wrong. Those are three different failures and they have three different fixes;
guessing which one is happening is how three months disappear.

Days 61 to 90. Whichever of the three is failing, fix that one thing and run
another 200 contacts. Then the review date arrives and the decision in section
6 gets made honestly.

Around day 20, sitting outside this sequence: publish the Task Force article
within 24 hours of the report landing.

## 5. The message to Dale, ready to send

Subject: the thing none of your competitors will bring to that meeting

> Hi [name],
>
> You are pitching against three other MSPs and all four of you are saying
> similar things about security posture. [One specific, true, researched line
> about their firm: a vertical they serve, a case study on their site, a
> comment they made in a community.]
>
> Here is one thing none of the other three will put on the table.
>
> We run a 14 day scan inside a prospect's network that shows exactly what
> their staff pasted into ChatGPT and Copilot. Patient records, contract
> numbers, credentials, client confidential material. It comes back as a signed
> PDF mapped to NIST 800-171 and HIPAA controls, with their own people named in
> it.
>
> It costs you 499 dollars, once. You walk into the meeting holding evidence of
> something that already happened to them, instead of a warning about something
> that might.
>
> If it helps you close one 2,500 dollar a month retainer, that is 30,000
> dollars in year one on a 499 dollar spend.
>
> Sample report, no email required: https://www.houndshield.com/api/reports/sample
>
> Worth 15 minutes?
>
> [name]

Rules for this message. Never open with CMMC. Never open with compliance. Never
open with AI firewall. Dale's problem is losing deals, not regulation, and the
first line has to be about his problem or nothing after it gets read.

## 6. The decision on 2026-11-08

Three outcomes, defined now so they cannot be renegotiated when the date
arrives.

1. Three or more paid reports. The offer works. Move to the second offer, which
   is the recurring one, and only then read MSP-CHANNEL-RESEARCH.md again for
   what per seat would require.
2. Between one and two paid reports, or five or more booked calls. Something is
   alive. One more 200 contact cycle with one variable changed. One more, not
   an indefinite series.
3. 400 verified contacts made and zero calls booked. Stop. The product is not
   the problem and neither is the market; the offer failed twice against a
   sample large enough to mean it. A fourth rewrite is not a strategy, it is
   the same avoidance in a new costume.

The 2026-06-25 milestone was allowed to lapse without a replacement and that is
how this project stayed alive for three months past the point it should have
changed. This date does not move.

## 7. Explicitly not doing

1. No new features. None. Not one.
2. No SOC 2 until there is revenue to protect. It costs 5,000 to 15,000 dollars
   and takes 60 to 90 days, and it is a gate for buyers who are not being
   pitched in this window.
3. No Docker Hub publish until a customer asks. It has been on the list since
   Stage 1 and nobody has ever requested it.
4. No new strategy documents. This folder is closed. New facts get appended to
   the state file in 06-THE-LOOP.md, and nowhere else.
5. No C3PAO outreach, ever. They are legally barred from recommending products
   to clients they assess under 32 CFR Part 170 and ISO 17020.
6. No second vertical until the first one has three customers. Healthcare,
   legal, defense, government, technology and global product pages already
   exist on the site. Six audiences addressed and none convinced.
