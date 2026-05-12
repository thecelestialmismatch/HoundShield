# houndshield — Product Requirements Document
*Version 2.0 | April 2026 | Manager-Mode Active*

> **MANAGER MODE RULE:** If the founder deviates from the CMMC-first beachhead or starts building features not on this roadmap, this document and the Brain AI should flag it explicitly: "You're off-plan. Here's what we agreed the priority was and why. Do you want to update the plan or return to it?"

---

## 1. PRODUCT IDENTITY

**Name:** houndshield
**Domain:** houndshield.com (also houndshield.com during transition)
**One-liner:** The only AI DLP proxy that runs inside your network — built for CMMC Level 2 defense contractors.
**Expanded:** houndshield intercepts every prompt before it reaches any external AI service (ChatGPT, Copilot, Claude, Gemini), scans for CUI, PII, PHI, and secrets in under 10ms, enforces SOC 2 + HIPAA + CMMC Level 2 simultaneously, and processes everything locally — zero data leaves the customer's infrastructure.

**Core technical constraint (non-negotiable):**
All prompt scanning and data processing runs locally. No prompt content crosses the customer's network boundary. Ever.

---

## 2. TARGET CUSTOMER (BEACHHEAD)

**Primary:** ISSO / IT Security Manager at a 50–500 person US defense contractor
- Has active DoD contract
- CMMC Level 2 assessment coming (November 2026 enforcement deadline)
- Engineers using AI tools (ChatGPT, Copilot, Claude) daily
- No current control over what employees send to AI tools
- Cannot afford Nightfall ($75K+/yr) or Forcepoint ($100K+ implementation)
- Can swipe a card for $199–$499/mo if it solves an audit problem

**Secondary (post-beachhead):**
- Healthcare IT (HIPAA, AI tool governance)
- SOC 2 auditing firms managing client AI tool usage
- MSPs/MSSPs serving defense or healthcare contractors

---

## 3. PROBLEM

Engineers at regulated organizations paste CUI, PHI, PII, and secrets into AI tools daily. They don't know they're violating compliance requirements. Their ISSOs don't know it's happening. When a C3PAO assessor asks "how do you control what employees send to AI tools?", the honest answer is "we don't." That answer fails CMMC Level 2 and risks contract loss.

Current workarounds:
1. Block AI tools entirely at firewall (kills productivity, engineers work around it)
2. Policy document ("don't paste CUI") — zero enforcement
3. Hope the assessor doesn't ask (most common, most dangerous)

**None of these generate an audit trail a C3PAO assessor will accept.**

---

## 4. SOLUTION

**Single proxy URL** — engineers change one environment variable. All AI traffic routes through houndshield first.

**Local scanning engine** — Regex + ML patterns run on-premises. No prompt content ever leaves the customer's network.

**Detection coverage:**
- CMMC: CUI markings, CAGE codes, contract numbers, clearance levels, export control markers
- PII: SSNs, passport numbers, driver's license numbers, credit card PANs, bank account numbers
- PHI: MRNs, diagnosis codes, medication names, treatment records, insurance IDs
- Secrets: API keys, AWS credentials, private keys, tokens, passwords
- Custom patterns: regex or ML rules added by customer

**Output:**
- Block or redact (configurable per pattern category)
- Immutable audit log (SHA-256 hash chain, tamper-evident)
- One-click PDF export for C3PAO assessors
- Real-time dashboard (blocked queries, threat categories, user activity)

---

## 5. COMPETITIVE DIFFERENTIATION

| | houndshield | Nightfall | Cloudflare AI GW | Forcepoint |
|---|---|---|---|---|
| Local processing (no cloud) | YES | No | No | Yes (enterprise) |
| CMMC-specific patterns | YES | Partial | No | Partial |
| Price | $199–$499/mo | $75K+/yr | Free (basic) | $100K+ impl |
| Setup time | 15 min | Weeks | Hours | Months |
| Audit PDF for C3PAO | YES | No | No | No |
| SOC2 + HIPAA + CMMC | YES | Partial | Partial | Yes |

**Legal moat:** Cloud DLP vendors process prompt content on their servers. Under NIST 800-171, CUI cannot be processed by unauthorized third-party systems. houndshield's local-only architecture is not just a feature — it is the only legally compliant architecture for CMMC.

---

## 6. FEATURE ROADMAP

### Phase 0 — Foundation (DONE / nearly done)
- [x] Proxy engine (intercept + scan + forward)
- [x] CMMC detection patterns (16 engines)
- [x] Audit log (SHA-256 chain)
- [x] PDF report export (jsPDF)
- [x] Stripe checkout ($199/$499/$999/$2499 tiers)
- [x] Supabase auth + dashboard
- [x] Basic landing page
- [ ] Docker image for local deployment (NEXT)
- [ ] Stripe webhook production (BLOCKER)
- [ ] Supabase migrations applied to production (BLOCKER)

### Phase 1 — CMMC Beachhead ($0 → $10K MRR)
Target: 20 paying defense contractors at $499/mo average

**P1 features:**
- [ ] Docker Compose one-liner deployment (local-only mode)
- [ ] CMMC-specific onboarding flow (assessor FAQ, audit prep guide)
- [ ] PDF audit report with C3PAO assessor template
- [ ] Browser automation for compliance checks (from browser-harness-js)
- [ ] GitHub auto-contributor for CMMC pattern updates (from auto-github-contributor)
- [ ] License key validation (local check, no prompt data transmitted)

**Distribution:**
- [ ] r/CMMC subreddit posts with Docker setup guide
- [ ] LinkedIn outreach to ISSOs at defense contractors
- [ ] C3PAO partnership program (co-marketing with assessors)
- [ ] CMMC marketplace listing (dibbs.net, govwin.iq)

### Phase 2 — Multi-Framework Expansion ($10K → $30K MRR)
Target: Add HIPAA (healthcare IT) and SOC 2 (startup/fintech)

**P2 features:**
- [ ] HIPAA-specific onboarding + patterns
- [ ] SOC 2 Type II audit trail format
- [ ] Multi-tenant dashboard (MSP/Agency tier)
- [ ] SSO (Okta, Azure AD) for enterprise
- [ ] Slack/Teams integration for alert notifications
- [ ] Webhook forwarding for SIEM integration (Splunk, Sentinel)

**AI agent integration (from researched repos):**
- [ ] Firecrawl integration for competitive intelligence scraping
- [ ] Ruflo multi-agent orchestration for compliance workflow automation
- [ ] OpenHarness harness for extensible tool plugins
- [ ] anywhere-agents portable config for developer workflow integration

### Phase 3 — Platform Mode ($30K → $100K MRR)
Target: Enterprise + MSP scale

**P3 features:**
- [ ] Gateway Mode (enterprise proxy with HA clustering)
- [ ] Brain AI (self-evolving compliance knowledge graph)
- [ ] Browser automation for compliance audits (browser-harness)
- [ ] Automated C3PAO pre-assessment workflow
- [ ] White-label for MSPs (co-branded portal, reseller pricing)
- [ ] On-prem Kubernetes deployment for air-gapped environments
- [ ] AI agent swarm for autonomous compliance monitoring (swarm-forge pattern)
- [ ] Space Agent integration for ambient compliance checking

### Phase 4 — Intelligence Layer ($100K+ MRR)
- [ ] Predictive compliance scoring (ML model trained on audit findings)
- [ ] Automated remediation suggestions
- [ ] Regulatory change monitoring (auto-update detection patterns on NIST changes)
- [ ] Cross-customer anonymized threat intelligence feed
- [ ] OpenMythos integration for advanced reasoning chains

---

## 7. PRICING (LOCKED)

| Tier | Price | Target | Key Gating |
|------|-------|--------|------------|
| Starter | Free | Evaluation | 1K scans/mo, no PDF export |
| Pro | $199/mo | Small contractors | 50K scans, PDF export, CMMC patterns |
| Growth | $499/mo | Mid-size contractors | 500K scans, multi-user, SIEM hooks |
| Enterprise | $999/mo | Large contractors | Unlimited, SSO, SLA |
| Agency | $2,499/mo | MSPs | Multi-tenant, white-label |

Annual discounts: 20% off (2 months free).

---

## 8. BEAST FEATURES FROM RESEARCHED REPOS

### From browser-harness-js (browser-use)
**What:** Thin CDP bridge — every Chrome DevTools Protocol method as typed JS call. Self-healing browser automation for AI agents.
**houndshield use:** Automated compliance checks via browser. houndshield agent opens the customer's AI tool dashboard, screenshots usage patterns, and flags non-compliant configurations — without requiring API access.
**Integration point:** `lib/agents/browser-audit.ts` — new module

### From ruflo (ruvnet)
**What:** Multi-agent orchestration platform for Claude. 64 specialized agents, hive-mind coordination, Truth Verification System.
**houndshield use:** Compliance workflow orchestration. When a scan finds a violation, a ruflo-style agent swarm automatically: (1) logs the incident, (2) drafts a remediation recommendation, (3) schedules a follow-up check, (4) updates the audit log.
**Integration point:** `lib/agents/compliance-swarm.ts` — new module

### From firecrawl
**What:** Web scraping API — scrape, search, interact, crawl, batch scrape. 110K GitHub stars. MCP server available.
**houndshield use:** 
  1. Brain AI knowledge update: firecrawl scrapes NIST 800-171 updates, CMMC news, competitor pricing pages automatically
  2. Competitor intelligence dashboard: track Nightfall/Strac/Cloudflare pricing and feature changes
  3. Customer research: scrape defense contractor directories for outreach
**Integration point:** `lib/brain/firecrawl-updater.ts` — new module

### From anywhere-agents (yzhao062)
**What:** Portable agent config (CLAUDE.md + AGENTS.md + rules) that follows you across every project. Destructive-command guard, curated writing rules, smart routing.
**houndshield use:** The houndshield CLAUDE.md and agent config system. Every developer on the team gets the same agent config, ensuring consistent code quality and compliance-aware development.
**Integration point:** `.claude/` directory structure (already being built)

### From space-agent (agent0ai)
**What:** Self-documenting agent system with hierarchical AGENTS.md, skills, focused docs. Browser automation with arbitrary JS execution.
**houndshield use:** Autonomous compliance monitoring agent that runs in the background, checks for new CUI patterns, updates detection rules, and alerts the ISSO without human intervention.
**Integration point:** `lib/agents/space-monitor.ts` — new module

### From swarm-forge (unclebob)
**What:** tmux-based AI agent coordination. Role-based prompts, shared constitutions, git worktrees for disciplined dev.
**houndshield use:** Internal development discipline. The houndshield dev team uses swarm-forge patterns for agent governance — team-lead reviews all agent output before merging.
**Integration point:** `.claude/agents/` directory (swarm-forge-inspired governance)

### From OpenHarness (HKUDS)
**What:** Open agent harness with 43 tools, CLAUDE.md injection, memory via MEMORY.md, skills, plugin ecosystem.
**houndshield use:** Extensible compliance tool ecosystem. Customers can add custom detection plugins (e.g., company-specific secret patterns) via an OpenHarness-style plugin loader.
**Integration point:** `lib/plugins/` — new plugin architecture module

### From auto-github-contributor (nexu-io)
**What:** Automated GitHub contributions.
**houndshield use:** Auto-submit CMMC pattern updates to the public houndshield-patterns repo when the Brain AI detects new threat signatures, building community around the detection engine.
**Integration point:** `lib/brain/pattern-contributor.ts` — new module

---

## 9. MANAGER MODE RULES

These rules are enforced by the Brain AI. If the founder deviates, the Brain AI flags it:

1. **CMMC first, always.** Any feature not serving the CMMC beachhead is deprioritized until $10K MRR.
2. **No prompt data leaves the network.** Zero exceptions. Any code that transmits prompt content externally is a critical bug.
3. **Docker deploy in 15 minutes.** If setup takes longer, it fails in the field.
4. **Audit PDF is required.** No PDF = no value for the ISSO buyer. Never gate it above Growth tier.
5. **Stripe webhook must be live before any marketing.** Broken checkout = burned leads.
6. **Build, then sell. Don't pitch what doesn't work.**

**Manager check-in questions (Brain AI asks these at session start):**
- Are you working on the beachhead (CMMC SMB) or expanding too early?
- Is the Docker deployment working end-to-end?
- How many ISSOs have installed this week?
- Is Stripe webhook live in production?

---

## 10. IMMEDIATE BLOCKERS (MUST FIX BEFORE MARKETING)

1. `STRIPE_WEBHOOK_SECRET` — empty in `.env.local`
2. Supabase migrations 001–004 not applied to production
3. Docker image for local deployment does not exist yet
4. Rebrand from houndshield to houndshield incomplete

---

## 11. SESSION CONTINUITY

This PRD is the source of truth. Every session starts here. The Brain AI enforces it.
If a session produces work that conflicts with this PRD, the Brain AI flags the conflict before it ships.

L99
