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
