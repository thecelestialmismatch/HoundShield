# Direction-A Port — marketing nav + Live Command Center

This change ports the approved **Direction-A "Steel & Cream"** demo (the two
self-contained HTML pitch files) into the live Next.js app, byte-faithfully,
across two surfaces: the **marketing navigation** and the **after-login
dashboard**.

## What shipped

### 1. NavV3 — exact-copy of the demo nav (`components/layout/NavV3.tsx`)
- **Five hover mega-menus** (was one): Products, Features, Pricing, Partners,
  Docs. Each is a dark `--pop`-styled popover on the light page, exactly like
  the demo, with an invisible hover bridge and a chevron that rotates 180° on
  hover/focus.
- **Cursor-reactive logo.** The Doberman mark tilts and scales
  (`rotate(-4deg) scale(1.06)`) toward the cursor — the demo's `.brand:hover
  .brand-mark` micro-interaction. Hovering the wordmark triggers it too
  (`group/brand`).
- **Every item links to a real route.** All six industries point to
  `/products/{technology,healthcare,defense,legal,global,government}` — no
  public link ever dives into an authed `/command-center/*` route again
  (the old C4 regression). Pricing rows → `/pricing`, Partners → `/partners`,
  Docs → `/docs`, "Live Threat Dashboard" → `/console`.
- Keyboard-accessible (`group-focus-within`), responsive (mobile accordions),
  SSR-safe live "intercepted" counter.

### 2. Logo moves everywhere it appears (`app/globals.css`, `components/Logo.tsx`)
A single global rule drives the tilt/scale on **every** logo instance —
`NavV3`, both `FooterV3` variants, the `<Logo>` component (10 routes incl.
`/command-center`, `/docs`, `/auth`, error/loading/not-found), `Sidebar`, and
the dashboard brand mark. Honors `prefers-reduced-motion`.

### 3. Live Command Center — exact-copy after-login dashboard
- `components/dashboard/LiveCommandCenter.tsx` + `lccStyles.ts` — a
  self-contained console ported 1:1 from the dashboard spec, themed in the
  **same light Steel & Cream palette as the marketing site** (its scoped vars
  map onto the site's `--hs-*` tokens — white cards, ink text, steel accents,
  site status colors). Sidebar tabs
  (Overview / Live Threat Feed / CMMC Assessment / Reports / Brain AI /
  Settings), ticking clock, jittering gateway p50, ops strip, four live KPIs,
  scrolling throughput canvas chart, detection-mix donut, streaming threat feed,
  SPRS count-up rings, per-engine bars, control-family table, report exports,
  and an on-device **Brain AI** chat (deterministic keyword answers — "who are
  you", SPRS, DFARS 7012, etc.). All live logic runs in one effect with full
  teardown; SSR-safe; operator chat input is HTML-escaped (no XSS).
- Mounted at **`/console`** (`app/console/page.tsx`, `noindex`).

### 4. Login lands on the real product console (`/command-center`)
`login`, `signup`, `auth` callback/page, and `middleware` default the post-auth
redirect to **`/command-center`** (the full product surface). The exact demo
dashboard at **`/console`** stays reachable as a public showcase — linked from
the nav's "Live Threat Dashboard" item — and its "Back to site" link returns
to `/`.

### 5. Homepage fidelity fixes (`app/page.tsx`)
- Stat band third tile: `Nov 2026 deadline` → **`110 / NIST 800-171 controls`**
  (matches the demo; removes a stray deadline string).
- Hero pill → `Local-only · CMMC Level 2 · HIPAA · SOC 2` (demo copy).
- Pricing CTAs `/sign-up` (404) → `/signup`.

## Verification
- `npm run build` → clean (exit 0).
- `npx vitest run` → **492 passed** (29 files), incl. new NavV3 + dashboard suites.
- Visual: dark hover mega-menus, logo tilt, and the `/console` console all render
  pixel-faithfully with **0 console errors** on a clean dev server.

## Notes
- Direction A only (per decision). `components/Navbar.tsx` is legacy/unused
  (imported only by its own test); NavV3 is the live nav.
- `.claude/rules/frontend.md` (dark homepage) is **stale** — the live design is
  light Steel & Cream via the `--hs-*` tokens. Ignored, as the primer directs.
