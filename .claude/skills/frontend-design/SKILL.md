---
name: frontend-design
description: Apply Hound Shield's exact design system to any UI — dark backgrounds, brand gold, editorial typography, no inline styles.
user-invocable: true
---

# Hound Shield Design System

## Colors
- Homepage background: `bg-[#07070b]`
- Alt section background: `bg-[#0d0d14]`
- Brand gold: `brand-400` CSS variable — NEVER `amber-*`, `yellow-*`, `indigo-*`, `blue-*`
- Surface cards: `bg-white/[0.03]` or `bg-white/[0.05]` with `border border-white/[0.08]`
- Text primary: `text-white`
- Text muted: `text-white/60` or `text-white/40`

## Typography
- Display / hero headers: `font-editorial` — tracked tightly, large scale (48–96px)
- Metrics, code, badges: `font-mono`
- Body: default sans (Inter via Tailwind)
- No `font-display`, no `font-sans` for headers, no Outfit

## Spacing
- Section padding: `py-24` to `py-32`
- Card padding: `p-6` to `p-8`
- Border radius: `rounded-xl` (cards), `rounded-2xl` (modals/hero elements)
- Gap: `gap-6` to `gap-8` between cards

## Rules
- Dark mode always: `<html className="dark scroll-smooth">`
- Tailwind ONLY — no inline styles (radial-gradient `style` prop is the single exception)
- `cn()` for conditional class merging
- `next/image` for all images
- shadcn/ui for primitives — never roll custom from scratch
- Custom cursor via `CursorGlow` on `pointer:fine` devices — never break it
- No flat black — use gradients, glass borders, and subtle glows for depth

## Motion
- Framer Motion for landing and onboarding animations only
- `transformStyle: "preserve-3d"` conflicts with Framer Motion `motion.div` — never combine
- Prefer opacity/y transforms, avoid scale-heavy animations on compliance content

## Component Constraints
- Max 500 lines per component — split into co-located files if larger
- `PlatformDashboard` MUST use `dynamic(..., {ssr: false})` — Recharts crashes on SSR
- Error boundary + loading state for every new feature
