# Personas

Written 2026-09-08. Three sets. Buyer personas for HoundShield, one buyer
persona for the cash lane, and the operator personas that run the system.

A persona here is not a mood board. It earns its place only if it answers five
questions: where this person is found, what event makes them care this month,
the sentence that gets a reply, the objection that kills the sale, and the
signal that says walk away. Anything else was cut.

---

# Part one: HoundShield buyers

## PRIMARY. Dale, the MSP owner or vCIO

This is the buyer to work first, and the only one worked in the first 30 days
of the asset lane.

Who. Owner, vCIO, or head of client strategy at a managed service provider
with 5 to 40 staff, serving 20 to 120 small and mid size clients. Often the
founder. Often still does sales personally. Decides alone. No procurement, no
committee, no security review of a 499 dollar purchase.

Market size. 40,000 to 50,000 MSPs operate in the United States.

The trigger event. Dale is losing deals he used to win. The Kaseya 2026 State
of the MSP Report, from more than 1,000 MSPs, found 71 percent name winning new
customers as their single biggest challenge, with 22 percent blaming increased
competition from other MSPs and 19 percent naming their own inability to
quickly demonstrate value to a prospect. Dale is that 19 percent. He walks into
a prospect meeting with a capability deck that looks like every other MSP's
capability deck.

What he actually buys. Not software. A thing to put on the table in a prospect
meeting that no competing MSP has. The 499 dollar report is that object: a
signed PDF showing the prospect's own staff pasting regulated data into public
AI tools, mapped to named NIST 800-171 and HIPAA controls.

His arithmetic, which is the entire pitch. 2026 pricing research puts MSP
compliance advisory at 150 to 300 dollars per hour and small business vCIO
retainers at 1,500 to 3,000 dollars per month, and reports that over half of
assessment clients convert to ongoing advisory engagements. Dale spends 499
once. One converted 2,500 per month retainer is 30,000 dollars in year one.
That is a 60 to 1 return and it is why this is the easiest yes in the entire
analysis.

Where to find him. Reddit r/msp, which is where MSP owners argue candidly. The
Cyber AB Marketplace RPO listings. ChannelE2E and MSP Success comment sections.
LinkedIn filtered to title vCIO or owner, industry IT services, headcount 5 to
50, United States. Local IT service directories by metro.

The sentence that gets a reply. Lead with his problem, not the product.
Something in the shape of: "You are pitching against three other MSPs who all
say the same things about security. Here is one thing none of them will bring
to the meeting." Never open with CMMC, never open with AI firewall, never open
with the word compliance.

The objection that kills it. "I already sell a security assessment." He does,
and it is usually a vulnerability scan or a Microsoft Secure Score export. The
answer is that his current assessment shows what could go wrong, and this one
shows what already did, with the prospect's own staff named in it. Fear of a
hypothetical does not close. Evidence of a fact does.

Walk away when. He has fewer than 10 clients, or he asks for per seat pricing
and multi tenant billing before he has bought one report. The per seat
conversation is a real product gap documented in docs/gtm/MSP-CHANNEL-RESEARCH.md
and it is a 2027 problem. Do not build toward it to win one deal.

## SECONDARY. Marcus, the law firm IT director

Worked from day 31, not before.

Who. IT director or director of operations at a 50 to 300 attorney firm.
Budget 500 to 2,000 dollars per month. No FedRAMP requirement, so the Vercel
architecture problem never comes up.

The trigger event. Every major state bar issued AI ethics opinions across 2024
and 2025. Attorney client privilege plus the Kovel doctrine creates a genuine,
documented monitoring duty, and an attorney pasting privileged communications
into a consumer chatbot is a live professional responsibility exposure, not a
theoretical one. Marcus knows this and currently has no way to detect it.

The sentence that gets a reply. Name his own state bar's opinion by number and
date, then ask one question: does he currently have any way to know whether it
has already happened. He does not, and that is uncomfortable enough to
produce a reply.

The objection that kills it. "Our policy says not to." A policy is not a
control and he knows it. Ask what evidence he would produce if a client asked
him to prove the policy was followed.

Walk away when. The managing partner has to approve a 499 dollar purchase.
That firm's cycle is six months and it is not this quarter's business.

## TERTIARY. Rachel, the healthcare privacy officer

Do not work this persona in the first 60 days. It is documented so the decision
to defer it is deliberate rather than forgotten.

Who. Privacy officer, compliance officer, or CISO at a 50 to 300 person
physician group. Budget 299 to 799 dollars per month. No FedRAMP requirement.

The trigger event. Netskope Threat Labs Healthcare 2025 found 89 percent of
healthcare data policy violations tied to generative AI involve regulated data,
against 31 percent across all industries, and that 71 percent of healthcare
genAI users use personal genAI accounts. ChatGPT is not HIPAA compliant without
a BAA, and only Enterprise and API tiers offer one.

Why deferred. Healthcare privacy officers are structurally risk averse toward
unknown vendors, ask for a BAA in the first reply, and route purchases through
a committee. The pain is the most real of any persona here and the cycle is the
one least compatible with needing money.

Walk away when. The first reply asks for a BAA or a SOC 2 report. Both are
correct asks and neither can be answered yet. Log the contact for later and
move on without arguing.

## DEFERRED. Jordan, the defense contractor security manager

Explicitly parked, with one narrow exception.

Who. IT security manager at a 50 to 500 person DoD subcontractor.

Why parked. Phase 2 enforcement was suspended 2026-07-13. The cycle was already
90 to 180 days, the deal needs Docker mode plus a SOC 2 Type I that does not
exist, and a C3PAO assessor will flag the Vercel management plane. Every
structural blocker in this business lives in this persona.

The one exception. The Reform Task Force report is expected publicly on or
about 2026-09-28. That is a dated news event with a guaranteed audience of
exactly these people, and it is worth exactly one piece of content, described
in 04-ASSET-90-DAYS.md. It is not worth an outreach campaign.

Never do. Do not pitch C3PAOs as a referral or endorsement channel. They are
barred under 32 CFR Part 170 and ISO 17020 cooling off rules from recommending
products to clients they assess. This has been in the plan as a top idea and it
is illegal for them to accept.

---

# Part two: the cash lane buyer

## Priya, the founder who needs the thing shipped

This is the persona that pays rent. It is the only persona in this document
attached to a 30 day timeline.

Who. Non technical or semi technical founder of a small company, or a marketing
or operations lead at a company of 10 to 200 people. Has budget between 1,500
and 6,000 dollars for one piece of work. Has an existing app, site, or manual
process. Does not want a development agency and cannot wait six weeks for a
statement of work.

The trigger event. Something is half built and stuck. A Stripe integration
that does not reconcile. A Supabase auth flow that breaks on password reset. A
Next.js app a previous contractor abandoned. A manual process that takes a
person eight hours a week. She is not shopping for a developer. She is trying
to make a specific thing stop being broken.

What she buys. Certainty. A fixed price, a fixed date, and evidence that the
person has finished something before.

Why this is a strong offer today. Freelance rates in the United States for mid
to senior full stack work run 60 to 175 dollars per hour in 2026, and Next.js
specialists in North America sit at 75 to 85 dollars per hour at the senior
band. Three live, deployed, non trivial applications exist as proof of work:
Stripe checkout with webhook and a daily reconciliation cron, Supabase auth
with scrypt hashing and opaque sessions, hash chained tamper evident audit
logs, Docker Compose deployment, a zero egress build audit in CI, and an 80
percent coverage gate. That portfolio is above the median of who Priya is
otherwise going to hire.

The sentence that gets a reply. A specific observation about her specific
problem in the first line, and a fixed price with a date in the third. Never a
rate. Never availability. Never a list of technologies.

The objection that kills it. "How do I know you will finish." Answer it before
she asks by scoping the first engagement small enough to complete in under a
week and by linking one live URL she can open right now.

Walk away when. She wants an ongoing hourly relationship with no defined
outcome, or she wants equity instead of money. Neither pays rent.

---

# Part three: the operator personas

These are the roles the system runs as. They are not people to hire. They are
the six hats the loop wears, and each one exists to stop a specific failure
that already happened in this project.

## SCOUT

Owns. Finding named human beings with contact details.
Produces. Rows in the contact ledger. Name, role, company, source, contact
method, and the one specific fact that makes the first line of the message non
generic.
Hard rule. A row without that specific fact is not a row. Generic messages are
the reason 146,000 words of outreach material produced zero conversations.
Exists because. The last four months produced targeting methodology and zero
targets.

## COURIER

Owns. Sending. Only sending.
Produces. Messages actually delivered to actually existing humans, and a dated
record of each one.
Hard rule. Courier may never write strategy, may never edit the offer, and may
never improve a template. A message that is 80 percent right and sent beats a
message that is 100 percent right and queued, and the entire history of this
project is the second one.
Exists because. advisory/cold-outreach-batch-1.md set a target of 30 emails by
2026-04-24 and there is no evidence any were sent.

## CLOSER

Owns. Everything after a reply.
Produces. Booked calls, answered objections, sent invoices, collected money.
Hard rule. Every reply gets a response within one working day, including
rejections, which get one line of thanks and a question about who else might
care. A dead lead who names a live one is worth more than a new cold contact.

## AUDITOR

Owns. Telling the truth about numbers.
Produces. The weekly report in 07-WEEKLY-REPORTING.md, filled with counts that
came from a source, not from memory.
Hard rule. Auditor never reports intent. Drafted is not sent. Planned is not
done. Live is not sold. If a number cannot be traced to Stripe, an inbox, or a
signed document, it is reported as unknown rather than estimated.
Exists because. This project has repeatedly reported readiness as progress.

## SURGEON

Owns. Deletion.
Produces. Fewer files, fewer projects, fewer open questions.
Hard rule. Surgeon runs once a week and must remove something every time.
Nothing new may be added to the strategy layer without something being deleted
from it.
Exists because. 645 markdown files, 13 competing master prompts, five roadmaps.

## KEEPER

Owns. Continuity across sessions, so the system survives inconsistency.
Produces. The state file, updated at the end of every session, so that the next
session begins with facts instead of a re-read of two novels' worth of context.
Hard rule. Keeper writes state, never strategy. The state file has a fixed
shape and a hard ceiling of one page.
Exists because. Inconsistency is the stated constraint. A system that requires
continuous attention has already failed the person it was built for.

## The one rule above all six

The system is not allowed to end a working session having produced only
documents. Every session ends in one of exactly two states: a message was sent
to a named human being, or a written reason why that was impossible today. There
is no third state, and "prepared for tomorrow" is not one of them.
