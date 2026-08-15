# Pre-launch audit — 2026-08-15

Written for the Monday release. Brutally honest by request: this records what was
verified, what was fixed, and what is still broken — including the things that
cannot be fixed from code.

**Verification standard used here:** a claim is only made if a command was run or
a page was rendered and looked at. Anything unverified is labelled so. Production
itself could **not** be probed from the build container — its egress proxy blocks
`www.houndshield.com` (`curl: (56) CONNECT tunnel failed, response 403`), so every
statement about the live site is inferred from the repository and from CI, not
measured against the running site.

---

## 1. The launch blocker — nothing ships until this is clicked

**Production has not deployed since #288, and this PR proves it.**

The Vercel preview build for PR #294 came back `Error` within seconds of the push.
That is the same failure recorded on 2026-08-14: the Vercel project's **Root
Directory** was never set to `compliance-firewall-agent`, so every build dies at
the first step:

> No Next.js version detected. Make sure your package.json has `next` in either
> dependencies or devDependencies. Also check your Root Directory setting matches
> the directory of your package.json file.

**Fix (founder-only, ~30 seconds):**
Vercel → project `compliance-firewall-agent` → Settings → Build & Deployment →
**Root Directory** → `compliance-firewall-agent` → Save → Redeploy.

No code change can do this. `rootDirectory` is a project setting, not a
`vercel.json` key, and the Vercel API exposes it only at project creation.

**What this means for Monday.** The live site is up and serving — Vercel keeps
the last good deployment — but it is the **pre-#292 build**. Everything merged
since #288 is on `main` and *not live*, including the entire legal-surface
correction from #292 and the email work in #294. Merging more PRs does not change
this. Until the Root Directory is set, the repository and the website are two
different products.

**Verify it worked** (run after redeploying, and read the actual values):

```bash
curl -s https://www.houndshield.com/api/health | jq
curl -s https://www.houndshield.com/terms | grep -c "Governing Law"   # expect 1, was 0
```

---

## 2. What was fixed in this pass (PR #294)

The founder's report was: people who write in get a message with no links, no
logo, and no answer to what they asked. Investigating that turned up three
separate defects.

### 2.1 The contact form never replied to anyone

`/api/contact` sent exactly one email — an internal alert to the founder — and
nothing to the person who submitted the form. Every *other* inbound rail already
acknowledged its sender:

| Rail | Founder alert | Reply to sender (before) |
|---|---|---|
| `/api/contact` | yes | **none** |
| `/api/partners/apply` | yes | yes (`partner-welcome`) |
| `/api/report/snapshot-lead` | yes | yes (inline) |
| Stripe `$499` webhook | yes | yes (`report-order`) |

The widest funnel on the site was the one that answered with silence, while the
page promised a reply "within 4 business hours".

**Fixed:** `lib/email/templates/contact-received.ts` now answers each of the five
subject options the form offers, quotes the visitor's message back, and links
real pages. It is topic-templated, not LLM-composed — a stranger's message never
reaches a commercial endpoint, and no generated sentence can make an unreviewed
compliance claim to a buyer.

### 2.2 No email in the entire repository contained a logo

Not one `<img>` existed in any outbound message. The doberman mark shipped in the
PDF report and on the website, but never in the mail a buyer opens first. Eleven
send paths each carried their own copy of the chrome; three of them had no chrome
at all and reached buyers as bare `<h2>`/`<p>` fragments.

**Fixed:** `lib/email/shell.ts` is now the single header/footer/button/escaper,
used by all seven templates and the routes that had none.

**The part worth reading.** The logo defect had a second layer that no test could
have caught. The brand assets are a *near-black* doberman shield, so on the
existing `#0f172a` header band the mark was invisible. Seating it in a small
white chip — the way the PDF cover does — only traded invisible for illegible: at
30px the shield's interior detail collapses into a grey smudge. This was only
found by rendering the message and looking at it; every assertion passed the
whole time. The band is now light (matching the site's own landing surface) with
the mark at 44px, and guards pin both.

### 2.3 Links that redirect, and a guard that had stopped biting

Two email links still hardcoded `https://houndshield.com`, the apex host Vercel
308s to `www`. #290 single-sourced twenty-nine such copies but missed these,
because they live inside template literals in API routes rather than in metadata.

The outreach test that was supposed to catch scheme-less links had also silently
stopped working: its negative lookbehind for `//` passes on `www.`, so the check
would not have caught a genuinely bare-domain link. Rewritten to strip schemed
URLs first, then assert nothing remains.

Also: `escapeHtml` existed in four near-identical copies that had drifted —
`report-order`'s did not escape the apostrophe.

### 2.4 Gates run

| Gate | Result |
|---|---|
| App test suite | **2888 passed** / 204 files, 0 failed |
| Proxy test suite | **92 passed** / 4 files, 0 failed |
| `npx tsc --noEmit` | exit 0 |
| `npx eslint` (changed paths) | 0 errors (1 pre-existing warning, untouched) |
| `npm run build` | exit 0, 232 static pages |
| Every email rendered + visually inspected | yes — this is what found 2.2 |

---

## 3. CAN-SPAM / legal position on the new email

The new reply carries **no unsubscribe link**, deliberately. It is a
§7702(17) transactional/relationship message — a direct reply to a request the
recipient initiated — in the same class as `partner-welcome` and the `report-order`
receipt. `lib/legal/marketing-email.ts` documents this exemption explicitly.

This is not a loophole being leaned on: attaching `marketingFooter()` would make
the reply **fail closed** and send nothing at all while `MARKETING_POSTAL_ADDRESS`
is unset — i.e. it would silently swallow the acknowledgement it exists to send.

The repo's fail-by-default guard (`marketing-email-contract.test.ts`) caught the
new template as unclassified and forced this decision rather than allowing a
silent exemption. That guard is working.

**Still true and unchanged:** the day3/day7/day14 marketing drip stays **dark**
until `MARKETING_POSTAL_ADDRESS` is set. That is correct behaviour, not a bug —
sending those without a postal address is a per-message statutory violation.

---

## 4. Open items — founder-only, cannot be fixed from code

Ordered by what would hurt most on Monday.

| # | Item | Impact if left | Effort |
|---|---|---|---|
| 1 | **Vercel Root Directory** (§1) | Nothing ships. The site stays on the pre-#292 build. | 30 sec |
| 2 | `RESEND_API_KEY` set in Production? | If unset, `/api/contact` returns 503 and the new reply never sends. The form degrades honestly (tells the visitor to email direct) but every lead becomes manual. | 1 min |
| 3 | `FOUNDER_EMAIL` set in Production? | Unset, founder alerts route to the published `contact@` inbox instead of a phone-notified one. Degraded, not broken. | 1 min |
| 4 | `MARKETING_POSTAL_ADDRESS` | Onboarding drip stays dark. Correct default; set it only when you have an address you are willing to publish (a PO box or registered agent satisfies §7704(a)(5)). | varies |
| 5 | Migrations **029, 030, 033, 034** unapplied | 033 is the restrictive deny-all on the Better Auth tables and 034 is the marketing opt-out column — 034 is a prerequisite for the drip ever being lawful. | manual |
| 6 | `OPENROUTER_API_KEY` unset | Brain AI is dead. Per the project rules it must not appear on the homepage without the CUI warning live. | — |

**On #5:** migrations in this repo will never auto-apply. The Supabase GitHub
integration watches the **repo root** `supabase/` directory, which does not exist
here — the migrations live under `compliance-firewall-agent/supabase/`. The bot
confirmed this again on PR #294 ("no changes detected in `supabase` directory").
This is the same deploy-topology mismatch as the Vercel Root Directory problem and
the missing `crons` key. One misplaced directory has now silently disabled three
separate subsystems. **Worth fixing the topology once rather than working around
it a fourth time.**

---

## 5. What I could NOT verify, and you should not assume

Stated plainly so nothing here is mistaken for a green light:

- **Nothing was sent through Resend.** Sending is not the risky half — *receiving*
  is. A send can succeed while replies bounce into nothing, losing every
  interested buyer silently. The smoke test in `docs/FOUNDER-EMAIL-IDENTITY.md`
  is the only thing that proves the receiving half, and it has not been run.
- **No email was viewed in a real mail client.** They were rendered in Chromium.
  Gmail, Outlook and Apple Mail each strip CSS differently; the layout is
  table-based and inline-styled to survive that, but "should" is not "did".
- **The after-login experience was not exercised end to end.** Local sign-in needs
  live Supabase credentials, which are not present in this container, and
  production is unreachable from here. The Command Center pages build and their
  tests pass — that is not the same as clicking through them as a real user.
- **Production health was never read.** Every `/api/health` claim in this document
  comes from prior session notes, not a live measurement.

---

## 6. Honest read on Monday

The product is in better shape than the task log implies — the $499 rail is wired
end to end, the legal surface was corrected in #292, and the test suite is large
and genuinely green. The gap is not features.

**The risk is that none of it is live.** The single highest-value action is not
another PR. It is setting one dropdown in the Vercel dashboard and then reading
`/api/health` to confirm what actually shipped.
