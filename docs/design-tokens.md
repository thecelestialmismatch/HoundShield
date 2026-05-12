# HoundShield — Design System Tokens
**Version:** 2.0 | May 2026
**Mode:** Dark only. This is non-negotiable for v1.

---

## Why Dark Mode for Defense Sector

Defense contractor IT managers use HoundShield in secure facilities, often on dark-themed terminals and SIEM dashboards. The dark palette communicates authority, security, and technical competence — the exact signals Jordan needs to trust the product with her $2M–$50M contracts. Switching to light mode before $5K MRR is a sprint tax with zero revenue return. When there's budget for a design sprint, add a light mode toggle. Not before.

---

## Color Palette

### Core
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#0a0a0a` | Page backgrounds, home |
| `bg-secondary` | `#111111` | Cards, panels |
| `bg-surface` | `#1a1a1a` | Input fields, sidebars |
| `text-primary` | `#FAF7F2` | Headings, body text |
| `text-secondary` | `#A8A29E` | Subtext, labels |
| `text-muted` | `#57534E` | Placeholder, disabled |

### Brand (Orange/Copper — Authority + Urgency)
| Token | Hex | Usage |
|-------|-----|-------|
| `brand-300` | `#FDBA74` | Hover states, highlights |
| `brand-400` | `#FB923C` | Primary CTAs, links |
| `brand-500` | `#EA580C` | Active states, borders |
| `brand-600` | `#C2410C` | Pressed states |
| `brand-900` | `#431407` | Brand backgrounds |

**Why orange:** It signals urgency and action — appropriate for a compliance deadline product. It differentiates from the teal/blue ocean of SaaS. It reads as "warning system" which is exactly what HoundShield is.

### Semantic
| Token | Hex | Usage |
|-------|-----|-------|
| `status-green` | `#10B981` | Compliant, passed, safe |
| `status-yellow` | `#F59E0B` | Warning, review needed |
| `status-red` | `#EF4444` | Violation, blocked, critical |
| `status-blue` | `#3B82F6` | Info, neutral scan |

### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `border-default` | `rgba(255,255,255,0.08)` | Cards, dividers |
| `border-brand` | `rgba(234,88,12,0.25)` | Hover on interactive elements |
| `border-danger` | `rgba(239,68,68,0.3)` | Error states |

---

## Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display H1 | Outfit | 800 | 48–72px |
| Display H2 | Outfit | 700 | 32–48px |
| Section H3 | Inter | 600 | 24px |
| Body | Inter | 400 | 15–16px |
| Caption | Inter | 400 | 12–13px |
| Mono/Code | system-ui mono | 400 | 13–14px |
| Metric | Outfit | 700–800 | varies |

**Loading:** Google Fonts via CSS import (not next/font — avoids build-time network failures).

---

## Spacing System
Base: 4px grid
`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 / 96px`

---

## Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 6px | Badges, tags |
| `rounded-md` | 10px | Buttons, inputs |
| `rounded-lg` | 16px | Cards, modals |
| `rounded-xl` | 24px | Hero sections |
| `rounded-full` | 9999px | Avatars, pills |

---

## Interactive States
All interactive elements must have:
1. Default state
2. Hover state (border: `rgba(234,88,12,0.25)`, glow: `0 0 0 1px rgba(234,88,12,0.15)`)
3. Focus state (outline: `2px solid #EA580C`, offset: 2px)
4. Disabled state (opacity: 0.5, cursor: not-allowed)

---

## Component Rules
- Cards: `bg-[#111111] border border-white/8 rounded-lg`
- Buttons (primary): `bg-brand-500 hover:bg-brand-600 text-white rounded-md px-4 py-2.5 font-semibold`
- Buttons (ghost): `border border-white/10 hover:border-brand-500/40 text-white rounded-md`
- Inputs: `bg-[#1a1a1a] border border-white/10 focus:border-brand-500/50 rounded-md`
- Max component file size: 500 lines. Split if larger.
- No inline styles except radial-gradient (CSS limitation)
- Tailwind only. No CSS modules, no styled-components.

---

## Status Indicator System (Jordan's primary UI language)

```
● COMPLIANT   — green dot + text-emerald-400
● REVIEW      — yellow dot + text-amber-400
● VIOLATION   — red dot + text-red-400
● SCANNING    — animated orange dot + text-brand-400
```

These are the most important UI elements. Jordan reads these at a glance. Never bury them.
