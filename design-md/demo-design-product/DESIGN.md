# Demo Design Product — Design System

> A portable, product-agnostic design system in the
> [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) format (Google Stitch section
> spec). Drop this file into any repository and point an AI coding agent at it.
>
> Exported 2026-08-07 from the HoundShield Command Center. Self-contained: it depends on nothing in
> that codebase. Rename this heading and the folder when the product has a name.

---

## Visual Theme & Atmosphere

**Personality:** A precision instrument in daylight. Calm, legible, unexcitable — a dense
professional tool you would be comfortable showing an auditor, a regulator, or a customer's board.

**Tone:** Technical authority with warmth. Data-dense but never dramatic. The interface's job is to
report what actually happened, so it does not perform urgency: no alarm-red dashboards, no
decorative motion, no figure that looks like a measurement unless it is one.

**Light-first.** A cool steel ground with warm cream accents. Depth comes from borders and soft
shadows, never from darker fills — two adjacent panels never differ only by background lightness.

**Two layers.** A light application chrome (rail, header, page ground) wrapping a glass panel layer
("aurora") that carries the data. The two read as one family because they share the same hues at
different weights.

---

## Color Palette & Roles

Copy this block verbatim into `:root`.

### Brand

```css
--ds-steel:          #81A6C6;  /* primary brand hue */
--ds-steel-dark:     #5A86A8;  /* brand text on light, primary chart series */
--ds-steel-light:    #C5DAE9;  /* fills, hover washes */
--ds-sky:            #AACDDC;  /* secondary cool accent */
--ds-cream:          #F3E3D0;  /* warm accent, alternate sections */
--ds-cream-deep:     #EDD5BC;  /* warm accent, footers */
--ds-sand:           #D2C4B4;  /* muted warm neutral */
--ds-sand-light:     #E8DDD1;
```

**Never** substitute `amber-*`, `yellow-*`, `indigo-*` or `purple-*` for the brand. Steel is the
identity; warm tones are accents only.

### Surfaces — a four-step section rhythm

```css
--ds-surface-0:      #FAFCFF;  /* near-white — hero, cards, default */
--ds-surface-1:      #E9F0F7;  /* steel wash — page ground, alternate sections */
--ds-surface-2:      #F3E3D0;  /* cream — warm accent sections */
--ds-surface-3:      #EDD5BC;  /* deep cream — warm accent, footers */
--ds-navy:           #0D1B2A;  /* dark feature bands */
```

Alternate `0 → 1 → 2 → navy` down a long page so it reads with a clear cadence. **Each step must be
visibly distinct from its neighbour.** An earlier revision had steps differing by ~2% lightness and
the entire page read as one flat colour — if two surfaces are hard to tell apart, collapse them into
one rather than shipping a distinction nobody can see.

### Ink

```css
--ds-ink:            #0A1420;  /* primary text, headings */
--ds-ink-secondary:  #14222D;  /* body copy */
--ds-ink-tertiary:   #2E4150;  /* labels, captions, muted metadata */
```

### Borders & overlays

```css
--ds-border-subtle:  rgba(129,166,198,0.12);
--ds-border:         rgba(129,166,198,0.22);
--ds-border-strong:  rgba(129,166,198,0.45);
--ds-border-ink:     rgba(15,30,46,0.10);   /* default card + divider border */
--ds-mist:           rgba(129,166,198,0.06);
--ds-glow:           rgba(129,166,198,0.18);
```

### Semantic

```css
--ds-success:  #059669;  --ds-success-bg: #ECFDF5;
--ds-danger:   #DC2626;  --ds-danger-bg:  #FEF2F2;
--ds-warn:     #D97706;  --ds-warn-bg:    #FFFBEB;
--ds-action:   #2F6BF0;  --ds-action-hover: #245FE0;  /* vivid CTA blue */
--ds-delta:    #37A05A;                                /* positive trend */
```

### Aurora — the data panel layer

```css
--ds-aurora-1:      #C9D1DB;  /* cool slate-blue (top-left) */
--ds-aurora-2:      #D3D8D5;  /* neutral mid */
--ds-aurora-3:      #DFE6D2;  /* pale sage (bottom-right) */
--ds-aurora-bg:     linear-gradient(155deg, #C9D1DB 0%, #D3D8D5 44%, #DFE6D2 100%);
--ds-aurora-glass:  rgba(255,255,255,0.66);
--ds-aurora-shadow: 0 30px 70px rgba(56,78,112,0.20), 0 6px 18px rgba(56,78,112,0.10);
```

Pastel data-viz accents:

```css
--ds-lime:  #B6D94E;  --ds-lime-soft:  #D7EC95;
--ds-peach: #F0B880;  --ds-peach-soft: #F8DDC0;
--ds-peri:  #A9C7EE;  --ds-peri-soft:  #D8E3F7;
```

### Chart series

```
Series:  #3A6EA5 steel · #C96A28 orange · #0E9F6E green · #7C5CB8 violet
Ranked:  critical #C93A3F · high #C96A28 · medium #B08205 · low #3A6EA5 · none #7C8AA0
```

**Identity is never colour alone.** Every mark carries a direct text label and a native `<title>`
tooltip. Someone who cannot distinguish your reds from your greens must get the same information.

---

## Typography Rules

```css
--ds-font-display: 'Geist', system-ui, sans-serif;
--ds-font-body:    'Geist', system-ui, sans-serif;
--ds-font-mono:    'Geist Mono', ui-monospace, monospace;
```

| Role | Treatment |
|---|---|
| Hero H1 | `clamp(2.5rem, 5vw, 3.5rem)`, weight 600, tight tracking |
| Section H2 | `1.875rem`, weight 700 |
| Panel heading | `1.5rem`, weight 600, display face |
| Card header | `1.125rem`, weight 600 |
| Body | `0.9375rem`, line-height 1.6 |
| Metric / badge | `0.875rem`, **mono** |
| Muted label | `0.75rem`, uppercase, `tracking-wider`, ink-tertiary |

**Every number a user could act on is monospaced** — scores, counts, latencies, IDs, references.
This is a legibility rule, not a decorative one: figures get compared against each other, against a
previous screen, and against an exported document, and proportional digits make that harder.

---

## Component Stylings

### Cards / panels

```
Panel:    bg surface-0, 1px border-ink, radius 12–16px, shadow-sm
Glass:    bg aurora-glass, backdrop-blur(12px), 1px border, radius 16px
Elevated: + shadow-lg on hover, border → border-strong
```

### Buttons

```
Primary:   bg steel-dark, text white, px-4 py-2, radius 8px, weight 600
Secondary: 1px border-ink, text ink-secondary, transparent bg, hover bg ink 5%
Ghost:     text ink-tertiary, hover text ink
Danger:    bg danger 10%, ring 1px danger 30%, text danger
Disabled:  opacity .4, pointer-events none
```

Every button needs a visible `:focus-visible` ring (2px, brand). Never remove an outline without
replacing it.

### Inputs

```
bg transparent or surface-0, 1px border-ink, radius 8–12px, px-3 py-2
placeholder: ink-tertiary
focus-visible: ring 2px steel-dark
```

### Badges / pills

```
Ranked:  bg <hue> 10%, ring 1px <hue> 30%, text <hue>, radius full, text-xs, mono
Count:   bg danger 10%, ring 1px danger 20%, text danger, radius full
Status:  dot 6px + label; the dot NEVER animates unless it reflects live state
```

**A count pill renders only when it has a real, non-zero value.** Not while loading, not on error,
not as a zero. See Do's & Don'ts — this is the rule most often broken.

### Application shell

```
Rail            260px expanded · 68px collapsed (desktop only)
Item            radius 8px, px-3 py-2, 13px, weight 500
Item active     bg brand 10%, text brand, 3px brand left marker, aria-current="page"
Item idle       text ink-tertiary, hover bg ink 5%
Section header  11px, weight 600, uppercase, tracking-wider, aria-expanded
Header bar      h-56px, bg surface-0 @85%, backdrop-blur-xl, border-b border-ink
Command palette ⌘K, z-70, over the SAME nav array the rail renders
```

---

## Layout Principles

```
Page ground      surface-1, min-height 100vh
Content padding  p-4 → sm:p-6 → lg:p-8      (never a flat p-6 — it costs 48px on a phone)
Max width        1280px, centered
Section padding  py-20 px-4 (px-6 larger)
Section gap      24–32px
Card padding     16px (sm) · 24px (md) · 32px (lg)
Icon sizes       16px (sm) · 20px (md) · 24px (lg)
Radius           8px controls · 12px cards · 16px panels/modals · full pills
```

---

## Depth & Elevation

```css
--ds-shadow-sm: 0 1px 2px rgba(15,30,46,.04), 0 1px 3px rgba(129,166,198,.06);
--ds-shadow-md: 0 4px 16px rgba(15,30,46,.06), 0 1px 4px rgba(129,166,198,.08);
--ds-shadow-lg: 0 8px 32px rgba(15,30,46,.08), 0 2px 8px rgba(129,166,198,.10);
--ds-shadow-xl: 0 16px 48px rgba(15,30,46,.10), 0 4px 12px rgba(129,166,198,.12);
```

Stacking order, lowest to highest: page ground → panel → sticky header (40) → drawer + scrim (50) →
command palette (70) → skip link (80).

---

## Motion

```css
--ds-ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
--ds-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--ds-fast: 150ms;  --ds-base: 250ms;  --ds-slow: 400ms;
```

Entrances use `whileInView` with `viewport: { once: true }`. Motion is confirmation, never
decoration. **Always honour `prefers-reduced-motion: reduce`** — disable transforms and transitions,
keep opacity changes.

---

## Responsive Behavior

```
Breakpoints   sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536
Side rail     pinned from lg; off-canvas drawer below lg
Drawer        scrim + Escape + focus trap + focus restore + close on navigation
Touch targets min 44×44px
Wide content  scrolls inside its own overflow-x container; the body never scrolls sideways
```

**The shell must declare breakpoints, and this must be tested.** The system this was extracted from
shipped an application shell with *zero* breakpoint prefixes: a `fixed 260px` rail plus an
unconditional `margin-left: 260px` left a 375px phone with **67px of usable content on every page**.
The panels inside were fully responsive the whole time — they were reflowing correctly inside a
column too narrow to read. Nobody noticed because nothing tested it.

Assert breakpoints in source (a unit test can do this), and verify layout in a real browser by
reading **computed style**, not class names. jsdom has no layout engine and cannot tell you the
difference.

---

## Do's and Don'ts

**Do**

- Read every value from a token. Add a token before you add a hex literal.
- Give every data surface **four** states: populated, empty, loading, error. Design the empty state
  first — it is what a new user actually sees.
- Make empty states actionable: say what fills them and link there.
- Give every interactive element a visible focus state and an accessible name.
- Mark the current navigation item with `aria-current="page"`, not colour alone.

**Don't**

- **Never render a value a user could mistake for a real measurement unless it is one.** This is the
  most important rule here and the one most often broken, because fake state is how a UI looks
  finished before it is. Unknown renders *nothing* — never a placeholder, never a zero, never a
  plausible-looking default. Sample content is labelled as sample, in one consistent voice.
- Never ship chrome that implies state nothing feeds: no permanent unread dots, no green health
  pills that are string literals, no search field not wired to search, no pulsing "live" indicator
  over static data.
- Never let a component exceed **500 lines** — split into co-located files.
- Never use inline styles (a gradient `style` prop is the one reasonable exception).
- Never distinguish two surfaces by background lightness alone.
- Never animate a status dot that does not reflect live state.

---

## Agent Prompt Guide

Paste this when asking an agent to generate UI in this system:

> Use the Demo Design Product system. Light surfaces from `--ds-surface-0/1/2/3`; text from
> `--ds-ink`, `--ds-ink-secondary`, `--ds-ink-tertiary`. Brand is steel `#81A6C6` /
> `--ds-steel-dark` — never indigo, amber or purple. Cards are `--ds-surface-0` with a
> `--ds-border-ink` border and `--ds-shadow-sm`. Geist for text, Geist Mono for every number a user
> could act on. No inline styles, components under 500 lines, Lucide icons. Mobile-first:
> `p-4 sm:p-6 lg:p-8`, side rail off-canvas below `lg` with scrim, Escape and a focus trap. Every
> data surface needs populated, empty, loading and error states. Never render placeholder or seeded
> values as if they were real — render nothing, or label it explicitly as sample data.

---

*Exported 2026-08-07. Product-agnostic: depends on no external codebase.*
