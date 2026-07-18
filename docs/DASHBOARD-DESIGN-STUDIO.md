# Dashboard Design Studio — live multi-design + customizable console (2026-07-18)

Founder-directed follow-up to the Aurora redesign. The brief: the dashboard
should be able to wear **many** designs, live — the marketing hero should cycle
through them (light → dark → light, charts still moving) and the after-login
console should let **any** user (no paywall) switch design and rearrange or hide
their sections. "Flexible, not rigid… for everyone." Grounded in real
compliance-dashboard patterns (Vanta: framework-progress, continuous-monitoring,
alerts, roadmap) so the sections stay genuine, not decorative.

## One registry, both surfaces

Every design lives once in **`lib/dashboard/design-themes.ts`** as a
`DesignTheme` — id, name, mode (`light`/`dark`), a picker blurb + 3-dot swatch,
and explicit CSS-variable maps for **both** surfaces (`hero` = the `--a-*` set on
`.hs-demo`; `console` = the `--bg/--panel/--text/…` set on `.hs-lcc`) plus a
`viz` block (stroke · accent · grid · 4-slice donut) for the console's
imperatively-painted canvas + donut, which can't read a CSS var at paint time.

Adding a design later = **one array entry** → it appears in the hero carousel
**and** the console picker automatically. Ships with 6: **Aurora** (default,
the pastel signature), **Midnight** (true dark), **Editorial**, **Sunset**,
**Ocean**, **Forest**.

Aurora's values are identical to the tokens baked into `globals.css` /
`hermes.css` / `lccStyles.ts`, so the default render is byte-for-byte unchanged;
the others reskin around the same token vocabulary.

## Hero — live, controllable carousel

`components/landing/HeroDemoDashboard.tsx` applies the active theme inline to the
window root and cycles the registry:

- **Auto-advances** every 4.6s so the window is "alive", **pauses while the
  cursor dwells** on it, and is **disabled entirely under `prefers-reduced-motion`**
  (manual only).
- **User-controllable**: a ‹ › nav + a dot rail (over the ghost cards) — the
  design name + mode read out (`aria-live`).
- The SVG marks read `var(--a-*)`, so throughput line, donut, engine/destination
  bars and the SPRS gauge **retint for free**; a one-shot `hdSwap` animation
  plays on each change (also silenced under reduced-motion).

## Console — themeable + customizable, free for everyone

`components/dashboard/LiveCommandCenter.tsx` + `lccStyles.ts`:

- **Appearance menu** (palette icon in the top bar): the full registry, with
  swatch + blurb + active check. Applies the theme to `.hs-lcc` inline and, via
  `themeRef`, repaints the canvas/donut/legend (the var-driven surfaces retint on
  their own). The top bar + spine + brain card were var-ized (`--topbar`,
  `var(--panel)` for the old `#fff` literals) so a **real dark mode** is correct,
  not just an inverted background.
- **Customize mode** (sliders icon): reorder (up/down) or hide/show the seven
  Overview sections. Implemented with CSS `order` + visibility on wrapper
  `<Section>`s — **the JSX source order never changes**, so every structure
  contract test still matches; only the rendered order moves.
- **Free + per-device**: both preferences persist to `localStorage`
  (`useDashboardPrefs`) with **no entitlement check**. A saved layout is
  reconciled against the live section registry on load (unknown ids dropped,
  new sections appended), so adding/removing a section never corrupts a saved
  layout, and corrupt JSON falls back to defaults.

### Known limitation

The Guide / Plan / Assessment tabs render Tailwind-dark-utility panels remapped
to light by the existing `.cc-light` scope. Under a dark/colored theme those
secondary panels stay light on the themed shell (readable, slightly
inconsistent). The **Overview** — the main surface — themes fully. Fixing the
embedded panels is a scoped follow-up (extend `.cc-light` to be theme-aware).

## PDF export — verified working

The console Reports artifacts (SSP · POA&M · C3PAO Evidence Pack) and the public
`/demo` Instant Snapshot all generate **real** jsPDF bytes (`%PDF-`, ≥4 KB, ≥2
pages) → `Blob` → anchor download. Verified three ways: unit tests
(`artifact-pdfs.test.ts` magic-bytes/size/page-count), the download-wiring
component test (`ReportsPanel.test.tsx`), and a live browser capture of the
`/demo` snapshot download (a valid 61 KB `HoundShield-AI-Risk-Snapshot.pdf`).
Console Reports PDFs stay gated to Growth+/founder by design; the public
`/demo` snapshot is the no-account "click it and get a real PDF" path.

## Guardrails

- `lib/dashboard/__tests__/design-themes.test.ts` — registry shape, ≥5 themes,
  unique ids, ≥1 dark + ≥3 light, every theme fully defines both surfaces + a
  4-slice donut, aurora == the launch pastel skin, `getThemeById` fallback.
- `lib/dashboard/__tests__/use-dashboard-prefs.test.ts` — hydrate, reorder,
  clamp at edges, hide/show, reset, layout reconciliation, corrupt-JSON survival.
- `app/__tests__/design-studio-contract.test.ts` — both surfaces consume the one
  registry; hero is a live+controllable carousel; console applies + repaints from
  the theme, offers the picker + customize, and is not subscription-gated.
- `app/__tests__/aurora-redesign-contract.test.ts` — updated: the donut now
  paints from the active theme, and the **default** theme's donut is still the
  exact pastel set both surfaces launched with (intent preserved, single-sourced).

Verified: `tsc` clean · `next lint` clean · **1347 tests** green · production
build green · both surfaces browser-screenshotted (hero Aurora + Midnight;
console Aurora + Midnight dark + Sunset + customize/reorder/hide, persisted
across reload), 0 console errors.
