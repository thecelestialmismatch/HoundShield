# houndshield Landing Page — Complete Spec + Copy
# Design: flat, dark, security-professional. No gradients. No orbs. No glassmorphism.

---

## DESIGN TOKENS

```css
/* Remove ALL of these from current implementation */
/* No: gradient backgrounds, glassmorphism, purple-to-blue, floating orbs, */
/* decorative blurs, fake dashboard mockups, fake testimonials, animations */

/* Replace with: */
--bg-primary: #0a0a0f;          /* Near-black — security product, not a consumer app */
--bg-secondary: #111118;        /* Slightly lighter — card backgrounds */
--bg-border: #1e1e2e;           /* Subtle borders */
--accent: #2563eb;              /* Electric blue — serious, not playful */
--accent-hover: #1d4ed8;
--text-primary: #f8fafc;        /* Near-white */
--text-secondary: #94a3b8;      /* Muted — secondary labels */
--text-muted: #64748b;          /* Hints, captions */
--success: #10b981;             /* Emerald — covered/passed */
--warning: #f59e0b;             /* Amber — warning */
--danger: #ef4444;              /* Red — blocked/failed */

/* Typography */
font-family: 'IBM Plex Sans', sans-serif;
/* Why IBM Plex Sans: government + enterprise associations (IBM), excellent readability,
   free on Google Fonts, conveys technical credibility over Inter which feels startup-y */

font-size-base: 16px;
line-height-body: 1.6;
line-height-heading: 1.2;
```

---

## SECTION 1: NAVIGATION

```
[Logo: houndshield wordmark — no icon, no shield emoji, just clean text]

Navigation links: How It Works | Compliance | Pricing | Docs | Blog
CTA: [Deploy Free Trial] — accent bg, white text
```

No sticky nav animations. No scroll effects. Just a clean, readable nav bar.

---

## SECTION 2: HERO (above the fold)

**Headline:**
```
Your employees are sending contracts to ChatGPT.
houndshield stops it — before it leaves your network.
```

**Why this headline works:**
- Specific scenario (not abstract "AI security")
- Creates fear without being alarmist
- States the solution in one clause
- No buzzwords

**Subheadline:**
```
houndshield is an inline AI proxy that intercepts every ChatGPT, Claude, and Copilot request, 
scans for CUI, PII, and secrets in under 10ms, and logs everything your CMMC auditor needs — 
without sending a byte of your data to our servers.
```

**Primary CTA:**
```
[Deploy in 30 Minutes →]
```
Links to: /docs/quickstart (Docker Compose one-liner)

**Trust signal (one number, real and verifiable):**
```
CMMC Level 2 deadline: November 10, 2026
76,598 defense contractors need to comply.
98.6% aren't there yet.
Is your AI usage covered?
```

**Design:** No hero image. No 3D illustration. Plain dark background. Headline in large type (60px+). Subheadline in 20px. CTA button is the only colored element above the fold.

---

## SECTION 3: PROOF BAR (immediately below hero)

One row of 4 stat cards. No icons. Numbers only. Sources cited below each number.

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│      77%        │ │     $5.2M       │ │   Nov 10, 2026  │ │     <10ms       │
│ of employees    │ │ average cost of │ │ CMMC Level 2    │ │ detection       │
│ paste work data │ │ an AI-related   │ │ deadline for    │ │ latency         │
│ into AI tools   │ │ data breach     │ │ defense         │ │ overhead        │
│                 │ │                 │ │ contractors     │ │                 │
│ [Source: IBM]   │ [IBM Cost of     │ [DoD CMMC.mil]   │ [houndshield     │
└─────────────────┘  Breach 2024]    └─────────────────┘  benchmark]      │
                   └─────────────────┘                    └─────────────────┘
```

---

## SECTION 4: HOW IT WORKS (3 steps)

No fake screenshots. Text only until there's a real product screenshot.

**Section header:**
```
One proxy URL. No code changes. Running in 30 minutes.
```

**Step 1:**
```
Point your AI tools at houndshield

Change one environment variable: OPENAI_BASE_URL=https://proxy.houndshield.local
Every AI request — ChatGPT, Claude, Copilot, whatever your team uses — routes through 
houndshield first. No code changes. No new infrastructure. One line.
```

**Step 2:**
```
houndshield scans every prompt, locally

CUI markings. SSNs. Contract numbers. CAGE codes. API keys. houndshield catches them 
in under 10 milliseconds, redacts or blocks based on your policy, and logs everything 
with a tamper-evident audit trail. Your data never touches our servers.
```

**Step 3:**
```
Pass your CMMC audit

Download your evidence package. Hand it to your C3PAO assessor. 
CMMC Practices AC.1.001, SC.3.187, AU.2.041, and 7 others: covered.
The AI governance gap in your assessment, closed.
```

---

## SECTION 5: FEATURE GRID (6 features — specific, no generic icons)

```
CMMC Level 2 Mapping
10 practices covered automatically. Compliance score updates in real time. 
Evidence package ready for your C3PAO.

Local-Only Processing
All scanning runs on your server. No prompt ever reaches houndshield's infrastructure. 
Deployable air-gapped. CUI stays CUI.

Under 10ms Detection
Presidio-powered PII/PHI/CUI detection in under 10 milliseconds at P99. 
Your employees won't notice it's there.

Tamper-Evident Audit Log
SHA-256 hash chain. Every prompt, every response, every policy action, logged. 
3-year retention. CMMC AU.2.041 satisfied.

Works With Every AI Tool
OpenAI. Anthropic. Azure OpenAI. GitHub Copilot. Ollama. 
Not just one vendor's ecosystem — all of them, simultaneously.

MSP White-Label Ready
CMMC consultants: resell houndshield to your clients. 
30% recurring revenue. Your brand. Zero deployment overhead.
```

---

## SECTION 6: PRICING

**Section header:**
```
Simpler than hiring a CMMC consultant.
Cheaper than failing an assessment.
```

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│      STARTER        │  │   PROFESSIONAL      │  │     ENTERPRISE      │
│      $299/mo        │  │     $799/mo         │  │   From $2,500/mo    │
│   ($2,990/yr)       │  │   ($7,990/yr)       │  │                     │
│                     │  │                     │  │                     │
│  Up to 5 users      │  │  Up to 25 users     │  │  Unlimited users    │
│  1M prompts/month   │  │  10M prompts/month  │  │  Unlimited prompts  │
│  CMMC Level 2       │  │  CMMC + SOC2 + HIPAA│  │  All frameworks     │
│  Audit logging      │  │  Shadow AI discovery│  │  Air-gapped support │
│  Docker Compose     │  │  Slack/Teams alerts │  │  Custom SLA         │
│  Email support      │  │  Helm chart         │  │  Named CSM          │
│                     │  │  Priority support   │  │  On-site assistance │
│  [Start Free Trial] │  │  [Start Free Trial] │  │  [Talk to Sales]    │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
                                  ↑
                         RECOMMENDED (highlighted with accent border)
```

**Below pricing table:**
```
MSP/RPO Partners: 30% revenue share. White-label. Unlimited tenants. [Partner with us →]
```

---

## SECTION 7: FOOTER

```
houndshield                          Product              Company
                                     Pricing              About
Local-only AI compliance firewall    Documentation        Blog
for defense contractors and          Changelog            Contact
regulated enterprises.               GitHub (open source)

[SOC 2 Type I in progress]           CMMC Coverage        Privacy Policy
[FIPS 140-2 Architecture]            Trust & Security     Terms of Service

© 2026 houndshield. All rights reserved.
Built for the Defense Industrial Base.
```

---

## DESIGN ENFORCEMENT

**Remove from current implementation immediately:**
- ALL gradient backgrounds (purple-to-blue, any gradient)
- ALL glassmorphism effects (backdrop-blur, semi-transparent panels)
- ALL floating orbs or circular decorative elements
- ALL fake testimonials or fake customer quotes
- ALL fake dashboard mockups or wireframe screenshots
- ALL CSS animations that serve no functional purpose
- ALL decorative particle effects or mesh gradients
- ALL emoji used as section icons or decorative elements

**One-pass audit test:** Show the landing page to someone who doesn't know houndshield. Ask: "What does this product do?" If they can't answer in 10 seconds, the copy failed. Rewrite.

---

## COLORS TO USE

```css
/* Background */
background: #0a0a0f;

/* Nav */
nav { background: #0a0a0f; border-bottom: 1px solid #1e1e2e; }

/* CTA button */
.cta { background: #2563eb; color: white; border-radius: 6px; padding: 12px 24px; }
.cta:hover { background: #1d4ed8; }

/* Cards */
.card { background: #111118; border: 1px solid #1e1e2e; border-radius: 8px; }

/* Recommended tier */
.card.recommended { border-color: #2563eb; }

/* Text */
h1, h2, h3 { color: #f8fafc; }
p, li { color: #94a3b8; }
```

---

## FONT IMPLEMENTATION

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

<style>
  body {
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 16px;
    line-height: 1.6;
    color: #94a3b8;
    background: #0a0a0f;
  }

  h1 { font-size: clamp(36px, 5vw, 64px); line-height: 1.15; color: #f8fafc; font-weight: 700; }
  h2 { font-size: clamp(28px, 4vw, 48px); line-height: 1.2; color: #f8fafc; font-weight: 600; }
  h3 { font-size: clamp(18px, 2.5vw, 24px); line-height: 1.3; color: #f8fafc; font-weight: 600; }

  /* Vertical rhythm: every section has 80px top/bottom padding on desktop, 48px on mobile */
  section { padding: clamp(48px, 8vw, 80px) 0; }
</style>
```
