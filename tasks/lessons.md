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

---

## 2026-06-24 — launch-readiness sweep (branch dreamy-mcclintock-fc9d8b)

### A "fixed in PR #N" memory is not the branch you're on
**What:** Memory said the logo idle-breathe shipped in PR #124, but this worktree branched off `main` at #123 — the logo was still hover-only (the recurring "logo not moving" complaint). Re-adding it was correct.
**Rule:** When memory says "X was fixed in PR #N", verify in *this* branch's live code before assuming it's done. Memory reflects what was true when written, not your current HEAD.

### Idle animation and hover transform must live on different elements
**What:** A CSS `animation` on `transform` (idle breathe) overrides a `:hover` `transform` on the *same* element — the running animation wins, so hover silently dies.
**Root cause:** Both target `transform`; CSS animations beat normal author rules during playback.
**Rule:** Compose two transforms by nesting — wrapper owns the hover transform, inner element owns the idle animation; guard both with `motion-reduce`. (`Logo.tsx` + nav/footer logo wrappers + `.logo-breathe` in globals.css.)

### Fabricated social proof hides in marketing data arrays
**What:** Pre-revenue (0 paid customers), the site still showed "500+ teams", "2M+ scans", a "99.99% Uptime SLA" stat bar, a future-dated "1,000+ Users" milestone, and a named testimonial (Maria Chen, Vanguard Aero) — all in `.map()`-ed data arrays, invisible in a quick skim.
**Rule:** Pre-launch, sweep `grep -rEin "[0-9][KM]?\+ (teams|customers|scans|users)|trusted by [0-9]|99\.9" app components`. Replace usage metrics with verifiable product facts (16 engines, 110 controls, <10ms, SHA-256). Testimonials + company-history timelines are founder-verify items — flag, never fabricate or silently delete.

### CUI-safety is a Mode-B claim — one shared disclosure component, used everywhere
**What:** `/brain-ai` + `/security` asserted "CUI-safe" / "the entire architecture" without distinguishing the hosted Vercel plane (Mode A, not FedRAMP-authorized) from self-hosted Docker (Mode B). The exact NEVER-DO.
**Rule:** `DeploymentBoundaryNote` carries the wording; render it on every CUI-claim-adjacent page + keep a condensed line in the global footer (covers all pages). One source of truth for compliance copy, not pasted strings.

## 2026-06-11

### Design split-brain: v3 migration stopped at 3 pages

**What:** Only home/pricing/how-it-works adopted the v3 light-steel design; 21 public pages (blog, login, docs, demo...) stayed on the old dark theme with the old cat-mask logo — users saw a different product on every click. Pricing had white-on-white invisible prices; homepage CTA linked to /sign-up (404).
**Root cause:** Redesigns were shipped page-by-page with no migration checklist and no "every page uses NavV3/FooterV3" gate.
**Rule:** Any design-system change lands with a grep gate in the same PR: `grep -rl "components/Navbar\|LandingFooter\|text-white" app/` must return only intentionally-dark routes (/command-center). A deterministic token-swap codemod (see /tmp pattern in PR #-this) converts a page in seconds — never migrate by hand, never migrate partially.

### Brand renames need a single sweep, not vibes

**What:** "Hound Shield" (two words) survived in 110+ files — including a broken `Hound ShieldClient` class name in customer-facing SDK snippets and an invalid `X-Hound Shield-Org` HTTP header.
**Rule:** Brand strings live in copy, code identifiers, HTTP headers, emails, and tests. Rename = one `grep -rl | perl -pi -e` sweep + test-suite assertions on the new name.

### Brain AI must answer identity questions offline

**What:** "who are you" returned the generic fallback because the FAQ layer had no identity keywords and prod has no OPENROUTER_API_KEY.
**Rule:** The deterministic FAQ layer owns: identity, greeting, pricing, install, contact. Any demo-critical answer must work with zero API keys. Test: `findFaqAnswer("who are you")` is part of the suite.
