# Hound Shield — Lessons Learned

Self-improvement loop. Updated after every correction or resolved escalation.
Pattern: **what happened → root cause → rule that prevents recurrence**

---

## 2026-09-03 (maintainability audit — the guard that describes its own blind spot)

### A drift guard that compares names will pass while the behaviour diverges
**What:** `registry-drift.test.ts` guarded the two detection registries and its own header
stated the ceiling: *"it compares declared names and categories as source text, not compiled
behaviour, so two patterns sharing a name with different regexes still pass."* Three shared
rules had already drifted through it. The worst left Mode B — the deployment the CUI/HIPAA
claim depends on — detecting 5 PHI strings fewer than the hosted demo.
**Root cause:** the limitation was written down honestly and then treated as documented rather
than as a defect. A known gap in a guard is still a gap; naming it does not close it.
**Rule:** when a guard's comment says what it cannot catch, that sentence is a bug report
against the guard. Either close it or open a task — never both leave it and rely on it.
Compare behaviour on a shared corpus, not declared text.

### `[A-Z0-9]` under the `i` flag matches ordinary words — and two-letter tokens match inside them
**What:** `Task order / delivery order` = `/\b(?:task order|delivery order|TO|DO)\s*(?:no\.?|#)?\s*[A-Z0-9]{4,}/gi`.
Bare `TO`/`DO` with no closing `\b` matched *inside* "tomorrow", "tonight", "document",
"download", "together"; and `[A-Z0-9]{4,}` under `i` matched any word, so "to production" and
"to review" read as order numbers. **10 of 10 ordinary sentences QUARANTINEd at HIGH risk.**
The same class of bug put `PM` in the program-office rule, where it fired on every clock time.
**Root cause:** `i` silently widens every character class in the pattern, not just the literals
you meant it for. A short alternative without a trailing boundary is a substring matcher.
**Rule:** for any detection regex, (a) every short literal alternative gets an explicit closing
`\b`, (b) an identifier class carries a `(?=[A-Z0-9]*\d)` lookahead so it cannot match prose,
and (c) a rule that must be case-sensitive gets its own entry without the `i` flag rather than
being wedged into a case-insensitive alternation. Every new rule ships with benign strings in
the corpus, not just positives — the false-positive half is what decides whether an operator
leaves the product switched on.

### Verify a detection claim through the real scanner, never through a transcribed regex
**What:** the false positives were first found by copying regexes into a scratch script. That is
how they were *noticed*, but the finding was only trustworthy after running the actual
`scanMessages()` from `proxy/scanner.ts` over the same strings — which also revealed the
scanner applies patterns with no context gating, so a single noisy rule really does decide the
verdict for the whole prompt.
**Rule:** a claim about what the product detects is verified by calling the product's own entry
point. A transcription is a hypothesis.

### Dead code is cheap; a stale landmark pointing at it is not
**What:** the audit deleted `PlatformDashboard` — the component named in CLAUDE.md's **first**
Critical Rule, cited as precedent in two other files' comments. `memory-dna.ts` was listed as a
live stack component in three places, one of which handed agents an import example that would
not compile. `/api/health` was documented as the integration health check while returning a
hardcoded `ok`.
**Root cause:** deletions updated the code and left the map. Every one of these was a rule an
agent would obey.
**Rule:** deleting a file is not done until every doc, rule, skill and comment naming it is
updated in the same commit. Where the rule is still true in general (Recharts crashes on SSR),
restate it generally instead of deleting the knowledge with the file.

### A test on uncalled code reports health for something users cannot reach
**What:** 12 modules (2,042 lines) were reachable only from their own tests — green, counted in
coverage, unreachable in production.
**Rule:** run reachability with tests excluded as entry points, not just included. The
difference between the two passes is exactly the code that has a test and no caller. Delete it,
or wire it — and if it is a pending feature, say so in the file with a `ponytail:` note so it is
tracked rather than mistaken for shipped.

### `git log` dates are worthless as abandonment evidence after a bulk import
**What:** every dead file dated 2026-08-07. That commit (`05b5df7`) touched **1,909 files**, so
"last modified" said nothing about whether anything was abandoned. The date-based argument was
dropped before it reached the report.
**Rule:** before using file age as evidence, check how many files the commit touched.
Reachability is the evidence; dates are a story.

---

## 2026-08-14 (finishing the security audit — when the recommendation is the bug)

### A remediation item can be unimplementable, and it will still look shipped
**What:** the Phase 2 audit's #2 listed "set `maxAge` to 7–30 days via `cookieOptions` on
`createServerClient`" as the safe, independent, do-it-now fix. `@supabase/ssr` 0.12.4 spreads
caller options and then overwrites `maxAge` with its own 400-day default on both cookie-set
paths. The diff would have been three lines, reviewed as a session-lifetime fix, and changed
nothing.
**Root cause:** the audit read the library's DEFAULTS (`constants.js`) and correctly reported
them, then assumed the documented override applied to them. Nobody read the merge site.
**Rule:** before implementing a fix that configures someone else's library, read the code that
CONSUMES the option, not the code that declares its default. And prove it by running it — one
throwaway script against a local stub server settled this in two minutes, where reading
`cookies.js` alone still left room to be wrong. When the recommendation turns out to be
impossible, withdraw it in writing where the recommendation lives; a silent omission reads as
an oversight the next time someone audits the auditor.

### An eval() probe cannot test a CSP, because the prober is exempt
**What:** removing `'unsafe-eval'` needed proof the app still worked. The obvious control —
run `eval()` in the page and see it fail — reported `EVAL_ALLOWED` on all six routes. So did
the second attempt, which injected a `<script>` element that called eval.
**Root cause:** Chrome DevTools evaluation contexts bypass CSP by design, and a script element
created from one inherits the exemption. The control was measuring the debugger, not the page.
**Rule:** when a control comes back green, ask what would make it come back green if the thing
under test were broken. A subresource load IS subject to the document policy, so requesting a
script from a forbidden origin proves both that CSP is enforced AND that the detector can see a
violation. "Zero violations" is worthless until something has made the detector fire.

### Deleting a constant can expose that its READER was the bigger lie
**What:** `/api/health` published `classifier`/`quarantine`/`audit_chain` as hardcoded
`"operational"`. Removing them meant reading the consumer — the public `/status` page — which
decided operational-ness with a local `new Set(["operational","connected","healthy"])`. The
health vocabulary had grown "set", "ok", "override", "default" and a bare sender domain, none
of which that set knew, so the page had been showing a warning triangle next to a row reading
"houndshield.com" and saying "Some services need attention" to every visitor, permanently.
**Root cause:** producer and consumer each owned half of one decision, and only the producer
was ever updated.
**Rule:** when two modules must agree on what a value MEANS, the meaning is data the producer
emits, not a rule the consumer re-derives. `/api/health` now returns `degraded: string[]` and
the page renders it. Same shape as the shell-source guard fix: put the invariant where it can
only be written once.

### A missing legal page is usually the smaller half of the problem
**What:** the brief was "we don't have a refund policy — create it". True: four surfaces
advertised a 30-day money-back guarantee and no `/refund` page existed. But reading those four
surfaces to write the policy found that `/terms` §4 described refunds for *monthly and annual
subscriptions you may cancel at any time* — a product HoundShield does not sell — while saying
nothing about the one-time report that is the only thing purchasable. The FAQ, inside JSON-LD
that answer engines quote, advertised a 20% annual discount on plans that do not exist and
contradicted CLAUDE.md's 17%.
**Root cause:** the guarantee was copied outward from marketing to four places and never
reconciled with what the checkout actually sells. Nothing owned the claim.
**Rule:** before writing a missing document, read every surface that already references it. The
absence is what someone noticed; the contradictions are what the absence was hiding. Then make
one module own the claim and have the surfaces read it — the same fix `entity.ts` and
`subprocessors.ts` already applied to the identical failure.

### Never write a policy narrower than the promise already made in public
**What:** it was tempting to write sensible-sounding carve-outs — no refund once the PDF is
delivered, no refund if you ran the proxy.
**Root cause:** those read as prudent and are actually a retroactive reduction of a commitment
already advertised to every visitor, and every one of them describes normal use of a product
whose entire deliverable is a PDF produced by running the proxy. A guarantee claimable only by
someone who never used what they bought is a technicality, not a guarantee.
**Rule:** when documenting an existing promise, the written policy may match or exceed it, never
undercut it. `EXCLUSIONS` ships as an explicitly empty exported list rather than as silence, so
adding one is a visible reviewed act, and the guard fails any exclusion that describes ordinary
use.

### A correct control with an empty disclosure is a consent defect, not a docs defect
**What:** the cookie banner was already right — analytics gated, "Accept essential" offered,
PostHog genuinely not initialised without opt-in. It linked to a privacy clause that named no
cookie at all.
**Root cause:** the mechanism was reviewed and the information the mechanism asks about was not.
ePrivacy Art. 5(3) requires consent to be *informed*, so an unnamed set means the consent
itself is the weak part — the thing collected, not the page describing it.
**Rule:** when auditing a consent flow, ask what the user is consenting TO, not only whether
the toggle works. And build the inventory from code with per-item evidence paths: a policy
naming cookies the code does not set is a published inaccuracy about data handling, which on
this product is the exact failure we sell against.

### Model the difference between "required by law" and "we chose to publish it"
**What:** the legal-index guard demanded a checkable statutory citation for every document and
failed on the Acceptable Use Policy, which is a contract term. The tempting fix was to attach a
plausible-sounding statute.
**Root cause:** the registry had one field for two different things — legal obligation and
editorial choice.
**Rule:** when a guard fails on honest data, fix the model, not the data. `basis: statutory |
contractual` made the check correct AND made the page more truthful, because a reader can now
see which documents the law compels. Inventing a citation would have passed the test and made
the page worse.

### The same constant, copied twenty-nine times, is wrong twenty-nine times
**What:** every canonical tag, Open Graph URL, `sitemap.xml` entry, `robots.txt` and onboarding
email link was built from `process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com"`,
declared separately in 29 files. `NEXT_PUBLIC_APP_URL` is unset in production, and the apex
308s to www — so every one of them named an address that refuses to serve it. The Stripe
checkout success/cancel URL was in that set, on the most revenue-critical redirect in the app.
**Root cause:** the value had no owner. `lib/gateway/base-url.ts` already exists because the
identical failure hit the gateway host — eight copies across two dead subdomains, so fixing one
looked complete and was not. Nobody generalised the lesson to the marketing surface.
**Rule:** a fallback URL is configuration, and configuration gets exactly one home. When you
find the same literal in more than two files, the duplication IS the bug — fixing the instances
you noticed leaves the rest wrong and looks finished. Also: a codemod on `??` misses `||`; the
guard found the straggler the script did not.

### A guard aimed at the symptom flags the innocent
**What:** the single-source guard first matched any `process.env.NEXT_PUBLIC_APP_URL ??` and
flagged six correct files — two that fall back to the REQUEST ORIGIN so a confirm link matches
the host the user is on, two that fall back to localhost for dev, one that must read the raw
value to decide CORS demo mode, and one whose entire job is diagnosing that value.
**Root cause:** the guard targeted "reads the env var" when the defect was "falls back to the
production host".
**Rule:** write the assertion against the DEFECT, not the neighbourhood it lives in. If a guard
would force correct code to change, it is measuring the wrong thing — and the fix is to narrow
the guard, never to bend the six files to satisfy it.

### A misspelled probe turns a truth-teller into a wolf-crier
**What:** `/api/health` shipped and immediately reported `rate_limit_store: degraded_local` in
production. Shared rate limiting was working perfectly. The probe selected `key` from
`rate_limit_buckets`, whose primary key is `bucket_key`; PostgREST errored, the catch swallowed
it, and the endpoint reported an outage that did not exist.
**Root cause:** the probe's failure path cannot distinguish "the table is unreachable" from "I
asked for a column that does not exist", and nothing checked the column name against the DDL.
Reviewing the endpoint's LOGIC finds nothing — the logic is right.
**Rule:** for a module whose whole job is to report degradation, the false-positive direction is
the dangerous one. A silent control teaches nobody anything; a lying alarm teaches the operator
to ignore the page, which is worse than the hardcoded "operational" this endpoint replaced. Pin
every probed identifier against the schema that defines it, and **read the live endpoint after
deploying** — this was invisible in 2,738 green tests and found in one HTTP response.

### The rulebook is code that executes on the next agent
**What:** `.claude/rules/frontend.md` ordered "Homepage bg: `bg-[#07070b]` — never `bg-white`"
and "Dark mode always: `<html className="dark scroll-smooth">`". `app/layout.tsx` has carried no
`dark` class for months; the landing page is light. `database.md` said "migrations 001–004
applied" against 001–027 + 028/031/032. `stack.md` said "Next.js 15" against Next 16 and
"001-030, all applied to prod" when 029 and 030 have never been applied.
**Root cause:** the docs drift guard existed and covered `stack.md` and `api.md`, but its checks
only matched pattern counts and the phrase "through N". "001-030, all applied to prod" and
"Dark mode always" matched neither, so a guard written for exactly this class reported green
while the rulebook rotted. `DESIGN.md` had the identical theme drift and was fixed on
2026-08-07; nobody checked its sibling.
**Rule:** these files are instructions, not descriptions — a wrong one is executed, not merely
read. "All applied to prod" is the worst shape of all, because unlike a stale number it tells
the next session a table exists when it does not. Assert the rule against the ARTEFACT
(`layout.tsx`), never against a copy of the rule, so the check flips by itself the day the truth
changes.

### Two overlapping checks, one of which false-positives, is worse than one that discriminates
**What:** the new migration-range check flagged "Applied to production: 001–027, plus 028, 031,
032" — legitimately partial and correct as written. Widening the window, then narrowing it to a
line, then requiring an "in repo" phrase all failed, because a markdown table cell holds a
correct full-set claim and a correct partial one on the same line.
**Root cause:** the existing "through N" check already covered stale full-set claims. The new
range check was overlap, and its only unique catch was the "all applied to prod" clause.
**Rule:** when a new guard fights the data, check whether an existing guard already covers the
honest half. Delete the overlap and keep the clause that discriminates. A check that pressures
docs toward a rounder, falser number is worse than no check.

### Two of my own guards were wrong before they were right
**What:** the new CSP drift guard matched `script-src` with an unanchored pattern; both files
discuss `script-src` in comments ABOVE the directive, so it captured English and diffed prose.
Its explanatory JSDoc then contained `*/` inside a regex literal and terminated the comment,
breaking the file's parse.
**Root cause:** a guard that greps source is itself source, and gets no review from the thing
it guards.
**Rule:** probe-test every new guard in BOTH directions before believing it — break the thing
and watch it go red. Both of these were caught that way within a minute. Anchor source-greps to
syntax that only the real construct has (here, the opening quote of the string literal), never
to a bare identifier that prose can contain.

---

## 2026-08-07 (the premium pass — where a design failure actually lived)

### "Make it premium" was a responsive bug and four lies, not a visual-design problem
**What:** the brief asked to take the post-login dashboard from generic to premium against a design
reference. The instinct is to restyle. The actual defects were that the shell declared **zero**
breakpoints (67px of usable content on a 375px phone, on all 23 pages) and that four pieces of
chrome — a quarantine badge, a health pill, an unread dot, an avatar initial — were constants
dressed as live state.
**Root cause:** aesthetic language ("generic", "premium") describes the symptom. The dashboard read
as cheap *because* it broke on a phone and *because* its numbers were fake, not because its palette
was wrong. The palette was already fine and already tokenised.
**Rule:** when a request is about how something feels, measure before restyling. `grep -oE
"\b(sm|md|lg|xl|2xl):"` over the layout, and a pass for state that nothing feeds, find more premium
than a new colour ramp does.

### Reachability is a fact to trace, not to infer from a file listing
**What:** the plan named six mockup components to label. Tracing imports found only **three** were
mounted by any page; the other four — plus `agent-workspace`, `memory-view`, `knowledge-base` —
are mounted by nothing at all, and `pipeline`/`workspace`/`knowledge` are bare redirects.
**Root cause:** `grep -c "^const [A-Z_]* = \["` finds mockups. It says nothing about whether a
customer can reach one. Labelling all six would have decorated ~4,500 lines of dead code and
reported work that protected nobody.
**Rule:** before fixing a user-facing defect on a page, prove a user can get to the page. Follow the
imports from the route, not the component's own contents.

### A guard that pins a path punishes the refactor it should have permitted
**What:** eleven assertions across three test files read `(tools)/layout.tsx` by path. Splitting the
427-line shell — necessary, because the drawer and palette break the 500-line rule — would have
failed eight tests that were each still asserting something true (company not build badge,
sign-out present, no indigo, every nav href resolving).
**Root cause:** the invariants were about the shell as a concept; the tests encoded them as facts
about one file. Those are the same thing only until the file moves.
**Rule:** when a guard greps source, have it read the *unit* the invariant is about, not the file
the code happens to sit in today. `helpers/shell-source.ts` concatenates `layout.tsx` + `_shell/*`,
so this split and the next one are free. Same treatment for the panel modules.

### Wiring a fake to a real endpoint can just launder the fake
**What:** the plan said to replace the hardcoded "All Systems Operational" pill with a read of
`/api/health`. `/api/health` returns `status: "healthy"` as a **hardcoded literal**, and its
`services` block reports HoundShield's own Stripe/Resend/OpenRouter config — our billing plumbing,
not the customer's security posture.
**Root cause:** "hardcoded value → fetch the value" looks like a fix and is only a fix if the thing
at the other end is a measurement. An HTTP round trip is not evidence.
**Rule:** before wiring a display to a source, read what the source actually computes. If it is a
constant or it describes us rather than the customer, delete the display and record the ceiling and
upgrade path as a `ponytail:` marker — which is what `Topbar.tsx` now carries.

### A stale DESIGN.md is worse than no DESIGN.md
**What:** `DESIGN.md` was dated 2026-04-11 and described a dark `#07070b` landing page with an
indigo brand. The product moved to light mode months ago; `CLAUDE.md` says so and every line of
`globals.css` agrees. It drifted for four months with nothing to catch it — on the exact artifact
type the founder's reference repo is about.
**Root cause:** documents written *for agents to obey* fail silently. A wrong one does not error,
it produces confidently wrong UI, and the agent that wrote it never sees the consequence.
**Rule:** any doc an agent reads as instructions needs a test. `design-md-tokens.test.ts` asserts
every token named in DESIGN.md still exists in the stylesheets and that the retired dark/indigo
claims cannot return. Prose can drift; the tokens an agent copies verbatim cannot.

### The lint baseline in todo.md was stale, and "0 new warnings" needed proving
**What:** `todo.md` recorded a 38-warning baseline (2026-07-31). The suite now reports 39, several
PRs later. Reporting "39 vs 38, I added one" would have been wrong.
**Rule:** do not trust a recorded baseline across other people's merges. List the warning files and
intersect with the changed set — the honest claim is "zero warnings in any file I touched", which
is checkable, rather than a delta against a number nobody re-measured.

---

## 2026-08-07 (a missing dependency is a question for the founder, not a writing prompt)

### The codebase was carrying evidence of what `ponytail` was, and it still was not enough
**What:** `~/.claude/skills/ponytail/SKILL.md` was missing and Mode C routed all code work
through it. The repo had real evidence — `todo.md` described "the existing ponytail skill +
4 gates", and five source files used a `ponytail:` comment convention. Enough to write a
convincing reconstruction. The founder then supplied the actual upstream
(`DietrichGebert/ponytail`, MIT), and the real skill was a 120-line intensity-graded ladder
with a `lite/full/ultra` switch and a "when NOT to be lazy" section — none of which the
repo's traces implied.
**Root cause:** circumstantial evidence establishes that something existed, never what it
said. A reconstruction that reads plausibly is the most expensive kind of wrong, because
nothing later flags it as invented.
**Rule:** when a referenced artifact is missing, make the reference non-fatal and ask.
Reconstruct only when the full spec is published (as with `setup-auditor`, where the delete
and add tables were in the page text), and label it a reconstruction in the file itself.

### Vendoring beats depending on a user-scope path that no one controls
**What:** the original reference pointed at `~/.claude/skills/`, outside the repo, so it
vanished with the machine and was invisible to every clone.
**Rule:** vendor third-party skills into `.claude/skills/` with `LICENSE` and a
`VENDORED.md` naming upstream URL, commit SHA and date, and copy `SKILL.md` verbatim.
Provenance is what separates vendoring from silent forking.

### Installing a good skill can make your own instructions redundant
**What:** houndshield's GATE 1 had five checks. Four were the ponytail ladder restated from
memory — worse than the original and now able to drift from it.
**Rule:** when adopting a skill that owns a concern, delete your paraphrase of it rather
than keeping both. Two copies of a rule is one copy plus a future contradiction. Keep only
what the adopted skill genuinely does not cover.

---

## 2026-08-07 (prompt audits — deleting the ritual without deleting the knowledge)

### A "verify before done" block can have unrecoverable facts fused into it
**What:** the Six-Month Audit flagged `/houndshield` GATE 2 for deletion, correctly — Anthropic's
Opus 5 page says explicit verification instructions cause over-verification and should be removed.
But GATE 2 also carried four things the model cannot re-derive by being careful: a piped command
returns the pipe's exit status, `npx vitest` from repo root loads the PARENT config and "passes"
while testing nothing, `--reporter=basic` fails and still exits 0, and `npm run build` during a dev
server corrupts `.next`. A clean delete would have removed all four.
**Root cause:** pattern-matching on the section heading instead of reading what the section
contains. Verification ceremony and environment truth look identical from a grep.
**Rule:** when a delete-pass hit lands on a verification block, split it before deleting. Ceremony
("nothing is done until…") goes; facts about what the tooling lies about move to a neutral heading.
The same guard applies to truth rules — "only claim what you verified", "say `unknown` rather than
inventing a number" — those stop fabrication and are never severity filters. They stay.

### An audit that reports only hits is not an audit
**What:** four of the seven delete checks returned nothing for this skill.
**Rule:** name the clean checks individually. Silence is indistinguishable from an unrun check, and
"NOT RUN" on anything unverifiable beats a clean bill that was not earned.

### A skill cannot replace an MCP server — but it can remove the dependency on one
**What:** the ask was "convert the TinyFish MCP into a skill so we can uninstall the MCP". A skill is
markdown; it cannot manufacture tools that execute on someone else's infrastructure.
**Root cause:** the goal (HoundShield does its own web work) was reachable; the stated method
(markdown alone) was not.
**Rule:** answer the goal, name the method's limit in one line, then build the thing that actually
delivers it — here, a tiered fallback plus a real local driver. Shipping the markdown alone would
have been a workaround presented as a fix.

### Chrome does not read `NODE_EXTRA_CA_CERTS`, and that looks like a network outage
**What:** `hound-web.mjs` failed with `ERR_CERT_AUTHORITY_INVALID` behind the sandbox egress proxy
while `curl` on the same host succeeded. curl reads `CURL_CA_BUNDLE`; Chrome reads NSS, where the
interception CA was absent.
**Rule:** derive the SPKI pins from the CA bundle the environment already trusts and pass
`--ignore-certificate-errors-spki-list`. That trusts exactly those CAs and keeps verification on for
everything else. Never reach for `--ignore-certificate-errors`. Note also that a proxy 403 on
CONNECT is an allowlist denial, not a bug in your code — check `curl` before debugging further.

---

## 2026-08-05 (CSS — three ways a layout bug hides from the obvious check)

### `scrollWidth` cannot see a left-edge overflow, so a sweep that only checks it reports clean
**What:** the 375px sweep was green on `/` while, at 1200px, the Products mega-menu was
rendering at `[-118, 588]` — its entire first column clipped off the left of the window.
**Root cause:** `documentElement.scrollWidth` measures the scrollable extent, and browsers
do not create scrollable area to the LEFT of the origin in a LTR document. Content at a
negative x is simply invisible. `scrollWidth === clientWidth` therefore proves "nothing
hangs off the RIGHT", which is not the same claim as "nothing is off-screen".
**Rule:** assert `scrollWidth === clientWidth` **and** walk the elements checking
`getBoundingClientRect().left >= 0` as a separate condition. And check the widest
breakpoint too — a fixed-width panel centred on a trigger fails at 1200 precisely because
there is more room there for the centring maths to push it negative.

### A class collision between two unscoped stylesheets is invisible in both files
**What:** every marketing `.nav-item` was padded twice — `8px 12px` from its own rule and
`8px 12px` again from somewhere else — spreading the nav ~120px wider than designed.
Reading `hermes.css` showed nothing wrong. Reading the JSX showed nothing wrong.
**Root cause:** `app/globals.css:369` declares a **bare, unscoped** `.nav-item` for the
DASHBOARD SIDEBAR. Both stylesheets load on every page, so the sidebar's padding also
painted the marketing nav. Neither file is wrong when read alone; the defect only exists
in the union, and only shows up in computed style.
**Rule:** before "fixing" a spacing value, `grep -rn '^\s*\.<class>\s*{' app/ components/`
across ALL stylesheets first — a second unscoped declaration is the likelier cause than
the rule you are looking at. When you must neutralise someone else's unscoped selector
rather than scope it at source, guard it with a **self-retiring** test: assert the
collision still exists, so the day it is fixed properly the test fails and tells the next
person to delete the workaround, instead of the workaround silently outliving its reason.

### A red `main` is a prerequisite, not scope creep — but only after you prove it is pre-existing
**What:** `npx tsc --noEmit` failed on this branch in `lib/stripe/api-version.ts`. Nothing
in the diff touched Stripe. The reflex "my change broke it" and the reflex "not mine,
ignore it" are both wrong.
**Root cause:** `origin/main`'s dependabot bump #262 took `stripe` to 22.4.0, whose
`LatestApiVersion` literal type moved to `2026-07-29.dahlia` while the pin still read
`2026-06-24.dahlia`. `gh run list --branch main` showed run `31000072671` **failing in
49s** — main was red before this branch existed, and every PR cut from it inherits that.
**Rule:** when a gate fails on something your diff does not touch, prove provenance with
`gh run list --branch main` before deciding — then fix it in its own clearly-labelled
commit and say so out loud, because an unrelated money-path change riding quietly inside
a CSS PR is exactly what makes review untrustworthy. Also note `next.config`'s
`typescript.ignoreBuildErrors: true` means **`npm run build` passing is NOT a typecheck** —
tsc is a separate gate and must be run separately.

### Generated `.next/dev/types` outlive the dev server and poison a later tsc run
**What:** `tsc` reported 25 errors for `.next/dev/types/validator.ts` importing
`app/command-center/*/page.js` files that no longer exist there.
**Root cause:** `tsconfig.json` includes `.next/dev/types/**/*.ts`. Those are generated by
a DEV server run and are not cleaned by a prod build, so they described a route tree from
an older session.
**Rule:** treat `.next/**` errors as artifacts, not source. Gate on
`tsc --noEmit | grep -v '^\.next/'` (CI checks out fresh and never sees them), or clear
`.next` first.

## 2026-08-05 (verification — my own mistake)

### I scoped a bug to one string and declared the file fixed. There were two strings.
**What:** the gateway URL was dead. I grepped `proxy.houndshield.com`, found six copies,
repointed them, and moved on. A later grep for the *concept* turned up
`gateway.houndshield.com` in nine more files — including two FAQ answers in a file I had
already "finished", so `lib/brain-ai/faq.ts` sat half-fixed with no test able to see it.
**Root cause:** I searched for the token I had first observed instead of the property I
was fixing. One dead host is a typo; "every surface that hands out a gateway URL" is the
actual invariant, and it was never the thing I searched for.
**Rule:** when a bad value appears in more than two places, stop editing and first
enumerate every value that plays the same ROLE — grep the concept (`/v1`, `baseURL`,
`base_url`), not the string you happened to see. Then fix them in one pass behind one
constant, and add the guard before claiming done.

### My own guard missed an instance because the string was regex-escaped.
**What:** the "link 0" guard walks every source file for the dead hosts. It passed. The
full suite then failed on `GatewayKeys.test.tsx:117`, which held
`/curl https:\/\/proxy\.houndshield\.com\/v1/` — a regex literal. The guard's `includes()`
never matched because of the backslashes.
**Root cause:** I wrote the guard against how *I* had been writing the string, not against
how the codebase writes strings. Escaped, split, and templated forms are all the same
value to a reader and to a customer.
**Rule:** a source-scanning guard must normalize before it matches — at minimum strip
backslashes. And a guard that passes on the first run is unproven: confirm it walks a
non-zero file count and that it goes red against a known-bad instance before trusting it.

### A 404 is not proof a feature is missing.
**What:** `/v1/stats` and `/v1/events` were documented and 404 in production. I was one
step from deleting them from the docs as phantom endpoints. They are implemented in
`proxy/server.ts` — real Mode-B routes, wrongly advertised at the Mode-A base URL.
Deleting them would have removed a real capability from the docs and left the actual
defect (two products described by one base URL) in place. Worse, `/v1/stats` takes no
auth, which is right on the customer's own container and a cross-tenant leak on a shared
host — the docs were implicitly promising the dangerous version.
**Rule:** before removing a documented capability that 404s, grep the OTHER deployment
targets in the repo for the same path. In a multi-mode product (hosted / self-hosted /
air-gapped), "which mode serves this?" is part of every endpoint's definition, not an
afterthought — and an endpoint's auth requirement can change meaning with the mode.

---

## 2026-08-04 (privacy — a control that only half-covered its own threat)

### The leak guard could not see the company domain, so the founder's own mailbox survived the scrub
**What:** PR #252 scrubbed the founder's identity from application code and PR #253 shipped
`scripts/verify-no-leaks.mjs` to keep it out. Both reported the class closed. It was not:
the founder's first name and `@houndshield.com` work mailbox were still sitting in
`tasks/todo.md`, plus three more name references across `tasks/`, on a **public** repo,
for six days. CI was green the whole time.
**Root cause:** the identity rule enumerated *consumer* domains — gmail, outlook, proton —
because that is where the first leak was found. The company domain was never in the
pattern, so the one address most likely to be personal AND load-bearing was the one
address the guard was structurally incapable of seeing. The scrub that preceded it was
also scoped to code; `tasks/` is prose, tracked, and published exactly the same way.
**Rules:**
1. **A guard built from one incident covers one incident.** After writing a detection
   rule, ask what *else* is in the same class and enumerate it deliberately — here, "an
   email address that identifies a person" is the class, and consumer domains are a
   subset of it, not the definition.
2. **Match identity patterns case-insensitively.** The committed value was mixed-case in
   both the local part and the domain; a lowercase-only regex would have run green
   against the exact string it was written to catch.
3. **Scrubbing "the code" is not scrubbing "the repo".** `git ls-files` is the boundary
   that matters. Task logs, lessons, runbooks and skill files publish identically to
   source.
4. **A must-flag fixture must never be the real value.** Committing the leaked address to
   the guard as evidence recreates the leak inside the control. Use synthetic names, and
   prove discrimination by injecting the real string into the **working tree only**, then
   reverting.
---

## 2026-08-03 (delivery — my own mistake)

### I reported work as shipped because the PR said MERGED. Five of six commits never landed.
**What:** PR #255 was merged at 2026-07-31T06:41Z, six minutes after CI went green on
its first commit. I kept pushing to the same branch afterwards — a bug fix, the sidebar
move, the login fix, two doc logs. None of them reached `main`. I noticed only that
"GitHub Actions has not re-run since `f93c825`" and told the founder not to merge on
stale ticks, without ever asking the obvious follow-up: *why* would checks stop running?
Meanwhile three defects I had already fixed stayed live in production for three days,
including a hero chip captioning every paying customer's real telemetry "Sample preview".
**Root cause:** a squash merge **closes** the pull request. A closed PR does not run
checks on new pushes, and the branch keeps accepting commits that go nowhere. Silence
from CI reads identically to "queued" and to "this branch is orphaned". I treated a
merge notification as proof of delivery when it is only proof that *something* merged
— GitHub squashes to a single commit whose message came from the FIRST commit, so even
the merge-commit subject looked like the whole branch had shipped.
**Rules:**
1. **After any merge, diff the branch against `main` before calling it delivered.**
   `git diff origin/main <branch-head>` empty = shipped. Anything else = not shipped,
   whatever the PR badge says. `git branch -r --contains <sha>` naming only the feature
   branch, while the PR reads MERGED, is the tell.
2. **CI going quiet is a signal to investigate, not a condition to wait out.** "Checks
   have not re-run" has exactly two causes — queued, or nothing is listening. Check
   which one before advising anyone on the strength of the last green run.
3. **Never let a partially-merged branch keep accumulating.** Re-target orphaned commits
   onto current `main` as a fresh branch immediately; verify the replay is
   tree-identical (`git diff <old-head> HEAD`, **unscoped** — a path filter can hide a
   difference), then re-run every gate, because the base has moved.

---

## 2026-07-29 (privacy — my own mistake)

### I committed the founder's name and mailbox into a PUBLIC repo, in ~20 places
**What:** Building the email-identity module, I hardcoded the founder's personal
address as `export const FOUNDER_ADDRESS`, then propagated it into 2 new docs, 2 new
test files, `tasks/todo.md`, `tasks/lessons.md`, the skill file, the commit message
and the PR body — and merged it. The founder stopped me: *"what is not needed and not
meant to push on github should not be sent on github."* `thecelestialmismatch/HoundShield`
is `"visibility": "public"`. A personal mailbox and a personal Gmail were sitting in
merged `main`, indexed.
**Root cause:** I treated identity as a *correctness* problem ("one source of truth
for the sender") and never asked the *disclosure* question ("who can read this?").
Single-source-of-truth pressure actively pushed the wrong way: it made hardcoding the
real value feel like the disciplined choice. Worse, the address was already present in
9 pre-existing test files, so it read as an established repo convention rather than
something to question.
**Rules:**
1. **Before committing any real-world identifier — a person's name, mailbox, phone,
   handle, address — check the repository's visibility, and default to env config
   regardless.** Identity is operator configuration, not source code.
2. **"Single source of truth" applies to the RESOLVER, not the value.** The right
   shape is one function reading one env var. A committed literal is the anti-pattern
   wearing the pattern's clothes.
3. **An in-repo default that ships publicly must be safe to publish.** Here the
   fallback is the already-published `contact@`, so unconfigured means impersonal,
   never leaked. Access grants go the other way — fail CLOSED (empty list), because a
   missing var must not silently hand someone top-tier access.
4. **A precedent in the codebase is not permission.** Nine test files already carried
   the address; that made it feel normal. Inherited exposure is still exposure, and
   "it was already here" is how it spreads.
5. **Removing it from HEAD does not remove it from history.** Scrubbing the working
   tree is necessary but not sufficient; a public repo's git history keeps every past
   blob until it is rewritten. Say that plainly instead of implying the fix is total.

### A blanket regex over prose mangles the prose
**What:** Scrubbing the name, I ran a blanket `s/<the founder's first name>/the founder/`
across docs. It
produced "the mailboxes `the founder@`", "local part `the founder`", and email
signatures reading "> the founder". It also silently broke a test asserting an email's
local part by rewriting the expected string.
**Root cause:** A find-and-replace optimised for *finding every instance* with no
regard for whether each replacement was grammatical or semantic. The same partial-sweep
failure as the v3 design split-brain, in the opposite direction: too broad, not too narrow.
**Rule:** For prose, scrub with **targeted, reviewed replacements per file** and then
re-read the affected passages. Reserve blanket regex for structured values (an address
literal, an env key), never for a name embedded in sentences. Then grep for the artifacts
a bad sweep leaves behind (`the founder@`, doubled articles) — and re-run the tests,
because expected-value strings get caught in the blast radius.

---

## 2026-07-29 (email identity)

### A rule that lives only in a skill file is not a rule — four routes each invented their own answer
**What:** `/houndshield` has said for weeks that founder mail comes from
the founder mailbox. No code enforced it. Four routes independently resolved "the
inbox a human must act on" and two disagreed: the $499 sale alert, the contact form and
the snapshot lead defaulted to `contact@`, while `partners/apply` — the Stage-1 ≥1-RPO
goal — defaulted to `info@`. Nobody chose that split; two people reached for a plausible
default months apart. Nine more files hardcoded their own `From` header.
**Root cause:** the decision had no home. A convention documented in prose gets
re-derived, slightly differently, at every call site — and every copy is a place for it
to rot silently, because no test can fail on a disagreement it cannot see.
**Rules:**
1. **A cross-cutting identity (sender, inbox, brand address) belongs in one module that
   everything imports.** If the same literal appears in nine files, the ninth is already
   wrong and you have no way to know which.
2. **Guard it at the SOURCE, not at runtime.** A behavioural test would have to exercise
   every route under every env permutation, and would pass happily on a route no caller
   reaches. Scanning the source for `FOUNDER_EMAIL ||` finds all of it in one pass.
   (Same shape as the #244 orphaned-checkout lesson.)
3. **When a doc states a rule the code should hold, ship the guard in the same arc.**
   Otherwise the doc becomes evidence that the team believed something untrue.

### Routing addresses and published addresses are different things
**What:** `/api/contact` and `/api/report/snapshot-lead` both returned their *routing*
address to the browser as `fallbackEmail` when Resend was unconfigured. Point
`FOUNDER_EMAIL` at a personal mailbox — which the variable exists to allow — and the
contact form would print it to every visitor who hit it during an outage.
**Root cause:** one variable serving two audiences. "Where mail goes" and "what we tell
strangers to write to" were the same string because they happened to have the same value.
**Rule:** separate them by construction — a function for the internal destination, a
constant for the publishable one — and assert in a test that the browser-facing field
returns the published constant. Any config value that is both *overridable* and
*displayed* is one env change away from leaking.

### A "13 AI models" claim on the demo page contradicted the product's entire moat
**What:** `/demo` claimed HoundShield uses "13 AI models with context awareness", sold a
"HoundShield Pro" tier deleted from `/pricing` in #243 (with its CTA pointing at
`/auth`), and offered "1-click SOC 2 reports" when SOC 2 has not been started. Found only
because a drafted outreach email was going to link there.
**Root cause:** marketing copy on a page nobody re-reads after launch. The pricing
collapse in #243 fixed `/pricing` and the nav in #248, but `/demo` was a third surface
selling the same dead tier — and the AI-models claim actively contradicts the local-regex
architecture that is the company's asymmetric weapon.
**Rules:**
1. **Before linking a buyer to a page, read that page as the buyer.** The email's
   credibility is capped by the least honest sentence on the page it points to.
2. **When a tier or offer is deleted, grep every surface for its name** — page, nav, API
   route, demo, dashboard. #243 → #248 → this made three passes at the same deletion
   because each one only swept where it was looking.
3. **A capability claim that contradicts the architecture is the easiest kind to catch:**
   ask "which file implements this?" There was no model in the scan path at all.

### My own guard caught me twice mid-build — that is what a good guard feels like
**What:** The source-level identity guard failed twice on my own edits: a 9th hardcoded
`From` in `api/email/welcome/route.ts` I had not found by grep, and my own direct
`process.env.FOUNDER_EMAIL` read in `/api/health` minutes after writing the rule against
it.
**Root cause:** grep finds the shapes you think of. A guard runs on everything, including
the author.
**Rule:** write the invariant as an executable check *before* finishing the refactor, not
after — and when it fails on your own code, that is the guard working, not an obstacle to
route around. Also: re-verify the guard by restoring the ORIGINAL bug and watching it go
red (3 assertions here), or it is decoration.

---

## 2026-07-29 (later)

### A guard that compiles is not a guard that runs
**What:** `middleware.ts` protected `/command-center` correctly and had done so for months.
Production served that dashboard to anonymous visitors anyway. The middleware compiled — the
build log ends with `ƒ Proxy (Middleware)` — and never executed once, because the repo-root
`vercel.json` still uses the legacy `builds` + `routes` keys, and a legacy `routes` array
replaces the routing table the framework build generates. Reading the source proved the logic
was right and proved nothing about production. The same dead layer had been silently 404ing
`/dashboard` and `/shieldready` and swallowing the email-drip cron.
**Root cause:** a control was verified by reading it, not by observing its effect.
**Rules:**
1. **Verify a guard by its side effects on the live system, not by its source.** Middleware here
   sets four observable things (`X-Robots-Tag`, `X-RateLimit-*`, an `/auth/signup` redirect, an
   auth redirect). One `curl -sI` against production would have caught this at any point.
2. **`x-nextjs-prerender: 1` on a route that should be private is a finding by itself.** A page
   that can be prerendered has no session in it; whatever protects it is outside the app and can
   be switched off by config you may not control.
3. **Put the authorization boundary inside the render.** Middleware is an optimization. A
   fail-closed server layout in the protected subtree cannot be dropped by a deployment setting,
   and reading the session makes the subtree dynamic, which removes the cached-HTML hole too.
4. **When platform config and framework config disagree, the platform wins silently.** Prod
   redirects non-www → www; `next.config.js` declares the opposite. Nothing errors. Diff what the
   deployment actually does against what the repo says it should do.

### A root `loading.tsx` turns every redirect in the app into a 200
**What:** The new fail-closed gate returned **200**, not 307, with middleware disabled. The body
was empty of dashboard markup (`hs-lcc` ×0, `NEXT_REDIRECT` ×2), so the gate *had* stopped the
render — but the status line said OK. Cause: `app/loading.tsx`, an untouched scaffold file from
the initial commit, wrapped the entire application in one Suspense boundary. Next.js documents
it plainly: in a streaming context `redirect()` is delivered as a meta tag; otherwise as a 307.
Once the shell has flushed, the status code is already gone.
**Root cause:** a global convention file silently changed the semantics of every redirect in the
app, including a pre-existing auth gate that had been answering 200 for months.
**Rules:**
1. **Assert the status code, not the absence of leaked content.** "The body has no secrets" and
   "the request was refused" are different claims. Check both.
2. **Prove a gate with the protection layer above it REMOVED.** The 307 seen with middleware
   enabled was the middleware's. Deleting `middleware.ts` and rebuilding is what exposed the
   truth — simulate the failure you are defending against.
3. **Root-level `loading.tsx` is a footgun.** It forces every route to stream and masks missing
   Suspense boundaries elsewhere (removing it immediately broke the `/login` prerender, a real
   latent bug it had been hiding). Scope loading UI to the segments that need it.

---

## 2026-07-29

### "It looks off-centre on one page" was one symptom of a reset silently voiding 272 utilities
**What:** The founder reported the FAQ block sitting left on `/pricing`. Treated as a one-page
layout nit, the fix would have been a `!mx-auto` on that page — and five other pages plus the
whole `/faq` hub would have stayed broken. Measuring the computed box instead of reading the JSX
showed the real shape: `margin-inline` and `padding-inline` computed to `0px` while `max-w-3xl`
still applied. A browser audit for "elements carrying a Tailwind spacing class that computes to
0px" found **236 dead utilities on `/faq` and 36 on `/pricing`** — the search input's `pl-12
pr-12` (its icon overlapped the placeholder), every category pill, all 38 accordion rows.

**Root cause:** `app/hermes.css` opened with an **unlayered** `.hermes *, ::before, ::after
{ margin:0; padding:0 }`. Tailwind v3 emits no cascade layer, so that reset and every `.px-5` /
`.mx-auto` utility tied at specificity (0,1,0), and ties break on **source order** —
`layout.tsx` imports `globals.css` before `hermes.css`, so the reset won every one. Five pages
had already been paying the tax without naming it, passing `!mx-0 !px-0 !py-0` into `FaqSection`,
because `!important` was the only thing that beat it. `max-w-*` hid the whole class of bug by
continuing to work: the reset never sets `max-width`, so boxes were the right *width* in the
wrong *place* with their contents flattened — which reads as "slightly off" rather than "broken".

**Rules:**
1. When a CSS symptom is "some properties apply and others don't on the same element", that
   asymmetry names the culprit. Ask which properties the suspect rule actually sets — here
   `max-width` surviving proved a margin/padding reset, not a width or layout problem.
2. Diagnose CSS from **computed style in a real browser**, never from the class list. `mx-auto`
   being present in the JSX said nothing about whether it applied.
3. Before "fixing" a reported page, run the audit that counts every instance of the same defect.
   One founder-visible symptom is a sample, not the population.
4. A universal reset (`*`) that ships alongside a utility framework belongs in an `@layer`.
   Layered rules lose to all unlayered author rules regardless of specificity, so utilities win,
   while UA defaults still lose to the reset. Un-layering it silently restores the entire bug
   class — so the guard pins the layer, not any one page's layout.
5. Repeated `!important` overrides of a shared component are a smell, not a style. Five pages
   passing `!mx-0 !px-0` was the codebase reporting this bug for weeks in a language nobody read.



### A red health check is a symptom report, not a diagnosis — probe the real endpoint before believing it
**What:** `/api/health` read `payments: missing_key`, and every session for two weeks treated that
as "checkout is dead, only the founder can fix it." One curl against production disproved it:
`/api/stripe/report-checkout` returned a live Stripe Payment Link (`rail: payment_link`, HTTP 200).
Retail had been sellable the entire time. The actual damage was one layer down and invisible to the
health check — the webhook answered real sales with 503, so a $499 buyer could pay and be recorded
nowhere and answered by nobody.
**Root cause:** The health check reports the state of a *variable*, not the state of the *capability*.
"Key missing" was read as "cannot take money," when a fallback rail deliberately built for exactly
that outage meant the opposite. Nobody re-derived the claim against the running system, so the team
kept fixing the loud broken thing and never saw the quiet broken thing behind it.
**Rule:** Before accepting any "X is blocked" from a status field, hit the real endpoint and read the
real response. A diagnostic describes configuration; only the endpoint describes behavior. And when
a config value has a documented fallback, the fallback path — not the missing value — is where the
next bug lives.

### An env var that gates a code path which never uses it is a hidden outage
**What:** `POST /api/stripe/webhook` required `STRIPE_SECRET_KEY` before processing any event. But
signature verification (`webhooks.constructEvent`) is a local HMAC check over the raw body, and the
$499 report handler reads the event payload and writes to Supabase — neither calls Stripe. A grep
found exactly ONE Stripe API call in the entire 380-line route. The key gated the money path
gratuitously, converting a survivable single-variable misconfiguration into total revenue silence.
**Root cause:** Config guards get written as one blanket precondition at the top of a handler
("Stripe stuff needs Stripe env"), by association rather than by actual dependency. The guard was
never re-derived after the fallback rail made key-less selling possible.
**Rule:** A precondition must guard the code that actually needs it, not the whole handler by theme.
Before writing `if (!ENV) return 503`, grep the handler for the calls that consume `ENV` — if a branch
doesn't use it, that branch must still run. Corollary for webhooks specifically: **degrade to 2xx, never
to an error.** Stripe retries non-2xx and eventually disables the endpoint, so a guard that fails loudly
on one branch silently destroys every other branch on the same endpoint.

### A page-level rule is not enforced until it is enforced on the API surface
**What:** #243 collapsed `/pricing` to the single $499 offer and added a render test proving no monthly
price appears. `app/api/stripe/checkout/route.ts` survived untouched — a live POST endpoint still
creating $199/$999/$2,499 subscriptions with a 14-day trial, for tiers the site no longer lists. It had
zero references anywhere in the repo, so deleting the tiers from the page broke nothing and revealed
nothing. Its own docblock still read *"All prices match /pricing page exactly. No orphaned tiers."*
**Root cause:** The guard tested the surface a human sees, not the surface that takes money. Dead code
with no callers is invisible to every test that works by exercising callers.
**Rule:** When a product rule changes (pricing, offer, tier), grep the API routes for the old shape in
the same arc — the page and the endpoint are two enforcement points and only one of them charges cards.
Guard invariants that concern "what we sell" with a **source-level** scan (route directory contents,
`mode: 'subscription'` literals), because a runtime test cannot fail on a file that has no caller.
Inverse of the 2026-07-22 lesson: there a tested backend had no caller and the funnel was dead; here an
untested backend had no caller and the pricing rule was quietly false. Same question finds both —
*does anything actually reach this route?*

### Prove a new test fails against the old code, or it is decoration
**What:** The new webhook tests passed on the first run. That is exactly what a test asserting nothing
also does. Reverting the gate to its old form and re-running showed both money-path tests going red —
only then was the coverage real.
**Root cause:** A green test after a fix is ambiguous: it means either "the fix works" or "the test
never exercised the bug." The two are indistinguishable without running it against the broken code.
**Rule:** For any regression test on a bug you just fixed, temporarily restore the bug and confirm the
test goes red (isolate with `-t` to avoid unconsumed `mockReturnValueOnce` queues cascading into
unrelated failures and muddying the signal). Paste the red output. A test that has never failed has
never been tested.
## 2026-07-28

### The compass was one day stale on the fact the whole company was built around
**What:** The entire go-to-market sold against "CMMC Phase 2 enforcement, 10 Nov 2026."
The DoD suspended Phase 2 on **2026-07-13**. `primer.md` recorded "confirmed unchanged
2026-07-12" — we checked one day early and then trusted that check for two weeks while
continuing to write copy, FAQs and schema against a deadline that no longer existed.
**Root cause:** a verified external fact was cached with a date but no expiry. Nothing
distinguished "checked recently" from "still true," and no step re-checked it before
citing it.
**Rule:** any external fact the business depends on (a regulatory date, a competitor's
pricing, a market stat) gets **re-verified at the moment it is used in customer-facing
copy**, not once and cached. When a fact is load-bearing, cite the source and the
check-date next to it — and treat anything older than a week as unverified.

### A "pre-existing CI failure" was a stale binary, not broken code
**What:** 17 proxy tests had been failing for weeks, logged in memory as a "pre-existing
dep-bump vitest worker crash" and routed around. The actual error was
`NODE_MODULE_VERSION 137 vs 127` — the `better-sqlite3` native binary was compiled
against a different Node version. `npm rebuild better-sqlite3` → **61 passing**, zero
code changed.
**Root cause:** the failure was labelled from its symptom ("vitest crashes") and filed as
known-broken, so nobody read the actual error text, which named the fix explicitly.
**Rule:** never file a failure as "pre-existing/known" without pasting the **exact error
line**. An error that names its own remedy has not been read. "Known broken" is where
five-minute fixes go to hide for a month.

### Three commands in this repo report success while failing
**What:** During one session, three separate runs reported green while doing nothing:
`vitest --reporter=basic` (crashes with `ERR_LOAD_URL`, exits 0), `npx vitest` from the
repo root (loads the PARENT config, `MODULE_NOT_FOUND`, exits 0), and any piped command
(`cmd | tail` returns *tail's* status). Twice this produced a "tests pass" claim for a run
that never executed.
**Root cause:** trusting exit codes, plus a shell whose cwd resets between calls so an
earlier `cd` silently does not apply.
**Rule:** **read the last lines of output; never trust an exit code from a piped
command.** Always run the project's own binary from the project's own directory
(`cd compliance-firewall-agent && ./node_modules/.bin/vitest run`). Encoded as GATE 2 in
the `/houndshield` skill and the founder's portable CEO skill so it cannot be forgotten.

### "Fix the false claim" — except the claim was true
**What:** Reported that "16 detection engines" matched nothing in the codebase, based on
counting the proxy registry (33 patterns). It was wrong: `ENGINES` in
`app/features/page.tsx` has exactly 16 entries. The number was correct; it was merely
duplicated as a literal in four places while the list lived elsewhere.
**Root cause:** verified the claim against the first plausible source found, then
generalised to "matches nothing" without checking the surface that actually renders it.
**Rule:** before calling a claim false, find the code that **produces the rendered
string**, not merely a related number. A near-miss between two real numbers is usually a
naming difference, not a lie. The fix that followed was smaller and better for it: derive
the count from the array so it can never drift.

## 2026-07-23

### A bug that's been "fixed" 4+ times and stays broken is invisible config, not code — make the failure observable
**What:** "Still no password reset" recurred across many sessions despite repeated code fixes (#224,
#231, #237). A fresh end-to-end trace found the code chain is correct and unit-tested — the real
blockers are operational (missing `SUPABASE_SERVICE_ROLE_KEY`, a stale `NEXT_PUBLIC_APP_URL`, an
unverified Resend domain, a the founder mailbox mailbox that never existed), and the route is
enumeration-safe so it ALWAYS returns 200 and the UI ALWAYS says "check your email". Every failure was
invisible, so each session re-fixed the code — the one place the bug wasn't.
**Root cause:** Chasing the code because that's what we can edit, when the signal (which env/knob is
wrong) was never surfaced. Silent-by-design (enumeration safety) hid the diagnosis from the operator.
**Rule:** When a fix doesn't stick, stop re-writing the code and make the failure OBSERVABLE first. For
a silent/enumeration-safe path, add a value-free readiness probe (here: `reset_*` on `/api/health`,
shape/host only, never a secret) so the operator sees the exact bad knob in one glance. Then the fix is
a named config change, not another code round. Diagnosability beats another patch.

### Verify a redesign against the founder's own reference AND the live source before assuming it's missing
**What:** "Make the login page look like this [reference]." The reference's signature was a Sign in /
Sign up segmented toggle. The existing `/login` already had the real logo, eye-toggle, forgot-password,
and OAuth — the ONLY missing piece vs the reference was the toggle. Rewriting the page wholesale would
have risked the working password/OTP/2FA/OAuth handlers.
**Rule:** Diff the reference against the current UI and add only the delta (a shared `AuthTabs` toggle +
label/ToS polish), never rip-and-replace a page whose auth handlers are tested and working. Keep every
working sign-in method (additive over destructive) even if the reference screenshot shows fewer.

## 2026-07-22

### A tested backend with no UI caller is dead code — grep for the caller before trusting "the funnel works"
**What:** The RPO/MSP application backend was fully built and tested for months — `/api/partners/apply`
(zod-validated insert into `partner_applications`, founder alert, branded `partner-welcome` email, mig
005 with RLS). But EVERY partner CTA on `/partners` and `/partners/kit` linked to the generic `/contact`
form. So the entire structured channel #1 funnel (the Stage-1 ≥1-RPO goal) never ran: no row in
`partner_applications`, no founder alert, no warm welcome email. Green route tests said nothing, because
tests call the route directly — they never exercise the missing UI edge.
**Root cause:** Route-level tests prove the handler works; they do NOT prove anything reaches the handler.
"The apply endpoint is built and tested" was mistaken for "an RPO can apply."
**Rule:** A capability is incomplete until a caller invokes it in the real flow. When a backend exists,
`grep -rn "<route path>"` across `app/` + `components/` for a UI caller before calling the funnel done;
if the only hits are the route file and its tests, the thread is dangling. Ship the caller in the same
arc (continues the 2026-07-04 "capability with no caller" lesson) and add a source-level contract guard
that the CTAs point at the real destination, not a generic fallback.

## 2026-07-18

- **Killed my own shell twice with `pkill -f "next start"`** → `pkill -f` matches any process whose full cmdline contains the pattern — including the harness session process (its cmdline embeds instruction text with those words), so the signal took down the tool shell (exit 144) → rule: never `pkill`/`pgrep -f` with broad substrings; find the exact PID (`ss -ltnp` by port, `/proc/<pid>/cwd`, or a PID file written in the same `{ }` group) and `kill <pid>`.
- **Declared a stale audit result as current** → the patched audit script only rewrote `result.json` when findings existed, so a clean run left the previous failure file on disk; the giveaway was the offender's class string predating the fix → rule: verdicts come from the live run's stdout summary line, and any results file must be deleted before the run or written unconditionally.
- **Two JSX syntax errors from comments before the root element** → `{/* … */}` directly inside `return (` (or a `.map(… => (`) before the element is an expression, not a comment slot → rule: annotate JSX roots with `//` line comments between `(` and the element, or put the comment inside the element.


### Shipped a failing test by trusting truncated `tail` output → red CI on main
**What:** The Control Map PR merged, then every CI run went red. Cause: `ControlMap.test.tsx`
used `getByText('72%')`, but 72% renders twice by design (overall ring + CMMC framework
rollup), so Testing Library throws on the multiple match. Locally I'd run vitest with
`| tail -8`, saw "27 passed", and committed — the failing line was above the tail window.
**Root cause:** verified the suite from a truncated view, never checked the explicit
failed-count, so a real failure scrolled off-screen.
**Rule:** after any `vitest`/`npm test`, assert on the SUMMARY LINE — grep for `Tests .*failed`
or confirm `failed (0)` — never conclude green from a truncated `tail`. For a targeted file,
run it un-truncated. Duplicate-by-design text ⇒ `getAllByText`, never `getByText`.

### "Rearrange the sections" survives a contract-locked file when order is CSS, not DOM
**What:** The founder wanted the console's Overview sections reorderable/hideable, but
`LiveCommandCenter.tsx` is pinned by ~40 structure assertions (many use proximity like
`hero[\s\S]{0,400}plan-chip`) AND one test asserts the literal `<OverviewCharts onSource={setProv} />`.
A DOM reorder (mapping over a user-ordered array, or moving nodes) risks changing the file's
text order and detonating those greps.
**Root cause:** Contract tests read the FILE SOURCE, not the rendered DOM. Source order is the
thing under test; visual order is free.
**Rule:** For "let the user rearrange", wrap each section in place and drive `style={{ order }}`
+ visibility from a persisted prefs array on a `display:flex;flex-direction:column` container.
The JSX stays in written order (every substring/proximity assertion still matches) while the user
sees their own order. Hidden = `return null` in normal view (removed from flex flow), dimmed in edit
mode. Neutralize the wrapped sections' own margins so the container `gap` owns spacing.

### A runtime theme is inline-vars over file defaults — and the JS-painted marks need their own hook
**What:** Six switchable designs had to retint BOTH the hero and the console without changing the
CSS files (whose default tokens are contract-pinned: `--bg: var(--hs-aurora-bg…`, the donut literal,
etc.). Naively editing the stylesheet defaults would fork the "default == launch skin" guarantee.
**Root cause:** Two kinds of surface: CSS-var-driven (retint for free when you override the vars) and
imperatively-painted (canvas `strokeStyle`, conic-gradient donut string) which can't read a `var()`.
**Rule:** Apply a theme as an INLINE style map of the local token names on the surface root — file
defaults stay, contract greps stay green, and the override wins. For the JS-painted marks, read the
active theme from a `themeRef` (updated every render) inside the paint fns, and expose a `redrawRef`
the theme-change `useEffect([themeId])` calls to repaint. Also var-ize any hardcoded near-white
(`.top` bg, spine `#fff`) or a "dark mode" leaves light patches. Keep one theme (the default) exactly
equal to the baked tokens so the initial render is byte-unchanged; update the one contract assertion
you genuinely moved (donut literal → registry) rather than weakening it.

### Free-for-everyone means NO entitlement import near the feature — say it, and test it
**What:** Personalization (theme + layout) had to be ungated. Easy to reflexively wrap it in the same
`hasFeature(ent, …)` gate every other console capability uses.
**Rule:** Comfort/accessibility features (theme, layout, density) are ungated by policy — persist to
localStorage, no server, no entitlement read. Make the intent visible in the UI ("free for everyone")
and pin it: a contract test that the customize banner says so and the controls read `prefs.*` directly,
never `hasFeature`. Don't confuse "personalization" with "a paid capability".

### Reskin CSS-variable-driven surfaces at the token layer — don't rewrite the tested markup
**What:** The `/console` dashboard needed a full visual reskin, but its markup is
locked by ~40 contract assertions (evidence-chain spine, KPI provenance dialogs,
CUI warning, panel captions, logo-hover tilt). A naive "rewrite the dashboard"
would have detonated the suite.
**Root cause:** `LiveCommandCenter` is entirely driven by CSS custom properties
(`--bg`, `--panel`, `--line`, accent tokens). The whole look flows from the token
block at the top of `lccStyles.ts` + a handful of literal-hex spots in the effect.
**Rule:** To restyle a token-driven surface, change the tokens + the few literal
paints (donut/ring conic, canvas strokeStyle) and leave the markup alone. One
new shared token block in `globals.css` reskinned both the hero and the console
without touching a single contract-locked string. Verify with a screenshot, not
just green tests — tests prove structure held, the screenshot proves it's pretty.

### A shared visual language belongs in ONE token block, not copied into each surface
**What:** "Make the hero and the dashboard look the same" is a drift trap if each
surface hard-codes its own gradient/accents.
**Rule:** Define the shared skin (gradient, glass, pastel accents, CTA) once in
`globals.css :root` (`--hs-aurora-*`); every surface references the vars with a
literal fallback so it's still self-sufficient. Lock "defined once + referenced by
both" in a contract test so a future edit to one surface can't silently fork the look.

### A "circular badge wrapper" around <Logo> breaks the shared logo-hover tilt contract
**What:** Wrapping `<Logo>` in `<span class="hd-badge">` for the SubTracker-style
brand badge failed `logo-motion-contract` — it asserts `<Logo>` is the DIRECT child
of the `group/brand` element (the hover-tilt is bound through `group-hover/brand`).
**Rule:** Put `group/brand` (and any wrapper class like the badge) on the SAME
element that directly precedes `<Logo>`, e.g. `<span class="hd-brand hd-badge group/brand"><Logo/></span>`.
Never insert a node between the `group/brand` element and `<Logo>`.

### A client-side "prove it yourself" tool must import only the local engines — never the cloud scanner
**What:** The Instant Snapshot scans pasted prompts in the browser. `lib/reports/` holds both the
pure-regex engines (`BUILTIN/CMMC/HIPAA` patterns) and cloud scanners (`risk-engine.ts`,
`gemini-scanner.ts` → Gemini). Pulling a cloud scanner into a `"use client"` component would ship a
network call into the bundle and silently break the entire "nothing leaves your network" promise the
tool exists to prove.
**Root cause:** Co-located modules make the wrong import one autocomplete away; a green build says
nothing about whether the boundary held.
**Rule:** On any client-side scan path, import ONLY the regex engines. Findings carry the pattern
NAME + classification, never the matched substring (`blockEventFromFinding`). Any server-bound
endpoint for it takes a `.strict()` counts-only schema with NO field for prompt text — a smuggling
attempt must 400, not forward. Guard-test both: component asserts no raw substrings render; route
asserts `inputText` is rejected.

### An honest preview needs a `snapshot` flag, not a second PDF generator
**What:** The snapshot PDF and the signed 14-day report share `buildComplianceDoc()`. A preview
cannot claim tamper-evidence, a Merkle audit chain, an SPRS score, or C3PAO-readiness — but forking
the generator would drift the two artifacts apart over time.
**Rule:** Branch honesty claims on a single `ReportData.snapshot` flag inside the one generator;
unit-test it as two disjoint claim sets (`SIGNED_ONLY_CLAIMS` absent in snapshot, `SNAPSHOT_CLAIMS`
present). One code path, two honest documents — the #205 data-honesty doctrine applied to PDFs.

### Verify a React controlled input by REAL keystrokes, not synthetic events or JS-set values
**What:** Live-verifying the snapshot on the dev server, `computer type` on a cold-hydrated textarea
and a native-setter + `dispatchEvent(new Event('input'))` both left the controlled `<textarea>` at
value 0 — React state never updated, Scan stayed disabled. It looked like a product bug; it was
sandbox/hydration friction. After a fresh navigate (warm hydration), real `computer type` populated
the field and the whole flow (scan → findings → PDF → CTA) worked.
**Rule:** For controlled inputs in the in-app browser, drive with real keystrokes after warm
hydration and confirm via `.value`; don't trust JS-set values or synthetic input events (same gotcha
class as the FAQ deep-link scroll). Unit tests already prove the logic — browser checks are for
render + no-leak + no console errors, not for re-proving state wiring.

---

## 2026-07-15

### Screenshot UI against `next start`, not `next dev` — cold compiles + networkidle wedge the pass
**What:** A 20-page Playwright screenshot pass against the dev server timed out twice (7m, 10m):
every route cold-compiles on first hit, `networkidle` never settles (analytics keep sockets open),
and the killed run left the dev server wedged (curl timed out entirely; container restart cleared it).
Against the production server (`npm run build && next start`) the same pass finished in ~3 minutes.
**Rule:** For browser verification sweeps, run the build gate FIRST, then screenshot against
`next start` with `waitUntil: 'domcontentloaded'` + a fixed settle wait. Dev-server screenshots are
only for single-page spot checks. This also enforces the existing "never build while dev runs" rule
by construction — the dev server is never up during the gate.

---

## 2026-07-14

### A scoped `* { margin:0; padding:0 }` reset silently beats Tailwind utilities injected after the global sheet
**What:** Embedding the Tailwind-styled guide/paywall panels inside the Live Command Center shell
stripped ALL their padding/margins — clipped CTAs, flush text. The shell's component-injected
`<style>` has `.hs-lcc * { margin:0; padding:0 }`; it renders after the global stylesheet, so at
equal specificity it wins over every `p-*`/`m-*` utility in the subtree. Build + unit tests were
green; only the screenshot pass caught it.
**Root cause:** A scoped hand-rolled reset assumes it owns every descendant; the moment Tailwind
components are composed inside, cascade order decides and the reset wins.
**Rule:** Scoped resets must be ZERO specificity: `:where(.scope *) { margin:0; padding:0 }` (keep
`box-sizing` on the strong selector — it conflicts with nothing). Then utilities and scoped classes
always win, while bare elements still get the reset. And when a shell composes foreign-styled
children, screenshot the composition — green tests never render the cascade.

### A backtick inside a template-literal CSS comment truncates the stylesheet AND becomes live code
**What:** Writing a code comment inside the LCC_CSS template literal that quoted a selector in
backticks terminated the string early; the rest parsed as JS (`.hs-lcc *` → `hs - lcc`) and threw
`ReferenceError: lcc is not defined` at chunk load — the whole /console error-boundaried. `next build`
compiled it fine (syntactically valid); tsc WOULD have caught it, but the gates had been run before
that final edit.
**Root cause:** Backticks in prose inside a template literal + declaring gates green before the last
edit landed.
**Rule:** Never use backticks (or `${`) inside template-literal CSS/comment prose — quote with
double-quotes. And gates count only if they run AFTER the final edit: any change to shipping code,
however cosmetic-looking, re-runs at minimum tsc + a page load of the affected route.

---

## 2026-07-13

### A specific founder instruction that contradicts the plan → run the HERMES CHALLENGE, don't silently comply OR silently refuse
**What:** Founder asked to build a tier-gated dashboard (restricted-free / full-paid). That's Stage-2
subscription plumbing the plan says defer until the $499 report sells (0/3), and it gates tiers nobody can buy
(`payments:missing_key`) on a console ~nobody reaches (OAuth login dead). First instinct was to treat the
ambient "boil the ocean" mantra as consent and just build. The stronger reviewer flagged: that mantra is
pasted on every message — it's not specific authorization for *this* tradeoff.
**Root cause:** Conflating a standing maximalist directive with informed consent to a specific off-plan build.
**Rule:** When a concrete request contradicts a written plan constraint, surface the *specific* tradeoff with
the facts (the project's own HERMES CHALLENGE mechanism / an explicit question) before building. "You decide"
+ the facts in front of them = a real override; the mantra alone is not. Then build the on-plan version if one
exists (here: gate the dashboard, but funnel every upgrade to /pricing → the live $499 report, not
un-purchasable subscription SKUs).

### Before fearing a dark-on-light design clash, check whether an existing remap already themes it
**What:** Worried that embedding the dark-styled 110-control `AssessmentBoard` (text-white, bg-white/[0.03])
inline on the light `/console` would break the design. Turned out `app/command-center/layout.tsx` already
wraps the whole command-center — assessment included — in `.cc-light`, a globals.css remap that turns exactly
those dark utilities into the light Steel & Cream palette. Mounting the board inside the console's own
`.cc-light` scope themes it identically, zero new CSS.
**Root cause:** Almost re-themed / duplicated styling to solve a clash a shared mechanism already handled.
**Rule:** Before restyling a component to fit a new context, check for an existing theme-scoping layer
(`.cc-light` here) that the component already renders under elsewhere — reuse the scope instead of forking styles.

---

## 2026-07-12

### A manually-fulfilled sale needs an actionable alert, not just a receipt — and check the default before crying catastrophe
**What:** Traced the $499 flow and found the webhook emailed only the buyer on a sale, never the founder.
First framing was "customer pays → founder blind → customer gets nothing → catastrophe." Advisor caught it:
Stripe emails the merchant a receipt by default, so the founder is NOT blind. The real (narrower, still real)
value is an *actionable* alert for a hand-fulfilled product — buyer, vertical, retail/wholesale, "start the
14-day assessment" — vs Stripe's generic "you got $499."
**Root cause:** Assumed absence of a notification without checking the platform's default behavior; inflated
severity to justify the build.
**Rule:** Before framing a missing-notification as a silent-failure catastrophe, verify what the platform
already sends by default. Build the feature for its true marginal value and describe it honestly in the
commit/PR — never claim "customers were getting nothing" when the receipt already existed. For a
manually-fulfilled product, the alert must be *actionable* (what to do), not just informational.

### The env var was "added" but prod can't see it → it's scope, not a missing redeploy
**What:** Founder set `STRIPE_SECRET_KEY`; `/api/health` still read `payments: missing_key` — AFTER a merge
had already redeployed prod (uptime 204s = fresh boot). Kept the diagnosis honest: since a redeploy already
happened and failed, the cause is Production-scope-not-ticked / name-typo / stray-quotes, NOT "you forgot to
redeploy."
**Root cause:** The generic advice ("add var, redeploy") had already been followed; repeating it would waste
the founder's time on the wrong fix.
**Rule:** When an env var "is set" but the app can't read it AND a deploy has already happened since, stop
saying "redeploy." Point at Vercel env **scope (Production vs Preview)**, exact **name**, and **quotes/whitespace**
in the value — the three real causes. Give the load-bearing sentence first, not buried under a feature.

### A form that fakes success is a silent lead shredder — worse than a dead button
**What:** `/contact`'s `handleSubmit` ran `setTimeout(1500) → setSubmitted(true)` and showed
"Message sent" while sending NOTHING — no fetch, no email. Every lead vanished, including the $499
buyers the dead-Stripe checkout deflects to `/contact?topic=assessment-report`. A visible 503 would
have been better: at least the buyer knows to try again.
**Root cause:** A demo-stubbed UI (fake async to show the success animation) shipped as if it were
wired. Green tests + green build never exercised the network path because there wasn't one.
**Rule:** Any form that shows a success state MUST make a real request and only succeed on `res.ok`.
On failure, degrade honestly (show the direct email) — never a fake success. Guard the wiring with a
source-contract test (`fetch("/api/...")` present; no `setTimeout(...setSubmitted)`). When checkout is
the known blocker, audit EVERY lead-capture surface for the same silent-drop pattern before adding features.

### Freshness-check the one variable that can flip a merged verdict — don't re-run the whole validation
**What:** Asked to "re-validate the idea." The 7-axis validation had merged 12h earlier (#177). Re-running
the full multi-agent web crawl would burn tokens re-deriving a known CONTINUE. Instead did a single
TinyFish check on the only kill-criterion input that could have changed since: CMMC Phase 2 timing
(still Nov 10 2026 — no slip).
**Rule:** A recent merged conclusion is an asset, not something to redo. Re-check only the load-bearing
variable(s) that could invalidate it; cite the merged doc for the rest. Redundant re-work is the same
anti-pattern as building instead of selling.

### Eight months building, zero selling — the product was never the problem
**What:** Validation across 7 axes found the product live, honest, and in a real market with intact CMMC timing — yet $0 revenue and 0 customer conversations. Both payment paths were dead (`/api/health` payments:missing_key; backup Stripe link expired), so the company literally could not take money.
**Root cause:** Effort compounded on the 90% that feels safe (building) and avoided the 10% that produces revenue (checkout + selling). Classic "built the product, skipped distribution."
**Rule:** Before any new feature, verify a customer can actually pay (`/api/health` must show `payments: connected`) and that ≥1 real sales conversation is in flight. If either is false, the only allowed work is fixing checkout or selling. No exceptions until first revenue.

### Verify a payment link is live before wiring it into UI
**What:** Was about to wire the recorded Stripe payment link into the /assessment CTA as a checkout-key workaround; a pre-flight curl showed it returns "Expired."
**Root cause:** Trusted a link recorded in todo.md weeks earlier without checking its current state.
**Rule:** Never ship a payment/redirect URL without a live check first (`curl` for HTTP 200 + expected content). A dead payment link is worse than a contact form.

## 2026-04-25

### OODA Analysis: Cloud DLP architecture is a CMMC disqualifier

**What:** Full competitive analysis revealed every major AI DLP vendor (Nightfall, Strac, Cyberhaven, Netskope) sends CUI to their cloud for scanning, which is itself a potential DFARS 7012 violation.
**Root cause:** Cloud vendors optimize for SaaS economics, not on-premise compliance requirements.
**Rule:** In every sales conversation and in all copy, use the exact sentence: "Every cloud-based AI DLP tool sends your CUI to their servers to scan it. That is itself a potential CUI spill under DFARS 7012. HoundShield scans everything locally. Nothing leaves your network." Never abbreviate this to a vague "local-only" claim.

### OODA Analysis: PDF report is the purchase unlock, not the dashboard

**What:** Jordan's primary need is evidence she can hand to a C3PAO auditor, not a real-time dashboard. The dashboard has features Jordan doesn't need. The PDF report doesn't exist yet.
**Root cause:** Engineering effort went toward impressive features, not evidence-grade compliance artifacts.
**Rule:** Sprint 1 does not ship any new dashboard features until PDF report generation works end-to-end. PDF first. Dashboard polish never.

### OODA Analysis: C3PAO channel beats cold outreach 10-to-1

**What:** C3PAOs each have 20-100 defense contractor clients who are actively seeking compliance tools. One C3PAO conversation = 10-50 potential customers. Cold contractor outreach is slow and unscalable.
**Root cause:** No explicit channel strategy before this analysis.
**Rule:** Sprint 2 goal is one signed C3PAO referral partner. Measure pipeline by C3PAO partners, not individual contractors contacted.

### Brain AI: static research.md was not queryable

**What:** brain/research.md existed as a well-documented static file but could not be queried programmatically by agents or founder during development.
**Root cause:** Initial implementation documented knowledge for humans to read, not for agents to query.
**Rule:** All new knowledge is written to the knowledge-graph via `addKnowledge()` in `lib/brain-ai/brain-query.ts`. The static research.md is append-only for human reference. Agents query the graph, not the markdown file.

### External repos: features extracted via research, not full integration

**What:** User provided 20+ repo URLs for feature extraction. Attempting to clone and fully integrate all of them would take weeks and introduce scope creep.
**Root cause:** Maximalist feature requests without a priority filter.
**Rule:** External repos are extracted into skills (.claude/skills/) with documentation of what each provides and when to invoke it. Full code integration only happens when a specific sprint task requires it. Skills are documentation-as-code; they don't increase bundle size.

---

## 2026-04-26

### `??` does not narrow `string | string[]`
**What:** `req.params.orgId ?? ""` still typed as `string | string[]` — 5 TypeScript build errors in server.ts after Express params destructuring.
**Root cause:** `??` removes `null | undefined` only. `string | string[]` is never nullish, so the union is unchanged. Express `@types/express@^5` types `ParamsDictionary` values as `string | string[]` in some paths.
**Rule:** For Express route params, cast at destructuring: `const orgId = req.params.orgId as string`. Named URL segments are always strings at runtime; the cast is safe and correct.

### better-sqlite3 named params must be exhaustive
**What:** `addQuarantineRow` threw `Missing named parameter "nist_control"` at runtime even though the column has a default.
**Root cause:** better-sqlite3 requires every `@named` parameter in the SQL to be present in the bound object. SQLite column defaults don't substitute for missing JS-side params.
**Rule:** Always spread explicit `null` defaults for optional columns before spreading the caller-supplied object: `{ pattern_name: null, nist_control: null, ...row }`.

### Vitest module caching bleeds state across tests
**What:** `sample_count toBe(10)` got 20 — a second test saw the previous test's DB writes.
**Root cause:** Vitest caches ESM modules. `beforeEach` recreated the DB path env var but the singleton inside the module kept the old handle.
**Rule:** Always call module-level `resetBaselineCache()` / `resetRateTracker()` / `closeOodaDb()` in `afterEach`. For count-based assertions, read the baseline value *before* the operation and assert the delta, not an absolute value.

---

## 2026-04-20

### SSR crash with Recharts
**What:** PlatformDashboard crashed during `npm run build` — `document is not defined`
**Root cause:** Recharts accesses browser globals at module load time. Next.js App Router runs server-side by default.
**Rule:** All Recharts components MUST be wrapped in `dynamic(() => import(...), { ssr: false })`. Never import Recharts at the top level of a Server Component.

### Framer Motion + preserve-3d conflict
**What:** 3D tilt on HeroSection caused child elements to flatten in Safari.
**Root cause:** `transformStyle: "preserve-3d"` and Framer Motion's internal transform system conflict — Motion overrides transform properties and breaks the stacking context.
**Rule:** Never set `transformStyle: "preserve-3d"` on a `motion.div`. Apply 3D transforms via Framer Motion's `rotateX`/`rotateY` props only.

### Webpack HMR cache corruption
**What:** `__webpack_modules__[moduleId] is not a function` error after hot reload.
**Root cause:** Stale `.next/` cache with mismatched module hashes after major component restructure.
**Rule:** After deleting/renaming component files or changing dynamic import targets, run `rm -rf .next` before restarting the dev server. Do not retry HMR — cache is corrupt.

### Agent `memory: project` field missing
**What:** Agents were not persisting cross-session context despite having access to memory tools.
**Root cause:** The `memory: project` frontmatter field was absent from all agent definitions. Without it, Claude Code does not inject project memory into the agent's context window.
**Rule:** Every agent that needs session continuity (code-reviewer, debugger, test-writer, security-auditor, compliance-specialist, refactorer, doc-writer, team-lead) MUST have `memory: project` in its frontmatter.

### WebFetch on JS-rendered pages
**What:** Fetching LeadGenMan resource URLs returned only page title — no content.
**Root cause:** Pages are React SPAs. WebFetch fetches raw HTML; JavaScript has not executed, so the content is absent from the response body.
**Rule:** For JS-rendered pages, use Playwright MCP (`browser_navigate` + `browser_snapshot`) instead of WebFetch. WebFetch is only reliable for static HTML and JSON APIs.

---

## 2026-04-29

### TypeScript strict mode is not optional
**What:** Using `any` types to "move faster" caused runtime errors in scanning paths that TypeScript would have caught.
**Root cause:** Time pressure → unsafe casts → undefined behaviour in production.
**Rule:** Zero tolerance for `any` in compliance-critical code. Use `unknown` + Zod `.parse()` at every external boundary. Run `tsc --strict --noEmit` before every commit.

### Sub-10ms latency is an architectural constraint, not a target
**What:** Features added without measuring latency impact pushed scanning above 10ms threshold.
**Root cause:** Treating latency as a post-implementation concern rather than a design input.
**Rule:** Every new feature must answer "what is the latency cost?" before implementation. Benchmark critical paths before and after. Regex fallback is mandatory for deterministic high-frequency paths.

### Test coverage is compliance evidence, not a metric
**What:** Skipping tests on CUI detection paths left audit trail gaps that would fail a C3PAO review.
**Root cause:** Treating test coverage as a quality metric rather than a compliance artifact.
**Rule:** 100% coverage of all CUI/PII/PHI detection functions. Test both detection (true positive) and non-detection (false positive) cases. Audit log paths must have integration tests.

---

## 2026-06-06

### Branch truth: origin/main was stale; prod deploys from feature/beast-ui-v3
**What:** The primer claimed `origin/main` is production (29 ahead). `git fetch` proved origin/main = `1d1a498` (May 13) with NO v3 steel design and none of the cleanup targets. The v3 design + Vercel prod deploy live on `feature/beast-ui-v3` (27 ahead).
**Root cause:** Stale primer + ~30 forked branches; trusting branch claims without verifying the remote.
**Rule:** `git fetch origin`, then VERIFY content (`git show <ref>:path`, `git log <ref>`) before trusting which branch is production. Base design work on `feature/beast-ui-v3`.

### Security: refuse leaked API keys, always
**What:** A repo + pasted `sk-…` keys were offered as "free LLM API keys" — leaked/stolen OpenAI secrets.
**Root cause:** "Free API keys" repos are often dumps of stolen credentials.
**Rule:** Never wire third-party/leaked keys. Use each provider's own free tier with the user's OWN key in gitignored `.env.local` (verify it's gitignored first). For a compliance product, stolen creds are existential risk.

### Tooling: `| tail` masks the real exit code
**What:** `npm run build 2>&1 | tail` reported "exit 0" while the build actually FAILED (`Cannot find module @sentry/nextjs`). The exit was tail's.
**Rule:** For gates, run without a masking pipe (or `&& echo OK`) and READ the output for "Compiled successfully" / the test summary. Never trust a piped exit code.

### Build env: deps declared-but-uninstalled; the app has its own node_modules
**What:** Local build broken — `@sentry/nextjs` + `@vitejs/plugin-react` declared but not installed.
**Rule:** On module-not-found, `cd compliance-firewall-agent && npm install` (app uses its own node_modules, npm per package-lock). Repair env before assuming a code bug.

### Shell: zsh does NOT word-split unquoted `$VAR`
**What:** `for f in $LIST` (space-joined string) ran sed ONCE on the whole string → silent no-op + a false "ZERO ✓".
**Rule:** In zsh, iterate a literal list or a command-substitution (`$(find …)` DOES split), not `$VAR`. Verify a transform actually applied — don't trust a grep that ran on an invalid path.

### QA: never ship UI blind — verify in a real browser
**What:** HeroScanLog / NavV3 mega-menu / spotlight passed jsdom tests + a green build but were never rendered. A real-browser pass confirmed they look great AND surfaced a `/features` dup-key console error + a stray `rose-*` color the tests/build missed.
**Rule:** After substantial UI work, run the dev server + load it in Playwright, screenshot, read the console. Build-green + tests-green ≠ renders-correct.

### Token pass: scan the FULL palette + components, not just emerald/purple/amber/indigo
**What:** First pass only hit 4 colors on `app/**/page.tsx`; the browser found `rose-*` and that `components/` were missed.
**Rule:** Off-brand = ANY Tailwind color that isn't `brand`/`slate`/`--hs-`/semantic. Scan `app` AND `components`, full palette. Light → `--hs-` tokens; dark dashboard → direct Tailwind is design-permitted.

### Architecture flag: two navs coexist (NavV3 vs Navbar)
**What:** `NavV3` (light, 2 pages) and `Navbar` (rich: flyouts + mega-menu + counter + variants, 11 pages) both exist; Navbar is the richer one.
**Rule:** Consolidating onto one nav is a design decision — surface to the founder, don't unilaterally migrate (NavV3 would downgrade 11 pages).

## 2026-06-11

### Design split-brain: v3 migration stopped at 3 pages

**What:** Only home/pricing/how-it-works adopted the v3 light-steel design; 21 public pages (blog, login, docs, demo...) stayed on the old dark theme with the old cat-mask logo — users saw a different product on every click. Pricing had white-on-white invisible prices; homepage CTA linked to /sign-up (404).
**Root cause:** Redesigns were shipped page-by-page with no migration checklist and no "every page uses NavV3/FooterV3" gate.
**Rule:** Any design-system change lands with a grep gate in the same PR: `grep -rl "components/Navbar\|LandingFooter\|text-white" app/` must return only intentionally-dark routes (/command-center). A deterministic token-swap codemod (see /tmp pattern in PR #-this) converts a page in seconds — never migrate by hand, never migrate partially.

### Brand renames need a single sweep, not vibes

**What:** "Hound Shield" (two words) survived in 110+ files — including a broken `Hound ShieldClient` class name in customer-facing SDK snippets and an invalid `X-Hound Shield-Org` HTTP header.
**Rule:** Brand strings live in copy, code identifiers, HTTP headers, emails, and tests. Rename = one `grep -rl | perl -pi -e` sweep + test-suite assertions on the new name.

## 2026-06-23

### `/partner` (dashboard) vs `/partners` (marketing) — don't confuse them
**What:** The brain's file map says `app/partner/page.tsx` is the "RPO/MSP referral page." It is
actually the authenticated C3PAO multi-tenant **dashboard**. The public marketing referral page is
`app/partners/page.tsx` (plural). Reframing the wrong one would have left the legally-prohibited
C3PAO-endorsement copy live on the page buyers actually see.
**Rule:** Verify route purpose by reading the file, not the file-map label. `/partner*` = authed
dashboard; `/partners` = public marketing. Channel/copy reframes land on `/partners`.

### C3PAO-endorsement framing is a legal violation, not just off-message
**What:** `/partners` led with "Every Client You Assess Could Be Paying You Forever" and "Built for
C3PAOs First" — pitching assessors to refer a tool to clients they assess. That's barred by 32 CFR
Part 170 / ISO 17020 cooling-off.
**Rule:** The partner channel is RPOs/MSPs. Any "assess + refer" framing is prohibited. When a page
is saturated with the wrong framing, rewrite it wholesale (a partial sweep leaves stray violations —
same failure mode as the v3 design split-brain) and add an explicit C3PAO-exclusion note.

### Fictional metrics hide in stats bars and CTA copy
**What:** `/pricing` shipped "2M+ scans," "500+ teams." Buyers verify everything; these are on the
NEVER-DO list. They lived in a decorative "stats bar" + the bottom-CTA paragraph.
**Rule:** Replace fabricated counts with verifiable claims (deployment modes, NIST mapping, the
demo's <10-minute path). Grep `2M+|500+|Teams protected|Scans processed` before shipping any
marketing page.

### One-time products need their own checkout path
**What:** The existing `/api/stripe/checkout` is subscription-only (`mode:'subscription'`, requires
auth). The $499 report is one-time and must not force signup before payment.
**Rule:** One-time = a separate `mode:'payment'` endpoint, no-auth, email collected by Stripe, fulfilled
via webhook branch on `session.mode === 'payment'` into a dedicated table. Keep the subscription path
untouched and assert in tests that subscription retrieval never runs for a report order.

### Brain AI must answer identity questions offline

**What:** "who are you" returned the generic fallback because the FAQ layer had no identity keywords and prod has no OPENROUTER_API_KEY.
**Rule:** The deterministic FAQ layer owns: identity, greeting, pricing, install, contact. Any demo-critical answer must work with zero API keys. Test: `findFaqAnswer("who are you")` is part of the suite.

---

## 2026-06-24 — launch-readiness sweep (branch dreamy-mcclintock-fc9d8b)

### `git fetch` and diff against origin/main BEFORE building, not at PR time
**What:** Worked a whole launch sweep on a worktree cut at #123. Built a `DeploymentBoundaryNote` component, re-added logo idle-breathe, removed a fabricated "2M+/500+" pricing stat bar — then the PR came back `CONFLICTING` because origin/main had already shipped all three: `ModeBNotice` (#122/#123), logo-motion-on-every-surface (#124), and the stats-bar removal. Half the work was redundant; had to reset to `origin/main` and re-apply only the genuinely-missing fixes.
**Root cause:** Trusting the session-start branch snapshot + memory ("logo fixed in #124") without `git fetch origin main` and diffing the actual files first. ~30 stale branches make any local base suspect.
**Rule:** First action on any worktree task: `git fetch origin main && git log --oneline HEAD..origin/main`. If main is ahead, rebase/reset onto it before writing code, and grep main for an existing component before creating a new one (`ModeBNotice` already existed — don't ship `DeploymentBoundaryNote`). A "fixed in PR #N" memory means nothing until you confirm #N is in *this* HEAD.

### Idle animation and hover transform must live on different elements
**What:** A CSS `animation` on `transform` (idle breathe) overrides a `:hover` `transform` on the same element — the animation wins, so hover silently dies. (Mooted here by adopting #124's logo, but the technique stands.)
**Rule:** Compose two transforms by nesting: wrapper owns hover, inner element owns the idle animation; guard both with `motion-reduce`.

### Fabricated social proof hides in `.map()`-ed marketing data
**What:** Pre-revenue, marketing arrays still carried "500+ teams" / "2M+ scans" / a named testimonial. Easy to miss in a visual skim.
**Rule:** Pre-launch, `grep -rEin "[0-9][KM]?\+ (teams|customers|scans|users)|trusted by [0-9]|99\.9" app components`. Replace usage metrics with verifiable product facts; testimonials + history timelines are founder-verify — flag, never fabricate or silently delete.

## 2026-06-26

### `next build` ignores ESLint — `next lint` is a SEPARATE CI gate
**What:** A green local `npm run build` + `npm test` still failed CI's "Build & Test" job, which runs `next lint`. `next.config.js` has `eslint.ignoreDuringBuilds: true`, so build never lints. The failure was a `react/no-unescaped-entities` ERROR (a raw apostrophe `buyer's` in JSX on a new page) — an error-level rule that exits 1.
**Rule:** Before pushing any JSX/TSX, run `npm run lint` (not just build). Escape apostrophes/quotes in JSX text (`&rsquo;`, `&ldquo;`). Local `build` is necessary but NOT sufficient to predict CI.

### Brain AI answers must be sanitized at the output boundary, not trusted to the model
**What:** GlobalChat renders with `whitespace-pre-wrap` (no markdown), and the system prompt literally said "use bullet points" — so answers showed literal `*` and `-`. The FAQ strings are also full of `**`/`- `.
**Rule:** Clean prose is enforced by a deterministic sanitizer (`lib/brain-ai/format-answer.ts` → `cleanAnswer`) applied at the boundary (server FAQ stream + client assembled text), PLUS a "no markdown" system-prompt instruction. The sanitizer converts `-`/`*` bullets to `•` and strips emphasis but PRESERVES real hyphens (`800-171`) — only a `-`/`*` followed by a space at line start is a bullet. Never hand-edit every FAQ string; sanitize once at the boundary.

---

## 2026-06-26 — partner-portal channel reframe (branch HoundShield/frosty-rhodes-841deb)

### The legal line is "refer/resell", not the word "C3PAO" — classify before you sweep
**What:** The authed `/partner` portal self-identified as a "C3PAO Partner Portal / Authorized C3PAO"
running a multi-tenant client roster at $75/client/mo. That reseller/management model is precisely
what 32 CFR Part 170 / ISO 17020 bar a C3PAO from doing. But the same codebase has ~70 files
mentioning "C3PAO" — most are legitimate **product-feature** copy ("C3PAO-ready PDF", "hand to your
C3PAO assessor"), which is correct and must stay.
**Root cause:** Treating "C3PAO" as a blanket find-and-replace target would have wrecked accurate
product copy; treating it as untouchable would have left the legal violation live.
**Rule:** Split C3PAO mentions into two buckets before editing: **channel-identity** (portal brand,
"authorized C3PAO", "refer/resell", "as their C3PAO partner") = FIX → RPO/MSP; **product-feature**
(the PDF artifact's audience is a C3PAO assessor) = KEEP. The fix is scoped to the authed `/partner`
tree + the `/partners` SEO metadata, not the whole app.

### Encode the legal rule as a test, not a memory — and scope the guard precisely
**What:** Added `app/partner/__tests__/channel-framing.test.ts` asserting zero `/c3pao/i` in the authed
`/partner` tree. It immediately caught a 4th occurrence I'd missed — a `{/* C3PAO badge */}` comment
(`grep` of the source had said "4 mentions", I'd only fixed the 3 visible strings).
**Root cause:** Source greps count comments too; a human edit pass skims past them.
**Rule:** For a doctrine/legal constraint, ship a deterministic guard in the *same PR* (the in-PR grep
gate from the 2026-06-11 design-split-brain lesson). Scope it to the surface the rule actually governs
(authed `/partner`, where zero C3PAO is correct) — never the whole app, where feature mentions are
valid. Keep the guard strict (zero token, no allow-list) and word your own explanatory comments to
avoid the banned token so they don't trip it.

### `git fetch` + `npm ci` the worktree before trusting any gate
**What:** First `tsc`/`vitest` run exploded with ~28 "Cannot find module" errors (resend, jspdf,
@vitejs/plugin-react, stripe apiVersion mismatch) — the worktree had **no `node_modules`**, so
resolution fell back to the repo-root `node_modules` with the wrong versions.
**Rule:** A fresh worktree starts with no app `node_modules`. First action before any build/type/test
gate: `cd compliance-firewall-agent && npm ci` (lockfile present). A module-not-found wall is an env
state, not a code bug — repair it before reading the gate (continues the 2026-06-06 lesson).

### Dead nav links are a dangling thread — cut them, don't build the pages
**What:** The portal sidebar linked `/partner/team` + `/partner/settings`, neither of which exists →
two 404s in a portal being presented as polished.
**Rule:** When a nav points at routes that were never built, remove the links (and now-unused imports)
as part of the surrounding fix. Building the missing pages is net-new feature work — flag to the
founder, keep it out of a copy/legal PR (No-feature-creep still holds).

## 2026-07-04 — Close the $499 post-purchase loop (branch claude/do-everything-ooda-1ijxav)

### An RLS policy with no consumer is a dangling thread, not "done"
**What:** Migration 020 added `auth_users_read_own_report_orders` (a customer can read their own
$499 orders) and the changelog marked it complete — but no API or page ever read it. Likewise the
checkout `success_url` passed `?session_id={CHECKOUT_SESSION_ID}` to `/report/thank-you`, and the page
threw it away. The buyer paid $499 and the app never acknowledged their specific order.
**Root cause:** Backend capability (RLS policy, redirect param) shipped without the surface that uses
it. "The migration is applied" ≠ "the buyer can see their order."
**Rule:** When a migration grants a read path, ship the endpoint + UI that exercises it in the same
arc — or it's dead code that silently rots. Grep `success_url`/redirect params for values the
destination never reads. A capability with no caller is incomplete, not deferred.

### Confirm from the payment processor, not the webhook, to beat the race
**What:** The Stripe webhook writes `report_orders` asynchronously; the buyer hits the success_url
immediately. A confirmation page that reads only the DB row shows nothing for the first few seconds.
**Rule:** For an instant post-purchase confirmation, make Stripe the source of truth
(`checkout.sessions.retrieve` + require `payment_status: 'paid'`), then *enrich* with the DB row if it
has landed. The `cs_...` session id is an unguessable bearer token for that one order — safe to key an
unauth lookup on, provided the response is sanitized (mask email, never echo Stripe/customer ids).

### Put the sanitization in a pure function so it's the tested boundary
**What:** Two endpoints (public confirmation + authed list) both return order data. Duplicating the
"mask email, drop Stripe ids, format money/dates" logic risks one path leaking what the other hides.
**Rule:** A single pure `buildOrderView()` is the only thing that constructs the buyer-facing object;
both routes return its output and nothing else. Assert in its unit tests that the raw email and
`stripe_session_id` never appear in the serialized view — the leak test lives with the function, not
scattered across route tests.

## 2026-07-05c — Dark components on light pages, and "wrong username" is usually a fallback

### A dark-themed card dropped on a light page renders white-on-white — screenshot it
**What:** The new `CustomerStatusPanel` used `bg-gradient from-white/[0.05]` (translucent) and white
text — correct inside the dark command-center shell, but on `/console` it sits ABOVE that shell on the
LIGHT page background, so the greeting and CTA text were invisible. Unit tests + build were green; only
a real screenshot caught it.
**Rule:** A component that will render outside its usual theme context must carry its OWN solid
background (here `bg-[#12121b]→[#0b0b12]`), not a translucent one that inherits the page. After any
substantial dashboard UI, screenshot it at desktop AND phone widths (Chromium is preinstalled;
`createRequire('/opt/node22/lib/node_modules/')` loads the global `playwright`). Build-green ≠ readable.

### "Shows the wrong name" is almost always a hardcoded/sample fallback, not a data bug
**What:** Founder: Brain/dashboard shows "the other one". Root cause wasn't the session lookup (that was
correct) — it was a hardcoded `<div className="av">AD</div>` (Acme Defense) in the command-center top bar,
shown to every user regardless of who's logged in, plus sample-org fallbacks.
**Rule:** For personalization, derive the name from the session server-side (`/api/me`, own account) and
wire EVERY identity surface (greeting, avatar, sidebar) to it. Grep the dashboard for hardcoded initials
/ sample names ("AD", "Acme", "Vector Defense") before claiming personalization works.

### Verify the claim before building the fix — the login redirect was already correct
**What:** Founder asked to "come back to the same page after login". Investigation showed it was already
implemented correctly (middleware sets `?redirect=`, login page + OAuth callback honor it same-origin).
**Rule:** Read the existing flow before rebuilding it. Confirm the reported bug reproduces; if the code is
already correct, document that (and look for the ADJACENT real bug — here, the identity fallback), rather
than churning working auth code.

## 2026-07-05 — Customer-aware Brain AI: privacy is an architecture, not a disclaimer

### "AI knows the customer" + "route through a commercial LLM" = spillage unless you split compute
**What:** The ask was to make Brain AI know each customer's status. Brain AI routes through
OpenRouter (commercial, non-FedRAMP). Naively stuffing the customer's compliance data into the LLM
prompt would be a spillage event and a cross-customer leak risk.
**Rule:** Compute the sensitive answer DETERMINISTICALLY (`buildStatusAnswer`) and return it before the
LLM path ever runs — the request never reaches OpenRouter. Keep assessment data client-side
(localStorage) and merge only the user's own sanitized summary server-side. "The AI is personalized"
must never mean "the customer's data went to a third-party model."

### Consent is a persisted, revocable, default-OFF flag — and the code must fail closed
**What:** "Ask permission what info the AI can access" → a `profiles.brain_ai_data_consent` column
(default false, `..._updated_at` for audit), a settings toggle that states exactly what's in/out of
scope, and a `/api/brain/consent` own-row endpoint.
**Rule:** Anonymous, demo mode, and every error path resolve to `{ consent: false }` → Brain AI ASKS
permission rather than revealing anything. Default-off + fail-closed is the only safe posture for a
data-access gate; a bug should withhold data, never expose it. Encode the "asks permission" behavior
as a test (`statusAnswerFromConsent({consent:false}) === CONSENT_REQUIRED_MESSAGE`).

### One engine for the panel AND the AI, or the guidance drifts
**What:** The dashboard panel and Brain AI both answer "what's my next step". If they compute it
separately they will eventually disagree, and the customer won't trust either.
**Rule:** A single pure `buildCustomerStatus()` is the only place stage/next-step logic lives; the
panel renders it and Brain AI formats it. Cross-customer safety is structural: the engine only ever
receives the current user's own data (own-row RLS on every read), so it cannot leak across tenants.

### "Update all the info" ≠ invent new numbers — refresh stamps, advance roadmaps, add real releases
**What:** "Update site info through July 2026" with "no false information" and the NEVER-DO ban on
fabricated metrics. The honest moves: a real changelog release entry for what actually shipped, and
advancing now-past roadmap quarters (Q2→Q3). Not: inventing customer counts or scan totals.
**Rule:** Freshness = correct dates + real shipped features + advanced future-dated plans. Never
manufacture a metric to look current — buyers verify everything (recurring lesson).

### Global client components must lazy-load heavy datasets
**What:** `GlobalChat` renders on every page. Statically importing the 110-control dataset (to compute
the SPRS slice) would bloat first paint on marketing pages.
**Rule:** In a globally-mounted client component, `await import()` heavy data only at the moment it's
needed (on send), so Next code-splits it out of the shared bundle. Guard the dynamic import in a
try/catch and degrade to null.

## 2026-07-10 — Unseen-issues sweep: gates that don't run are gates that don't exist

### The proxy (the actual product) had ZERO CI coverage
**What:** ci.yml gated only `compliance-firewall-agent`. The proxy's vitest setup had been broken
for an unknown time (Vite walked up to the repo-root `postcss.config.mjs`, whose Tailwind plugin
isn't resolvable from `proxy/`, killing the whole suite before one test ran) — and nothing noticed.
**Rule:** Every package with a test script gets its own CI job. In any nested package's Vite/Vitest
config, pin `css: { postcss: {} }` so config-file upward search can't escape the package.

### A step's own `env:` block is invisible to that same step's `if:`
**What:** docker-publish.yml guarded login/push with `env.DOCKERHUB_USERNAME != ''` where the env
var was declared on the same step — the guard always read empty, so the Stage 1 "publish
houndshield/proxy:latest" deliverable could never actually publish, even with secrets configured.
**Rule:** Hoist the env mapping to JOB level (`jobs.<id>.env`) — job-level env IS visible in step
`if:`. Never gate a step on its own `env:` block, and never reference `secrets.*` inside any `if:`
(GitHub rejects the whole workflow file at validation — the run fails in 0s named by file path,
which is the fingerprint of an invalid workflow, not a failing job).

### A repo-structure gate that isn't in CI silently rots
**What:** PR #146 deleted the holding folders; `npm run verify:structure` had been failing ever
since because the manifest + PROJECT-STRUCTURE.md were never updated — and nothing ran the script.
**Rule:** Structural changes update the verifier manifest + doc in the same PR, and the verifier
runs in CI (Structure Guard job) so drift fails loudly.

### Warnings-only lint + `--max-warnings 0` pre-commit = landmines
**What:** 153 lint warnings sat in main; the pre-commit hook blocks ANY staged file with a warning,
so touching those files blocked unrelated commits. Also: `eslint-plugin-unused-imports` auto-fixes
unused imports on `lint --fix`; `^_` ignore patterns make intentional unused args explicit.
**Rule:** Keep main at zero warnings — the hook's `--max-warnings 0` makes every warning someone
else's future blocker. Unused-vars cleanup is also bug-hunting: it surfaced never-sent system
prompts (SecurityAdvisor) and a sign-up flow with no success feedback.

## 2026-07-04 — Logo motion: the cascade loophole (PR #144)

### A running animation silently kills any hover transform — guard the mechanism, not the instance
**What:** Founder reported the logo "moves sideways" on hover instead of tilting. PR #143 had attached
`hs-logo-sway` (translateX ±3px, infinite) to every logo via per-component `[animation:…]` Tailwind
classes. The correct hover pose (`rotate(-4deg) scale(1.06)`) was ALREADY in the shared
`.logo-img`/`.logo-on-dark` rule in globals.css — but a running CSS animation's keyframe transform
beats the hover `transform` declaration in the cascade, so the classes overrode it everywhere.
**Rule:** Logo motion lives in exactly THREE places — globals.css shared rule, hermes.css `.brand-mark`
rule, lccStyles.ts `.hs-lcc .brand` rule — never per-component. Any `[animation:…]` class on a logo
element is a bug even when it "looks intentional."
**Guard:** `app/__tests__/logo-motion-contract.test.ts` parses actual CSS rules: any rule targeting a
logo surface may not contain translate/matrix/skew and may only run allowlisted animation names
(closes the rename-the-keyframes evasion). Negative-tested against injected violations before trusting.

### Multi-agent adversarial review earns its cost on GUARD tests, not just shipping code
**What:** 3-lens review of the diff found shipping code clean, but confirmed 3 evasion holes in the
brand-new guard test itself (keyframe-name evasion, translate smuggled into the hover pose, brittle
exact-string match). All closed before merge.
**Rule:** When the deliverable includes a regression guard, review the guard as adversarially as the
fix — a guard that can be evaded while green is worse than no guard (false confidence).

### `npm run build` while the dev server runs corrupts `.next` — sequence, don't parallel
**What:** Production build + running dev server on the same `.next` dir → `ENOENT routes-manifest.json`,
dev serving 500s. Fix: stop server, move `.next` aside, restart.
**Rule:** Never run the prod build gate while the preview dev server is up. Gate first, preview after —
or stop/clean/restart the dev server following a build.

### A secret scanner that allowlists PATHS is not a secret scanner
**What:** Building the leak guard, the obvious way to handle ~30 deliberate fake credentials in
tests and demo copy was to skip `__tests__/` and `app/demo/`. That would have passed CI on day one
and been worthless on day two: the next REAL key pasted into a test file — the single most likely
place for one to land — would sail through the gate silently.
**Root cause:** Path exclusions are cheap to write and feel like configuration. They are actually a
permanent, invisible hole shaped exactly like the directories where secrets most often appear.
**Rule:** Allowlist VALUES, never paths. A known fake is recognised by its own shape, so a new
secret in an already-forgiving file still fails. If a self-referential exclusion is truly
unavoidable (the guard's own source), pin its size with an assertion so nobody can grow it.

### Prefix-only secret matching is why teams delete their scanner
**What:** `re_[A-Za-z0-9]+` matched the ordinary identifiers `re_pageview`, `re_patterns`,
`re_evidence`, `re_contexts`. Bare `eyJ` matched every inline sourcemap in `public/_bootstrap.html`
(they base64-decode to valid JSON) and integrity hashes in package-lock.json. A first run produced
13 findings, all benign.
**Root cause:** A prefix is a hypothesis, not a detection. Real credentials are also high-entropy,
long, mixed-class, and free of sequential or repeated runs — and a JWT has a decodable JOSE header.
**Rule:** Treat every false positive as a bug in the guard, not a reason to exclude a file. A noisy
gate gets disabled within a week, which is strictly worse than no gate because it also creates the
belief that scanning is happening.

### A guard nobody has watched FAIL is a guard nobody knows works
**What:** The leak guard's `--self-test` (must-flag vs must-pass fixtures) caught it being wrong
three separate times before it ever ran on a PR: `AKIA1234567890ABCD12` (no repeated char, no
placeholder word — only its `1234567890` sequence gives it away), seven docker-compose connection
strings, and `proxy/PATTERNS.md` documenting the private-key header. Three of the guard's rules
exist ONLY because of those failures. Separately, restoring each shipped bug turned its new
regression test red, and removing it turned it green.
**Rule:** Ship the discrimination proof with the guard. Assert both directions — the bad thing is
caught AND the known-good thing is not — and run it in CI ahead of the real check.

### Verify the rendered artefact in the real client, not the source string
**What:** `lib/email/outreach.ts` read `'Open houndshield.com/demo…'` and every test passed. Pasted
into an actual Gmail draft, that scheme-less URL became
`https://www.google.com/url?q=http://houndshield.com/demo&source=gmail` — a tracking redirect over
HTTP. Same pass: reading the rendered defense draft showed it telling a DoD security manager to
click "Patient Record". Neither defect is visible in the source; both are obvious in the output.
**Rule:** For anything a human will receive — email, PDF, rendered page — read the final artefact in
the client that will render it. Source review and unit tests cannot see what the client rewrites.

### `git add -A` after a conflicted `stash pop` commits the conflict markers
**What:** `git stash push -- <path>` captured more than the pathspec (the changes were staged from a
prior `reset --soft`), so `stash pop` conflicted. The very next `git add -A && git commit` swallowed
`<<<<<<<`/`=======`/`>>>>>>>` straight into a commit, which then exited 0 and looked fine —
the syntax error only surfaced when the file was executed.
**Root cause:** `git add -A` is indiscriminate by definition, and a conflicted working tree is
exactly when indiscriminate staging is most dangerous.
**Rule:** Never `git add -A` immediately after a merge/stash/rebase step that can conflict. Check
`git status` first, and grep the staged diff for conflict markers before committing.

### GitHub Push Protection will reject your own realistic test fixtures
**What:** The first push of the leak guard was rejected: GitHub read two `--self-test` fixtures as a
live Stripe key and a live Supabase token. The offered escape hatch is a per-secret "allow this
secret" unblock URL.
**Root cause:** Good fixtures and real secrets are indistinguishable by design — that is what makes
them good fixtures.
**Rule:** Assemble credential fixtures from split fragments so no complete provider-format literal
exists in the file. Never click the unblock URL to get a test fixture through: it trains precisely
the reflex the guard exists to prevent, and the next click might be a real key.
### A preview named `houndshield-prod` is `npm run start` — source edits need a rebuild before you measure
**What:** Fixed the hero's missing left gutter in `hermes.css`, reloaded the preview, and re-measured:
`padLeft: "0px"` — apparently unchanged. Spent a cycle hunting a cascade loser that did not exist. The
running preview was the `houndshield-prod` entry in `.claude/launch.json` (`npm run start`), serving a
`.next` built *before* the edit. CSS was never recompiled.
**Root cause:** `npm run start` has no HMR and no recompile. Only `houndshield-dev` picks up edits live.
**Rule:** Before diagnosing "my fix did not take effect", confirm the server can even see the edit.
The tell for a stale build is that the measurement matches the OLD rule's output *byte-for-byte*
(here `padTop: 72px / padBottom: 84px / padLeft: 0px` is exactly what `padding: 72px 0 84px` emits).
A rule that genuinely lost the cascade almost always leaves a partial trace instead.

### Inside `.hermes`, never use the `padding` shorthand on an element that also carries `container`
**What:** `.hermes .container` supplies the 24px side gutter; `.hermes .hero-grid` then set
`padding: 72px 0 84px`. Both are specificity (0,2,0) and the shorthand writes all four sides, so the
later rule silently zeroed the gutter. At a 1200px viewport (= `--maxw`) there is no auto margin left
to absorb it, and the hero text sat flush against the window edge.
**Rule:** Use `padding-block` / `padding-inline` on co-applied `container X` elements. Same family as
the `@layer hermes-reset` bug — the tell there is `max-w-*` working while `mx-auto` does not.

### A gitignored `proxy/data/` makes the proxy suite fail locally while CI is green
**What:** `npx vitest run` in `proxy/` reported 3 failures (`expected 429 to be 200`, fetch never
called) while CI on `main` was green across four runs. Not the better-sqlite3 ABI issue — `npm rebuild`
changed nothing. Cause: a leftover local `proxy/data/houndshield-events.db` holding accumulated
LOCKOUT state. The DB path resolves at module-import time, before the test's `beforeEach` redirects
`HOUNDSHIELD_DATA_DIR` to a temp dir, so the tests both read and pollute the real data dir. Moving
`proxy/data/` aside → 61/61 green.
**Rule:** When local is red and CI is green, suspect gitignored local state before suspecting the code.
CI checks out a clean tree; your machine does not.

### `cmd > log 2>&1; echo "EXIT=$?"` reports the echo's status to the task notifier, not the command's
**What:** The background-task notification said "exit code 0" for a proxy run that had 2 failing tests.
The compound command's exit status is the last element — the `echo`. The real code was in the captured
`EXIT=` line inside the output file.
**Rule:** Read the captured exit line or the summary in the log. Never take a wrapper's exit code as
the gate result. (`${PIPESTATUS[0]}` is also bash-only — it silently yields empty in this zsh shell.)

### A guard that asserts a PATH is empty breaks the moment the right answer moves to that path
**What:** `operator-dashboard-honesty.test.ts` asserted `(tools)/overview/page.tsx` does NOT exist, as a
proxy for "the 804-line hardcoded mockup has not come back". The correct architecture then turned out to
be the dashboard living at exactly that path, so the guard blocked the fix it was meant to protect.
**Rule:** Guard the PROPERTY, not the location. Read the file at the path and assert it lacks the
mockup's datasets. Path-absence assertions encode today's layout as if it were the invariant.

### CSS `column-count` silently orphans the header of every column but the first
**What:** `.op-matrix{column-count:2}` with one header row as the first child flowed that header atop the
LEFT column only. The right-hand 7 NIST families rendered with no Family/Met/Part/Unmet labels at all.
Nothing in the class list or the JSX hints at it — the markup is correct; the layout mode is wrong.
**Rule:** Multi-column flow is for prose, not tables. For N labelled columns render N groups, each with
its own header, in a grid. And diagnose from COMPUTED STYLE in a real browser — this was invisible in
source review, in tests, and in the accessibility tree.

### An inverted boolean label is worse than no label — check which branch is the signed-in one
**What:** `{isViewer ? 'Sample preview' : 'Live demo'}` shipped for weeks. `isViewer` is the SIGNED-IN
case, so paying customers saw their own real gateway telemetry captioned "Sample preview" while the
seeded marketing demo was captioned "Live demo" — exactly backwards, on a product that sells audit
evidence. A test even asserted the wrong string, because it was written when the signed-in dashboard
genuinely WAS simulated and the label was then an honest disclosure.
**Rule:** When the meaning of a flag changes, re-read every string that branches on it. A guard written
under the old meaning will keep the bug green.

### A refactor that stops rendering a component deletes every feature reachable only through it
**What:** Moving the dashboard out of `LiveCommandCenter`'s tab shell left `PlanUnlocksBoard` — the only
upgrade/paywall surface in the product — reachable from nowhere. No test failed: the component still
existed, still had its own passing unit tests, and nothing asserted it was linked.
**Rule:** Before removing a shell, enumerate what ONLY that shell rendered. Then guard reachability, not
just existence: walk every nav href and fail if it has no page.

### "Try again in a moment" is a lie when the deployment was never configured
**What:** A preview build was missing `NEXT_PUBLIC_SUPABASE_ANON_KEY`. `createBrowserClient(url,'')`
throws synchronously, the catch treated it as a transient network blip, and the founder retyped a
correct password against a deployment that could never accept it. The OAuth path was worse - the throw
was inside an async handler with no catch, so the button read as simply dead.
**Rule:** Distinguish "this request failed" from "this build cannot do this at all", and check
availability BEFORE the attempt. Retry advice for a permanent misconfiguration is a false statement
about the system, not merely an unhelpful string.

### NEXT_PUBLIC_* is inlined at BUILD time - the bundle proves which env a deployment had
**What:** Diagnosing preview-vs-prod env drift with no dashboard access. Prod compiled to
`r.k("https://x.supabase.co", "eyJhbGci...")`; preview compiled to
`r.k("https://x.supabase.co", (a.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""))`.
**Rule:** A literal in the chunk means the var was set at build time; a surviving `process.env` lookup
means it was absent. Fetch the built chunk and grep - faster and more certain than reading a config UI.

### tsc catches what a green test suite does not
**What:** A scripted import insertion landed inside a multi-line import block, producing 6 syntax
errors. **1844 tests still passed** - vitest does not typecheck, and the source-grep guards only look
for substrings, which were all present.
**Rule:** A green suite is not a green build. Run tsc after any scripted/regex edit to source, and never
infer "it compiles" from "tests pass".

### An empty dashboard is a plumbing question before it is a rendering one
**What:** The founder reported the after-login dashboard showing no real data. The layout was correct
and had been since #256. Production told the real story in one query: `compliance_events` **0 rows**,
`api_keys` **0 rows**. Four independent breaks on one rail — `generateApiKey()` had zero callers so no
customer could mint a key; Settings displayed a fabricated key the gateway answered 401 to;
`POST /api/v1/chat/completions` (the product) recorded nothing while advertising a request id "for
audit lookup"; and the one path that did record inserted twice for quarantines.
**Rule:** When a data surface is empty, trace the whole rail — what mints the credential, what
authenticates, what writes, what reads — and check prod row counts FIRST. A `0` in the table the UI
reads is never answered by reading the component. `grep -rn "generateApiKey"` returning only its own
definition was the entire diagnosis, available in the first minute.

### An honest empty state can hide a broken pipe
**What:** The dashboard's no-seed-data policy is correct and guarded. It also made "traffic is
structurally unrecordable" render identically to "no traffic yet", for weeks.
**Rule:** Honest empty states need a liveness claim behind them. If a surface can be empty forever
because nothing can write to it, the emptiness is a defect wearing the costume of a design decision.
Assert the write path exists, not just that the read path is honest.

### Source-grep guards must strip comments before scanning
**What:** Two new guards failed against the very docstrings explaining the bugs they ban — the banned
identifier appeared in the prose describing why it is banned.
**Rule:** Scan code, not prose (`codeOf()` in `app/__tests__/dashboard-data-rail.test.ts`). A guard that
fires on its own explanation pressures the next author to delete the history to make the build pass.

### A guard against a column that does not exist is a check that never runs
**What:** `verifySeedChain`'s pass 2 — the content-integrity half of the product's
tamper-evidence claim — was wrapped in `if (seed.content && seed.content_hash)`. There was no
`content` column and no writer for one, so the condition was false for every row ever written.
The function returned `{ valid: true }` while having verified nothing about any content, for the
entire life of the table.
**Rule:** A truthy guard on optional data is indistinguishable from a passed check unless the
absent case is counted and returned. When a check can be skipped, the skip must appear in the
result (`unverifiable: N`), never be folded into the pass. Grep the schema for every field a
verification branches on before trusting the verification.

### A green suite does not prove a test can fail
**What:** The new source-tamper tests passed on the first run. Passing proves the code and the
test agree, not that the test constrains anything. Two mutations settled it: removing
`content: data.content` failed 9 tests; keeping content but neutering only the pass-3 field
comparison still failed 3 — which is the evidence that storing the content alone would NOT have
caught a downgraded `risk_level`.
**Rule:** For a security or evidence property, break the fix on purpose and watch the test go
red before claiming it works. Mutate each layer separately — a test that fails for both
mutations has not isolated which layer is load-bearing.

### The "obvious right fix" can be arithmetically impossible — check the data before choosing it
**What:** Recomputing the hash from the source `compliance_events` row was the recommended
approach and is the one that detects the real attack. It cannot be done: the anchored content
includes `timestamp: new Date().toISOString()` captured when the anchor was built, which is
stored in no column — `created_at` is a different `now()` from the insert. Three of the four
entity types have the same problem.
**Rule:** Before committing to a recomputation strategy, enumerate every field in the hashed
input and name the column each one would be read back from. One field with no home invalidates
the whole approach, and it is cheaper to find that in the schema than in the diff.

### A dependabot minor bump can leave `main` red where the build cannot see it
**What:** #262 bumped stripe 22.3.2 → 22.4.0, which moved `Stripe.LatestApiVersion` and broke
`lib/stripe/api-version.ts` — the single file deliberately designed to break. CI runs
`npx tsc --noEmit` (ci.yml:40) but `next.config.ts` sets `typescript.ignoreBuildErrors: true`,
so `npm run build` passed while `main` did not typecheck.
**Rule:** Run `tsc` against pristine `origin/main` before attributing any type error to your own
diff — and remember a green `npm run build` says nothing about types in this repo. A pinned
literal that tracks an SDK type must be updated in the same PR as the bump.

### Three network round-trips hid behind three innocent function calls
**What:** `/command-center/overview` felt slow on a phone. The cause was not rendering: the
fail-closed gate in `app/command-center/layout.tsx`, `getSessionProfile()` in the page, and the
tenant filter inside `hasGatewayTraffic()` each called `getSessionUser()`, and
`supabase.auth.getUser()` is a **network call to GoTrue**, not a local JWT decode — that is
precisely why Supabase tells you to trust it over `getSession()`. Three sequential auth
round-trips before one byte of HTML streamed. Worse, `getSessionProfile('full_name')` then
discarded the profile row it queried; the greeting reads `user.name` off the session.
**Rule:** In an RSC tree, count how many times a request-scoped resolver is *called*, not how
many times it appears to be. Wrap session/auth resolvers in React `cache()` so layout + page +
helpers share one round-trip, and check that a helper's extra query is actually read before
paying for it. The failure mode is invisible — every caller returns the right answer, just
slowly, forever.

### React `cache()` is a silent no-op outside a render, which makes it untestable by default
**What:** A test asserting the dedup above saw 3 calls against correct code. `cache()` only
memoizes in React's **react-server** build AND only inside a cache scope the renderer opens
(`ReactSharedInternals.A`); Vitest resolves the *client* build, whose `cache()` is a bare
passthrough. Asserting something weaker ("the export is wrapped") would have proven nothing.
**Rule:** Reproduce the two things Next provides — mock `react` to `react.react-server.js` and
open a minimal cache scope per simulated request. Then verify the guard has teeth by unwrapping
the fix and watching it go red (it did: 3 of 7 failed).

### An uncorrelated sublink in PostgreSQL is evaluated ONCE, however volatile it looks
**What:** Seeding demo telemetry, each event picked its hour with
`(select h from hours where cum >= random() * tot order by cum limit 1)`. All 4,168 rows landed
in the same hour of the same clock position. The sublink references no outer column, so the
planner hoists it into an **InitPlan** and runs it a single time for the whole statement — the
`random()` inside does not make the subquery per-row.
**Rule:** For per-row randomness, index a constant array with a per-row `random()`
(`(select p from pool)[1 + floor(random()*n)::int]`), never a `limit 1` sublink. And verify a
seed by its *distribution* — `count(distinct extract(hour from created_at))` caught this
instantly; `count(*)` was 4,168 and looked perfect.

### A dead component is where dead links go to hide
**What:** A repo-wide check of every internal `href` found exactly one broken link,
`/command-center/feed`, in `components/layout/Sidebar.tsx` — a second sidebar that no route
imported, superseded by the Command Center rail. It survived because a `logo-motion-contract`
assertion greped it, so the file looked referenced.
**Rule:** A test that greps a file is not a use of that file. When auditing for dead code, check
imports from production modules only — and delete the component rather than fixing the href in
something nothing renders.

### An uncorrelated sublink is not the only thing that gets evaluated once — fixed layout arithmetic rots too
**What:** The pitch decks' sources slide placed rows at `y = 1.95 + j * 0.82`, a pitch that happened to fit exactly 6 rows per column. Adding two references pushed the 7th row's link to 7.57in on a 7.5in canvas. pptxgenjs *writes* out-of-bounds shapes rather than clamping or erroring, so the citation was simply not on the slide — on the one slide whose entire job is being checkable — and the file still validated clean.
**Rule:** Derive layout pitch from the item count against the real canvas (`(bottom - top) / rows`), never a constant tuned to today's list. And measure geometry after every content change: `validate.py` passes an off-canvas shape, only a bounds check on `left/top/width/height` catches it.

### The 100x feature was already arriving and being thrown away
**What:** Looking for a differentiating feature, the honest answer was not something to invent. Every AI coding agent — Claude Code, Cursor, Aider, Copilot, LangChain — is an OpenAI-compatible client, so agent traffic already flowed through the gateway with zero integration. What was missing is that the gateway read `req.headers` for auth and provider routing and discarded the rest, recording 400 anonymous events where a customer needed one attributable run. NIST 800-171 3.3.2 wants actions traceable to individual users; an autonomous run has no individual.
**Rule:** Before designing a new capability, list what the system already receives and does not persist. The cheapest differentiated feature is usually data already crossing the boundary. Keep it descriptive: header-derived attribution is audit evidence, never an authorization input — the tenant boundary stays the server-resolved key.

### A legal page can pass every guard, return 200, and still render nonsense
**What:** `/terms` §12 wrapped `controllerDisclosure()` in its own lead-in plus an empty
`<strong>` and a trailing comma. That function already returns a COMPLETE sentence, so
production served: *"HoundShield is operated by HoundShield is operated by an independent sole
proprietor. … regardless of entity status., ."* — a duplicated clause and a dangling ", ." on the
section of a contract that names the counterparty, in a document sold to DoD subcontractors.
Every guard passed: no bracketed placeholder, `controllerDisclosure()` itself was honest, the
page returned 200. It was found by reading the JSX during a self-review, not by any test.
**Rule:** For any page that COMPOSES a value into prose, evaluate the composed string, not the
source. One `npx tsx -e "console.log(fn())"` showed it instantly. The generic tell is an empty
inline element — a half-finished JSX slot — so that is now guarded across every legal page,
alongside the specific double-prefix.

### A guard reading its own explanatory comment, for the sixth time
**What:** The new double-prefix check went red on the comment explaining the bug it guards —
a comment that necessarily quotes the bad output. Same failure as the CSP drift check (matched
comment prose), the accessibility overclaim check (read its own disclaimer), and three others
this session.
**Rule:** Any guard matching prose in source must strip comments FIRST, and needs a paired test
proving the stripping did not neuter it (`withoutComments(bad)` matches, `withoutComments("{/* "
+ bad + " */}")` does not). Strip `//` only when not preceded by `:`, or every `https://` in a
legal page vanishes with it.

### A probe that does not bite is usually a bad probe, not a good guard
**What:** Two of ten mutations came back GREEN. Neither was a weak guard. The first injected
`blocking: true` next to an existing `blocking: false` on the following line — duplicate key,
last wins, so the mutation never existed. The second asserted an unknown health *value* should
fail, but an unknown value IS judged: it lands in `degraded`. What that guard protects is a key
being EXCLUDED from judgement, so the corrected probe added the key to `INFORMATIONAL_KEYS`.
**Rule:** On a GREEN probe, first prove the mutation actually changed behaviour — then re-read
what the guard claims to assert. Declaring a guard toothless on a malformed mutation is how a
working check gets deleted.

### Compliance that depends on remembering to configure it is not compliance
**What:** Three onboarding emails had no unsubscribe link and no postal address (15 U.S.C.
7704(a)(3),(a)(5), assessed per message). The tempting fix is to add a footer and a `TODO: set
the address`. That is the same defect class as the three security controls that were failing
open in `/api/health`: correct-looking code whose safety depends on a human finishing the job.
**Rule:** Make the unsafe state impossible rather than documented. `canSendMarketing()` returns
false with no address, so the drip stays DARK instead of sending something unlawful — and
`/api/health` names the missing variable, because a silently dark drip looks identical to a
working one from outside.

### The Supabase GitHub integration cannot see this repo's migrations either
**What:** The Supabase bot on #292: *"no changes detected in `supabase` directory"* — on a PR
that adds `compliance-firewall-agent/supabase/migrations/034`. It watches the REPO ROOT
`supabase/`, which does not exist here. Exactly the same root cause as the Vercel Root Directory
problem in #288 and the `crons` key the drip's cron never got.
**Rule:** Migrations in this repo will NEVER auto-apply — every one is a manual founder step,
which is why 029/030/033/034 sit unapplied. One deploy-topology mismatch has now silently
disabled three separate subsystems; fix the topology once rather than working around it a third
time.

### A logo can pass every assertion and still be invisible
**What:** The new email header asserted an `<img>`, the right URL, a shipping file, the
wordmark beside it, pinned dimensions — all green. Rendered, the mark was a dark smudge on
a dark navy band, because both brand assets are near-black. The "fix" of seating it in a
small white chip (copying `drawBadge()` on the PDF cover) passed the same assertions and
was still illegible: at 30px the shield's interior detail collapses.
**Rule:** For anything whose failure mode is VISUAL, render it and look at it before
claiming it works. Assertions test structure; they cannot see contrast or scale. The
guard that now exists (`background:#ffffff`, `not.toContain("#0f172a")`) was only
writable AFTER looking — it encodes a defect no amount of up-front test design found.

### A guard whose regex stopped matching is worse than no guard
**What:** `outreach.test.ts` asserted no bare-domain link via `/(?<!\/\/)\bhoundshield\.com\/demo/`.
When the link moved to `www.houndshield.com`, the character before the domain became "."
rather than "/", so the lookbehind passed — the check would no longer catch a genuinely
scheme-less URL, while still reporting green. Same class as the seed-anchor pass that never
executed and the `verifySeedChain` content check guarded on a column that did not exist.
**Rule:** A guard built on a negative lookbehind breaks the moment the surrounding string
changes shape. Prefer strip-then-assert (remove all valid forms, assert nothing remains)
over a lookbehind that silently stops applying.

### Four copies of an escape function is four different escape functions
**What:** `escapeHtml` existed in `/api/contact`, `/api/report/snapshot-lead`,
`/api/partners/apply` and as `esc()` in `report-order.ts`. They had drifted: `esc()` did
not escape the apostrophe, so buyer names from Stripe were escaped differently from
visitor names from a form.
**Rule:** Security-relevant helpers get exactly one definition. Duplication is not a style
problem there — it is a guarantee that the copies will diverge and that the weakest one
will be the one handling the least-trusted input.

### The repo had already decided, in a file I never opened
**What:** Production could not deploy (`NEXT_NO_VERSION`) after #288 removed the repo-root
`vercel.json`. I diagnosed it from the build log, proposed restoring that file in a modern
`buildCommand`/`outputDirectory` form, got approval, shipped it — and the **Repo Structure Guard**
failed the PR. `scripts/verify-structure.mjs` carries an explicit `FORBIDDEN` entry for exactly
that path, whose comment predicts the PR verbatim: *"it is exactly the kind of file someone
re-adds in good faith ('the repo has no Vercel config?')"*. `docs/DEPLOYMENT-MIDDLEWARE.md` had
already recorded the root cause, the Root Directory value confirmed by `vercel project inspect`,
and why the fix order was not optional. Both files were in the repo the whole time.
**Rule:** Before proposing a fix for infrastructure that is already broken, grep `docs/` and
`scripts/` for the filename and the error string. A repository that has hit a problem before has
usually written down the answer, and re-deriving it from an error message means arguing with a
teammate who is not in the room. Failing CI checks are worth reading by NAME — "Repo Structure
Guard" said what it guarded before I looked at why it was red.

### Declaring a dependency is not installing it, and Vercel checks the installed one
**What:** The fix above also would not have worked on its own merits. I added `next` to the root
`package.json` so Vercel's framework detection would find a version. The build still failed:
*"Warning: Could not identify Next.js version, ensure it is defined as a project dependency."*
Vercel's Next builder **resolves the installed package** from the project root, and my
`installCommand` had installed into `compliance-firewall-agent/node_modules`. Declaration in
package.json is not what it reads.
**Rule:** For any "X not detected" build error, establish whether the detector reads the manifest
or resolves the module before satisfying it. And note the shape of the failure: the local build
passed with the exact command Vercel would run, so a green local build proved nothing about the
step that was failing — it was failing *before* the build command ever ran.

### A failed deploy is the safe kind of wrong
**What:** Three separate production builds failed across this stretch and the site never went
down once. Vercel keeps serving the last good deployment, so a failed build costs freshness, not
availability. That property is what made it reasonable to *try* the fix above rather than only
theorise about it — the downside was a red build, which was already the status quo.
**Rule:** Distinguish "cannot deploy" from "production is broken" and say which one out loud. The
first is an inconvenience with a widening repo/production gap; the second is an incident. Reporting
the first in the language of the second burns credibility and urgency you will want later.

### A statistic without its denominator is a liability, not a claim
**What:** Two Netskope figures — 89% and 81% — shipped across eight files with no scope
attached, reading as a contradiction on our own site. They were never contradictory: 81% is
*all* healthcare data policy violations involving regulated data, 89% is the slice *tied to
generative AI* (vs 31% cross-industry). Both correct, different denominators.

Worse, a third figure was simply wrong. "43% of healthcare staff use personal genAI accounts
at work" was in the homepage chat context, the Brain AI knowledge graph, and — the expensive
one — the cold outreach email. Netskope's 43% is *organisations experimenting with local genAI
infrastructure*. The real personal-account numbers are 71% (use them) and more than two-thirds
(send sensitive data through one). The email was days from going to healthcare Privacy
Officers, who verify claims for a living.

**Why it survived:** the outreach test *asserted* `toContain('43%')`. A test that pins a wrong
number makes it permanent — it converts an error into a requirement. Coverage was never the
problem; the test encoded the mistake.

**Rule:** A market statistic is a value **plus its denominator plus its source**, and the type
system should make it impossible to have one without the others. `lib/market/netskope.ts` now
holds each figure as `{ value, scope, source, url, published }`, `stat()` refuses to render a
number without them, and `lib/market/__tests__/no-unscoped-stats.test.ts` scans every
buyer-facing source file for a bare percentage or the 43%/personal-account pairing. Same
doctrine as `lib/detection/engines.ts`: a claim about the product is computed from the product,
so a claim about the market must carry the market's own scope.

**Second-order rule:** when a test asserts a specific external fact, the assertion needs a
comment naming the source. `expect(text).toContain('43%')` looked like diligence and was
actually a lock on an error.

### Narrowing a guard is fine; narrowing it silently is not
**What:** The CMMC governing-doc guard fired on three research files that name "November 2026"
as the *YC batch deadline* and never mention CMMC. Fixing it meant narrowing the predicate —
exactly the move that lets real drift back in. First attempt over-corrected the other way:
matching a bare "Phase 2" caught those files' own build-roadmap phases.

**Rule:** When narrowing a safety check, add a test that runs the narrowed predicate against a
synthetic offender AND a synthetic innocent, in the same file, so the next reader can see the
teeth are intact without reconstructing the reasoning. Done in
`cmmc-status.test.ts` → "the narrowed predicate still catches a bare CMMC November date".

### A `<button>` is invisible to everything that reads instead of executes
**What:** The $499 buy control was a `<button>` whose only path to Stripe was an onClick fetch.
A live read of /pricing on 2026-08-18 extracted the price, then "Talk to us first", and **no
purchase path at all** — because text extractors, crawlers and AI answer engines see markup,
not behaviour. For a product whose distribution plan leans on AEO citations, that is the same
as having no buy button. It also meant no-JS visitors had no path, and a transient network
error on the pre-flight fetch became a lost $499 impulse sale.

**Rule:** Anything that takes money is an `<a href>` to a working checkout URL first, and
JavaScript only *enhances* it. The invariant, now locked by
`components/__tests__/ReportCheckoutButton.test.tsx`: every code path ends in either a redirect
or a navigation — the buyer always reaches a checkout page.

---

## 2026-09-02 (pre-launch teardown — the constant was fixed, the callers were not)

Full report: `docs/audit/PRE-LAUNCH-TEARDOWN-2026-09-02.html` (5 surfaces, GSec LLC teardown,
monetization rebuild, 180-day calendar). Two lessons came out of it that generalise.

### Deleting a bad number from the constant does not delete it from the callers
**What:** `lib/detection/engines.ts` was written specifically to kill a 90-vs-53 double count —
its comment names the number and says "derived from the one array that holds them all, so it
cannot drift again". It could not, and did not. But the two consumers that did the same
arithmetic by hand were never touched: `lib/reports/snapshot-from-scan.ts` and
`lib/scan/local-engine.ts` both built `[...BUILTIN_PATTERNS, ...CMMC_PATTERNS,
...HIPAA_PATTERNS]`, and `BUILTIN_PATTERNS` already spreads both of those into itself.

Ninety pattern evaluations for fifty-three patterns. `scanForSnapshot` keys findings by pattern
name and **sums** collisions (`existing.count += count`), so nothing deduped them: every CUI and
PHI finding on the public `/demo` was reported at exactly 2x, and those doubled counts were
POSTed to `/api/report/snapshot-lead` as the lead's risk profile. `local-engine.ts` published
the array length to the UI as `patternsChecked`, so the page printed "90" a few hundred pixels
below its own header printing "53" from `PATTERN_COUNT`.

`engines.test.ts` was green throughout. It asserts the CONSTANT is right. Nothing asserted the
CONSUMERS use it.

**Rule:** When a fix replaces a computation with a derived constant, the same commit greps for
every other site that performs that computation. A guard on the constant is not a guard on the
codebase. Locked now by `lib/detection/__tests__/engine-registry-single-source.test.ts`, which
holds the line three ways — on the shipped arrays, on observed scan output (2 became 1), and on
the source text, so the next re-concatenation fails the build before anyone measures it. Both
directions were self-tested: reintroducing each site individually fails the guard.

### A liveness probe wearing a readiness probe's name disarms the daily check
**What:** `CLAUDE.md`'s Session Start Protocol step 3 is `curl .../api/health`, and CLAUDE.md
states that endpoint "reports missing control stores and reset-code configuration as degraded
rather than green". `docs/gtm/LIVE-PRODUCTION-AUDIT-2026-08-15.md` quotes it returning a full
sentence about lost sales. The shipped `app/api/health/route.ts` returns `{status:"ok"}` with no
branch that can report anything else, and `app/api/admin/health/route.ts` 404s unauthorised
callers — so there is no reachable substitute. The pre-flight check now returns green under
every failure condition it exists to detect.

**Rule:** Liveness and readiness are two endpoints, never one. An operating procedure never
depends on the endpoint that cannot fail. If a diagnostic is narrowed to a probe, the procedure
that consumed the diagnostic is updated in the same commit or the narrowing is not done.

### A repository can only tell you what was written, never what is running
**What:** The teardown's deploy finding was inferred from the repo alone: the root holds a Next.js
scaffold (`next.config.ts`, `postcss.config.mjs`, create-next-app starter SVGs) with no `app/` and
no `next` dependency, and `middleware.ts:326` records a root-config change having killed the
middleware in production once already. The chain was sound and the conclusion — "framework
detection fails, which is why nothing has deployed since #288" — was wrong. One call to the Vercel
API showed `b88b7ee` live in production, `state: READY`.

The evidence the API *did* surface is worse and was invisible from the repository: three
deployments with `target: production` and `state: ERROR` inside one 25-minute window
(`bfcbe54`, `9c9f2b9`, `ba8bf29`), each ending on `Failed to type check`. `main` took three merges
whose build had not passed, and production served a stale bundle throughout while the branch read
as merged.

**Rule:** Any claim about what is *deployed* is checked against the deploy provider before it
ships, never derived from configuration files. The repo states intent; the control plane states
fact. When the two disagree the control plane wins and the inference is retracted in place — the
retraction stays visible in the document, because a finding that quietly changes shape is a
finding no reader can audit. Corollary now open in `todo.md`: branch protection requiring the CI
type check is the one setting that would have stopped all three, and CLAUDE.md already carried
the rule it broke ("Build must pass before commit").

### A capability cannot be deleted for security; it has to be replaced
**What:** `proxy/license.ts` returned `{valid:true, plan:"pro"}` on any network failure
with no cache, so blocking houndshield.com at DNS minted an unlimited Pro licence. The
obvious fix — delete the branch — would have broken Mode C, because air-gapped is a
documented deployment mode and that branch was its ONLY licensing path. Its own test file
said so, and named the replacement it was waiting for: "a signed offline token".

Deleting it would have traded a monetization leak for a broken deployment mode and called
it a security win. What shipped instead is an Ed25519-signed `HOUNDSHIELD_OFFLINE_LICENSE`
verified locally with no network, bound to the licence key's hash and carrying a mandatory
expiry — plus the script that issues one, so the capability is usable and not just
declared. Offline operation is now granted rather than achieved by unplugging a cable.

**Rule:** Before removing a permissive branch, name every legitimate caller it serves. If
one exists, the work is replacing the capability, not deleting it — and the replacement
ships in the same change or the change does not ship. A "fix" that closes a hole by
removing a supported deployment mode is a regression wearing a security label.

**Second-order rule:** when a test documents a behaviour it does not endorse, it should
name the successor that would replace it. That comment is what made this a thirty-minute
design decision instead of an archaeology exercise.

### Hand-verified invariants recorded in prose are not guards
**What:** Three separate cases in one session, all the same shape.

`lib/detection/engines.ts` deleted a bad number from a CONSTANT while two consumers went on
computing it by hand; `engines.test.ts` was green throughout because it asserted the
constant. `lib/pricing/__tests__/plans.test.ts` said "no page renders it (verified: no
non-test importer exists)" — true when written, and silently false the moment anyone
imported it. `lib/health/service-status.ts` was written for `/api/health`, the route was
later narrowed to a bare probe, and the module was left with no consumer but its own test.

Each was a real verification, performed carefully, and recorded where nothing could check
it again.

**Rule:** If a comment asserts a property of the codebase — "nothing imports this",
"this is the only registry", "this module feeds that route" — it is a test, and writing it
as a sentence instead is choosing to find out the hard way. All three are assertions now,
and all three were self-tested by introducing the violation and watching the guard name the
offending file.

### Two right answers can produce one wrong document
**What:** CLAUDE.md said `/api/health` reports degraded state. The route returns
`{status:"ok"}` unconditionally, and `health-liveness-contract.test.ts` locks it that way
because a public unauthenticated probe should not publish per-control state. Both positions
were defensible; the operating procedure built on the documented one was the casualty, and
it had been returning green under the exact condition that was losing $499 sales.

The reflex is to change the code to match the doc. The right move was to add the missing
capability where it belongs — a token-gated `/api/health/ready` that 404s a wrong token and
an unset token identically — leave the deliberate boundary untouched, and fix the sentence
that was wrong.

**Rule:** When code and documentation disagree, establish which one a deliberate decision
stands behind before changing either. A test guarding the current behaviour is that
evidence. Then ask what NEED the documentation was describing, and satisfy it without
dismantling the guard.

### A number nobody can observe is not a number
**What:** The kill criteria turn on "fewer than 5 paid customers", and the answer has
been recorded as 0 in every session since. But `STRIPE_WEBHOOK_SECRET` has never been
set, so `POST /api/stripe/webhook` answered **503 to every Stripe delivery**, while the
Stripe-hosted Payment Link stayed live and sellable the whole time. The honest reading
of that 0 was never "nobody bought" — it was "nobody bought *that the system was capable
of noticing*". Two months of strategy, including a shut-down-or-pivot gate, rested on a
measurement the instrument could not take.
**Rule:** Before a metric is allowed to drive a decision, establish that something in the
system can actually observe it, and say which component does. "We have no record of X" and
"X did not happen" are different sentences, and the gap between them is exactly where a
company convinces itself of the wrong thing. The fix is not a better dashboard — it is a
second, independent path to the same fact (`/api/cron/reconcile-orders` reads the money
back out of Stripe rather than waiting to be told about it).

### A diagnostic nobody receives is decoration
**What:** `stripeKeyDiagnostic()` and `stripeWebhookDiagnostic()` are genuinely excellent
— they name the exact mis-paste ("that is your PUBLISHABLE key"), the exact dashboard
path, the exact consequence. They have been correct and unread for months, because they
render into a JSON body behind an admin session and into Vercel log lines. The #1 revenue
blocker was restated in `tasks/todo.md` every session for three weeks and never once
arrived anywhere a human would trip over it.
**Rule:** Diagnostics need a delivery mechanism, and the mechanism is part of the feature.
Ask "who receives this, and when?" — if the answer is "whoever thinks to look", it is not
an alert. And an alert has to be able to stop: this one sends weekly and only while
degraded, precisely so it stays worth reading. A daily nag for a five-minute fix is
filtered within a week, after which the alarm is worth less than nothing because its
silence now means nothing either.

### Reconciling money in only one direction makes the number confidently wrong
**What:** The reconciler was first designed to recover *sales* the webhook missed. A
refund the webhook missed has the same cause and the opposite sign: the order sits at
`paid` forever, and the admin rollup counts paid orders as revenue and as paying
customers — the exact number the kill-criteria review reads. Recovering only the inflows
would have made the metric *more* wrong, and wrong in the flattering direction, while
looking like a rigour improvement.
**Rule:** When you build a safety net for a ledger, build it for both signs in the same
change. A one-directional reconciler is not half-finished, it is biased, and a biased
number is more dangerous than a missing one because it gets trusted.

### A type-level tripwire that fires inside a dependency bump is a tripwire nobody can act on
**What:** `lib/stripe/api-version.ts` pinned the API version as a hand-written literal
typed `Stripe.LatestApiVersion` — a single string-literal type — deliberately, so that an
SDK bump would fail `tsc` in exactly one file and force a human to review Stripe's
changelog. In practice it fired as `TS2322: Type '"2026-07-29.dahlia"' is not assignable
to type '"2026-08-26.dahlia"'` at the bottom of a dependabot build log (#324, and #262
before it), blocking a batch that carried a Next.js patch and a Sentry update. The
literal also protected nothing at runtime: stripe-node already defaults `apiVersion` to
its own `Stripe.API_VERSION`, so the value on the wire was identical with or without it.
**Rule:** A review gate has to fail where the reviewer is looking, in words they can act
on. Keep the gate, move it: derive the value from the SDK so the build cannot break, and
put the tripwire in a test whose failure message names the file, the changelog URL and
the one line to change. A gate that trains people to ignore red dependabot PRs is
negative safety.

### Reverting one file to clean up a mutation test reverts your work in it too
**What:** After running mutation checks (deliberately breaking the code to prove the new
tests catch it), the cleanup for five of six mutants was `cp` from a saved copy — but the
sixth used `git checkout app/api/stripe/webhook/route.ts`. That restored the file to
`main`, silently undoing the real extraction the whole PR was about. It was caught only
because `git status` was printed in the same command and the file was missing from the
modified list.
**Rule:** Mutate from a saved copy and restore from the saved copy — never `git checkout`
a file you have real uncommitted changes in. And print `git status` after any destructive
cleanup: the failure mode here is silent, and the tests still passed afterwards because
the reverted file was a *valid older implementation*.

### A green check can sit directly on top of a command that failed
**What:** #331's security-audit gate ran green from `main` in 0.7s. Three lines below the
green result, in the same job log, `actions/checkout`'s post-job cleanup was printing
`fatal: No url found for submodule path '.claude/worktrees/nostalgic-lamport-6568bb'` and
`##[warning]The process '/usr/bin/git' failed with exit code 128`. It had done that in
every job in the repo since #265 (2026-08-07) — a local agent worktree committed as a
bare gitlink (mode 160000) pointing at a commit that exists in no remote. Nobody saw it,
because nobody reads past a green tick, which is the same reason the 503 in #331 cost an
hour to diagnose.
**Rule:** Read the log of your own green run, not just its conclusion. A job's exit code
covers the steps the workflow declares; setup and cleanup run outside it and fail
silently. And the cost of ambient noise is not the noise — it is that the next real
failure arrives in a log people have already been trained to skim.

### Ignoring a bad file stops that file; asserting the invariant stops the class
**What:** The fix for the stray gitlink was three lines: `git rm --cached` it, and add
`.claude/worktrees/` to `.gitignore`. Both are specific to a path. The next agent
worktree with a different name would have been committed exactly the same way.
**Rule:** After removing an instance, name the property that made it wrong and assert
*that* — here, "every mode-160000 entry in the index must have a matching `path =` in
.gitmodules", added to the existing `structure-guard` CI job. Then prove the assertion
discriminates in both directions: it must fail on the offender re-added, and still pass
on `tools/agent-harness`, the legitimate declared submodule. A guard that rejects
everything would have "caught" the bug for the wrong reason and broken the real
submodule the first time anyone touched it.

### A named-file allowlist only guards the files someone remembered to name
**What:** `partner-offer-coherence.test.ts` was written specifically to stop stale partner
economics from resurfacing, and it passed for weeks while `docs/gtm/rpo-outreach-list.md`
— a doc headed "ready to send" — offered **$299 wholesale, a 40% referral and 20%
recurring**, three retired figures that contradicted each other, the canon ($399 flat
$100 off, a discount with no payout), and the live `/partners` pages. Its `PARTNER_SURFACES`
list was six `.tsx`/`.ts` files by name. The app was right; the thing a human actually
pastes into an email to Summit 7 was $100 under wholesale and promised a commission that
does not exist. Same defect class in `docs/SEO-PLAN-2026.md`, which specified the
`/partners` title as "20% Recurring Commission for **C3PAOs**" — a payout that does not
exist, offered to a channel the NEVER DO list bars on legal grounds.
**Rule:** GTM copy a human sends is a partner surface — scan it like one. When a guard
uses an explicit allowlist, the drift lands in whatever was left off it, so either walk the
tree (as the 40–50% scan already did) or add every surface that quotes the number to a
buyer. Two secondary notes: the fixed docs need to be able to *state* the retired figure in
a dated correction note or the next reader reintroduces it — hence blockquotes are stripped
before scanning, matching the existing ARCHIVES carve-out; and a payout predicate must be
written knowing correct copy will say the word ("a discount, not a commission" tripped it),
so the copy says "not a payout" and the predicate stays blunt rather than trying to parse
negation.
