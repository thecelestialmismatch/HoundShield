# HoundShield — 30-Day Sprint to $5K MRR
**Version:** 2.0 | **Updated:** May 2026

> **Prime objective: $5,000 MRR in 30 days.**
> Every task traces to this. If it doesn't, it waits.

---

## Week 1 (Days 1-7): Fix Blockers, Deploy Clean

**Goal:** Live on houndshield.com with zero Kaelus refs, correct pricing, working Stripe.

### Day 1-2 — Critical Blockers (DONE ✅)
- [x] Pricing coherence: Free | Pro $199 | Growth $499 | Enterprise $999 | Agency $2,499
- [x] Kill all 147 Kaelus references (batch rename, verified 0 remaining)
- [x] `app/api/stripe/checkout/route.ts` PRICE_MAP aligned to correct tiers
- [x] Dead code deleted: price-ids.ts, KaelusV2 components, dead health files
- [x] Light mode activated on landing (remove `dark` from `<html>`)
- [x] `.env.example`: `NEXT_PUBLIC_APP_URL=https://houndshield.com`

### Day 3 — Manual Deploy Steps (REQUIRES CREDENTIALS)
- [ ] Update Stripe webhook URL: `https://houndshield.com/api/stripe/webhook` (dashboard.stripe.com/webhooks)
- [ ] Set `STRIPE_WEBHOOK_SECRET` in Vercel dashboard
- [ ] Set `OPENROUTER_API_KEY` in Vercel dashboard
- [ ] Run `cd compliance-firewall-agent && npx supabase db push` with prod env vars

### Day 4-5 — First 10 Outbound
- [ ] DM 10 IT Security Managers on LinkedIn: "Your CMMC AI gap is the one your assessor will ask about first"
- [ ] Post in 3 DIB contractor Slack communities with proxy URL + 5-minute setup guide
- [ ] Submit to CMMC marketplace directories (CMMC-AB, CMMC COE)

### Day 6-7 — Demo + Proof
- [ ] Record 3-minute Loom: Jordan persona, one env var change, first scan blocked, PDF export
- [ ] Post on LinkedIn: "We intercepted 847 AI prompts in one week at a 150-person defense contractor. Here's what they were sending." (anonymized data)

---

## Week 2 (Days 8-14): 10 Paying Customers

**Goal:** 10 paying at any tier. $1,990 MRR.

- [ ] Onboarding email sequence live (5 emails, 7 days)
- [ ] SPRS baseline estimate on signup ("Your estimated SPRS: -68")
- [ ] 3-step guided setup wizard after signup
- [ ] Cold outreach to 25 C3PAOs: partner program pitch, 20% rev share
- [ ] Follow up Week 1 leads. Offer free PDF audit: "Send us your AI tool list, we'll score your SPRS gap."

**KPI gate:** If <5 paying by Day 10, pivot outreach script. If <3 by Day 14, pause features and go full sales mode.

---

## Week 3 (Days 15-21): C3PAO Partner Channel

**Goal:** 3 signed C3PAO partners. Each refers 2+ clients = 6+ customers.

- [ ] `/partners` page live — partner program details, rev share structure, signup form
- [ ] C3PAO partner portal: `/command-center/partners` (basic: referral link, commission tracking)
- [ ] Blog post #1: "The CMMC AI Gap: What Your C3PAO Will Find in November 2026"
- [ ] Blog post #2: "From SPRS -68 to +34: How One Defense Contractor Fixed Their AI Problem in a Week"
- [ ] LinkedIn carousel: 10 things that can get your CUI classification revoked (AI-related)

---

## Week 4 (Days 22-30): $5K MRR

**Goal:** 25 paying customers. $5,000+ MRR.

- [ ] Enterprise outreach: 5 defense primes (Booz Allen, SAIC, Leidos tier-3 suppliers)
- [ ] Webinar: "CMMC Level 2 AI Compliance in 30 Minutes" — live demo + Q&A
- [ ] Annual plan push: "Lock in today's pricing — 2 months free on annual"
- [ ] Track and publish: "X prompts intercepted, Y CUI violations blocked, Z contractors protected this month"

---

## 30-Day MRR Model

| Week | Customers | Avg Tier | MRR     |
|------|-----------|----------|---------|
| 1    | 3         | Pro $199  | $597    |
| 2    | 10        | Pro $199  | $1,990  |
| 3    | 17        | Mix      | $3,400  |
| 4    | 25        | Mix      | $5,000+ |

Mix assumption (Week 4): 15× Pro $199 + 7× Growth $499 + 3× Enterprise $999 = $2,985 + $3,493 + $2,997 = $9,475 MRR if hitting Growth/Enterprise. Conservative model: 25× Pro = $4,975.

---

## Month 2-3: $10K MRR → YC Application

- 50+ paying customers
- 5+ C3PAO partners actively referring
- Track 2 product (AIBudgetGuard) in private beta
- SSP Generator as Enterprise upsell
- Apply YC S26 or W27 with: $10K MRR + 50 customers + 3 C3PAO partners + clear path to $100K MRR
