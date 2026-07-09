# Post-login dashboard — subscription entitlements + personalized Brain AI

_2026-07-09 · builds on `DASHBOARD-UNIFICATION-2026-07-09.md`_

The `/console` **Live Command Center** is the single after-login home — it already
unified onto the light "Steel & Cream" palette and never pushes to a second
dashboard. This change makes that one surface **subscription-aware** and gives it
a **personalized, human Brain AI**, so the dashboard delivers exactly what the
customer is paying for and speaks to them by name.

## 1. Subscription entitlements — one source of truth

`lib/billing/entitlements.ts` is the pure, unit-tested grid the whole app reads.
Every plan gets the full product surface; the **volume** it can consume scales
with the tier (the metered-usage model), and specific **capabilities** are gated
on top.

| Tier | Gateway scans / mo | Brain AI queries / mo | Seats | Retention | Adds |
|------|-------------------:|----------------------:|------:|-----------|------|
| Free | 1,000 | 25 | 1 | 7 days | Read-only assessment |
| **Pro** | 50,000 | 500 | 10 | 90 days | Slack alerts · API/JSON · audit export |
| **Growth** | Unlimited | 10,000 (~20× Pro) | 25 | 1 yr | PDF reports · C3PAO coordination · SSO/RBAC |
| Enterprise | Unlimited | Unlimited | Unlimited | 7 yr | On-prem/air-gapped · white-label · HITL |
| Agency | Unlimited | Unlimited | Unlimited | 7 yr | Multi-tenant white-label (RPO/MSP) |

Numbers match `app/pricing/page.tsx` so the marketing site and the console can
never drift. The ladder is a **strict superset** at every step (enforced by a
test), which makes every "Upgrade to X" a truthful "you get strictly more".

Helpers: `getEntitlements`, `normalizeTier` (accepts aliases like `max → growth`
so no paying customer is ever silently downgraded to Free), `formatLimit`,
`usagePercent`, `isNearingLimit`, `hasFeature`, `tierThatUnlocks`.

### Where it shows up on the dashboard
- **Greeting band** (Overview): plan chip + this cycle's scan/Brain allotment.
- **Settings → Plan & usage**: live meters for gateway scans, Brain queries and
  seats, retention, and a plan-driven **Upgrade to _NextTier_** CTA (or "top
  plan" state). The old hardcoded `250,000` cap is gone.
- **Settings → What your plan includes**: a gated feature grid — Included vs a
  truthful `Growth+` / `Enterprise+` unlock label per capability.
- **Brain AI tab**: a query-budget meter that decrements as you ask.

## 2. Personalized, human Brain AI

Brain AI now knows who it's talking to. `LiveCommandCenter` passes a
`BrainContext` (`{ name, ent, brainUsed }`) into `brainAnswer`, which:

- **Greets by first name** and varies its phrasing (warm, not monotone) — while
  staying fully deterministic, so the unit tests are stable. With no context
  (the public demo) the answers are unchanged.
- Is **tier-aware**: "What's on my plan?" reports the live plan, remaining Brain
  queries, seats and retention, and names the next tier's bigger allotment.
- **Gates features truthfully**: asking a Pro user about PDF reports explains
  they unlock on Growth and offers the JSON path they _do_ have — never a dead
  end.
- Adds a **typing indicator** and a **budget meter**; on a metered plan, running
  out returns an honest upgrade nudge instead of failing.

### Safety
`escapeHtml` sanitizes every profile-sourced string (name, company) before it
reaches an `innerHTML` / Brain-output path. Operator free-text is already escaped
on the chat path. The mandatory **"Do not enter CUI — routes to a commercial
cloud endpoint"** warning stays on the Brain surface (Mode-B contract intact).

## 3. Tests
- `lib/billing/__tests__/entitlements.test.ts` — grid, ladder-superset, aliases,
  formatting, gating (23 cases).
- `lib/auth/__tests__/dashboard-viewer.test.ts` — firstName + tier slug plumbing.
- `components/dashboard/__tests__/LiveCommandCenter.test.tsx` — personalized +
  tier-aware `brainAnswer`, by-name greeting, plan chip, meter/feature-grid
  gating, XSS escaping.
- `app/__tests__/console-dashboard-contract.test.ts` — pins "no hardcoded cap",
  entitlement wiring, by-name greeting, Brain budget meter, escaping.

Full suite: **838 passing**. `npm run build` and `npm run lint` clean.
