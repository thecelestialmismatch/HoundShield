# Kaelus.ai Evolution Strategy
## Resource Audit · Competitive Analysis · Venture-Ready Roadmap

---

## Executive Summary

Kaelus.ai is an **AI compliance firewall** for defense contractors pursuing CMMC Level 2 certification. It intercepts, analyzes, and sanitizes AI traffic in real-time. Currently **mid-alpha (60% complete)**, the product has a working landing page, command center dashboard, SPRS scoring engine (110 NIST 800-171 controls), AI chat via OpenRouter, a 12-tool ReAct agent, risk classification (16 patterns), rate limiting, AES-256 quarantine, and SHA-256 audit trails.

**Critical gaps:** Authentication, database wiring, payments, deployment, email, analytics.

**The play:** Launch a $0-budget MVP targeting small defense contractors ($99–$499/mo), scale to $10K MRR in 12 months, and position for YC S26.

---

## Phase 1: Resource Audit

### Resources to Integrate

| Resource | Core Value | Integration Point | Priority |
|---|---|---|---|
| [context-mode](https://github.com/mksglu/context-mode) | Privacy-first context optimization, 98% token reduction, local SQLite + FTS5 | Agent Orchestrator — session continuity & token efficiency | **P0** |
| [code-review-graph](https://github.com/tirth8205/code-review-graph) | Local knowledge graph via Tree-sitter AST, 6.8× token reduction on reviews | Compliance scanning engine — structural code analysis | **P1** |
| [axon](https://github.com/harshkedia177/axon) | Graph-powered code intelligence, local processing, impact analysis | Customer codebase scanning for compliance gaps | **P1** |
| [ccg-workflow](https://github.com/fengshao1227/ccg-workflow) | Multi-model collaboration (Claude + Codex + Gemini), 28 lifecycle commands | Internal dev workflow acceleration | **P2** |
| [gstack](https://github.com/garrytan/gstack) | Role-based AI tooling (15 tools) | Internal dev productivity, inspiration for role-based agent design | **P2** |
| [everything-claude-code](https://github.com/affaan-m/everything-claude-code) | AgentShield security auditor, Skill Creator, Continuous Learning | Agent self-improvement pipeline, security hardening | **P2** |
| [GitNexus](https://github.com/abhigyanpatwari/GitNexus) | Zero-server browser-side code intelligence, Graph RAG | Customer-facing "compliance explorer" feature (future) | **P3** |
| [public-apis](https://github.com/public-apis/public-apis) | Curated API directory (1,400+ APIs) | Reference for integration opportunities (NIST feeds, CVE databases) | **P3** |

#### Integration Roadmap

```
MVP (Month 1-2):
  └─ context-mode patterns → Agent Orchestrator
     ├─ Local SQLite session store for audit trails
     ├─ FTS5 search for compliance event retrieval  
     └─ Token budget enforcement (critical at $0 budget)

Scale (Month 3-6):
  ├─ code-review-graph → Compliance Scanner v2
  │   ├─ Tree-sitter AST for customer code analysis
  │   └─ Knowledge graph for NIST control mapping
  └─ axon → Customer Codebase Intelligence
      ├─ Dependency graph for supply chain risk
      └─ Impact analysis for compliance drift detection

Growth (Month 6-12):
  ├─ GitNexus patterns → Browser-based Compliance Explorer
  ├─ everything-claude-code → Agent self-improvement loop
  └─ ccg-workflow → Multi-model agent architecture
```

### Resources Not Included

| Resource | Reason |
|---|---|
| [heretic](https://github.com/p-e-w/heretic) | Censorship removal — **antithetical** to a compliance product |
| [cursor-free-vip](https://github.com/SHANMUGAM070106/cursor-free-vip) | License circumvention tool — legal/reputational risk |
| [claude-code-toolkit](https://github.com/notque/claude-code-toolkit) | Generic toolkit, no unique value over direct implementation |
| [tinyfish-cookbook](https://github.com/tinyfish-io/tinyfish-cookbook) | Web agent recipes — tangential to core compliance focus |

---

## Phase 2: Competitive Analysis

### Vanta — The Gorilla

| Dimension | Vanta | Kaelus.ai |
|---|---|---|
| **Focus** | Broad compliance (SOC 2, HIPAA, ISO 27001, PCI, GDPR) | Deep CMMC L2 + AI traffic compliance |
| **Pricing** | $10K–$50K+/yr (enterprise) | $99–$499/mo (SMB) |
| **Target** | Startups → Enterprise | Small defense contractors (< 500 employees) |
| **AI Integration** | AI for risk scoring & evidence collection | AI for real-time traffic interception & sanitization |
| **Deployment** | SaaS with 300+ integrations | SaaS with agent-based monitoring |
| **Moat** | Brand, integrations, audit partnerships | Specificity, price, AI-native architecture |

> [!IMPORTANT]
> **Kaelus.ai does NOT compete with Vanta head-on.** Vanta is a $2.45B company serving broad compliance. Kaelus.ai occupies **the intersection of AI security + CMMC** — a niche Vanta doesn't deeply serve. The wedge: *"AI is the new attack surface, and CMMC doesn't cover it yet."*

#### Vanta's Blind Spots (Kaelus.ai Advantages)
1. **No AI traffic monitoring** — Vanta audits systems, not AI conversations
2. **Price prohibitive for < 50 person shops** — Kaelus.ai starts at $99/mo
3. **No CMMC-specific scoring** — Kaelus.ai has native SPRS with 110 controls
4. **No real-time interception** — Vanta is periodic, Kaelus.ai is continuous

### Struere.co — The Emerging Threat

| Dimension | Struere.co | Kaelus.ai |
|---|---|---|
| **Focus** | AI-native operational systems (replacing spreadsheets) | AI compliance firewall |
| **Stage** | Public beta | Alpha (60%) |
| **Overlap** | Workflow automation, AI-driven operations | AI-driven compliance operations |
| **Threat Level** | Low — different problem space | N/A |

> [!NOTE]
> Struere is building **operational intelligence**, not compliance. They could become a complementary platform (compliance data → operational dashboards) rather than a competitor. Monitor quarterly.

### Competitive Positioning Matrix

```
                    BROAD COMPLIANCE ──────── NARROW COMPLIANCE
                    │                                        │
ENTERPRISE ─────────┤  Vanta ($2.45B)                        │
                    │  Drata ($1B+)                          │
                    │  Secureframe                           │
                    │                                        │
MID-MARKET ─────────┤  Sprinto                               │
                    │  Thoropass                    ┌────────┤
                    │                               │KAELUS  │
SMB ────────────────┤  (nobody)                     │  .AI   │
                    │                               └────────┤
                    │                                        │
                    └────────────────────────────────────────┘
                                                  ↑
                                          CMMC + AI Security
```

**Kaelus.ai owns the bottom-right quadrant: SMB × CMMC + AI Security.** No one else is there.

---

## Phase 3: Evolution Strategy & PRD

### Vision
> Transform Kaelus.ai from an AI compliance firewall into the **operating system for defense contractor compliance** — and ultimately, the AI security layer for any regulated industry.

### Revenue Model

| Tier | Price | Target | Features |
|---|---|---|---|
| **Starter** | $99/mo | Solo contractors | SPRS scoring, 5 assessments/mo, basic AI monitoring |
| **Professional** | $249/mo | Small teams (5-20) | Unlimited assessments, full AI firewall, audit reports |
| **Enterprise** | $499/mo | MSPs/Consultants | Multi-tenant, white-label, API access, priority support |

### Roadmap

#### 🚀 Phase 1: MVP Revenue Launch (Month 1-2) — Target: $1K MRR

**Goal:** Ship a working product that takes money.

| Task | Details | Status |
|---|---|---|
| Wire Supabase Auth | Email/password + magic links, RLS policies | 🔴 Not started |
| Connect database | Migrate mock data → Supabase PostgreSQL | 🔴 Not started |
| Integrate Stripe | 3 tiers, checkout, portal, webhooks | 🔴 Not started |
| Deploy to Vercel | CI/CD from `main`, env vars, preview deploys | 🔴 Not started |
| Domain + DNS | kaelus.ai via Cloudflare | 🔴 Not started |
| Email (Resend) | Welcome, assessment complete, billing alerts | 🔴 Not started |
| Error tracking (Sentry) | Client + server error capture | 🔴 Not started |
| Analytics (PostHog) | Events, funnels, feature flags | 🔴 Not started |
| SEO + Legal | Meta tags, sitemap, privacy policy, ToS | 🔴 Not started |
| Landing page CTA | Convert visitors → trial signups | 🟡 Partial |

**Go-to-Market (Week 1-4):**
- Product Hunt launch (Day 1)
- r/cybersecurity, r/cmmc, r/compliance posts
- LinkedIn thought leadership (3×/week)
- Cold outreach to 50 defense contractors
- Free SPRS assessment as lead magnet

**$0 Budget Stack:**
- Supabase Free (500MB, 50K MAU)
- Vercel Hobby (100GB bandwidth)
- Stripe (2.9% + $0.30 per transaction — no monthly fee)
- OpenRouter free models (Llama 3, Mixtral)
- Resend (3K emails/mo free)
- Sentry (5K errors/mo free)
- PostHog (1M events/mo free)

---

#### 📈 Phase 2: Scale to $5K MRR (Month 3-6)

**Goal:** Product-market fit signals, 20-50 paying customers.

| Feature | Impact | Implementation |
|---|---|---|
| **Automated SPRS Reports** | PDF/CSV export, auditor-ready format | React-pdf generation |
| **Compliance Dashboard v2** | Trend lines, risk heatmaps, control status | D3.js or Recharts |
| **AI Agent v2** | Multi-model (Claude + Llama), context-mode patterns | Token budget system from context-mode |
| **Notification System** | Compliance drift alerts, assessment reminders | Resend + in-app notifications |
| **API v1** | REST API for MSP integrations | Next.js API routes + API key auth |
| **Customer Code Scanning** | Tree-sitter AST analysis for compliance gaps | code-review-graph patterns |

**Growth Tactics:**
- Case studies from first 10 customers
- Webinar: *"AI Compliance for Defense Contractors"*
- Partnership with 2-3 CMMC assessors (C3PAOs)
- Content SEO: 20 articles on CMMC + AI security
- Affiliate program for consultants (20% rev share)

**Pivot Decision Point (Month 4):**
> [!WARNING]
> If < 15 paying customers by Month 4, evaluate pivots:
> - **Pivot A:** Broaden to SOC 2 + HIPAA (compete with Vanta on price)
> - **Pivot B:** Pure AI security monitoring (drop compliance, focus on AI threat detection)
> - **Pivot C:** Developer tool (AI code security scanner)
> - **Stay course** if qualitative signals are strong but sales cycle is long

---

#### 🏆 Phase 3: Scale to $10K MRR & Product-Market Fit (Month 6-12)

**Goal:** 40-100 customers, clear PMF, YC-ready metrics.

| Feature | Impact | Implementation |
|---|---|---|
| **Multi-tenant Architecture** | MSPs manage multiple clients | Supabase RLS + org hierarchy |
| **White-label Mode** | Consultants brand as their own | CSS theming + custom domains |
| **Compliance Knowledge Graph** | Map customer infrastructure → NIST controls | axon patterns + Neo4j or Supabase pgvector |
| **AI Agent v3** | Autonomous compliance remediation suggestions | ReAct v2 + code-review-graph |
| **Blockchain Audit Trail** | Tamper-proof compliance evidence | Ethereum L2 (Base) or Solana for timestamps |
| **SOC 2 Module** | Expand compliance coverage | Reuse SPRS engine architecture |

**YC Application Metrics Target:**
- $10K+ MRR
- 40%+ MoM revenue growth (early months)
- < 5% monthly churn
- NPS > 50
- 3+ case studies with measurable ROI

**Blockchain Integration Strategy:**
```
Phase 3a: Audit Trail Anchoring
  └─ Hash each compliance assessment → anchor to Base L2
     ├─ Tamper-proof evidence for auditors
     ├─ Timestamped proof of compliance state
     └─ Cost: ~$0.001 per anchor (negligible)

Phase 3b (Optional): Compliance NFTs
  └─ Mint "CMMC Compliant" badge as SBT
     ├─ Verifiable credential for supply chain partners
     └─ Marketing differentiator
```

---

## Phase 4: Technical Architecture Evolution

### Current Architecture
```
┌──────────┐    ┌──────────────┐    ┌────────────┐
│ Next.js  │───▶│ ReAct Agent  │───▶│ OpenRouter │
│ Frontend │    │ (12 tools)   │    │ (Free LLMs)│
└──────────┘    └──────────────┘    └────────────┘
     │                │
     ▼                ▼
┌──────────┐    ┌──────────────┐
│ Supabase │    │ Risk Engine  │
│ (planned)│    │ (16 patterns)│
└──────────┘    └──────────────┘
```

### Target Architecture (Month 12)
```
┌─────────────────────────────────────────────────────┐
│                    KAELUS PLATFORM                    │
├─────────────┬───────────────┬───────────────────────┤
│  Dashboard  │  Compliance   │   AI Firewall         │
│  (Next.js)  │  Explorer     │   (Real-time)         │
│             │  (GitNexus)   │                       │
├─────────────┴───────────────┴───────────────────────┤
│              API Layer (REST + WebSocket)             │
├──────────────────────────────────────────────────────┤
│  Agent Orchestrator v3                                │
│  ├─ context-mode (token budget + session memory)      │
│  ├─ Multi-model routing (Claude/Llama/Mixtral)        │
│  └─ Self-improvement loop (everything-claude-code)    │
├──────────────────────────────────────────────────────┤
│  Intelligence Layer                                   │
│  ├─ SPRS Scoring Engine (110 controls)                │
│  ├─ Risk Classification (16+ patterns)                │
│  ├─ Code Analysis (Tree-sitter + knowledge graph)     │
│  └─ Compliance Knowledge Graph (axon patterns)        │
├──────────────────────────────────────────────────────┤
│  Data Layer                                           │
│  ├─ Supabase PostgreSQL (primary)                     │
│  ├─ SQLite (local agent state — context-mode)         │
│  ├─ pgvector (semantic search)                        │
│  └─ Blockchain anchoring (Base L2)                    │
├──────────────────────────────────────────────────────┤
│  Infrastructure                                       │
│  ├─ Vercel (hosting + edge functions)                 │
│  ├─ Cloudflare (CDN + DDoS)                           │
│  └─ Stripe (billing)                                  │
└──────────────────────────────────────────────────────┘
```

### Key Technical Decisions

| Decision | Rationale |
|---|---|
| **Keep Next.js** | Full-stack, Vercel-native, React 19 Server Components reduce client JS |
| **Supabase over Firebase** | PostgreSQL power, RLS for multi-tenant, pgvector for embeddings |
| **OpenRouter over direct API** | Model flexibility, free tier, no vendor lock-in |
| **SQLite for agent state** | Fast local reads, no network latency, privacy-first (context-mode pattern) |
| **Base L2 for blockchain** | Coinbase-backed, < $0.01 transactions, Ethereum security |

---

## Phase 5: Financial Projections

### Year 1 Revenue Model (Conservative)

| Month | Customers | Avg Revenue | MRR | Notes |
|---|---|---|---|---|
| 1 | 3 | $150 | $450 | Friends/family + early adopters |
| 2 | 8 | $160 | $1,280 | Product Hunt + content marketing |
| 3 | 15 | $180 | $2,700 | First enterprise pilot |
| 4 | 22 | $190 | $4,180 | Referral program kicks in |
| 5 | 30 | $200 | $6,000 | C3PAO partnership revenue |
| 6 | 38 | $210 | $7,980 | Pivot decision validated |
| 7-12 | 40-100 | $220 | $8.8K-$22K | Scale with PMF |

### Cost Structure ($0 → Minimal)

| Item | Month 1-3 | Month 4-6 | Month 7-12 |
|---|---|---|---|
| Hosting | $0 (free tiers) | $20/mo (Vercel Pro) | $20/mo |
| Database | $0 (Supabase free) | $25/mo (Pro) | $25/mo |
| AI Models | $0 (free models) | $50/mo (paid models) | $200/mo |
| Email | $0 (Resend free) | $0 | $20/mo |
| **Total** | **$0** | **$95/mo** | **$265/mo** |
| **Margin** | 100% | 98.8% | 97-99% |

---

## Phase 6: YC Application Brief

> **One-liner:** Kaelus.ai is an AI compliance firewall that helps defense contractors pass CMMC certification while safely using AI tools.

> **Progress:** Working product with SPRS scoring, AI traffic monitoring, and risk classification. Launching MVP in 4 weeks.

> **Market:** 300,000+ defense contractors need CMMC L2 by 2026. No existing solution covers AI-specific compliance risks. TAM: $9B+ (compliance software for defense).

> **Why now:** (1) CMMC enforcement begins 2025-2026, (2) AI adoption in defense is exploding, (3) No one monitors AI traffic for compliance — we do.

> **Ask:** $500K at $5M cap to hire 2 engineers and scale to 500 customers.

---

## Immediate Next Steps (This Week)

1. **Wire Supabase Auth** — email/password login, RLS policies
2. **Connect mock data → real database** — migrate SPRS scores, controls
3. **Stripe checkout** — 3 tiers, billing portal
4. **Deploy to Vercel** — CI/CD from `main` branch
5. **Domain setup** — kaelus.ai via Cloudflare

> [!CAUTION]
> **Do not add new features until the MVP ships.** The #1 risk is building instead of selling. Get 3 paying customers before writing another line of feature code.
