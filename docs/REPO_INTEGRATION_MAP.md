# houndshield — Repository Integration Map
# 15 sources analyzed. For each: what to pull, where it goes, estimated effort, priority.

---

## SOURCE 1: browser-use/browser-harness-js
**URL:** https://github.com/browser-use/browser-harness-js
**What it is:** JavaScript browser automation harness for AI-driven web interactions.
**Relevance to houndshield:** HIGH — Shadow AI discovery (P1 feature). Detecting which AI tools employees use requires monitoring browser activity.

**Extract:**
- Browser event interception pattern (intercept fetch/XHR calls before they leave browser)
- Extension manifest structure for browser extension deployment
- Message passing between extension content script and background service worker

**Integration:**
- **Where:** `packages/houndshield-browser-agent/` (new package — browser extension for Shadow AI discovery)
- **Replaces:** Nothing existing
- **What it enables:** P1 Feature #9 — Shadow AI discovery at browser level (detects AI requests before they even hit the network)
- **Files to create:**
  - `packages/houndshield-browser-agent/manifest.json` — Chrome/Edge extension manifest
  - `packages/houndshield-browser-agent/content-script.ts` — intercepts fetch to known AI endpoints
  - `packages/houndshield-browser-agent/background.ts` — reports to houndshield dashboard

**Architecture decision:** Browser extension intercepts AI API calls client-side → reports to houndshield proxy → logged in audit trail → Shadow AI report. This covers the gap where employees use AI through the browser, not through a configured API.

**Effort:** 8 hours
**Priority:** P1 (Month 4)
**License:** Check repo — likely MIT

---

## SOURCE 2: nexu-io/auto-github-contributor
**URL:** https://github.com/nexu-io/auto-github-contributor
**What it is:** Automates GitHub contributions, issue management, and PR workflows.
**Relevance to houndshield:** MEDIUM — useful for automating the open-source houndshield-scan community management.

**Extract:**
- Automated issue triage patterns
- PR template auto-population
- Contributor acknowledgment automation

**Integration:**
- **Where:** `.github/workflows/community.yml`
- **What it enables:** When houndshield-scan is open-sourced (Month 5), automate issue triage and contributor management to reduce solo founder overhead
- **Files to create:**
  - `.github/workflows/issue-triage.yml` — auto-labels issues, assigns to backlog
  - `.github/ISSUE_TEMPLATE/bug-report.md` — structured bug reports
  - `.github/ISSUE_TEMPLATE/feature-request.md` — structured feature requests
  - `.github/PULL_REQUEST_TEMPLATE.md` — PR checklist matching code-reviewer standards

**Effort:** 2 hours
**Priority:** P1 (Month 5 — before open-source launch)
**License:** Check repo

---

## SOURCE 3: ruvnet/ruflo
**URL:** https://github.com/ruvnet/ruflo
**What it is:** Agent workflow orchestration framework — defines multi-step agent pipelines.
**Relevance to houndshield:** HIGH — directly applicable to the Brain AI multi-agent orchestration and the Claude Code agent team.

**Extract:**
- Agent pipeline definition format (YAML-based workflow spec)
- Inter-agent communication pattern (agents share state via structured context objects)
- Conditional branching in agent workflows (if compliance audit fails → trigger compliance-auditor agent)
- Session state persistence pattern

**Integration:**
- **Where:** `.claude/workflows/` (new directory)
- **What it enables:** Structured multi-agent workflows that run automatically:
  - `session-start.yml` — team-lead → brain-updater → compliance-auditor check
  - `feature-complete.yml` — test-writer → code-reviewer → doc-writer → commit
  - `cmmc-audit.yml` — compliance-auditor → report-writer → brain-updater
- **Files to create:**
  - `.claude/workflows/session-start.yml`
  - `.claude/workflows/feature-complete.yml`
  - `.claude/workflows/security-review.yml`

**Effort:** 4 hours
**Priority:** P0 (Month 1 — improves agent orchestration immediately)
**License:** Check repo

---

## SOURCE 4: charliehills.substack.com — Claude Feature Usage Guide
**URL:** https://charliehills.substack.com/p/how-i-use-every-claude-feature-and
**What it is:** Comprehensive guide to Claude features for power users.
**Relevance:** MEDIUM — informs how to configure the agent team and CLAUDE.md for maximum effectiveness.

**Extract (key patterns applicable to houndshield):**
- Extended thinking mode for complex compliance analysis (use for `/cmmc-audit` command)
- Projects feature for persistent context across sessions (the Brain AI leverages this)
- Artifacts for generating deployment scripts and compliance reports
- Claude Code subagents for parallel task execution

**Integration:**
- **Where:** `.claude/agents/all-agents.md` (update with extended thinking guidance)
- **What changes:** Add `extended_thinking: true` flag to compliance-auditor and security-auditor agents — these require complex reasoning that benefits from extended thinking
- **Update CLAUDE.md:** Add section on which tasks benefit from which Claude features

**Effort:** 1 hour
**Priority:** P0 (Month 1)
**License:** N/A (article, not code)

---

## SOURCE 5: JCodesMore/ai-website-cloner-template
**URL:** https://github.com/JCodesMore/ai-website-cloner-template
**What it is:** Template for AI-powered website cloning and scraping.
**Relevance:** MEDIUM — useful for the `/competitive-intel` command to scrape competitor sites.

**Extract:**
- Playwright-based scraping pipeline
- Content extraction and structuring patterns
- Anti-bot detection evasion techniques (ethical use: monitoring public competitor sites)

**Integration:**
- **Where:** `scripts/competitive-intel/scraper.ts`
- **What it enables:** Automated competitor monitoring — scrapes Noma, HiddenLayer, AWS Bedrock, Microsoft Purview pages for feature updates, pricing changes, new announcements
- **Files to create:**
  - `scripts/competitive-intel/scraper.ts` — scrapes competitor sites
  - `scripts/competitive-intel/update-brain.ts` — parses scraped content, updates brain/domains/competitors.json
  - Add to `/competitive-intel` command

**Effort:** 3 hours
**Priority:** P1 (Month 3 — before open source launch)
**License:** Check repo

---

## SOURCE 6: garrytan/gstack
**URL:** https://github.com/garrytan/gstack
**What it is:** Full-stack template used by Garry Tan — the target stack reference for houndshield.
**Relevance:** CRITICAL — this is explicitly called out as the stack reference.

**Extract:**
- Project structure conventions (this is what a YC-standard project looks like)
- TypeScript configuration (tsconfig.json for strict mode)
- ESLint and Prettier configuration
- Next.js configuration patterns
- Package.json script conventions
- CI/CD workflow structure

**Integration:**
- **Where:** Root configuration files
- **What it changes:**
  - `tsconfig.json` — adopt gstack TypeScript strict configuration
  - `.eslintrc.json` — adopt gstack ESLint rules
  - `.prettierrc` — adopt gstack Prettier config
  - `package.json` — adopt script naming conventions
  - GitHub Actions workflow — adopt gstack CI pattern

**Effort:** 2 hours (configuration migration)
**Priority:** P0 (Month 1, Week 1 — foundation)
**License:** Check repo — likely MIT

---

## SOURCE 7: growth-exe.notion.site — Claude Code Install Guide
**URL:** https://growth-exe.notion.site/If-you-use-Claude-Code-install-this-immediately
**What it is:** Best practices for Claude Code setup and configuration.
**Relevance:** HIGH — directly informs .claude/ directory configuration.

**Extract:**
- MCP server configurations that improve Claude Code capabilities
- Recommended settings.json structure
- Workflow optimizations for solo founders using Claude Code

**Integration:**
- **Where:** `.claude/settings.json` (update with recommended MCP servers)
- **Key additions:**
  - GitHub MCP server for PR management
  - Filesystem MCP for structured file operations
  - Memory MCP for session persistence (augments our Brain AI)
- **Update CLAUDE.md** with recommended MCP server setup instructions

**Effort:** 1 hour
**Priority:** P0 (Month 1)
**License:** N/A (article)

---

## SOURCE 8: millionco/claude-doctor
**URL:** https://github.com/millionco/claude-doctor
**What it is:** Debugging and diagnostic tool for Claude Code sessions.
**Relevance:** MEDIUM — useful for debugging agent issues.

**Extract:**
- Diagnostic scripts for Claude Code configuration validation
- Common failure mode detection
- Agent communication debugging

**Integration:**
- **Where:** `scripts/debug/claude-doctor.sh`
- **What it enables:** Run `npm run claude:doctor` to diagnose agent team issues
- Add to `.claude/commands/doctor.md` as a slash command

**Effort:** 1 hour
**Priority:** P1 (Month 2)
**License:** Check repo

---

## SOURCE 9: itayinbarr/little-coder
**URL:** https://github.com/itayinbarr/little-coder
**What it is:** Lightweight coding agent pattern — minimal, focused, fast.
**Relevance:** MEDIUM — informs how to keep agent instructions lean and effective.

**Extract:**
- Minimal agent prompt structure (less is more — agents with fewer instructions perform better)
- Task scoping patterns (agents work best with clear, bounded tasks)
- Output format standardization

**Integration:**
- **Where:** Refactor `.claude/agents/all-agents.md` — trim agent instructions to minimum effective length
- **What changes:** Each agent instruction set trimmed to core job + output format. Remove redundancy.
- This directly improves agent performance in every session.

**Effort:** 2 hours (refactoring existing agents)
**Priority:** P1 (Month 2)
**License:** Check repo

---

## SOURCE 10: OpenImagingLab/AnyRecon
**URL:** https://github.com/OpenImagingLab/AnyRecon
**What it is:** Reconstruction and analysis pipeline (imaging/ML focus).
**Relevance:** LOW — imaging reconstruction patterns don't directly apply to houndshield.

**Applicable pattern:** The data pipeline architecture (ingest → transform → analyze → output) maps to houndshield's prompt inspection pipeline. The pipeline modularization pattern is worth adopting.

**Integration:**
- **Where:** Refactor `lib/gateway/` pipeline to match modular pipeline pattern
- **What changes:** `scanner.ts` becomes a pipeline with discrete stages: parse → detect → classify → apply-policy → log. Each stage is independently testable.
- This improves testability of the core detection pipeline.

**Effort:** 3 hours (refactor)
**Priority:** P1 (Month 3)
**License:** Check repo

---

## SOURCE 11: yzhao062/anywhere-agents
**URL:** https://github.com/yzhao062/anywhere-agents
**What it is:** Multi-agent deployment patterns — deploy agents anywhere (local, cloud, edge).
**Relevance:** HIGH — directly applicable to houndshield's multi-deployment model (on-prem, cloud, edge).

**Extract:**
- Agent containerization patterns (each agent as a separate container)
- Agent health check and restart patterns
- Cross-environment configuration management

**Integration:**
- **Where:** `docker-compose.yml` and Helm chart
- **What it changes:** Each scanning component (Presidio, policy engine, audit logger) runs as an independently scalable container with its own health check
- **Files to update:**
  - `docker-compose.yml` — add health checks to all services
  - `helm/templates/deployment.yaml` — add liveness and readiness probes
  - `presidio/health.py` — health check endpoint for Presidio sidecar

**Effort:** 4 hours
**Priority:** P0 (Month 1 — production hardening)
**License:** Check repo

---

## SOURCE 12: firecrawl/firecrawl
**URL:** https://github.com/firecrawl/firecrawl
**What it is:** Web scraping and crawling architecture — structured content extraction at scale.
**Relevance:** HIGH — directly powers the Brain AI content ingestion and `/competitive-intel` command.

**Extract:**
- Structured content extraction (converts any web page to clean, parseable content)
- Rate limiting and politeness (scrape competitor sites without getting blocked)
- Content change detection (only re-process pages that have changed)
- Markdown output format (perfect for injecting into Brain AI knowledge graph)

**Integration:**
- **Where:** `scripts/brain-ingestion/` (new directory)
- **What it enables:**
  - `scripts/brain-ingestion/crawl.ts` — uses Firecrawl patterns to scrape CMMC documentation, NIST 800-171, competitor sites
  - Outputs structured markdown → fed into Brain AI domain files
  - Run on demand and monthly for automated intel updates
- **Files to create:**
  - `scripts/brain-ingestion/crawl.ts`
  - `scripts/brain-ingestion/sources.json` — list of URLs to crawl with topics
  - `scripts/brain-ingestion/ingest.ts` — processes crawled content into brain domains

**Effort:** 5 hours
**Priority:** P0 (Month 1 — Brain AI needs this to be self-sustaining)
**License:** Apache 2.0 — check compliance

---

## SOURCE 13: browser-use/browser-harness (Python)
**URL:** https://github.com/browser-use/browser-harness
**What it is:** Python browser automation harness (Playwright-based).
**Relevance:** MEDIUM — complements the JS browser harness (Source 1) with Python automation for the Presidio sidecar environment.

**Extract:**
- Playwright Python patterns for automated testing
- Browser automation for generating synthetic test prompts with PII

**Integration:**
- **Where:** `presidio/tests/` — automated test harness for PII detection
- **What it enables:** Generate synthetic prompts with embedded PII via browser, pipe through proxy, verify detection. End-to-end automated testing without manual prompt crafting.
- **Files to create:**
  - `presidio/tests/e2e_detection_test.py` — automated PII injection and detection tests

**Effort:** 3 hours
**Priority:** P1 (Month 2)
**License:** MIT

---

## SOURCE 14: platform.claude.com/cookbook
**URL:** https://platform.claude.com/cookbook/
**What it is:** Anthropic's official API cookbook — patterns for building with Claude.
**Relevance:** HIGH — houndshield is built on Anthropic API. Every pattern here is directly applicable.

**Key applicable patterns:**
1. **Tool use / function calling** — Use for structured compliance report generation (have Claude fill out compliance evidence templates)
2. **Extended thinking** — Use for complex CMMC gap analysis (the compliance-auditor agent)
3. **Streaming** — Already in use in proxy streaming. Cookbook provides optimization patterns.
4. **Batching** — For bulk compliance assessment report generation
5. **Prompt caching** — Cache CMMC control definitions in Claude context to reduce token usage in compliance scoring

**Integration:**
- **Where:** `lib/ai/claude-client.ts` (refactor with cookbook patterns)
- **What changes:**
  - Add prompt caching for CMMC control definitions (saves tokens on every compliance query)
  - Add tool use for structured report generation
  - Add extended thinking flag to compliance-auditor agent calls
- **Files to update:**
  - `app/api/chat/route.ts` — add prompt caching
  - `app/api/reports/generate/route.ts` — add tool use for structured output

**Effort:** 4 hours
**Priority:** P0 (Month 1 — reduces API costs and improves report quality)
**License:** N/A (documentation)

---

## SOURCE 15: kyegomez/OpenMythos
**URL:** https://github.com/kyegomez/OpenMythos
**What it is:** Agent framework / multi-agent system (experimental).
**Relevance:** LOW-MEDIUM — the agent coordination patterns are interesting but the ruflo (Source 3) approach is more mature for our use case.

**Extract:**
- Agent memory sharing pattern (agents share a common context object — same as our Brain AI approach)
- Agent capability discovery (agents advertise what they can do — useful for the team-lead agent)

**Integration:**
- **Where:** `.claude/agents/team-lead.md` — adopt capability discovery pattern
- **What changes:** Team-lead agent starts each session by querying which specialist agents are needed for the current task (rather than always spinning up all agents)
- More efficient, less context bloat

**Effort:** 1 hour
**Priority:** P2 (Month 6+)
**License:** Check repo

---

## PRIVATE DOCS — CANNOT ACCESS

The following links require authentication and cannot be scraped:
- https://docs.google.com/document/u/0/d/17GBRk3BYRGRSl7KPQbzJcxxTr4rd81VS/mobilebasic
- https://docs.google.com/document/u/0/d/11pgOoF7NXh9pnpznPdQIFjwidNWFMeyc/mobilebasic
- https://docs.google.com/document/u/0/d/1pPH3ewjI03TONEmFSIJmfEQzZ0uZFJSLldM4WFiipqY/mobilebasic
- https://docs.google.com/document/u/0/d/19UQFGpDwkAptawK1Cd7RMMwhwbBwNdEbnMvNv_fZhZM/mobilebasic
- https://docs.google.com/document/u/0/d/1ioicKlKD2Tevw3EJtUigxmNVTtqccW0tLsYl239vBWY/mobilebasic
- https://docs.google.com/document/u/0/d/10P1RPteBXmurP3GsgtTR270_-Go8eVQ7l9Wpxw3P1g4/mobilebasic
- https://docs.google.com/document/u/0/d/1pBr2M9dvJjnkVQxE-XKvQY-cSlkyj8du2fn0HHjXEFQ/mobilebasic
- https://docs.google.com/document/u/0/d/1hb8rqGL_lTF-cICuTi8vxnihvU3a0nWy/mobilebasic
- https://docs.google.com/document/u/0/d/1MKlXa8r0zgza4koCK44pvFRZoi6juoBdqDOrK5KpyG0/mobilebasic
- https://drive.google.com/file/d/12Nfv2utD581bstjInpN7AvaFE317LGDO/view
- https://drive.google.com/file/d/1Zh3EZ5xrpXuKcUZFcUOdjr8uei97SI8y/view

**ACTION REQUIRED:** Export each of these as PDF, attach to a new chat message, and I will process and integrate them into the appropriate Brain AI domain files.
