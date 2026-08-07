# Command Center premium pass — 2026-08-07

Founder direction: take the after-login dashboard from "default/generic" to premium, using
[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) as a reference, scoped
to **all 23 `/command-center/*` pages**.

This is the reviewable summary. The diff is large because the shell was split; the behaviour
changes are small and listed individually below.

---

## What the research found

The **panels were not the problem.** `OperatorOverview` / `OperatorPanels` already carried 13
responsive breakpoints (`lccStyles.ts`), already bridged to the `--hs-*` token system, and were
already honesty-gated with real empty states. The premium failure was one level up, in the shell
that wraps all 23 pages, plus three tool pages still rendering invented data.

### Finding 1 — the shell declared no responsive behaviour at all

A grep for `sm:|md:|lg:|xl:|2xl:` across all 427 lines of `app/command-center/(tools)/layout.tsx`
returned **nothing**. The sidebar was `fixed w-[260px]`, `<main>` was `ml-[260px]`, the header was
`left-[260px]` — none conditional.

On a 375px phone that left a **115px content column, 67px after `p-6`**, on every one of the 23
pages, with no way to dismiss the rail: the only control was a "Collapse" button at the bottom of a
23-item nav, and it still left 68px. The panels inside were reflowing correctly the whole time,
inside a column too narrow to read.

### Finding 2 — the shell rendered fabricated state

Four pieces of chrome looked like live state and were constants:

| Chrome | Reality |
|---|---|
| Quarantine `badge: "4"` | Hardcoded string. Every customer saw a queue of four, including empty queues |
| "All Systems Operational" pill | Hardcoded string with a pulsing green dot, checked against nothing |
| Notification bell | Permanent red unread dot fed by nothing; the button opened nothing |
| Avatar initial `useState("K")` | Kaelus-era leftover — every operator saw a stranger's initial until `/api/me` answered |

Plus a search field (`<div>`, `cursor-pointer`, no handler, no tab stop) advertising a `⌘K`
shortcut that did not exist.

This is the same class of defect the repo has already caught twice: the 804-line mockup dashboard
(2026-07-29) and the constant activation checklist (2026-07-31).

### Finding 3 — `DESIGN.md` was four months stale and actively misleading

Dated 2026-04-11, it described a dark `#07070b` landing page with an indigo brand. The product moved
to light mode; `CLAUDE.md` says light, the shell runs `cc-light` over 40+ `--hs-*` tokens. It
documented no dashboard surface at all. It is read by AI agents at session start, so a stale copy
does not fail loudly — it produces confidently wrong UI.

### Also found, not fixed (needs a founder decision)

- **Seven mockup components are mounted by no page at all**: `content-pipeline`, `calendar-view`,
  `agent-builder`, `agent-workspace`, `memory-view`, `knowledge-base`, `execution-trace` (~4,500
  lines). `pipeline`, `workspace` and `knowledge` are bare redirects to `/command-center`. Deleting
  dead code is destructive and out of scope for a design pass — flagged rather than done.
- **`/api/health` returns `status: "healthy"` as a hardcoded literal.** Its `services` block is real
  diagnostics, but describes HoundShield's own vendor config (Stripe, Resend, OpenRouter), not the
  customer's posture.

---

## What changed

### A. The shell — `app/command-center/(tools)/` (lands on all 23 pages)

Split into `_shell/` (underscore-prefixed, so Next.js treats it as private, never a route). The
single file was 427 lines before the drawer and palette; keeping it whole would have put it well
past the repo's 500-line rule.

```
layout.tsx                 composition root only
_shell/nav.ts              NAV_SECTIONS — one source for sidebar AND palette
_shell/Sidebar.tsx         rail on desktop, off-canvas drawer below lg
_shell/Topbar.tsx          customer identity, hamburger
_shell/CommandPalette.tsx  ⌘K over the same 23 destinations
_shell/useQuarantineCount.ts
```

1. **Responsive.** Sidebar is `-translate-x-full lg:translate-x-0`; `<main>` is `ml-0 lg:ml-[260px]`;
   header is `left-0 lg:left-[260px]`. A hamburger opens the drawer, with a scrim, Escape, a focus
   trap, focus restored on close, and auto-close on navigation. `role="dialog"` applies only while
   it overlays the page — the permanent desktop rail is not announced as a modal. Page padding is
   `p-4 sm:p-6 lg:p-8` instead of a flat `p-6`.
2. **Fabricated chrome removed.** The quarantine badge now reads `GET /api/quarantine/review` and
   renders **only** a real, non-zero, non-demo count — null (loading, failed, demo mode) and zero
   both render nothing. The health pill and the bell are **deleted**: the pill could not be wired
   honestly (see Finding 3 note above), and a bell that announces news that does not exist is worse
   than no bell. The avatar shows no initial until a real name arrives.
3. **The search field is now real** — a `<button>` opening a ⌘K palette over `NAV_ITEMS`, the same
   array the sidebar renders. No new dependency, no second list, no new data source.
4. **Accessibility.** Skip-link to `<main>`, `aria-current="page"` on the active item,
   `aria-expanded`/`aria-controls` on section toggles, `aria-label` on the nav, accessible names on
   every icon-only control.

### B. Error and loading states (there were none)

There was **no `error.tsx` anywhere under `app/command-center/`**. A throw in any tool page escaped
to the root boundary and took the entire shell with it.

- `(tools)/error.tsx` — boundary **inside** the group, so the sidebar survives; `reset()` retry, a
  link onward, the digest (never the raw message, which can carry internals), and a line telling the
  operator their gateway is still scanning, because a dashboard error says nothing about enforcement.
- `(tools)/loading.tsx` — skeleton scoped to the content region. The pre-existing
  `app/command-center/loading.tsx` is full-viewport, so navigating between tools blanked the sidebar.

### C. Honesty pass on the tool pages

Reachability was traced rather than assumed. **Three** pages a customer can actually reach render
hardcoded datasets: `/command-center/team`, `/command-center/tasks`, `/command-center/agents`.

New `<SampleDataNotice>` takes its wording from `KIND_META.simulated` in `dataProvenance.ts` — the
same copy the provenance dialog already uses — so the product says one thing about sample data in
one voice. The Agent Simulation heading also stopped calling module constants "Live".

### D. `/command-center/overview`

- `OperatorPanels.tsx` (**616 lines**) split into `panelPrimitives` + `OperatorKpis` +
  `OperatorCharts` + `OperatorFeed`, with `OperatorPanels.tsx` kept as a barrel — **no import
  anywhere in the codebase moved.**
- The heading greets the signed-in operator when the session has a name, falling back to
  "Dashboard Overview". The name was already fetched for the Brain AI card, so this costs a prop,
  not a lookup. No stand-in greeting when there is no name.

### E. `DESIGN.md` rewritten on the reference repo's spec

Regenerated against the awesome-design-md / Google Stitch sections (Visual Theme, Color Palette &
Roles, Typography, Component Stylings, Layout Principles, Depth & Elevation, Motion, Responsive
Behavior, Do's and Don'ts, Brand Voice, Agent Prompt Guide) **from the real token values in
`globals.css`**, and now covering the dashboard.

### F. Guard tests moved from paths to invariants

Eleven assertions across three files pinned `(tools)/layout.tsx` by path, so the split would have
failed eight passing tests that were each still asserting something true. The invariants were never
about which file held the code, so `app/__tests__/helpers/shell-source.ts` reads `layout.tsx` +
`_shell/*` as one source. The split is free — this one and the next one. Same treatment for the
panel modules in `operator-dashboard-honesty.test.ts`.

---

## Tests

**+54 tests, 6 new files.** Baseline 1938 passing / 147 files → **1992 passing / 153 files.**

| File | Covers |
|---|---|
| `_shell/__tests__/Sidebar.test.tsx` | drawer dismiss, Escape, focus-on-open, dialog role only when overlaying, quarantine badge across empty/real/failed/demo, `aria-current`, search opens palette |
| `_shell/__tests__/Topbar.test.tsx` | no health pill, no bell, no "K" placeholder, company shown, no placeholder org, survives a failed profile read, hamburger |
| `_shell/__tests__/CommandPalette.test.tsx` | open/close, filter by label and href, empty message, Enter navigates, arrow wrap, highlight clamped as results narrow, backdrop vs panel click |
| `(tools)/__tests__/error-boundary.test.tsx` | alert role, retry, onward link, digest shown, raw message never shown, no false "enforcement stopped" implication |
| `app/__tests__/dashboard-responsive-contract.test.ts` | breakpoints declared, off-canvas mechanism intact, no unconditional `ml-`/`left-[260px]`, scrim `lg:hidden`, skip-link |
| `app/__tests__/tools-sample-data-guard.test.ts` | registry both ways — labelled pages must be registered and registered pages must be labelled; mock components only on labelled pages; "Live" not used on simulated data |
| `app/__tests__/design-md-tokens.test.ts` | every token in DESIGN.md exists in the stylesheets; the stale dark/indigo claims cannot return |

The sample-data guard is a **registry, not a heuristic**, on purpose: `COLUMNS`, `STAGES`, `WINDOWS`
and `NAV_SECTIONS` are all SCREAMING_CASE arrays that are perfectly honest, so a pattern-matcher
would cry wolf and get deleted. The registry has no false positives and fails in both directions.

---

## Verification

```
npx tsc --noEmit                 0 errors
npm run lint                     0 errors · 39 warnings, all pre-existing, none in a touched file
./node_modules/.bin/vitest run   1992 passed / 153 files / 0 failed
npm run build                    see PR checks
```

The "38 warnings" baseline recorded in `tasks/todo.md` (2026-07-31) is stale; the current
pre-existing count is 39. Verified by listing every warning's file and confirming no overlap with
the changed set.

### Still to verify in a real browser (measure computed style, not class names)

1. `/command-center/overview` at 375px: `scrollWidth === clientWidth`, drawer off-canvas, hamburger
   opens, scrim and Escape close, content ≥ 327px.
2. 768px, 1024px (both sides of the `lg` boundary), 1440px.
3. Keyboard only: skip-link → nav → ⌘K → Enter navigates → focus in `<main>`.
4. Force `/api/quarantine/review` to fail: the badge must render nothing, never a placeholder.
5. Throw in a tool page: sidebar survives, Retry works.
6. Signed in with no company and no name: neutral header and heading, no invented org.

jsdom has no layout engine, so the responsive suite proves the breakpoints are *declared*, not that
they *lay out*. Only a browser proves the second.
