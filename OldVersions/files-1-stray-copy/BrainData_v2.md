# HOUNDSHIELD BRAIN DATA
# Version: 2.0 | Updated: May 24, 2026
# Purpose: Single source of truth for all HERMES sessions.
# Do not delete sections. Append new content at the bottom of the relevant section.

---

## SECTION 0: QUICK REFERENCE

  Product:    HoundShield — local-only AI compliance firewall
  Site:       https://houndshield.com
  Repo:       https://github.com/thecelestialmismatch/HoundShield
  Prompt:     HERMES_SYSTEM_PROMPT.md (copy-paste this to start any session)
  Launch:     June 1, 2026
  Deadline:   10 paying clients by June 5, 2026

  Today:         May 24, 2026
  Days to launch:   8
  Days to deadline: 12

---

## SECTION 1: PRODUCT TRUTH

HoundShield is an OpenAI-compatible proxy. One URL change. Sits between an employee
and ChatGPT / Copilot / Claude. Scans prompts locally in under 10ms using 16 detection
engines (CUI / PHI / PII / IP / ITAR). Blocks violations. Emits SHA-256 hash-chained
audit logs and a C3PAO-ready PDF mapped to all 110 NIST SP 800-171 Rev 2 controls.

Deployment modes:
  A) Hosted trial — proxy.houndshield.com — non-CUI only, clearly labeled
  B) Self-hosted Docker — customer infra — required for CUI / DFARS compliance
  C) Air-gapped on-prem — Enterprise — contact sales

Brain AI:
  On-site compliance assistant. Vercel + OpenRouter API.
  System prompt committed to repo at /web/brain-ai/system-prompt.md.
  Never fabricates compliance claims.

---

## SECTION 2: CRITICAL LIVE BUGS (fix before any sales call)

  BUG-01: Two conflicting pricing pages.
    Homepage: Pro $199/mo, Enterprise $999/mo
    Pricing page: Pro ~$159/mo (annual), Growth ~$399/mo, Enterprise ~$799/mo
    Fix: Collapse to one page. Homepage grid is canonical.
    Status: OPEN

  BUG-02: Architecture contradiction.
    Homepage claims "local-only."
    Docs point users to proxy.houndshield.com (hosted endpoint).
    Fix: Add Deployment Modes page. Label Mode A as trial-only. Mode B as CMMC-compliant.
    Status: OPEN

  BUG-03: Brain AI system prompt not version-controlled.
    Fix: Commit /web/brain-ai/system-prompt.md to repo.
    Status: OPEN

---

## SECTION 3: THE BUYER

Jordan M.
  Role: IT Security Manager
  Company: 180-person DoD subcontractor
  Budget: $500 to $1,500 per month
  Authority: Solo decision-maker. Signs SaaS order forms without procurement.
  Deadline: November 10, 2026 (CMMC Phase 2)
  Pain: "My employees keep pasting CUI into ChatGPT and I have no audit trail."
  Cares about: One PDF a C3PAO assessor accepts on the first visit.
  Does not care about: Prompt injection, jailbreaks, EU AI Act, mobile apps, Israel.

"Jordan would never read this" is a valid rejection of any copy or feature.

---

## SECTION 4: MARKET NUMBERS

  76,598 — US DIB organizations needing CMMC Level 2 (DoD, Feb 2026 Cyber AB Town Hall)
  1,042  — Completed certification as of Feb 2026 (1.4%)
  387    — RPOs in Cyber AB Marketplace
  800    — Certified C3PAO Assessors available (2,000 to 3,000 needed = 6-month backlog)
  52M+   — DOJ FCA cybersecurity settlements FY2025 (dollars)
  Nov 10, 2026 — CMMC Phase 2 enforcement start

---

## SECTION 5: PRICING (LOCKED)

  Free        $0/mo          1 user, 1,000 scans, no PDF
  Pro         $199/mo        5 users, unlimited scans, C3PAO PDF, SPRS tracker
  Growth      $499/mo        25 users, gateway mode, HIPAA
  Enterprise  $999/mo        Unlimited, on-prem, dedicated CSM
  Audit Pack  $999 one-time  SSP + POA&M + 14 policy templates + 1-hour RP review

  Annual: 17% discount. 30-day money-back. ONE grid on site.
  No Federal tier until a named Federal customer exists.

---

## SECTION 6: COMPETITIVE POSITION

Gap HoundShield owns: No competitor combines (a) one-line proxy + (b) local scanning
for DFARS 7012 / SC.3.177 + (c) C3PAO PDF for 110 controls + (d) sub-$300/mo pricing.

  Kiteworks       — $50K to $300K+/yr, enterprise-only. 10x cheaper to beat.
  PreVeil         — 3,000+ DIB customers, NO AI gateway. Partnership target.
  Nightfall/Strac — Cloud-routed. FAILS SC.3.177. No CMMC PDF.
  Vanta/Drata     — Docs only. No AI gateway. $10K to $100K/yr.
  Lakera          — Acquired by Check Point ~$300M (Sept 2025). Not a CMMC SKU.
  Prompt Security — Acquired by SentinelOne $180M (Sept 2025). Not a CMMC SKU.
  Protect AI      — Acquired by Palo Alto ~$650M (July 2025). Not a CMMC SKU.

Wedge: HoundShield $199/mo ($2,388/yr) vs PreVeil $5,400/yr (lowest named CMMC competitor).

---

## SECTION 7: CHANNEL PRIORITY

  1. RPO partnerships (387 RPOs in Cyber AB Marketplace)
     Offer: 25% recurring rev-share, white-label PDF, exclusive territory for first 10.
     Top targets: Summit 7, MAD Security, Rhymetec, CompliancePoint, CyberSheath,
       BEMO, Steel Root, Etactics, ProArch, Sera-Brynn.

  2. Direct LinkedIn outreach
     Filter: "IT Security Manager" + "CMMC" + under 500 employees.
     500 requests / 4 days = ~100 conversations = 10 demos.

  3. SEO + Content
     Target: "CMMC AI use policy template", "ChatGPT CMMC compliance", "CUI prompt scanning"
     Publish: /guide/cmmc-ai-compliance — definitive long-form guide.

---

## SECTION 8: 13-DAY WAR PLAN

Day 1 to 3 (May 23 to 26) — Ship a credible product:
  [ ] ONE pricing page (BUG-01 fix)
  [ ] Deployment Modes page (BUG-02 fix)
  [ ] /security page (SHA-256 hash, no-CUI-storage statement, SOC 2 timeline)
  [ ] Docker image published: houndshield/proxy:latest
  [ ] $999 Audit Pack SKU in Stripe
  [ ] 14 policy templates drafted
  [ ] schema.org structured data on all pages
  [ ] Sitemap submitted to Google Search Console + Bing Webmaster
  [ ] 3 blog posts written and published

Day 4 to 7 (May 27 to 30) — Outreach blitz:
  [ ] 50 personalized RPO emails sent
  [ ] 100+ LinkedIn DMs to IT Security Managers
  [ ] r/cmmc + r/cybersecurity posts with free template
  [ ] Show HN post

June 1 — Launch:
  [ ] PR Newswire press release (~$400)
  [ ] Product Hunt live
  [ ] LinkedIn + X + HN cross-post
  [ ] "First 10 get $999 Audit Pack free" scarcity close active

June 3 to 5 — Close 10:
  [ ] Follow up every demo within 4 hours
  [ ] 2 RPO partnerships activated
  [ ] Charter Partner offer: $99/mo for 3 months for logo + case study

HIGHEST LEVERAGE: Written C3PAO endorsement letter (Schellman / Coalfire / Sera-Brynn).
  This converts demos at 2 to 3x the current rate. Pursue before June 1.

---

## SECTION 9: DEMO SCRIPT (verbatim)

  1. "Open ChatGPT."
  2. "Paste: Summarize our CAGE code 1ABC2 contract for the Navy."
     Response: "That is a CMMC SC.3.177 violation. No audit trail exists."
  3. "Change one URL." Apply proxy.
  4. "Try the same prompt." HoundShield blocks. Log entry generated.
  5. "Click Generate Audit PDF." C3PAO-formatted PDF appears.
  6. "Policy violation to C3PAO-ready evidence: under 10 minutes."

Demo always ends with the PDF on screen.

---

## SECTION 10: NEVER DO LIST

  - Mobile app before 50 customers
  - Israel / Mossad / foreign defense (12 to 24 month motion, kills ITAR credibility)
  - HIPAA pivot before June 5
  - Generic AI security positioning
  - Features without a NIST 800-171 Rev 2 control mapping
  - Routing prompt content to external LLMs for scanning
  - Lowering Pro below $199/mo
  - Second pricing grid
  - Committing API keys or secrets to the repo

---

## SECTION 11: SEO AND DISCOVERABILITY

Technical (fix immediately):
  - schema.org Product + Organization + FAQPage on every page
  - Canonical: always https://houndshield.com (no www variant)
  - llms.txt and llms-full.txt at root
  - Sitemap submitted to Google Search Console and Bing Webmaster

Target keywords (tier 1, low competition):
  - "CMMC AI use policy template"
  - "ChatGPT CMMC compliance"
  - "CUI prompt scanning"
  - "AI gateway CMMC Level 2"
  - "C3PAO ready PDF evidence AI"

Backlinks (13-day plan):
  - HARO pitch: "76,598 contractors cannot hit Nov 10 deadline"
  - Targets: FedScoop, Defense One, Breaking Defense
  - Guest posts: GRC Academy, Sera-Brynn blog, Etactics blog
  - Listings: Capterra, G2, AlternativeTo, Product Hunt, Cyber AB Marketplace

---

## SECTION 12: THREE NEW REVENUE IDEAS (ranked)

IDEA 1 — PolicyPack (WINNER — build first)
  Pain: "My prime just sent a flow-down requiring a written AI usage policy in 30 days."
  Product: Web form → LLM generates 14 policy templates → branded PDF + DOCX.
  Price: $499 one-time or bundle as the $999 Audit Pack.
  MVP: 1 week. Revenue: Day 3 of sprint.
  Why it wins: Same buyer, same deadline, almost no new code.

IDEA 2 — AuditReady (build after 10 customers)
  Pain: "Our SPRS score is 53 and we need 80+ to win a contract."
  Product: SPRS calculator + evidence checklist + weekly PDF status report.
  Price: $149/mo or $1,499/yr.
  MVP: 1 week. Potential: 35 customers = $5,215 MRR.

IDEA 3 — PrivilegeShield (build in Q3)
  Pain (post-Heppner ruling): "I need to prove our AI use was attorney-directed."
  Product: HoundShield proxy + "Kovel mode" toggle + signed metadata + tamper-evident log.
  Price: $2,000/mo or $50/seat/mo.
  Potential: 3 AmLaw 200 firms = $6,000 MRR.

---

## SECTION 13: PIVOT ANALYSIS

  Option A — Stay the course (RECOMMENDED)
    Niche harder: "CMMC Level 2 AI Use Policy in a Box"
    Speed to revenue: 3 to 7 days.

  Option B — Healthcare / HIPAA
    Speed to revenue: 14 to 30 days. Do not pursue before June 5.

  Option C — Law firm AI audit trail
    Speed to revenue: 21 to 60 days. Q3 after 50 customers.

  Verdict: Do not pivot the product. Niche the positioning.

---

## SECTION 14: MOBILE APP VERDICT

  Skip. The buyer (Jordan) audits compliance on a laptop, not a phone.
  The core product is a network proxy — no mobile use case.
  Revisit Q3 2026 with 50+ customers: ship React Native PWA wrapper for alerts only.

---

## SECTION 15: ISRAEL / FOREIGN DEFENSE VERDICT

  Do not pursue during this sprint. Reasons:
  - 12 to 24 month sales motion minimum
  - Kills ITAR credibility with US buyers if on the website
  - No realistic path to June revenue

  Nearest proxy: US-based DIB subcontractor with DoD contracts. That is Jordan.
  BIRD Cyber concept paper (US-Israel joint): file in parallel. 1-page executive summary.
  Zero June revenue from this path.

---

## SECTION 16: COMPLIANCE CONTROL MAPPINGS

  Local scanning (Mode B/C)    SC.3.177   Cryptographic protection of CUI in transit
  Audit log generation         AU.2.041   Audit record content requirements
  Tamper-evident PDF           CA.3.162   Security controls assessment evidence
  Pattern detection            MP.2.120   Media protection — unauthorized disclosure
  Brain AI advisor             AT.2.056   Security awareness training for AI use
  Container deployment         CM.2.061   Baseline configuration management

---

## SECTION 17: GITHUB REPO RULES

  - .env files are never committed. .env.example with placeholders only.
  - API keys are environment variables only.
  - Every PR requires: ESLint + tsc --noEmit + full tests + SBOM check.
  - Branch protection on main: 1 review required, all CI checks must pass.
  - Dependabot enabled, weekly checks.
  - /legacy folder: archived files that are not deployed but not deleted.

---

## SECTION 18: AGENT MEMORY AND TOKEN EFFICIENCY

Boot sequence (every session reads only these):
  1. This file (BrainData.md) — sections 0 through 10 cover 95% of decisions
  2. HERMES_SYSTEM_PROMPT.md — operating protocol
  3. CLAUDE.md — coding constraints

Load on demand (only when task requires):
  - /templates — when generating policy documents
  - /detection — when modifying detection patterns
  - /audit — when modifying the PDF generator or audit chain

Compaction schedule (weekly):
  - Archive this file's completed war plan tasks to /legacy/braindata-archive.md
  - Keep active file under 500 lines
  - Target boot token budget: under 2,000 tokens for sections 0 to 10

---

## SECTION 19: SESSION LOG

Use this section to record what was completed each session.
Format: [DATE] [SESSION N] — [tasks completed] — [next priority]

2026-05-24 SESSION 1 — Created HERMES_SYSTEM_PROMPT.md, README.md, CLAUDE.md, BrainData v2.0
  Next priority: Fix BUG-01 and BUG-02 on site. Publish Docker image.

---

## SECTION 20: REFERENCE LINKS

  Site:           https://houndshield.com
  Repo:           https://github.com/thecelestialmismatch/HoundShield
  Cyber AB:       https://cyberab.org/marketplace
  NIST 800-171:   https://csrc.nist.gov/publications/detail/sp/800-171/rev-2/final
  CMMC Model:     https://dodcio.defense.gov/CMMC/Model
  PR Newswire:    https://www.prnewswire.com
  Product Hunt:   https://www.producthunt.com
  r/cmmc:         https://www.reddit.com/r/cmmc

  Reference stacks (architecture inspiration):
    https://github.com/garrytan/gstack
    https://github.com/NousResearch/hermes-agent
    https://github.com/1jehuang/jcode
    https://github.com/tinyhumansai/openhuman

---

## SECTION 21: OODA STANDING ORDER

Observe: 76,598 contractors need CMMC Level 2. 1,042 have it. Gap is real.
Orient:  C3PAO backlog is 6 months. Buyers are panicking now. November is 171 days away.
Decide:  Ship the credible product first. Outreach second. Close 10. Everything else waits.
Act:     Today. Not tomorrow.

The standard is not "good enough."
The standard is: ship the complete thing.
