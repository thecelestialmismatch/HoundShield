# Hound Shield — Beast PRD
*Version 3.0 | April 2026 | Manager-Mode Active*

> **MANAGER MODE RULE:** If the founder deviates from the CMMC-first beachhead or starts building features not on this roadmap, the Brain AI flags it: "You're off-plan. Here's what we agreed the priority was and why. Do you want to update the plan or return to it?"

---

## 1. PRODUCT IDENTITY

**Name:** Hound Shield
**Domain:** houndshield.com
**Slogan:** "Proof, not policy."
**Salient idea:** The only AI firewall that generates the audit PDF your C3PAO assessor actually accepts.
**One-liner:** Local-only AI DLP proxy for CMMC Level 2 defense contractors.

**Expanded:** Hound Shield intercepts every prompt before it reaches any external AI service (ChatGPT, Copilot, Claude, Gemini), scans for CUI, PII, PHI, and secrets in under 10ms, enforces CMMC Level 2 simultaneously, and processes everything locally — zero data leaves the customer's infrastructure. The output is an immutable audit PDF that a C3PAO assessor accepts as evidence of technical control.

**Core technical constraint (non-negotiable):**
All prompt scanning runs locally. No prompt content crosses the customer's network boundary. Ever.

**Brand framework (Seth Godin applied):**
- **Symbol:** The audit PDF — tangible evidence artifact, not a promise
- **Slogan:** "Proof, not policy." (under 6 words, specific, ownable)
- **Surprise:** Cloud DLP violates the exact regulation it claims to enforce (CMMC + NIST 800-171)
- **Salient idea:** Evidence-first compliance vs. policy-first compliance
- **Story:** Jordan's moment — C3PAO assessor walks in, asks for AI governance evidence. Jordan has the Hound Shield PDF. Assessment passed.

---

## 2. TARGET CUSTOMER (smallest viable audience)

**Primary — Jordan:**
- Title: ISSO / IT Security Manager
- Company: 50–500 person US defense contractor
- Situation: Has active DoD contract with CUI
- Timeline: CMMC Level 2 assessment coming (November 2026 enforcement deadline)
- Pain: Engineers use ChatGPT / Copilot daily with no controls — can't answer the C3PAO assessor question
- Budget: Can swipe a card for $199–$499/mo if it solves an audit problem
- Blocker: Cannot afford Nightfall ($75K+/yr) or Forcepoint ($100K+ implementation)

**Paul Graham pressure test:**
- Problem felt: WEEKLY (engineers paste CUI into AI tools every day)
- Stakes: Contract loss if C3PAO assessment fails — existential
- Workaround pain: Block AI tools → engineers revolt; policy doc → zero enforcement
- Switching cost: One environment variable change

**Not-customer (until post-$10K MRR):**
- Enterprises with existing DLP infrastructure
- Healthcare IT (HIPAA) — Phase 2 after $10K MRR
- Pure SOC 2 targets without CMMC exposure

---

## 3. PROBLEM (validated)

Engineers at defense contractors paste CUI, contract numbers, technical specifications, and personnel data into AI tools daily. They don't know they're violating CMMC AC.1.001 (access control) and AU.2.041 (audit trail). Their ISSOs don't know it's happening. When a C3PAO assessor asks "how do you control what employees send to AI tools?", the honest answer is "we don't." That answer fails CMMC Level 2 and risks contract termination.

**Current workarounds (all fail):**
1. Block AI tools at firewall — kills productivity, engineers use mobile hotspots
2. Policy document ("don't paste CUI") — zero enforcement, zero audit trail
3. Hope the assessor doesn't ask — most common, most dangerous

**The gap:** Nothing exists that is affordable + local-only + CMMC-native + generates C3PAO-ready evidence.

**What makes this a business (not a feature):**
- NIST 800-171 3.13.2 requires configuration management of third-party services
- Cloud DLP vendors (Nightfall, Strac) process prompt content on their servers — this creates a SECONDARY CUI exposure event
- Hound Shield's local-only architecture is not just a feature — it is the only legally compliant architecture for CMMC

---

## 4. SOLUTION

**Single proxy URL** — engineers change one environment variable. All AI traffic routes through Hound Shield first. Deploy time: 15 minutes.

**Local scanning engine** — Regex + ML patterns run on-premises. No prompt content leaves the customer's network.

**Detection coverage:**
- CMMC: CUI markings, CAGE codes, contract numbers, clearance levels, export control markers (16 engines)
- PII: SSNs, passport numbers, driver's license numbers, credit card PANs, bank account numbers
- PHI: MRNs, diagnosis codes, medication names, treatment records, insurance IDs
- Secrets: API keys, AWS credentials, private keys, tokens, passwords
- Custom: Regex or ML rules added by customer

**Output:**
- Block or redact (configurable per pattern category)
- Immutable audit log (SHA-256 hash chain, tamper-evident)
- PDF export: C3PAO assessor template, one-click generation
- Real-time dashboard: blocked queries, threat categories, user activity
- Brain AI v3: Claude-powered compliance advisor (ask it anything CMMC-related)

---

## 5. COMPETITIVE DIFFERENTIATION

| | Hound Shield | Nightfall | Cloudflare AI GW | Strac | Forcepoint |
|---|---|---|---|---|---|
| Local processing (no cloud) | YES | No | No | No | Yes (enterprise) |
| CMMC-specific patterns | YES | Partial | No | Partial | Partial |
| Price | $199–$499/mo | $75K+/yr | Free (basic) | $50K+/yr | $100K+ impl |
| Setup time | 15 min | Weeks | Hours | Weeks | Months |
| Audit PDF for C3PAO | YES | No | No | No | No |
| Brain AI compliance advisor | YES | No | No | No | No |
| CMMC-legal architecture | YES | **NO** | **NO** | **NO** | Yes |

**Legal moat:** Under NIST 800-171 3.4.6 and DFARS 252.204-7012, CUI cannot be processed by unauthorized third-party systems. Every cloud DLP vendor processes your prompts on their servers. Hound Shield processes nothing externally. This is the only architecture a C3PAO assessor can approve.

**Price moat:** $199–$499/mo vs $75K–$100K+/yr. Jordan can expense it without a VP signature.

---

## 6. FEATURE MAP (phase-gated)

### Phase 0 — Foundation (DONE)
- [x] Proxy engine (intercept + scan + forward)
- [x] 16 CMMC detection pattern engines
- [x] Audit log (SHA-256 hash chain)
- [x] PDF report export (jsPDF)
- [x] Stripe checkout ($199/$499/$999/$2499 tiers)
- [x] Supabase auth + dashboard
- [x] Brain AI v3 (claude-sonnet-4-6 fast / claude-opus-4-7 deep)
- [ ] **BLOCKER:** Stripe webhook production (blocks all paid signups)
- [ ] **BLOCKER:** Supabase migrations 003+004 to production (blocks auth)
- [ ] **P0:** Docker Compose one-liner deployment

### Phase 1 — CMMC Beachhead ($0 → $10K MRR)
Target: 20 paying defense contractors at $499/mo average

- [ ] Docker Compose one-liner (self-host in 15 minutes)
- [ ] CMMC-specific onboarding flow (assessor FAQ, audit prep guide)
- [ ] PDF audit report with C3PAO assessor template
- [ ] Open-source proxy + scanner on GitHub (Cal.com distribution model)
- [ ] License key validation (local check, no prompt data transmitted)
- [ ] Brain AI advisor: "3 things to fix before your assessment"

**Distribution:**
- [ ] r/CMMC subreddit posts with Docker setup guide
- [ ] LinkedIn outreach to 20 named ISSOs at defense contractors
- [ ] C3PAO partnership program (co-marketing with 3 assessor firms)
- [ ] CMMC marketplace listing (dibbs.net, GovWin.iq)

### Phase 2 — Multi-Framework Expansion ($10K → $30K MRR)
GATED: Do not start until $10K MRR.

- [ ] HIPAA-specific onboarding + patterns
- [ ] SOC 2 Type II audit trail format
- [ ] Multi-tenant dashboard (MSP/Agency tier)
- [ ] SSO (Okta, Azure AD) for enterprise
- [ ] Slack/Teams integration for alert notifications
- [ ] Webhook forwarding for SIEM integration (Splunk, Sentinel)
- [ ] HIPAAAgent, SOC2Agent, MarketAgent in Brain AI

### Phase 3 — Platform Mode ($30K → $100K MRR)
- [ ] Gateway Mode (enterprise proxy with HA clustering)
- [ ] Automated C3PAO pre-assessment workflow
- [ ] White-label for MSPs (co-branded portal, reseller pricing)
- [ ] Kubernetes deployment for air-gapped environments

### Phase 4 — Intelligence Layer ($100K+ MRR)
- [ ] Predictive SPRS scoring (ML model trained on audit findings)
- [ ] Automated remediation suggestions
- [ ] Regulatory change monitoring (auto-update patterns on NIST changes)
- [ ] Cross-customer anonymized threat intelligence feed

---

## 7. PRICING (LOCKED)

| Tier | Price | Target | Key Gating |
|------|-------|--------|------------|
| Starter | Free | Evaluation | 1K scans/mo, no PDF export |
| Pro | $199/mo | Small contractors (<50 employees) | 50K scans, PDF export, CMMC patterns |
| Growth | $499/mo | Mid-size contractors | 500K scans, multi-user, SIEM hooks |
| Enterprise | $999/mo | Large contractors | Unlimited, SSO, SLA |
| Agency | $2,499/mo | MSPs | Multi-tenant, white-label |

Annual discounts: 20% off (2 months free).

**PDF export is Growth tier or below — never gate above $499/mo. It is the core value prop.**

---

## 8. OPEN-SOURCE DISTRIBUTION (Cal.com model)

**Open-source (free forever, MIT licensed):**
- Proxy engine (proxy/server.ts)
- Scanner engine (proxy/scanner.ts)
- 16 CMMC detection patterns (proxy/patterns/index.ts)
- Community pattern updates via GitHub

**Paid (hosted at houndshield.com):**
- Dashboard + audit log UI
- Brain AI compliance advisor
- PDF report generation
- Stripe + Supabase managed backend
- Support SLA

**Why this works:**
- GitHub discovery → r/CMMC posts → inbound ISSOs find it themselves
- Supabase went from 0 → $80M ARR partly through open-source GitHub discoverability
- PostHog scaled to 50K self-hosted installs → converted 3% to paid cloud
- Defense contractors want to audit the code before trusting it with CUI — open source IS the trust signal

---

## 9. BRAIN AI v3 ARCHITECTURE

**Model:** claude-sonnet-4-6 (fast mode, <2s) / claude-opus-4-7 (deep mode, <15s)
**Interface:** OpenRouter API (OPENROUTER_API_KEY) — existing infrastructure, no SDK changes

**Agents (CMMC-first, Phase 2 stubs for others):**
- CMCCAgent: NIST 800-171 Rev 2, CMMC L2, C3PAO evidence — LIVE
- SecurityAgent: Threat modeling, CVE analysis, API security checklists — LIVE
- HIPAAAgent: Phase 2 stub (throws — gated until $10K MRR)
- SOC2Agent: Phase 2 stub (throws — gated until $10K MRR)
- MarketAgent: Phase 2 stub (throws — gated until $10K MRR)

**Reasoning:** OpenMythos n_loops pattern — each query runs initial_analysis → critique → synthesis → final_answer. Stops early if confidence > 0.95.

**Truth Verification:** Cross-checks AI compliance claims against KnowledgeGraph. Confidence < 0.85 = flagged "needs verify". Prevents hallucinated NIST control numbers.

**Knowledge Graph:** 60+ nodes. NIST 800-171 Rev 2 domain nodes are hard-coded from the spec (confidence: 1.0, no decay). Competitor/market nodes sourced via Firecrawl (decay 0.01/week).

**Cost guardrails:**
- fast mode: claude-sonnet-4-6, 4K token output cap
- deep mode: claude-opus-4-7, 32K token output cap
- 500K tokens/tenant/day hard cap, overage logged to Supabase

---

## 10. IMMEDIATE BLOCKERS (fix before any marketing)

1. **STRIPE_WEBHOOK_SECRET** — empty in `.env.local`. Update at dashboard.stripe.com/webhooks. Set endpoint to `https://houndshield.com/api/stripe/webhook`.
2. **Supabase migrations 003+004** — not applied to production. Run: `cd compliance-firewall-agent && npx supabase db push`
3. **Docker image** — does not exist yet. Phase 1 Sprint 0 P0.

---

## 11. MANAGER MODE RULES (enforced by Brain AI)

1. **CMMC first, always.** Any feature not serving the CMMC beachhead is deprioritized until $10K MRR.
2. **No prompt data leaves the network.** Zero exceptions. Any code that transmits prompt content externally is a CRITICAL bug.
3. **Docker deploy in 15 minutes.** If setup takes longer, it fails in the field.
4. **Audit PDF is required.** No PDF = no value for Jordan. Never gate it above Growth tier.
5. **Stripe webhook must be live before any marketing.** Broken checkout = burned leads.
6. **Build, then sell.** Don't pitch what doesn't work.
7. **Open-source first for distribution.** GitHub discoverability is the cheapest acquisition channel.

**Manager check-in questions (Brain AI asks at session start):**
- Are you working on the beachhead (CMMC SMB) or expanding too early?
- Is the Docker deployment working end-to-end?
- How many ISSOs have installed this week?
- Is Stripe webhook live in production?
