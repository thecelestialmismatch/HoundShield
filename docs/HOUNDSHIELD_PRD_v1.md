# houndshield — Product Requirements Document
**Version:** 1.0 | **Date:** April 2026 | **Status:** ACTIVE — DO NOT DEVIATE WITHOUT MANAGER APPROVAL

---

> **MANAGER PROTOCOL — READ THIS FIRST**
>
> This PRD is the source of truth. If you find yourself building something not in this document,
> stop and ask: "Is this in the PRD?" If not, it requires explicit approval before a single line
> of code is written. The manager (Brain AI + team lead agent) will flag deviations and ask:
> "Are you sure this is the right move right now?" Scope creep kills solo founders.
> Every session starts with: "Is what I'm about to build in the PRD?"

---

## Executive Summary

**Product Vision:** houndshield is the compliance-first AI proxy that defense contractors and regulated enterprises deploy in one afternoon to stop data leaks, satisfy CMMC Level 2 auditors, and keep their government contracts.

**Core Value Proposition:** One proxy URL. No code changes. CMMC Level 2 AI compliance in 30 minutes.

**Primary Beachhead:** US defense contractors (DIB — Defense Industrial Base). 76,598 organizations. CMMC Level 2 deadline: November 10, 2026. ~98.6% currently non-compliant on AI usage controls. Average contract value at risk: $2M-50M. houndshield costs $299/month. The math is not complicated.

**Revenue Model:**
- SaaS subscription (self-serve, monthly/annual)
- MSP white-label revenue share (30% to partner)
- Enterprise on-prem license (one-time + annual maintenance)

**Pricing:**
- Starter: $299/month (up to 5 users, CMMC Level 2)
- Professional: $799/month (up to 25 users, CMMC + SOC 2 + HIPAA)
- Enterprise: $2,500+/month (unlimited, on-prem, custom SLA)
- MSP: 30% revenue share on all customer seats

---

## Problem Statement

### The Specific Pain

A contracts manager at a 50-person defense contractor opens ChatGPT or Claude, pastes in a Statement of Work that contains export-controlled technical data, a contractor's SSN, and project cost figures. She hits send. The data is now on OpenAI's servers. The contractor just violated CMMC Practice AC.1.001, AC.1.002, SC.3.187, and potentially ITAR. Their next audit will fail. Their $8M DARPA contract is at risk.

This happens every day. Not because employees are malicious — because no one told them they couldn't, and there was nothing in place to stop them.

**When the pain occurs:** The moment an employee first uses any AI tool in the context of any work that touches CUI (Controlled Unclassified Information). For most defense contractors, this is now continuous — AI tools are embedded in email clients, IDEs, browsers, and productivity suites.

### Who Has This Problem Most Acutely

**Primary buyer:** The IT Director or CISO at a 10-500 person defense contractor who has been told by their prime contractor that CMMC Level 2 certification is now a contract requirement. They have no dedicated compliance staff. They are responsible for passing a C3PAO assessment. They know their employees are using AI tools. They have no visibility into what data is being sent where. They are terrified.

Job title: IT Director, VP of IT, CISO, or in smaller contractors: the person who "handles computers."

Situation: Just received notification from Lockheed, Raytheon, Boeing, or another prime that CMMC Level 2 certification is required for contract renewal. Assessment deadline is 6-12 months away. They have no AI governance policy. They have no tooling. They do not know where to start.

### Current Workarounds and Why They Fail

1. **Policy documents alone:** "We wrote a policy that says don't put CUI in AI tools." Zero enforcement. Zero audit trail. Fails CMMC assessment on SC.3.187 (boundary protection) and AC.3.017 (privileged users).

2. **Blocking AI websites at the firewall:** Kills productivity. Employees use mobile hotspots. Does nothing about AI embedded in Microsoft 365 Copilot, GitHub Copilot, or IDE plugins. Impossible to audit.

3. **AWS Bedrock Guardrails:** Works only if the contractor uses Bedrock. Most use ChatGPT, Claude.ai, or Copilot. Bedrock requires migrating all AI usage to AWS — a separate 6-month project. Not a real option for the target buyer.

4. **Enterprise DLP (Forcepoint, Symantec, Nightfall):** Expensive ($50K+/year), complex to deploy, not CMMC-specific, no AI-native understanding of prompt context. Fails the "one afternoon" test.

5. **Doing nothing:** The modal response. This is the incumbent. This is what houndshield replaces.

### Cost of Inaction

- CMMC Level 2 certification failure = contract loss. Average DIB contract value: $2M-50M.
- CUI breach: average regulatory fine $250K-2M + remediation costs.
- ITAR violation involving AI-exported data: criminal liability for executives.
- Contract exclusion from future DoD solicitations.
- The math: paying $299/month vs risking a $5M contract. This is not a hard sale.

---

## Product Overview

### What houndshield Is

houndshield is a software proxy that sits between your users and every AI service they use. When an employee sends a prompt to ChatGPT, Claude, Copilot, or any other AI tool, the request passes through houndshield first. houndshield inspects it in under 10 milliseconds, strips any CUI, PII, PHI, or secrets, logs the transaction with a tamper-evident audit record, enforces your compliance policies, and forwards the sanitized prompt to the AI service. The response comes back through houndshield, is logged, and is returned to the user.

Setup: Change one environment variable or proxy setting. No code changes. No new infrastructure to manage. Works with every AI service, not just one vendor's ecosystem.

**Technical summary:** HTTPS forward proxy + prompt inspection engine + compliance policy engine + audit log. All scanning runs locally. No prompt data leaves the customer's infrastructure. The only external communication is license validation.

### What houndshield Is NOT

- NOT a VPN or network-level content filter
- NOT limited to one AI provider (not an AWS Bedrock or Azure-only solution)
- NOT a compliance consultant (we provide tooling, not advice)
- NOT a full CMMC compliance platform (we solve the AI governance piece, not all 110 practices)
- NOT a cloud service that receives your prompts (the scanning is local — this is non-negotiable)
- NOT a replacement for a C3PAO assessment (we generate the evidence, the assessor evaluates it)

### Core Architectural Constraint: Local-Only Processing

**This is absolute and non-negotiable:** All prompt scanning, PII detection, policy evaluation, and audit logging runs on the customer's infrastructure. No prompt content, no employee data, no CUI fragment ever leaves the customer's network to houndshield's servers. The only data that touches houndshield infrastructure is: license key validation (hash only, no content) and anonymized usage telemetry (prompt count, latency metrics — opt-out available for air-gapped deployments).

This constraint exists because:
1. CMMC SC.3.187 requires boundary protection — sending CUI to a third party to scan it violates the control you're trying to satisfy.
2. Defense contractors cannot contractually send CUI to unknown third parties.
3. This is the only architectural approach that passes a C3PAO audit.

---

## Features — Tiered by Priority

### P0 — Must Ship Before First Customer

**1. Real-time prompt interception proxy**
- HTTPS forward proxy accepting requests from any HTTP client
- <10ms latency overhead on intercept and scan (P99)
- Supports: OpenAI API, Anthropic API, Azure OpenAI, Google Gemini, Ollama (local), any OpenAI-compatible endpoint
- Single proxy URL: `https://proxy.houndshield.local` (on-prem) or `https://[tenant].houndshield.com` (SaaS)
- Zero code changes for customer: change `OPENAI_BASE_URL` env var, done
- Acceptance: Proxy intercepts 100% of configured AI requests with <10ms overhead measured at P99

**2. PII/PHI/CUI/Secrets detection engine**
- Runs locally using Microsoft Presidio (Python, open source, MIT license)
- Detects: SSN, EIN, credit card numbers, API keys, passwords, email addresses, phone numbers, IP addresses, DoD contract numbers, CAGE codes, export control classification markings (CUI//SP-CTI, SECRET, etc.)
- Custom entity types: configurable regex + ML patterns for customer-specific data types
- Action on detection: redact, block, or flag (configurable per entity type per policy)
- Performance: <5ms for 95th percentile prompt (<2,000 tokens)
- Acceptance: Detects 99.2%+ of injected test PII across all entity types in test suite

**3. CMMC Level 2 compliance mapping**
- Maps all 110 CMMC Level 2 practices to houndshield controls
- Relevant practices auto-scored based on houndshield configuration:
  - AC.1.001, AC.1.002 (access control) — user authentication requirement
  - AC.3.017 (privileged users) — admin vs. user policy differentiation
  - AU.2.041, AU.2.042 (audit) — tamper-evident log generation
  - SC.3.177 (cryptography) — FIPS 140-2 validated encryption
  - SC.3.187 (boundary protection) — proxy intercept = boundary enforcement
  - SI.1.210, SI.1.211 (system integrity) — prompt injection detection
- Compliance score: 0-100, updated in real-time as configuration changes
- Gaps report: lists uncovered practices with remediation steps
- Acceptance: Compliance officer at a test defense contractor can generate a CMMC evidence package in <30 minutes

**4. Tamper-evident audit logging**
- Every prompt and response logged with: timestamp, user ID, session ID, model, token count, entities detected, policy applied, action taken
- Log integrity: SHA-256 hash chain (each log entry includes hash of previous entry)
- Retention: configurable, minimum 3 years (CMMC requirement)
- Export: JSON, CSV, SIEM-compatible format
- Storage: local PostgreSQL (on-prem) or encrypted S3-compatible bucket (customer-controlled)
- Acceptance: C3PAO assessor can verify log integrity and completeness for a 90-day audit window

**5. Admin dashboard**
- Compliance posture view: overall score, practice coverage, open gaps
- Real-time feed: last 100 prompt events with detection highlights
- User management: add/remove users, assign policies
- Policy editor: configure detection rules, block/redact/flag actions per entity type
- Alert configuration: email/webhook on policy violation
- Acceptance: IT Director can onboard, configure policy, and view first compliance report in <30 minutes

**6. Drop-in deployment packages**
- Docker Compose (single command, works on any Linux server — target: SMB on-prem)
- Docker image + Helm chart (Kubernetes, target: enterprise)
- Windows installer (target: very small contractors without Linux infrastructure)
- Acceptance: Solo IT admin deploys to production without reading documentation beyond README

### P1 — Ship Within 90 Days of Launch

**7. SOC 2 Type II evidence export**
- Maps houndshield audit logs to SOC 2 Trust Service Criteria
- Auto-generates evidence package: CC6.1 (logical access), CC6.6 (external threats), CC7.2 (monitoring), CC7.3 (incident response)
- Export: PDF report + raw evidence ZIP

**8. HIPAA compliance mapping**
- PHI detection entities added to default policy set
- Maps to HIPAA Security Rule: 164.312(a)(1) access control, 164.312(b) audit controls, 164.312(e)(1) transmission security
- Auto-generates HIPAA compliance report

**9. Shadow AI discovery**
- Network traffic analysis: detects DNS queries and connection attempts to AI services not routed through houndshield
- Reports: which users, which AI services, what volume
- Alerting: immediate notification when shadow AI detected
- Does NOT intercept shadow AI traffic (that requires endpoint agent — P2)

**10. Multi-model support expansion**
- Ollama (local LLMs — critical for air-gapped customers)
- AWS Bedrock
- Cohere
- Mistral AI
- Any OpenAI-compatible endpoint

**11. MSP/RPO white-label mode**
- MSP dashboard: manage multiple customer tenants
- White-label branding: customer-facing UI shows MSP brand, not houndshield
- Revenue reporting: per-customer usage and billing
- Bulk deployment: deploy to 10 customers simultaneously via CLI

**12. Slack/Teams alert integration**
- Webhook-based alerts to Slack or Teams channels on policy violations
- Digest report: daily/weekly summary to compliance channel

### P2 — Ship Within 180 Days of Launch

**13. AI usage analytics**
- Token consumption by user, team, model, time period
- Cost attribution: maps AI spend to projects/departments
- Trend analysis: AI adoption curve, peak usage, model preferences

**14. Automated CMMC assessment report generation**
- Full assessment evidence package: narrative + evidence for all 110 practices
- Format: SPRS (Supplier Performance Risk System) submission ready
- Generates SSP (System Security Plan) section for AI systems

**15. Custom policy rule builder**
- No-code UI for creating custom detection rules
- Regex patterns, keyword lists, ML classifier thresholds
- Policy templates: "ITAR data," "financial data," "personnel records"

**16. SIEM integration**
- Splunk: pre-built add-on
- Azure Sentinel: data connector
- Generic syslog output

**17. SSO**
- SAML 2.0 (Okta, Azure AD, Ping)
- OIDC
- Local directory fallback (no dependency on external IdP for air-gapped)

**18. Endpoint agent (Shadow AI enforcement)**
- Browser extension: intercepts AI traffic at browser level
- Reports to central dashboard
- Blocks or redirects to houndshield proxy

---

## Non-Functional Requirements

| Requirement | Target | Notes |
|---|---|---|
| Proxy latency overhead | <10ms P99 | Measured with 1,000-token prompt |
| Availability | 99.9% uptime | Self-hosted: customer responsibility; SaaS: houndshield SLA |
| PII detection accuracy | >99% recall on test suite | Tuned for CUI entity types |
| Data residency | 100% on-prem | No prompt content to houndshield servers |
| Encryption at rest | FIPS 140-2 validated | AES-256 via OpenSSL FIPS module |
| Encryption in transit | TLS 1.3 only | TLS 1.2 fallback off by default |
| Log retention | Configurable, min 3 years | CMMC requirement |
| Concurrent users | 500+ per deployment | Horizontal scaling via Docker |
| Cold start time | <5 seconds | Docker container startup |
| Audit log query | <2 seconds for 90-day window | PostgreSQL index requirements specified |

---

## Architecture Decision Records

### ADR-001: Database — Replace Supabase with Self-Hosted PostgreSQL

**Decision:** Replace Supabase with self-hosted PostgreSQL for all CUI-handling deployments.

**Context:** Supabase lacks FedRAMP Authorization and FIPS 140-2 validated encryption. Any defense contractor data stored in Supabase creates CMMC AC and SC practice violations. This is a launch blocker.

**Options evaluated:**
- Supabase: NOT viable for CUI. No FedRAMP. No FIPS.
- AWS RDS (us-gov-east-1): FedRAMP High, FIPS 140-2. Cost: $80-200/month. Requires AWS GovCloud account. Good for enterprise cloud option.
- Azure SQL (US Gov): FedRAMP High, FIPS. Good for Microsoft-ecosystem customers.
- Self-hosted PostgreSQL: No FedRAMP needed (customer controls infrastructure). FIPS via OS-level OpenSSL. Zero additional cost. Runs in Docker. Best fit for the on-prem deployment model.
- Neon (serverless Postgres): No FedRAMP. Same problem as Supabase.

**Decision:** Self-hosted PostgreSQL 16 as primary. Helm chart configures it in Kubernetes. Docker Compose includes it for SMB deployment. For SaaS mode (non-CUI customers or Starter tier), use AWS RDS in standard us-east-1 (SOC 2 compliant, not FedRAMP — acceptable for non-CUI data).

**Auth implication:** Drop Supabase Auth. Replace with:
- On-prem: Keycloak (open source, self-hosted, SAML + OIDC, runs in Docker)
- SaaS: Clerk or Auth0 (for non-CUI SaaS customers only)
- Air-gapped: Local credential store with bcrypt hashing

### ADR-002: PII Detection Engine — Microsoft Presidio

**Decision:** Microsoft Presidio (Python, MIT license) as the primary detection engine.

**Rationale:** Open source, proven in production at scale, extensible with custom recognizers, runs entirely locally with no external API calls, supports 40+ entity types out of the box, and can be fine-tuned for CUI-specific entity types (CAGE codes, DoD contract numbers, export control markings). Alternatives like AWS Comprehend require sending data to AWS — violates local-only constraint. Commercial alternatives (Nightfall, Skyflow) are cloud-based — same problem.

**Implementation:** Presidio runs as a sidecar container alongside the proxy. Inter-process communication via Unix socket (no network exposure).

### ADR-003: Proxy Architecture — Node.js HTTP(S) Forward Proxy

**Decision:** Node.js (TypeScript strict) HTTP(S) forward proxy using the `http-proxy` library, with Python Presidio sidecar for detection.

**Rationale:** Node.js handles high concurrency with low overhead. The scanning pipeline is: receive request → parse body → call Presidio sidecar via Unix socket → apply policy → forward (sanitized or blocked) → receive response → log → return. This keeps the hot path in Node.js (fast I/O) and scanning in Python (Presidio's native runtime). P99 latency target of <10ms is achievable with this architecture at 500 concurrent users.

### ADR-004: Deployment — Docker Compose (SMB) + Helm Chart (Enterprise)

**Decision:** Primary deployment is Docker Compose for SMB (target: IT Director with basic Docker knowledge). Secondary: Helm chart for enterprise Kubernetes. Tertiary: Windows MSI installer (uses Docker Desktop under the hood).

**Services in Docker Compose:**
- `houndshield-proxy` — Node.js proxy (TypeScript)
- `houndshield-presidio` — Python Presidio sidecar
- `houndshield-dashboard` — Next.js admin UI
- `houndshield-db` — PostgreSQL 16
- `houndshield-keycloak` — Keycloak auth (optional, can use local auth)

---

## Pricing Architecture

### Why These Numbers

Defense contractors pay CMMC consultants $3,000-15,000/month for compliance support. A C3PAO assessment costs $50,000-150,000. A single contract loss from non-compliance: $2M-50M. Against this backdrop:

- $299/month is a rounding error in the procurement budget
- $799/month is cheaper than one hour of outside counsel
- $2,500/month is cheaper than one month of a compliance consultant

The constraint is not willingness to pay — it's awareness that houndshield exists.

### Tiers

**Starter — $299/month (or $2,990/year — save 2 months)**
- Up to 5 users
- Up to 1M prompts/month
- CMMC Level 2 compliance mapping
- PII/CUI/PHI detection and redaction
- 3-year audit log retention
- Email support
- Docker Compose deployment only
- Target: 10-50 person defense contractor

**Professional — $799/month (or $7,990/year — save 2 months)**
- Up to 25 users
- Up to 10M prompts/month
- CMMC Level 2 + SOC 2 + HIPAA
- Shadow AI discovery
- MSP dashboard (manage up to 5 sub-accounts)
- SIEM integration (Splunk, Azure Sentinel)
- Priority email support + quarterly compliance review call
- Docker Compose + Kubernetes Helm chart
- Target: 50-500 person defense contractor or healthcare org

**Enterprise — $2,500/month base (custom pricing)**
- Unlimited users
- Unlimited prompts
- All compliance frameworks
- Air-gapped deployment support
- Custom entity type training
- Custom SLA (99.9% uptime guarantee)
- Dedicated Slack channel + named CSM
- Annual on-site deployment assistance (1 day)
- FedRAMP Tailored ATO support (roadmap)
- Target: 500+ person prime or sub-prime contractor

**MSP/RPO White-Label — Revenue Share**
- 30% to MSP partner on all seats managed
- Unlimited customer tenants
- White-label branding
- Bulk deployment CLI
- Partner training and certification
- Target: Summit 7, SysArc, CyberSheath, other CMMC RPOs

---

## Go-to-Market

### Phase 1: Partnership-Led (Months 0-6)

Do not attempt direct enterprise sales. Cold outreach from a solo founder with no customers fails. Instead:

- **Target 3 CMMC RPOs:** Summit 7 Systems (Huntsville, AL — largest CMMC RPO), SysArc (Annapolis, MD), CyberSheath Services (Fairfax, VA). These firms have existing relationships with hundreds of defense contractors each. They already have the trust. houndshield needs a 30-minute demo and a revenue-share agreement.
- **Pitch to RPOs:** "We solve the one CMMC problem you don't have a tool for — AI governance. Drop-in. Your customers deploy it themselves. You get 30% recurring revenue for doing nothing after the intro."
- **First deliverable for RPO partnership:** A co-branded one-pager, a 30-minute demo environment, and a white-label contract template.
- **Target:** 2 RPO partnerships signed by Month 3. First 10 paying customers through RPO channel by Month 6.

### Phase 2: Community + Open Source (Months 6-12)

- Open-source the PII detection component (houndshield-scan) as a standalone Python library. Post on GitHub. Submit to CMMC community resources. This is the Protect AI playbook — build community with open source, convert to paid.
- ProductHunt launch: target a CMMC-awareness day or a DoD news event to piggyback.
- Content: publish 2 CMMC-specific technical posts per week. "How to pass CMMC Practice SC.3.187 with AI tools." These are zero-competition SEO keywords that CMMC IT Directors are actively searching.
- Target: 5 RPO partners, 40 paying customers, $15K MRR by Month 12.

### Phase 3: Direct + Procurement (Months 12-24)

- Inbound from content + open source drives direct signups.
- GSA Schedule application (government procurement vehicle — opens direct sales to DoD prime contractors).
- FedRAMP Tailored ATO pursuit (opens large agency and prime contractor sales).
- Target: $75K MRR by Month 24.

---

## Success Metrics

| Milestone | Target Date | Metric |
|---|---|---|
| First RPO partner signed | Month 2 | Contract executed |
| Product deployed to first customer | Month 2 | Docker Compose running, first log entry |
| Second RPO partner signed | Month 4 | Contract executed |
| $3K MRR | Month 6 | 10 customers at $299 avg |
| $15K MRR | Month 12 | 40 customers at $375 avg |
| SOC 2 Type I certified | Month 9 | Report issued |
| Open source component 500 GitHub stars | Month 10 | Stars metric |
| $35K MRR | Month 18 | Mix of tiers and MSP revenue |
| $75K MRR | Month 24 | Seed fundraising trigger |
| FedRAMP Tailored ATO | Month 24 | Authorization issued |

---

## Risks and Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Supabase CUI incompatibility | CRITICAL — blocks launch | Migrate to self-hosted PostgreSQL + Keycloak before any CUI customer onboards. Non-negotiable. |
| Solo founder bandwidth | HIGH | Claude Code agent team handles code review, test writing, documentation. Founder executes, agents enforce. |
| AWS Bedrock Guardrails as "free" competitor | HIGH | Differentiate: Bedrock works only for Bedrock. houndshield works for all AI tools simultaneously. Also: CMMC-specific workflow, not generic DLP. |
| CMMC deadline slips | MEDIUM | Even if DoD slips the deadline again (they have before), certification cycles repeat every 3 years. Demand is structural, not one-time. |
| RPO partnership takes longer than expected | MEDIUM | Start direct outreach to IT Directors at DIB companies simultaneously via LinkedIn. Don't wait for RPO deals. |
| C3PAO assessor doesn't accept houndshield evidence | MEDIUM | Engage one C3PAO (e.g., Coalfire, Schellman) as an early design partner to validate evidence format before launch. |
| Open-source component creates free alternative | LOW | The open-source component is scan-only, no dashboard, no deployment, no compliance mapping. The value is in the integrated compliance workflow, not the scanner. |
