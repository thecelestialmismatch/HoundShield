# The Operating System

Created 2026-09-08. Read this page, then 01-VERDICT.md. Nothing else is needed
to start.

## The situation this answers

Three projects, zero paying customers, no job, no budget, and a need for
roughly 7,000 dollars. The question put was whether to pivot, shut down, or
continue.

## The answer in six lines

1. Rent is a 30 day problem and no compliance software company solves a 30 day
   problem. That lane sells skill and finished work, starting today.
2. HoundShield is a 90 to 180 day problem. Keep it. One buyer, one offer, no
   feature work.
3. RipoDoc is parked. Site stays up, nothing gets built, revisit only on a
   customer request or on 2026-11-08.
4. VibeFlow is archived today. It is three abandoned ideas sharing a folder.
5. The products were never the problem. The copy removed the offer, and 146,000
   words of strategy got written instead of emails getting sent.
6. Two dates are fixed and do not move: 2026-10-08 and 2026-11-08.

## The files

1. 01-VERDICT.md. The decision and the evidence behind it. Read this second.
2. 02-PERSONAS.md. Who to contact, where they are, what makes them reply, and
   the six operator roles the system runs as.
3. 03-CASH-30-DAYS.md. The plan that pays rent, with the messages written and
   ready to send.
4. 04-ASSET-90-DAYS.md. HoundShield, narrowed. Includes the replacement pricing
   page copy, finished.
5. 05-DELETE-LIST.md. What goes, with the evidence for each.
6. 06-THE-LOOP.md. The system that runs it, including the autopilot prompt.
7. 07-WEEKLY-REPORTING.md. The one page the system shows you each Sunday.
8. 08-WHAT-TO-WRITE.md. Every message, finished, in plain language.
9. STATE.md. The system's memory. One page, always current.

Executable: scripts/cleanup-strategy-sprawl.sh, which performs the deletions in
05-DELETE-LIST.md. It has not been run.

## Start here, in this order

1. Check Stripe Payments by hand. STRIPE_WEBHOOK_SECRET has never been set, so
   "zero customers" currently means "zero the system could have noticed." This
   takes two minutes and it is the only unverified number in the whole plan.
2. Send the warm network message in 03-CASH-30-DAYS.md section 4c to everyone
   you know. It has the highest close rate of any channel here and it is the
   one that feels worst to send. That is why it is first.
3. Replace the pricing page copy with the finished text in 04-ASSET-90-DAYS.md
   section 1.
4. Archive VibeFlow on GitHub.
5. Run scripts/cleanup-strategy-sprawl.sh --apply.
6. Start the loop with the prompt in 06-THE-LOOP.md section 5.

Items 1 and 2 are worth more than 3 through 6 combined.

## The rule that matters most

No day ends having produced only documents. Either a message reached a named
human being, or there is a written reason why not.

That single rule is the difference between this folder and the 645 markdown
files it was written to replace.
