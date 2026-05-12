# HoundShield — Product Requirements Document
**Version:** 2.0 | **Date:** May 2026 | **Status:** ACTIVE — BEAST PHASE2 EVOLUTION

---

## One Sentence

**HoundShield prevents defense contractor employees from accidentally leaking CUI to ChatGPT — and generates the CMMC evidence to prove it.**

---

## The Problem

Every US defense contractor using AI tools (ChatGPT, Copilot, Claude, Gemini) has an active CMMC compliance violation right now. CMMC Level 2 — mandatory for 220,000+ Defense Industrial Base contractors — requires access controls on Controlled Unclassified Information (CUI). When an engineer pastes a contract spec into ChatGPT, that CUI just left the network. That is a DFARS 7012 violation. The contractor's $2M–$50M government contract is at risk.

**Existing solutions are broken:**
- Nightfall, Strac, Cyberhaven: cloud-based DLP. They send your CUI to their servers to scan it. That is itself a CUI spill.
- Purview, Netskope: enterprise-only, $150K+ implementations, 6-month rollouts.
- Consulting firms: $75K–$150K engagements to manually assess and document controls.

**The November 10, 2026 deadline makes this urgent today:**
- CMMC Phase 2: mandatory C3PAO assessments begin November 10, 2026
- 99% of 220,000+ contractors are not ready (Redspin 2026 survey)
- Average all-in CMMC Level 2 engagement: $112,000
- HoundShield: $199–$499/month. Installs in 30 minutes.

---

## Target User — Jordan

**Name:** Jordan Chen  
**Title:** IT Security Manager  
**Company:** 85-person aerospace subcontractor, $12M in DoD contracts  
**Age:** 34  
**Situation:** She has 6 months until CMMC Phase 2. She found out last month that her engineers have been using ChatGPT to write code for flight control systems. She doesn't know what CUI left the network. She needs evidence for a C3PAO assessment she can't afford to fail.

**Jordan's job to be done:** Prove to her C3PAO assessor that AI usage is controlled, logged, and compliant — without a $150K consulting engagement.

**Jordan's fears:** Losing the DoD contract. Personal liability. Looking incompetent to leadership.

**What Jordan needs:**
1. Something that installs in an afternoon without breaking existing workflows
2. A log of every AI query her team has sent, with compliance analysis
3. A PDF she can hand to her C3PAO auditor
4. A SPRS score that shows progress

**What Jordan does NOT need:** Blockchain anchoring, mobile apps, 3D visualizations, AI chat UI, generative features.

---

## Core Features — v1 (Revenue-Gate: $5K MRR)

### F1 — Proxy Intercept (SHIPPED)
One URL change routes all AI traffic through HoundShield's proxy. No code changes to existing tools.
Works with ChatGPT, Copilot, Claude, Gemini, any OpenAI-compatible tool.

### F2 — CUI/PHI/PII Detection (SHIPPED)
16 detection engines scan every prompt in <10ms. 110 NIST 800-171 Rev 2 controls mapped.
Blocks violations. Logs every decision with timestamp, matched pattern, and control mapping.

### F3 — PDF Evidence Export (SHIPPED)
5-page C3PAO-ready PDF report: SPRS score, control coverage, violation log, remediation roadmap.
This is Jordan's purchase trigger. She can't get a C3PAO assessment without this artifact.

### F4 — Dashboard (SHIPPED — enough for v1)
Real-time scan count, violation rate, SPRS score, control coverage map.
NOT a feature priority. It's table stakes. Don't polish it before C3PAO channel is open.

### F5 — C3PAO Partner Portal (IN PROGRESS — Sprint 2)
White-label dashboard for C3PAOs to manage 10–50 contractor clients.
$1,499/mo Agency tier. One C3PAO = 10–50 Jordan-equivalents in pipeline.

---

## Explicit Out-of-Scope (Pre-$10K MRR)

- Blockchain audit anchoring (vaporware to Jordan)
- Mobile app
- Gemini/Bard chat UI
- SOC 2 / ISO 27001 modules (upsell post-launch, not now)
- SIEM integrations (Azure Sentinel, Splunk)
- Video export / Remotion features
- Browser extension public launch
- Multi-cloud deployment orchestration
- Kubernetes/Terraform deployment tooling
- B2C / consumer product

---

## Revenue Model

| Tier | Price | Users | Key Feature | Target |
|------|-------|-------|-------------|--------|
| Starter | $0 | 5 | Basic scan, 7-day log | Lead gen |
| Pro | $199/mo | 25 | Full CMMC + PDF export | Primary revenue |
| Enterprise | $499/mo | 100 | SSO + API + C3PAO report | Upsell |
| Agency | $1,499/mo | Unlimited clients | White-label partner portal | C3PAO channel |

**Path to $5K MRR:**
- 25 Pro customers @ $199 = $4,975 MRR, OR
- 10 Pro + 2 Enterprise = $2,970 MRR, OR
- 3 Agency (C3PAO) customers = $4,497 MRR ← fastest path

**Path to $10K MRR:**
- 1 C3PAO partner × 20 client referrals × $199 = $3,980 + agency fee = $5,480 MRR from one partner

---

## Success Metrics

| Metric | Target | Deadline |
|--------|--------|----------|
| Paying customers | 1 | Day 14 (May 20, 2026) |
| Paying customers | 3 | Day 28 (June 3, 2026) |
| MRR | $5,000 | Day 45 (June 20, 2026) |
| MRR | $10,000 | Day 90 (August 4, 2026) |
| C3PAO partners signed | 1 | Sprint 2 end |
| C3PAOs contacted | 10 | This week |

---

## Kill Gates (Non-Negotiable)

**Gate 1 — Day 14:** 0 paying customers → positioning wrong, not product. Run 5 discovery calls.
**Gate 2 — Day 28:** <3 paying customers → channel broken. Move to Google Ads ($15–$40 CPC on "CMMC Level 2 compliance").
**Gate 3 — Day 45:** <$5K MRR → run BEAST pivot protocol. Pivot to healthcare PHI or Forge (MCP billing layer).
**Gate 4 — Day 90:** <$10K MRR → CMMC beachhead wrong. Full pivot to Forge.
