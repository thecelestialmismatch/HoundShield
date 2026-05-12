# houndshield SEO Remediation Plan
# Zero-budget. CMMC-specific. Wins fast because competition is non-existent.

---

## WHY SEO MATTERS FOR HOUNDSHIELD SPECIFICALLY

General "AI security" keywords are dominated by Palo Alto, CrowdStrike, IBM. We cannot compete there. But CMMC-specific AI keywords have near-zero competition. An IT Director at a defense contractor Googling "CMMC AI tools compliance" gets zero relevant results today. We own that keyword in 90 days if we start now.

---

## TECHNICAL SEO — FIX IMMEDIATELY (Week 1)

### Meta Tags (add to every page)

```html
<!-- Home page -->
<title>houndshield — AI Compliance Proxy for CMMC Level 2 Defense Contractors</title>
<meta name="description" content="Stop CUI leaks through AI tools. houndshield intercepts ChatGPT, Claude, and Copilot requests, scans locally in <10ms, and generates CMMC Level 2 evidence your C3PAO accepts. Deploy in 30 minutes.">
<meta name="keywords" content="CMMC AI compliance, AI DLP defense contractor, CUI protection AI tools, CMMC Level 2 AI governance">

<!-- Open Graph -->
<meta property="og:title" content="houndshield — AI Compliance for CMMC">
<meta property="og:description" content="One proxy URL. CMMC Level 2 AI compliance in 30 minutes. Your data never leaves your network.">
<meta property="og:image" content="https://houndshield.com/og-image.png">
<meta property="og:type" content="website">
<meta property="og:url" content="https://houndshield.com">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="houndshield — AI Compliance for CMMC">
<meta name="twitter:description" content="Stop CUI leaks through AI tools. CMMC Level 2 compliance in 30 minutes.">
```

### Schema Markup

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "houndshield",
  "applicationCategory": "SecurityApplication",
  "description": "AI proxy for CMMC Level 2 compliance. Intercepts and scans AI prompts for CUI, PII, and secrets. Local processing — no data exfiltration.",
  "url": "https://houndshield.com",
  "offers": {
    "@type": "Offer",
    "price": "299",
    "priceCurrency": "USD",
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "price": "299",
      "priceCurrency": "USD",
      "unitCode": "MON"
    }
  },
  "operatingSystem": "Linux, Windows, macOS",
  "applicationSubCategory": "Compliance Software",
  "featureList": "CMMC Level 2, SOC 2, HIPAA, PII detection, CUI protection, audit logging"
}
```

### Sitemap.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://houndshield.com/</loc><priority>1.0</priority></url>
  <url><loc>https://houndshield.com/pricing</loc><priority>0.9</priority></url>
  <url><loc>https://houndshield.com/docs</loc><priority>0.8</priority></url>
  <url><loc>https://houndshield.com/blog</loc><priority>0.7</priority></url>
  <url><loc>https://houndshield.com/trust</loc><priority>0.8</priority></url>
  <!-- Add all blog posts as they publish -->
</urlset>
```

### robots.txt

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /command-center/
Sitemap: https://houndshield.com/sitemap.xml
```

### Core Web Vitals Targets

| Metric | Target | How to Hit It |
|---|---|---|
| LCP (Largest Contentful Paint) | <2.5s | No large hero images. IBM Plex Sans from Google Fonts with `display=swap`. |
| FID (First Input Delay) | <100ms | Minimal JavaScript above the fold. No animations blocking main thread. |
| CLS (Cumulative Layout Shift) | <0.1 | Set explicit width/height on all images. No dynamically injected content above fold. |
| TTFB (Time to First Byte) | <800ms | Vercel edge deployment — already handled. |

---

## KEYWORD STRATEGY

### Primary Keywords (high intent, CMMC-specific, near-zero competition)

| Keyword | Monthly Volume | Competition | Priority |
|---|---|---|---|
| CMMC AI compliance | ~200 | LOW | #1 |
| CMMC Level 2 AI tools | ~150 | LOW | #2 |
| CUI protection AI | ~100 | LOW | #3 |
| AI DLP defense contractor | ~80 | LOW | #4 |
| CMMC ChatGPT compliance | ~120 | LOW | #5 |
| AI prompt firewall CMMC | ~60 | LOW | #6 |
| CMMC SC.3.187 AI | ~40 | NONE | #7 |
| CMMC AI governance policy | ~180 | LOW | #8 |

### Secondary Keywords (informational, top-of-funnel)

| Keyword | Monthly Volume | Competition | Target Content |
|---|---|---|---|
| what is CMMC Level 2 | ~1,200 | MEDIUM | Glossary page |
| CMMC assessment checklist | ~800 | MEDIUM | Resource page |
| CUI definition examples | ~400 | LOW | Blog post |
| AI data leak prevention | ~600 | MEDIUM | Blog post |
| CMMC 2026 deadline | ~500 | LOW | Blog post |
| defense contractor AI policy | ~200 | LOW | Blog post |

### Do NOT Target (too competitive, wrong buyer)

- "AI security" (dominated by Palo Alto, CrowdStrike)
- "DLP software" (dominated by Forcepoint, Symantec)
- "data loss prevention" (enterprise DLP market, wrong buyer)
- "ChatGPT enterprise" (OpenAI owns this)
- "AI compliance" (too broad, no CMMC intent)

### Long-Tail Goldmines (very low competition, very high intent)

- "can ChatGPT handle CUI data"
- "CMMC assessment AI tool usage"
- "how to comply with SC.3.187 AI"
- "defense contractor employee ChatGPT policy"
- "CMMC Level 2 AI monitoring"

These are what the IT Director is typing at 11pm when they're panicking about their CMMC assessment.

---

## CONTENT CALENDAR — FIRST 90 DAYS

### Week 1

**Post 1:**
- Title: "What CMMC Level 2 Actually Requires When Employees Use ChatGPT"
- Target keyword: "CMMC Level 2 AI tools"
- Word count: 1,800
- Structure: What the practice says → What it means in practice → What evidence a C3PAO needs → How houndshield generates that evidence
- CTA: "Deploy houndshield and generate CMMC evidence in 30 minutes"
- Internal links: Pricing page, Trust page, Docs/quickstart

**Post 2:**
- Title: "CMMC Practice SC.3.187: Why Your AI Tools Are Probably Violating It Right Now"
- Target keyword: "CMMC SC.3.187 AI"
- Word count: 1,200
- Structure: What SC.3.187 requires → Why AI tools violate it by default → What boundary protection for AI looks like → houndshield as the solution
- CTA: "See how houndshield satisfies SC.3.187"

### Week 2

**Post 3:**
- Title: "The Complete Guide to CUI — With Examples Your Employees Actually Produce"
- Target keyword: "CUI definition examples"
- Word count: 2,500
- Structure: CUI definition → 20 specific examples (contract numbers, cost data, personnel, technical drawings) → What happens when CUI goes to ChatGPT → Prevention
- CTA: "houndshield detects CUI before it leaves your network"

**Post 4:**
- Title: "CMMC November 2026 Deadline: What Defense Contractors Need to Do Now"
- Target keyword: "CMMC 2026 deadline"
- Word count: 1,500
- Structure: The deadline → Who it applies to → What happens if you miss it → The AI governance gap most are ignoring → How to close it
- CTA: "Start your AI governance coverage today"

### Week 3

**Post 5:**
- Title: "How to Write a CMMC-Compliant AI Usage Policy (With a Template)"
- Target keyword: "defense contractor AI policy"
- Word count: 2,000
- Downloadable: A free AI usage policy template (Word doc)
- CTA: "Pair the policy with houndshield enforcement — policy without enforcement fails assessments"

**Post 6:**
- Title: "AWS Bedrock Guardrails vs houndshield: Why Most Defense Contractors Need Both or Neither"
- Target keyword: "AI DLP defense contractor"
- Word count: 1,200
- Structure: What Bedrock Guardrails does → Its critical limitation (Bedrock only) → What houndshield does → When each is appropriate → Honest comparison
- CTA: "Start houndshield free trial"

### Week 4

**Post 7:**
- Title: "Real CMMC Audit Evidence for AI System Governance: What Assessors Actually Want"
- Target keyword: "CMMC AI compliance"
- Word count: 2,000
- Source: Interview with or research from a C3PAO assessor
- Structure: What evidence C3PAOs accept for AI governance → How to generate it → What houndshield auto-generates
- CTA: "Generate your evidence package in 30 minutes"

**Post 8:**
- Title: "The 10 CMMC Practices Your AI Tools Are Probably Violating"
- Target keyword: "CMMC AI governance policy"
- Word count: 1,500
- Structure: List of 10 practices with descriptions → How AI tools create violations → How houndshield covers each
- CTA: "Check your AI compliance posture"

### Weeks 5-12: Maintain 2 Posts/Week

Topics (not fully outlined — execute as needed):
- "HIPAA and AI: What Healthcare Organizations Need to Know in 2026"
- "GitHub Copilot and CUI: What Defense Contractors Need to Know"
- "Building a CMMC System Security Plan (SSP) for AI Systems"
- "How to Detect Shadow AI in Your Organization (Without Blocking Productivity)"
- "The Cost of a CUI Breach: What Defense Contractors Risk When Employees Use ChatGPT"
- "Air-Gapped AI: How Defense Contractors Run AI Tools Without Internet Connectivity"
- "CMMC Level 2 vs Level 3: What's Different and Who Needs Each"
- "Prompt Injection Attacks Against Defense Contractors: What They Are and How to Stop Them"

---

## LINK BUILDING — ZERO BUDGET

### 1. Open-Source Backlinks (Month 5)

When houndshield-scan is open-sourced on GitHub:
- Submit to: awesome-security (GitHub list), OWASP resources, CMMC community resources
- Each submission = high-quality backlink from authoritative security resource
- Target: 20-30 backlinks from developer community within 30 days of launch

### 2. CMMC Community Engagement

- r/CMMC (Reddit): Participate genuinely. Answer technical questions. Never spam. Link only when directly relevant.
- CMMC-AB forum: If accessible, participate in AI governance discussions
- LinkedIn CMMC groups: Share blog posts, participate in discussions
- Target: 5-10 forum backlinks over 90 days (these are authoritative and relevant)

### 3. PR / Outreach

- When SOC 2 Type I is complete (Month 9): pitch to security trade press (Dark Reading, SC Magazine, Security Week) — "First CMMC-specific AI firewall achieves SOC 2 certification"
- CMMC deadline coverage: pitch to FCW, FedTech, NextGov in August 2026 (90 days before deadline) — "Defense contractors face CMMC AI compliance gap as November deadline approaches"

### 4. Guest Posts

- Write for: Summit 7 blog (once they're a partner), SysArc blog, CMMC-focused publications
- Each guest post = backlink + exposure to exact target audience

---

## TRACKING SETUP

### Install Immediately (Day 1)

1. **Google Search Console:**
   - Verify houndshield.com ownership
   - Submit sitemap.xml
   - Monitor: impressions, clicks, average position for target keywords
   - Check weekly: any manual actions, crawl errors, Core Web Vitals issues

2. **Plausible Analytics** (privacy-first, not Google Analytics):
   - Track: pageviews, unique visitors, bounce rate, traffic sources
   - Specifically track: /pricing page visits (leading indicator of purchase intent)
   - Why Plausible not GA: GDPR compliant, no cookie banner required, actually a trust signal for security-conscious buyers

3. **Ahrefs Webmaster Tools (free tier):**
   - Monitor: backlinks, keyword rankings
   - Alert when new backlinks detected

### Weekly Metrics Review

| Metric | Week 1 Baseline | Week 4 Target | Week 12 Target |
|---|---|---|---|
| Organic sessions | 0 | 50 | 500 |
| Target keyword rankings (avg position) | not ranked | position 30-50 | position 10-20 |
| Backlinks | 0 | 5 | 30 |
| /pricing page visits | 0 | 10 | 80 |
| Blog posts published | 0 | 4 | 24 |

### When to Expect First Organic Traffic

- Week 4-6: First impressions in Google Search Console (not clicks yet)
- Week 8-10: First organic visits (long-tail, very low volume)
- Week 12-16: Measurable organic traffic from CMMC-specific keywords
- Month 6: Enough organic traffic to drive 2-3 inbound trials/week

Do not expect organic traffic to be a primary acquisition channel before Month 6. Before that: RPO partnerships and direct LinkedIn outreach to IT Directors are the primary acquisition channels.

---

## TRUST PAGE — REQUIRED (create before first RPO demo)

URL: houndshield.com/trust

Content:
1. "SOC 2 Type I — in progress (target: Q3 2026)"
2. "FIPS 140-2 Architecture — all data encrypted with FIPS-validated algorithms"
3. "No data exfiltration — all prompt scanning runs locally. Architecture diagram showing data flow."
4. "Open source scanner — houndshield-scan available on GitHub (link)"
5. "Vulnerability disclosure policy — how to report security issues"
6. "Infrastructure — Docker containers, PostgreSQL, self-hosted Keycloak. No SaaS dependencies for CUI data."
7. Contact: security@houndshield.com

This page is what the IT Director shows their CISO before approving the purchase. Without it, the deal dies.
