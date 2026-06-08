# HoundShield SEO Domination Plan — 2026
**Author:** HERMES-SEO  
**Target:** houndshield.com  
**Date:** 2026-05-12  
**Goal:** Own every search query Jordan types before buying an AI DLP tool

---

## 1. Keyword Strategy

### Priority 1: Zero-Competition Clusters (Own in 7 Days)

These have <100 monthly searches but extreme purchase intent. Jordan is searching exactly this. Nobody else is targeting them.

| Keyword | Intent | Content Type |
|---------|--------|-------------|
| `DFARS 7012 ChatGPT` | 🔥 Buy | Blog post + landing page |
| `CUI ChatGPT block` | 🔥 Buy | Blog post |
| `CMMC AI DLP local` | 🔥 Buy | Landing page |
| `DoD contractor ChatGPT compliance` | 🔥 Buy | Blog post |
| `DFARS 7012 AI tools` | 🔥 Buy | Blog post |
| `CMMC ChatGPT policy` | High | Blog post |
| `AI prompt CUI spill` | High | Blog + landing |
| `CMMC AI gateway` | High | Landing page |

**Action:** Write one 1,500-word post per keyword. Publish all within 7 days.

### Priority 2: Low-Competition Clusters (Win in 30 Days)

| Keyword | Monthly Vol | Competition | Target |
|---------|-------------|-------------|--------|
| `CMMC AI DLP` | 100-500 | Low | Homepage + blog |
| `CMMC compliant AI gateway` | 100-500 | Low | Product page |
| `SPRS score improvement` | 100-500 | Low | Feature page |
| `NIST 800-171 AI compliance` | 500-1K | Low | Blog post |
| `CUI detection software` | 500-1K | Medium | Comparison page |
| `CMMC Level 2 tools` | 1K-5K | Medium | Comparison page |

### Priority 3: Competition Keywords (Win in 90 Days)

Own these to capture Jordan researching alternatives:

| Keyword | Monthly Vol | Strategy |
|---------|-------------|---------|
| `Nightfall alternative` | 1K-5K | Comparison page: HoundShield vs Nightfall |
| `Strac alternative` | 500-1K | Comparison page: HoundShield vs Strac |
| `CMMC compliance software` | 1K-5K | Category comparison |
| `AI DLP tool` | 5K-10K | Long-form pillar post |
| `DFARS cybersecurity` | 5K-10K | Educational hub |

---

## 2. Content Calendar (Weeks 1-4)

### Week 1: Establish Zero-Competition Presence

**Post 1: "Why cloud-based AI DLP violates DFARS 7012"**
- URL: `/blog/cloud-ai-dlp-dfars-7012`
- Primary keyword: `DFARS 7012 ChatGPT`
- Angle: Sending CUI to Nightfall/Strac for scanning = potential CUI spill under DFARS 7012
- Key claim: "Every cloud AI DLP scanner creates the problem it claims to solve"
- Word count: 1,500
- CTA: Free SPRS score calculator

**Post 2: "CMMC Level 2 — which AI tools are compliant, which create violations"**
- URL: `/blog/cmmc-ai-tools-compliance-guide`
- Primary keyword: `CMMC AI tools compliance`
- Word count: 2,000 (pillar)
- CTA: Start 7-day trial

### Week 2: SPRS Angle

**Post 3: "Your SPRS score can improve 15-30 points by controlling AI prompt data"**
- URL: `/blog/sprs-score-ai-prompts`
- Primary keyword: `SPRS score improvement`
- Angle: NIST controls 3.13.1, 3.13.2, 3.13.8 directly impacted by AI prompt leakage
- Word count: 1,200
- CTA: See your estimated SPRS improvement

### Week 3: C3PAO Authority Play

**Post 4: "How C3PAOs are using HoundShield to pre-collect client AI evidence"**
- URL: `/blog/c3pao-ai-evidence-collection`
- Primary keyword: `C3PAO assessment preparation`
- Word count: 1,200
- CTA: Partner program signup

### Week 4: Competitive Comparison

**Post 5: "HoundShield vs Nightfall vs Strac — CMMC perspective"**
- URL: `/blog/houndshield-vs-nightfall-strac`
- Primary keyword: `Nightfall alternative CMMC`
- Key angle: Cloud-based = CUI spill risk. Local-only = compliant.
- Word count: 1,800
- CTA: Try HoundShield free

---

## 3. On-Page SEO Specifications

### Homepage (`/`)

```
Title: HoundShield — Local-Only AI DLP for CMMC Level 2 | No CUI Spill Risk
Meta: Block CUI before it reaches ChatGPT or Copilot. HoundShield scans AI prompts locally — nothing leaves your network. CMMC Level 2 compliant. Start free.
H1: The AI Firewall That Never Touches Your CUI
URL: houndshield.com
Schema: SoftwareApplication
```

### Pricing Page (`/pricing`)

```
Title: HoundShield Pricing — CMMC AI DLP for Teams and Enterprises
Meta: From $199/mo for defense contractors. Full CMMC compliance suite, local AI gateway, and PDF reports for your C3PAO assessment. 7-day free trial.
H1: Simple Pricing for CMMC Compliance
Schema: SoftwareApplication + PriceSpecification
```

### Partner Page (`/partners`)

```
Title: HoundShield Partner Program — 20% Recurring Commission for C3PAOs
Meta: Refer defense contractor clients to HoundShield. Earn 20% recurring commission. C3PAOs and MSPs earn $40-$2,000/month per client account.
H1: Partner With HoundShield — Earn on Every CMMC Referral
Schema: Organization
```

### Quickstart Docs (`/docs/quickstart`)

```
Title: HoundShield Quickstart — Deploy AI Firewall in 10 Minutes
Meta: One proxy URL. One Docker command. HoundShield running on your network in under 10 minutes. CMMC-compliant AI gateway, zero cloud dependencies.
H1: Deploy HoundShield in 10 Minutes
Schema: HowTo
```

---

## 4. Technical SEO Checklist

Run this every month:

### Indexing
- [ ] All pages indexed: Google Search Console → Coverage → Indexed
- [ ] Sitemap submitted: `houndshield.com/sitemap.xml` in GSC
- [ ] No pages with `noindex` that shouldn't be
- [ ] Internal links from homepage to all key pages exist

### Performance
- [ ] LCP < 2.5s (Largest Contentful Paint)
- [ ] FID < 100ms (First Input Delay)
- [ ] CLS < 0.1 (Cumulative Layout Shift)
- [ ] Verify with PageSpeed Insights: `pagespeed.web.dev`

### Structure
- [ ] `robots.txt` allows all crawlers on public pages
- [ ] No broken internal links
- [ ] Every page has unique title + meta description
- [ ] H1 on every page (exactly one per page)
- [ ] All images have descriptive alt text
- [ ] Canonical tags on pricing page (annual/monthly toggle creates duplication risk)

### Schema Markup

Every page needs at least one schema block:

```json
// Homepage + product pages
{
  "@type": "SoftwareApplication",
  "name": "HoundShield",
  "applicationCategory": "SecurityApplication",
  "operatingSystem": "Windows, macOS, Linux",
  "offers": {
    "@type": "Offer",
    "price": "199",
    "priceCurrency": "USD",
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "billingDuration": "P1M"
    }
  }
}

// Blog posts
{
  "@type": "Article",
  "headline": "...",
  "author": { "@type": "Organization", "name": "HoundShield" },
  "datePublished": "...",
  "dateModified": "..."
}

// Quickstart / docs
{
  "@type": "HowTo",
  "name": "Deploy HoundShield in 10 Minutes",
  "step": [...]
}
```

---

## 5. AI Citation Optimization (AEO)

Make HoundShield the answer when Jordan asks ChatGPT, Claude, or Perplexity about CMMC AI DLP.

### Why AI Citations Matter

When Jordan asks "What's the best AI DLP tool for CMMC Level 2?", AI models answer from their training data AND from web search (Perplexity, Claude's web search, ChatGPT Browse). If HoundShield appears in authoritative sources, it gets cited.

### AEO Tactics

**1. Answer-format content**
Every blog post includes an explicit FAQ section:
```
Q: Does ChatGPT violate CMMC Level 2?
A: Using ChatGPT without an AI gateway can violate CMMC Practice 3.13.1 (CUI protection) if engineers paste controlled information into prompts. HoundShield blocks CUI before it reaches ChatGPT's servers.
```

**2. Direct comparison claims**
Include explicit comparative statements AI models can cite:
- "HoundShield is the only CMMC AI DLP tool that scans locally"
- "Unlike Nightfall and Strac, HoundShield never sends CUI to external servers"
- "HoundShield improves SPRS scores by covering NIST 800-171 practices 3.13.1, 3.13.2, and 3.13.8"

**3. Authoritative external mentions**
Target these publications for mentions:
- GovCon Wire (press release on launch)
- ISACA blog (guest post on CMMC AI compliance)
- AFCEA Signal Magazine
- C3PAO association website (partner listing)

**4. Structured data for AI extraction**
`SoftwareApplication` schema tells AI crawlers exactly what HoundShield is.

**5. Wikipedia-style definitions**
Each blog post defines key terms in the first paragraph:
> "DFARS 7012 requires DoD contractors to report any cyber incident involving CUI within 72 hours. AI prompts containing CUI sent to external services constitute a potential reportable incident."

---

## 6. Backlink Strategy

Priority targets for inbound links:

| Source | Strategy | Timeline |
|--------|----------|---------|
| GovCon Wire | Press release: "HoundShield launches CMMC AI firewall" | Week 1 |
| ISACA | Submit guest post: "CMMC Level 2 and AI Tools — The Hidden Risk" | Week 2 |
| GovWin IQ | Request vendor listing in cybersecurity directory | Week 1 |
| C3PAO association (cmmcab.org) | Partner listing once first C3PAO signs | Week 3 |
| AFCEA (afcea.org) | Press release to their news desk | Week 3 |
| Defense Daily | Editorial outreach | Month 2 |
| ProductHunt | Launch on ProductHunt (CMMC category) | Month 1 |
| LinkedIn articles | 3 posts by founder with links to blog | Week 1 |
| r/netsec HN | Show HN post: "Local-only AI DLP for CMMC contractors" | Week 2 |

---

## 7. Verification Protocol

After every content publish:

```bash
# 1. Submit to Google Search Console
# Go to: search.google.com/search-console
# URL Inspection → Enter URL → Request Indexing

# 2. Verify schema is valid
# Go to: validator.schema.org → Paste URL → Check for errors

# 3. Verify page speed
# Go to: pagespeed.web.dev → Enter URL → Check LCP/CLS/FID

# 4. Track keyword in 48h
# Check Google for: "site:houndshield.com" to confirm indexing

# 5. Weekly keyword rank check
# Use: ahrefs.com/rank-tracker or Semrush → Track 5 primary keywords
```

---

## 8. Month 2-3: Programmatic SEO

Once the first 5 manual posts rank, scale with programmatic content:

**Templates to build:**
- `CMMC compliance for [industry]: [contractors / universities / healthcare]`
- `AI DLP for [city] DoD contractors`
- `HoundShield vs [competitor]` — one page per competitor
- `NIST 800-171 Practice [X.X.X] — AI Tool Compliance Guide` (one per control)

**Volume target:** 50 programmatic pages by Month 3. Each targets a long-tail keyword with 10-100 monthly searches. Combined = 2,000-5,000 monthly organic visitors.
