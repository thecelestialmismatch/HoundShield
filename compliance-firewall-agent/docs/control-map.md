# Control Map — MSP Compliance Console

**Route:** `/control-map` · **Component:** `components/dashboard/control-map/` · **Data:** `lib/dashboard/control-map-data.ts`

The Control Map is the multi-client CMMC command surface an **RPO/MSP partner**
uses to run compliance posture across every client they manage. It is
HoundShield's #1 channel view — the co-branded `$499` CMMC AI Risk Assessment
report at portfolio scale (Channel Priority #1: RPO/MSP partnerships).

It recreates the design the founder approved (sidebar shell · overall-progress
ring · framework rollups · mapped-controls table) rendered in the HoundShield
**dark-steel** design system — not the reference's purple — per
`.claude/rules/frontend.md` (brand steel accent, no `indigo/blue/amber` as the
brand colour; amber is used only as the semantic at-risk warning, exactly like
the reference's warning triangle).

## What it shows

| Block | Source of truth |
|-------|-----------------|
| Overall Progress ring | `computeOverallProgress()` — mean of mapped-control progress (**72%**) |
| CMMC Level target | `CMMC_LEVEL_TARGET` (**Level 2**) |
| Clients | `CLIENTS.length` (**28**) |
| Assessments | `countAssessmentsInProgress()` (**36**) |
| At Risk | `countAtRiskControls()` (**4**) |
| CMMC Frameworks | `FRAMEWORKS` — CMMC 2.0 (active), NIST 800-171, NIST 800-172, CIS v8 |
| Controls Mapped | `PORTFOLIO_CONTROLS` — 14 CMMC L2 practices → NIST 800-171 Rev 2 |

Every headline KPI is a **real aggregation** of the sample portfolio computed by
a pure function — never a hardcoded constant — and every one is locked by a test
in `lib/dashboard/__tests__/control-map-data.test.ts`. If a future data edit
drifts a headline number, a test fails loudly.

## Live client selector

The "All Clients" dropdown is live. Selecting a client re-resolves the whole
snapshot (`getSnapshot(clientId)`): KPIs, framework rollups and control posture
all re-scope to that client. Per-client posture is a **deterministic** seeded
projection of the portfolio baseline (`getClientControls`) — no randomness at
render time, so it is SSR-safe and test-stable.

## Design / architecture notes

- **SSR-safe by construction.** The progress ring and bars are pure inline SVG
  (no Recharts), so the page renders identically server- and client-side and
  needs **no** `dynamic(ssr:false)` wrapper — unlike `PlatformDashboard`.
- **Mobile-first.** Sidebar collapses below `md`; stat cards reflow 2-up then
  5-up; the controls table hides the description column and scrolls horizontally
  inside its own container so the page body never scrolls sideways.
- **No dead links.** Sidebar items resolve to in-page anchors (Dashboard,
  Clients, Frameworks, Controls) or real command-center routes (Assessments,
  Evidence, Reports, Settings).
- **Honest framing.** The footer states the sample portfolio is scanned locally
  on customer infrastructure (Mode B) — CUI never leaves the client boundary. No
  CUI-safe claim is attached to the hosted plane.

## Files

```
app/control-map/page.tsx                       route (noindex, like /console)
components/dashboard/control-map/
  ControlMap.tsx        shell + live client selector
  Sidebar.tsx           navigation shell
  StatCards.tsx         5 KPI tiles
  FrameworkPanel.tsx    CMMC Frameworks column
  ControlsPanel.tsx     Controls Mapped table (top-5 → expand all)
  ProgressRing.tsx      SVG donut (SSR-safe)
  MiniBar.tsx           SVG progress bar
  tokens.ts             status → colour mapping
lib/dashboard/control-map-data.ts              data model + pure aggregations
lib/dashboard/__tests__/control-map-data.test.ts
components/dashboard/__tests__/ControlMap.test.tsx
```
