# Overview directions — three candidates

Three structurally different designs for `/command-center/overview`, built 2026-08-07 from
[awesome-design-md](https://github.com/VoltAgent/awesome-design-md) specs. **Not yet chosen** — these
are demos to pick from, not shipping code.

| | Direction | Grounded in | Structural idea | Drill-down |
|---|---|---|---|---|
| **A** | Audit Ledger | `design-md/stripe` | Subsystems as ledger rows you read down like a statement | Row → section |
| **B** | Operator Console | `design-md/linear.app` | Two-column: live stream + stacked posture/subsystem cards, 34px rows | ⌘K + section rows |
| **C** | Executive Brief | `design-md/vercel` | Opens with a sentence, then progressive disclosure | Block → section |

Open any `.html` directly — each is fully self-contained, no server and no network.

## One data model, three designs

`src/data.mjs` is the single source for all three, so the comparison is about design and not content.
Every field maps to something the product already computes:

| Field | Real source |
|---|---|
| `events` / `blocked` / `held` / `blockRatePct` / `scanP50Ms` / `hourly` / `providers` / `detections` / `recent` | `aggregateOverview()` — `lib/dashboard/overview-telemetry.ts` |
| `sprs` / `controlsMet` / `families` / `gapsOpen` | `buildSprsPosture(ALL_CONTROLS, …)` — `lib/shieldready` |
| `quarantine` | `GET /api/quarantine/review` |
| `ROWS[].href` | the 23 destinations in `app/command-center/(tools)/_shell/nav.ts` |

Nothing in the demos is a number the dashboard could not actually show. The values themselves are
illustrative sample data for a design comparison — they are **not** a real tenant's telemetry, and
none of this is customer-facing.

## Rebuild and verify

```bash
node src/build.mjs     # regenerate the three .html files
node src/verify.mjs    # device matrix — exits non-zero on any failure
node src/shoot.mjs     # screenshots via the same emulation path as verify
```

`verify.mjs` needs `playwright-core` and drives `/opt/pw-browsers/chromium`. It asserts four things
per viewport across **iPhone SE / 14 / 15 Pro Max, Pixel 7, Galaxy S8+, tablet, desktop**:

1. no horizontal document scroll (`scrollWidth <= clientWidth`)
2. no element past the right edge, ignoring deliberate horizontal scrollers
3. no `<a>`/`<button>` under 40px tall on a handset
4. no rendered text under 11px

**Capture screenshots with `shoot.mjs`, not the Chromium CLI.** `chromium --headless --screenshot
--window-size=…` does not apply mobile emulation, so it renders a layout the phone never shows and
reads as clipped content. That discrepancy cost a false bug report on 2026-08-07.

## What the matrix caught

First run: **12 of 21 viewports failed.**

- **A** — buttons 34px (under the 44px touch floor), label text at 10px
- **B** — 25 tap targets under the floor; Linear's 34px row is a mouse virtue, not a thumb one
- **C** — clean on every viewport first time, because its mobile layout *is* the design rather than a
  reflow of the desktop one

Both fixes are handset-scoped, so desktop keeps its density. A second pass caught a charting fault in
all three: the blocked segment was floored at a fixed height, which painted red across nearly every
hour and made 1 block look like 11. All three now draw the true blocked share per hour.
