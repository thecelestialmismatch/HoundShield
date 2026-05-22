# HoundShield PRD v3 — $5K MRR by 2026-06-07
**Author:** HERMES  
**Date:** 2026-05-12  
**Status:** ACTIVE — Sprint 2 in progress

---

## 1. Problem

80,000 DoD contractors must achieve CMMC Level 2 by November 10, 2026. Only ~400 are certified today.

The specific pain: their engineers are using ChatGPT, GitHub Copilot, and Claude to write code, draft emails, and analyze documents. Every one of those prompts is a potential CUI spill. Under DFARS 7012, sending CUI to an AI provider's cloud is a reportable security incident.

Cloud-based AI DLP tools (Nightfall, Strac, Purview) make this worse — they scan the data by sending it to *their* cloud servers, which is itself a potential DFARS 7012 violation.

**Jordan's specific situation:**
- IT Security Manager at a 50-250 person defense contractor
- Has a CMMC Level 2 deadline on a contract renewal in Q4 2026
- Her engineers use AI tools daily — she can't stop them
- She needs something that works in 10 minutes, not 6 months of integration work
- She needs a SPRS score she can show her assessor

---

## 2. Solution

HoundShield is a local-only AI compliance firewall.

1. Jordan changes one proxy URL on her network (HTTPS_PROXY env var or browser config)
2. Every AI prompt from every machine on the network routes through HoundShield's Docker container
3. HoundShield scans locally in <10ms using 16 CUI/PII/PHI detection patterns
4. Detected CUI is blocked or quarantined — never reaches the AI provider
5. Every event is logged in a tamper-proof audit trail (Merkle-root sealed)
6. Jordan gets a SPRS score improvement + PDF report for her assessor

No cloud. No data ever leaves Jordan's network. One proxy URL. Done.

---

## 3. Target Customer

**Primary:** Jordan — IT Security Manager at a 50-250 person DoD contractor  
- Facing CMMC Level 2 deadline
- Engineers use AI tools daily
- Needs proof of compliance for assessor
- Budget authority: $500-$2,000/mo

**Secondary Channel:** C3PAO (Certified Third-Party Assessors)  
- Assess 5-50 contractors per year
- Refers HoundShield during assessments (discovery: contractors failing 3.13.x controls)
- Earns 20% recurring commission
- Reseller option: white-label at $2,499/mo flat, unlimited clients

**Anti-persona:** Individual developer / non-DoD company — CMMC requirement doesn't apply, no urgency

---

## 4. Pricing (Canonical — Do Not Change Without Manager Check)

| Tier | Price | Seats | AI Scans | PDF Reports | Key Differentiator |
|------|-------|-------|----------|-------------|-------------------|
| Starter | Free | 1 | None | No | SPRS calculator, 7-day trial |
| Pro | $199/mo | 10 | 50K/mo | JSON only | Full CMMC suite, AI gateway |
| Growth | $499/mo | 25 | Unlimited | ✅ PDF | C3PAO coordination, audit trail |
| Enterprise | $999/mo | Unlimited | Unlimited | White-label | On-prem, air-gapped, custom rules |
| Agency/MSP | $2,499/mo | Unlimited | Unlimited | White-label | Multi-tenant, unlimited clients |

**$5K MRR math:**
- 20 Pro ($199) = $3,980
- 3 Growth ($499) = $1,497
- 1 Enterprise ($999) = $999
- Total = **$6,476/mo** ← achievable with 24 customers

---

## 5. Minimum Viable Feature Set for Revenue

All of these are already built. Zero new features required to close first customers.

| Feature | Status | Required For |
|---------|--------|-------------|
| HTTPS proxy with 16 patterns | ✅ | All paying tiers |
| Docker install (1 command) | ✅ | All tiers |
| CMMC assessment (110 controls) | ✅ | All tiers |
| SPRS score calculator | ✅ | All tiers |
| PDF compliance report | ✅ | Growth+ |
| Stripe checkout (4 paid tiers) | ✅ (needs env vars) | All |
| Stripe webhook → subscription activate | ✅ (wrong URL) | All |
| Partner dashboard (multi-tenant) | ✅ | Agency |
| Brain AI | ⚠️ (missing key) | Value-add |

**The product is complete. The blockers are ops.**

---

## 6. Go-To-Market Plan

### Week 1 (2026-05-12 to 2026-05-18): Fix ops + first C3PAO
**Goal:** Stripe working, first C3PAO partnership signed

Actions:
- [ ] Fix Stripe webhook + price IDs (founder, today)
- [ ] Push Supabase migrations 003+004
- [ ] Contact 10 C3PAOs from marketplace.cmmcab.org:
  - Template: "Hi [Name], I build HoundShield — a CMMC AI firewall for your clients. Would 20% recurring commission on every referral interest you?"
- [ ] Record 3-min demo: CUI paste → ChatGPT block → PDF export
- [ ] Publish blog post: "Why cloud AI DLP violates DFARS 7012"

### Week 2 (2026-05-19 to 2026-05-25): First paying customer
**Goal:** $199-$499 MRR from first customer

Actions:
- [ ] Direct outreach: LinkedIn → search "IT Security Manager" + "DoD contractor" + "CMMC"
- [ ] Post in r/netsec, r/sysadmin, r/devops with value, not spam
- [ ] Share blog post in GovCon forums and LinkedIn groups
- [ ] Offer first 5 customers: 3-month Pro free + testimonial
- [ ] In-app onboarding email sequence: day 1/3/7

### Week 3 (2026-05-26 to 2026-06-01): C3PAO referral engine
**Goal:** First C3PAO-sourced customer, $1K-$2K MRR

Actions:
- [ ] Give signed C3PAO partners demo materials + referral link
- [ ] Email sequence for trial users who haven't upgraded
- [ ] Implement SPRS score improvement estimate in dashboard
- [ ] CMMC control coverage map in dashboard (shows Jordan what HoundShield covers)

### Week 4 (2026-06-01 to 2026-06-07): $5K MRR gate
**Goal:** $5,000 MRR

Actions:
- [ ] Follow up all trial users still on free tier
- [ ] Offer first agency partner: $2,499/mo for unlimited clients
- [ ] Publish 2nd blog post: "Your SPRS score can improve 15-30 points with HoundShield"
- [ ] LinkedIn post: "We've blocked X CUI events across Y defense contractors this month"

---

## 7. Distribution Channels (Priority Order)

### Channel 1: C3PAO Partnerships (Highest leverage)
C3PAOs assess 20-50 contractors per year. One signed C3PAO partner = 5-15 potential customers in pipeline. The referral pitch is simple: "Refer clients. Earn 20% recurring. Average referral pays you $40-$200/mo for 2+ years."

Sources:
- marketplace.cmmcab.org (directory of all certified C3PAOs)
- GovWin IQ
- LinkedIn "C3PAO" search
- LinkedIn "CMMC Registered Practitioner" search

### Channel 2: Direct Jordan Outreach
LinkedIn search: "IT Security Manager" + "Department of Defense" or "DFARS" or "CMMC"

Message template:
> "Hi Jordan — are your engineers using ChatGPT? Under DFARS 7012, that's a potential CUI spill. HoundShield blocks it locally in <10ms. Nothing leaves your network. 7-day free trial, no credit card. Worth 10 minutes? [link]"

### Channel 3: SEO (2-week lag)
Target keywords:
- "CMMC AI DLP" — low competition, high intent
- "DFARS 7012 ChatGPT" — 0 results, own this
- "CUI ChatGPT block" — 0 results, own this
- "CMMC compliant AI gateway" — medium competition

### Channel 4: GovCon Communities
- GovWin IQ forums
- LinkedIn: "GovCon Professionals" group (200K members)
- r/govcon subreddit
- ISACA GovCon chapter events

### Channel 5: Industry Amplification
- Post on HackerNews (Show HN: Local-only AI DLP for CMMC Level 2)
- Tweet thread: "DFARS 7012 + ChatGPT = compliance risk. Here's why..."

---

## 8. Success Metrics

| Metric | Current | Week 2 | Week 4 | Month 3 |
|--------|---------|--------|--------|---------|
| MRR | $0 | $199 | $5,000 | $10,000 |
| Paying customers | 0 | 1 | 25 | 50 |
| C3PAO partners | 0 | 1 | 3 | 10 |
| Trial signups | 0 | 20 | 100 | 300 |
| Trial → paid conversion | — | — | 25% | 30% |
| Blog posts | 0 | 1 | 3 | 12 |
| Organic search visitors | <100 | <100 | 500 | 5,000 |

---

## 9. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| CMMC deadline moves | Low | High | 80K contractors still need it for existing contracts |
| C3PAOs slow to engage | Medium | High | 10 outreach per week, use template, track responses |
| Stripe webhook down | None (fixable) | High | Fix today — see Audit Report B1/B2 |
| Competition cuts price | Low | Medium | Local-only is architectural moat, not a feature |
| Trial users don't convert | Medium | Medium | Onboarding email sequence, day 7 upgrade nudge |
| Jordan doesn't understand proxy setup | Medium | High | `/docs/quickstart` exists, demo video needed |

---

## 10. Out of Scope (Until $10K MRR)

- Azure Sentinel connector
- Splunk integration
- Blockchain audit trail UI
- Mobile app
- SIEM integrations
- HIPAA / SOC 2 upsell campaigns
- Self-serve SSO configuration
- International expansion

**These wait. Jordan is the only buyer until Sprint 4.**
