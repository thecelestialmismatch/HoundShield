# Hound Shield — Task Queue

> **Compass-corrected 2026-06-23.** Mission = FIRST REVENUE. Stage 1 milestone by **June 25**:
> ≥3 paid **$499 CMMC AI Risk Assessment Reports** + ≥1 **RPO/MSP signed referral agreement**.
> Lead with the $499 one-time PDF, NOT a subscription. RPOs/MSPs are the channel — NOT C3PAOs.
> Sprints below (Sprint 1–4, C3PAO-channel framing) predate this correction — kept for history only.

## Stage 1 — by 2026-06-25 (THE milestone)

**Gate:** ≥3 paid $499 reports · ≥1 RPO agreement · Docker image published · Brain AI CUI warning live · one pricing page · `/security` live.

- [x] **$499 "CMMC AI Risk Assessment Report" Stripe SKU** — one-time `tier: "report"` checkout (`mode: payment`), `/assessment` offer page, webhook fulfillment + confirmation email, tests. ⏳ founder: set `STRIPE_REPORT_PRICE_ID` (one-time $499 price) in Vercel.
- [ ] **Pricing page = one grid, $499 report as the hero** — kill the old 5-tier framing; Stage 2 subscriptions shown as "coming after launch" (next: link `/pricing` hero → `/assessment`)
- [ ] **Mode-B / Vercel boundary disclosure everywhere** — "Docker (Mode B) required for CUI workloads; hosted trial is non-CUI eval only" on homepage, /security, /pricing, /partner
- [ ] **Brain AI CUI warning live** — "Do not input CUI. This feature routes to a commercial cloud endpoint." (or pull Brain AI from homepage until live)
- [ ] **Publish Docker image** `houndshield/proxy:latest` + 60-second deploy video
- [ ] **/partner page → RPO/MSP referral** (40–50% rev-share on co-branded $499 report); remove any C3PAO-endorsement framing
- [ ] **RPO outreach list** — 50 RPOs from Cyber AB Marketplace; top targets: Summit 7, MAD Security, CyberSheath, CompliancePoint, BEMO, Steel Root, Etactics
- [ ] **HIPAA-first direct outreach** (Rachel) — parallel track, fastest validation, no FedRAMP blocker

## Active — Launch-readiness sweep (2026-06-24, branch dreamy-mcclintock-fc9d8b)

Baseline before work: build green, **526 tests / 37 files** pass, home 200, palette already on `--hs-*`.
Scope = close genuine launch gaps; do NOT rebuild, do NOT touch dark-dashboard semantic status colors.

- [x] **Remove fictional metrics** — pricing stat bar "2M+ scans"/"500+ teams"/"99.99% SLA" → verifiable product facts (16 engines, <10ms, SHA-256, 110 controls); "500+ teams" CTA line → honest copy
- [x] **Mode-A/Mode-B boundary disclosure site-wide** — new `components/ui/DeploymentBoundaryNote.tsx`; one-line disclosure in `FooterV3` (both variants → every public page); inline note on `/security` + `/brain-ai`
- [x] **Brain AI honesty** — softened "CUI-safe / safe for CUI" on `/brain-ai` (metadata + card) to Mode-B/Mode-C qualifier + hosted-trial caveat
- [x] **Public forbidden colors** — `partner/layout.tsx` `to-purple-500` → steel; emerald/amber on `/status` + `/assessment` → `--hs-success`/`--hs-warn`. Public pages now zero forbidden classes.
- [x] **Logo idle-breathe motion** — wrapper(hover)+img(`logo-breathe`) on Logo/NavV3/FooterV3 + keyframe in globals.css, `motion-reduce`-guarded; Logo snapshot updated. Verified live (structure + reduced-motion guard).
- [x] **Gates** — build green · 526 tests green · live-verified pricing/security/logo via preview · no console errors → PR opened.

### Review

**Shipped (12 files + 1 new component):** removed all fabricated stat counters, site-wide deployment-boundary disclosure, Brain AI CUI-claim qualification, public-page color cleanup, permanent logo idle-breathe. Build green, **526/526 tests**, live-verified in browser (no white-on-white, boundary note readable, logo wrapper+breathe correct, zero console errors).

**Founder-verify before public launch (did NOT touch — can't verify, won't fabricate):**
- `app/about/page.tsx` — testimonial "Maria Chen / Vanguard Aero Engineering" + company-history timeline + future "1,000+ Users" milestone. Confirm real or remove; pre-revenue site should not imply existing customers.
- Homepage testimonial ("I needed the PDF I could hand my C3PAO assessor" / "IT Security Manager") — same: confirm or mark illustrative.
- Pricing per-tier SLA features (99.9%/99.99%) — commitments, not metrics; confirm they're offerable.

**Still env-only (founder, per LAUNCH-CHECKLIST):** `database:demo_mode` + `payments:missing_key` — Supabase prod keys, Stripe price IDs + webhook secret, OPENROUTER key (rotate first).

**Redeploy:** PR opened against `main`; Vercel auto-deploys on merge. Not force-deploying prod (per rules).

## Superseded by compass correction (history)

## Done — 2026-06-21
- [x] **Lifecycle email system + C3PAO outreach** — Day 14 onboarding finale (PDF report = purchase
  unlock) wired into the drip cron (migration 013 adds `day14_sent_at`); transactional payment-receipt
  + cancellation/win-back emails wired into the Stripe webhook (best-effort, never blocks billing);
  C3PAO partner applicant-confirmation wired into `/api/partners/apply`; full 5-touch C3PAO cold
  outreach sequence in `docs/gtm/c3pao-outreach-sequence.md`. +16 tests, 519/519, build green.
- [x] **Pre-launch hardening sweep** (PR `claude/pre-launch-audit-6iieir`) — GDPR cookie consent
  (PostHog gated on opt-in), `security.txt` (RFC 9116), `/security` Trust page, `/dpa` Data
  Processing Agreement, `/acceptable-use` AUP, `/status` live health page, footer Legal column,
  sitemap entries. Build green, 503/503 tests (+11). Remaining launch blockers are config/keys
  only — see `PRE-LAUNCH-AUDIT-2026-06-21.md`.

## Sprint 1 (Week of 2026-04-28) — Jordan deploys in 10 minutes, exports a PDF ✅ MERGED PR #62

**Sprint goal:** One customer deploys HoundShield and exports a PDF audit report for her C3PAO.

- [x] Complete `proxy/install.sh` — curl pipe bash, starts Docker, configures proxy URL + `--uninstall` + `--verify` flags
- [x] Wire PDF generation in `app/api/reports/generate/` — jsPDF, 5-page C3PAO report, tier gating, demo mode
- [x] E2E test: proxy intercepts ChatGPT traffic -> CUI flagged -> PDF exported (105/105 passing)
- [x] Landing page: Jordan pain copy ("Your engineers are using ChatGPT. Your assessor is 6 months away."), Anthropic/Claude coral palette, `/docs/quickstart` page
- [x] Push Supabase migrations to production — 010 (RLS fix + AI observability) + 011 (partner portal) applied 2026-05-13
- [ ] Set `OPENROUTER_API_KEY` in Vercel — Brain AI shows "trouble connecting" on live site (manual step)

## Sprint 2 (Week of 2026-05-05) — First C3PAO partner, first paying customer

- [ ] Contact 10 C3PAOs from marketplace.cmmcab.org (use /browser-harness to scrape the list)
- [ ] Record 3-minute demo: CUI paste -> ChatGPT block -> PDF report export
- [ ] Set `STRIPE_WEBHOOK_SECRET` in Vercel dashboard
- [ ] Build `/partner` landing page — C3PAO referral program with commission structure
- [ ] Publish one technical blog post: "Why cloud-based AI DLP violates DFARS 7012"

## Sprint 3 (Week of 2026-05-12) — Brain AI queryable

- [ ] Wire `brain-query.ts` to Brain AI API route (`app/api/brain/query/route.ts`)
- [ ] Ingest CMMC framework docs via /firecrawl-ingest skill
- [ ] Ingest competitor profiles (Nightfall, Strac, Purview) via /firecrawl-ingest
- [ ] Add `GET /api/brain/ask?q=...` endpoint for founder + agent queries
- [ ] Verify: 20 test questions return correct answers before marking complete

## Sprint 4 (Week of 2026-05-19) — 5 paying customers, $1K MRR

- [ ] Onboarding email sequence (3 emails: day 1/3/7)
- [x] In-app CMMC control coverage map — shows Jordan which controls HoundShield covers (shipped PR #77)
- [ ] SPRS improvement estimate shown in dashboard (+15 to +30 points)
- [ ] C3PAO white-label dashboard MVP (rebrandable)

## Backlog (post $10K MRR)

- [ ] Azure Sentinel connector
- [ ] Splunk HEC integration
- [ ] Blockchain-anchored audit trail
- [ ] SIEM integration suite
- [ ] Multi-tenant C3PAO portal
- [ ] HITL review workflow improvements
- [ ] Mobile app
- [ ] OWASP Top 10 full security review + automated dependency scanning
- [ ] Load testing: verify <10ms latency at 1,000 req/sec (k6 or autocannon)
- [ ] Gemini Flash as secondary scanner for speed-sensitive paths (sub-5ms deterministic)
- [ ] CI/CD GitHub Actions: lint + tsc + jest gates on every PR (see `.github/workflows/`)

## Backlog — REPO_INTEGRATION_MAP (external repos, post $10K MRR)

> See `docs/REPO_INTEGRATION_MAP.md` for full context on each repo.

- [ ] browser-use — browser automation for Jordan's proxy setup walkthrough
- [ ] firecrawl — ingest CMMC/NIST docs into Brain AI knowledge graph
- [ ] ai-website-cloner — competitive intelligence ingestion
- [ ] space-agent — multi-agent orchestration for compliance audit flows
- [ ] swarm-forge — swarm-style agent patterns for parallel compliance checks
- [ ] OpenMythos / OpenHarness — agent harness patterns for proxy pipeline
- [ ] anywhere-agents — cross-platform agent deployment (Windows/Mac/Linux support)
- [ ] little-coder — lightweight in-browser coding agent for C3PAO portal
- [ ] ruflo — workflow automation for onboarding email sequences

## Done
- [x] **Pre-launch polish sweep (2026-06-11)** — Doberman logo everywhere + favicons/OG; 21 public pages migrated to v3 light-steel (NavV3/FooterV3); pricing invisible-price fix + $/mo annual presentation; Brain AI identity FAQ (works keyless); /sign-up 404 CTA fix; /roadmap page; sitemap fixes; "Hound Shield"→"HoundShield" in 110+ files; 409/409 tests
- [x] **OODA loop — full behavioral DLP engine** (`proxy/ooda/`) — commit `984c3b36`
  - 10 source files: types, db, rate-tracker, baseline, observe, orient, decide, act, loop, server migration
  - 49 vitest tests, real SQLite temp dirs, zero mocks — all green
  - `npm run build` clean, `npm test` 49/49
  - New endpoints: `/v1/quarantine`, `/v1/baselines/:entityId`, `/v1/policy/:orgId`
- [x] OODA Phase 1-5 strategic analysis — verdict: BUILD, PG would fund this
- [x] PRD v2 — `docs/HOUNDSHIELD-PRD-v2.md` with manager mode + sprint plan
- [x] Brain AI knowledge graph — `lib/brain-ai/knowledge-graph.ts` (BM25, seed knowledge, TTL-aware)
- [x] Brain AI query interface — `lib/brain-ai/brain-query.ts` (ask, addKnowledge, marketCheck)
- [x] CLAUDE.md — manager mode added
- [x] `.claude/settings.json` — model, autoMemoryEnabled, code-review-graph hooks
- [x] `.claude/agents/` — all 8 agents with memory: project and maxTurns: 20
- [x] `.claude/skills/` — all 8 skills including browser-harness, firecrawl-ingest, swarm-orchestrate, anywhere-guard
- [x] `.claude/hooks/pre-commit.sh` — tsc + eslint + npm test gates
- [x] Sprint 1 complete — PR #62 merged 2026-05-03: install.sh, PDF generation + tests, E2E proxy→CUI→PDF, Jordan landing page, /docs/quickstart, Anthropic coral palette, 105/105 tests passing
