---
name: saas-playbook
description: >
  SaaS business patterns distilled from "How to Kick SaaS" (JH-Media-Group/how-to-kick-saas).
  Applied to HoundShield: validation, pricing strategy, acquisition, and growth. Use when
  making go-to-market decisions, pricing changes, or acquisition strategy for HoundShield.
---

# SaaS Playbook — HoundShield Context

Source: JH-Media-Group/how-to-kick-saas (Jason M. Long, JH Media Group / BrainLeaf)

---

## VALIDATION TRUTH

> "Most people skip validation, hire a team, build something, then discover they can't sell it."

**The trap:** idea → build → marketing panic → failure. Validation breaks the trap.

HoundShield validation status:
- ✅ Problem confirmed: 80K contractors, CMMC Level 2 enforcement Nov 2025, 400 certified
- ✅ Buyer identified: Jordan, IT Security Manager, 50-250 person DoD contractor
- ✅ Pain is real: non-compliance = lost contracts (existential threat)
- ✅ Pricing validated against competitive landscape (Nightfall/Forcepoint = $20-50K/yr)
- ⚠️ Advisory board: need 3-5 paying C3PAO contacts (they unlock 10-50 customers each)
- ⚠️ First revenue: target before YC S26 application

**Advisory board pattern from book:**
1. Find 5 people from the beachhead market (CMMC assessors, IT security managers)
2. Give them free access in exchange for monthly feedback calls
3. They become first paying customers + testimonial sources + referral network

---

## BUYER PERSONA MATRIX (applied to HoundShield)

| Segment | Role | Valued Feature | WTP/mo | Est. Count |
|---------|------|---------------|---------|------------|
| Solo contractor | IT admin | Free tier, proxy setup in 5 min | $0 | ∞ (top of funnel) |
| Small DoD contractor | IT Security Mgr (Jordan) | CMMC Level 2, PDF for C3PAO | $199-499 | ~40K orgs |
| Mid-size contractor | CISO | Multi-user, audit trail, SOC 2 | $499-999 | ~15K orgs |
| Large contractor | Security team lead | Agency seats, white-label, API | $2,499 | ~5K orgs |
| MSP/C3PAO | Reseller | Agency pricing, customer sub-accounts | $2,499 | ~400 C3PAOs |

**Book lesson:** Price by user type, not by features alone. Each segment has a different
"acceptable price ceiling" based on how much a non-compliance event costs them.
For Jordan: one lost contract = $500K+. $499/mo is trivial. Frame it that way.

---

## PRICING STRATEGY (from book + HoundShield context)

Book rule: "Most entrepreneurs spend one day on pricing and never revisit it. This is wrong."

**Current tier structure:**
```
Free     — proxy, basic patterns, 1 user
$199 Pro  — all 16 patterns, PDF export, 5 users
$499 Growth — HIPAA+SOC2, custom patterns, 25 users
$999 Enterprise — SPRS scoring, audit log, 100 users
$2,499 Agency — multi-tenant, white-label, unlimited
```

**Book-derived optimizations to consider:**
1. **Name tiers after the problem, not size**: "CMMC Ready" > "Pro". Triggers the pain.
2. **Anchor on cost of failure**: Landing page should show "CMMC non-compliance costs contracts, not months"
3. **PDF is the right purchase unlock**: Book confirms first value moment = specific, tangible output
4. **Annual billing discount**: convert monthly to annual at 2mo free (17% discount, 12mo lock-in)
5. **C3PAO channel pricing**: volume deal for assessors who recommend to 10+ clients (20-30% rev share)

---

## ACQUISITION SEQUENCE (book pattern applied)

**Phase 1 — Advisory board to first $1K MRR:**
1. 5 C3PAO contacts → free access → monthly calls → testimonials
2. Ask each: "Who else in your network needs CMMC Level 2 compliance?"
3. Referral chain: C3PAO → 10-50 contractors per C3PAO

**Phase 2 — $1K → $10K MRR:**
4. SEO: long-tail CMMC content ("how to pass CMMC Level 2 assessment with ChatGPT")
5. LinkedIn outreach: IT security managers at companies with recent DFARS 7012 notices
6. C3PAO partnership: each assessor recommends HoundShield as part of assessment prep

**Phase 3 — $10K → $100K MRR:**
7. Content marketing: "Why every AI tool you use is a CMMC violation"
8. Direct sales: outbound to CAGE-coded companies near CMMC deadline
9. Platform integrations: Microsoft Purview, Okta, Crowdstrike partnerships

**Book's golden rule on acquisition:**
> "A SaaS is a sales and marketing company that happens to have software."

---

## SALES SCRIPT (from ROADMAP.md + book patterns)

Opening: "Every cloud-based AI DLP tool you buy sends your CUI to their servers to scan it.
You just outsourced your classified data to a vendor. We scan it locally. Zero data leaves
your network. That's the DFARS 7012 requirement."

Close: "When's your C3PAO assessment? Three months out? You can deploy HoundShield in
under 10 minutes and export your PDF report before lunch."

Book pattern: "Ask for the deal directly. Don't hint. Ask."

---

## RETENTION (book: attrition chapter)

Book: most SaaS churn comes from value not delivered in first 30 days.

HoundShield retention risks:
- User never completes proxy setup → deploy install.sh, make <5min
- User sets up proxy but doesn't get value signal → first CUI detection = value moment
- User can't export PDF → Sprint 1 top priority (PDF export = purchase unlock)
- User questions accuracy → SPRS score accuracy = trust builder

**Book's retention metric:** "Check in with initial users regularly. Ask a lot of questions.
Make changes. Repeat for weeks to months before scaling acquisition."

---

## GROWTH LEVERS (book: traction section)

1. **Word of mouth from C3PAOs** — best channel for B2B compliance
2. **CMMC community forums** — where Jordan actually lives (CMMC COA, DCSA communities)
3. **Content that ranks for "CMMC + AI"** — underserved SEO niche
4. **Case study after first paying customer** — "how [company] got CMMC ready in 10 minutes"
5. **YC S26 application** — $10K MRR target before demo day

---

## BOOK WARNINGS (avoid these failure modes)

- ❌ Building features for hypothetical buyers (not Jordan)
- ❌ Dashboard polish before first paying customers
- ❌ Pricing changes without data
- ❌ Scaling acquisition before product-market fit
- ❌ Ignoring churn signals (why is no one completing onboarding?)
- ❌ "Build it and they will come" — they won't
