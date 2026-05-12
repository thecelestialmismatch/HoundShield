---
paths:
  - "compliance-firewall-agent/components/**/*.tsx"
  - "compliance-firewall-agent/app/**/*.tsx"
  - "compliance-firewall-agent/app/**/*.ts"
---

# Frontend Rules — Hound Shield

## Design System (NEVER violate)
- Homepage bg: `bg-[#07070b]` — never `bg-white`, `bg-surface`, `bg-slate-*`
- Alt section bg: `bg-[#0d0d14]`
- Brand gold: `brand-400` CSS variable — NEVER `amber-*`, `yellow-*`, `indigo-*`, `blue-*`
- Cards: `bg-white/[0.03]` + `border border-white/[0.08]` for glass surfaces
- Typography: `font-editorial` (display headers), `font-mono` (metrics/code)
- Dark mode always: `<html className="dark scroll-smooth">`

## Styling
- Tailwind CSS ONLY — no inline styles (exception: radial-gradient as `style` prop only)
- `cn()` for conditional class merging
- No flat black — use gradients, glass borders, glows for depth

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
