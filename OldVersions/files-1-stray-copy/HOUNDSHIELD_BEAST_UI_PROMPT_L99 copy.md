# ████████████████████████████████████████████████████████████████████
# HOUNDSHIELD — BEAST UI/UX OVERHAUL PROMPT — L99 PREMIUM EDITION
# Operation HOUND | HERMES GODMODE | MOSSAD-Level Design Directive
# ATLAS + FORGE + GUARDIAN + SCRIBE Joint Session
# Premium Light Mode Only | Full OODA | Ocean Boiled | v2.0 | 2026-05-19
# ████████████████████████████████████████████████████████████████████

> **HOW TO USE:**
> 1. Open a new Claude session
> 2. Paste HERMES GODMODE Master Prompt as your FIRST message
> 3. Paste THIS ENTIRE FILE as your SECOND message
> 4. HERMES activates ATLAS + FORGE + GUARDIAN + SCRIBE in joint session
> 5. The answer is the finished product. Not a plan. Not a mockup. The thing itself.
>
> OODA: Observe (read all context) → Orient (understand the premium light standard)
> → Decide (execute the 22-step sequence) → Act (ship, test, PR, deploy)
>
> Marginal cost of completeness is near zero. Do the whole thing. Do it right.
> The standard is not "good enough." The standard is: a Fortune 500 CISO opens
> houndshield.com on their MacBook Pro and says "wire me in."

---

## 🎯 PRIME MISSION DIRECTIVE — ATLAS + FORGE JOINT SESSION

**TASK:** Premium light-mode UI/UX overhaul of https://www.houndshield.com

**3 OPTIONS → 1 SELECTION → 1 DEPLOYED PR**
All 3 options are premium light mode. No dark mode variants.
The founder selects one by replying "Ship Option [1/2/3]".
The selected option ships to `/` immediately via PR → merge → Vercel deploy.

**QUALITY BAR — non-negotiable:**
This is not a SaaS startup homepage. This is the face of a company that
stands between classified US defense data and the public internet.
The visual language must communicate: precision, trust, institutional permanence.
Reference bar: Palantir.com × Stripe.com × Linear.app — but warmer, more human.
A C3PAO auditor, a DoD contracting officer, and a Series A investor must all
look at it and immediately understand: this is the real deal.

**WHY LIGHT MODE ONLY:**
Jordan (IT Security Manager, DoD contractor) uses a MacBook in a fluorescent-lit
government facility. She evaluates vendors on a 13" screen during her lunch break.
Dark mode reads as "hacker tool." Light mode reads as "enterprise software."
The warmth of --hs-cream against the precision of --hs-steel is the brand.
Do not touch dark mode. Do not offer it. This is the call.

---

## 🎨 BRAND SYSTEM — COMPLETE & LOCKED

### Logo
```
File:            /public/houndshield-logo.png
Format:          PNG, black silhouette on transparent (confirmed)
Subject:         Doberman head inside shield — front-facing, alert, authoritative
```

**Logo usage law — light mode:**
- On white (#FAFCFF) or near-white backgrounds: logo full black (default, no filter)
- On --hs-cream (#F3E3D0) sections: logo full black (sufficient contrast)
- On --hs-steel (#81A6C6) backgrounds: logo white (filter: brightness(0) invert(1))
- On --hs-navy (#0D1B2A) — only used as accent in the comparison section: logo white
- MINIMUM nav size: 32px height — never smaller
- MINIMUM footer lockup: 48px height
- ALWAYS paired with wordmark "HoundShield" — never logo alone in primary placements
- Wordmark font: var(--font-display), weight regular (the serif creates gravitas)
- Logo + wordmark spacing: 10px gap, vertically centered
- Logo appears in: nav bar, footer lockup, OG image, favicon, loading state
- OG image spec: 1200×630px, --hs-white bg, logo centered at 120px, wordmark below,
  tagline "Local AI compliance for DoD contractors" in --hs-ink at 24px

### Color System — COMPLETE SPECIFICATION
```css
/* ─── GLOBALS.CSS — FULL VARIABLE SET — PASTE VERBATIM ─── */
:root {
  /* ── BRAND PALETTE (sourced from founder) ── */
  --hs-steel:          #81A6C6;   /* Primary — CTAs, links, active states */
  --hs-sky:            #AACDDC;   /* Secondary — hover fills, soft highlights */
  --hs-cream:          #F3E3D0;   /* Warm bg — alternating sections, testimonials */
  --hs-sand:           #D2C4B4;   /* Muted — secondary borders, placeholder text */

  /* ── EXTENDED (derived, do not override) ── */
  --hs-white:          #FAFCFF;   /* Page background — primary */
  --hs-ink:            #0F1E2E;   /* All body text on light bg */
  --hs-ink-secondary:  #3D5166;   /* Secondary text, captions, descriptions */
  --hs-ink-tertiary:   #6B8299;   /* Placeholder, disabled, metadata */
  --hs-navy:           #0D1B2A;   /* Dark accent — comparison section bg only */
  --hs-steel-dark:     #5A86A8;   /* Hover state for --hs-steel elements */
  --hs-steel-light:    #C5DAE9;   /* Very light steel — bg fills, chips */
  --hs-cream-deep:     #EDD5BC;   /* Deeper cream — hover on cream sections */
  --hs-sand-light:     #E8DDD1;   /* Light sand — table rows, zebra stripe */

  /* ── SURFACES ── */
  --hs-surface-0:      #FAFCFF;   /* Page bg */
  --hs-surface-1:      #F5F8FB;   /* Card bg on white sections */
  --hs-surface-2:      #F3E3D0;   /* Section bg variant (cream) */
  --hs-surface-3:      #EDD5BC;   /* Deeper section bg variant */

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
  --hs-success:        #059669;   /* PASSED — green (high contrast on white) */
  --hs-success-bg:     #ECFDF5;   /* Success chip background */
  --hs-danger:         #DC2626;   /* BLOCKED — red (high contrast on white) */
  --hs-danger-bg:      #FEF2F2;   /* Danger chip background */
  --hs-warn:           #D97706;   /* Warning — amber (high contrast on white) */
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

  /* ── RADIUS ── */
  --radius-sm:   6px;    /* badges, chips, tags */
  --radius-md:   10px;   /* buttons, inputs */
  --radius-lg:   14px;   /* cards */
  --radius-xl:   20px;   /* large cards, panels */
  --radius-pill: 999px;  /* pills, toggles */
}
```

**Color usage law — 10 commandments:**
1. Page background is ALWAYS `--hs-surface-0` (#FAFCFF) — never pure white (#fff)
2. Alternating sections use `--hs-surface-2` (cream) — creates warmth without weight
3. Primary CTA: `--hs-steel` bg + white text + `--shadow-cta` — always, no exceptions
4. Ghost CTA: transparent bg + `--hs-border-strong` border + `--hs-ink` text
5. Card borders: `var(--hs-border)` at rest; `var(--hs-border-strong)` on hover
6. Body text: `--hs-ink` primary, `--hs-ink-secondary` descriptive, `--hs-ink-tertiary` meta
7. Never raw Tailwind color tokens in className — always CSS variables via style prop or module
8. The comparison section (local vs cloud) is the ONLY place `--hs-navy` appears as bg
9. Section titles use `--hs-ink`, never `--hs-steel` — brand color is accent, not dominant
10. Pricing featured card: `--hs-steel` top-border 3px + `--hs-steel-light` bg tint

---

## 🖋️ TYPOGRAPHY SYSTEM — PREMIUM EVOLUTION

```css
/* next.config.ts — font registration */
import { Fraunces, DM_Sans } from 'next/font/google'

export const displayFont = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'WONK'],          // Fraunces variable axes for optical refinement
  weight: ['300', '400', '500'],   // Light for refinement, regular for headings
  style: ['normal', 'italic'],     // Italic for pull quotes, callouts
  display: 'swap',
  variable: '--font-display',
})

export const bodyFont = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  variable: '--font-body',
})
```

**Why Fraunces over DM Serif Display:**
Fraunces is an optical-size variable serif — it has a deliberate "wonky" optical
quality that makes it feel artisanal and human at large sizes, while reading
as clean and authoritative at body sizes. It communicates: we are a craft
operation that takes compliance seriously, not a faceless SaaS widget factory.
DM Serif Display is fine. Fraunces is memorable. Jordan's CISO will remember it.

```
TYPESCALE (all in rem, base 16px):

--text-2xs:  0.6875rem  / 1.4   (10px — legal, footnotes)
--text-xs:   0.75rem    / 1.4   (12px — badges, labels, metadata)
--text-sm:   0.8125rem  / 1.55  (13px — captions, secondary body)
--text-base: 0.9375rem  / 1.7   (15px — primary body copy)
--text-lg:   1.0625rem  / 1.6   (17px — lead paragraphs)
--text-xl:   1.25rem    / 1.45  (20px — card titles)
--text-2xl:  1.5rem     / 1.35  (24px — sub-headings)
--text-3xl:  2rem        / 1.25  (32px — section titles desktop)
--text-4xl:  2.75rem     / 1.15  (44px — hero sub-heading desktop)
--text-5xl:  3.75rem     / 1.05  (60px — hero H1 desktop)
--text-hero: 5rem        / 1.0   (80px — maximum impact — use once)

Mobile:
--text-5xl:  2.5rem     / 1.1   (40px mobile)
--text-4xl:  1.875rem   / 1.2   (30px mobile)
--text-3xl:  1.5rem     / 1.3   (24px mobile)
```

**Typography law:**
- H1 hero: Fraunces 300 (light) — the thinness reads as confidence, not weakness
- H2 section titles: Fraunces 400 (regular)
- Eyebrow labels: DM Sans 600, 11px, letter-spacing 0.1em, `--hs-steel`, UPPERCASE
- Body primary: DM Sans 400, --text-base, --hs-ink
- Body secondary: DM Sans 300, --text-sm, --hs-ink-secondary
- Button text: DM Sans 500, --text-sm, letter-spacing 0.01em
- Nav links: DM Sans 400, --text-sm, --hs-ink-secondary → --hs-ink on hover
- Mono (code blocks, proxy URLs): JetBrains Mono 400, --text-sm
- Pull quotes: Fraunces 400 italic, --text-xl, --hs-ink-secondary
- NEVER mix display and body in the same text node

---

## 📐 LAYOUT SYSTEM — PRECISION GRID

```
Container:      max-width 1200px, padding 0 32px (desktop), 0 20px (mobile)
Nav:            height 64px fixed (desktop), 56px (mobile)
Section pad:    120px top/bottom (desktop L), 80px (desktop M), 56px (tablet), 40px (mobile)
Card pad:       28px (desktop), 20px (tablet), 16px (mobile)
Grid gaps:      32px (desktop), 20px (mobile)
Columns:        12-column grid (features: 4-col spans, pricing: 3-col)

Spacing scale (4px base — no magic numbers):
4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96, 120, 160

Breakpoints:
--bp-sm:  640px   (mobile landscape)
--bp-md:  768px   (tablet)
--bp-lg:  1024px  (desktop)
--bp-xl:  1280px  (large desktop)
--bp-2xl: 1536px  (wide)
```

**Layout law:**
- No symmetry for symmetry's sake — use deliberate asymmetry to create visual tension
- Every section has a clear anchor element (a number, a headline, an icon) — never blank
- The comparison section breaks out of the container intentionally — full-bleed --hs-navy
- Hero is ALWAYS split: text-left + visual-right on desktop; stacked on mobile
- Pricing is horizontal on desktop — never vertical stacked (too much scroll for Jordan)

---

## 🏗️ COMPLETE PAGE ARCHITECTURE — ALL 3 OPTIONS

### SECTION 0: SEO + META (all options identical)
```tsx
// app/(landing)/v[N]/page.tsx — metadata export
export const metadata: Metadata = {
  title: 'HoundShield — Stop Your Team From Leaking CUI to ChatGPT',
  description: 'Local-only AI compliance firewall for DoD contractors. Intercepts CUI before it leaves your network. CMMC Level 2, DFARS 7012, SOC 2. <10ms latency. One URL to deploy.',
  keywords: ['CMMC compliance', 'CUI protection', 'AI DLP', 'DFARS 7012', 'ChatGPT compliance', 'DoD contractor AI'],
  openGraph: {
    title: 'HoundShield — Local AI Compliance Firewall',
    description: 'Stop your team from leaking CUI to ChatGPT. 16 detection engines. <10ms. Nothing leaves your network.',
    url: 'https://houndshield.com',
    siteName: 'HoundShield',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'HoundShield — AI compliance for DoD contractors' }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: '...', description: '...', images: ['/og-image.png'] },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://houndshield.com' },
}
```

**JSON-LD schema (add to <head> on all options):**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "HoundShield",
  "description": "Local AI compliance firewall for DoD contractors — stops CUI from reaching ChatGPT and other AI tools",
  "applicationCategory": "SecurityApplication",
  "operatingSystem": "Any",
  "offers": [
    { "@type": "Offer", "name": "Free", "price": "0", "priceCurrency": "USD" },
    { "@type": "Offer", "name": "Pro", "price": "199", "priceCurrency": "USD", "billingIncrement": "month" },
    { "@type": "Offer", "name": "Growth", "price": "499", "priceCurrency": "USD", "billingIncrement": "month" }
  ]
}
```

---

### SECTION 1: NAVIGATION
```
STRUCTURE:
[Logo 32px] [HoundShield — Fraunces]    [Product] [Pricing] [Resources] [Blog]    [Sign In] [Start Free Trial →]

BEHAVIOR:
- Default: transparent bg, no border
- After 80px scroll: bg rgba(250,252,255,0.92) + backdrop-blur(12px) + border-bottom 1px --hs-border
- Logo + wordmark = left anchor, always
- Nav links: DM Sans 400 --text-sm --hs-ink-secondary → --hs-ink on hover, 200ms transition
- "Sign In": ghost, no border, --hs-ink-secondary text
- "Start Free Trial →": --hs-steel bg, white text, --radius-md, --shadow-sm, hover: --hs-steel-dark + translateY(-1px)
- ACTIVE state: --hs-ink color + 2px bottom border --hs-steel (on current route)
- MOBILE (< 768px): hamburger icon (Menu from Lucide), slide-down drawer full-width
  Drawer bg: --hs-surface-0, border-bottom --hs-border, links stacked 48px height each
  CTA in drawer: full-width, --hs-steel, 52px height
- Skip nav: first element, sr-only until :focus, then visible at top of page
```

---

### SECTION 2: HERO — SPLIT LAYOUT

```
STRUCTURE (desktop):
LEFT 55%:
  [Eyebrow badge]
  [H1]
  [Sub copy]
  [Primary CTA] [Ghost CTA]
  [Trust signal row]

RIGHT 45%:
  [<ThreatFeed /> animated widget]

COPY (verbatim — do not paraphrase, do not truncate):
Eyebrow:  "CMMC Level 2  ·  DFARS 7012  ·  HIPAA  ·  SOC 2"
          (each framework separated by · divider, all in one badge)

H1:       "Stop your team from leaking CUI to ChatGPT"
          Fraunces 300 (light), --text-5xl desktop / --text-4xl mobile
          "CUI" rendered in Fraunces 400 italic, --hs-steel color
          Breaking as: "Stop your team / from leaking CUI / to ChatGPT"

Sub:      "Local-only AI compliance firewall. Intercepts every prompt before
          it leaves your network. 16 detection engines. <10ms latency.
          One proxy URL to deploy."
          DM Sans 300, --text-lg, --hs-ink-secondary, line-height 1.6

CTA primary:   "Start Free Trial — No Card Required"
               --hs-steel bg, white, --radius-md, height 52px, padding 0 28px
               Arrow icon (ArrowRight from Lucide), 16px, margin-left 8px
               Hover: --hs-steel-dark bg + --shadow-cta + translateY(-2px)
               Transition: all 250ms --ease-out

CTA ghost:     "Watch 2-Min Demo ▶"
               transparent, --hs-border-strong border, --hs-ink text, same height
               Hover: --hs-mist-md bg + border --hs-steel

Trust row:     4 items, DM Sans 400 --text-xs --hs-ink-secondary
               CheckCircle2 icon from Lucide, 14px, --hs-success color
               "Nothing leaves your network"
               "<10ms scan latency"
               "49/49 tests passing"
               "One URL to deploy"

BACKGROUND:
  Page bg --hs-surface-0
  Very subtle grain texture (5% opacity SVG noise filter) — adds premium tactility
  No gradients in hero bg — restraint is the premium signal
  Optional: faint radial gradient from right-center, rgba(129,166,198,0.04), 800px radius
```

---

### SECTION 3: SOCIAL PROOF STRIP

```
STRUCTURE: Full-width strip, --hs-surface-2 (cream) bg, 40px top/bottom padding

4 STATS, displayed as: [Number] [Label] with thin vertical dividers between them

Stats:
  "16"              "Detection Engines"
  "~80,000"         "DoD Contractors At Risk"
  "Nov 2026"        "CMMC Enforcement Deadline"
  "<10ms"           "Scan Latency"

Numbers: Fraunces 400 --text-4xl --hs-ink
Labels:  DM Sans 400 --text-sm --hs-ink-secondary
Divider: 1px --hs-border, height 40px, vertically centered

ANIMATION (IntersectionObserver, triggered once on enter):
  Numbers count up from 0 in 1.2s ease-out
  "~80,000" counts to 80000 with ~ prefix rendered separately
  "Nov 2026" fades in word by word (no counter)
  "<10ms" counts from 100 down to 10 then snaps to "<10ms"
  Stagger: 100ms between each stat

MOBILE: 2×2 grid, dividers become horizontal
```

---

### SECTION 4: ASYMMETRIC ADVANTAGE (THE DIFFERENTIATOR)

```
THIS IS THE MOST IMPORTANT SECTION ON THE PAGE.
Every other DLP tool is architecturally compromised. This section proves it.
Make it impossible to unsee.

STRUCTURE:
Full-width section, --hs-navy (#0D1B2A) bg — the ONLY dark section on the page.
This break in the visual rhythm signals: pay attention, this is different.

LEFT COLUMN (40%): Copy
  Eyebrow: "THE ARCHITECTURAL PROBLEM" — DM Sans 600, --text-xs, --hs-sky, letter-spacing 0.15em
  H2: "Every other tool makes the problem worse." — Fraunces 300, white, --text-3xl
  Body: (verbatim)
    "Every cloud-based AI DLP tool sends your CUI to their servers to scan it.
     That's itself a potential CUI spill under DFARS 7012.
     HoundShield scans everything locally. Nothing leaves your network."
  DM Sans 300, white rgba(255,255,255,0.75), --text-base, line-height 1.7

RIGHT COLUMN (60%): <ComparisonFlow /> animated SVG diagram

COMPARISON FLOW COMPONENT SPEC:
  Two flows rendered side by side, labeled:
  LEFT flow (red × — competitor):
    [User] → [Prompt] → [Cloud DLP Server ⚠ CUI SPILL] → [AI Model]
    Animated data packets flow left-to-right, red color
    At "Cloud DLP Server": packet pulses red, explosion animation, "DFARS 7012 VIOLATION" badge
    Background: slightly lighter than --hs-navy

  RIGHT flow (green ✓ — HoundShield):
    [User] → [HoundShield Local Proxy 🛡] → [AI Model]
    Animated data packets flow left-to-right, --hs-sky color
    At "HoundShield": packet gets a green shield overlay, "CUI BLOCKED LOCALLY" badge
    Background: same

  Packet animation: CSS @keyframes, translateX, every 2.5s, staggered between flows
  On mobile: flows stack vertically, competitor on top, HoundShield below

BOTTOM: Two-column feature list on dark background
  Left:  ✗ Competitor sends your CUI to their cloud    ✗ You're trusting their security
         ✗ Another company now has your data            ✗ Audit trail lives on their servers
  Right: ✓ HoundShield scans locally, nothing exits    ✓ You own the audit log
         ✓ DFARS 7012 compliant by design               ✓ C3PAO audit PDF in one click
  X color: rgba(248,113,113,0.8) | ✓ color: --hs-sky
```

---

### SECTION 5: FEATURES GRID

```
STRUCTURE: --hs-surface-0 bg, 6-feature grid (2 rows × 3 cols desktop, 1 col mobile)

Header:
  Eyebrow: "WHAT'S INSIDE" — --hs-steel
  H2: "Built for the audit. Not for the demo." — Fraunces 400 --hs-ink
  Sub: DM Sans 300, "Every feature maps to a NIST SP 800-171 control."

6 FEATURE CARDS:
[Card layout: icon (32px) → title (DM Sans 600 --text-xl) → body (DM Sans 300 --text-sm)]

  1. "100% Local Scanning"
     Icon: Server (Lucide)
     Body: "Zero bytes of your prompts or CUI reach our servers or any external service.
            Your data stays inside your perimeter. Always."

  2. "C3PAO-Ready PDF Reports"
     Icon: FileCheck (Lucide)
     Body: "One click generates a formatted audit document citing specific NIST SP 800-171
            Rev 2 controls. Your assessor has seen exactly this format before."

  3. "Zero-Friction Deployment"
     Icon: Zap (Lucide)
     Body: "Change one proxy URL in your AI tool configuration.
            No agents to install. No re-training required. Live in under 10 minutes."

  4. "OODA Behavioral Engine"
     Icon: Activity (Lucide)
     Body: "Detects behavioral policy drift before it becomes a spill.
            The system learns your team's patterns and flags anomalies in real time."

  5. "16 CUI Detection Patterns"
     Icon: Shield (Lucide)
     Body: "Contracts, technical drawings, export control codes, PII, ITAR,
            FOUO classifications, and more — all matched locally against your prompts."

  6. "Brain AI Compliance Advisor"
     Icon: Brain (Lucide)
     Body: "Ask any CMMC question. Get answers with exact NIST control citations.
            Your team's compliance knowledge base, always available, always current."

CARD STYLE:
  Default: --hs-surface-1 bg, 1px --hs-border border, --radius-lg, --shadow-card
  Hover: --hs-surface-0 bg, --hs-border-strong border, translateY(-3px), --shadow-md
  Transition: all 300ms --ease-out
  Icon container: 44px × 44px, --hs-mist-md bg, --radius-md, icon --hs-steel 20px
```

---

### SECTION 6: HOW IT WORKS — 3-STEP PROCESS

```
STRUCTURE: --hs-surface-2 (cream) bg, 3 steps horizontal on desktop / vertical mobile

Header:
  Eyebrow: "DEPLOYMENT" — --hs-steel
  H2: "Live in ten minutes. Audited in ten seconds." — Fraunces 400 --hs-ink

STEP LAYOUT: Large step number + title + body + connector line between steps

  Step 1: "Configure" — step number "01" Fraunces 300 --text-hero --hs-sand (oversized, decorative)
    Title: "Change one URL" — DM Sans 600 --text-xl --hs-ink
    Body:  "Set your AI tool's API base URL to your HoundShield proxy endpoint.
            Claude, GPT-4, Gemini — any OpenAI-compatible model. Done."
    Visual: Code block showing the one-line config change in JetBrains Mono

  Step 2: "Intercept"
    Number: "02"
    Title: "Every prompt scanned locally"
    Body:  "HoundShield intercepts every outbound prompt. 16 detection engines run
            in parallel. Blocked prompts return a policy violation message.
            Passed prompts are forwarded in <10ms."
    Visual: Mini ThreatFeed showing one BLOCK and two PASS events

  Step 3: "Report"
    Number: "03"
    Title: "Audit PDF on demand"
    Body:  "Every violation logged with timestamp, user, prompt hash, matched pattern,
            and NIST control reference. One click generates the C3PAO-ready PDF."
    Visual: Mock PDF thumbnail (static SVG, no real data)

CONNECTOR: Horizontal dashed line (--hs-border) between steps, with Arrow on desktop
           Hidden on mobile (vertical layout speaks for itself)

CODE BLOCK in Step 1:
  bg: --hs-navy, --radius-md, padding 16px 20px
  Text in JetBrains Mono --text-sm white
  Content:
    # Before — sending to OpenAI directly
    OPENAI_BASE_URL=https://api.openai.com/v1

    # After — routed through HoundShield
    OPENAI_BASE_URL=https://proxy.houndshield.com/v1
  Syntax: comment lines --hs-sand, values --hs-sky
  Copy button (Copy from Lucide, 14px) in top-right corner of block
```

---

### SECTION 7: THE JORDAN SECTION (BUILT FOR HER)

```
STRUCTURE: --hs-surface-0 bg, asymmetric layout — large quote left, details right

PURPOSE: This is the conversion section for the exact person who buys.
         Jordan needs to see herself in the page.

LEFT (60%): Large pull quote
  Fraunces 400 italic, --text-3xl, --hs-ink-secondary
  "I needed the PDF I could hand my C3PAO assessor.
   HoundShield gave me that PDF."
  Attribution below: "— IT Security Manager, 180-person DoD prime contractor"
  DM Sans 400 --text-sm --hs-ink-tertiary

  Below quote: Two trust badges (static SVG):
    [Shield icon] "CMMC Level 2 Mapping"
    [FileCheck icon] "NIST SP 800-171 Rev 2 Citations"

RIGHT (40%): Jordan's profile card
  Card: --hs-surface-2 bg, --radius-xl, --shadow-lg, padding 28px
  Header: "Built for Jordan"
  Eyebrow: DM Sans 600 --text-xs --hs-steel "YOUR BUYER PROFILE"

  Profile rows (icon + label + value):
    Role:      IT Security Manager
    Company:   50–250 person DoD contractor
    Fear:      Failing CMMC assessment from a ChatGPT incident
    Goal:      The audit PDF her C3PAO assessor accepts
    Budget:    $0–$1K/mo unilateral authority
    Timeline:  November 2026 enforcement deadline

  Bottom CTA in card:
    "Jordan signs up in 4 minutes. Start free →"
    --hs-steel text, ArrowRight icon, no bg — inline link style
```

---

### SECTION 8: PRICING

```
STRUCTURE: --hs-surface-2 (cream) bg

Header:
  Eyebrow: "PRICING" — --hs-steel
  H2: "Start free. Pay when it saves your contract." — Fraunces 400 --hs-ink
  Sub: "No card required for free tier. Annual billing saves 20%."

ANNUAL TOGGLE:
  [Monthly] [Annual — Save 20%]
  Toggle: pill switch, --hs-steel active bg, --radius-pill
  On Annual: prices update in-place with fade transition (Framer Motion AnimatePresence)
  "Save 20%" badge appears next to Pro plan when Annual selected

5 PLAN CARDS (horizontal row):

PLAN SPECIFICATION:
┌─────────────────────────────────────────────────────────────────────────────┐
│  Free         Pro [FEATURED]    Growth         Enterprise      Agency       │
│  $0/mo        $199/mo           $499/mo        $999/mo         $2,499/mo    │
│               ($159 annual)     ($399 annual)  ($799 annual)   ($1,999 annual) │
│  <500 req/day Unlimited scans   Multi-team     Custom SLA      C3PAO/MSP    │
│  1 user       1–5 users         5–25 users     25+ users       Reseller     │
│  Basic report C3PAO PDF report  SIEM export    Dedicated CSM   White-label  │
│               Brain AI access   Priority queue Onboarding      Volume terms │
└─────────────────────────────────────────────────────────────────────────────┘

FEATURED CARD (Pro):
  - 3px top border --hs-steel
  - bg: white (pops off --hs-cream section bg)
  - "MOST POPULAR" badge: --hs-steel bg, white text, --radius-pill, 10px, above card
  - --shadow-xl (elevated above siblings)
  - CTA button: --hs-steel bg, white, full-width, --radius-md
  - scale(1.02) on desktop to visually elevate it

OTHER CARDS:
  - bg: --hs-surface-1, 1px --hs-border border
  - CTA button: ghost style
  - hover: border → --hs-border-strong, --shadow-md

FEATURES LIST per card:
  Rendered as: [CheckCircle2 --hs-success 14px] [feature text DM Sans 400 --text-sm]
  3–5 features per plan, most impactful features first

FAQ ACCORDION (below pricing, 6 questions):
  Q1: "Does the free tier scan my actual prompts?"
  Q2: "How does the proxy deployment work exactly?"
  Q3: "What happens when a CUI violation is blocked?"
  Q4: "Is this DFARS 7012 compliant?"
  Q5: "Can I use this with Azure OpenAI, not OpenAI directly?"
  Q6: "How long until I have a C3PAO-ready report?"

  Style: Each Q = full-width row, --hs-border-bottom, ChevronDown icon, rotates on open
  Answer: DM Sans 300 --text-sm --hs-ink-secondary, padding 16px 0, expandable
  Animation: height transition 250ms --ease-out
```

---

### SECTION 9: COUNTDOWN + URGENCY CTA

```
STRUCTURE: --hs-surface-0 bg, centered, maximum visual weight

This section uses the CMMC November 10, 2026 enforcement date.
The urgency is real. The deadline is real. Treat it accordingly.

COUNTDOWN TIMER (component: <CountdownTimer targetDate="2026-11-10" />):
  Displays: [DDD] days [HH] hours [MM] minutes [SS] seconds
  Number style: Fraunces 300, --text-5xl, --hs-ink
  Label style: DM Sans 400, --text-xs, --hs-ink-tertiary, UPPERCASE, letter-spacing 0.1em
  Updates every second via setInterval, useEffect
  Layout: 4 units in a row, thin vertical dividers
  On mobile: 2×2 grid

Copy above timer:
  Eyebrow: "THE WINDOW IS CLOSING" — --hs-steel
  H2: "CMMC Phase 2 enforcement begins November 10, 2026."
  Body: "C3PAOs are booked 18 months out. Assessment fees run $30K–$150K.
         The contractors who start now finish before the deadline.
         The ones who wait risk contract suspension."

CTA below timer:
  "Start Your Free Trial Today" — primary button, --hs-steel, height 56px, padding 0 40px
  Sub-cta: "No card required. Takes 4 minutes." — DM Sans 300 --text-sm --hs-ink-tertiary

LOGO TREATMENT:
  HoundShield Doberman logo at 80px height, above the eyebrow, centered
  Slight opacity 0.12 as a watermark behind the countdown numbers (decorative, not primary)
```

---

### SECTION 10: FOOTER

```
STRUCTURE: --hs-surface-2 (cream) bg — bookends with the stats strip above, warm closure

TOP ROW: Logo lockup + tagline (left) | Newsletter signup (right)
  Logo: 48px height + "HoundShield" Fraunces 400 --text-xl --hs-ink
  Tagline: DM Sans 300 --text-sm --hs-ink-secondary "Local AI compliance for DoD contractors"
  Newsletter: "Get CMMC updates" — email input + "Subscribe" button
  Input: --hs-surface-0 bg, 1px --hs-border, --radius-md, height 40px
  Button: --hs-steel bg, white, height 40px, --radius-md

COLUMNS (3):
  Product:   Overview | Pricing | How It Works | Changelog | Roadmap
  Company:   About | Blog | Security | Press | Careers
  Resources: Docs | API Reference | CMMC Guide | DFARS 7012 FAQ | C3PAO Finder

SOCIAL ROW:
  GitHub icon (from Lucide: Github) | LinkedIn icon | Twitter/X icon
  All: --hs-ink-tertiary, hover: --hs-steel, 20px

BOTTOM BAR: --hs-border-top 1px separator
  Left: "© 2026 HoundShield, Inc. All rights reserved."
  Right: Privacy Policy | Security | Terms of Service | Cookie Policy
  DM Sans 400 --text-xs --hs-ink-tertiary

COMPLIANCE BADGES ROW (between columns and bottom bar):
  [Shield icon] "CMMC Level 2 Mapping"  [FileText icon] "NIST SP 800-171 Rev 2"
  [Lock icon] "SOC 2 Type II (in progress)"  [CheckSquare icon] "DFARS 7012 Compliant"
  Static SVG badges, --hs-sand bg, --hs-border border, --radius-sm, padding 6px 12px
  DM Sans 400 --text-xs --hs-ink-secondary
```

---

## 🎭 THE 3 PREMIUM LIGHT OPTIONS — COMPLETE SPECIFICATIONS

### OPTION 1 — "PALIMPSEST"
**Concept:** Institutional permanence. This is the product used by people
who protect things that matter. The design language of a Federally Funded
Research and Development Center — precise, authoritative, permanent.
Reference: The feeling of an NIST publication, if it were a beautiful product.

**Distinguishing visual choices:**
- Background texture: very subtle linen texture (CSS `background-image: url("data:image/svg+xml,...")`) — 2% opacity, barely perceptible, adds tactility
- Hero H1 treatment: "CUI" in a slightly heavier Fraunces + italic, underlined with a 2px --hs-steel line (not text-decoration — a real `::after` pseudo-element below)
- Section dividers: full-width 1px --hs-border lines + a centered diamond ornament in --hs-sand
- Stats strip: each stat has a thin rule above the number (like a table header)
- Feature cards: no rounded corners — `--radius-sm` (6px) only — feels more institutional
- Comparison section: the dark section uses a subtle crosshatch SVG pattern instead of flat navy — like a classified document's border
- Pricing: horizontal layout with subtle alternating row tints on feature lists
- Typography hierarchy very strict — H1 only in --text-5xl, no oversized decorative numbers
- Motion: everything fades in at opacity — no translateY. Precision, not playfulness.
- "What makes it unforgettable": the linen texture + diamond ornaments + strict type grid. You feel like you're reading an official document. Jordan's CISO will approve this on the spot.

---

### OPTION 2 — "CARTOGRAPHER"
**Concept:** The people who built this product mapped the threat landscape
and found the gap no one else saw. This design visualizes that: data, precision,
the confidence of people who have done the reconnaissance.
Reference: Bloomberg Terminal aesthetics translated into light mode.
The warmth of physical maps + the precision of financial data visualization.

**Distinguishing visual choices:**
- Hero background: very faint topographic contour lines in --hs-sand (SVG pattern, 4% opacity) — suggests terrain mapping, reconnaissance
- Hero H1: split onto 3 lines intentionally, each line a slightly different weight (300, 400, 300) — typographic rhythm
- Stats strip: each stat displayed in a bordered "table cell" with thin hairline borders — data table aesthetic
- Feature section: features displayed as a numbered list (`01.` `02.`...) instead of cards — like a military checklist
- Comparison section: the data-flow animation uses a map-pin metaphor — prompts as "locations," the local/cloud split shown on a horizontal "territory" diagram
- Color accent: --hs-steel used sparingly, maximum 15% of the page area — the absence makes it pop when it appears
- Pricing: displayed as a data table on desktop — rows for features, columns for plans, checkmarks in --hs-success
- Jordan section: her profile displayed as a "dossier card" — classified file aesthetic, --hs-cream bg with manila folder texture
- CTA section: countdown timer displayed in monospace font (JetBrains Mono) — like a mission clock
- Motion: elements slide in from left (like pages turning), 40px offset, staggered 80ms
- "What makes it unforgettable": the topographic hero + dossier Jordan card + mission-clock countdown. Feels like you're in an intelligence operation. The product matches the aesthetic.

---

### OPTION 3 — "MERIDIAN"
**Concept:** The warmest of the three. This is the option that makes Jordan
feel safe — not intimidated. The Doberman is still alert, but the palette
breathes. Premium in the way a private wealth management firm is premium:
considered, unhurried, earning your trust through quality rather than authority.
Reference: Stripe × Notion × a well-funded fintech.

**Distinguishing visual choices:**
- Background: full use of the cream warmth — hero has a very subtle gradient from --hs-surface-0 (top) to --hs-surface-2 cream (bottom), so the page "warms up" as you scroll
- Hero H1: very large, very light (Fraunces 300) — 5rem — with generous line-height 1.1. Feels like a magazine cover.
- Hero visual: instead of just ThreatFeed widget, the entire right side is a mock product screenshot (static, styled as a browser window chrome + dashboard UI inside) — shows the actual app
- Stats strip: full --hs-steel bg — the only section where the brand color is the background. Numbers in white. High impact.
- Feature cards: rounded corners (`--radius-xl` — 20px) + shadows (`--shadow-lg`) + hover lifts 4px — tactile, friendly
- Comparison section: softer treatment — split-panel layout within the page (not full-bleed dark) with --hs-cream left side (HoundShield) and --hs-surface-1 right side (competitor), color-coded with borders
- Pricing: card-first layout, featured Pro card notably larger (scale(1.04)), rounded (`--radius-xl`), with a gradient border (linear-gradient using --hs-steel to --hs-sky)
- Jordan section: testimonial centered, large italic quote, minimal chrome — feels like a real human wrote it
- Footer: generous padding, large logo, warm --hs-cream bg
- Motion: every element springs in (--ease-spring cubic-bezier) with slight overshoot — playful but not childish. Scale from 0.97 → 1.00 + opacity.
- "What makes it unforgettable": the warm gradient scroll + the stats strip in full --hs-steel bg + the spring motion. The only one that feels warm AND enterprise. Converts the "I'm nervous about compliance" buyer.

---

## ⚙️ COMPLETE TECHNICAL IMPLEMENTATION

### File Structure
```
compliance-firewall-agent/
├── app/
│   ├── (landing)/
│   │   ├── layout.tsx                    ← landing layout (no dark class, light fonts)
│   │   ├── page.tsx                      ← current page (preserved — not touched)
│   │   ├── v1/
│   │   │   └── page.tsx                  ← Option 1: PALIMPSEST
│   │   ├── v2/
│   │   │   └── page.tsx                  ← Option 2: CARTOGRAPHER
│   │   └── v3/
│   │       └── page.tsx                  ← Option 3: MERIDIAN
│   └── fonts.ts                          ← Fraunces + DM Sans next/font config
├── components/
│   ├── landing/
│   │   ├── Nav.tsx                       ← NavV3 (shared, option-agnostic)
│   │   ├── Footer.tsx                    ← FooterV3 (shared)
│   │   ├── Hero.tsx                      ← Hero (props: variant 'palimpsest'|'cartographer'|'meridian')
│   │   ├── StatsStrip.tsx                ← Stats (props: variant)
│   │   ├── ComparisonSection.tsx         ← Asymmetric advantage (props: variant)
│   │   ├── FeaturesGrid.tsx              ← Features (props: variant)
│   │   ├── HowItWorks.tsx                ← 3-step process
│   │   ├── JordanSection.tsx             ← Built for Jordan
│   │   ├── PricingSection.tsx            ← Pricing + FAQ (props: variant)
│   │   └── CtaCountdown.tsx              ← Countdown + CTA
│   └── ui/
│       ├── ThreatFeed.tsx                ← Animated interception widget
│       ├── CountdownTimer.tsx            ← CMMC deadline countdown (client component)
│       ├── ComparisonFlow.tsx            ← Local vs cloud SVG animation
│       ├── PricingToggle.tsx             ← Monthly/annual toggle
│       ├── FaqAccordion.tsx              ← Pricing FAQ
│       └── CodeBlock.tsx                 ← Syntax-highlighted proxy URL block
├── public/
│   ├── houndshield-logo.png             ← Provided by founder
│   ├── og-image.png                     ← Generated (1200×630)
│   └── favicon.svg                      ← SVG favicon from logo
├── styles/
│   └── globals.css                      ← Full variable set from this prompt
└── tests/
    ├── landing.spec.ts                  ← 30 Playwright E2E tests
    └── components.spec.tsx              ← 12 React Testing Library unit tests
```

### Component Props Architecture
```typescript
// All section components accept a `variant` prop for option-specific styling
type LandingVariant = 'palimpsest' | 'cartographer' | 'meridian'

interface SectionProps {
  variant: LandingVariant
  className?: string
}

// Variant-specific class maps (no conditional inline styles — classes only)
const variantClasses: Record<LandingVariant, Record<string, string>> = {
  palimpsest:   { card: 'rounded-sm border-hs-border-ink', ... },
  cartographer: { card: 'rounded-md border-hs-border font-mono-numbers', ... },
  meridian:     { card: 'rounded-2xl border-hs-border shadow-lg', ... },
}
```

### Critical Tech Rules (from HERMES — inviolable)
```
✗ NEVER `transformStyle: "preserve-3d"` on motion.div → Framer crash
✗ NEVER `PlatformDashboard` with ssr: true → Recharts SSR crash
✗ NEVER `ANTHROPIC_API_KEY` → product uses OPENROUTER_API_KEY
✗ NEVER `git push origin main` without explicit founder "ship it"
✗ NEVER raw hex colors in className — always CSS variables
✗ NEVER inline styles for colors — CSS variables in globals.css + Tailwind arbitrary
✓ Max 500 lines per component — split above this (no exceptions)
✓ Only Lucide React for icons — never mix (no Heroicons, no FontAwesome)
✓ All client components (CountdownTimer, ThreatFeed): 'use client' directive at top
✓ All server components: default (no directive) — metadata exports work
✓ Framer Motion: variants + AnimatePresence only — no direct style mutations
✓ IntersectionObserver for scroll animations — no scroll event listeners
✓ `NEXT_PUBLIC_APP_URL` = `https://houndshield.com` everywhere
```

### Performance Contract
```
Hero images:        Next.js <Image> priority={true}, width + height explicit
Fonts:              next/font/google, display:'swap', preconnect in <head>
Animations:         will-change:transform only while animating → remove after
Layout shift:       ThreatFeed + CountdownTimer have explicit min-height containers
Bundle size:        No new dependencies without FORGE noting bundle delta
Code splitting:     All heavy animations lazy-loaded ('use client' + dynamic import)
Target scores:      Performance ≥ 92, Accessibility ≥ 96, Best Practices 100, SEO 100
```

### Accessibility Contract
```
Color contrast:     All text WCAG AA minimum — body text WCAG AAA
Focus states:       outline: 2px solid var(--hs-steel); outline-offset: 2px
Skip nav:           <a href="#main-content" class="sr-only focus:not-sr-only">Skip to content</a>
Reduced motion:     All @keyframes wrapped in @media (prefers-reduced-motion: no-preference)
Semantic HTML:      nav, main, section[aria-label], footer, h1 only once per page
Interactive:        All buttons/links have visible label or aria-label
Images:             All img tags have descriptive alt text (logo: alt="HoundShield")
CountdownTimer:     aria-live="polite" on the seconds digit only (not all 4 — too noisy)
ThreatFeed:         aria-label="Live prompt interception feed", role="log", aria-live="polite"
```

---

## 🧪 COMPLETE TEST SUITE — GUARDIAN EXECUTES ALL

### Playwright E2E (30 tests — all must pass before PR opens)
```typescript
// tests/landing.spec.ts
import { test, expect } from '@playwright/test'

const variants = [
  { route: '/v1', name: 'PALIMPSEST' },
  { route: '/v2', name: 'CARTOGRAPHER' },
  { route: '/v3', name: 'MERIDIAN' },
]

for (const { route, name } of variants) {
  test.describe(`${name} (${route})`, () => {

    // PRESENCE TESTS
    test('renders HoundShield logo', async ({ page }) => {
      await page.goto(route)
      await expect(page.locator('img[alt="HoundShield"]').first()).toBeVisible()
    })

    test('renders hero headline with CUI', async ({ page }) => {
      await page.goto(route)
      await expect(page.getByText(/leaking CUI/i)).toBeVisible()
    })

    test('renders canonical pricing $199', async ({ page }) => {
      await page.goto(route)
      await expect(page.getByText('$199')).toBeVisible()
    })

    test('renders canonical pricing $499', async ({ page }) => {
      await page.goto(route)
      await expect(page.getByText('$499')).toBeVisible()
    })

    test('renders comparison section', async ({ page }) => {
      await page.goto(route)
      await expect(page.getByText(/Nothing leaves your network/i)).toBeVisible()
    })

    test('renders countdown timer with days', async ({ page }) => {
      await page.goto(route)
      await expect(page.getByText(/days/i).first()).toBeVisible()
    })

    // INTERACTION TESTS
    test('primary CTA is clickable', async ({ page }) => {
      await page.goto(route)
      const cta = page.getByRole('button', { name: /start free trial/i }).first()
      await expect(cta).toBeVisible()
      await expect(cta).toBeEnabled()
    })

    test('annual pricing toggle works', async ({ page }) => {
      await page.goto(route)
      const toggle = page.getByRole('button', { name: /annual/i })
      await toggle.click()
      await expect(page.getByText('$159')).toBeVisible()
    })

    test('FAQ accordion opens and closes', async ({ page }) => {
      await page.goto(route)
      const faqBtn = page.getByText(/Does the free tier scan/i)
      await faqBtn.click()
      await expect(page.getByText(/actual prompts/i)).toBeVisible()
      await faqBtn.click()
    })

    // MOBILE TESTS
    test('mobile nav hamburger opens drawer', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.goto(route)
      await page.locator('[aria-label="Open navigation"]').click()
      await expect(page.locator('nav[data-mobile-open="true"]')).toBeVisible()
    })

    // SEO TESTS
    test('has correct page title', async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveTitle(/HoundShield/)
    })

    test('has meta description', async ({ page }) => {
      await page.goto(route)
      const meta = page.locator('meta[name="description"]')
      await expect(meta).toHaveAttribute('content', /CUI/)
    })

    // QUALITY TESTS
    test('no console errors on load', async ({ page }) => {
      const errors: string[] = []
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      expect(errors).toHaveLength(0)
    })

    test('no layout shift above 0.1 CLS', async ({ page }) => {
      await page.goto(route)
      const cls = await page.evaluate(() =>
        new Promise(resolve => {
          let cls = 0
          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) cls += (entry as any).value
            }
          }).observe({ entryTypes: ['layout-shift'] })
          setTimeout(() => resolve(cls), 3000)
        })
      )
      expect(cls).toBeLessThan(0.1)
    })
  })
}

// CROSS-VARIANT CONSISTENCY TESTS
test('all variants show same pricing', async ({ page }) => {
  for (const { route } of variants) {
    await page.goto(route)
    await expect(page.getByText('$199')).toBeVisible()
    await expect(page.getByText('$499')).toBeVisible()
    await expect(page.getByText('$999')).toBeVisible()
  }
})
```

### React Testing Library Unit Tests (12 tests)
```typescript
// tests/components.spec.tsx
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ThreatFeed } from '@/components/ui/ThreatFeed'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { PricingToggle } from '@/components/ui/PricingToggle'
import { FaqAccordion } from '@/components/ui/FaqAccordion'

describe('ThreatFeed', () => {
  it('renders LIVE ACTIVE status', () => {
    render(<ThreatFeed />)
    expect(screen.getByText(/ACTIVE/i)).toBeInTheDocument()
  })
  it('renders at least one BLOCKED entry', async () => {
    render(<ThreatFeed />)
    await screen.findByText(/BLOCKED/i)
  })
  it('renders latency in ms', async () => {
    render(<ThreatFeed />)
    await screen.findByText(/ms/)
  })
})

describe('CountdownTimer', () => {
  it('renders days, hours, minutes, seconds labels', () => {
    render(<CountdownTimer targetDate="2026-11-10" />)
    expect(screen.getByText(/days/i)).toBeInTheDocument()
    expect(screen.getByText(/hours/i)).toBeInTheDocument()
  })
  it('does not render negative numbers', () => {
    render(<CountdownTimer targetDate="2026-11-10" />)
    const numbers = screen.getAllByRole('timer')
    numbers.forEach(n => expect(parseInt(n.textContent || '0')).toBeGreaterThanOrEqual(0))
  })
})

describe('PricingToggle', () => {
  it('renders Monthly and Annual options', () => {
    render(<PricingToggle onChange={jest.fn()} value="monthly" />)
    expect(screen.getByText(/Monthly/i)).toBeInTheDocument()
    expect(screen.getByText(/Annual/i)).toBeInTheDocument()
  })
  it('calls onChange with "annual" on click', () => {
    const onChange = jest.fn()
    render(<PricingToggle onChange={onChange} value="monthly" />)
    fireEvent.click(screen.getByText(/Annual/i))
    expect(onChange).toHaveBeenCalledWith('annual')
  })
})

describe('FaqAccordion', () => {
  it('starts with all items collapsed', () => {
    render(<FaqAccordion />)
    expect(screen.queryByText(/set your AI tool/i)).not.toBeInTheDocument()
  })
  it('expands item on click', () => {
    render(<FaqAccordion />)
    fireEvent.click(screen.getByText(/proxy deployment/i))
    expect(screen.getByText(/set your AI tool/i)).toBeInTheDocument()
  })
  it('collapses item on second click', () => {
    render(<FaqAccordion />)
    const btn = screen.getByText(/proxy deployment/i)
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(screen.queryByText(/set your AI tool/i)).not.toBeInTheDocument()
  })
})
```

**Run all tests:**
```bash
# Unit tests
npx jest tests/components.spec.tsx --coverage

# E2E tests
npx playwright test tests/landing.spec.ts --reporter=list

# TypeScript check
npx tsc --noEmit

# ESLint
npx next lint

# All must be clean before PR. Zero failures. Zero exceptions.
```

---

## 📋 PR SPECIFICATION — COMPLETE

```markdown
Branch:  feature/ui-overhaul-l99-premium-light
Base:    main
Title:   feat: L99 premium light UI — 3 options at /v1 /v2 /v3

## Summary
Complete UI/UX overhaul. Premium light mode only. 3 design options
for founder selection. Each option is a full, production-ready landing page.

## Design Options
| Route | Name         | Concept                                      |
|-------|--------------|----------------------------------------------|
| /v1   | PALIMPSEST   | Institutional permanence. NIST-meets-product |
| /v2   | CARTOGRAPHER | Data precision. Intelligence map aesthetic   |
| /v3   | MERIDIAN     | Warm enterprise. Converts the nervous buyer  |

## Preview URLs
- PALIMPSEST:   [vercel-preview-url]/v1
- CARTOGRAPHER: [vercel-preview-url]/v2
- MERIDIAN:     [vercel-preview-url]/v3

## What Changed
### New components
- [ ] ThreatFeed — animated live intercept feed, 8 sample prompts rotating
- [ ] CountdownTimer — CMMC Nov 10 2026 deadline, live seconds
- [ ] ComparisonFlow — local vs cloud SVG animated data flow
- [ ] PricingToggle — monthly/annual with AnimatePresence price transition
- [ ] FaqAccordion — 6 FAQ items, height-animated expand/collapse
- [ ] CodeBlock — syntax-highlighted proxy URL block with copy button

### New layout components
- [ ] Nav (NavV3) — sticky scroll, mobile drawer, active route state
- [ ] Footer (FooterV3) — logo lockup, 3 columns, compliance badges

### New pages
- [ ] app/(landing)/v1/page.tsx — PALIMPSEST
- [ ] app/(landing)/v2/page.tsx — CARTOGRAPHER
- [ ] app/(landing)/v3/page.tsx — MERIDIAN

### Global changes
- [ ] styles/globals.css — full CSS variable system (31 variables)
- [ ] app/fonts.ts — Fraunces + DM Sans via next/font/google
- [ ] public/og-image.png — 1200×630 OG image generated
- [ ] public/favicon.svg — SVG favicon from logo

## Tests
- [ ] 30/30 Playwright E2E tests passing
- [ ] 12/12 React Testing Library unit tests passing
- [ ] TypeScript: 0 errors (npx tsc --noEmit)
- [ ] ESLint: 0 errors (npx next lint)
- [ ] Lighthouse /v1: Performance [X], Accessibility [X], SEO [X]
- [ ] Lighthouse /v2: Performance [X], Accessibility [X], SEO [X]
- [ ] Lighthouse /v3: Performance [X], Accessibility [X], SEO [X]

## What Was NOT Changed
- PlatformDashboard — untouched (ssr: false preserved)
- app/page.tsx — untouched (current live homepage preserved)
- proxy/server.ts — untouched (49/49 vitest passing)
- Stripe webhook logic — untouched
- Supabase auth — untouched
- Any file not listed above

## Founder Action Required
1. Open /v1, /v2, /v3 on the Vercel preview URL
2. Review on desktop AND mobile (375px)
3. Reply: "Ship Option [1/2/3]"
4. HERMES will:
   a. Copy winning page.tsx to app/(landing)/page.tsx
   b. Delete the other two routes
   c. Open a second PR: "feat: deploy winning landing [option name]"
   d. You approve → merge → live on houndshield.com in 3 minutes
```

---

## 📣 EXECUTION SEQUENCE — 22 STEPS, ALL MUST COMPLETE

FORGE does not stop. Does not table. Does not partial-deliver.
Each step marked done only when output is verified — not when code is written.

```
STEP  AGENT    ACTION                                           VERIFY
────  ───────  ───────────────────────────────────────────────  ──────────────────────────────
 1    FORGE    Read frontend-design SKILL.md in full            Confirm read
 2    FORGE    Add full CSS variable set to globals.css          npx tsc --noEmit clean
 3    FORGE    Register Fraunces + DM Sans via next/font         Fonts load in browser
 4    FORGE    Build ThreatFeed component                        3 unit tests pass
 5    FORGE    Build CountdownTimer component                    2 unit tests pass
 6    FORGE    Build ComparisonFlow SVG animation                Renders in browser
 7    FORGE    Build PricingToggle with AnimatePresence          2 unit tests pass
 8    FORGE    Build FaqAccordion                                3 unit tests pass
 9    FORGE    Build CodeBlock with copy function                Copy works in browser
10    FORGE    Build NavV3 (sticky, mobile drawer, active state) Mobile nav test passes
11    FORGE    Build FooterV3 (logo, columns, badges)            Logo visible, links present
12    FORGE    Build PALIMPSEST page at /v1 (all 10 sections)   10 E2E tests pass for /v1
13    FORGE    Build CARTOGRAPHER page at /v2 (all 10 sections) 10 E2E tests pass for /v2
14    FORGE    Build MERIDIAN page at /v3 (all 10 sections)     10 E2E tests pass for /v3
15    FORGE    Generate og-image.png (1200×630)                  File exists in /public
16    FORGE    Generate favicon.svg from logo                    Renders in browser tab
17   GUARDIAN  Run all 42 tests (30 E2E + 12 unit)              42/42 passing, zero failures
18   GUARDIAN  Lighthouse audit /v1, /v2, /v3                   All ≥ 92 perf, ≥ 96 a11y
19   GUARDIAN  TypeScript check — npx tsc --noEmit              Zero errors
20   GUARDIAN  ESLint check — npx next lint                     Zero errors
21   GUARDIAN  Cross-browser check (Chrome, Safari, Firefox)    No visual regressions
22    FORGE    Open PR per specification above                   PR URL in SITREP
```

---

## 🔒 SECURITY — GUARDIAN ALWAYS ENFORCED

```
✓ No new env vars without adding placeholder to .env.example
✓ No API keys or secrets in any component file
✓ All external links: rel="noopener noreferrer"
✓ No user input on landing page pages (read-only content)
✓ OG image generated statically — no dynamic content in meta tags
✓ No localStorage or sessionStorage usage in landing pages
✓ CSP headers not broken by new inline styles or script tags
✓ No new npm dependencies without FORGE noting bundle size delta
```

---

## ✅ DONE CRITERIA — ALL MUST BE TRUE

The overhaul is DONE when ALL of the following are simultaneously true:

```
[ ] /v1, /v2, /v3 all load on Vercel preview URL with no errors
[ ] All 42 tests passing (30 Playwright + 12 RTL) — GUARDIAN has run them
[ ] Lighthouse ≥ 92 performance on all 3 options
[ ] Lighthouse ≥ 96 accessibility on all 3 options
[ ] HoundShield logo visible in nav AND footer on all 3 options
[ ] Logo correctly styled: black on white sections, white on navy section
[ ] Canonical pricing ($0/$199/$499/$999/$2,499) correct on all 3 options
[ ] Annual toggle shows 20% discount ($159/$399/$799) correctly
[ ] Countdown timer ticking on all 3 options (correct target: Nov 10 2026)
[ ] ThreatFeed animating on all 3 options
[ ] ComparisonFlow animating on all 3 options
[ ] Mobile (375px): nav drawer opens, pricing stacks, CTA full-width — all 3
[ ] TypeScript: npx tsc --noEmit — zero errors
[ ] ESLint: npx next lint — zero errors
[ ] PR opened with all Lighthouse scores filled in PR description
[ ] SITREP below delivered in full
```

If ANY item above fails, FORGE and GUARDIAN fix it. No exceptions.
The deliverable is the finished product.
The standard is: "Holy shit, that's done."

---

## 📊 SITREP FORMAT — DELIVER AT SESSION END

```
════════════════════════════════════════════════
HOUNDSHIELD UI OVERHAUL — L99 — SESSION END SITREP
════════════════════════════════════════════════
ATLAS STATUS:    Design system implemented ✓
FORGE STATUS:    22/22 steps complete ✓
GUARDIAN STATUS: 42/42 tests passing ✓

PREVIEW URLs:
  PALIMPSEST   /v1: [URL]
  CARTOGRAPHER /v2: [URL]
  MERIDIAN     /v3: [URL]

LIGHTHOUSE SCORES:
  /v1: Perf [X] | A11y [X] | BP [X] | SEO [X]
  /v2: Perf [X] | A11y [X] | BP [X] | SEO [X]
  /v3: Perf [X] | A11y [X] | BP [X] | SEO [X]

TESTS: 30/30 Playwright | 12/12 RTL | 0 TS errors | 0 ESLint errors
PR: [PR URL]

WHAT TO DO NOW:
  1. Open all 3 preview URLs on desktop + phone
  2. Pick your option
  3. Reply: "Ship Option [1/2/3]"
  4. HERMES ships it to houndshield.com in one PR

NEXT SESSION:
  → After founder selects option: merge winner to main, delete others
  → Then: wire Brain AI (OPENROUTER_API_KEY unblocked?)
  → MRR today: $[X] | Day [N] of 30 | [N] days to $5K deadline
════════════════════════════════════════════════
```

---

*HOUNDSHIELD BEAST UI PROMPT — L99 PREMIUM LIGHT EDITION*
*Operation HOUND | HERMES GODMODE | ATLAS + FORGE + GUARDIAN + SCRIBE*
*v2.0 | 2026-05-19*
*GitHub: https://github.com/thecelestialmismatch/HoundShield.git*
*Live: https://www.houndshield.com*
*Boil the ocean. Premium light only. The standard is "holy shit, that's done."*
*The window closes November 10, 2026. Every day without this live is money left on the table.*
