# Kaelus Ruthless Validation Pipeline
**Date:** 2026-04-17
**Method:** Paul Graham-style pressure test → Build / Pivot / Kill
**Verdict headline:** **PIVOT — Narrow from "multi-compliance AI DLP" to "CMMC Level 2 AI Compliance Firewall for Defense Subcontractors." Ship in 7 days against the already-established beachhead thesis.**

---

## Phase 1 — Pressure Test the Idea

### Core Assumption (testable hypothesis)
> Compliance-owning buyers at regulated mid-market companies will pay $10K+/year for an inline proxy that (a) provably keeps prompt data on their own infrastructure, (b) blocks PII/PHI/CUI/secrets before they reach external AI services, and (c) generates audit evidence acceptable to their assessor — and they will trust a startup to sit in the critical path of every AI call.

Falsifiable predictions: at least 3 buyers in a 30-prospect cohort ask for a pilot within 14 days of outreach, and at least 1 pays ≥$5K for a 90-day paid pilot within 45 days. If not, the thesis is wrong.

### Three Fatal Flaws (ranked)

**1. You are asking a security team to insert a startup into the critical path of every AI call.**
An inline proxy that fails = ChatGPT/Copilot/Claude fails for the whole company. That is the single most expensive failure mode a CISO can greenlight. The bar to install Kaelus is not "is the scanner good." It is SOC 2 Type II, pen-test report, cyber insurance, EULA indemnification, Tier-2 availability SLA, and a 30-day failure-mode review. Each of those is a month and money. Until you can hand over that packet, you lose to "we'll just write a policy and train employees" every single time.

**2. The AI vendors are collapsing your moat in real time.**
OpenAI Enterprise, Anthropic, Copilot for M365, and Gemini for Workspace all now offer some combination of zero retention, SOC 2 Type II, HIPAA BAA, data-residency controls, and admin DLP. Microsoft Purview does inline DLP for Copilot. Every quarter that goes by, the buyer's default answer — "the AI vendor already handles this" — gets more accurate. The window where "the AI vendor can't be trusted" is the selling proposition narrows faster than a bootstrapped startup can widen it. You do not win a race with Microsoft on the Microsoft surface.

**3. The tagline is four aspirational claims stacked on each other.**
"Single proxy URL, no code changes, <10ms scanning, SOC 2 + HIPAA + CMMC simultaneously" collapses under enterprise scrutiny. Sub-10ms is tight for any ML-assisted detection (Microsoft Presidio + context model typically runs 50–300ms on commodity hardware; pure regex hits it but misses CUI context). "No code changes" dies the first time Chrome ships an extension-manifest change or the customer refuses to deploy a root CA. "Simultaneous multi-compliance" sounds like one product; in reality it is three separate control-mapping efforts, three sales motions, and three assessor ecosystems. Each one is a full company.

### Problem Validation — Real Pain or Nice-to-Have?
Real pain, narrowly. Documented incidents: Samsung banned ChatGPT company-wide after engineers pasted source code (April 2023). JPMorgan, Bank of America, Verizon, Amazon, Apple, and Accenture imposed restrictions within 12 months. The pain is named at CISO round-tables. However: most companies are already self-medicating (outright bans, training, Enterprise plan purchases, Purview configuration, CASB rules). The question is not "is there pain" — it is "is the incumbent self-medication painful enough that buyers will rip it out for Kaelus." For 95% of buyers: no. For CMMC-bound defense subcontractors and specific data-residency-strict healthcare/legal/EU segments: yes.

### Founder-Market Fit
Unknown — founder context not provided. For this domain the required founder profile is narrow: (a) prior security/DLP or compliance-tooling product experience, (b) deployment credibility with CISOs, (c) regulatory literacy (NIST SP 800-171, HIPAA Security Rule, SOC 2 TSC). A generalist full-stack founder without a security background starting this cold faces an 18–24 month credibility build before the first $50K ACV lands. If the founder is ex-Palo Alto / Nightfall / Netskope / DISA / defense-IC / Big Four compliance — green light. If not — this is the wrong first idea for this founder.

### Brutal Verdict
**Weak as stated. Pivot required.** The "inline AI DLP for everyone" framing puts you against Harmonic Security, Nightfall AI, Prompt Security, Lakera, Wald.ai, Cisco AI Defense, Palo Alto Prisma, Netskope One, Zscaler, and Microsoft Purview — every one of them better funded, most with 12–24 month head starts. The product is real. The positioning is not.

### Would Paul Graham Fund This In Its Current Form?
No. Too infra-heavy for seed velocity. Too compliance-gated for the first 12 months to show useful revenue metrics. Too many adjacent incumbents. He would ask two questions: "Why is no one else doing this?" — and the honest answer is "they already are, with more money." Then: "Who, specifically, is desperate for this today?" If the founder answers "CMMC Level 2 defense subcontractors before Oct 2026" with a concrete pilot pipeline, he reconsiders. Otherwise, no.

---

## Phase 2 — Validate the Real Problem

### Specific Pain
It is 10:47pm. The General Counsel's name lights up the Compliance Director's phone. An engineer pasted a chunk of CUI-marked design documentation into ChatGPT three hours ago to "clean up a spec." The prime contractor's security officer already knows. The Compliance Director has to answer two questions by 8am: (1) what exactly went into the prompt, (2) has this happened with any other employee in the last 90 days. They cannot answer either. Their CASB logs show the domain hit; they don't show prompt contents. Their DLP rules were written for email and file-share, not web chat. They have no inline controls. They are about to lose a Pentagon subcontract and fail their upcoming CMMC assessment in one phone call.

This is the pain. It is dated, named, and career-ending. Every week this pain produces one incident somewhere in the US defense industrial base.

### Early Adopter Profile (specific person)
**Michelle, VP of Compliance / Information Security Officer at a 180-employee DoD subcontractor in Huntsville AL.** The company does RF engineering for a prime on a missile defense program. CMMC Level 2 assessment scheduled Q3 2026. She reports to the COO. She has a 2-person security team, a $450K/year security tools budget, and a contractually-mandated CMMC deadline. She already banned ChatGPT on the corporate network; engineers use it on phones and personal laptops anyway. She knows it. She cannot prove a negative to her C3PAO assessor. Her prime is asking pointed questions. She has budget and a gun to her head.

She is not a hypothetical persona. There are ~76,000 DIB contractors in the CMMC scope; roughly 20,000–30,000 need Level 2. A majority are under 500 employees and cannot afford or operate Palo Alto Prisma / Netskope One / Microsoft E5 + Purview. Michelle is the ICP.

### Recommended Beachhead Segment
**Defense subcontractors (50–500 employees) facing CMMC Level 2 enforcement.** Reasons: (1) a hard regulatory deadline — contractual survival depends on passing assessment; (2) CUI is a narrower, more tractable detection target than generic PII/PHI; (3) underserved by incumbent DLP — too small for enterprise procurement, too regulated for consumer tools; (4) budget line already exists (CMMC compliance is a CapEx/OpEx line in every DoD sub); (5) tight community — one happy reference pulls in the next 20 via CMMC consultants, C3PAO directories, and prime portals; (6) aligned to the existing Kaelus revenue strategy (per project memory dated 2026-03-31, hybrid Pro + SMB model with CMMC-bound defense contractors as the beachhead is already the working thesis — this validation confirms that call).

Explicitly NOT the first beachhead: generic SMB (no urgency), developers (wrong buyer — dev tools don't clear security procurement), Fortune 500 (they buy Palo Alto / Microsoft, not startups, for the critical path).

### Five Discovery Questions
1. "Walk me through the last time you discovered an employee had put sensitive or controlled information into an AI tool — what happened next, hour by hour?"
2. "How do you demonstrate to your C3PAO or your prime's security officer that CUI has not crossed into ChatGPT, Copilot, or similar tools in the last 90 days?"
3. "What have you already tried to control AI tool use — policies, training, CASB rules, outright bans — and where did each one break down?"
4. "Describe what your CMMC Level 2 assessment timeline looks like and which controls are keeping you up at night."
5. "If an AI tool compliance incident happens inside your organization six months from now, what's the first thing that goes wrong in your career and your contract?"

Every question is open-ended, behavioral, and blame-neutral. None of them mention the product.

### Validation Criteria (signals the problem is real and urgent)
A prospect passes when all five are true:
1. **Named incident or near-miss:** they can describe a specific event with a date, a person, and a consequence.
2. **Active workaround exists and is painful:** policy + training alone, bans users route around, CASB rules they admit miss the actual prompt content.
3. **Deadline pressure <12 months:** CMMC assessment, customer contractual demand, prime security officer review, or board-level incident mandate.
4. **Unprompted willingness-to-pay above $20/user/month or $10K/year:** stated before you name a price.
5. **Introduction offered:** they name at least two peers with the same problem and offer to connect.

Kill signal: three or more prospects say "our AI vendor's enterprise tier handles this" and cannot name a concrete reason their assessor would disagree. That means the AI vendor is already the painkiller for this segment and the moat has closed.

### Vitamin / Painkiller Verdict
**Painkiller for CMMC-bound defense subcontractors and data-residency-strict healthcare.** **Vitamin for everyone else.** The distinction matters because painkillers get paid in 30 days; vitamins churn in 90. Your GTM must filter for the painkiller segment and politely ignore vitamin inbound until you have 50 paying painkiller customers. Building for vitamins first is the single most common reason compliance-adjacent startups die.

### Workarounds Being Cobbled Together
Yes, universally. Current cobbles: (1) outright blanket AI bans enforced by CASB (Netskope, Zscaler) — users route around via personal devices; (2) employee training + self-attestation — audit evidence is useless; (3) corporate OpenAI / Copilot licenses — covers the sanctioned tool only, misses Claude / Perplexity / Gemini / Cursor / the 200 other surfaces; (4) Microsoft Purview — only works inside the Microsoft estate; (5) homegrown regex scanners in a browser extension written by one engineer on a Wednesday; (6) hope. Every one of these cobbles is a selling moment.

---

## Phase 3 — Map the Real Competition

### Current Behavior (the #1 competitor, always)
**"We banned it + we trained employees + we hope."** ~70% of US regulated mid-market defaults to this. The cost to Kaelus is not the incumbent feature set; it is the inertia of a policy document plus the CISO's belief that their people are trustworthy. Replacing inertia requires an incident, a deadline, or a prime's demand. Your beachhead must have at least two of the three.

### Direct Competitors (inline AI DLP / prompt firewall)
- **Harmonic Security** — YC-backed, $17.5M Series A (Oct 2024). Browser-extension + proxy. PII / PHI / source-code detection. Explicitly positioned as "sanctioned + unsanctioned AI protection." This is the closest direct competitor. They are real, funded, and selling today.
- **Nightfall AI** — raised $40M+ across rounds, multi-product data security platform, has a "Firewall for AI" module. Established in DLP, bolted AI on.
- **Prompt Security** (Tel Aviv) — inline GenAI security proxy, seed + Series A, Microsoft ecosystem focus.
- **Lakera** — Series A (~$20M). Focus started on prompt injection / LLM red-teaming, now extending into DLP.
- **Wald.ai / WitnessAI / Opsin / Portal26 / CalypsoAI** — second-tier pure-plays, all competing for the same mid-market slot.
- **Protect AI** — broader AI security platform, reportedly in Palo Alto Networks' acquisition pipeline (announced 2024).
- **Cisco AI Defense** — announced Jan 2025. AI runtime protection + access controls. Cisco distribution is brutal in the enterprise.
- **Netskope One GenAI**, **Zscaler AI Protection**, **Palo Alto Prisma AI Access**, **Forcepoint**, **Skyhigh Security** — existing CASB/SSE vendors who added AI modules in 2024–2025.
- **Microsoft Purview Data Security for AI** — native for Copilot and M365, free-ish if you're already on E5.

### Indirect Competitors (solve the pain differently)
- **Native AI vendor compliance tiers:** OpenAI Enterprise (zero retention, SOC 2 Type II, HIPAA BAA), Anthropic (zero retention, HIPAA eligibility, SOC 2), Copilot for Microsoft 365 (inherits M365 compliance), Gemini for Workspace. Each one collapses the "data leaves your control" objection for one surface.
- **Enterprise browsers:** Island, Talon (acquired by Palo Alto). Controls *at the browser* instead of the network.
- **Private / local-model deployments:** Ollama, LM Studio, private Azure OpenAI, private Bedrock, vLLM + Llama. Solves the pain by making sure nothing leaves in the first place.
- **Open-source scanners:** Microsoft Presidio, Protect AI NB Defense, garak. The DIY path — credible for engineering-heavy orgs, painful for compliance-owned buyers.
- **CMMC / HIPAA consulting services:** PreVeil, Summit 7, Redspin. Sell the compliance outcome, not the tool. Often bundle a tool.

### The Real Enemy
**The AI vendor's compliance checkbox.** When OpenAI Enterprise's sales engineer says "we have zero retention, SOC 2 Type II, HIPAA BAA, and data residency controls," the compliance officer's job gets 80% easier with a procurement signature instead of a deployment project. That is the enemy. Kaelus only wins when the buyer's reality contains at least one of: (a) employees using *unsanctioned* AI tools the enterprise license doesn't cover, (b) regulations that demand on-prem / data-sovereign processing beyond what the AI vendor offers (CMMC CUI handling, certain EU data residency, classified environments), (c) cross-vendor visibility requirements (one dashboard across ChatGPT + Claude + Gemini + Copilot + Cursor) that no single vendor provides. Your pitch must start from one of those three wedges, not from "AI vendors are dangerous."

### Genuine Differentiation
**Real and defensible for ~12–18 months:**
- **True on-prem scanning with no outbound prompt data.** Most direct competitors run scanning as a SaaS — prompts (or embeddings, or metadata) hit their cloud. For CUI, EU data residency, air-gapped, and some healthcare buyers this is a hard no-go. A cleanly architected local-only Kaelus genuinely wins here. This is the single most defensible axis.
- **CMMC-native control mapping and assessor-ready evidence packages.** Incumbents map to PCI, HIPAA, SOC 2 well. CMMC / NIST SP 800-171 is under-invested. Pre-built mapping to AC.L2-3.1.x, AU.L2-3.3.x, MP.L2-3.8.x, SC.L2-3.13.x, SI.L2-3.14.x plus exportable evidence that a C3PAO will actually accept is a real wedge.
- **Cross-AI-surface coverage from one pane.** Modest differentiator — table stakes within 12 months.

**Not defensible (do not sell on these):**
- "<10ms scanning" — achievable by several competitors; as a marketing claim it invites a benchmark fight you cannot guarantee to win.
- "No code changes" — already the default in the category; also partly false at enterprise scale (CA distribution, extension deployment).
- "Multi-compliance simultaneously" — every competitor claims this; the work is in the control mappings, not the proxy.

### Is There an On-Prem / Local-Only AI DLP Competitor Today?
Yes, partially. Wald.ai advertises on-prem deployment. Private AI (privateai.com) offers on-prem PII redaction (though it is a component, not a full AI DLP platform). Presidio self-hosted is DIY. No competitor today has shipped a clean, CMMC-evidence-focused, local-only, cross-AI-surface product targeted at sub-500-employee defense subcontractors. That gap is where Kaelus lives or dies. It is a 12-month window, not an open field.

### If No Competition Existed
It does. Do not claim otherwise. Any pitch that says "no one is doing this" is an instant kill from any serious investor — it means the founder hasn't looked, or the market is too small to attract anyone. Both are disqualifying.

---

## Phase 4 — Pivot Decision

### Verdict: **PIVOT**

Do not build the "inline AI DLP for SMBs + enterprises + developers, SOC 2 + HIPAA + CMMC, sub-10ms, no-code-changes" product. That is the generic category pitch. You lose to Harmonic, Nightfall, Cisco, Microsoft on distribution, and to OpenAI/Anthropic Enterprise on "the vendor already handles it."

**Build instead:** *Kaelus — the CMMC Level 2 AI Compliance Firewall for the Defense Industrial Base.* Single segment, single outcome (pass your CMMC assessment with AI tools intact), local-only by hard architectural commitment, assessor-ready evidence as the killer feature.

This is not a dramatic pivot. It is a narrowing. The product is the same core proxy. What changes: positioning, pricing, packaging, go-to-market, and the detection ruleset's center of gravity (CUI-first, PHI/PII second). This aligns with the existing Kaelus hybrid revenue strategy already on record.

### Pivot Options Ranked by Viability

**Option 1 — CMMC Level 2 AI Compliance Firewall for Defense Subcontractors (HIGHEST VIABILITY).**
Beachhead: 50–500 employee DoD subs on CMMC Level 2 path, assessment within 18 months. Positioning: "Keep AI tools. Pass your assessment." Pricing: $10K–$50K annual contract value, seat-based with floor. Distribution: direct outreach via CMMC consultant network (Summit 7, Redspin, Steel Root, CyberSheath), C3PAO directories, prime-contractor supply-chain portals, DIB-CAC channels. Moat: pre-built 800-171 control mapping, assessor-accepted evidence packages, local-only architecture as a hard compliance requirement (not a feature). Ramp: $0 → $250K ARR in 9 months is credible with one founder + one design partner → 10 paid pilots pipeline.

**Option 2 — Healthcare PHI Firewall for Mid-Market Providers and Health-Tech (MEDIUM-HIGH VIABILITY).**
Beachhead: 100–2,000 employee regional health systems, specialty medical groups, health-tech startups handling PHI. Positioning: "Your clinicians are using ChatGPT. Be HIPAA-defensible about it." Pricing: $30–$75 per user per month. Distribution: HIMSS, state hospital associations, HIPAA BAA-writing counsel, healthcare compliance consultants. Moat: PHI-tuned detection (clinical terminology, drug names, DOB + name + condition triples, medical record numbers), BAA from day one, on-prem deployment for covered entities reluctant to let PHI transit any vendor. Risk: more fragmented buyer, longer sales cycle, less deadline pressure than CMMC.

**Option 3 — Developer-Surface AI Secrets & Source-Code Firewall (MEDIUM VIABILITY, LOWER MOAT).**
Beachhead: 20–300 engineer teams at security-conscious companies. Positioning: "Let devs use Copilot, Claude Code, Cursor, Windsurf — without leaking secrets or proprietary source." Distribution: bottom-up, IDE plugin, free tier, GitHub / Product Hunt / HN. Pricing: $10–$25/dev/month. Risk: GitHub, Cursor, Anthropic, Snyk, GitGuardian, Aikido are all one product update from shipping the same feature. The exit is smaller and the moat is thinner. Fallback, not lead.

**Rank: 1 ≫ 2 ≫ 3.** Start with 1. Graduate to 2 after 20 CMMC customers. Treat 3 as a product-led funnel that feeds 1 and 2.

---

## Phase 5 — MVP in 1 Week

Phase 4 verdict is Pivot → Option 1 (CMMC Level 2 AI Compliance Firewall for Defense Subcontractors). Executing Phase 5 against that target.

### The Single Most Important Assumption to Test
> A CMMC-Level-2-bound defense subcontractor (50–500 employees, assessment within 12 months) will install an on-prem Kaelus proxy on real employee workstations within 7 days of first contact, generate a CMMC evidence report, and sign a pilot contract of $5,000 or more within 30 days.

If that is true, every other product, pricing, and GTM question is solvable. If that is false, the entire business model changes — different segment, different pricing motion, different product shape.

### Minimum Feature Set (the only things we build)
1. **Local inline proxy** — Go binary, runs as Windows service and Linux systemd unit. MITM HTTPS via an org-deployed root CA. Routes traffic to a configurable list of AI domains (ChatGPT, Claude, Gemini, Copilot, Cursor, Perplexity). Block / warn / log per policy.
2. **CUI-first detection engine** — Microsoft Presidio base + custom regex / keyword ruleset for CUI markers per the CUI Registry (export control, ITAR, CTI, contract number patterns, DD254 / SF312 references), plus PHI/PII/secret detection as secondary. All in-process. No outbound calls during scanning.
3. **Local admin UI** — served on `127.0.0.1:<port>`, protected by local admin credential. Event log, policy toggles, per-domain rules, rule-pack version.
4. **CMMC evidence report generator** — single-button export of a signed PDF + JSON bundle mapped to the 15 most relevant NIST SP 800-171 controls (AC.L2-3.1.3, AC.L2-3.1.13, AC.L2-3.1.22, AU.L2-3.3.1, AU.L2-3.3.2, AU.L2-3.3.4, CM.L2-3.4.2, MP.L2-3.8.2, SC.L2-3.13.8, SC.L2-3.13.11, SC.L2-3.13.16, SI.L2-3.14.6, SI.L2-3.14.7, plus supporting controls). Report includes: policy config hash, scan counts, blocked events with redacted excerpts, integrity hash, time range, deployment topology attestation.
5. **Browser-extension fallback** — Chrome/Edge extension that routes AI-domain traffic through the local proxy for customers who cannot deploy a root CA on day one.
6. **Signed MSI installer for Windows + .deb / .rpm for Linux.** Authenticode-signed. License file generator.

### What Gets Cut (ruthlessly)
- SSO / SAML / Okta / Entra integration → local admin only for MVP.
- Multi-tenant cloud dashboard → single-org per deploy, local UI only.
- Every compliance framework except CMMC / 800-171 → HIPAA, SOC 2, PCI control mappings are v2.
- Auto-tuning, ML-based policy recommendations → pre-shipped rule packs only.
- Sub-10ms performance commitment → target <150ms p95 is acceptable for MVP; real engineering happens post-validation.
- SIEM/SOAR integrations (Splunk, Sentinel, CrowdStrike) → JSON + syslog export only.
- Mobile and desktop-native-app AI tool coverage → web + browser-extension surfaces only.
- Fine-grained RBAC → admin / read-only two-role model.
- Billing, self-serve signup, pricing page on a website → white-glove pilot contracts only.
- Marketing site beyond a 1-page landing with a "request pilot" form.
- The developer segment entirely. The general-SMB segment entirely. Any conversation with a Fortune 500 buyer.

Rule: if a feature does not directly test whether Michelle will sign a $5K–$50K pilot for CMMC AI tool evidence, it is cut. No exceptions.

### Local-Only Architecture Pattern
- **Runtime:** single Go binary, <50 MB, no runtime dependencies beyond OS. Runs as Windows service (via `sc.exe`) or Linux systemd unit. Runs as non-root on Linux, LocalService equivalent on Windows.
- **Interception:** HTTPS MITM using a per-deployment root CA generated at install; CA certificate exported and distributed via GPO / MDM / Jamf. No global CA. No remote CA.
- **Scanning engine:** Microsoft Presidio (embedded via an in-process Python subprocess or ported regex+spaCy rules to Go) + custom CUI detector module + secrets detector (shared library). All data is processed in the proxy process and never leaves the host.
- **Storage:** SQLite database for event log and policy, AES-256 at rest, key stored in OS keystore (DPAPI / systemd-creds / macOS Keychain).
- **Admin UI:** embedded HTTP server bound to `127.0.0.1` only. TLS with self-signed cert. CSRF-protected. No remote access.
- **License validation:** offline-first. Install accepts a signed license file (Ed25519 signature, expiry, seat count, org ID). Optional daily license-check pings to `license.kaelus.online` — outbound request carries only `{licenseId, version, hash}`, never prompt data, never detection events. 30-day offline grace period. Air-gapped mode disables the ping entirely.
- **Telemetry:** OFF by default. If opted in by admin, sends aggregate counters only (`scansToday`, `blocksToday`, `rulepackVersion`). No prompt content, no detection payloads, no user identifiers. Telemetry schema published as part of the threat model.
- **Updates:** admin-initiated only. Binaries fetched from signed CDN on explicit button press. No auto-update. No background pulls.
- **Data-border guarantee:** the architecture makes egress of prompt content structurally impossible — the scanning path has no outbound network dependency. Documented in a published threat model. Provable by any customer running `tcpdump` / `Wireshark` / `eBPF` on the host.

This is the feature. Every other vendor's "on-prem mode" has a caveat. Kaelus has none.

### Test Criteria (real user behavior, not sentiment)
Pilot is a success if, by end of week 4 from install on each pilot:
- **≥3 pilots install on a real production workstation within 7 days of the intro call.**
- **≥2 of those 3 expand to 5+ workstations within 21 days.**
- **≥5 real blocked or warned events captured per pilot per week** (proves the product is detecting, not just sitting there).
- **≥1 pilot generates a CMMC evidence report and shares it with their C3PAO or prime's security officer.**
- **≥1 signed paid pilot contract ≥$5,000 within 45 days of first install.**
- Median end-to-end prompt latency <150ms p95 on real traffic.
- NPS is not measured. Survey data is not measured. We measure behavior.

Kill criterion: if after 45 days fewer than 2 pilots are actively using the product and zero have paid, the CMMC-defense beachhead is wrong. Pivot to healthcare (Option 2) immediately.

### 7-Day Launch Plan (Fri 2026-04-17 → Fri 2026-04-24)

**Day 0 — Fri Apr 17 (today): Pipeline + pre-build.**
- Build a 50-prospect target list: 50–500 employee DoD subs with CMMC Level 2 exposure. Sources: SAM.gov (NAICS 541330, 541715, 336413, 334511), CyberAB C3PAO client references, LinkedIn Sales Nav filtered on "CMMC" + "CISO / Compliance / IT Director" + "defense." Tag by assessment urgency.
- Send 30 cold emails. Subject: "5 minutes — how are you handling AI tools under CMMC Level 2?" Body: three sentences, one question, no product pitch.
- Target: 8 discovery calls booked for Mon–Wed.
- Scaffold repo: Go proxy + mitmproxy-style MITM library (or Rust `hudsucker`), Python Presidio sidecar, Svelte admin UI, GitHub Actions signed-build pipeline.
- Purchase Azure Trusted Signing or DigiCert code-signing cert ($10–$40/mo for Trusted Signing, same-day for EV cert if needed).

**Day 1 — Sat Apr 18: Core proxy.**
- HTTPS MITM with per-install root CA generation.
- Domain routing allow/block list.
- SQLite schema + AES-256 encryption at rest.
- Policy engine skeleton: block / warn / log per rule.

**Day 2 — Sun Apr 19: Detection engine.**
- Presidio sidecar, in-process if feasible.
- CUI ruleset v0: ~40 regex patterns (CUI banner markers per 32 CFR Part 2002, ITAR USML categories, contract-number formats, DD-254 and SF-312 references, common CUI category codes like `CUI//SP-EXPT`, `CUI//SP-PROPIN`, `CUI//SP-CTI`).
- Secrets ruleset: reuse `gitleaks` pattern library.
- PHI/PII: Presidio defaults.
- Latency test harness — must be <150ms p95 on a Dell Latitude-class laptop.

**Day 3 — Mon Apr 20: Admin UI + CMMC mapping.**
- Svelte admin UI: event log view, policy config, rule-pack version.
- CMMC control mapping JSON (15 controls, every block/log event tagged with applicable control IDs).
- Evidence report generator skeleton (PDF via `gofpdf` or headless Chromium + Svelte template).
- Discovery calls #1–#2. Script: the 5 questions, nothing else. Record outcome.

**Day 4 — Tue Apr 21: Browser extension + packaging.**
- Chrome / Edge extension that routes traffic for the top 6 AI domains through the local proxy (for customers pre-CA-distribution).
- Windows MSI installer (WiX), Linux .deb + .rpm.
- Authenticode-sign the Windows binary + installer.
- License file format + signing tool.
- Discovery calls #3–#4.

**Day 5 — Wed Apr 22: First pilot deploy.**
- Remote-screen-share install with the first pilot. Real workstation. Real traffic. Capture the first real block.
- Fix whatever breaks in production, in real time.
- Second pilot deploy same day if possible.
- Discovery calls #5–#6.

**Day 6 — Thu Apr 23: Second + third pilot. First evidence report.**
- Third pilot deploy.
- Generate the first CMMC evidence report from live data. Hand it to the pilot to walk to their C3PAO or prime security officer.
- Raise a pricing conversation explicitly: "For your full 180-seat deployment, what does this need to cost annually for your budget to approve it?" Record answers.
- Discovery calls #7–#8.

**Day 7 — Fri Apr 24: Decision day.**
- Tally: # installs, # active, # blocked events captured, # pricing conversations, # signed pilots or LOIs.
- Write one-page postmortem: signals, surprises, objections heard, product gaps revealed.
- Decision gate:
  - ≥3 active pilots + ≥1 pricing conversation ≥$5K/yr → continue, start building evidence-report v2 + prime-portal integrations.
  - 1–2 active pilots, zero pricing conversations → re-position messaging, re-run 30 more cold emails Monday.
  - Zero active pilots → the CMMC beachhead thesis is wrong. Pivot to healthcare (Option 2). Start Monday.

### Consequence Check — If the Core Assumption Is Wrong
If CMMC-bound defense subcontractors will not pay $5K+ for this in 45 days, the business model changes completely:
- **Segment changes** → shift to healthcare (Option 2) or developer-surface (Option 3).
- **Product shape changes** → PHI detection leads, or IDE plugin replaces network proxy.
- **Sales motion changes** → from direct enterprise pilot to either consultant-channel (healthcare) or product-led / open-core (developer).
- **Pricing changes** → $30–$75/user/mo (healthcare) or $10–$25/dev/mo (developer), not $10K–$50K annual contract.
- **Compliance build-out changes** → HIPAA BAA templates + HITRUST, or GitHub Marketplace + SOC 2.

The one thing that survives a wrong core assumption is the local-only scanning architecture. That is the true product asset. Everything else — packaging, segment, evidence, pricing — is replaceable. Build the tech so the pivot is cheap.

---

## Summary Verdict (one page)

- **Phase 1 — Pressure test:** Weak as stated. Three fatal flaws: MITM trust burden, AI-vendor compliance collapsing the moat, four-aspirations-stacked tagline. PG would not fund in its current form.
- **Phase 2 — Problem validation:** Real painkiller for CMMC-bound DoD subs and data-residency-strict healthcare. Generic vitamin for everyone else. Ignore vitamins until painkillers pay.
- **Phase 3 — Competition:** Crowded and consolidating. Harmonic, Nightfall, Prompt Security, Lakera, Cisco AI Defense, Microsoft Purview are all real. The real enemy is the AI vendor's own compliance checkbox plus inertia-based "we banned it + trained people." True differentiation is local-only architecture + CMMC-native evidence. 12–18 month window.
- **Phase 4 — Verdict:** **PIVOT** — narrow to "CMMC Level 2 AI Compliance Firewall for Defense Subcontractors." Secondary path: healthcare. Tertiary: developer surface.
- **Phase 5 — MVP:** Local-only Go proxy + CUI-first detection + CMMC evidence report, shipped to 3 defense-sub pilots in 7 days, paid pilot contract in 45 days. Kill-gate and pivot trigger defined.

Build the narrow product. Ship it in 7 days. Let the market kill the wrong assumption fast, not slow.
