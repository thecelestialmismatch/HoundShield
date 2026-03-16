# Landing Page Rebuild — Design Spec

**Date:** 2026-03-16
**Project:** Kaelus.ai
**Scope:** Full landing page rebuild — dark mode, 13 sections, ported from reference HTML

---

## 1. Overview

Rebuild the landing page (`app/page.tsx`) from its current light-mode 6-section layout to a dark-mode 13-section conversion-optimized page. The design ports directly from the approved reference file `kaelus-landing-3d.html`, adapted into React/Next.js components with Tailwind CSS.

### Decisions Made
- **Dark mode** as default landing theme (matches cybersecurity positioning)
- **Theme toggle preserved** — users can switch to light mode via existing ThemeToggle in Navbar
- **Hero copy:** "Your AI is leaking. We stop that." (aggressive, pain-point-first)
- **CSS particles** instead of WebGL for hero background (90% visual impact, 0 bundle cost)
- **Approach A:** Direct port from reference HTML into React components + Tailwind
- **No new dependencies** — Framer Motion (existing) handles all animations

---

## 2. Section Lineup (13 sections, conversion-optimized order)

| # | Section | Purpose | Conversion Role |
|---|---------|---------|-----------------|
| 1 | Hero + CSS Particles | Hook + value prop + CTAs | First impression, primary CTA |
| 2 | Live Scan Ticker | Social proof via activity | Trust signal |
| 3 | Trusted By Marquee | Authority/credibility | Trust signal |
| 4 | 3-Step Setup | "It's easy" messaging | Objection removal |
| 5 | Detection Grid (16 cats) | Specificity of coverage | Capability proof |
| 6 | Pipeline Simulator | Interactive demo | Engagement peak |
| 7 | Features Grid (6 cards) | Capability overview | Feature validation |
| 8 | Command Center Mockup | "Here's what you get" | Product preview |
| 9 | ShieldReady + SPRS Gauge | Unique differentiator | Differentiation |
| 10 | Pricing (4-tier) | Remove friction | Conversion enabler |
| 11 | FAQ Accordion | Objection handling | Objection removal |
| 12 | Final CTA | Close the deal | Conversion close |
| 13 | Chat Widget (floating) | Always-available help | Engagement safety net |

---

## 3. File Architecture

```
app/page.tsx                              (~120 lines)  — imports + section assembly + dark-landing wrapper
components/landing/
  HeroSection.tsx                         (~150 lines)  — CSS particles, headline, CTAs, stats bar
  ScanTicker.tsx                          (~80 lines)   — infinite CSS scroll, threat items
  TrustedBy.tsx                           (~60 lines)   — CSS marquee, faded edges, placeholder logos
  SetupSteps.tsx                          (~120 lines)  — 3 cards with code snippets
  DetectionGrid.tsx                       (~100 lines)  — 4x4 grid of detection categories
  PipelineSimulator.tsx                   (~200 lines)  — animated 5-stage scan with log output
  FeaturesGrid.tsx                        (~100 lines)  — 6 bento cards with icons
  CommandCenterPreview.tsx                (~150 lines)  — perspective-tilted dashboard mockup
  ShieldReadyScore.tsx                    (~120 lines)  — SVG gauge + 4 stats
  PricingSection.tsx                      (~150 lines)  — 4 plan cards, reuses handleCheckout logic
  FAQSection.tsx                          (~100 lines)  — accordion with expand/collapse
  CTASection.tsx                          (~60 lines)   — gradient glow, headline, two buttons
  ChatWidget.tsx                          (~150 lines)  — floating bubble + chat panel
app/globals.css                           (additions)   — dark-landing CSS variables, particle keyframes
```

**Total:** ~1,660 lines across 14 files. Average ~120 lines per component. All under 200-line limit.

---

## 4. Theming Strategy

### Dark Mode Scoping

The landing page wraps all content in a `dark-landing` class. This scopes dark styles to the landing page only — other pages (login, signup, dashboard) are unaffected.

```tsx
// app/page.tsx
export default function LandingPage() {
  return (
    <main className="dark-landing">
      <Navbar />
      <HeroSection />
      <ScanTicker />
      {/* ... */}
    </main>
  );
}
```

### CSS Variables (added to globals.css)

```css
.dark-landing {
  --landing-bg: #07070b;
  --landing-bg2: #0d0d14;
  --landing-bg3: #0a0a10;
  --landing-surface: #10101a;
  --landing-brand: #6366f1;
  --landing-brand2: #818cf8;
  --landing-brand3: #a5b4fc;
  --landing-emerald: #10b981;
  --landing-red: #ef4444;
  --landing-amber: #f59e0b;
  --landing-text: #f1f5f9;
  --landing-muted: #64748b;
  --landing-border: rgba(99,102,241,0.15);
  --landing-border2: rgba(255,255,255,0.06);
  background: var(--landing-bg);
  color: var(--landing-text);
}

.light-landing {
  --landing-bg: #ffffff;
  --landing-bg2: #f8fafc;
  --landing-surface: #f1f5f9;
  --landing-text: #0f172a;
  --landing-muted: #64748b;
  --landing-border: rgba(99,102,241,0.12);
  --landing-border2: rgba(0,0,0,0.06);
  background: var(--landing-bg);
  color: var(--landing-text);
}
```

### Theme Toggle Integration

The existing ThemeToggle component toggles a `theme` value in context. The landing page reads this value and applies either `dark-landing` or `light-landing` class accordingly. No changes needed to ThemeToggle itself.

---

## 5. Section Specs

### 5.1 HeroSection

**Visual:** Full-viewport section with CSS particle background (floating gradient orbs + dot grid). Dark bg (#07070b).

**Content:**
- Badge: "CMMC Level 2 · NIST 800-171 · 87,000+ DIB Contractors" with green pulse dot
- H1: "Your AI is leaking." / "We stop that." (gradient text on second line)
- Subheadline: "Real-time compliance firewall for defense contractors..."
- CTAs: "Get your free SPRS score →" (primary) + "See how it works" (ghost)
- Stats bar: 87,000+ | 110 | <50ms | 10 min

**Animations:**
- FadeIn on scroll (existing pattern)
- CSS particles: `@keyframes float` on pseudo-elements with varying sizes/speeds
- Stats counter animation on viewport entry

**CSS Particles Implementation:**
```css
.hero-particles::before,
.hero-particles::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.15;
  animation: float 20s ease-in-out infinite;
}
.hero-particles::before {
  width: 400px; height: 400px;
  background: radial-gradient(circle, #6366f1, transparent);
  top: 10%; left: 15%;
}
.hero-particles::after {
  width: 300px; height: 300px;
  background: radial-gradient(circle, #10b981, transparent);
  bottom: 20%; right: 10%;
  animation-delay: -10s;
}
```

Additional floating dots via multiple box-shadows on a single element, animated with `@keyframes drift`.

### 5.2 ScanTicker

**Visual:** Narrow horizontal bar, slightly lighter bg (#0a0a10). Auto-scrolling threat items.

**Content:** ~12 ticker items with colored dots:
- Green (●) = passed/allowed
- Red (●) = blocked
- Amber (●) = flagged

**Animation:** `@keyframes ticker { 0%{translateX(0)} 100%{translateX(-50%)} }` on a duplicated item list (seamless loop). Duration: 30s linear infinite.

### 5.3 TrustedBy

**Visual:** Dark bg with faded edges. Auto-scrolling logo/name strip.

**Content:** Placeholder defense/compliance industry names: Northrop Grumman, L3Harris, Boeing Defense, Raytheon, BAE Systems, General Dynamics, Leidos, SAIC. Each with an icon placeholder and name.

**Animation:** CSS marquee via `@keyframes marquee`. Duplicated track for seamless loop. Left/right gradient fade overlays.

### 5.4 SetupSteps

**Visual:** 3-column grid of cards with glass effect. Large faded step numbers (01, 02, 03) as background decoration.

**Cards:**
1. "Install in 1 Line" — code snippet: `baseURL: "https://gateway.kaelus.ai/v1"`
2. "We Intercept Everything" — code snippet: `Scanned: 16 patterns | Latency: <50ms`
3. "Threats Neutralised" — code snippet: `BLOCKED → Quarantined → Audit Logged`

**Animation:** FadeIn + hover translateY(-4px) with border color transition.

### 5.5 DetectionGrid

**Visual:** 4-column grid (responsive: 2-col tablet, 1-col mobile). 16 small cards.

**Categories:** API Keys, SSN/Gov IDs, Credit Cards, Medical Data, Financial Data, Source Code, Passwords, Email Addresses, Phone Numbers, Physical Addresses, AWS/Cloud Keys, Database Queries, Internal URLs, Classified Markers, Export-Controlled Data, Biometric Data.

Each card: emoji icon + title + example pattern in monospace.

**Animation:** FadeIn staggered. Hover: translateY(-3px) + brand border glow + gradient overlay.

### 5.6 PipelineSimulator

**Visual:** Dark card with terminal-style log output. 5 pipeline stages shown as icons connected by a progress track.

**Stages:** Intake → Classify → Scan → Enforce → Audit

**Behavior:**
- Auto-plays on viewport entry
- Progress bar advances through stages (~2s per stage)
- Log entries appear one by one with `fadeSlide` animation
- Active stage icon glows (brand color), completed stages turn green
- Loops every ~12s with a new simulated request
- Pause/restart buttons (cosmetic)

**Log entries per cycle:**
```
[INTAKE]   Request #4827 from 10.0.1.42
[CLASSIFY] Content type: text/prompt, Model: gpt-4
[SCAN]     ⚠ SSN DETECTED — 3 instances found
[SCAN]     Pattern: \d{3}-\d{2}-\d{4} matched
[ENFORCE]  Action: BLOCKED — Policy: zero-tolerance-pii
[AUDIT]    Event logged — Hash: a3f8c2...e91b
```

### 5.7 FeaturesGrid

**Visual:** 3-column grid of 6 feature cards. Glass-morphism style with colored icon backgrounds.

**Cards:**
1. AI Compliance Firewall (brand gradient icon)
2. SPRS Score Calculator (violet gradient icon)
3. Risk Classification (rose gradient icon)
4. Agent Orchestrator (emerald gradient icon)
5. Quarantine System (amber gradient icon)
6. Audit Trail (cyan gradient icon)

Each: icon + title + 1-line description. Hover: translateY(-4px) + brand border.

### 5.8 CommandCenterPreview

**Visual:** Perspective-tilted dashboard mockup (CSS `transform: perspective(1200px) rotateY(-8deg) rotateX(4deg)`). Hover reduces tilt slightly.

**Content:**
- Mock browser bar with traffic light dots
- Sidebar with 7 nav items (Dashboard, Scanner, Shield, Monitor, Agents, Knowledge, Team)
- KPI row: Threats Blocked (2,847), SPRS Score (87/110), Active Agents (12), Compliance (94.2%)
- Event feed with BLOCKED/ALLOWED/FLAGGED badges
- Chart placeholder area

### 5.9 ShieldReadyScore

**Visual:** Two-part layout — SVG arc gauge on left, 4 stat cards on right.

**Gauge:** SVG semicircle arc showing score 72/110. Animated stroke-dashoffset on viewport entry. Color: amber (moderate score).

**Stats:**
- Controls Assessed: 110 (emerald)
- Gaps Found: 38 (red)
- Auto-Remediated: 24 (brand)
- Time to Audit-Ready: 14 days (amber)

### 5.10 PricingSection

**Visual:** 4-column grid of pricing cards. "Enterprise" card highlighted with "MOST POPULAR" badge.

**Plans:**
1. **Free** — $0/mo — "For evaluation" — 5 features — "Start Free" (outline button)
2. **Pro** — $69/mo — "For small teams" — 8 features — "Get Started" (outline button)
3. **Enterprise** — $249/mo — "For growing orgs" — 12 features — "Get Started" (brand button) — FEATURED
4. **Agency** — $599/mo — "For consultants" — 15 features — "Contact Sales" (outline button)

**CTA wiring:** Free → `/signup`, Pro/Enterprise → existing `handleCheckout` with Stripe price IDs, Agency → `/contact`.

### 5.11 FAQSection

**Visual:** Single-column accordion. Click to expand/collapse with smooth max-height transition.

**Questions (8):**
1. What is CMMC Level 2 and do I need it?
2. How does the AI compliance firewall work?
3. What's included in the free tier?
4. How long does setup take?
5. Is my data encrypted?
6. Can I self-host Kaelus?
7. What AI providers do you support?
8. How is the SPRS score calculated?

### 5.12 CTASection

**Visual:** Centered text with radial gradient glow behind. Dark bg with brand-colored glow.

**Content:**
- H2: "Stop Leaking. Start Protecting."
- Subline: "Join 87,000+ defense contractors who need CMMC compliance."
- CTAs: "Get your free SPRS score →" (primary) + "Talk to sales" (ghost)

### 5.13 ChatWidget

**Visual:** Fixed position bottom-right. Floating circle button with chat icon + pulsing glow. Click opens chat panel.

**Panel content:**
- Header: "Kaelus Assistant" with green "Online" status
- Pre-loaded bot message: "Hey! I can help with CMMC compliance questions..."
- Quick reply buttons: "What's my SPRS score?", "How does setup work?", "Pricing info", "Talk to human"
- Input field + send button
- Typing indicator animation

**Behavior:** Cosmetic only for V1. Quick replies show pre-written responses. No backend integration. Can be wired to `/api/chat` in a future phase.

---

## 6. Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| Desktop (>1024px) | Full layout — 4-col detection, 3-col features, 4-col pricing |
| Tablet (768-1024px) | 2-col detection, 2-col features, 2-col pricing, hide sidebar in mockup |
| Mobile (<768px) | 1-col everything, nav links hidden (hamburger menu), chat widget shrinks |

---

## 7. Animation Budget

All animations via Framer Motion (existing) + CSS keyframes:

| Animation | Technique | Performance |
|---|---|---|
| FadeIn on scroll | Framer `useInView` | GPU-composited (opacity + transform) |
| CSS particles | `@keyframes float` on pseudo-elements | GPU-composited (transform) |
| Scan ticker | `@keyframes ticker` translateX | GPU-composited |
| Trusted marquee | `@keyframes marquee` translateX | GPU-composited |
| Pipeline stages | Framer `animate` with intervals | JS-driven, lightweight |
| FAQ accordion | CSS `max-height` transition | Layout trigger — kept minimal |
| Chat widget open | CSS `animation: chatIn` | GPU-composited |

**No new dependencies.** No WebGL. No three.js. Pure CSS + Framer Motion.

---

## 8. Navbar Changes

The Navbar component stays as-is with two additions:
1. **Dark mode variant:** When inside `.dark-landing`, Navbar bg becomes `rgba(7,7,11,0.75)` with `backdrop-blur(20px)` and light text
2. **Nav links updated:** Features | Pricing | About | Contact | Sign in | "Start Free →" (CTA button)
3. **ThemeToggle** remains in its current position

---

## 9. What Gets Deleted

The current `page.tsx` (773 lines) is **replaced entirely**. Components only used by the old landing page are removed:
- `FloatingShape` component (replaced by CSS particles)
- `BentoCard` component (replaced by new FeaturesGrid cards)
- `StatCounter` component (inlined into HeroSection)
- `PricingCard` component (replaced by PricingSection)

---

## 10. Testing Checklist

- [ ] All 13 sections render correctly in dark mode
- [ ] Theme toggle switches to light mode and back
- [ ] All animations perform at 60fps (no jank)
- [ ] Responsive at 320px, 768px, 1024px, 1440px
- [ ] Pricing CTAs link correctly (free→signup, pro/enterprise→Stripe, agency→contact)
- [ ] Chat widget opens/closes correctly
- [ ] Pipeline simulator auto-plays and loops
- [ ] FAQ accordion expands/collapses smoothly
- [ ] Navbar transparent on dark bg, readable on scroll
- [ ] `npm run build` passes with zero errors
- [ ] No `blue-` CSS class references (brand-* only)
- [ ] All Lucide icons used (no emoji in production — emoji in spec is for illustration only)
