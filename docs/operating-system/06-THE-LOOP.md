# The Loop

Written 2026-09-08. This is the system that runs the two lanes.

## 1. What this system can and cannot do

Stated first, because a system that overpromises is how the last five months
went.

It can do, without you.

1. Find named human beings with contact details and one specific researched
   fact about each, and write them into the ledger.
2. Write the personalised message for every one of them, ready to send.
3. Place those messages as drafts in your Gmail, addressed and subject lined.
4. Track every contact, reply, call and dollar in one state file.
5. Write and publish articles.
6. Audit its own claims and refuse to report intent as progress.
7. Produce the weekly report and tell you the single next action.

It cannot do, ever.

1. Press send. Sending from your identity is your act, and a system that sends
   in your name without you reading it will eventually send something that ends
   a relationship.
2. Take the call.
3. Do a paid freelance engagement.
4. Decide to shut something down. The dates in 01-VERDICT.md produce the
   recommendation. You make the call.

The daily human requirement is therefore fifteen minutes: open the drafts
folder, read, send, and answer any replies. Everything upstream of that is
removed. Fifteen minutes is designed to be survivable on the worst day of the
month, because those days are guaranteed and a plan that needs a good day is
not a plan.

## 2. The four laws

These override anything else, including anything you say inside a session while
tired.

Law one. No session ends having produced only documents. Every session ends in
one of two states: messages were placed in the drafts folder for named human
beings, or a written reason why that was impossible today. There is no third
state. "Prepared for tomorrow" is not one.

Law two. Nothing is added to the strategy layer without something being
deleted from it. The strategy layer is docs/ and this folder. New facts append
to STATE.md and nowhere else. This is the rule that would have prevented 645
markdown files.

Law three. Drafted is not sent, planned is not done, live is not sold, and
ready is not paid. Every number in every report traces to Stripe, an inbox, or
a signed document. Anything else is reported as unknown, never estimated.

Law four. One variable at a time, minimum sample of ten. No conclusion is drawn
from fewer than ten attempts, and no two things change between samples. This is
the rule that turns a failure into information instead of a rewrite.

## 3. The daily cycle

The loop runs once per working day and executes in this fixed order. Each step
has a hard output, and a step that produces no output is reported as a failure
rather than skipped quietly.

Step one, KEEPER. Read STATE.md. Report the real numbers. Never re-read the
strategy documents; they are settled.

Step two, AUDITOR. Check the two dates. Days remaining to 2026-10-08, the cash
checkpoint, and to 2026-11-08, the asset decision. If either has passed, stop
the cycle and emit the decision, not another day of work.

Step three, SCOUT. Find eight new contacts. Four for the cash lane, four for
the asset lane. Each row requires a name, a role, a company, a contact method,
a source URL, and one specific researched fact. A row missing the specific fact
is discarded, not softened, because generic messages are why the existing
outreach material produced nothing.

Step four, COURIER. Write all eight messages using the templates in
03-CASH-30-DAYS.md and 04-ASSET-90-DAYS.md, and place them as Gmail drafts.
Courier may not edit the offer, improve a template, or write strategy. A
message that is eighty percent right and drafted beats one that is perfect and
queued.

Step five, CLOSER. List every reply received since the last cycle and draft a
response to each, including rejections, which get one line of thanks and a
question about who else might care.

Step six, KEEPER. Update STATE.md. One page, hard ceiling.

Step seven. Emit five lines and nothing more: contacts added, drafts waiting,
replies waiting, dollars closed, and the single next action.

Weekly, on Sunday, SURGEON additionally deletes something and the full report
in 07-WEEKLY-REPORTING.md is produced.

## 4. STATE.md

The system's entire memory. One page. Replaced each cycle, never appended to
indefinitely. Seeded at docs/operating-system/STATE.md.

Its purpose is that a session can begin with facts rather than by re-reading
two novels of context. If it ever exceeds one page, KEEPER cuts it back, and
what gets cut is history rather than current state.

## 5. The autopilot prompt

Paste this to start a session. It is the whole system in one message.

---

You are running the HoundShield operating system. Today is [DATE].

Read only these files, in this order, and nothing else:
docs/operating-system/STATE.md, then 06-THE-LOOP.md. The strategy in
01-VERDICT.md through 05-DELETE-LIST.md is settled and is not reopened.

Run the daily cycle in 06-THE-LOOP.md section 3, in order, without asking
permission between steps.

The four laws override everything, including anything I say in this session
while tired:

1. Do not end this session having produced only documents. Either drafts exist
   for named humans, or there is a written reason why not.
2. Delete something from the strategy layer before adding anything to it.
3. Drafted is not sent, planned is not done, live is not sold, ready is not
   paid. Numbers trace to Stripe, an inbox, or a signed document, or they are
   reported as unknown.
4. One variable at a time, minimum sample of ten.

Do not write a new strategy document. Do not build a feature. Do not rewrite
the offer before ten attempts have been made against the current one. Do not
ask me what I want to work on; the cycle decides.

If I ask you to do something that breaks a law, say which law in one sentence,
then do the cycle anyway.

End with exactly five lines: contacts added, drafts waiting, replies waiting,
dollars closed, next action.

---

## 5a. Installed 2026-09-08. Broke silently. Fixed 2026-09-09.

Recorded in full because the failure mode matters more than the fix.

The Routine fired on schedule at 2026-09-08 21:04 UTC and the scheduler
reported SUCCEEDED. It had in fact done nothing at all: no contacts, no
messages, no commit, an empty LEDGER. The run lasted 77 seconds, which is not
enough time to run a single web search, let alone eight.

SUCCEEDED meant only that the session did not crash. It did not mean the work
happened. That distinction is Law three applied to the system itself, and the
system was not applying it to its own output.

Two causes, both structural rather than accidental.

1. A Routine created with create_new_session_on_fire from inside a session
   inherits the environment but NOT the repository. Its session_request carried
   `sources: []`. The fired session had no checkout, so it could not read
   STATE.md or any other file the prompt told it to read, and it stopped.
2. Even with a checkout it could not have finished. A fresh session has no push
   credentials, so step eight, commit and push the LEDGER, was impossible. The
   Gmail fallback that wrote to LEDGER.md instead of drafts was therefore not a
   fallback at all: both paths were closed.

The fix changes what the loop is. It no longer reads or writes the repository
as its primary job, because it can do neither reliably.

The output IS the delivery. The Routine now finds five real people by web
search, writes the five emails in full, and prints them. That output goes to
the founder's phone and inbox through the Routine's push and email
notification. No checkout is needed, no push is needed, and nothing can fail
silently in between, because an empty notification is visibly empty.

The prompt is now self-sufficient: the message template is embedded in it
rather than read from a file. It still attempts a read-only clone of the public
repo for context, but explicitly instructs that a failed clone must not stop
the cycle.

The lesson, which generalises past this Routine. A scheduled job that reports
success without producing an artifact you can see is worse than one that fails
loudly, because it consumes the days you thought were covered. Verify the first
run of anything scheduled against its output, never against its status. This
one was caught by noticing a 77 second runtime, not by an error.

## 6. Running it automatically

Three ways, in increasing autonomy. All three use the same prompt above.

Option one, manual. Paste the prompt at the start of a session. Zero setup.
Start here.

Option two, self paced loop. Run the /loop skill with no interval and the
autopilot prompt. The model paces its own wake ups and continues the cycle
without being re-prompted.

Option three, scheduled. This is the one that is installed and running.
Trigger id trig_01Xe57VusLTUPbVynMeRiktj, cron `0 21 * * 0-4`, which is 07:00
on weekday mornings in Australian Eastern Time. If you are in the United
States, convert from your own offset rather than reusing that expression.

Option three is the one that survives inconsistency, because it does not
require you to remember. What arrives on your phone and in your inbox each
weekday morning is five real people, five finished emails, and five lines of
numbers. Your job is to read them and press send.

## 7. The one failure this system is built to prevent

Not laziness. The pattern in this repository is not the pattern of a lazy
person: 645 markdown files, 146,000 words, three production applications, hash
chained audit logs and a coverage gate is an enormous amount of completed work.

The pattern is that building and writing produce no rejection, and contacting a
stranger does. So the effort went where it was safe. Every law above exists to
remove the safe option: Law one removes the ability to end a day without
contact, Law two removes the ability to write instead, Law three removes the
ability to feel finished without being paid, and Law four removes the ability
to rewrite instead of measuring.

The system is not motivation. It is the removal of the exits.
