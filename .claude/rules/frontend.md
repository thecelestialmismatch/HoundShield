---
paths:
  - "compliance-firewall-agent/components/**/*.tsx"
  - "compliance-firewall-agent/app/**/*.tsx"
  - "compliance-firewall-agent/app/**/*.ts"
---

# Frontend Rules — Kaelus.Online

## Design System (NEVER violate)
- Background: `bg-surface` (#F8FAFC) — never raw `bg-white`
- Brand: `brand-400/500/600` — NEVER `blue-*` or `indigo-*` directly
- Accent: `emerald-*` for success/positive states
- Typography: `font-display` (Outfit) headings, `font-sans` (Inter) body
- Logo: `<Logo />` / `<TextLogo />` — NEVER inline SVG icons
- Glass cards: `.glass-card` or `.glass-card-glow` CSS classes

## Styling
- Tailwind CSS ONLY — no inline styles (exception: radial-gradient as `style` prop only)
- `cn()` for conditional classes
- Dark mode on by default: `<html className="dark scroll-smooth">`

## Components
- Functional components + hooks only
- shadcn/ui for primitives — never build from scratch
- Framer Motion for animations (landing + onboarding only)
- `PlatformDashboard` MUST stay `dynamic(..., {ssr: false})` — Recharts crashes on SSR
- `transformStyle: "preserve-3d"` conflicts with Framer Motion on `motion.div` — never combine
- Components max 500 lines — split if larger
- Every new feature: error boundary + loading state
- `next/image` for all images
