# Overview Hero Identity Band (2026-07-09)

A small, additive follow-up to the unified post-login dashboard (#152). Adds a
brand-forward **hero identity band** to the top of the `/console` Overview tab.

## Why

The unified dashboard already leads with the evidence-chain **spine** (audit
status) and colour-coded KPI tiles (operational counts). What it lacked was a
single, unmistakable **brand + org identity anchor** the moment you land — the
thing that makes the surface feel owned and premium rather than utilitarian.

This began as PR #150 (an independent redesign that converged on the same fixes
#152 shipped — same `−8°/1.08` logo tilt, same font-variable fix, same
dark→light status panel). #150 was closed as superseded; this band is the one
element it had that `main` did not, ported cleanly on top of the current design.

## Merged with the personalized greeting (#154)

`#154` landed a personalized greeting band (greet-by-name + live plan chip) in the
same Overview slot. Rather than stack two banners, the two were **merged into one**:
the hero band now carries the personalization — `hero-org` shows `Welcome back,
{firstName}` when signed in (falls back to the org name for the demo), and the plan
chip (`.plan-chip`, driven by the entitlements model) sits in the hero's tag row next
to the live gateway pill. One premium branded band instead of a plain greeting strip;
#154's greet/plan tests still pass against it.

## What it is

`components/dashboard/LiveCommandCenter.tsx` (Overview) + `lccStyles.ts`:

- A steel-gradient banner with a white HoundShield mark in a glass chip, the org
  name (`viewer.company`, Fraunces), the "HoundShield AI Compliance Command
  Center" tagline, a live gateway pill, and a faint Doberman logo watermark.
- Right-side glass status chips: **16/16 Engines · <10ms Scan p50 · 4 Regions**.
  These are deliberately chosen to **complement, not duplicate** — the spine owns
  the audit chain, the KPI tiles own scanned/blocked/SPRS/quarantine, so the hero
  shows system-health/trust metrics none of them repeat.
- The hero mark tilts `rotate(-8deg) scale(1.08)` on hover (rotate/scale only,
  never a translate — same contract as every other brand mark), and the band is
  fully responsive: chips flex to equal thirds and the logo/type scale down on
  phones (`≤640px`), verified in a real browser at 1440 and 390 px.

## Placement

`topbar → evidence-chain spine → HERO BAND → ops line → KPI tiles → …`

## Tests

- `app/__tests__/console-dashboard-contract.test.ts` — new "hero identity band"
  block: band + logo + org present; chips are Engines/Scan p50/Regions (no
  SPRS/blocked dupes); hero-logo hover pose is rotate/scale-only.
- Full suite green; `next build` green.
