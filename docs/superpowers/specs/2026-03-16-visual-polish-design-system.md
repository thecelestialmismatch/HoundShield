# Visual Polish — Design System Spec

**Date:** 2026-03-16
**Goal:** Stripe-level polish across all pages via a unified design system
**Approach:** Design System First (shared primitives in globals.css, then page-by-page application)

## 1. Spacing & Typography Scale

### Section Spacing
- `.section-padding` → `py-24 lg:py-32` (standard sections)
- `.section-padding-sm` → `py-16 lg:py-20` (compact: ticker, CTA)
- `.page-container` → `max-w-7xl mx-auto px-6`

### Typography Hierarchy
- Page hero (h1): `text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight`
- Section title (h2): `text-3xl sm:text-4xl font-bold tracking-tight`
- Card title (h3): `text-xl font-semibold`
- Lead paragraph: `text-lg text-slate-400 leading-relaxed`
- Body: `text-base text-slate-400 leading-relaxed`
- Small/labels: `text-sm text-slate-500`

## 2. Unified Component System

### Cards (3 tiers)
- `.card-base` → `bg-white/[0.03]` `border border-white/[0.06]` `rounded-2xl` `backdrop-blur-sm`
- `.card-elevated` → extends base + `border-white/[0.10]` `shadow-glow-sm` `bg-white/[0.05]`
- `.card-interactive` → extends base + hover: `border-indigo-500/25` `shadow-glow` `translate-y-[-2px]` `bg-white/[0.05]`

### Buttons (3 variants, 2 sizes)
- `.btn-primary` → indigo gradient, glow shadow, shine effect
- `.btn-secondary` → `bg-white/[0.06]` `border border-white/[0.10]` hover: `bg-white/[0.10]` `border-indigo-500/30`
- `.btn-ghost` → transparent, `text-slate-400`, hover: `text-white` `bg-white/[0.04]`
- Default size: `px-6 py-3 text-sm rounded-xl`
- Large size: `px-8 py-4 text-base rounded-xl`

### Inputs
- `.input-field` → `bg-white/[0.03]` `border border-white/[0.08]` `rounded-xl` `px-4 py-3`
- Focus: `border-indigo-500/50` `ring-2 ring-indigo-500/10`

### Border radius rule
- Cards: `rounded-2xl`
- Buttons/inputs: `rounded-xl`

## 3. Section Backgrounds & Color Depth

### Background patterns
- `.section-glow` → `radial-gradient(ellipse 60% 50%, rgba(99,102,241,0.06), transparent)`
- `.section-glow-purple` → `radial-gradient(ellipse 60% 50%, rgba(139,92,246,0.05), transparent)`
- `.section-grid` → existing dot-grid pattern, standardized
- `.section-divider` → `linear-gradient(to right, transparent, rgba(99,102,241,0.15), transparent)`

### Page application
- Landing: alternating indigo/purple glows, dividers between sections
- Auth pages: centered glow behind card
- Info pages: alternating glows per section
- Dashboard: clean (functional, no decorative glows)

## 4. Micro-interactions

### Card hover (all interactive cards)
- `transition-all duration-300 ease-out`
- Border: white/6 → indigo-500/25
- Shadow: none → glow-sm
- Transform: translateY(-2px)
- Background: white/3 → white/5

### Button hover
- Primary: glow intensifies, translateY(-1px), shine sweep
- Secondary: border shifts to indigo, bg brightens
- Ghost: text brightens to white, subtle bg appears

### Scroll animations (Framer Motion)
- Standard entrance: `opacity: 0, y: 20` → `opacity: 1, y: 0`, duration 0.6s
- Staggered children: 0.1s delay between items
- Spring easing: `type: "spring", stiffness: 100, damping: 15`

## 5. Page-by-page Application

### Priority order
1. globals.css — all shared classes
2. Landing page — showcase the system
3. Pricing — card system + section glows
4. Auth (login/signup/forgot-password) — card + input + button consistency
5. Info pages (about, features, docs, contact, terms, privacy, changelog) — section spacing + typography
6. Dashboard — button/card/input consistency (no decorative changes)
