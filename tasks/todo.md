# Hound Shield — Task Queue

## Active

### 2026-07-12d — Founder gets alerted when a report sells + go-live runbook (PR pending)
- [x] Traced the full $499 money path end-to-end (button → checkout → thank-you → webhook → order row → emails). All links exist EXCEPT: on a sale the webhook emailed only the **buyer**, never the founder. The report is manually fulfilled → founder needs an actionable "go deploy for X, start their 14-day assessment" alert (Stripe's default receipt only says "you got $499"). Added `reportOrderEmail.founderAlert(...)` (HTML-escaped buyer input) + wired it into `handleReportOrder` (best-effort, never blocks billing) → `FOUNDER_EMAIL || contact@houndshield.com`. Retail/$499 vs wholesale/$299 aware.
- [x] Tests: 8 template unit tests + 3 webhook integration tests (buyer+founder both emailed, FOUNDER_EMAIL fallback, email-throw never fails the webhook). `vi.hoisted` resend mock. Local suite green.
- [x] Wrote `docs/GO-LIVE-STRIPE.md` — founder runbook to actually take money. Leads with the REAL blocker: `payments:missing_key` persisted AFTER a redeploy, so it's not a missing redeploy — it's Production-scope / name-typo / stray-quotes on `STRIPE_SECRET_KEY`. Then webhook registration, FOUNDER_EMAIL, test-card dry run, manual-invoice fallback.
- [ ] **FOUNDER:** work `docs/GO-LIVE-STRIPE.md` Step 1 first (fix the env-var scope) → `/api/health` must read `payments: connected`. Merging PRs alone will NOT fix Stripe.

### 2026-07-12c — Outreach pack produced (removes "I don't know how to sell")
- [x] Wrote ready-to-send outreach: 4 cold emails (healthcare/legal/defense direct + RPO co-sell), follow-up, subject bank, $499 offer blurb, and a step-by-step "how to send" (find contacts → 10/day → book call → invoice manually while Stripe is off). Saved: scratchpad/outreach-pack.md.
- [ ] FOUNDER: pick Healthcare or Legal (fastest, no FedRAMP blocker), send 10 today. First "yes" → manual invoice (don't wait for Stripe key).

### 2026-07-12b — Stop losing leads (houndshield session, PR pending)
- [x] Freshness re-check: CMMC Phase 2 still **Nov 10 2026** (no slip) → CONTINUE verdict holds. Idea validation NOT re-run (merged #177 12h earlier).
- [x] **Contact form was FAKE** — `handleSubmit` did `setTimeout → "Message sent"` and delivered NOTHING. Every lead (incl. $499 buyers deflected from dead Stripe checkout) was silently dropped. Fixed: real `POST /api/contact` (new route, Resend → founder inbox, mirrors `/api/partners/apply`). Honest 503 fallback (shows direct email) when Resend unset — never a fake success. Browser-verified: real POST, honest fallback shown, 0 console errors.
- [x] Removed banned false claim on /contact ("hosted on FedRAMP-authorized cloud services") — NEVER-DO violation; replaced with the honest Mode-B / non-CUI-trial wording.
- [x] /pricing: $499 one-time report is now the **hero h1** (doctrine: lead product first); subscription grid reframed "Ongoing monitoring" → kills the "$499/mo Growth vs $499 one-time" collision. Guard test (direction-a-port) green.
- [x] Guards added: `app/api/contact/__tests__/route.test.ts` + `app/contact/__tests__/contact-delivery-contract.test.ts` (fake-form + FedRAMP-claim can't silently return). Full suite 1026/1026, build+lint+tsc green.
- [ ] **FOUNDER, 5 min — STILL THE #1 BLOCKER:** set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` in Vercel, point webhook at `https://houndshield.com/api/stripe/webhook`, redeploy, verify `/api/health` shows `payments: connected`. Until then checkout 503s (but leads now survive via the fixed /contact form).

### 2026-07-12 — Idea validation + houndshield skill upgrade (this session)
- [x] 7-axis market validation (TinyFish web research + adversarial verify). VERDICT: **CONTINUE** — product is done, market real, CMMC timing intact; the gap is checkout + distribution, not product. Full writeup: `docs/VALIDATION-2026-07-12.md`
- [x] `houndshield` skill upgraded — now self-orients (reads todo/lessons/primer/health → real briefing, not placeholders), keeps all 12 personas, logs each session for continuity
- [x] Confirmed BOTH payment paths dead: `/api/health` → payments:missing_key (checkout 503) AND backup link buy.stripe.com/aFa00lgzIgJx3Aqb7qgUM00 → **EXPIRED** (2026-07-12). Company cannot take a dollar until fixed.
- [ ] **FOUNDER, 5 min — THE #1 BLOCKER:** set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` in Vercel, point webhook at `https://houndshield.com/api/stripe/webhook`, redeploy, verify `/api/health` shows `payments: connected`. (Backup Stripe payment link is expired — must create a fresh one OR set the key.)
- [x] DONE 2026-07-12b: /pricing now leads with the $499 one-time report (hero h1); "$499/mo Growth" vs "$499 one-time" collision fixed by reframing the grid as "Ongoing monitoring". Didn't wait for payments-green — clarity fix needs no live checkout, and the report CTA safely deflects to the now-working /contact form.
- [ ] FOUNDER: send the 10 RPO/MSP emails as a **referral/co-sell pilot** (not white-label — RPOs gate white-label on SOC 2 + insurance + references); land 1 design-partner testimonial (free/half-price $499 report for a case study).

### 2026-07-11 — Vertical-balance tranche
- [x] Legal cluster opened (Marcus had ZERO articles): /blog/ai-attorney-client-privilege-what-bar-opinions-mean
- [x] /answers/does-vanta-or-drata-cover-ai-usage — complementary-tool traffic capture, honest "we don't replace them" framing
- [x] Verified Stage-1 gates already live: Brain AI CUI warning (GlobalChat) + RFC 9116 security.txt (tested)

### 2026-07-10 — Evidence-moat tranche (PR #175, after competitive deep-dive)
- [x] Gaps page: "AI-relevant gaps / SPRS points at stake" banner (honest scope, uses the contract-tested relevance set)
- [x] Changelog 2.7.0 — real shipped features only (control library, partner kit, console links, latency CI gate)
- [x] docs/EMAIL-SEQUENCES.md — RPO outreach 3-touch (arms the 10 drafts) + $499 buyer onboarding day 1/3/7 (manual send until wired)
- [x] /answers/what-evidence-does-a-c3pao-accept-for-ai-usage — the pre-purchase Jordan question, four-artifact table
- [ ] **FOUNDER:** approve the weekly competitive-watch Routine + TinyFish MCP in an interactive session (both blocked on approval here)

### 2026-07-10 — Second tranche (founder said "go"; fresh branch off merged #159)
- [x] /controls — 110 programmatic NIST 800-171 pages + index, honest AI-relevance verdicts, contract-tested
- [x] Commercial answers (nightfall-alternatives · cmmc-ai-monitoring-cost) + C3PAO checklist article + /partners/kit (RPO/MSP)
- [x] CI: scanner latency bench (<10ms p99 gate; measured 0.565ms) · security-audit (report-only) · Dependabot · Lighthouse CI (informational)
- [ ] **FOUNDER, 5 min:** STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET in Vercel — still THE revenue blocker
- [ ] **FOUNDER, 5 min:** DOCKERHUB_USERNAME/TOKEN secrets + push tag `proxy-v2.0.0` → publishes houndshield/proxy:latest
- [ ] **FOUNDER:** send the 10 RPO/MSP emails (now with /partners/kit to land on); Y/N on the two frozen-content flags (llms.txt "C3PAO partner program", "Kaelus" in old post)

### 2026-07-10 — Tier-1 SEO content sprint (same branch/PR #159, additive-only per founder freeze)
- [x] 5 Tier-1 blog articles shipped (GCC High cost math · HIPAA Privacy Officer 2026 · CUI incident-response playbook · NIST 800-171 AI mapping · AI policy template)
- [x] 3 AEO answers (is-chatgpt-hipaa-compliant · can-law-firms-use-chatgpt · what-happens-if-you-paste-cui-into-chatgpt)
- [x] 2 comparisons (/compare/strac · /compare/witnessai) — pass the honest-editorial guard
- [x] llms.txt: insert-only additions (new articles + answers + compare list); blog SEO contract test added to CI
- [ ] **FOUNDER FLAG:** llms.txt still says "C3PAO partner program" (channel-identity framing — the barred kind per 2026-06-23 lesson) and the frozen blog post "how-to-protect-cui…" says "your Kaelus endpoint" (stale brand). Both left untouched per the don't-touch-existing-SEO freeze — approve fixes and they're one-line edits.

### 2026-07-10 — Unseen-issues sweep (branch claude/project-unseen-issues-206sz6)
- [x] Proxy test suite un-broken (root postcss.config.mjs leak) + proxy added to CI (it had ZERO CI coverage)
- [x] docker-publish.yml: publish steps could never run (step env invisible to its own `if:`) — fixed with `secrets` context; `houndshield/proxy:latest` can now actually publish once DOCKERHUB_* secrets are set
- [x] `npm run verify:structure` failing since PR #146 — manifest + PROJECT-STRUCTURE.md synced, added as CI Structure Guard job
- [x] ESLint 153→0 warnings (eslint-plugin-unused-imports + `^_` pattern); pre-commit `--max-warnings 0` no longer landmined
- [x] SecurityAdvisor system prompts were never sent to the model (JSON parse always fell back) — wired via ReasoningLoop `systemPrompt`
- [x] /auth sign-up now shows a confirmation banner (was silent after success); fake "Live Scanning" counters relabeled "Demo — Simulated Traffic"

### 2026-07-08 — Reality check (HERMES session: direct GitHub push restored)
- [ ] **FOUNDER, 5 min — THE revenue blocker:** set `STRIPE_SECRET_KEY` in Vercel.
      Live `/api/health` says `payments: missing_key` — ALL checkout (subscriptions + the $499 report) is dead until this lands.
      While there: set `STRIPE_WEBHOOK_SECRET` + point the Stripe webhook at `https://houndshield.com/api/stripe/webhook`, then re-verify `/api/health`.
      (`database` and `ai_router` show ✅ connected — those 06-10 env items are done.)
- [ ] Merge PR #151 — /pricing $499 report CTA now uses the ReportCheckoutButton rail (503-safe while the key is missing). Merge = auto prod deploy from main.
- [ ] **FOUNDER, ~20 min:** send the 10 C3PAO partner emails sitting in Gmail drafts (from 06-10 — status unknown; still the highest-leverage GTM action if unsent).
- [x] `hermes/redesign-demos` pushed (503e114 — HERMES site Direction A); Vercel preview build READY (2026-07-08)
- [x] 06-10 "push feature/beast-ui-v3" task CLOSED as obsolete — main independently shipped the CTA / testimonial / og-image fixes via PRs #103–#149; the one surviving gap (direct $499 CTA on /pricing) is PR #151 (2026-07-08)

### Superseded 2026-06-10 audit items (kept for trail)
- [~] Push `feature/beast-ui-v3` — obsolete; superseded by main (see above)
- [x] Supabase + OpenRouter env vars — verified `connected` via live /api/health (2026-07-08); Stripe keys remain the open item
- [x] Gap Report $499 payment link LIVE → https://buy.stripe.com/aFa00lgzIgJx3Aqb7qgUM00 (`prod_Ug034JhG2q2AA7`)

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
