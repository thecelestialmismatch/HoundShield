# Hound Shield — Research Materials & Feature Inspirations

Resources consulted during development. Each entry: URL, what was taken from it.

---

## AI Architecture

### Advisor Strategy
**URL:** https://claude.com/blog/the-advisor-strategy  
**Taken:** `advisor_20260301` tool type. Declare Opus as advisor tool in Haiku
request. Haiku runs the loop, calls advisor only when uncertain. Single API call.  
**Applied:** `lib/advisor/compliance-advisor.ts` + Stage 6.5 in `risk-engine.ts`  
**Key stat:** Sonnet + Opus advisor → +2.7pp accuracy, −11.9% cost vs Sonnet-only.

### Managed Agents Architecture
**URL:** https://www.anthropic.com/engineering/managed-agents  
**Taken:** Decouple brain/hands/session. Defer expensive provisioning.  
**Applied:** ADR-008 — deferred to post-Series A, but documented the target state.  
**Key stat:** p50 TTFT −60%, p95 TTFT −90% by separating session state from execution.

### Claude Managed Agents (product)
**URL:** https://claude.com/blog/claude-managed-agents  
**Taken:** Sandboxing, scoped permissions, execution tracing as managed infrastructure.  
**Applied:** Not yet — potential replacement for `lib/gateway/` proxy. See ADR-008.

---

## Frontend Performance

### Pretext.js
**URL:** https://pretextjs.dev/  
**Taken:** Zero-DOM text measurement via Canvas (~500x faster than getBoundingClientRect).  
**Applied:** Not yet. Target: compliance scan log list in command-center when it exceeds
500 entries. SectionSpotlight already uses getBoundingClientRect — Pretext won't help
there (position calculation, not text measurement).

---

## Developer Tooling

### context-mode (mksglu)
**URL:** https://github.com/mksglu/context-mode  
**What it is:** MCP plugin providing FTS5-indexed session continuity across Claude Code
sessions. Compresses context from 315KB to 5.4KB.  
**Audit finding:** Clean architecture, 46 tests, no hype copy, IBM Plex font.  
**Applied:** context-mode is available as an MCP. Run in Kaelus Claude Code sessions
to reduce context compaction issues during multi-file gateway refactors.

### code-review-graph (tirth8205)
**URL:** https://github.com/tirth8205/code-review-graph  
**What it is:** Tree-sitter codebase graph + BM25 impact analysis. "6.8x fewer tokens."  
**Applied:** Available as `mcp__code-review-graph__*` in Claude Code sessions.
Run `build_or_update_graph_tool` on `compliance-firewall-agent/` before any
`lib/gateway/` changes to get impact radius before touching the proxy.

### Self-Evolving Hooks Pattern
**URL:** https://www.buildthisnow.com/blog/self-evolving-hooks  
**What it is:** 3-hook system — SubagentStart loads learnings → OnStop captures
corrections → DreamWorker writes rules after 3+ repeated corrections.  
**Applied:** `.claude/hooks/dream-worker.md` skeleton created. Full impl pending.

### swarmvault (swarmclawai)
**URL:** https://github.com/swarmclawai/swarmvault  
**What it is:** Local-first RAG: raw research → markdown wiki + BM25+vector search.  
**Applied:** Not yet. Target: compile CMMC Level 2, NIST 800-171, HIPAA, SOC 2 control
definitions into a swarmvault corpus for semantic classification lookup.

### superpowers (obra)
**URL:** https://github.com/obra/superpowers  
**What it is:** The skill framework powering Claude Code's `Skill` tool.  
**Applied:** Kaelus already uses this via `superpowers:` skill prefix in CLAUDE.md.

### TurboQuant (Google Research)
**URL:** https://research.google/blog/turboquant-redefining-ai-efficiency-with-extreme-compression/  
**What it is:** 3-bit KV cache compression, 8x faster attention, zero accuracy loss.  
**Applied:** Not applicable — Kaelus uses Anthropic's API, not self-hosted inference.
Relevant if Kaelus ever self-hosts models for on-premise enterprise deployments.

---

## Live Stats Pattern

### context-mode stats.json
**Pattern:** Fetch `https://raw.githubusercontent.com/[owner]/[repo]/main/stats.json`
from the landing page hero. Low-effort social proof with real numbers.  
**Applied:** `public/stats.json` created. HeroSection wired to fetch + display live
scan counts, organizations, and threats blocked.

---

## Competitive Intelligence

### claw-code (ultraworkers)
185K GitHub stars. Rust-based Claude Code alternative. If customers use claw-code,
Kaelus's proxy URL approach (no client changes needed) is the right bet — it's
framework-agnostic.

### badclaude / OpenWhip (GitFrog1111)
Adversarial Claude behavior research. Useful for red-teaming Kaelus's prompt
interception — what prompt injections does the compliance scanner need to catch?

---

## OODA Ingestion — 2026-04-30

8 new knowledge nodes added to Brain AI from full product data review (ALL MY DATA ingestion).
Nodes cover gaps not previously in either KB store.

### Product Roadmap (`product_roadmap`)
**Source:** OODA product roadmap analysis, April 2026  
**Added:** Planned capabilities in priority order: Shannon entropy engine, browser extension paste interception, extended AI provider support (Perplexity/Grok/Mistral/Meta AI), demo mode guard, subscription gating.

### Browser Extension (`product_extension`)
**Source:** Product roadmap + architecture decision  
**Added:** Paste interception at UI layer via WASM scanner. Complementary to proxy (network layer). BYOD deployment path. Target: Chrome/Edge. Safe redact mode replaces CUI tokens inline.

### Shannon Entropy Engine (`product_entropy`)
**Source:** Information-theoretic secret detection research  
**Added:** H > 3.5 threshold for strings >16 chars = probable secret. Catches zero-day API key formats regex can't. Addresses NIST 3.13.10 (cryptographic protection of key material).

### Sprint 1 MVP Flow (`product_sprint1_mvp`)
**Source:** CLAUDE.md Sprint 1 definition  
**Added:** End-to-end Jordan flow: signup → Docker pull → one env var → proxy running → 3 test prompts → PDF export. Target: <10 minutes for non-technical IT manager.

### Customer Discovery Questions (`market_customer_discovery`)
**Source:** OODA Phase 2 validated framework  
**Added:** 5 open-ended discovery questions + 4 urgency signals (no C3PAO answer, DNS bypass via hotspot, <90 days to assessment, prime contractor mandate).

### OODA BUILD Verdict (`market_ooda_verdict`)
**Source:** OODA Phase 1-5 Paul Graham pressure test, April 2026  
**Added:** STRONG verdict. DFARS 7012 = law not preference. Local-only moat uncopiable. Painkiller. Top 3 failure modes: Microsoft GCC High ships local AI DLP, enterprise DLP adds CMMC-local, enforcement deadline extends.

### Product Evolution (`product_evolution`)
**Source:** Rebranding project (April 2026, ~295 files renamed)  
**Added:** Kaelus → HoundShield rationale. Pending blockers: Stripe webhook still on kaelus.online (update at dashboard.stripe.com/webhooks), Supabase migrations 003+004 not pushed to prod.

### Tool Ecosystem (`tool_ecosystem`)
**Source:** Development workflow audit  
**Added:** Firecrawl (Brain AI ingestion), Context7 (live docs), claude-mem (persistent memory), browser-harness (AI provider testing), code-review-graph MCP (6.8x token reduction), Superpowers, GSD, caveman mode.

---

## Deferred / Not Applied

| Resource | Why Not Applied |
|----------|----------------|
| boneyard.vercel.app | Requires paid subscription — inaccessible |
| Google Drive links (multiple) | Require auth — inaccessible |
| Private Notion docs (multiple) | Require auth — inaccessible |
| TurboQuant | Self-hosted inference only |
| Managed Agents product | Weeks of work — deferred to post-Series A |
| swarmvault for classifier | Build before Series A — currently out of scope |
