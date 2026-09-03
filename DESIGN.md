# HoundShield — Design System

> Drop this file into any AI agent context to convey the HoundShield visual identity.
> Format follows the [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) pattern
> (Google Stitch section spec): a plain-text design document an agent can read and build from.
>
> **Every token below is copied from `compliance-firewall-agent/app/globals.css`.**
> `app/__tests__/design-md-tokens.test.ts` fails if a token named here stops existing there.
> Last verified against the code: **2026-08-07**.

---

## Visual Theme & Atmosphere

**Product personality:** Precision defense, in daylight. A compliance instrument you would be
comfortable showing an assessor — measured, legible, unexcitable.

**Tone:** Technical authority with warmth. Data-dense but calm. The product's job is to say what
actually happened, so the design never dramatises: no alarm-red dashboards, no fake motion, no
metric that looks like a measurement unless it is one.

**Two surfaces, one family.**

| Surface | Where | Palette |
|---|---|---|
| Marketing / landing | `/`, `/pricing`, `/security`, … | Light. `--hs-surface-0` ground, steel and cream section rhythm |
| Command Center (after login) | `/command-center/*` | Light, scoped by the `cc-light` class on the shell root |
| Panel layer inside the dashboard | `.hs-lcc` blocks | Aurora skin — glass panels over the aurora gradient |

> **This replaces the pre-2026-08-07 version of this file**, which described a dark `#07070b`
> landing page with an indigo brand. That has not been true since the light-mode redesign; the file
> had drifted for roughly four months and was actively misleading agents that read it. `CLAUDE.md`
> is the authority on which surface is light and which is dark, and it says the landing page is
> light and the dashboard uses the `cc-light` scope.

---

## Color Palette & Roles

### Brand

```
--hs-steel          #81A6C6   primary brand hue
--hs-steel-dark     #5A86A8   brand text on light, chart "steel" series
--hs-steel-light    #C5DAE9   fills, hover washes
--hs-sky            #AACDDC   secondary cool accent
--hs-cream          #F3E3D0   warm accent, alternate sections
--hs-cream-deep     #EDD5BC   warm accent, footers
--hs-sand           #D2C4B4   muted warm neutral
--hs-sand-light     #E8DDD1
```

`brand-400` / `brand-500` are the Tailwind aliases used in components. **Never** reach for raw
`amber-*`, `yellow-*`, `indigo-*` or `purple-*` — the Command Center contract test
(`console-dashboard-contract.test.ts`) fails the build on indigo or purple in the shell.

### Surfaces — a four-step section rhythm

```
--hs-surface-0      #FAFCFF   near-white, hero and default
--hs-surface-1      #E9F0F7   steel wash, alternate cool sections, dashboard ground
--hs-surface-2      #F3E3D0   cream, warm accent sections
--hs-surface-3      #EDD5BC   deep cream, warm accent / footers
--hs-navy           #0D1B2A   dark feature bands
```

Alternate `0 → 1 → 2 → navy` down a page so it reads with a clear cadence. Each step is visibly
distinct from its neighbour — an earlier revision had surface-0 and surface-1 differing by ~2%
lightness and the whole page read as one flat colour.

### Ink

```
--hs-ink            #0A1420   primary text
--hs-ink-secondary  #14222D   body text
--hs-ink-tertiary   #2E4150   labels, captions, muted metadata
```

### Borders and overlays

```
--hs-border-subtle  rgba(129,166,198,0.12)
--hs-border         rgba(129,166,198,0.22)
--hs-border-strong  rgba(129,166,198,0.45)
--hs-border-ink     rgba(15,30,46,0.10)    default card/divider border in the dashboard
--hs-mist           rgba(129,166,198,0.06)
--hs-mist-md        rgba(129,166,198,0.10)
--hs-glow           rgba(129,166,198,0.18)
--hs-glow-strong    rgba(129,166,198,0.28)
```

### Semantic

```
--hs-success #059669   on --hs-success-bg #ECFDF5
--hs-danger  #DC2626   on --hs-danger-bg  #FEF2F2
--hs-warn    #D97706   on --hs-warn-bg    #FFFBEB
```

### Aurora skin — the dashboard panel language

Shared by the marketing hero demo window and the after-login console so the two read as one family.

```
--hs-aurora-1       #C9D1DB   cool slate-blue (top-left)
--hs-aurora-2       #D3D8D5   neutral mid
--hs-aurora-3       #DFE6D2   pale sage (bottom-right)
--hs-aurora-bg      linear-gradient(155deg, #C9D1DB 0%, #D3D8D5 44%, #DFE6D2 100%)
--hs-aurora-glass   rgba(255,255,255,0.66)
--hs-aurora-shadow  0 30px 70px rgba(56,78,112,0.20), 0 6px 18px rgba(56,78,112,0.10)
--hs-action         #2F6BF0   vivid CTA blue      --hs-action-hover #245FE0
--hs-delta          #37A05A   positive trend
```

Pastel data-viz accents: `--hs-lime #B6D94E` / `--hs-lime-soft #D7EC95` · `--hs-peach #F0B880` /
`--hs-peach-soft #F8DDC0` · `--hs-peri #A9C7EE` / `--hs-peri-soft #D8E3F7`.

### Chart series (hand-rolled SVG, `components/dashboard/operator/panelPrimitives.tsx`)

```
STEEL  #3A6EA5    ORANGE #C96A28    GREEN #0E9F6E    VIOLET #7C5CB8

Risk:  CRITICAL #C93A3F · HIGH #C96A28 · MEDIUM #B08205 · LOW #3A6EA5 · NONE #7C8AA0
```

**Identity is never colour-alone.** Every mark carries a direct text label and a native `<title>`
tooltip. A colourblind assessor reading a gap report must get the same information.

---

## Typography Rules

```
--font-display   'Geist', system-ui, sans-serif        display headers
--font-body      'Geist', system-ui, sans-serif        all paragraph text
--font-mono      'Geist Mono', ui-monospace, monospace metrics, SPRS scores, latency, event refs
```

| Role | Treatment |
|---|---|
| Hero H1 | `font-editorial`, `text-5xl`+ |
| Section H2 | `text-3xl font-bold` |
| Panel heading | `1.5rem`, weight 600, `var(--f-disp)` |
| Card header | `text-lg font-semibold` |
| Metric / badge | `font-mono text-sm` |
| Muted label | `text-xs uppercase tracking-wider`, `--hs-ink-tertiary` |

Every number a customer could act on — score, latency, count, event reference — is monospaced.
It is a legibility rule, not a decorative one: figures get compared against each other and against
a PDF.

---

## Component Stylings

### Cards / panels

```
Dashboard panel:  bg --hs-surface-0, border 1px --hs-border-ink, radius 12–16px
Glass (aurora):   bg --hs-aurora-glass, backdrop-blur, border --hs-border
Landing card:     white bg, border-slate-200, subtle shadow
```

### Buttons

```
Primary:    bg-brand-500 hover:bg-brand-400, text-white, px-4 py-2, rounded-lg, font-semibold
Secondary:  border --hs-border-ink, text --hs-ink-secondary, hover:bg-white/5
Ghost:      text-slate-500 hover:text-slate-300
Danger:     bg-rose-500/10, ring-1 ring-rose-500/20, text-rose-400
Disabled:   opacity-40 pointer-events-none
```

### Inputs

```
bg transparent or --hs-surface-0, border --hs-border-ink, radius 8–12px
placeholder --hs-ink-tertiary
focus-visible: ring-2 ring-brand-500, never outline:none without a replacement
```

### Badges / pills

```
Risk CRITICAL  bg-red-500/10    text-red-400     ring-1 ring-red-500/30    rounded-full text-xs font-mono
Risk HIGH      bg-amber-500/10  text-amber-400   ring-1 ring-amber-500/30
Risk MEDIUM    bg-yellow-500/10 text-yellow-400
Risk LOW       bg-emerald-500/10 text-emerald-400
Count pill     bg-rose-500/10   text-rose-400    ring-1 ring-rose-500/20
```

**A count pill renders only when it has a real, non-zero number.** See Do's and Don'ts.

### Navigation (Command Center)

```
Rail width      260px expanded · 68px collapsed (desktop only)
Item            rounded-lg px-3 py-2 text-[13px] font-medium
Item active     bg-brand-500/10 text-brand-400 + 3px brand-500 left marker + aria-current="page"
Item idle       text-slate-500 hover:bg-white/5 hover:text-slate-300
Section header  text-[11px] font-semibold uppercase tracking-wider, aria-expanded
Header bar      h-14, bg rgba(250,252,255,0.85), backdrop-blur-xl, border-b --hs-border-ink
```

---

## Layout Principles

```
Page ground        bg --hs-surface-1, min-h-screen
Content padding    p-4 sm:p-6 lg:p-8        (never a flat p-6 — it costs 48px on a phone)
Max width          max-w-7xl mx-auto
Section padding    py-20 px-4 (px-6 on larger)
Section gap        gap-6 to gap-8
Card padding       p-4 (sm) · p-6 (md) · p-8 (lg)
Icon sizes         w-4 h-4 (sm) · w-5 h-5 (md) · w-6 h-6 (lg)
Radius             rounded-lg cards · rounded-xl modals · rounded-2xl panels · rounded-full pills
```

---

## Depth & Elevation

```
--shadow-sm  0 1px 2px  rgba(15,30,46,0.04), 0 1px 3px  rgba(129,166,198,0.06)
--shadow-md  0 4px 16px rgba(15,30,46,0.06), 0 1px 4px  rgba(129,166,198,0.08)
--shadow-lg  0 8px 32px rgba(15,30,46,0.08), 0 2px 8px  rgba(129,166,198,0.10)
--shadow-xl  0 16px 48px rgba(15,30,46,0.10), 0 4px 12px rgba(129,166,198,0.12)
```

Surface hierarchy, lowest to highest: page ground (`surface-1`) → panel (`surface-0` + border) →
overlay/drawer (`z-50` + scrim) → command palette (`z-70`) → skip-link (`z-80`).

Depth comes from the border and the shadow, not from a darker fill. Two adjacent panels never
differ only by background lightness.

---

## Motion

```
--ease-out      cubic-bezier(0.16, 1, 0.3, 1)
--ease-spring   cubic-bezier(0.34, 1.56, 0.64, 1)
--ease-in-out   cubic-bezier(0.65, 0, 0.35, 1)
--duration-fast 150ms  --duration-base 250ms  --duration-slow 400ms  --duration-enter 600ms
```

Framer Motion for section entrances (`whileInView`, viewport once) and `AnimatePresence` for
conditional mounts. **Never combine `transformStyle: "preserve-3d"` with a Framer `motion.div`** —
it crashes. Honour `prefers-reduced-motion`; the panel stylesheet already does.

---

## Responsive Behavior

```
Breakpoints    sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536
Dashboard rail pinned from lg; off-canvas drawer below lg, with scrim + Escape + focus trap
Touch targets  min 44×44 for anything tappable
Tables/charts  scroll inside their own overflow-x container — the page body never scrolls sideways
```

**The dashboard shell must declare breakpoints.** Until 2026-08-07 it declared none: a `fixed
w-[260px]` sidebar and an unconditional `ml-[260px]` main left a 375px phone with 67px of usable
content on all 23 Command Center pages. `app/__tests__/dashboard-responsive-contract.test.ts` is
the regression guard; jsdom has no layout engine, so verify real breakpoints in a real browser by
reading computed style, not by reading class names.

---

## Do's and Don'ts

**Do**

- Read values from `--hs-*` tokens. Add a token before adding a hex literal.
- Give every interactive element a visible `focus-visible` state and an accessible name.
- Give every data panel four states: populated, **empty**, **loading**, **error**.
- Make an empty state actionable — say what fills it and link there.
- Use `next/image`, Lucide icons, and `cn()` for conditional classes.

**Don't**

- **Never render a number the customer could mistake for their own measurement unless it is one.**
  This is the product's core promise, and the repo has broken it three times: an 804-line mockup
  dashboard (2026-07-29), a constant activation checklist (2026-07-31), and a hardcoded
  `badge: "4"` quarantine count plus a static "All Systems Operational" pill (2026-08-07). Sample
  data gets `<SampleDataNotice>`; unknown values render nothing, never a placeholder or a zero.
- Never use raw `amber-*`, `yellow-*`, `indigo-*`, `purple-*` for brand.
- Never use inline styles (a radial-gradient `style` prop is the one exception).
- Never let a component exceed **500 lines** — split into co-located files.
- Never ship chrome that implies state nothing feeds: no permanent unread dots, no green
  health pills that are string literals, no search field that isn't wired to search.
- Never combine `preserve-3d` with Framer Motion. Never SSR Recharts — any
  Recharts component stays `dynamic(..., { ssr: false })`.

---

## Brand Voice (for generated copy)

- **Active voice:** "HoundShield detects", not "Detection is performed".
- **Numbers first:** "<10ms", not "under ten milliseconds".
- **Say the limit out loud.** Mode B (self-hosted Docker) is the CUI-safe deployment; the hosted
  Vercel plane is not FedRAMP-authorized and must never be described as CUI-safe.
- **Superlatives sparingly** — "110 controls" beats "comprehensive controls".
- **One proxy URL change.** Repeat it; it is the core value proposition.

---

## Agent Prompt Guide

When generating HoundShield UI, state these constraints:

> Light surfaces from `--hs-surface-0/1/2/3`; ink from `--hs-ink*`; brand is steel `#81A6C6`
> (`brand-400`/`brand-500`), never indigo or amber. Cards are `--hs-surface-0` with a
> `--hs-border-ink` border. Geist for text, Geist Mono for every metric. Tailwind only, no inline
> styles, `cn()` for conditionals, Lucide icons, components under 500 lines. Mobile-first:
> `p-4 sm:p-6 lg:p-8`, sidebar off-canvas below `lg`. Every panel needs populated, empty, loading
> and error states. Never render placeholder or seeded numbers as the customer's own data — render
> nothing, or label it with `<SampleDataNotice>`.

---

*Read by AI coding agents at session start to maintain visual consistency.*
*Token values verified against `app/globals.css` on 2026-08-07 and guarded by `design-md-tokens.test.ts`.*
