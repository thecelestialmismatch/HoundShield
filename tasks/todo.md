# Hound Shield — Task Queue

> **Compass-corrected 2026-06-23.** Mission = FIRST REVENUE. Stage 1 milestone by **June 25**:
> ≥3 paid **$499 CMMC AI Risk Assessment Reports** + ≥1 **RPO/MSP signed referral agreement**.
> Lead with the $499 one-time PDF, NOT a subscription. RPOs/MSPs are the channel — NOT C3PAOs.
> Sprints below (Sprint 1–4, C3PAO-channel framing) predate this correction — kept for history only.

## Stage 1 — by 2026-06-25 (THE milestone)

**Gate:** ≥3 paid $499 reports · ≥1 RPO agreement · Docker image published · Brain AI CUI warning live · one pricing page · `/security` live.

- [x] **$499 "CMMC AI Risk Assessment Report" Stripe SKU** — `POST /api/stripe/report-checkout`
  (one-time `mode:'payment'`, no-auth, inline-$499 fallback, $299 wholesale gated on `partner_ref`);
  webhook fulfillment → `report_orders` (migration 014) + `reportOrderEmail`; `/report/thank-you` page.
- [x] **Pricing page = one grid, $499 report as the hero** — report hero card on top, subscriptions
  reframed as Stage-2 monitoring; removed fabricated "2M+ / 500+" metrics.
- [x] **Mode-B / Vercel boundary disclosure everywhere** — reusable `<ModeBNotice />` on
  /pricing, /security, /partners, /report/thank-you.
- [x] **Brain AI CUI warning live** — persistent disclosure above the GlobalChat input; system
  prompt corrected to lead with the $499 report + three deployment modes.
- [x] **Publish Docker image** — `.github/workflows/docker-publish.yml` builds `proxy/Dockerfile`
  on every proxy PR; publishes `houndshield/proxy:latest` on a `proxy-v*` tag (needs Docker Hub secrets).
- [x] **/partners → RPO/MSP referral** — rewritten off C3PAO-endorsement framing onto $499 report
  co-brand ($299 wholesale / 40% referral) + explicit C3PAO-exclusion note; NavV3 item updated.
- [x] **RPO outreach list** — `docs/gtm/rpo-outreach-list.md` (7 named targets + frame + tracking).
- [ ] **HIPAA-first direct outreach** (Rachel) — parallel track (GTM execution, not code).
- [ ] **Close ≥3 paid reports + ≥1 RPO agreement** — the actual revenue milestone (sales execution).

> Shipped under `claude/houndshield-revenue-roadmap-m3de37`. See `compliance-firewall-agent/docs/STAGE-1-EXECUTION.md`.
> Build green · tsc clean · 539/539 tests. Remaining Stage-1 items are GTM/sales + ops config (env vars, migration push, Docker Hub secrets).

## Active — Launch-readiness sweep (2026-06-24, branch dreamy-mcclintock-fc9d8b)

Rebased onto `origin/main` (5d117d5) after discovering main already shipped `ModeBNotice` (#122/#123),
logo-motion-everywhere (#124), and the fabricated-stats-bar removal. Kept only the genuinely-missing fixes:

- [x] **Mode-B disclosure on the homepage** — `ModeBNotice variant="inline"` after the stats strip (CLAUDE.md gate; main covered pricing/security/partners but not home)
- [x] **Mode-B disclosure + CUI-claim honesty on `/brain-ai`** — added `ModeBNotice`; softened metadata "safe for CUI" + card "Local-only, CUI-safe" → Mode-B/C qualifier + hosted-trial caveat
- [x] **Public forbidden colors → tokens** — `partner/layout` avatar `to-purple-500` → steel; `/status` (3) + `/assessment` (1) emerald/amber → `--hs-success`/`--hs-warn`. Public pages now zero forbidden classes.
- [x] **/hipaa PHI over-claim** (advisor catch — Rachel's lead page) — "HIPAA-compliant AI monitoring starting free" softened to "start free; run Mode B for live PHI" + added an inline PHI/BAA boundary note (hosted = non-PHI eval, no BAA).

### Review
Minimal additive PR on top of current main. Build green, tests green (539), live-verified. Regulated-data disclosure now on homepage + /brain-ai + /hipaa + (existing) pricing/security/partners/thank-you. Swept all public `page.tsx` for "never leaves your network"/CUI/PHI claims — remaining hits are Mode-B-framed inline or on pages that already carry the notice.

**Founder-verify before public launch (untouched — unverifiable / product decision):**
- `app/about` testimonial "Maria Chen / Vanguard Aero" + history timeline + future "1,000+ Users"; homepage testimonial; per-tier SLA commitments.
- `partner/layout` is branded "C3PAO Partner Portal / Authorized C3PAO" — but the mission channel is RPO/MSP, and C3PAOs are a documented NEVER-DO referral channel (32 CFR Part 170). Reframe the portal to RPO/MSP, or confirm intent.

**Env-only (founder, per LAUNCH-CHECKLIST):** `database:demo_mode` + `payments:missing_key` — Supabase prod keys, Stripe price IDs + webhook secret, OPENROUTER key (rotate first).

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
