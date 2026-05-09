# Hound Shield — Design System

> Drop this file in any AI agent context to instantly convey the Hound Shield visual identity.
> Based on the awesome-design-md pattern: plain-text design docs for AI coding agents.

---

## Visual Identity

**Product personality:** Precision defense. Dark and uncompromising. The compliance firewall that never blinks.
**Tone:** Technical authority with warmth. Data-dense but readable. "This is protecting you right now."

---

## Color System

```
Background (primary):   #07070b  — near-black, slightly blue-tinted
Background (secondary): #0d0d14  — alternate section bg
Background (card):      bg-gray-800/50 with border border-gray-700/50

Brand:     CSS var --brand-400  (indigo family, ~#818cf8) — NEVER use raw amber-* or yellow-*
Primary:   indigo-500 (#6366f1), indigo-400 (#818cf8)
Accent:    emerald-400 (#34d399) — online indicators, success states, data positive
Danger:    red-400 / red-500 — violations, CRITICAL risk level
Warning:   amber-400 — HIGH risk level (only for risk indicators, not brand)
Muted:     white/40, white/60 — secondary text
```

**Never:**
- Raw `amber-*` or `yellow-*` for brand gold — always `brand-400`
- Light backgrounds — dark mode is always on
- Inline background colors (use Tailwind classes)

---

## Typography

```
Display headers:  font-editorial  (custom serif, large headlines, hero text)
Code / metrics:   font-mono       (numbers, code blocks, SPRS scores, latency)
Body text:        default sans    (Inter-family, all paragraph text)
```

**Scale usage:**
- Hero H1: `text-5xl font-editorial` or larger
- Section H2: `text-3xl font-bold`
- Card headers: `text-lg font-semibold`
- Metrics/badges: `font-mono text-sm`
- Muted labels: `text-xs text-white/40 uppercase tracking-wider`

---

## Layout

```
App root html:   <html className="dark scroll-smooth">
Page bg:         bg-[#07070b] min-h-screen
Section alt bg:  bg-[#0d0d14]
Max width:       max-w-7xl mx-auto
Section padding: py-20 px-4 (or px-6 on larger)
```

---

## Component Tokens

### Cards
```
bg-gray-800/50 border border-gray-700/50 rounded-lg p-4
Glow variant: hover:border-indigo-500/40 transition-colors
Glass variant: bg-white/[0.04] border border-white/[0.06] rounded-2xl
```

### Buttons
```
Primary:   bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors
Secondary: border border-indigo-500 text-indigo-400 hover:bg-indigo-500/10 px-4 py-2 rounded-lg
Ghost:     text-white/60 hover:text-white transition-colors
Danger:    bg-red-500/10 border border-red-500/30 text-red-400
Disabled:  opacity-40 pointer-events-none
```

### Inputs
```
px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white
placeholder:text-white/30
focus:border-indigo-500/40 focus:outline-none transition-colors
```

### Badges / Pills
```
Risk CRITICAL:  bg-red-500/10 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5 text-xs font-mono
Risk HIGH:      bg-amber-500/10 text-amber-400 border border-amber-500/30
Risk MEDIUM:    bg-yellow-500/10 text-yellow-400 border border-yellow-500/30
Risk LOW:       bg-emerald-500/10 text-emerald-400 border border-emerald-500/30
Status online:  bg-emerald-400 animate-pulse (dot) + text-emerald-400
```

### Navigation
```
Navbar bg:  bg-[#07070b]/90 backdrop-blur-xl border-b border-white/[0.04]
Link hover: text-white (from text-white/60)
Active:     text-indigo-400
CTA pill:   bg-indigo-500 hover:bg-indigo-400 rounded-full px-4 py-1.5 text-sm font-semibold
```

---

## Animation

```
Default transition:  transition-colors duration-200
Hover scale:         hover:scale-105 active:scale-95
Fade in:             animate-fade-in (custom, opacity 0→1, translateY 8px→0, 0.4s ease)
Chat window:         animate-chat-in (opacity + translateY + scale, 0.25s ease)
Pulse (online dot):  animate-pulse
Bounce (typing):     animate-bounce with staggered animationDelay
```

**Framer Motion usage:**
- `motion.div` for section entrances (whileInView, viewport once)
- `AnimatePresence` for conditional mounts
- Do NOT use `transformStyle: "preserve-3d"` on motion.div — conflicts with Framer

---

## Icons

**Always use Lucide React.** Never import from other icon libraries mid-component.
```
import { Shield, Lock, Zap, ChevronRight, X, Send, ... } from "lucide-react"
```

**Logo component:** Always `<Logo className="w-5 h-5" />` — never inline the SVG.

---

## SSR / Dynamic Import Rules

```typescript
// These must be ssr: false — they use browser APIs
const PlatformDashboard = dynamic(() => import("@/components/landing/PlatformDashboard"), { ssr: false });
// Any component using Recharts, window, document, matchMedia
```

---

## Component Size Rules

- **Max 500 lines per component** — split into sub-components if larger
- **Naming:** PascalCase for components, camelCase for hooks/utils
- **Co-location:** Landing section components in `components/landing/`
- **Global UI:** `components/` root level

---

## Brand Voice (for AI-generated copy)

- **Active voice:** "Hound Shield detects" not "Detection is performed"
- **Numbers first:** "<10ms" not "under ten milliseconds"
- **Defense angle:** November 2026 enforcement, C3PAO $30K-$150K, 80K+ contractors
- **No em-dashes** in code, comments, or docs — use periods or commas
- **Superlatives sparingly** — let the numbers speak ("110 controls" not "comprehensive controls")
- **One proxy URL change** — repeat this message. It is the core value proposition.

---

## Spacing Quick Reference

```
Section gap:   gap-6 to gap-8
Card padding:  p-4 (sm), p-6 (md), p-8 (lg)
Icon sizes:    w-4 h-4 (sm), w-5 h-5 (md), w-6 h-6 (lg)
Border radius: rounded-lg (cards), rounded-xl (modals), rounded-2xl (chat), rounded-full (pills/avatars)
```

---

*This file is read by AI coding agents at session start to maintain visual consistency.*
*Last updated: 2026-04-11*
