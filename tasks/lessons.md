# Kaelus.Online — Lessons Learned

Self-improvement loop. Updated after every correction or resolved escalation.
Pattern: **what happened → root cause → rule that prevents recurrence**

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
