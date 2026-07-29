# Outreach Sourcing Runbook — how to get genuine recipients

**Purpose:** a repeatable process for finding real people to email, with a
verification step, so no draft ever goes to a guessed address.

**The rule this exists to enforce:** never invent, pattern-guess, or infer an email
address. `first.last@company.com` is a guess even when it happens to work — and the
send tool refuses addresses that look like guesses (`lib/email/identity.ts`).

**Why this matters beyond etiquette:** `houndshield.com` carries password resets and
purchase receipts on the same sending reputation as outreach. A batch of bounces or
spam complaints does not just lose the batch — it degrades delivery of mail your
paying customers depend on. Guessing is a product-reliability risk, not only a
manners problem.

---

## The standard: what counts as a genuine address

An address is genuine when **you saw it published by the organisation itself, or the
person gave it to you.** In practice:

✅ **Acceptable sources**
- The organisation's own website: contact page, staff/leadership directory,
  "compliance" or "privacy" page, press releases.
- A HIPAA Notice of Privacy Practices — these are legally required to be published
  and frequently name the Privacy Officer with a direct contact.
- A conference speaker page, webinar listing, or panel bio.
- A public regulatory or licensing filing.
- The Cyber AB Marketplace listing for an RPO (for partner outreach).
- A LinkedIn post or profile where the person published their address themselves.
- They emailed you, filled in the contact form, or handed you a card.

❌ **Not acceptable**
- Any `first.last@`, `finitial.last@` pattern you constructed yourself.
- An address produced by an email-permutation or "email finder" guessing tool.
- A scraped list, a purchased list, or a list from a data broker.
- An address for a person whose role you are inferring rather than confirming.

If you cannot find a published address, the correct outcome is **skip that
organisation**, not guess. There are ~6,000 US hospitals and tens of thousands of
physician groups; the constraint is your time, not the supply of prospects.

---

## Step 1 — Build the organisation list (30 min)

Aim for 30 organisations before writing a single email. Filter as you go.

**Healthcare (the lead buyer since the 2026-07-28 pivot):**
- Independent physician groups and specialty clinics, **50–300 staff**. Below 50
  there is no Privacy Officer to sell to; above ~300 you hit committee procurement
  and a 6-month cycle.
- Prefer organisations that have **publicly announced an AI or "digital front door"
  initiative** — a press release, a job posting mentioning AI, a vendor
  case study. They have already accepted that staff use AI, which removes the
  hardest objection.
- Deprioritise anyone visibly inside an Epic/Microsoft enterprise agreement — they
  will be told Purview covers it.

**RPO / MSP (channel #1, the 0/1 Stage-1 goal):**
- Start from the **Cyber AB Marketplace**, filtered to RPOs.
- **Exclude every C3PAO.** 32 CFR Part 170 and ISO 17020 cooling-off rules bar an
  assessor from recommending tools to clients they assess. Pitching them is a legal
  problem for *them*, and it will end the conversation badly. Some firms are both —
  if in doubt, skip.
- Prefer firms with 10–100 clients, publishing CMMC content, without an existing AI
  security partnership.

**Defense (longer cycle — build pipeline, do not wait on it):**
- Subcontractors with a filed SPRS score, 50–500 staff.
- Sell **FCA liability**, never a deadline. CMMC Phase 2 was suspended 2026-07-13;
  citing the November gate is false and trivially disprovable.

Record in a sheet: organisation, size, why they qualify, source URL.

## Step 2 — Find the right human (5 min each)

Titles that actually own this problem, in order:

- **Healthcare:** Privacy Officer · Compliance Officer · HIPAA Security Officer ·
  CISO · IT Director. In a 50–300 person group these are often one person, sometimes
  the Practice Administrator.
- **RPO/MSP:** Principal · Founder · Practice Lead (CMMC) · Director of Compliance
  Services. Small firms: go to the principal.
- **Defense:** IT Security Manager · Compliance Manager · Facility Security Officer.

Where to look, in order: the org's own staff/leadership page → their Notice of
Privacy Practices → LinkedIn (to confirm the *role*, then find the address
elsewhere) → conference speaker bios.

## Step 3 — Verify the address (2 min each — do not skip)

For every address, record **which of the acceptable sources above it came from and
the URL**. If you cannot write that down, you do not have a genuine address.

Two extra checks worth the seconds:
1. **Does the domain match the organisation's real website?** Look-alike domains are
   a common data-broker artifact.
2. **Is the role current?** A Privacy Officer who left in 2024 is a bounce.

Then confirm the tool agrees:

```bash
npm run email:preview -- --template healthcare \
  --to <the address> --first-name <Name> --organization "<Org>"
```

A refusal means the address looks like a placeholder or a guess. Do not work around
it — go back and find a published address.

## Step 4 — Send, one at a time (2 min each)

```bash
RESEND_API_KEY=re_... npm run email:send -- --template healthcare \
  --to dana@theirrealdomain.org \
  --first-name Dana --organization "Ridgeview Family Medicine" --confirm
```

**Run the smoke test first** (`docs/FOUNDER-EMAIL-IDENTITY.md`) — one email to a real
prospect from a misconfigured domain costs more than the hour of setup.

Rules that matter more than volume:
- **One at a time, personalised.** The draft's `--organization` appears in the
  subject line; that is the entire reason it gets opened.
- **~10 per day, not 30 in an hour.** A new sending identity that emits 30 cold
  emails in one burst looks exactly like a compromised account.
- **Read each preview before confirming.** If the first line would not survive the
  recipient reading it aloud to a colleague, rewrite it.

## Step 5 — Follow up once, then stop

One follow-up, five days later, in the same thread. Never two. Offer a one-word exit
("just reply 'handled' and I'll stop") — a fast no is worth more than a slow maybe,
and it keeps you out of spam folders.

Honour every opt-out immediately and permanently. Under CAN-SPAM a commercial email
needs a working opt-out and a real physical postal address; a genuine one-to-one
founder email asking for a conversation is a different thing from a marketing blast,
but "reply and I'll stop" must be true, and it must be honoured the first time.

---

## Track it

| Field | Why |
|---|---|
| Organisation, contact name, title | Personalisation |
| Address + **source URL** | The verification record. Non-optional. |
| Date sent, draft id | Follow-up timing |
| Reply / no reply / opt-out | Opt-outs are permanent |
| Objection heard | The real output of the first 30 |

**The measure of the first 30 is not sales — it is objections.** Ten replies
telling you why they will not buy is a more valuable asset than one confused yes.
Log the objection verbatim; it rewrites the drafts and, sometimes, the product.
