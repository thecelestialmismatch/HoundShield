# HoundShield — Task Queue (HERMES, compass-corrected 2026-05-26)

## Active
<!-- Move items here when starting work -->

---

## Stage 1 — by June 25, 2026

**Stage 1 milestone:** 3 paid $499 CMMC AI Risk Reports + 1 signed RPO/MSP referral agreement.

### Revenue (STRIKER owns)
- [ ] Build 50-RPO target list from Cyber AB Marketplace — Summit 7, MAD Security, CyberSheath, CompliancePoint, BEMO, Steel Root, Etactics, +43 more
- [ ] Draft RPO co-brand outreach email — 40–50% rev share on $499 gap report, $299 wholesale
- [ ] Send first wave: 20 RPO emails by EoW
- [ ] Healthcare direct outreach: list 25 Privacy Officers / CISOs at 50–300-person physician groups
- [ ] Healthcare cold-email template — Rachel pain copy ("nurses pasting patient data into ChatGPT — not HIPAA-compliant without BAA")
- [ ] Defense direct outreach: list 25 IT Security Managers at 50–500-person DoD subcontractors (Jordan)
- [ ] Legal direct outreach: list 15 IT Directors at 50–500-attorney firms (Marcus, post-Rachel volume)

### Architecture honesty (FORGE + ATLAS own)
- [ ] Publish `houndshield/proxy:latest` to Docker Hub (signed image, README, 60-second deploy video)
- [ ] Add Mode A / B / C disclaimer section to `app/page.tsx` (homepage)
- [ ] Create `/security` page with explicit Mode table + Vercel-not-FedRAMP statement
- [ ] Brain AI gate: "Do not input CUI — this routes to commercial cloud endpoint" warning + consent modal — OR remove Brain AI from `app/page.tsx` until warning ships

### Pricing + channel pages (FORGE owns)
- [ ] Rewrite `app/pricing/page.tsx` — lead with $499 one-time gap report. Stage 2 subscription ($299/$799/$1,499) as secondary CTA, marked "Available July 2026"
- [ ] Pivot `app/partners/page.tsx` from C3PAO referral to RPO/MSP audience — strike any C3PAO endorsement language
- [ ] Pivot `app/partner/page.tsx` (authenticated dashboard) — same RPO/MSP audience, 40–50% rev share on $499 co-brand

### Product PDF (ATLAS owns)
- [ ] Verify `app/api/reports/generate/` PDF still maps every event to NIST 800-171 control + SHA-256 hash chain
- [ ] Add report cover branding: "CMMC AI Risk Assessment Report — Mode B (Customer-Hosted Docker)"

### Blockers (manual — user owns)
- [ ] Set `OPENROUTER_API_KEY` in Vercel
- [ ] Set `STRIPE_WEBHOOK_SECRET` in Vercel
- [x] Push Supabase migrations to production — 010 (RLS fix + AI observability) + 011 (partner portal) applied 2026-05-13
- [ ] Fix CI: export `KGCategory` / `SEED_KNOWLEDGE_GRAPH` from `lib/brain-ai/knowledge-graph.ts`

---

## Stage 2 — by August 25, 2026 (only if Stage 1 triggers hit)

**Stage 2 milestone:** $3K MRR run-rate, ≥5 paying logos, ≥1 signed channel partner generating inbound leads, SOC 2 Type I in progress.

- [ ] Launch subscription tiers: $299 Starter / $799 Pro / $1,499 Enterprise
- [ ] Begin SOC 2 Type I (Vanta or Drata, ~$5K–$15K, 60–90 days)
- [ ] One adjacent vertical landing page live (healthcare OR legal)
- [ ] Onboarding email sequence (3 emails: day 1/3/7)
- [x] In-app CMMC control coverage map — shipped PR #77 (Stage 2 work = gate behind subscription + hydrate from real scan data, see `~/.claude/plans/stage-2-subscription-surface.md`)
- [ ] SPRS improvement estimate in dashboard (+15 to +30 points)
<!-- Killed: "C3PAO white-label dashboard MVP" — doctrine rules C3PAOs out of channel; replaced with read-only assessor view in Stage 3 -->


---

## Stage 3 — by November 10, 2026 (CMMC Phase 2 enforcement day)

**Stage 3 target:** $25K–$50K MRR, 25–60 logos, SOC 2 Type I complete, AWS GovCloud deployment option in beta.

- [ ] AWS GovCloud deployment option (Mode D candidate)
- [ ] Multi-tenant C3PAO assessor view (read-only — assessor sees client's report, never recommends product)
- [ ] HITL review workflow improvements
- [ ] SIEM connectors: Azure Sentinel, Splunk HEC, CrowdStrike

---

## SEO Content (SCRIBE owns — Stage 1 in parallel)

**Tier 1 articles (no vendor owns SERP — write first):**
- [ ] "GCC High Copilot vs third-party AI proxy: which is cheaper for CMMC" ← HIGHEST VALUE
- [ ] "Did your employee paste CUI into ChatGPT? CMMC incident response playbook"
- [ ] "NIST 800-171 controls that map to AI prompt monitoring (full mapping)"
- [ ] "ChatGPT and HIPAA: what your Privacy Officer needs to know in 2026"
- [ ] "CMMC AI use policy template — SC.3.177 and AU.2.041 mapped"

**Answer Engine Optimization:** Publish `llms.txt`, add FAQ schema, optimize for Perplexity citations (51% of B2B buyers now start research with an AI chatbot — G2, April 2026).

---

## Backlog (post-Stage-2)

- [ ] Azure Sentinel connector
- [ ] Splunk HEC integration
- [ ] Blockchain-anchored audit trail
- [ ] Multi-tenant C3PAO portal (read-only assessor view, no endorsement path)
- [ ] Mobile app — only after 50 customers
- [ ] OWASP Top 10 full security review + automated dependency scanning
- [ ] Load testing: verify <10ms latency at 1,000 req/sec (k6 or autocannon)
- [ ] Gemini Flash as secondary scanner (sub-5ms deterministic)
- [ ] CI/CD GitHub Actions: lint + tsc + jest gates on every PR

### Backlog — REPO_INTEGRATION_MAP (external repos, post Stage 2)
> See `docs/REPO_INTEGRATION_MAP.md` for full context.
- [ ] browser-use — automation for proxy setup walkthrough
- [ ] firecrawl — ingest CMMC/NIST docs into Brain AI
- [ ] ai-website-cloner — competitive intel
- [ ] space-agent — multi-agent orchestration
- [ ] swarm-forge — parallel compliance checks
- [ ] OpenMythos / OpenHarness — agent harness patterns
- [ ] anywhere-agents — cross-platform deployment
- [ ] little-coder — lightweight in-browser coding agent
- [ ] ruflo — onboarding workflow automation

---

## Done

### Sprint 4 (2026-05-19) — CMMC Coverage Map ✅ PR #77 merged 2026-05-16
- [x] `lib/cmmc-coverage/` — 110-control NIST 800-171 Rev 2 map, 65 tests
- [x] `/command-center/shield/coverage` static page, 7.03 kB
- [x] +80 SPRS pts coverage shown

### Sprint 1 (2026-04-28) — Jordan deploys in 10 minutes ✅ PR #62 merged 2026-05-03
- [x] `proxy/install.sh` — curl pipe bash, Docker, proxy URL + `--uninstall` + `--verify`
- [x] PDF generation `app/api/reports/generate/` — jsPDF, 5-page C3PAO report, tier gating
- [x] E2E: proxy intercepts ChatGPT → CUI flagged → PDF exported (105/105 passing)
- [x] Landing page Jordan pain copy + Anthropic coral palette + `/docs/quickstart`

### OODA / behavioral DLP engine ✅ commit `984c3b36`
- [x] `proxy/ooda/` — 10 source files, 49 vitest tests, real SQLite, zero mocks
- [x] New endpoints: `/v1/quarantine`, `/v1/baselines/:entityId`, `/v1/policy/:orgId`
- [x] OODA Phase 1-5 strategic analysis — verdict: BUILD

### Brain AI (caveat: needs CUI warning before exposure to users)
- [x] `lib/brain-ai/knowledge-graph.ts` (BM25, seed knowledge, TTL-aware)
- [x] `lib/brain-ai/brain-query.ts` (ask, addKnowledge, marketCheck)

### Process scaffolding
- [x] PRD v2 — `docs/HOUNDSHIELD-PRD-v2.md`
- [x] HERMES doctrine + manager mode in CLAUDE.md (revised 2026-05-26)
- [x] `.claude/settings.json` — model, autoMemoryEnabled, code-review-graph hooks
- [x] `.claude/agents/` — 8 agents with memory: project, maxTurns: 20
- [x] `.claude/skills/` — 8 skills (browser-harness, firecrawl-ingest, swarm-orchestrate, anywhere-guard)
- [x] `.claude/hooks/pre-commit.sh` — tsc + eslint + npm test gates

---

## Killed (stale doctrine, 2026-05-26 pivot)

- ✗ "Sprint 2 — 10 paying customers, $5K MRR Day 30" — arithmetically impossible
- ✗ "Contact 10 C3PAOs from marketplace.cmmcab.org" — wrong channel (C3PAOs legally prohibited from endorsement)
- ✗ "Build `/partner` landing page — C3PAO referral program" — replaced with RPO/MSP pivot above
- ✗ "Sprint 4 — 5 paying customers, $1K MRR" — replaced with Stage 1 milestone
