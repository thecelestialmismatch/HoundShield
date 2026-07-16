# Console Data Provenance — "Where does this number come from?"

**Founder direction (2026-07-17):** clicking anything on the after-login
dashboard must show where the data is fetched from — not just numbers.

This extends the #205 honesty doctrine (label every simulated surface) to its
logical end: **every figure on /console is clickable and discloses its exact
origin.**

## What ships

Click any of these and a provenance dialog opens:

| Surface | Registry id |
|---|---|
| KPI tiles (scanned / blocked / SPRS / quarantine) | `scans-24h`, `blocked-today`, `sprs-score`, `quarantine` |
| Hero capability chips (16/16 · <10ms · 4 regions) | `product-stats` |
| System-status strip ("demo data" chip) | `system-status` |
| Evidence-chain spine ("Simulated preview" pill) | `audit-chain` |
| Gateway throughput / detection donut / engine bars | `throughput`, `detection-mix`, `engine-bars` |
| Live threat feed (header chip **and** any row) | `threat-feed` |
| SPRS posture ring | `sprs-posture` |
| Four overview charts (header chips) | `hourly-activity`, `destinations`, `sprs-trend`, `risk-mix` |
| Assessment snapshot + board header | `assessment` |
| Settings usage meters + Brain budget | `usage-scans`, `usage-brain`, `usage-seats` |

The dialog answers four questions, in buyer language:

1. **What this is** — what the figure means.
2. **Where it comes from** — the exact origin of the value on screen right now
   (named demo seed / this device's localStorage / subscription entitlements /
   product fact).
3. **How it updates** — the refresh mechanics.
4. **How it becomes your data** — only while the surface is simulated; carries
   an "Open Settings · Proxy URL" CTA.

## Source kinds

- `simulated` — browser-generated preview data (orange badge). MUST carry a
  path to live data (unit-enforced).
- `on-device` — computed from the operator's own localStorage (green badge);
  never uploaded.
- `account` — real subscription entitlements / session consumption (steel badge).
- `product` — architecture facts, not measurements (neutral badge).

Signed-in viewers resolve to the live variants via `resolveProvenance(id, live)`
— e.g. the usage meters read "your account… nothing is simulated for your
account" instead of the demo-seed story.

## Files

- `components/dashboard/dataProvenance.ts` — pure registry + `resolveProvenance`.
- `components/dashboard/ProvenancePanel.tsx` — dialog (`role="dialog"`,
  `aria-modal`, Escape/backdrop/button close, focus moved in and restored) +
  `SourceChip` (degrades to a plain span without a handler — never a dead button).
- Wiring: `LiveCommandCenter.tsx` (KPI tiles are now `<button class="kpi">`,
  feed rows use a delegated listener), `OverviewCharts.tsx` and
  `AssessSnapshot.tsx` accept an optional `onSource` hook.

## Guard rails (fail the build if violated)

- `__tests__/dataProvenance.test.ts` — every simulated entry names a go-live
  path; every id a component opens exists; no orphan entries; no copy ever
  claims cloud scanning.
- `__tests__/ProvenancePanel.test.tsx` — dialog semantics, live-variant
  switching, honest-chip degradation.
- `LiveCommandCenter.test.tsx` — end-to-end click flows per surface.
- `app/__tests__/console-dashboard-contract.test.ts` — "data provenance" block
  pins the wiring patterns in source.
