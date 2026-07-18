# Aurora redesign — hero window + after-login console (2026-07-18)

Founder-directed visual redesign. The brief: a reference dashboard the founder
loved — soft, clean, "eye-soothing" — and a requirement that **both** the
marketing hero window and the after-login console wear that same look, so the
"before you sign up" and "after you sign in" experiences read as one product.

## The Aurora design language

| Element | Value |
|---------|-------|
| Stage / page background | `--hs-aurora-bg` — `linear-gradient(155deg, #C9D1DB, #D3D8D5 44%, #DFE6D2)` (cool slate-blue → pale sage) |
| Surfaces | white / near-white cards, `16px` radius, soft floating shadows (`--soft`, `--aurora-shadow`) |
| Sidebar / top bar | glass — translucent white (`--hs-aurora-glass`) + `backdrop-filter: blur` |
| Pastel accents | lime `#B6D94E` · peach `#F0B880` · periwinkle `#A9C7EE` (+ soft steel `#81A6C6`) |
| Primary CTA | vivid blue `--hs-action` `#2F6BF0` |
| Positive delta | green `--hs-delta` `#37A05A` |

Every token lives **once** in `app/globals.css` (`:root`), so the hero and the
console can never drift apart. That single source of truth is the whole point of
the "same family, both sides" requirement.

## What changed

1. **`app/globals.css`** — added the shared Aurora token block (gradient, glass,
   pastel accents, CTA blue, positive-delta green, aurora shadow).
2. **`app/hermes.css`** — the marketing **hero section** now sits on
   `--hs-aurora-bg` (was a near-white wash). The faint trust row is nudged to AA
   ink so it stays legible over the gradient.
3. **`components/landing/HeroDemoDashboard.tsx`** — full rebuild from the retired
   dark demo palette to the light Aurora window: glass "ghost" cards stacked
   behind a floating light product window, a light title bar (blue brand badge ·
   Live-demo pill · settings/search/avatar), a "Live AI Monitor" heading + a blue
   "New scan" button, four KPI tiles with **circular pastel icon badges** + green
   deltas, and pastel line / donut / bar / gauge / feed visuals. Still a pure,
   timer-driven demo — no network, all data simulated, window badged "Live demo".
4. **`components/dashboard/lccStyles.ts`** + **`LiveCommandCenter.tsx`** — the
   `/console` after-login dashboard now shares the Aurora skin: the shell sits on
   the same gradient (`background-attachment: fixed`), the sidebar is a glass
   surface, every panel/KPI/card floats on the softer shared shadow, the
   detection-mix donut uses the same pastel sweep as the hero, the engine bars use
   periwinkle→lime, and the SPRS ring fills lime.

## Deliberate accessibility line

The `OverviewCharts` functional bar/area charts on the console keep their
dataviz-skill-validated categorical palette (steel `#3A6EA5` · warm orange
`#C96A28` · green `#0E9F6E` · violet `#7C5CB8`). Pushing those working-dashboard
marks to pure pastels would drop graphical-object contrast below WCAG's 3:1
non-text guideline. The marketing hero window is decorative and may run softer;
the real dashboard's charts stay accessible. Cohesion is carried by the gradient
stage, glass chrome, floating cards, pastel donut, pastel engine bars, and the
lime SPRS ring — not by making every mark low-contrast.

## Guardrails

`app/__tests__/aurora-redesign-contract.test.ts` pins the redesign so it can't
silently regress: aurora tokens defined once in globals, the hero section on the
gradient, the hero window as the new light skin (no leftover dark palette), and
the console sharing the gradient + pastel data-viz. All contract-locked structure
from `console-dashboard-contract` / `HeroDemoDashboard` / `logo-motion-contract`
(evidence-chain spine, KPI provenance dialogs, mandatory CUI warning, panel
captions, destination shares, shared logo-hover tilt) is preserved.

Verified: `tsc` clean · `next lint` clean · **1323 tests green** · production
build green · both surfaces browser-screenshotted at 1440×2 and confirmed to
match the reference aesthetic.
