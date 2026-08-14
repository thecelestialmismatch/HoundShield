---
paths:
  - "compliance-firewall-agent/components/**/*.tsx"
  - "compliance-firewall-agent/app/**/*.tsx"
  - "compliance-firewall-agent/app/**/*.ts"
---

# Frontend Rules — Hound Shield

> **Corrected 2026-08-14.** This file previously said "Homepage bg: `bg-[#07070b]`
> — never `bg-white`" and "Dark mode always: `<html className="dark scroll-smooth">`".
> Both were false. `app/layout.tsx` carries **no `dark` class**, and the landing
> page has been light mode for months — `CLAUDE.md` and `globals.css` both say so.
> An agent obeying the old text would have repainted the live marketing site dark.
> `DESIGN.md` had the identical drift and was rewritten on 2026-08-07; this file
> was missed, which is why the drift guard in
> `lib/detection/__tests__/doc-counts.test.ts` now covers it.

## Two themes, and they are not the same page

**Landing / marketing (light).** No `.dark` class on `<html>`.
- Surfaces and text come from the `--hs-*` custom properties in `app/globals.css`
  (`--hs-surface-0`, `--hs-ink`, `--hs-ink-secondary`, `--hs-ink-tertiary`,
  `--hs-border`, `--hs-border-subtle`). Use the token, not a raw hex.
- Cards: white background, `border-[var(--hs-border)]`, subtle shadow.
- Body bg `#ffffff` / `#f0f4f8`; primary text `#0f172a`; secondary `#475569`.

**Command Center dashboard (dark).** Dark is scoped to the dashboard wrapper
(`.hs-lcc`), never to `<html>` globally.
- Background `#07070b` (default), `#0d0d14` (alt sections).
- Cards: `bg-white/[0.03]` + `border border-white/[0.08]`.

**Both.**
- Brand accent: `brand-400` CSS variable — NEVER `amber-*`, `yellow-*`, `indigo-*`, `blue-*`.
- Typography: `font-editorial` (display headers), `font-mono` (metrics/code).

## Styling
- Tailwind CSS ONLY — no inline styles (exception: radial-gradient as `style` prop only)
- `cn()` for conditional class merging — no ternary strings in JSX
- Depth via gradients, glass borders and glows rather than flat fills

## Components
- Functional components + hooks only
- shadcn/ui for primitives — never build from scratch
- Framer Motion for animations (landing + onboarding only)
- `PlatformDashboard` MUST stay `dynamic(..., {ssr: false})` — Recharts crashes on SSR
- `transformStyle: "preserve-3d"` + Framer Motion `motion.div` = crash — never combine
- Components max 500 lines — split into co-located files if larger
- Every new feature: error boundary + loading state
- `next/image` for all images
- Custom cursor `CursorGlow` on `pointer:fine` — never break it

## Responsive (learned the hard way)
Every shell and page needs real breakpoints. The Command Center shipped with
**zero** — a `fixed w-[260px]` sidebar plus an unconditional `ml-[260px]` main
left 67px of usable content on a 375px phone, across all 23 pages. Before
calling any layout done, check it at 375 / 768 / 1200 and confirm
`document.documentElement.scrollWidth === clientWidth`.

## Never ship fabricated state
No hardcoded badge counts, unread dots, status pills or avatar initials. If
nothing real feeds a display, delete the display and record the ceiling and
upgrade path in a `ponytail:` comment. See `(tools)/_shell/Topbar.tsx` for the
worked example.
