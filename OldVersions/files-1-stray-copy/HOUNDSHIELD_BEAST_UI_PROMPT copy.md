# ████████████████████████████████████████████████████████████████████
# HOUNDSHIELD — BEAST UI/UX OVERHAUL PROMPT
# Operation HOUND | HERMES GODMODE | MOSSAD-Level Design Directive
# ATLAS + FORGE Agents | Full Frontend Execution | v1.0 | 2026-05-19
# ████████████████████████████████████████████████████████████████████

> **HOW TO USE:** Paste this as your task message AFTER pasting the HERMES GODMODE Master Prompt.
> HERMES activates ATLAS (UI/UX) + FORGE (Frontend Build) in joint session.
> The output is 3 complete, production-ready design options + a deployed PR.
> Marginal cost of completeness is near zero. Do the whole thing.

---

## 🎯 MISSION DIRECTIVE — ATLAS + FORGE JOINT SESSION

**TASK:** Complete UI/UX overhaul of https://www.houndshield.com

**STANDARD:** Not "looks good." Not "clean." The standard is:
*"This looks like a $10M Series A company. Our C3PAO auditors will take us seriously. Jordan's CISO will approve the purchase on sight."*

**DELIVERABLE:** 3 complete design options implemented as working Next.js pages, each with:
- Full landing page (Hero → Stats → Features → Pricing → CTA → Footer)
- Responsive (mobile-first, 375px → 1440px)
- Logo integrated everywhere (nav, footer, favicon, OG image)
- Color system from provided palette applied consistently
- Interactive prototype state (hover, active, transitions)
- All existing copy preserved — no placeholder text, ever
- Lighthouse score ≥ 90 performance, ≥ 95 accessibility
- A/B test ready (each option in its own route: `/v1`, `/v2`, `/v3`)

**THEN:** Present all 3 for founder selection. Selected option replaces `/` in main. PR created. Deployed to Vercel preview URL.

---

## 🎨 BRAND ASSETS — NON-NEGOTIABLE

### Logo
- File: `/public/houndshield-logo.png` — Doberman head in shield silhouette, black on white
- Usage rules:
  - Dark backgrounds: render logo white (`filter: brightness(0) invert(1)`)
  - Light backgrounds: render logo full black (default)
  - Never stretch, never recolor to anything other than white/black/brand-steel
  - Minimum size: 28px height in nav, 48px in footer hero lockup
  - Always pair with wordmark "HoundShield" in the designated brand font
  - Logo must appear in: nav, footer, OG meta image, favicon (SVG version)

### Color Palette — LOCKED
```css
:root {
  /* PRIMARY BRAND PALETTE */
  --hs-steel:   #81A6C6;  /* Primary brand — buttons, links, accents */
  --hs-sky:     #AACDDC;  /* Secondary — hover states, highlights */
  --hs-cream:   #F3E3D0;  /* Light background variant — sections, cards */
  --hs-sand:    #D2C4B4;  /* Muted — borders, dividers, secondary text */

  /* EXTENDED SYSTEM (derived — do not override) */
  --hs-navy:    #0D1B2A;  /* Darkest — dark mode bg, hero bg */
  --hs-midnight:#152030;  /* Dark surface — cards in dark mode */
  --hs-slate:   #1E3448;  /* Elevated surface in dark mode */
  --hs-white:   #FAFCFF;  /* Near-white — light mode page bg */
  --hs-ink:     #0F1E2E;  /* Body text on light bg */
  --hs-mist:    rgba(129,166,198,0.08); /* Subtle tinted surface */
  --hs-glow:    rgba(129,166,198,0.15); /* Hover overlay */
  --hs-border:  rgba(129,166,198,0.20); /* Default border */
  --hs-border-strong: rgba(129,166,198,0.40); /* Emphasis border */

  /* SEMANTIC */
  --hs-success: #34D399;  /* Intercepted/blocked — emerald */
  --hs-danger:  #F87171;  /* Violations — red */
  --hs-warn:    #FBBF24;  /* Warnings — amber */
}
```

**Color usage law:**
- Primary CTA buttons: `--hs-steel` background, white text
- Secondary CTA: transparent background, `--hs-steel` border + text
- Hero backgrounds: `--hs-navy` to `--hs-midnight` gradient (dark options) OR `--hs-white` to `--hs-cream` (light options)
- Feature cards: `--hs-mist` fill, `--hs-border` border
- Pricing featured tier: `--hs-steel` border (2px), `--hs-glow` fill
- Section dividers: `--hs-border`
- Never use raw Tailwind color classes (amber-*, yellow-*, indigo-*) — always CSS variables

---

## 🖋️ TYPOGRAPHY SYSTEM

```css
/* Display font — for H1, H2, major section titles */
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');
/* Body + UI font — for everything else */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

:root {
  --font-display: 'DM Serif Display', Georgia, serif;
  --font-body:    'DM Sans', system-ui, sans-serif;
}

/* Scale */
--text-xs:    11px / 1.4  (eyebrows, badges, legal)
--text-sm:    13px / 1.6  (body secondary, captions)
--text-base:  15px / 1.7  (body primary)
--text-lg:    18px / 1.5  (section intros)
--text-xl:    24px / 1.3  (card titles, sub-headings)
--text-2xl:   32px / 1.2  (section titles)
--text-3xl:   42px / 1.1  (hero sub-title)
--text-4xl:   56px / 1.05 (hero H1 desktop)
--text-hero:  72px / 1.0  (maximum impact, mobile: 40px)
```

**Typography law:**
- H1: `font-family: var(--font-display)` — always, no exceptions
- H2, H3: `font-family: var(--font-display)` — section titles
- All UI elements (nav, buttons, badges, tables): `font-family: var(--font-body)`
- Body copy: `font-family: var(--font-body)`, weight 300–400
- No font mixing beyond this two-font system

---

## 📐 LAYOUT SYSTEM

```
Max content width:  1200px
Nav height:         64px (desktop), 56px (mobile)
Section padding:    96px top/bottom (desktop), 64px (tablet), 48px (mobile)
Card padding:       24px (desktop), 16px (mobile)
Grid gap:           24px (desktop), 16px (mobile)
Border radius:      12px (cards), 8px (buttons/inputs), 6px (badges)
```

**Spacing law:** No magic numbers. Every spacing value is a multiple of 4px (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128).

---

## 🏗️ PAGE STRUCTURE — ALL 3 OPTIONS MUST INCLUDE

### 1. Navigation Bar
- Logo (SVG inline or img, 32px height) + wordmark
- Nav links: Product | How It Works | Pricing | Resources | Blog
- Right: "Sign In" (ghost) + "Start Free Trial" (primary button)
- Sticky on scroll with backdrop-blur + border-bottom appears
- Mobile: hamburger → slide-down drawer
- Active state on current route

### 2. Hero Section
- Pre-title eyebrow badge: compliance framework list (CMMC L2 · DFARS 7012 · HIPAA · SOC 2)
- H1: Use this exact copy → **"Stop your team from leaking CUI to ChatGPT"**
- Sub: **"Local-only AI compliance firewall. Intercepts every prompt before it leaves your network. 16 detection engines. <10ms latency. One proxy URL to deploy."**
- Primary CTA: "Start Free Trial — No Card Required"
- Secondary CTA: "Watch 2-Min Demo" (opens modal or scroll-to video)
- Trust signals row: ✓ Nothing leaves your network · ✓ <10ms latency · ✓ 49/49 tests passing · ✓ One URL to deploy
- Hero visual: Animated threat interception dashboard widget (see spec below)

### 3. Social Proof / Stats Bar
- 16 Detection Engines
- ~80,000 DoD Contractors At Risk
- November 2026 CMMC Enforcement Deadline
- <10ms Scan Latency
- Animated counter on scroll into view

### 4. Asymmetric Advantage Section (THE DIFFERENTIATOR — must be prominent)
Copy (verbatim — do not paraphrase):
> *"Every cloud-based AI DLP tool sends your CUI to their servers to scan it. That's itself a potential CUI spill under DFARS 7012. HoundShield scans everything locally. Nothing leaves your network."*
- Visual: Side-by-side comparison (HoundShield local vs competitor cloud) — animated data flow diagram
- Make this the most visually impactful section on the page

### 5. Features Grid
- 100% Local Scanning — no data reaches our servers
- C3PAO-Ready PDF Reports — one-click audit document citing NIST SP 800-171 controls
- Zero-Friction Deployment — change one proxy URL, done in minutes
- OODA Behavioral Engine — detects policy drift before it becomes a spill
- 16 CUI Detection Patterns — contracts, drawings, export codes, PII, ITAR
- Brain AI Compliance Advisor — ask any CMMC question, get cited answers

### 6. How It Works (3 steps)
1. Change one URL in your AI tool config to route through HoundShield proxy
2. Every prompt scanned locally — 16 engines, <10ms — blocked or passed
3. Violations logged, reports generated, auditor PDF ready on demand

### 7. Target Customer Section ("Built for Jordan")
- IT Security Manager at DoD contractor
- Fear: failing CMMC assessment due to ChatGPT CUI incident
- Goal: the PDF she hands her C3PAO auditor
- Testimonial format (placeholder with real job title/company size)

### 8. Pricing Section
**CANONICAL PRICING — DO NOT CHANGE:**
| Plan    | Price    | Target              |
|---------|----------|---------------------|
| Free    | $0/mo    | Eval, <500 req/day  |
| Pro     | $199/mo  | IT Manager (Jordan) |
| Growth  | $499/mo  | Multi-team, SIEM    |
| Enterprise | $999/mo | Custom + SLA     |
| Agency  | $2,499/mo | C3PAO / MSP      |

- Pro = featured (most popular badge)
- Annual toggle = 20% off
- FAQ accordion below pricing

### 9. CTA Banner
- Final conversion section before footer
- Copy: "CMMC Phase 2 enforcement hits November 2026. C3PAOs are booked 18 months out. The window to get compliant is now."
- Button: "Start Free Trial Today"

### 10. Footer
- Logo lockup (larger, with tagline: "Local AI compliance for DoD contractors")
- Column links: Product | Company | Resources | Legal
- Bottom bar: © 2026 HoundShield · Privacy · Security · Terms
- SOC 2 / CMMC badge row

---

## 🎭 THE 3 DESIGN OPTIONS

### OPTION 1 — "SOVEREIGN"
**Concept:** Dark intelligence. A war room built for the people who protect classified information. Feels like the software used by defense contractors, not a SaaS startup.

**Aesthetic direction:** Deep navy + steel blue. Sparse, authoritative. Every element earns its place. The brand color as a cold precision instrument, not decoration.

**Execution specifics:**
- Background: `#0D1B2A` with very subtle radial gradient breathing outward from center
- Hero: Full-bleed dark, H1 in DM Serif Display white, key phrase "leaking CUI" in `--hs-sky`
- Cards: `rgba(255,255,255,0.03)` fill, `--hs-border` border — barely visible until hover
- Hover: Cards lift `translateY(-2px)`, border brightens to `--hs-border-strong`
- Stats bar: pure dark, numbers in white, labels in `--hs-steel`
- Pricing featured card: `--hs-steel` border 2px, subtle `--hs-glow` fill
- CTA buttons: `--hs-steel` fill, white text, `border-radius: 6px` (sharp, not rounded)
- Motion: Page load — logo fades in first, then hero text lines stagger up 40ms apart
- Micro-interaction: Nav border-bottom slides in on scroll past 80px
- The "asymmetric advantage" section: pure white text on dark split, with animated SVG showing data flowing locally vs to a cloud
- Fonts: DM Serif Display for all headings, DM Sans 300 for body

**What makes it unforgettable:** It feels like the product is classified. Like you're looking at SOCOM's internal tooling. Zero decoration. Total function. The Doberman logo on `#0D1B2A` is menacing in the best way.

---

### OPTION 2 — "SENTINEL"
**Concept:** Light-mode enterprise precision. Looks like it belongs in the procurement shortlist next to Palo Alto and CrowdStrike. Institutional trust at first glance.

**Aesthetic direction:** Clean whites + `--hs-cream` warmth + steel blue accents. Feels like a Bloomberg Terminal had a child with a Stripe-quality landing page.

**Execution specifics:**
- Background: `#FAFCFF` to `--hs-cream` gradient on hero, white on body sections
- Hero: Left-aligned H1 in DM Serif Display `--hs-ink`, right side: live threat interception widget
- Cards: white fill, `--hs-border` border, subtle `--hs-cream` section backgrounds
- Stats bar: `--hs-cream` background, `--hs-ink` numbers, `--hs-steel` label text
- Pricing: white cards, featured card with `--hs-steel` top border (4px) and `--hs-sky` eyebrow
- CTA buttons: `--hs-ink` primary (dark button for contrast on white), `--hs-steel` secondary
- Motion: Section reveals on scroll — `opacity: 0; translateY(16px)` → `opacity: 1; translateY(0)` with `transition: 0.4s ease`
- The "asymmetric advantage" section: `--hs-navy` background inset section (breaking the light page), white copy
- Split layout: text left, animated comparison diagram right
- Typography: DM Serif Display 56px for H1, DM Sans 400 for body, 500 for UI

**What makes it unforgettable:** The warmth of `--hs-cream` sections makes it feel human, while the precision of the grid and the dark inset sections make it feel enterprise. Feels like it was built by someone who has sat in a C3PAO assessment.

---

### OPTION 3 — "INTERCEPTOR"
**Concept:** Kinetic threat response. This is the product doing its job, visualized. Every design choice reinforces interception, speed, and certainty.

**Aesthetic direction:** Dark hero with active dashboard, transitioning to light content. The brand color is an electric instrument. Motion is the message — the product intercepts threats, the design should feel like it's intercepting them in real time.

**Execution specifics:**
- Hero: `--hs-navy` full-bleed with a live, animated prompt interception feed running in the background (CSS-only, looping log entries sliding up, then being BLOCKED in red or PASSED in green — 80% opacity as background texture)
- H1 in DM Serif Display white, large (64px desktop), centered
- Below H1: an animated badge showing `[SCANNING...]` → `[BLOCKED: CUI DETECTED]` looping every 3s
- Transition point: after hero, page shifts to `--hs-white` — clean, breathing
- Features section: 3-column layout with animated number counters on scroll
- The "asymmetric advantage" section: split with an SVG data-flow animation — packets flowing to a local box (HoundShield, ✓) vs packets flowing to a cloud and exploding (competitor, ✗)
- Pricing: Tabbed (Monthly/Annual toggle) — on select, pricing cards animate in with `translateY(-4px) + opacity`
- CTA: Full-width `--hs-steel` background section — the Doberman logo at 120px height, centered, with "The window closes November 2026" and a countdown timer
- Motion: Stagger all hero elements, animate the threat feed, pulse the CTA logo
- Font: DM Serif Display for headings, DM Sans 300 italic for sub-hero tagline

**What makes it unforgettable:** You can see the product working before you even scroll. The looping threat feed in the hero background is the product demo. The countdown timer in the footer creates urgency that is real (CMMC Phase 2 is real). The Doberman at 120px is a statement.

---

## 🚀 HERO VISUAL — THREAT INTERCEPTION WIDGET (ALL OPTIONS)

Build a React component `<ThreatFeed />` — used in hero of all 3 options, styled per option.

```tsx
// Simulates live prompt interception — pure CSS animation, no data fetching
// State: rotating array of sample prompts, each tagged BLOCKED or PASSED
// Renders as a mini terminal / dashboard panel

const SAMPLE_THREATS = [
  { text: "Draft contract for Lockheed Martin ITAR #LM-2024...", verdict: "BLOCKED", rule: "ITAR Export Control" },
  { text: "Summarize this DFARS clause for our proposal", verdict: "PASSED", rule: "No CUI detected" },
  { text: "Generate DD-254 for contract W81XWH-24-C-0042", verdict: "BLOCKED", rule: "Contract Number CUI" },
  { text: "What are CMMC Level 2 requirements?", verdict: "PASSED", rule: "No CUI detected" },
  { text: "Translate this spec: MIL-STD-810H section 514.8", verdict: "BLOCKED", rule: "Military Specification" },
  { text: "Review our NDA with classified annex attached...", verdict: "BLOCKED", rule: "CUI//SP-CTI detected" },
  { text: "Help me write an email to our prime contractor", verdict: "PASSED", rule: "No CUI detected" },
  { text: "Check compliance of export license EAR99 form", verdict: "BLOCKED", rule: "Export Control" },
];

// Display: 4 rows visible, new entry slides in from bottom every 1.8s
// BLOCKED: red badge + shield icon
// PASSED: green badge + check icon
// Scan latency shown: "7ms" "9ms" "6ms" "11ms" etc (random 5–14ms)
// Panel has header: "HoundShield · Live Intercept Feed · [ACTIVE]" with pulsing green dot
```

---

## ⚙️ TECHNICAL IMPLEMENTATION SPEC

### File structure
```
compliance-firewall-agent/app/
├── (landing)/
│   ├── page.tsx           ← current, will be replaced by winner
│   ├── v1/page.tsx        ← Option 1: Sovereign
│   ├── v2/page.tsx        ← Option 2: Sentinel
│   └── v3/page.tsx        ← Option 3: Interceptor
├── components/
│   ├── ui/
│   │   ├── ThreatFeed.tsx      ← animated interception widget
│   │   ├── CountdownTimer.tsx  ← CMMC deadline countdown
│   │   ├── ComparisonFlow.tsx  ← local vs cloud SVG animation
│   │   └── PricingToggle.tsx   ← monthly/annual with discount calc
│   └── layout/
│       ├── NavV2.tsx           ← new nav (replaces existing)
│       └── FooterV2.tsx        ← new footer (replaces existing)
```

### Critical tech rules (from HERMES — must not break)
- `PlatformDashboard` stays `ssr: false` — do not touch
- NEVER `transformStyle: "preserve-3d"` on `motion.div`
- All new animations: CSS-only OR Framer Motion (already installed) — no GSAP, no custom libraries
- Max 500 lines per component — split if above
- Only Lucide React for icons — no Heroicons, no FontAwesome
- All brand colors via CSS variables — never raw hex in className
- `NEXT_PUBLIC_APP_URL` = `https://houndshield.com` everywhere

### Performance requirements
- Hero images: Next.js `<Image>` with priority={true}, width/height set
- Fonts: `next/font/google` with `display: 'swap'`
- Animations: `will-change: transform` only where actively animating, removed after
- No layout shift: all dynamic content (ThreatFeed, CountdownTimer) has fixed height container
- Lighthouse target: Performance ≥ 90, Accessibility ≥ 95, Best Practices 100, SEO 100

### Accessibility requirements
- All interactive elements: `aria-label` or visible text
- Color contrast: WCAG AA minimum everywhere, AAA for body text
- Focus states: visible, branded (`outline: 2px solid var(--hs-steel)`)
- Skip nav link: first focusable element on page
- Reduced motion: all animations wrapped in `@media (prefers-reduced-motion: no-preference)`
- Semantic HTML: `<nav>`, `<main>`, `<section aria-label="...">`, `<footer>`

---

## 🧪 TESTS — GUARDIAN MUST PASS ALL

```typescript
// tests/landing.spec.ts — Playwright E2E

describe('HoundShield Landing v1/v2/v3', () => {
  for (const route of ['/v1', '/v2', '/v3']) {
    test(`${route}: renders logo`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('img[alt="HoundShield"]')).toBeVisible();
    });

    test(`${route}: hero headline visible`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByText('leaking CUI')).toBeVisible();
    });

    test(`${route}: pricing shows $199`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByText('$199')).toBeVisible();
    });

    test(`${route}: CTA button clickable`, async ({ page }) => {
      await page.goto(route);
      const cta = page.getByRole('button', { name: /start free trial/i });
      await expect(cta).toBeVisible();
      await cta.click();
    });

    test(`${route}: mobile nav toggle works`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(route);
      await page.locator('[aria-label="Open navigation"]').click();
      await expect(page.locator('nav[data-mobile-open="true"]')).toBeVisible();
    });

    test(`${route}: no console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      await page.goto(route);
      expect(errors).toHaveLength(0);
    });
  }
});
```

Run: `npx playwright test tests/landing.spec.ts`
All 18 tests must pass before PR is opened.

---

## 📋 PR SPECIFICATION

**Branch:** `feature/ui-overhaul-v1v2v3`
**Base:** `main`
**Title:** `feat: BEAST UI overhaul — 3 design options at /v1 /v2 /v3`

**PR Description template:**
```markdown
## UI Overhaul — 3 Design Options

Implements complete UI/UX overhaul with 3 production-ready options for founder selection.

### Preview URLs
- Option 1 Sovereign: [Vercel preview URL]/v1
- Option 2 Sentinel:  [Vercel preview URL]/v2
- Option 3 Interceptor: [Vercel preview URL]/v3

### Changes
- [ ] New component: ThreatFeed (animated live intercept widget)
- [ ] New component: ComparisonFlow (local vs cloud animation)
- [ ] New component: CountdownTimer (CMMC Nov 2026 deadline)
- [ ] New component: PricingToggle (monthly/annual)
- [ ] New layout: NavV2 (sticky, mobile drawer)
- [ ] New layout: FooterV2 (logo lockup, full columns)
- [ ] Brand CSS variables added to globals.css
- [ ] DM Serif Display + DM Sans font system
- [ ] Logo integrated in nav, footer, OG meta

### Tests
- [ ] All 18 Playwright tests passing
- [ ] Lighthouse ≥ 90 performance
- [ ] Lighthouse ≥ 95 accessibility
- [ ] No TypeScript errors
- [ ] No ESLint errors

### Founder Action Required
After reviewing /v1 /v2 /v3 on Vercel preview:
→ Reply with "Ship Option [1/2/3]" to merge winning option to main
→ HERMES will update `/` to winner and delete the others
```

---

## 📣 EXECUTION ORDER (HERMES GODMODE SEQUENCE)

FORGE executes in this order. Do not skip steps. Do not mark done without proof.

```
[ ] 1. Read SKILL: /mnt/skills/public/frontend-design/SKILL.md
[ ] 2. Add CSS variables to globals.css (full palette above)
[ ] 3. Configure next/font/google: DM Serif Display + DM Sans
[ ] 4. Build shared components: ThreatFeed, ComparisonFlow, CountdownTimer, PricingToggle
[ ] 5. Build NavV2 (sticky, mobile-responsive, logo integrated)
[ ] 6. Build FooterV2 (logo lockup, columns, copyright)
[ ] 7. Build Option 1 SOVEREIGN at /v1 — full page, all sections
[ ] 8. Build Option 2 SENTINEL at /v2 — full page, all sections
[ ] 9. Build Option 3 INTERCEPTOR at /v3 — full page, all sections
[ ] 10. Lighthouse audit all 3 — must hit targets
[ ] 11. Run Playwright tests — all 18 must pass
[ ] 12. Fix any failures — no PR with red tests
[ ] 13. Open PR per specification above
[ ] 14. Output Vercel preview URLs for all 3 options
[ ] 15. Output SITREP: what was built, test counts, Lighthouse scores, what's next
```

**FORGE does not stop until all 15 steps are checked. No partial delivery.**

---

## 🔒 SECURITY (GUARDIAN — ALWAYS ENFORCED)

- No new environment variables without adding to .env.example
- No API keys or secrets in component code
- All external links: `rel="noopener noreferrer"`
- No user input on landing page that isn't sanitized
- OG image generated statically — no dynamic user content in meta

---

## ✅ DONE CRITERIA

The UI overhaul is DONE when:
1. `/v1`, `/v2`, `/v3` live on Vercel preview — all accessible via URL
2. All 18 Playwright tests passing (zero failures)
3. Lighthouse ≥ 90 performance, ≥ 95 accessibility on all 3 options
4. Logo visible in nav + footer on all 3 options, correctly styled per background
5. Canonical pricing ($0/$199/$499/$999/$2,499) correct on all 3 options
6. No TypeScript errors (`npx tsc --noEmit` clean)
7. No ESLint errors (`npx next lint` clean)
8. PR opened with preview URLs
9. Founder can select winning option by replying "Ship Option [N]"

If any step above fails, FORGE fixes it. The deliverable is the finished product, not a plan to build it.

**The standard is "holy shit, that's done."**

---

*HOUNDSHIELD BEAST UI PROMPT | Operation HOUND | HERMES GODMODE | 2026-05-19*
*GitHub: https://github.com/thecelestialmismatch/HoundShield.git*
*Live: https://www.houndshield.com*
*Boil the ocean. Ship the complete thing. The window closes November 2026.*
