# Hound Shield — Lessons Learned

Self-improvement loop. Updated after every correction or resolved escalation.
Pattern: **what happened → root cause → rule that prevents recurrence**

---

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
