# ui-ux-pro-max — HoundShield Design System Generator

Generates pixel-perfect components that conform to HoundShield's dark design language. Never guesses at styles — always uses the defined token set.

## Token Reference

### Colors
```css
--brand-400: #f5c542;      /* primary gold — CTAs, highlights, active states */
--bg-base: #07070b;         /* homepage background */
--bg-alt: #0d0d14;          /* section alternates */
--bg-card: #111118;         /* card surfaces */
--border: rgba(255,255,255,0.06); /* subtle dividers */
--text-primary: #f1f1f3;    /* headings */
--text-muted: #6b7280;      /* body, secondary */
```

### Typography
```css
font-editorial  /* display headers — H1, hero, section titles */
font-mono       /* metrics, code, numbers, SPRS scores */
font-sans        /* body text, UI labels */
```

### Spacing Scale
- Tight: `gap-2 p-3` (badges, chips)
- Standard: `gap-4 p-4` (cards, form fields)
- Loose: `gap-8 p-8` (sections, page margins)
- Hero: `gap-16 py-24` (landing sections)

## Component Patterns

### Metric Card (dashboard)
```tsx
<div className="bg-[#111118] border border-white/5 rounded-lg p-4">
  <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">{label}</p>
  <p className="text-2xl font-mono text-brand-400 mt-1">{value}</p>
  <p className="text-xs text-gray-600 mt-1">{delta}</p>
</div>
```

### Status Badge
```tsx
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
  text-xs font-mono border border-brand-400/30 bg-brand-400/5 text-brand-400">
  <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
  {label}
</span>
```

### CTA Button (primary)
```tsx
<button className="px-6 py-3 bg-brand-400 text-black font-semibold rounded-lg
  hover:bg-brand-400/90 transition-colors text-sm">
  {label}
</button>
```

### Section Container
```tsx
<section className="bg-[#07070b] py-24 px-6">
  <div className="max-w-5xl mx-auto">
    {/* content */}
  </div>
</section>
```

## Anti-Patterns (Never Use)

- `bg-gradient-to-r from-*` on hero backgrounds
- `bg-clip-text text-transparent` gradient text on headlines
- `Math.random()` or `setInterval` for "live" counter animations
- `backdrop-blur` glassmorphism cards
- `filter: blur(*)` decorative glow elements
- Raw `amber-400`, `yellow-500` instead of `brand-400`
- Inline `style={{}}` except for `radial-gradient` backgrounds

## Trigger: `/ui-ux-pro-max <component>`

Generates a complete, token-correct component for the described UI element.
