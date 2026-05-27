# houndshield — 24-Month Roadmap
**Version:** 1.0 | **Last Updated:** April 2026

> **MANAGER CHECK:** Before any sprint starts, confirm: "Is this in the roadmap?"
> If the answer is no, it requires explicit approval before execution.
> Deviations require a documented reason in tasks/todo.md before work begins.

---

## MONTH 1 — WEEK BY WEEK (The Critical Sprint)

**Theme: Foundation That Won't Get You Killed in a CMMC Audit**

### Week 1 (Days 1-7): Architecture + Database Migration

**Day 1:**
- [ ] Archive all Supabase schema definitions (export DDL)
- [ ] Provision self-hosted PostgreSQL 16 in Docker (local dev)
- [ ] Create `/db/schema.sql` with all tables, indexes, RLS equivalent policies (PostgreSQL Row Security)
- [ ] Create `/db/migrations/` structure with numbered migration files

**Day 2:**
- [ ] Migrate auth: remove Supabase Auth dependency, implement Keycloak Docker container
- [ ] Create Keycloak realm config file (exportable, version-controlled)
- [ ] Wire Next.js session management to Keycloak OIDC

**Day 3:**
- [ ] Rename all `kaelus` references to `houndshield` in entire codebase (automated find/replace + manual audit)
- [ ] Update package.json name, all env var names, all comments, all documentation
- [ ] Update `.claude-memory.md` and `.claude-session-state.md` with new naming

**Day 4:**
- [ ] Set up Docker Compose with all 5 services: proxy, presidio, dashboard, db, keycloak
- [ ] Write `docker-compose.yml` and `docker-compose.override.yml` (dev overrides)
- [ ] Verify all services start and communicate correctly

**Day 5:**
- [ ] Install Microsoft Presidio as Python sidecar container
- [ ] Wire Node.js proxy to Presidio via Unix socket
- [ ] Write first integration test: send prompt with SSN, verify redaction

**Day 6:**
- [ ] Set up FIPS 140-2 compliant encryption: enable OpenSSL FIPS module in all containers
- [ ] Verify AES-256 for PostgreSQL data at rest (pgcrypto with FIPS module)
- [ ] Verify TLS 1.3 only for all inter-service communication

**Day 7:**
- [ ] Full end-to-end test: user sends prompt → proxy intercepts → Presidio detects PII → redacted prompt forwarded → response logged
- [ ] Fix any failures
- [ ] Commit everything with clean commit history

### Week 2 (Days 8-14): Proxy + Detection Engine

**Day 8:**
- [ ] Implement HTTP(S) forward proxy in Node.js (TypeScript strict)
- [ ] Support: OpenAI API format (most tools use this)
- [ ] Write proxy unit tests: 100% coverage on interception logic

**Day 9:**
- [ ] Implement Anthropic API format support
- [ ] Implement Azure OpenAI format support
- [ ] Write integration tests for all three API formats

**Day 10:**
- [ ] Add custom CUI entity types to Presidio:
  - DoD contract numbers (DAXX-XX-C-XXXX format)
  - CAGE codes (5-char alphanumeric)
  - Export control markings (CUI//, SECRET, etc.)
  - ITAR-controlled technical data patterns
- [ ] Test against synthetic CUI samples

**Day 11:**
- [ ] Implement policy engine: block/redact/flag actions per entity type
- [ ] Admin UI: policy configuration page
- [ ] Write policy engine unit tests

**Day 12:**
- [ ] Implement tamper-evident audit logging (SHA-256 hash chain)
- [ ] PostgreSQL schema for log storage with proper indexing
- [ ] Log export: JSON and CSV format

**Day 13:**
- [ ] CMMC compliance scoring engine: map proxy controls to 110 practices
- [ ] Dashboard: compliance posture view (score + gap list)
- [ ] Write scoring unit tests

**Day 14:**
- [ ] Full system integration test
- [ ] Performance test: verify <10ms P99 latency with 1,000 concurrent simulated requests
- [ ] Fix all failures

### Week 3 (Days 15-21): Admin Dashboard + Deployment Packaging

**Day 15:**
- [ ] Admin dashboard: real-time event feed (last 100 prompts)
- [ ] User management: add/remove users, assign policies
- [ ] Role-based access: admin vs. user

**Day 16:**
- [ ] Alert configuration: email on policy violation (Resend API)
- [ ] Webhook alerts: generic POST payload (works with Slack, Teams, PagerDuty)
- [ ] Write alert system tests

**Day 17:**
- [ ] Docker Compose production configuration (not dev — production hardened)
- [ ] README.md: single-command deployment guide for IT Director audience
- [ ] Test deployment on fresh Ubuntu 22.04 server (no prior setup)

**Day 18:**
- [ ] Windows installer: Docker Desktop + houndshield Compose via PowerShell
- [ ] Test on Windows Server 2019 and Windows 11
- [ ] Write installation guide

**Day 19:**
- [ ] Kubernetes Helm chart: base chart for professional/enterprise tier
- [ ] Values file with all configurable parameters documented
- [ ] Test on local k3s cluster

**Day 20:**
- [ ] Landing page remediation (complete replacement — see landing page spec)
- [ ] Apply houndshield branding, remove all Kaelus references from frontend

**Day 21:**
- [ ] End-to-end deployment test: fresh server → running system in <30 minutes
- [ ] Document any step that required more than reading the README

### Week 4 (Days 22-28): Testing, Documentation, RPO Outreach

**Day 22:**
- [ ] Write comprehensive test suite: 80%+ coverage on all modules
- [ ] CI/CD: GitHub Actions pipeline (lint → typecheck → test → build)
- [ ] Pre-commit hook: tsc --noEmit + ESLint + tests (exits 2 on failure)

**Day 23:**
- [ ] CLAUDE.md: project brain at repo root (complete, actionable)
- [ ] .claude/ directory: all agents, commands, hooks, rules, settings.json
- [ ] Brain AI: knowledge graph seeded with all compliance, competitive, market data

**Day 24:**
- [ ] README.md: final version, YC-quality, senior engineer would be impressed
- [ ] Architecture decision records: ADR-001 through ADR-004 in `/docs/adr/`
- [ ] Contribution guide

**Day 25:**
- [ ] Demo environment: hosted instance (SaaS mode, non-CUI) for RPO demos
- [ ] Demo script: 30-minute guided walkthrough for RPO sales call
- [ ] One-pager: single-page PDF for RPO prospects

**Day 26:**
- [ ] Research Summit 7, SysArc, CyberSheath: find decision-maker contacts
- [ ] Write RPO outreach email (specific, no "synergy")
- [ ] Send to 3 RPOs

**Day 27:**
- [ ] Engage one C3PAO as early design partner (Coalfire, Schellman, or DCSA-authorized assessor)
- [ ] Ask: "Would this evidence package pass your assessment?" Get feedback.

**Day 28:**
- [ ] Month 1 retrospective: what shipped, what didn't, what changed
- [ ] Update roadmap with actual state
- [ ] Commit everything

**Month 1 Ships:**
- Renamed codebase (Kaelus → houndshield)
- Self-hosted PostgreSQL replacing Supabase
- Keycloak auth replacing Supabase Auth
- FIPS 140-2 encryption verified
- HTTP(S) forward proxy (OpenAI + Anthropic + Azure formats)
- Presidio PII detection (with CUI entity types)
- Policy engine (block/redact/flag)
- Tamper-evident audit logging
- CMMC compliance scoring
- Admin dashboard
- Docker Compose deployment
- Landing page (houndshield brand)
- .claude/ agent team
- README + documentation

**Month 1 Revenue:** $0 (acceptable — building foundation)
**Month 1 Validation Target:** At least 1 RPO has agreed to a demo call. At least 1 C3PAO has reviewed evidence format.

---

## QUARTERLY THEMES

| Quarter | Theme | Goal |
|---|---|---|
| Q1 (M1-3) | Build + Foundation | Ship P0, replace Supabase, first RPO contact |
| Q2 (M4-6) | First Revenue | 2 RPO partners, 10 paying customers, $3K MRR |
| Q3 (M7-9) | Open Source + Growth | GitHub community, ProductHunt, SOC 2 Type I |
| Q4 (M10-12) | Scale | 40 customers, $15K MRR, 5 RPO partners |
| Q5-Q6 (M13-18) | Direct Sales | Inbound from content, $35K MRR |
| Q7-Q8 (M19-24) | Enterprise + Gov | FedRAMP prep, $75K MRR, seed raise |

---

## 24-MONTH ROADMAP TABLE

| Month | Ships | Validates | Revenue | Blocker |
|---|---|---|---|---|
| 1 | P0 features, Supabase migration, houndshield rebrand, Docker Compose, landing page, .claude/ agents | Proxy intercepts 100% of test prompts with <10ms overhead | $0 | Database migration must complete before any customer onboarding |
| 2 | HIPAA PHI detection entities, Windows installer, RPO demo environment, RPO outreach materials | RPO agrees to demo call; 1 C3PAO validates evidence format | $0-299 | RPO deal requires legal review of revenue-share agreement |
| 3 | MSP white-label mode (basic), CMMC gap report generator, Keycloak SSO integration | First paying customer through RPO channel; customer deploys in <30 min | $299+ | First RPO partner must sign before customer pipeline opens |
| 4 | SOC 2 evidence export, Slack/Teams alerts, Shadow AI discovery (DNS monitoring), Helm chart | 5 paying customers; at least 1 at Professional tier | $1,500+ | Second RPO partner signed |
| 5 | Open-source houndshield-scan Python library (GitHub release), custom entity type UI, email digest reports | GitHub repo gets 50+ stars in first week; 1 inbound lead from open source | $2,500+ | Open-source launch requires legal review (MIT license, no CUI in repo) |
| 6 | Automated CMMC assessment report (SPRS-ready), Ollama local LLM support, MSP bulk deployment CLI | 10 paying customers; $3K MRR; at least 3 customers generating SPRS submissions | $3,000 | Must reach $3K MRR or re-evaluate GTM |
| 7 | ProductHunt launch, Anthropic API cookbook integration, AI usage analytics dashboard | ProductHunt top 5 in Security category; 20+ signups from launch | $5,000+ | ProductHunt launch timing must align with CMMC news cycle |
| 8 | SOC 2 Type I audit begins, SIEM integration (Splunk), Policy template library (ITAR, financial, PII) | SOC 2 auditor engaged; 25 paying customers | $7,500+ | SOC 2 auditor selection and cost (budget $15-25K) |
| 9 | SOC 2 Type I report issued, Azure Sentinel integration, browser extension (shadow AI, beta) | SOC 2 Type I complete; use as sales tool for enterprise prospects | $10,000+ | SOC 2 report must be clean — any exceptions documented + remediated |
| 10 | SAML 2.0 SSO (Okta, Azure AD), FedRAMP documentation begins, GSA Schedule application | 35 paying customers; 5 RPO partners; open-source 500 stars | $12,500+ | GSA Schedule application takes 6-12 months — start now |
| 11 | Custom policy rule builder (no-code UI), air-gapped deployment guide, CMMC 2.0 Level 3 mapping | First air-gapped deployment at a customer site; 40 customers | $14,000+ | Air-gapped requires physical deployment or assisted remote |
| 12 | Enterprise on-prem license model, annual contract option, dedicated CSM workflow | $15K MRR; 5 enterprise prospects in pipeline; first annual contract signed | $15,000 | If MRR <$10K, pivot GTM immediately — direct sales instead of RPO-only |
| 13 | FedRAMP Tailored ATO preparation, Windows Server AD integration, SPRS API submission | FedRAMP package draft complete; advisory board member from DoD ecosystem | $18,000+ | FedRAMP requires external consultant ($50-150K) — fundraise or find grant |
| 14 | Automated red team / prompt injection testing suite, SOC 2 Type II audit begins | First enterprise deal >$2,500/month signed | $22,000+ | SOC 2 Type II takes 6-12 months of observation period |
| 15 | Multi-tenant enterprise dashboard, custom entity ML training interface, SLA monitoring | 60 paying customers; NPS >50 | $27,000+ | Customer success process must scale before adding customers |
| 16 | GSA Schedule awarded (if application submitted Month 10), DHS CISA reporting integration | First government procurement via GSA Schedule | $32,000+ | GSA Schedule approval timeline is unpredictable |
| 17 | SOC 2 Type II report issued, FedRAMP package submitted, CMMC 2.0 Level 3 features | SOC 2 Type II clean report; used in all enterprise sales cycles | $37,000+ | FedRAMP review takes 6-12 months after package submission |
| 18 | Seed fundraise ($1-2M target), hiring: first full-time engineer, enterprise sales | $35K MRR confirmed; Series Seed pitch deck finalized | $35,000+ | Investor outreach: DataTribe, Shield Capital, Paladin Capital, Evolution Equity, Ten Eleven |
| 19 | First hired engineer onboarded, API marketplace listings (Azure, AWS), expanded MSP program | New engineer shipping independently; 10 MSP partners | $45,000+ | Hiring takes 4-8 weeks; don't stop building during hiring |
| 20 | CMMC 2.0 Level 3 certified features, DoD prime contractor pilot program | 1 Fortune 500 defense prime as customer | $52,000+ | Prime contractor procurement requires security review of houndshield |
| 21 | FedRAMP Tailored ATO (if timeline holds), expanded language support (multilingual PII) | FedRAMP ATO enables direct federal agency sales | $58,000+ | FedRAMP timing is the biggest unknown in this roadmap |
| 22 | Series A preparation, product team hiring (2nd engineer + designer), advanced analytics | $60K MRR; Series A pitch materials complete | $60,000+ | Series A requires predictable growth curve from Month 18-22 |
| 23 | Enterprise marketplace (Palo Alto XSIAM, Splunk SOAR, ServiceNow) integrations | First marketplace-sourced enterprise deal | $67,000+ | Marketplace listing requires security review by each vendor |
| 24 | Series A close (if fundraising), $75K MRR, team of 4-5, FedRAMP Full ATO roadmap | $75K MRR; 150+ customers; Series A closed | $75,000+ | If Series A not achievable, evaluate strategic acquisition (Cisco, Palo Alto, CrowdStrike) |

---

## MSP PARTNER MILESTONES

| Milestone | Target Month | Partner |
|---|---|---|
| First RPO demo call | 2 | Summit 7 or SysArc |
| First RPO contract signed | 3 | Summit 7 (largest, most impactful) |
| First customer through RPO | 3 | via Summit 7 |
| Second RPO contract | 4 | SysArc or CyberSheath |
| Third RPO contract | 6 | Third RPO |
| Fifth RPO contract | 10 | Regional CMMC specialists |
| MSP program formalized | 12 | Partner portal, training, certification |
| 10 MSP partners | 19 | National coverage |

---

## COMPLIANCE CERTIFICATION MILESTONES

| Certification | Start | Complete | Cost | Enables |
|---|---|---|---|---|
| SOC 2 Type I | Month 8 | Month 9 | $15-25K | Enterprise sales, credibility |
| SOC 2 Type II | Month 14 | Month 17 | $25-40K | Large enterprise, government adjacent |
| FedRAMP Tailored | Month 13 | Month 21 | $50-150K | Direct federal sales |
| FIPS 140-2 (architecture) | Month 1 | Month 1 | $0 (OpenSSL FIPS) | CMMC compliance claim |
| GSA Schedule | Month 10 | Month 16 | $5K application | Government procurement |
| CMMC Level 2 (own org) | Month 6 | Month 9 | $50-150K C3PAO | Credibility for defense customers |

---

## GITHUB MILESTONE MARKERS

| Tag | Month | Contents |
|---|---|---|
| v0.1.0-alpha | 1 | P0 features, Docker Compose, houndshield brand |
| v0.2.0-beta | 2 | HIPAA support, Windows installer, RPO materials |
| v0.3.0 | 3 | MSP mode, gap report, Keycloak |
| v0.4.0 | 4 | SOC 2 export, Slack alerts, Shadow AI |
| v0.5.0-oss | 5 | Open-source houndshield-scan release |
| v1.0.0 | 6 | First stable release — ProductHunt eligible |
| v1.1.0 | 7 | ProductHunt launch version |
| v2.0.0 | 12 | Enterprise on-prem, annual licensing |
| v3.0.0 | 18 | Post-seed, team builds |

---

## MANAGER DEVIATION PROTOCOL

If at any point during execution you find yourself:
- Building a feature not in this roadmap
- Spending more than 2 hours on something not in the current month's scope
- "Just quickly" adding something that wasn't planned
- Responding to a shiny new GitHub repo or tool by integrating it immediately

Stop. Ask: **"Is this in the roadmap?"**

If no: Document the proposed change in `tasks/todo.md` under "PROPOSED DEVIATIONS." The Brain AI team lead agent will evaluate: Does this replace or delay a P0 item? Does it move the revenue needle faster than the current plan? If yes to both, approve. If not, defer to the roadmap.

The solo founder's biggest risk is building the wrong things. The roadmap is the protection against that.
