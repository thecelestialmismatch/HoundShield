---
paths:
  - "compliance-firewall-agent/components/**/*.tsx"
  - "compliance-firewall-agent/app/**/*.tsx"
  - "compliance-firewall-agent/app/**/*.ts"
---

# Frontend Rules — Hound Shield

## Design System (NEVER violate)
- **Theme default: LIGHT.** `<html className="scroll-smooth">` — no `dark` class on root.
- Homepage bg: `bg-[#FBF8F2]` (cream-50) — never `bg-black`, `bg-slate-900`, raw dark hexes
- Alt section bg: `bg-[#F3E3D0]` (cream-100, palette Cream)
- Surface accent: `bg-[#E5D2BD]` (cream-200) / `bg-[#D2C4B4]` (palette Beige)
- Brand blue: `brand-500` (#81A6C6, palette Blue) — primary CTA, focus, accents
- Brand text on light bg: `text-brand-700` or darker (brand-500 fails WCAG AA on cream)
- CTAs: `bg-brand-500 text-white hover:bg-brand-600`
- NEVER `amber-*`, `yellow-*`, `orange-*`, `indigo-*` — use `brand-*` (which is now blue)
- Semantic colors stay: `success` (emerald), `danger` (red), `warning` (amber DEFAULT token only via theme — not raw `amber-400`)
- Cards: `bg-white/80` + `border border-slate-200` for glass on light
- Typography: `font-editorial` (display headers), `font-mono` (metrics/code)
- Dark mode = optional inverse via theme toggle; `.dark` class on `html` enables it

## Styling
- Tailwind CSS ONLY — no inline styles (exception: radial-gradient as `style` prop only)
- `cn()` for conditional class merging
- Soft pastel surfaces; no flat white — use cream/beige gradients, subtle blue glows for depth

## Components
- Functional components + hooks only
- shadcn/ui for primitives — never build from scratch
- Framer Motion for animations (landing + onboarding only)
- `PlatformDashboard` MUST stay `dynamic(..., {ssr: false})` — Recharts crashes on SSR
- `transformStyle: "preserve-3d"` + Framer Motion `motion.div` = crash — never combine
- Components max 500 lines — split into co-located files if larger
- Every new feature: error boundary + loading state
- `next/image` for all images (including the logo)
- Logo: `<Logo />` component renders `/houndshield-logo.png` via `next/image`
- Custom cursor `CursorGlow` on `pointer:fine` — never break it; tint = `brand-500` rgba
