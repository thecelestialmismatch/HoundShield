# ████████████████████████████████████████████████████████████████████
# HOUNDSHIELD — BEAST UI/UX MASTER PROMPT — v3.0
# Operation HOUND | HERMES GODMODE | MOSSAD-Level Design Directive
# ATLAS + FORGE + GUARDIAN + SCRIBE | Entire Project | Full OODA
# Premium Light Mode Only | Logo v2 (3D Metal) | Palette Locked
# v3.0 | 2026-05-20
# ████████████████████████████████████████████████████████████████████

> **HOW TO USE:**
> 1. Open a new Claude session (or paste HERMES GODMODE Master Prompt first if using that system)
> 2. Paste THIS ENTIRE FILE as your task prompt
> 3. State which page/component/task you need executed
> 4. The answer is the finished product. Not a plan. Not a mockup. The thing itself.
>
> **SCOPE CHANGE v3.0:** This prompt now covers the ENTIRE project —
> landing pages, dashboard, auth, pricing, docs, blog, and all UI components.
> Not just the homepage. Every pixel HoundShield owns.
>
> OODA: Observe → Orient (this document IS the brand bible) → Decide → Act
> Marginal cost of completeness is near zero. Do the whole thing.
> The standard is: a Fortune 500 CISO opens houndshield.com and says "wire me in."
> The standard is "holy shit, that's done."

---

## 🎯 PRIME MISSION DIRECTIVE

**PRODUCT:** HoundShield (https://www.houndshield.com)
**GITHUB:** https://github.com/thecelestialmismatch/HoundShield.git
**TAGLINE:** Local AI compliance firewall for DoD contractors
**ICP:** Jordan — IT Security Manager, DoD contractor, MacBook, fluorescent office, failing CMMC

**VISUAL REFERENCE (APPROVED):**
The v3 landing page design approved by founder is the aesthetic benchmark.
Reference: Claude Design file — HoundShield Landing Page v3.html
Palette: The 4-color system below. Mood: institutional trust, warm precision, enterprise permanence.

**QUALITY BAR — non-negotiable:**
This is not a SaaS startup homepage. This is the face of a company standing between
classified US defense data and the public internet. The visual language must communicate:
precision, trust, institutional permanence.

Reference: Palantir.com × Stripe.com × Linear.app — warmer, more human, lighter.
A C3PAO auditor, a DoD contracting officer, and a Series A investor must all look at it
and immediately understand: this is the real deal.

**WHY LIGHT MODE ONLY:**
Jordan uses a MacBook in a fluorescent-lit government facility on a 13" screen.
Dark mode reads "hacker tool." Light mode reads "enterprise software."
The warmth of --hs-cream against the precision of --hs-steel IS the brand.
Do not offer dark mode. Do not build it. This is the call, and it is final.

---

## 🐾 LOGO — v2 SPECIFICATION (CRITICAL UPDATE)

### What changed
The logo is NO LONGER a flat black silhouette on transparent background.
The logo is now a **3D metallic render** — a Doberman head inside a shield,
brushed gunmetal steel, dimensional, with depth and shadow, on a white/near-white
canvas. The image has a white background baked in.

This breaks ALL previous logo invert logic. Read the new rules carefully.

### Logo file
```
File:        /public/houndshield-logo.png
Format:      PNG, 3D metallic Doberman-in-shield render
Background:  White (#FAFCFF or #FFF) baked into image — NOT transparent
Style:       Brushed gunmetal steel, dimensional lighting, premium hardware aesthetic
```

### Logo usage law v2 — the new rules

**On white / near-white / --hs-surface-0 backgrounds:**
- Use logo as-is, no filter
- The metallic render sits naturally against white
- Minimum nav height: 36px
- Minimum footer lockup: 52px

**On --hs-cream (#F3E3D0) sections:**
- Use logo as-is, no filter
- The warm white in the logo background blends acceptably
- Add subtle drop shadow to lift: `filter: drop-shadow(0 2px 8px rgba(15,30,46,0.10))`

**On --hs-steel (#81A6C6) or --hs-sky (#AACDDC) backgrounds:**
- Logo has white baked in — it will create a white box against the tinted bg
- SOLUTION A: Use a contained card/panel approach — white card holds logo + wordmark
- SOLUTION B: Use CSS `mix-blend-mode: multiply` on the img element (tests required)
- SOLUTION C: Use only the wordmark "HoundShield" in white text on tinted backgrounds
- DO NOT: `filter: brightness(0) invert(1)` — destroys the 3D render completely

**On --hs-navy (#0D1B2A) — comparison section only:**
- Same constraint as steel backgrounds
- Use wordmark-only in white text
- Or: white bordered pill/badge containing logo on white micro-bg
- DO NOT invert the 3D metallic logo

**Wordmark pairing (all placements):**
- Font: var(--font-display) — Fraunces, weight 400 (regular), no bold
- Size in nav: 18px
- Size in footer: 22px
- Color: always --hs-ink (#0F1E2E) on light, white on dark sections
- Gap between logo and wordmark: 10px, vertically centered

**Logo placement inventory:**
- Nav bar: logo (36px) + wordmark, left-aligned
- Footer: logo (52px) + wordmark, centered in lockup above columns
- OG image: logo centered at 120px, wordmark below at 28px, tagline at 20px
- Favicon: Use geometric shield icon abstracted from logo — SVG, not PNG render
- Loading state: Logo animates in scale from 0.8 to 1.0 with opacity, 400ms ease-out

---

## 🎨 BRAND SYSTEM — COMPLETE & LOCKED v3

### Color System

```css
/* ─── GLOBALS.CSS — FULL VARIABLE SET — PASTE VERBATIM ─── */
:root {
  /* ── BRAND PALETTE (locked by founder — do not change these 4 values) ── */
  --hs-steel:          #81A6C6;   /* rgb(129, 166, 198) — Primary: CTAs, links, active */
  --hs-sky:            #AACDDC;   /* rgb(170, 205, 220) — Secondary: hover fills, highlights */
  --hs-cream:          #F3E3D0;   /* rgb(243, 227, 208) — Warm bg: sections, testimonials */
  --hs-sand:           #D2C4B4;   /* rgb(210, 196, 180) — Muted: borders, secondary text */

  /* ── EXTENDED (derived from palette — do not override) ── */
  --hs-white:          #FAFCFF;   /* Page background — primary */
  --hs-ink:            #0F1E2E;   /* All body text on light bg */
  --hs-ink-secondary:  #3D5166;   /* Secondary text, captions, descriptions */
  --hs-ink-tertiary:   #6B8299;   /* Placeholder, disabled, metadata */
  --hs-navy:           #0D1B2A;   /* Dark accent — comparison section bg ONLY */
  --hs-steel-dark:     #5A86A8;   /* Hover state for --hs-steel elements */
  --hs-steel-light:    #C5DAE9;   /* Very light steel — bg fills, chips */
  --hs-cream-deep:     #EDD5BC;   /* Deeper cream — hover on cream sections */
  --hs-sand-light:     #E8DDD1;   /* Light sand — table rows, zebra stripe */

  /* ── SURFACES ── */
  --hs-surface-0:      #FAFCFF;   /* Page bg — primary */
  --hs-surface-1:      #F5F8FB;   /* Card bg on white sections */
  --hs-surface-2:      #F3E3D0;   /* Section bg — cream variant */
  --hs-surface-3:      #EDD5BC;   /* Section bg — deeper cream */

  /* ── BORDERS ── */
  --hs-border-subtle:  rgba(129,166,198,0.12);  /* Hairlines, dividers */
  --hs-border:         rgba(129,166,198,0.22);  /* Default card borders */
  --hs-border-strong:  rgba(129,166,198,0.45);  /* Emphasis borders */
  --hs-border-ink:     rgba(15,30,46,0.10);     /* Ink-tinted borders */

  /* ── OVERLAYS ── */
  --hs-mist:           rgba(129,166,198,0.06);  /* Subtlest fill */
  --hs-mist-md:        rgba(129,166,198,0.10);  /* Medium fill */
  --hs-glow:           rgba(129,166,198,0.18);  /* Hover overlay */
  --hs-glow-strong:    rgba(129,166,198,0.28);  /* Active/focus overlay */

  /* ── SEMANTIC ── */
  --hs-success:        #059669;   /* PASSED — green, WCAG AA on white */
  --hs-success-bg:     #ECFDF5;   /* Success chip background */
  --hs-danger:         #DC2626;   /* BLOCKED — red, WCAG AA on white */
  --hs-danger-bg:      #FEF2F2;   /* Danger chip background */
  --hs-warn:           #D97706;   /* Warning — amber, WCAG AA on white */
  --hs-warn-bg:        #FFFBEB;   /* Warning chip background */

  /* ── TYPOGRAPHY ── */
  --font-display:      'Fraunces', Georgia, serif;
  --font-body:         'DM Sans', system-ui, sans-serif;
  --font-mono:         'JetBrains Mono', 'Fira Code', monospace;

  /* ── MOTION ── */
  --ease-out:          cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring:       cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-in-out:       cubic-bezier(0.65, 0, 0.35, 1);
  --duration-fast:     150ms;
  --duration-base:     250ms;
  --duration-slow:     400ms;
  --duration-enter:    600ms;

  /* ── SHADOWS ── */
  --shadow-sm:   0 1px 2px rgba(15,30,46,0.04), 0 1px 3px rgba(129,166,198,0.06);
  --shadow-md:   0 4px 16px rgba(15,30,46,0.06), 0 1px 4px rgba(129,166,198,0.08);
  --shadow-lg:   0 8px 32px rgba(15,30,46,0.08), 0 2px 8px rgba(129,166,198,0.10);
  --shadow-xl:   0 16px 48px rgba(15,30,46,0.10), 0 4px 12px rgba(129,166,198,0.12);
  --shadow-card: 0 2px 8px rgba(15,30,46,0.06), 0 0 1px rgba(129,166,198,0.20);
  --shadow-cta:  0 4px 24px rgba(129,166,198,0.35), 0 1px 4px rgba(129,166,198,0.20);
  --shadow-logo: 0 2px 12px rgba(15,30,46,0.12), 0 1px 3px rgba(15,30,46,0.08);

  /* ── RADIUS ── */
  --radius-sm:   6px;    /* badges, chips, tags */
  --radius-md:   10px;   /* buttons, inputs */
  --radius-lg:   14px;   /* cards */
  --radius-xl:   20px;   /* large cards, panels */
  --radius-pill: 999px;  /* pills, toggles */
}
```

### Color Commandments — 10 Laws

1. Page background is ALWAYS `--hs-surface-0` (#FAFCFF) — never pure #fff
2. Alternating sections use `--hs-surface-2` (cream) — warmth without weight
3. Primary CTA: `--hs-steel` bg + white text + `--shadow-cta` — always, no exceptions
4. Ghost CTA: transparent bg + `--hs-border-strong` border + `--hs-ink` text
5. Card borders: `var(--hs-border)` at rest; `var(--hs-border-strong)` on hover
6. Body text: `--hs-ink` primary, `--hs-ink-secondary` descriptive, `--hs-ink-tertiary` meta
7. Never raw Tailwind color tokens in className — CSS variables only via style prop or module
8. `--hs-navy` appears ONLY as bg in the local-vs-cloud comparison section
9. Section titles use `--hs-ink`, never `--hs-steel` — brand color is accent, not dominant
10. Pricing featured card: `--hs-steel` top-border 3px + `--hs-steel-light` bg tint

---

## 🖋️ TYPOGRAPHY SYSTEM

### Font Registration (next/font/google)

```typescript
// app/fonts.ts
import { Fraunces, DM_Sans } from 'next/font/google'

export const displayFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

export const bodyFont = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
})
```

### Type Scale

```
--text-xs:    11px / 1.4  — eyebrows, legal, metadata badges
--text-sm:    13px / 1.6  — secondary body, captions, nav links
--text-base:  15px / 1.7  — primary body copy
--text-lg:    18px / 1.5  — section lead-in, feature descriptions
--text-xl:    24px / 1.3  — card titles, sub-section headings
--text-2xl:   32px / 1.2  — section titles (H2)
--text-3xl:   42px / 1.1  — hero sub-headline
--text-4xl:   56px / 1.05 — hero H1 desktop
--text-hero:  72px / 1.0  — max impact hero (mobile: 40px)
```

### Typography Laws

- H1: Fraunces, weight 400, --hs-ink — always, no exceptions
- H2, H3: Fraunces, weight 400–500, --hs-ink — section titles
- All UI (nav, buttons, badges, inputs, tables): DM Sans
- Body copy: DM Sans, weight 300–400
- Mono (code blocks, proxy URLs, scan outputs): JetBrains Mono
- No font mixing beyond this three-font system

---

## 📐 LAYOUT SYSTEM

```
Max content width:   1200px (centered, 24px padding on mobile)
Nav height:          64px desktop / 56px mobile
Section padding:     96px vertical desktop / 64px tablet / 48px mobile
Card padding:        24px desktop / 16px mobile
Grid gaps:           24px desktop / 16px mobile
Grid columns:        12-col base; features = 3-col; pricing = 4-col
Breakpoints:         mobile 375px | tablet 768px | desktop 1024px | wide 1440px
```

**Spacing law:** Every spacing value is a multiple of 4px.
No magic numbers. Ever.

---

## 🗂️ COMPLETE PAGE INVENTORY — ALL MUST CONFORM

### Public / Marketing Pages

#### `/` — Landing Page (Primary)
The approved design reference is v3. Sections required:

1. **Nav** — sticky, backdrop-blur on scroll, mobile drawer
   - Left: logo (36px) + "HoundShield" wordmark
   - Center links: Product | How It Works | Pricing | Docs | Blog
   - Right: "Sign In" (ghost) + "Start Free Trial" (primary, --hs-steel)
   - Mobile: hamburger → slide-in drawer, full-width CTA at bottom

2. **Hero** — bg: --hs-surface-0, subtle grid/dot texture overlay optional
   - Eyebrow badge: `CMMC L2 · DFARS 7012 · HIPAA · SOC 2`
   - H1 (verbatim): **"Stop your team from leaking CUI to ChatGPT"**
   - Sub (verbatim): **"Local-only AI compliance firewall. Intercepts every prompt before it leaves your network. 16 detection engines. <10ms latency. One proxy URL to deploy."**
   - CTA primary: "Start Free Trial — No Card Required"
   - CTA ghost: "Watch 2-Min Demo"
   - Trust row: ✓ Nothing leaves your network · ✓ <10ms latency · ✓ 49/49 tests passing · ✓ One URL to deploy
   - Hero visual RIGHT: ThreatFeed animated widget (see component spec)

3. **Stats Bar** — bg: --hs-surface-2 (cream), border-top + border-bottom
   - 16 Detection Engines
   - ~80,000 DoD Contractors At Risk
   - November 10, 2026 CMMC Enforcement
   - <10ms Scan Latency
   - CountdownTimer component (days to Nov 10, 2026)
   - All stats: animated counter on scroll-into-view

4. **Asymmetric Advantage** — bg: --hs-navy (ONLY instance of dark bg)
   - Copy (verbatim): *"Every cloud-based AI DLP tool sends your CUI to their servers to scan it. That's itself a potential CUI spill under DFARS 7012. HoundShield scans everything locally. Nothing leaves your network."*
   - ComparisonFlow SVG animation: HoundShield (local, green) vs Cloud Tool (data leaves, red)
   - White text on navy — wordmark-only logo treatment here

5. **Features Grid** — bg: --hs-surface-0, 3-column on desktop
   - 100% Local Scanning — zero data to our servers
   - C3PAO-Ready PDF Reports — NIST SP 800-171 cited, one-click
   - Zero-Friction Deployment — one proxy URL, done in minutes
   - OODA Behavioral Engine — detects policy drift before spill
   - 16 CUI Detection Patterns — contracts, drawings, ITAR, PII
   - Brain AI Compliance Advisor — CMMC Q&A with cited answers

6. **How It Works** — bg: --hs-surface-2 (cream), horizontal 3-step
   - Step 1: Change one URL in your AI tool config
   - Step 2: Every prompt scanned locally, <10ms, blocked or passed
   - Step 3: Violations logged, PDF report ready for your C3PAO auditor

7. **Built for Jordan** — bg: --hs-surface-0, persona card + testimonial
   - IT Security Manager, DoD contractor, 50–500 employee org
   - Fear: failing CMMC assessment due to ChatGPT CUI incident
   - Goal: the PDF she hands her C3PAO auditor
   - Testimonial placeholder with real job title format

8. **Pricing** — bg: --hs-surface-2 (cream)
   - Monthly/Annual toggle (PricingToggle component, 20% annual discount)
   - CANONICAL PRICING — DO NOT CHANGE:
     | Plan       | Monthly | Annual  | Target                        |
     |------------|---------|---------|-------------------------------|
     | Free       | $0      | $0      | Eval, <500 req/day            |
     | Pro        | $199    | $159    | Jordan — IT Manager           |
     | Growth     | $499    | $399    | Multi-team, SIEM integration  |
     | Enterprise | $999    | $799    | MSP, multi-site               |
     | Federal    | $2,499  | $1,999  | Prime contractors, C3PAO prep |
   - Pro card: featured (--hs-steel top border, --hs-steel-light tint)
   - Each card: features list, CTA button, compliance frameworks covered

9. **FAQ** — bg: --hs-surface-0, FaqAccordion component
   Q1: Does HoundShield store any of our prompts?
   Q2: How does the proxy URL deployment work?
   Q3: What's the difference between HoundShield and a cloud DLP tool?
   Q4: Is this sufficient for CMMC Level 2 assessment?
   Q5: What happens when a prompt is blocked?
   Q6: Can we get a demo before purchasing?

10. **Final CTA** — bg: --hs-steel, white text, logo wordmark white
    - H2: "Your CMMC deadline doesn't move."
    - Sub: "Get compliant before November 10, 2026."
    - CountdownTimer (white numerals on steel bg)
    - CTA: "Start Free Trial" (white bg, --hs-ink text)

11. **Footer** — bg: --hs-surface-0, logo lockup centered, 3 columns
    - Logo (52px) + wordmark
    - Links: Product | Pricing | Docs | Blog | GitHub | Privacy | Terms
    - Compliance badges: CMMC L2 | DFARS 7012 | HIPAA | SOC 2
    - Copyright: © 2026 HoundShield. All rights reserved.

#### `/pricing` — Standalone Pricing Page
- Full pricing table (all 5 tiers, feature comparison matrix)
- Annual/monthly toggle prominent
- FAQ section (pricing-specific questions)
- Comparison: HoundShield Free vs Pro vs Growth vs Enterprise vs Federal
- Trust signals: "Cancel anytime" | "Local deployment" | "No data leaves your network"
- Bottom CTA: "Need a custom quote? Talk to us."

#### `/how-it-works` — Technical Deep Dive
- Full 6-step deployment walkthrough with code examples
- Architecture diagram: request flow from AI tool → HoundShield proxy → AI API
- Detection engine breakdown: all 16 engine types listed
- Latency proof: <10ms P99 with methodology
- Integration list: ChatGPT, Claude, Gemini, Copilot, custom AI endpoints
- Code block: `OPENAI_API_BASE=https://proxy.houndshield.com/v1`

#### `/blog` — Content hub
- Article card grid (3-col desktop, 1-col mobile)
- Category filter: CMMC | HIPAA | Zero Trust | Industry News
- Featured article banner
- Subscribe CTA (email capture)

#### `/blog/[slug]` — Article page
- Full-width article header (category badge, title, author, date, read time)
- Body: Fraunces for display elements, DM Sans for body
- Sidebar: related articles, CTA card
- Progress bar on scroll

#### `/docs` — Documentation hub
- Left sidebar navigation (collapsible sections)
- Content area: 800px max-width, generous line-height
- Code blocks: JetBrains Mono, --hs-navy bg, syntax highlighting
- Search input (prominent)
- "Deploy in 60 seconds" quick-start at top

#### `/docs/[slug]` — Doc article
- Same layout as hub, breadcrumb navigation
- "Was this helpful?" feedback widget
- Edit on GitHub link

---

### Auth Pages

All auth pages: centered single-column, max-width 400px, bg: --hs-surface-0.
Logo (centered, 52px) + wordmark above form. No nav. Footer: wordmark + copyright only.

#### `/sign-in`
- Email + password inputs
- "Forgot password?" link (--hs-steel color)
- Primary CTA: "Sign In" (--hs-steel bg, full-width)
- Divider: "or"
- SSO option: "Sign in with Google" (ghost button)
- Below form: "New to HoundShield? Start free →"

#### `/sign-up`
- Email + password + confirm password
- Checkbox: "I agree to Terms of Service and Privacy Policy"
- Primary CTA: "Create Account" (--hs-steel bg, full-width)
- Eyebrow: compliance badge row (CMMC L2 · HIPAA · SOC 2)
- Below: "Already have an account? Sign in →"

#### `/forgot-password`
- Email input
- CTA: "Send Reset Link"
- Back to sign in link

---

### Platform / Dashboard Pages

All platform pages: left sidebar nav (240px) + main content area. bg: --hs-surface-1.
The sidebar uses --hs-surface-0 (white) with --hs-border-subtle right border.
Do NOT rebuild PlatformDashboard if it already has ssr: false — preserve that.

#### `/dashboard` — Main Dashboard
- Threat intercept feed (ThreatFeed live component)
- Stats row: Requests Today | Blocked | Passed | Latency P99
- Quick actions: View Reports | Configure Proxy | Brain AI
- Recent activity log

#### `/dashboard/reports` — Compliance Reports
- Report list: date, framework, status (PASSED / NEEDS REVIEW)
- Generate PDF button (--hs-steel)
- Report preview panel
- Download history

#### `/dashboard/config` — Proxy Configuration
- Proxy URL display: CodeBlock component with copy button
- Integration selector: OpenAI | Anthropic | Google | Custom
- Policy editor: CUI pattern toggles, severity levels
- Test connection button

#### `/dashboard/brain` — Brain AI Advisor
- Chat interface: messages styled with DM Sans
- Input bar fixed at bottom
- Sidebar: suggested CMMC questions
- Cited response format: [NIST 800-171: 3.13.1]

#### `/dashboard/billing` — Billing
- Current plan + usage metrics
- Upgrade/downgrade selector
- Invoice history table
- Payment method (no actual card input — Stripe hosted)

---

## 🧩 SHARED COMPONENTS — FULL SPEC

### ThreatFeed
```
Purpose:    Animated live intercept widget for hero + dashboard
Behavior:   New threats scroll in from bottom, 2-3s interval
Entry:      Slide up + fade in, 300ms ease-out
Items:      [ BLOCKED | PASSED | FLAGGED ] pill + prompt excerpt + engine name + ms
Colors:     BLOCKED: --hs-danger-bg + --hs-danger text
            PASSED:  --hs-success-bg + --hs-success text  
            FLAGGED: --hs-warn-bg + --hs-warn text
Font:       DM Sans body, JetBrains Mono for prompt excerpts
Max visible: 5 items, oldest fades out
```

### CountdownTimer
```
Purpose:    Nov 10, 2026 CMMC enforcement deadline countdown
Display:    DD | HH | MM | SS — 4 blocks
Labels:     DAYS | HOURS | MINUTES | SECONDS in --hs-ink-tertiary, 10px caps
Animation:  Flip card or slot scroll on digit change (CSS only, no JS lib)
Usage:      Stats bar (--hs-ink numerals), Final CTA section (white numerals)
Responsive: Full width on mobile, stacks 2×2 at 375px
```

### ComparisonFlow
```
Purpose:    SVG animation — local vs cloud data flow diagram
Left side:  HoundShield path — prompt → local proxy → AI API
            Data stays within the orange dashed "Your Network" boundary
            Green pulsing dots for data in transit (safe)
Right side: Cloud DLP path — prompt → cloud scan → AI API
            Data exits the boundary, red dashed "CUI EXPOSED" label
            Red pulsing dots when data crosses the boundary
Animation:  Looping, 4s cycle, eased bezier paths
Mobile:     Stacks vertically
```

### PricingToggle
```
Purpose:    Monthly/Annual billing toggle with animated price transitions
States:     Monthly (default) | Annual (20% discount shown)
Animation:  AnimatePresence — price morphs from old to new (slide up/fade)
Position:   Centered above pricing cards
Savings:    "Save 20%" badge appears on Annual state
```

### FaqAccordion
```
Purpose:    Expandable FAQ items
Animation:  Height transition via CSS grid-template-rows: 0fr → 1fr
Icon:       ChevronDown (Lucide), rotates 180° on open, 250ms ease
Border:     --hs-border-subtle between items
Active:     Question text color shifts to --hs-steel when open
```

### CodeBlock
```
Purpose:    Proxy URL + code examples display
Bg:         --hs-navy (#0D1B2A)
Text:       White, JetBrains Mono, 14px
Syntax:     Comment lines: --hs-ink-tertiary | Values: --hs-sky
Copy btn:   Top-right corner, "Copy" → "Copied ✓" with 2s reset
Border:     var(--radius-lg), subtle steel glow border
```

### NavV3
```
Purpose:    Primary navigation — sticky, blur, mobile-responsive
Height:     64px desktop, 56px mobile
Scroll:     After 20px scroll: backdrop-blur(12px) + --hs-border-subtle border-bottom
Active:     Current route link: --hs-steel color + 2px bottom border
Mobile:     ≤768px: hamburger (3 bars, --hs-ink) → slide-in drawer (100vw)
            Drawer: full-height, bg: --hs-surface-0, links stack vertically
            Drawer CTA: "Start Free Trial" full-width at bottom, --hs-steel
aria:       [aria-label="Open navigation"] on hamburger
            nav[data-mobile-open="true"] when drawer is open
```

### FooterV3
```
Purpose:    Site footer — full brand lockup
Layout:     Logo lockup centered (top), 3-column links below, compliance badges, copyright
Logo:       52px height + wordmark — centered
Columns:    Product (Features, Pricing, How It Works) |
            Resources (Docs, Blog, GitHub) |
            Legal (Privacy, Terms, Security)
Badges:     CMMC L2 · DFARS 7012 · HIPAA · SOC 2 — pill badges, --hs-border border
Divider:    --hs-border-subtle, 1px
Copyright:  --hs-ink-tertiary, 12px, centered
```

### Sidebar (Platform)
```
Width:      240px, fixed left, full height
Bg:         --hs-surface-0, --hs-border-subtle right border
Logo:       36px + wordmark at top, 20px padding
Links:      Dashboard | Reports | Config | Brain AI | Billing
Active:     --hs-steel-light bg fill, --hs-steel text, left 3px border --hs-steel
Hover:      --hs-mist bg fill
Icon:       Lucide, 16px, left of label, --hs-ink-secondary
Mobile:     Off-canvas drawer, hamburger in top bar opens it
```

---

## ⚙️ TECHNICAL LAWS — HARD CONSTRAINTS

### Framework
```
Next.js 15 (App Router) — TypeScript strict mode
React 19
Framer Motion (already installed) — for complex animation only
CSS-only first: if achievable in CSS, no JS animation lib
Lucide React only — no Heroicons, FontAwesome, or SVG-inline custom icons
```

### Rules that cannot break
```
✗ NEVER transformStyle: "preserve-3d" on motion.div
✗ NEVER touch PlatformDashboard if it has ssr: false
✗ NEVER raw Tailwind color tokens in className (amber-500, etc.)
✗ NEVER more than 500 lines per component — split if over
✗ NEVER new npm dependencies without noting bundle size delta
✗ NEVER localStorage or sessionStorage on landing pages
✗ NEVER inline API keys or secrets
✗ NEVER filter: brightness(0) invert(1) on the 3D logo
✗ NEVER pure #fff or #000 — use --hs-white and --hs-ink
✗ NEVER placeholder text — all content is real copy from this doc or existing pages
```

### Performance requirements
```
Hero images:        Next.js <Image>, priority={true}, width/height explicit
Fonts:              next/font/google, display: 'swap'
Animations:         will-change: transform — only on active animate elements, removed after
Fixed containers:   ThreatFeed, CountdownTimer, ComparisonFlow have explicit height — no CLS
Bundle:             Analyze with @next/bundle-analyzer if adding new deps
```

### Accessibility requirements
```
All interactive elements:  aria-label or visible text (no icon-only buttons without label)
Color contrast:            WCAG AA everywhere, AAA for body text
Focus states:              outline: 2px solid var(--hs-steel), offset: 2px
Skip nav:                  First focusable element on page
Reduced motion:            All animations in @media (prefers-reduced-motion: no-preference)
Semantic HTML:             <nav>, <main>, <section aria-label="...">, <footer>
Form inputs:               Explicit <label> for every input — no placeholder-as-label
```

### Security (GUARDIAN — always enforced)
```
✓ No new env vars without adding placeholder to .env.example
✓ No API keys in component files
✓ External links: rel="noopener noreferrer"
✓ OG image: static, no dynamic content
✓ CSP headers: not broken by new inline styles or script tags
✓ No dynamic user content in meta tags
```

---

## 🗃️ FILE STRUCTURE

```
/
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx              — NavV3 + FooterV3 wrapper
│   │   ├── page.tsx                — Landing page (approved v3 design)
│   │   ├── pricing/page.tsx        — Standalone pricing
│   │   ├── how-it-works/page.tsx   — Technical deep dive
│   │   ├── blog/page.tsx           — Blog hub
│   │   ├── blog/[slug]/page.tsx    — Blog article
│   │   ├── docs/page.tsx           — Docs hub
│   │   └── docs/[slug]/page.tsx    — Doc article
│   ├── (auth)/
│   │   ├── layout.tsx              — Auth layout (no nav, centered)
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (platform)/
│   │   ├── layout.tsx              — Sidebar + topbar wrapper
│   │   ├── dashboard/page.tsx
│   │   ├── dashboard/reports/page.tsx
│   │   ├── dashboard/config/page.tsx
│   │   ├── dashboard/brain/page.tsx
│   │   └── dashboard/billing/page.tsx
│   ├── fonts.ts                    — Fraunces + DM Sans
│   └── globals.css                 — Full CSS variable set (paste verbatim above)
├── components/
│   ├── ui/
│   │   ├── ThreatFeed.tsx
│   │   ├── CountdownTimer.tsx
│   │   ├── ComparisonFlow.tsx
│   │   ├── PricingToggle.tsx
│   │   ├── FaqAccordion.tsx
│   │   └── CodeBlock.tsx
│   └── layout/
│       ├── NavV3.tsx
│       ├── FooterV3.tsx
│       └── Sidebar.tsx
├── public/
│   ├── houndshield-logo.png        — 3D metallic render (new logo v2)
│   ├── favicon.svg                 — Abstract shield SVG (NOT the 3D render)
│   └── og-image.png                — 1200×630, generated
└── styles/
    └── (globals.css is in app/)
```

---

## 🧪 TESTS — GUARDIAN MUST PASS ALL

### Playwright E2E — Landing Page

```typescript
// tests/landing.spec.ts
import { test, expect } from '@playwright/test'

test.describe('HoundShield Landing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders logo in nav', async ({ page }) => {
    await expect(page.locator('nav img[alt="HoundShield"]')).toBeVisible()
  })

  test('renders wordmark in nav', async ({ page }) => {
    await expect(page.locator('nav').getByText('HoundShield')).toBeVisible()
  })

  test('hero headline visible', async ({ page }) => {
    await expect(page.getByText(/leaking CUI/i)).toBeVisible()
  })

  test('primary CTA visible and clickable', async ({ page }) => {
    const cta = page.getByRole('link', { name: /start free trial/i }).first()
    await expect(cta).toBeVisible()
    await expect(cta).toBeEnabled()
  })

  test('pricing shows all 5 tiers', async ({ page }) => {
    await expect(page.getByText('$199')).toBeVisible()
    await expect(page.getByText('$499')).toBeVisible()
    await expect(page.getByText('$999')).toBeVisible()
    await expect(page.getByText('$2,499')).toBeVisible()
  })

  test('annual toggle switches prices', async ({ page }) => {
    await page.getByText(/annual/i).click()
    await expect(page.getByText('$159')).toBeVisible()
  })

  test('countdown timer renders and is ticking', async ({ page }) => {
    const timer = page.locator('[data-testid="countdown"]')
    await expect(timer).toBeVisible()
    const initial = await timer.textContent()
    await page.waitForTimeout(1100)
    const after = await timer.textContent()
    expect(initial).not.toEqual(after)
  })

  test('threat feed is animating', async ({ page }) => {
    await expect(page.locator('[data-testid="threat-feed"]')).toBeVisible()
  })

  test('mobile nav drawer opens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.locator('[aria-label="Open navigation"]').click()
    await expect(page.locator('nav[data-mobile-open="true"]')).toBeVisible()
  })

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
    await page.reload()
    expect(errors).toHaveLength(0)
  })

  test('footer logo present', async ({ page }) => {
    await page.locator('footer img[alt="HoundShield"]').scrollIntoViewIfNeeded()
    await expect(page.locator('footer img[alt="HoundShield"]')).toBeVisible()
  })

  test('FAQ accordion opens', async ({ page }) => {
    const firstItem = page.locator('[data-testid="faq-item"]').first()
    await firstItem.click()
    await expect(firstItem.locator('[data-testid="faq-answer"]')).toBeVisible()
  })
})
```

### Playwright E2E — Auth Pages

```typescript
// tests/auth.spec.ts
test.describe('HoundShield Auth', () => {
  test('sign-in page renders form', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('sign-up page renders form', async ({ page }) => {
    await page.goto('/sign-up')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()
  })

  test('forgot-password renders email input', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })
})
```

### React Testing Library — Component Unit Tests

```typescript
// tests/unit/ThreatFeed.test.tsx
import { render, screen } from '@testing-library/react'
import { ThreatFeed } from '@/components/ui/ThreatFeed'

test('renders threat feed container', () => {
  render(<ThreatFeed />)
  expect(screen.getByTestId('threat-feed')).toBeInTheDocument()
})

test('renders at least one threat item', async () => {
  render(<ThreatFeed />)
  await waitFor(() => {
    expect(screen.getAllByTestId('threat-item').length).toBeGreaterThan(0)
  })
})

test('shows BLOCKED status items', async () => {
  render(<ThreatFeed />)
  await waitFor(() => {
    expect(screen.getByText(/BLOCKED/i)).toBeInTheDocument()
  })
})

// tests/unit/CountdownTimer.test.tsx
test('renders countdown with 4 blocks', () => {
  render(<CountdownTimer target={new Date('2026-11-10')} />)
  expect(screen.getByText(/DAYS/i)).toBeInTheDocument()
  expect(screen.getByText(/HOURS/i)).toBeInTheDocument()
  expect(screen.getByText(/MINUTES/i)).toBeInTheDocument()
  expect(screen.getByText(/SECONDS/i)).toBeInTheDocument()
})

test('countdown is decreasing', async () => {
  render(<CountdownTimer target={new Date('2026-11-10')} />)
  const seconds = screen.getByTestId('countdown-seconds')
  const initial = seconds.textContent
  await waitFor(() => {
    expect(seconds.textContent).not.toEqual(initial)
  }, { timeout: 2000 })
})

// tests/unit/PricingToggle.test.tsx
test('switches between monthly and annual', async () => {
  render(<PricingSection />)
  expect(screen.getByText('$199')).toBeInTheDocument()
  await userEvent.click(screen.getByText(/annual/i))
  expect(screen.getByText('$159')).toBeInTheDocument()
})

// tests/unit/FaqAccordion.test.tsx
test('accordion opens on click', async () => {
  render(<FaqAccordion items={mockFaqItems} />)
  const item = screen.getAllByTestId('faq-item')[0]
  await userEvent.click(item)
  expect(screen.getByTestId('faq-answer')).toBeVisible()
})

// tests/unit/CodeBlock.test.tsx
test('copy button copies text to clipboard', async () => {
  Object.assign(navigator, { clipboard: { writeText: jest.fn() } })
  render(<CodeBlock code="OPENAI_API_BASE=https://proxy.houndshield.com/v1" />)
  await userEvent.click(screen.getByRole('button', { name: /copy/i }))
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
    'OPENAI_API_BASE=https://proxy.houndshield.com/v1'
  )
})
```

**Total test targets: 15 Playwright E2E + 10 RTL unit tests = 25 tests minimum**
All must pass before any PR is opened.

---

## 📋 PR SPECIFICATION

**Branch:** `feature/beast-ui-v3`
**Base:** `main`
**Title:** `feat: BEAST UI v3 — [describe what was built]`

**PR Description template:**
```markdown
## BEAST UI v3 — [Component/Page Name]

### What was built
- [Specific items]

### Design reference
- Approved palette: #81A6C6 / #AACDDC / #F3E3D0 / #D2C4B4
- Logo: 3D metallic v2, white bg baked in, no invert filter
- Font: Fraunces (display) + DM Sans (body)

### Tests
- [ ] All Playwright tests passing
- [ ] All RTL unit tests passing
- [ ] TypeScript: 0 errors (npx tsc --noEmit)
- [ ] ESLint: 0 errors (npx next lint)
- [ ] Lighthouse Performance ≥ 92
- [ ] Lighthouse Accessibility ≥ 96

### Logo usage verified
- [ ] Logo on white bg: no filter applied ✓
- [ ] Logo on cream bg: drop-shadow only ✓
- [ ] Logo on steel/navy bg: wordmark-only OR contained white panel ✓
- [ ] No filter: brightness(0) invert(1) anywhere ✓

### Mobile verified (375px)
- [ ] Nav drawer opens ✓
- [ ] Pricing stacks 1-col ✓
- [ ] CTAs full-width ✓
- [ ] ThreatFeed visible ✓
```

---

## 📣 EXECUTION SEQUENCE — PER SESSION

FORGE executes in this exact order. Does not stop. Does not skip.
Each step is done only when output is verified, not when code is written.

```
STEP  AGENT    ACTION                                             VERIFY
────  ───────  ─────────────────────────────────────────────────  ───────────────────────────────
 1    FORGE    Read /mnt/skills/public/frontend-design/SKILL.md  Confirm read, summarize key rules
 2    FORGE    Read globals.css current state                     Identify what CSS vars already exist
 3    FORGE    Merge full CSS variable set (Section: Color System) npx tsc --noEmit clean
 4    FORGE    Verify Fraunces + DM Sans registered in fonts.ts   Build succeeds, fonts load
 5    FORGE    Build / update component(s) for this session       Component renders in browser
 6    FORGE    Build / update page(s) for this session            Page loads, all sections visible
 7    FORGE    Mobile audit at 375px                              No layout breaks, CTAs full-width
 8   GUARDIAN  Logo audit: correct treatment on all bg types      No inverted 3D logo anywhere
 9   GUARDIAN  Run all tests (Playwright + RTL)                  All passing, zero failures
10   GUARDIAN  TypeScript check                                   0 errors
11   GUARDIAN  ESLint check                                       0 errors
12   GUARDIAN  Lighthouse audit                                   Perf ≥ 92, A11y ≥ 96
13    FORGE    Open PR per specification                          PR URL delivered in SITREP
14    SCRIBE   SITREP delivered                                   All fields filled, no blanks
```

---

## ✅ DONE CRITERIA — ALL MUST BE SIMULTANEOUSLY TRUE

A task is DONE when:

```
[ ] Page/component loads on Vercel preview with zero console errors
[ ] All tests passing (Playwright E2E + RTL unit) — GUARDIAN has run them
[ ] Lighthouse ≥ 92 performance
[ ] Lighthouse ≥ 96 accessibility
[ ] HoundShield 3D logo visible in nav AND footer
[ ] Logo treatment correct per bg type (NO invert filter on 3D render)
[ ] Canonical pricing correct ($0/$199/$499/$999/$2,499)
[ ] Annual toggle shows correct discounted prices ($159/$399/$799/$1,999)
[ ] CountdownTimer ticking toward Nov 10, 2026
[ ] ThreatFeed animating
[ ] ComparisonFlow animating
[ ] Mobile 375px: nav drawer works, pricing stacks, CTA full-width
[ ] TypeScript: npx tsc --noEmit — zero errors
[ ] ESLint: npx next lint — zero errors
[ ] PR opened with all Lighthouse scores in PR description
[ ] SITREP delivered in full
```

If ANY item above fails, FORGE and GUARDIAN fix it. No exceptions.
No partial delivery. No "I'll handle that in the next session."
The deliverable is the finished product.

---

## 📊 SITREP FORMAT

```
════════════════════════════════════════════════════════════
HOUNDSHIELD — BEAST UI v3 — SESSION END SITREP
════════════════════════════════════════════════════════════
SESSION DATE:  [date]
TASK:          [what was built]

ATLAS STATUS:    Brand system applied ✓
FORGE STATUS:    [N]/[N] steps complete ✓
GUARDIAN STATUS: [N]/[N] tests passing ✓

PAGES / COMPONENTS SHIPPED:
  [list each]

LOGO AUDIT:
  White bg:        No filter — ✓
  Cream bg:        drop-shadow only — ✓
  Steel/Navy bg:   Wordmark-only / contained panel — ✓
  Invert filter:   NOT used anywhere — ✓

LIGHTHOUSE:
  [page]: Perf [X] | A11y [X] | BP [X] | SEO [X]

TESTS:
  Playwright: [N]/[N] passing
  RTL:        [N]/[N] passing
  TS errors:  0
  ESLint:     0

PR URL: [URL]
PREVIEW URL: [URL]

NEXT SESSION:
  → [Next priority item]
  → MRR today: $[X] | Day [N] of 30 | [N] days to Nov 10 deadline
════════════════════════════════════════════════════════════
```

---

*HOUNDSHIELD BEAST UI MASTER PROMPT — v3.0*
*Operation HOUND | HERMES GODMODE | ATLAS + FORGE + GUARDIAN + SCRIBE*
*Entire project scope. All pages. Logo v2 (3D metallic). Palette locked.*
*v3.0 | 2026-05-20*
*GitHub: https://github.com/thecelestialmismatch/HoundShield.git*
*Live: https://www.houndshield.com*
*Design reference: HoundShield Landing Page v3 (approved)*
*Boil the ocean. Premium light only. The standard is "holy shit, that's done."*
*The window closes November 10, 2026.*
