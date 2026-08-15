# ORACLE Deep Research — 3 SaaS Ideas
> **CMMC Phase 2 status — paused (verified 2026-08-15).** The Department of War
> suspended Phase 2 enforcement on **2026-07-13** pending a Reform Task Force
> review (RFI closed 2026-08-14; report due on or about 2026-09-13). The
> 10 November 2026 date has **not** been replaced and remains the date to be
> ready for. Nothing underneath it moved: DFARS 252.204-7012, all 110 NIST
> SP 800-171 Rev 2 controls and the annual SPRS self-assessment are unaffected.
> Any November date appearing below must be read against this.
>
> Canonical source: `compliance-firewall-agent/lib/compliance/cmmc-status.ts`.
> Update the status there, never here.


## Operation HOUND | 2026-05-13

## Ranking

| Rank | Idea | Time to $5K MRR | ACV | Build |
|------|------|-----------------|-----|-------|
| **#1** | AIBudgetGuard | 30 days | $99–$999/mo | 14 days |
| **#2** | SSP Generator | 45 days | $2,499/unit | 21 days |
| **#3** | Shadow AI Monitor | 90+ days | $2,999–$9,999/mo | 4–6 weeks |

**Decision: Build #1 (AIBudgetGuard) in Month 2. Build #2 as HoundShield upsell Month 3. #3 post $10K MRR.**

---

## Idea #1: AIBudgetGuard (BUILD NOW)

**Problem:** Engineering teams using OpenAI/Anthropic/Gemini APIs have zero real-time visibility
into who is spending what, no budget enforcement before the invoice, and no way to attribute
costs to business units without a forest of API keys.

**Signal:** "We got a $47K OpenAI invoice. Zero visibility which team caused it." — CTO LinkedIn
HN thread "How do you control OpenAI API costs" — 400+ upvotes, no good answer.

**Buyer:** CTO / VP Eng at 50–500 person Series A–C. $2K–$50K/mo AI spend. Budget authority
under $1K/mo — no procurement cycle.

**Why HoundShield can build this fast:**
- `proxy/server.ts` reuses 100%
- Recharts dashboard component reuses ~80%
- Supabase schema extends existing
- Stripe already wired

**V1 (14 days, 5 features only):**
1. Proxy passthrough — single baseURL change, zero code changes for customers
2. Cost attribution — reads X-User-ID / X-Project-ID headers
3. Budget caps — hard block at limit, soft alert at 80%
4. Slack/Teams alerts — "Engineering-Backend at 80% of $2K budget"
5. Dashboard — spend by team/project over time, CSV export

**Revenue model:**
- Starter $99/mo (10 users, 3 providers)
- Growth $299/mo (50 users, all providers)
- Enterprise $999/mo (unlimited, SSO)

**Path to $5K MRR:** 17 Growth accounts. Self-serve same day.

**First 10 customers:** HN Show HN post, Reddit r/devops, LinkedIn cold outreach to CTOs
who publicly complained about AI bills in last 90 days.

**Fatal flaws addressed:**
- OpenAI won't build this (incentive to increase spend, not reduce)
- Proxy latency already solved by HoundShield (<10ms)
- Datadog covers infra metrics, not AI cost governance at SMB price

---

## Idea #2: SSP Generator (Month 3 upsell)

**Problem:** CMMC L2 requires a 200–400 page System Security Plan. Consultants charge
$30K–$100K, 3–6 months. ~80,000 contractors need one by November 2026 enforcement.

**Buyer:** Same as HoundShield — Jordan, IT Security Manager at 50–250 person DoD contractor.

**Product:** 2-hour AI interview → C3PAO-reviewed SSP covering all 110 NIST 800-171 Rev 2 controls.
$2,499 one-time + $299/mo update subscription.

**Path to $5K MRR:** 2 SSPs. Natural HoundShield upsell once C3PAO partner relationships
are established from Sprint 2.

---

## Idea #3: Shadow AI Monitor (Year 2)

**Problem:** 400+ SaaS tools have embedded AI. IT/Security teams can't see what data
flows through Notion AI, Figma AI, Copilot, Zoom AI.

**Why not now:** 90-day enterprise sales cycle, network-layer complexity, wrong for pre-revenue.
Build after $10K MRR with CISO brand credibility.

**Ceiling:** ~$50M ARR at $2,999–$9,999/mo enterprise.
