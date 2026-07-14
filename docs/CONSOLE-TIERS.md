# The after-login console — dashboard first, gates in the sidebar

_How `/console` decides what a signed-in user sees, where the guide and the
paywall live, and how founder access works._

## What changed (and why)

Founder direction, 2026-07-14 (iterating on the 2026-07-13 tier-gated console):

1. **The dashboard IS the page.** `/console` renders the Live Command Center
   alone — live operations first. The guide ("do this next") and the plan
   restrictions ("pay to unlock") no longer stack above the dashboard.
2. **Guide + paywall moved into the sidebar as buttons.**
   - **Your Guide** → the status/next-step panel (SPRS ring, progress, top gaps).
   - **Plan & Unlocks** → the restriction view: what the plan includes, what is
     locked, and **exactly what each locked capability costs** ("Available on
     Growth — $499/mo") with one Upgrade CTA to `/pricing`.
3. **The assessment is never first.** It stays a mid-list sidebar tab and runs
   **inline** inside that tab (no bounce to a separate page). The
   `#assessment` hash deep-link opens the tab in place.
4. **Founder access.** The founder email (`gaurav@houndshield.com`) gets full
   access to everything — top-tier entitlements, no payment, no Stripe row —
   across the console AND every server-side gate.

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
    **"Available on `<tier>` — $`<price>`/mo"** (`tierThatUnlocks()` +
    `availableOnPriceMonthly`), and a single Upgrade CTA to `/pricing`.

Because both the console and the pricing page read the same grid, the numbers and
feature availability can never drift between them.

## Founder access (no payment required)

[`lib/billing/founder-access.ts`](../compliance-firewall-agent/lib/billing/founder-access.ts)
is the one place that decides "this account gets everything":

- `isFounderEmail(email)` — matches `gaurav@houndshield.com` (case-insensitive);
  extendable via the `FOUNDER_ACCESS_EMAILS` env var (comma-separated), never
  replaceable.
- `resolveEffectiveTier(email, storedTier)` — founder → `agency` (top of the
  ladder, strict superset of every plan); everyone else keeps their stored tier.
- The match is always on the **session-verified email** (Supabase/Better Auth) or
  the server-stored `profiles.email` — never anything client-sent.

Wired into every gate:

| Gate | File | Effect for founder |
|---|---|---|
| Console viewer | `lib/auth/dashboard-viewer.ts` | Full-access viewer even with no profile row; "Founder" plan label |
| `/api/me` | `app/api/me/route.ts` | `tier: "agency"`, `founder: true` |
| `/api/customer/status` | `app/api/customer/status/route.ts` | Status computed on the top tier |
| PDF 402 + gateway access | `lib/subscription/check.ts` (`getUserSubscription`) | Top tier with **no subscriptions row**; profile-email lookup runs in parallel (no added latency), fails closed |

### The Free vs. paid split

| Capability | Free | Pro | Growth | Enterprise / Agency / Founder |
|---|---|---|---|---|
| CMMC self-assessment + SPRS | ✅ | ✅ | ✅ | ✅ |
| AI prompt gateway | ✅ (1k scans) | ✅ | ✅ | ✅ |
| Email & Slack alerts, API + JSON, audit export | 🔒 $199/mo | ✅ | ✅ | ✅ |
| PDF reports, C3PAO coordination, SSO/RBAC, priority support | 🔒 $499/mo | 🔒 | ✅ | ✅ |
| HITL quarantine, on-prem, white-label | 🔒 $999/mo | 🔒 | 🔒 | ✅ |

## The inline assessment

- The 110-control board
  ([`components/dashboard/AssessmentBoard.tsx`](../compliance-firewall-agent/components/dashboard/AssessmentBoard.tsx))
  renders in two places: its own route `/command-center/shield/assessment`
  (`embedded=false`) and inside the command center's **CMMC Assessment tab**
  (`embedded=true`).
- It is **lazy-loaded** (`next/dynamic`, `ssr:false`) and mounts the first time
  the tab is opened — the console's first paint stays light.
- The `#assessment` hash (used by the guide's "Begin/Continue assessment" CTA)
  switches to the tab in place; the hash is cleared afterwards so repeat clicks
  keep working.

### Theming note (why the dark panels look right on the light console)

`AssessmentBoard`, `CustomerStatusPanel` and `PlanUnlocksBoard` use "dark"
utility classes (`text-white`, `bg-white/[0.03]`, …). The command center mounts
each of them inside a **`.cc-light` scope** (see `app/globals.css`), the remap
layer that turns those dark utilities into the light "Steel & Cream" palette —
no new CSS, no seam.

## The Reports tab — three REAL PDFs (2026-07-14b)

The three report buttons used to be stubs that flipped their label to
"✓ …pdf" while generating nothing (the fake-success anti-pattern from
`tasks/lessons.md` 2026-07-12). They now generate real artifacts via
[`lib/reports/artifact-pdfs.ts`](../compliance-firewall-agent/lib/reports/artifact-pdfs.ts),
rendered by
[`components/dashboard/ReportsPanel.tsx`](../compliance-firewall-agent/components/dashboard/ReportsPanel.tsx):

| Artifact | Contents |
|---|---|
| **System Security Plan** | Cover + family summary + full 110-control inventory with per-control status and SPRS weight |
| **POA&M** | Every open (non-MET) control, most impactful first: weakness, priority, SPRS Δ, planned remediation, effort estimate, total hours |
| **C3PAO Evidence Pack** | Evidence register for implemented controls (what an assessor asks to see) + attestation |

Rules the panel enforces:

- **Built from the operator's own local assessment** (`lib/shieldready/storage`) —
  generation runs in the browser, so assessment data never leaves their machine
  (the privacy boundary from 2026-07-05 holds).
- **Plan-gated truthfully**: PDF artifacts are Growth+ per the entitlements grid.
  Locked users see "Available on Growth — $499/mo" and a button that opens the
  Plan & Unlocks view. **Founder accounts always generate, free of cost.**
- **Never a fake success**: a real download happens, the Recent-exports list
  records the artifact with the true SHA-256 of the generated bytes, and any
  failure shows a visible error. Sample history rows only appear in the public
  demo and are labeled `sample`.

## Honest status (read before assuming this makes money)

This ships a dashboard; it **connects no revenue by itself**:

- Every upgrade CTA points at `/pricing`, which **leads with the live $499 CMMC AI
  Risk Assessment Report** — the product we can actually fulfil today. That is the
  on-plan funnel.
- The **subscription** tiers this gates (Pro/Growth/Enterprise) are **not
  purchasable** until Stripe is connected (`/api/health` reports
  `payments: missing_key` as of 2026-07-14) and subscription SKUs exist. Per the
  HERMES plan, subscriptions are Stage 2 — prove the $499 report sells first.
- Founder access exists so the founder can test and demo every surface without a
  payment path. It grants nothing to anyone else.

## Files

| File | Role |
|---|---|
| `lib/billing/founder-access.ts` | Founder email → top-tier override (pure) |
| `lib/billing/console-sections.ts` | Pure tier → unlocked/locked projection (now priced) |
| `components/dashboard/LiveCommandCenter.tsx` | THE after-login dashboard (sidebar owns guide/plan/assessment tabs) |
| `components/dashboard/PlanUnlocksBoard.tsx` | "Plan & Unlocks" sidebar view (was `ConsoleDashboard`) |
| `components/dashboard/CustomerStatusPanel.tsx` | "Your Guide" sidebar view; assessment CTA → `#assessment` |
| `components/dashboard/AssessmentBoard.tsx` | Extracted 110-control board (shared) |
| `app/command-center/shield/assessment/page.tsx` | Thin route → renders the board |
| `app/console/page.tsx` | Resolves the viewer (incl. founder) → mounts the command center |
| `lib/subscription/check.ts` | Server tier gate (PDF/gateway) with founder override |
| `lib/billing/__tests__/founder-access.test.ts` | Founder contract tests |
| `lib/billing/__tests__/console-sections.test.ts` | Gating + pricing contract tests |
| `components/dashboard/__tests__/PlanUnlocksBoard.test.tsx` | Paywall view tests |
| `components/dashboard/__tests__/LiveCommandCenter.test.tsx` | Sidebar/tabs/founder render tests |
| `lib/subscription/__tests__/check.test.ts` | Server gate founder tests |
