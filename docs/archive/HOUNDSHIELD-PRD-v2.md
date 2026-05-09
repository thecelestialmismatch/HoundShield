# HoundShield — Product Requirements Document v2
*Version 2.0 — 2026-04-25 | Supersedes KAELUS-PRD.md*
*OODA-validated. Built from real market signals, not assumptions.*

---

## MANAGER MODE — READ THIS FIRST

Claude acts as a co-founder and project manager. Before every task, Claude checks:

1. "Is this task on the roadmap or in the active sprint?"
2. "Does this work serve the CMMC buyer directly?"
3. "Are we building a feature or building distribution?"

If the answer to any of these is unclear, Claude asks before executing. The standard question is:

> "This looks like [X]. Our current sprint is [Y]. Are we deliberately shifting focus or should I stay on the plan?"

Drift indicators Claude watches for:
- Adding UI polish when no paying customers exist yet
- Building features for hypothetical enterprise buyers
- Refactoring without a failing test
- Expanding the Brain AI module instead of talking to customers

When drift is detected, Claude flags it with: **[MANAGER CHECK]** and asks the user to confirm direction before proceeding.

---

## EXECUTIVE SUMMARY

HoundShield is a local-only AI compliance firewall for CMMC Level 2 defense contractors. It intercepts every AI prompt before it leaves the network, scans for CUI in under 10ms, and generates PDF audit reports that satisfy C3PAO evidence requirements. One URL change to deploy. Nothing leaves the customer's infrastructure.

**Core technical moat:** DFARS 7012 requires CUI to stay within the contractor's protected environment. Every cloud-based AI DLP tool (Nightfall, Strac, Cyberhaven, Netskope) sends CUI to their servers for scanning -- that is itself a potential DFARS violation. HoundShield scans locally. This is not a marketing claim. It is a regulatory architecture requirement that competitors cannot copy without rebuilding their entire product.

**Forcing function:** CMMC Phase 2 enforcement begins November 10, 2026. ~80,000 contractors need Level 2 certification. ~400 are certified. The window is now.

**Revenue target:** $10K MRR by October 2026. YC S26/W27 application.

---

## SECTION 1: THE BUYER

### Primary Persona: Jordan

**Title:** IT Security Manager or Compliance Manager
**Company:** 50-250 person DoD subcontractor
**Situation:** Prime contractor issued CMMC mandate. C3PAO pre-assessment booked within 90 days. Engineers use ChatGPT and Copilot daily. Jordan has zero visibility into what they are sending. The C3PAO questionnaire asks: "What controls do you have on AI tool usage?" Jordan cannot answer.

**What Jordan needs (in order of urgency):**
1. Visibility into AI traffic -- what are employees sending to external AI services
2. A control she can document for the auditor -- not just a policy, actual enforcement
3. A PDF audit report she can hand to the C3PAO as evidence
4. Something her engineers will not revolt against -- transparent, no behavior change required
5. Something she can deploy in a day without a six-month procurement process

**What Jordan does NOT need:**
- A virtual pixel office
- An AI memory system
- A workspace or knowledge base
- A calendar or timeline view
- Anything that requires a change management process to deploy

**Budget context:** Jordan is already spending $30K-$150K on C3PAO assessment fees. A $199-$499/month tool that reduces her assessment scope is cheap. Price is not the objection.

---

## SECTION 2: CURRENT STATE (HONEST)

### What Works Right Now

| Feature | Location | State |
|---------|----------|-------|
| HTTPS proxy with CUI scanning | `proxy/server.ts` + `proxy/scanner.ts` | WORKING |
| 16 detection patterns | `proxy/patterns/index.ts` | WORKING |
| CMMC Gap Assessment | `app/command-center/shield/assessment/` | WORKING |
| SPRS scoring engine | `lib/shieldready/scoring.ts` | WORKING |
| Real-time threat feed | `app/command-center/realtime/` | WORKING |
| Quarantine system | `app/command-center/quarantine/` | WORKING |
| AI gateway intercept | `app/api/gateway/intercept/route.ts` | WORKING |
| Audit log with Merkle anchoring | `lib/audit/` | WORKING |
| Stripe subscription | wired | WORKING |
| Supabase auth | wired | WORKING |

### What Is Broken or Missing

| Feature | Gap | Priority |
|---------|-----|----------|
| PDF compliance report | `app/api/reports/generate/` returns JSON only | P0 -- C3PAOs require PDF |
| One-command install | `proxy/install.sh` exists but incomplete | P0 -- without this, Jordan cannot deploy |
| Brain AI (queryable) | `brain/research.md` is static, not queryable | P1 |
| Landing page copy | Too much decoration, not enough proof | P1 |
| Customer discovery | Zero paying customers | P0 |

---

## SECTION 3: WHAT WE ARE BUILDING (BY SPRINT)

### Sprint 1 -- Week of 2026-04-28 (Foundation)

**Goal:** Jordan can deploy in under 10 minutes and get her first PDF report.

Tasks:
- [ ] Complete `proxy/install.sh` -- curl pipe bash, starts Docker, configures proxy URL
- [ ] Wire PDF generation in `app/api/reports/generate/` (use @react-pdf/renderer or Puppeteer)
- [ ] E2E test: proxy intercepts ChatGPT traffic -> CUI flagged -> PDF exported
- [ ] Landing page: remove all decorative gradients, rewrite hero copy to Jordan's pain
- [ ] Push Supabase migrations 003+004 to production

### Sprint 2 -- Week of 2026-05-05 (Distribution)

**Goal:** First C3PAO referral partner. One paying customer.

Tasks:
- [ ] Contact 10 C3PAOs from CMMC-AB marketplace
- [ ] Record 3-minute demo video: CUI paste -> ChatGPT block -> PDF export
- [ ] Set Stripe webhook in dashboard
- [ ] Partner landing page at /partner with C3PAO referral program details
- [ ] Publish one technical blog post: "Why cloud-based AI DLP violates DFARS 7012"

### Sprint 3 -- Week of 2026-05-12 (Brain AI)

**Goal:** Brain AI answers any question about HoundShield, CMMC, or market landscape without re-reading the codebase.

Tasks:
- [ ] Build queryable knowledge graph on top of existing `lib/brain-ai/` module
- [ ] Ingest: CMMC framework docs, NIST 800-171 controls, competitor profiles, market data
- [ ] Wire Firecrawl integration for ongoing competitor intelligence
- [ ] Browser automation (via browser-harness-js) for competitor monitoring
- [ ] Verify Brain AI returns correct answers to 20 test questions before marking complete

### Sprint 4 -- Week of 2026-05-19 (Scale)

**Goal:** 5 paying customers. $1K MRR.

Tasks:
- [ ] Onboarding email sequence (3 emails, day 1/3/7)
- [ ] In-app CMMC control coverage report -- shows Jordan which controls HoundShield covers
- [ ] C3PAO white-label dashboard (rebrandable for C3PAOs to resell)
- [ ] Automated SPRS score improvement tracker

---

## SECTION 4: TECHNICAL ARCHITECTURE

### Local-Only Data Boundary (SACRED)

```
Customer Infrastructure (never leaves this boundary):
  - All AI prompt content
  - All CUI detection results
  - All audit logs
  - All compliance reports
  - Pattern matching engine
  - Scanner output

External communications (hashed only):
  - License key hash (no prompt content)
  - Prompt count aggregate for billing (number only, no content)
```

Any change that could cause prompt content to cross this boundary is a CRITICAL security finding. Stop all work, invoke team-lead agent.

### Proxy Architecture

```
Employee AI request
    |
    v
HoundShield Proxy (local)
    |-- Scanner (16 patterns, <10ms)
    |-- CUI flagged? -> Block + log + alert
    |-- Clean? -> Forward to AI provider
    |
    v
Audit log (Supabase, local deployment option)
    |
    v
PDF Report (on-demand, C3PAO evidence grade)
```

### Stack

```
Frontend:    Next.js 15, React 19, Tailwind, Framer Motion (limited), Recharts
Backend:     Next.js API routes + Node.js proxy server
Database:    Supabase (Postgres)
Auth:        Supabase Auth
Payments:    Stripe
Proxy:       Node.js HTTPS proxy (Docker-deployable)
AI:          Anthropic Claude claude-opus-4-7 (Brain AI only -- never on data path)
State:       Zustand
Types:       TypeScript strict mode, no any
Tests:       Jest, minimum 80% coverage
```

---

## SECTION 5: EXTERNAL INTEGRATIONS (FROM RESEARCH)

### Integrated via Skills

| Tool | Repo | Use in HoundShield |
|------|------|--------------------|
| browser-harness-js | browser-use/browser-harness-js | Competitor monitoring, automated demo testing |
| firecrawl | firecrawl/firecrawl | Brain AI knowledge ingestion, CMMC doc scraping |
| anywhere-agents | yzhao062/anywhere-agents | Agent config portability, destructive command guard |
| swarm-forge | unclebob/swarm-forge | Multi-agent orchestration for complex compliance tasks |
| space-agent | agent0ai/space-agent | Self-extending skill system for Brain AI |

### Skills Available in .claude/skills/

- `browser-harness`: CDP browser automation for competitive intelligence
- `firecrawl-ingest`: Structured web scraping for Brain AI ingestion
- `swarm-orchestrate`: Multi-agent task distribution
- `anywhere-guard`: Destructive command confirmation

---

## SECTION 6: PRICING

| Tier | Price | What it includes |
|------|-------|-----------------|
| Free | $0 | 100 prompts/day, basic CUI scan, no PDF |
| Growth | $199/mo | Unlimited prompts, PDF reports, CMMC gap view |
| Professional | $499/mo | Everything + SPRS tracker, HITL review, API access |
| Enterprise | $999/mo | Everything + SIEM integration, audit trail, SLA |
| C3PAO Partner | $2,499/mo | White-label dashboard, reseller portal, multi-client |

---

## SECTION 7: COMPLIANCE COVERAGE

| Framework | Controls Covered | Evidence Type |
|-----------|-----------------|---------------|
| CMMC Level 2 | AC.L2-3.1.3, AU.L2-3.3.1, SI.L2-3.14.1 (and 107 more) | PDF audit report |
| HIPAA | PHI detection, access logging, incident response | Audit log export |
| SOC 2 | CC6.1, CC6.6, CC6.7, CC7.2 (and more) | Evidence package |
| NIST 800-171 | All 110 controls mapped | SPRS score impact |

---

## SECTION 8: NORTH STAR METRICS

| Metric | Target | By |
|--------|--------|-----|
| Paying customers | 1 | 2026-05-01 |
| MRR | $1,000 | 2026-05-15 |
| MRR | $10,000 | 2026-10-01 |
| C3PAO partners | 3 | 2026-06-01 |
| YC application | Submitted | 2026-07-01 |

---

## SECTION 9: WHAT WE DO NOT BUILD

- Virtual office or workspace features
- Generic AI assistant or chatbot
- Anything that requires employees to change their AI tool behavior
- Any feature that doesn't directly serve Jordan's CMMC compliance need
- Any cloud-based scanning that crosses the local data boundary

If a feature request does not map to Jordan's pain points in Section 1, it goes in the backlog and stays there until $10K MRR is hit.

---

## LESSONS APPLIED

- Cloud DLP competitors cannot legally claim CMMC compliance for their architecture
- C3PAOs are the distribution channel, not the end buyer
- PDF evidence is the unlock -- Jordan needs something she can physically hand to an auditor
- One sentence beats three features: "Nothing leaves your network"
- Sprint 1 goal is one deployed customer, not one perfect product
