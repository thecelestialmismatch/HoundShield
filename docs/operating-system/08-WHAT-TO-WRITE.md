# What To Write

Every message you need, finished. Change the bracketed bits and send. Do not
improve them, do not make them more professional, do not add a paragraph
explaining yourself.

## The rule underneath all of these

You are one person who builds working software with AI tooling, fast, and you
have three live things to prove it. That is the whole pitch and it is true.

Never claim to be a team. Never claim years of experience you do not have.
Never claim to know a technology you have not used. You do not need any of
that, because the refund line does the work those lies would have done: it
moves the risk off the buyer and onto you, and you can carry it, because if you
cannot finish you give the money back and nobody is hurt.

One consequence, and it is not optional. Only take a job you believe you can
actually finish. If you get halfway and it is beyond you, refund immediately
and say so plainly. One refunded job costs you a few days. One job taken,
botched and argued over costs you the referral, the review, and the name.

---

## 1. The warm message

The one that matters most. Send to everyone. Do not decide in advance who will
say no, because you will be wrong and you will filter out the person who says
yes.

> Hey [name],
>
> Bit of an awkward message, but here goes.
>
> I've lost my job and I'm picking up freelance work while I sort myself out.
>
> What I do is build and fix web stuff. Payments, logins, small apps. Two
> things I've built and run myself: houndshield.com and ripodoc.com.
>
> Two ways you could help, if either one fits:
>
> If something at [their company] is broken or half-finished, I'll give you a
> fixed price for it this week.
>
> If not, do you know anyone whose website or app is doing their head in? That's
> the kind of thing I fix.
>
> No stress either way, and good to hear from you regardless.
>
> [your name]

Why it works. It is short. It tells the truth without asking for pity. It gives
two ways to say yes and an easy way to say nothing. "Bit of an awkward message"
is the most important line in it, because it says out loud what they are
already thinking, and that makes them relax.

Send it one at a time with the name changed. Never as a group email, never
bcc'd. People can tell, and the whole value of this message is that it is
personal.

## 2. When they ask what you actually do

> Mostly three things.
>
> Payments. Stripe checkout that works, and that doesn't quietly lose orders
> when something fails in the background.
>
> Logins. Sign up, sign in, password reset, and the security bits underneath
> that most people skip.
>
> Small web apps, and rescuing half-built ones somebody else walked away from.
>
> I work with AI tooling, which is how I can do in days what used to take
> weeks. houndshield.com and ripodoc.com are both mine end to end. The code is
> public if you or your developer want to look:
> github.com/thecelestialmismatch
>
> Tell me what's annoying you and I'll tell you straight whether I can fix it
> and what it would cost.

Say the AI part. Do not hide it. It is 2026, it is normal, it explains your
speed, and if you conceal it and they find out later, you have handed them a
reason to distrust everything else you said.

## 3. When they say yes

Do not write a proposal. Do not book a call to "scope it." Send this.

> Good. Here's how I'd do it.
>
> What you get: [one plain sentence. "A checkout that works and a job that
> catches any order the webhook drops."]
>
> Price: $[X]. Fixed, not hourly. It doesn't go up.
>
> Done by: [day and date].
>
> Half up front so I can start, half when it's working. I'll send you a payment
> link for the first half and I start the day it clears.
>
> If it's not working by [date], I refund the deposit. No argument, no
> conditions.
>
> Want me to send the link?

Then send the Stripe payment link the moment they say yes. Not tomorrow. The
gap between "yes" and "paid" is where deals die.

## 4. When they say no

Always reply. This is the cheapest lead source you have.

> All good, thanks for reading it.
>
> One favour if you don't mind. Can you think of anyone with a website or app
> that's half-broken or half-finished? That's exactly what I fix, and an
> introduction would help me more than anything right now.
>
> Either way, appreciate you getting back to me.

A no that names someone else is worth more than a fresh cold contact. Most
people genuinely want to help and just need to be told how.

## 5. When they go quiet

Once. Seven days later. Then stop.

> Hey [name], just floating this back up in case it got buried. No worries at
> all if it's not a fit.

Two lines. Never guilt, never "just checking in again," never a third follow up.

## 6. The cold one, when you can see something broken

Only send this when you have actually reproduced the problem yourself. The
specific broken thing is the entire value of the message. Guessing wrong
destroys it.

> Subject: your checkout is failing on [the specific step]
>
> Hi [name],
>
> This is a sales email, but it starts with something real.
>
> I tried [the exact thing you did] on [their site] and [exactly what happened].
> [One line on what usually causes that.]
>
> If you already know about it, ignore me.
>
> If you don't, that's the sort of thing I fix. Fixed price, fixed date, and
> your money back if I don't fix it. I've built and run houndshield.com and
> ripodoc.com on the same stack.
>
> Want me to send you a price?
>
> [your name]

## 7. Upwork

The only job is proving in the first two lines that you read the posting.
Everyone else pastes a template, and clients can spot one instantly.

> [One sentence naming their exact problem and the likely cause. Example: "A
> webhook that fires but never updates the order row is nearly always either a
> signature check failing or a duplicate event being processed twice, and both
> leave the money in Stripe while your database never hears about it."]
>
> I've built this exact path in production: Stripe checkout, a verified
> webhook, and a daily job that re-reads paid sessions and picks up anything
> the webhook dropped. It's live at houndshield.com and the code is public at
> github.com/thecelestialmismatch/HoundShield.
>
> $[X] fixed, [N] days. You get working checkout, the webhook verified, the
> recovery job, and a short written note on how it can still fail and what
> happens when it does.
>
> If it's not fixed, you don't pay.
>
> One question so I can be sure of the price: [something specific that proves
> you read the whole posting].

Apply only to jobs posted in the last couple of hours. Skip anything with more
than about thirty proposals. Being early beats being polished.

## 8. What never to write

Never "I'm passionate about." Never "I'd love the opportunity to." Never "Let
me know if you have any questions." Never a paragraph about your journey.

Never an hourly rate. Fixed price with a date, every time.

Never "let's jump on a quick call to explore" before there is a price on the
table. Calls before prices are how a week disappears.

Never send anything longer than the messages above. Every extra sentence
lowers the chance it gets read at all.
