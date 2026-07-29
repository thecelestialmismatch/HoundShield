# Founder Email Identity — who HoundShield mail comes from, and where replies land

**Status:** shipped 2026-07-29. Code: `compliance-firewall-agent/lib/email/identity.ts`.
**Guard:** `lib/email/__tests__/email-identity-single-source.test.ts` (source-level).

---

## The one-paragraph version

Human email — outreach, sales, partner, founder-to-buyer — comes **from the
`FOUNDER_EMAIL` mailbox, signed with `FOUNDER_NAME` + "Founder, HoundShield"**.
Automated mail (receipts, password resets, drip) comes from
`noreply@houndshield.com`. Mail a human must act on — a $499 sale, a warm lead, an
RPO application, a contact-form message — is **delivered to `FOUNDER_EMAIL`**.
All of that is decided in one module. Nothing else may decide it.

**The founder's name and mailbox are NOT in this repository.** It is public, so
identity is configuration: set `FOUNDER_NAME` and `FOUNDER_EMAIL`. Unset, outreach
signs impersonally as "HoundShield" and alerts route to the published
`contact@houndshield.com` — degraded, never broken, and never leaking a private
address into a public artifact.

---

## What was broken (fixed in this change)

Four routes each resolved "the inbox a human must act on" independently, and two
of them disagreed:

| Route | Alert went to (before) |
|---|---|
| `api/stripe/webhook` — **the $499 sale alert** | `contact@houndshield.com` |
| `api/contact` — every contact-form lead | `contact@houndshield.com` |
| `api/report/snapshot-lead` — warm demo leads | `contact@houndshield.com` |
| `api/partners/apply` — **RPO/MSP application** | `info@houndshield.com` |

`FOUNDER_EMAIL` is not set in production, so those fallbacks were live. Two
consequences, one cosmetic and one not:

1. **The Stage-1 partner goal alerted a different mailbox than everything else.**
   Nobody chose that; it was two developers reaching for a plausible default months
   apart.
2. **`/api/contact` and `/api/report/snapshot-lead` published their routing address
   to the browser.** Both returned `fallbackEmail: <routing address>` when Resend was
   unconfigured. Point `FOUNDER_EMAIL` at a personal inbox and the contact form would
   have printed it to every visitor who hit the form during an outage.

Nine files also hardcoded their own `From` header, so changing the sending domain
meant editing nine places and hoping.

## What it looks like now

One module, two clearly separated kinds of address:

- **Routing address** (internal): `founderInbox()`. Where mail is delivered so a
  human acts on it. Set with `FOUNDER_EMAIL`. A malformed value is **ignored, not
  obeyed** — a typo there would silently swallow every revenue alert — so it falls
  back to the published inbox and `/api/health` reports the var as broken.
- **Published address** (public): `GENERAL_INBOX` = `contact@houndshield.com`.
  Printed on pages and returned to browsers. Never the routing address.

`lib/billing/founder-access.ts` reads the same configured value through this
module rather than touching `process.env` itself, so "who is the founder" and "who
does founder mail come from" cannot drift apart. It is **fail-closed**: with no
env set, no account receives the founder override.

---

## Sending and receiving are two different systems

This is the part that surprises people, and getting it wrong means an interested
buyer replies into a void:

- **Resend SENDS.** The domain `houndshield.com` is verified there, which is why
  password resets already work. Sending as any mailbox on that domain needs **no
  new DNS** — same verified domain, different local part.
- **Hostinger RECEIVES.** The mailboxes live there. A reply is only readable
  because the receiving mailbox exists.

So a send can succeed while replies bounce. Step 4 of the smoke test below is the
only step that proves the receiving half works — do not skip it.

### The SPF trap

Hostinger's own documentation is explicit: *"you must have only **one** SPF record
on your domain."* Two `v=spf1` TXT records produce a permanent error (`permerror`)
and mail starts failing authentication — which would take down password resets and
receipts along with outreach.

If both Hostinger email and Resend send for this domain, the two includes must be
**merged into a single record**, in the form Hostinger documents:

```
v=spf1 include:_spf.mail.hostinger.com include:<the value Resend shows you> ~all
```

**Do not copy an include value from memory or from this doc.** Resend generates
SPF and DKIM records **per domain** — take the exact values from
Resend → Domains → `houndshield.com` → **Records**. Anything else is a guess.

---

## Runbook: prove the sender works (do this before emailing a single buyer)

### 1. Confirm the mailbox exists

hPanel → **Emails** → select `houndshield.com`. Confirm the mailbox you intend to
use as `FOUNDER_EMAIL` is listed. If not: **Create email account** → set the local
part you want → set a password.

### 2. Check there is exactly one SPF record

hPanel → **Domains** → `houndshield.com` → **DNS / Nameservers**. Filter to TXT.
Count the records beginning `v=spf1`. If there is more than one, merge them into a
single record as above and delete the extras. (Any public SPF checker will also tell
you — search for one and enter `houndshield.com`.)

### 3. Send the smoke test

From `compliance-firewall-agent/`:

```bash
# Preview it. Sends nothing.
npm run email:preview -- --template smoke-test --to you@some-inbox-you-own.com

# Send it for real.
RESEND_API_KEY=re_... npm run email:send -- \
  --template smoke-test --to you@some-inbox-you-own.com --confirm
```

Dry run is the default; `--confirm` is required to actually send.

### 4. Check the four things the email tells you to check

The smoke-test email contains its own non-technical checklist: that it arrived, that
it is in the inbox rather than spam, that the sender reads
your configured name and mailbox with no "via" line, and — the important one —
that hitting **Reply** addresses that mailbox and that the reply actually arrives.

If all four pass, outreach can go out.

---

## Sending real outreach

```bash
npm run email:preview -- --template healthcare \
  --to dana@theirrealdomain.org \
  --first-name Dana --organization "Ridgeview Family Medicine"
```

Drop `email:preview` for `email:send … --confirm` when the preview reads right.

Four drafts: `smoke-test`, `healthcare`, `partner`, `defense`. Each buyer-facing
draft carries a five-step, jargon-free "try it yourself" guide whose final step lets
a non-technical reader **prove the local-only claim by turning off their Wi-Fi and
scanning again**. A claim the buyer can verify without trusting us is worth more than
any assurance we could write.

### What the tool refuses to do

By design, and each refusal exits non-zero:

- **Sending without `--confirm`.** Dry run is the default; you cannot unsend a bad
  first impression.
- **More than one recipient per run.** There is no `--to-file`, no CSV, no loop.
  This is a tool for a founder writing to a person. Volume without per-recipient
  thought is how a sending domain dies — and this domain also carries password
  resets.
- **Placeholder recipients.** Reserved example domains and unfilled template text
  are refused.
- **Unfilled personalisation.** `--first-name "[First name]"` throws rather than
  greeting a real Privacy Officer with a bracket.

Honest limit: none of that verifies a human actually exists at an address. That is a
research step you own — see `docs/OUTREACH-SOURCING-RUNBOOK.md`.

---

## Optional: route alerts somewhere with phone notifications

Set these in Vercel (project `compliance-firewall-agent`, **Production** ticked) —
and in a gitignored `.env.local` for local sends:

```
FOUNDER_NAME=<the name outreach is signed with>
FOUNDER_EMAIL=<the mailbox you actually read>
```

Also set `FOUNDER_ACCESS_EMAILS` (or rely on `FOUNDER_EMAIL`) or the founder
console override stays off — it is fail-closed by design.

A malformed value is ignored and reported as broken by `/api/health` rather than
silently swallowing alerts.
