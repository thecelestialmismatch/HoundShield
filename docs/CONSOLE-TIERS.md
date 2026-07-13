# The tier-gated after-login console

_How `/console` decides what a signed-in user sees — restricted for Free, full for paid — and where the CMMC self-assessment now lives._

## What changed (and why)

Two founder-requested changes:

1. **The CMMC self-assessment now begins on the dashboard itself.** Previously the
   "Begin assessment" CTA bounced the user out to the deep link
   `/command-center/shield/assessment`. Now it expands the assessment **inline on
   `/console`** — same page they land on, no bounce.
2. **The dashboard is tier-gated.** Free users get a **restricted** board;
   paid users get **everything their plan includes**.

## Where the rules come from (single source of truth)

There is exactly one place that defines "what does a plan get?":
[`lib/billing/entitlements.ts`](../compliance-firewall-agent/lib/billing/entitlements.ts).
The console does **not** invent its own gating — it projects that grid through a
pure helper:

- [`lib/billing/console-sections.ts`](../compliance-firewall-agent/lib/billing/console-sections.ts)
  → `buildConsoleSections(tier)` returns `{ isPaid, unlocked[], locked[], upgradeHref }`.
  - **`unlocked`** — capabilities the plan includes → each links straight into
    the command center.
  - **`locked`** — capabilities the plan lacks → each shows a padlock, a truthful
    **"Available on `<tier>`"** (from `tierThatUnlocks()`), and a single Upgrade
    CTA to `/pricing`.

Because both the console and the pricing page read the same grid, the numbers and
feature availability can never drift between them.

### The Free vs. paid split

| Capability | Free | Pro | Growth | Enterprise / Agency |
|---|---|---|---|---|
| CMMC self-assessment + SPRS | ✅ (inline hero) | ✅ | ✅ | ✅ |
| AI prompt gateway | ✅ (1k scans) | ✅ | ✅ | ✅ |
| Email & Slack alerts, API + JSON, audit export | 🔒 | ✅ | ✅ | ✅ |
| PDF reports, C3PAO coordination, SSO/RBAC, priority support | 🔒 | 🔒 | ✅ | ✅ |
| HITL quarantine, on-prem, white-label | 🔒 | 🔒 | 🔒 | ✅ |

The **CMMC self-assessment is the free lead magnet** — unlocked on every tier and
the hero of the restricted board.

## The inline assessment

- The 110-control board was extracted from the route page into
  [`components/dashboard/AssessmentBoard.tsx`](../compliance-firewall-agent/components/dashboard/AssessmentBoard.tsx),
  so **one component** renders in two places:
  - its own route `/command-center/shield/assessment` (`embedded=false`), and
  - inline on `/console` inside `ConsoleDashboard` (`embedded=true`).
- On the console it is **lazy-loaded** (`next/dynamic`, `ssr:false`) and mounts
  only when the user clicks **Begin assessment** — so the console stays light.
- It opens automatically when navigated to via the `#assessment` hash. The status
  panel's "Begin/Continue assessment" CTA now targets `#assessment` instead of the
  external route, so it scrolls to and opens the inline board.

### Theming note (why the dark board looks right on the light console)

`AssessmentBoard` uses "dark" utility classes (`text-white`, `bg-white/[0.03]`, …).
The command-center already renders it under `.cc-light` (see
`app/globals.css`), a remap layer that turns those dark utilities into the light
"Steel & Cream" palette. `/console` mounts the board inside the **same `.cc-light`
scope**, so it themes identically — no new CSS, no seam.

## Honest status (read before assuming this makes money)

This ships a dashboard; it **connects no revenue by itself**:

- Every upgrade CTA points at `/pricing`, which **leads with the live $499 CMMC AI
  Risk Assessment Report** — the product we can actually fulfil today. That is the
  on-plan funnel.
- The **subscription** tiers this gates (Pro/Growth/Enterprise) are **not
  purchasable** until Stripe is connected (`/api/health` still reports
  `payments: missing_key`) and subscription SKUs exist. Per the HERMES plan,
  subscriptions are Stage 2 — prove the $499 report sells first.
- Very few real users reach `/console` today (OAuth login is not wired; buyers
  don't log in to buy the report). Treat this as scaffolding that becomes valuable
  once login + payments are live.

## Files

| File | Role |
|---|---|
| `lib/billing/console-sections.ts` | Pure tier → unlocked/locked projection |
| `components/dashboard/ConsoleDashboard.tsx` | The gated grid + inline assessment |
| `components/dashboard/AssessmentBoard.tsx` | Extracted 110-control board (shared) |
| `app/command-center/shield/assessment/page.tsx` | Thin route → renders the board |
| `app/console/page.tsx` | Mounts `ConsoleDashboard` under `.cc-light` |
| `components/dashboard/CustomerStatusPanel.tsx` | Assessment CTA now → `#assessment` |
| `lib/billing/__tests__/console-sections.test.ts` | Gating contract tests |
| `components/dashboard/__tests__/ConsoleDashboard.test.tsx` | Render/gating tests |
