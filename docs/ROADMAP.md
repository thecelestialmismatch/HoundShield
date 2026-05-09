# HoundShield — Revenue-First Roadmap
**Standard:** Every feature is evaluated against: Does this move toward $5K MRR faster than the alternative?
**Last updated:** May 2026

---

## NOW (Sprint 2 — Week of May 5, 2026)
**Goal:** First paying customer. First C3PAO partner contact.

| Priority | Task | Revenue Impact | Owner |
|----------|------|---------------|-------|
| P0 | Fix Stripe webhook URL → houndshield.com | Payments broken without this | Manual: Stripe dashboard |
| P0 | Set STRIPE_WEBHOOK_SECRET in Vercel | Payments broken without this | Manual: Vercel dashboard |
| P0 | Apply Supabase migrations 003-010 to production | Auth/dashboard broken in prod | Manual: supabase cli |
| P0 | Set OPENROUTER_API_KEY in Vercel | Chat shows error on live site | Manual: Vercel dashboard |
| P1 | Contact 10 C3PAOs from marketplace.cmmcab.org | One C3PAO = 10-50 customers | Founder action |
| P1 | Record 3-min demo: CUI paste → block → PDF | Required for outreach | Founder action |
| P1 | Set STRIPE_WEBHOOK_SECRET in Vercel | Close subscription loop | Manual: Vercel |
| P2 | Partner landing page /partner | C3PAO channel | Code |
| P2 | Blog: "Why cloud AI DLP violates DFARS 7012" | SEO + credibility | Content |

---

## NEXT (Sprint 3 — Week of May 12, 2026)
**Goal:** 3 paying customers. Brain AI queryable.

| Priority | Task | Revenue Impact |
|----------|------|---------------|
| P1 | Onboarding email sequence (3 emails: day 1/3/7) | Activation rate |
| P1 | CMMC control coverage map in dashboard | Jordan's SPRS clarity |
| P1 | SPRS improvement estimate displayed | Purchase trigger |
| P2 | Brain AI query endpoint live | Founder tooling |
| P2 | Competitor intelligence (Nightfall, Strac) ingested | Sales enablement |

---

## SPRINT 4 (Week of May 19, 2026)
**Goal:** $1K MRR. C3PAO white-label dashboard MVP.

| Priority | Task | Revenue Impact |
|----------|------|---------------|
| P1 | C3PAO white-label portal (Agency tier unlock) | $1,499/mo per C3PAO |
| P1 | 5-customer case study published | Social proof |
| P2 | Google Ads: "CMMC Level 2 compliance" keyword | Paid acquisition channel |
| P2 | LinkedIn content: CMMC countdown posts | Organic acquisition |

---

## $5K MRR MILESTONE (Target: June 20, 2026 — Day 45)
**Unlock:** Start building Phase2AI companion product.

At $5K MRR the CMMC beachhead is validated. Phase2AI (CMMC Level 2 sprint kit, $999/mo, 90-day program) becomes the front door funnel that drives users to HoundShield.

---

## $10K MRR MILESTONE (Target: August 4, 2026 — Day 90)

| Feature | Why now |
|---------|---------|
| Phase2AI sprint kit | Front door for DIB contractors |
| SSP auto-generation | C3PAO-required artifact |
| Multi-tenant MSP portal | Agency tier upgrade |
| Reseller certification program | C3PAO partner flywheel |

---

## POST $10K MRR (Backlog — Do Not Touch Before)

- SIEM integration (Azure Sentinel, Splunk HEC)
- Browser extension public launch
- Mobile app
- Blockchain-anchored audit trail
- SOC 2 / ISO 27001 modules
- Load testing at 1,000 req/sec
- OWASP security review
- Kubernetes deployment
- Forge (MCP billing layer) — build second if CMMC hits Gate 4

---

## What's NOT on the Roadmap (Explicit Kills)

| Feature | Reason killed |
|---------|--------------|
| Remotion video export | Zero Jordan relevance |
| 3D hero animations | Bundle bloat, not conversion driver |
| Blockchain anchoring (pre-$10K) | Vaporware to defense IT buyers |
| B2C product | Wrong market |
| Dark → light mode switch | 2 sprint cost, zero revenue impact |
| Mobile app | Jordan manages from desktop |
| Gemini/Bard chat UI | Not what Jordan is buying |
