# Kaelus.Online — Hybrid Architecture PRD
**Date:** 2026-04-16
**Status:** Approved — Godmode execution
**Goal:** Beat every competitor on every axis. First paying customer in 14 days.

---

## Problem Statement

Current architecture: cloud SaaS. Prompts flow through kaelus.online servers.
Marketing claim: "CUI never leaves your network."
These contradict. Fix closes the largest competitive moat available.

Every cloud-based competitor (Nightfall $25M ARR, Strac, Metomic, Cisco, Cloudflare) cannot legally claim CUI stays on-premises. Kaelus can — but only after this build.

WitnessAI ($58M raised) has on-prem but enterprise-only ($100K+). No SMB self-serve exists. This is the gap.

---

## Competitive Moat Stack (After This Build)

| Competitor | Their limit | Kaelus advantage |
|---|---|---|
| Nightfall ($25M ARR) | Cloud only, browser extension | Local scan, API-level, CMMC-legal |
| WitnessAI ($58M) | On-prem but enterprise $100K+ | Same local arch, $199/mo, 20-min install |
| Strac / Metomic | Browser extension only | Intercepts ALL traffic: browser + API + CLI + IDE |
| Cisco / Zscaler | Requires existing $100K stack | Zero infrastructure dependency |
| Microsoft Purview | M365 E5 only, Copilot only | Any LLM: ChatGPT, Claude, Gemini, OpenRouter |
| C3PAO consultants | $30K-$150K point-in-time | $199/mo continuous monitoring + live SPRS score |
| "Ban AI tools" policy | No audit evidence | Technical control → actual CMMC evidence |

---

## Architecture: Hybrid Local + Cloud

```
CUSTOMER ENVIRONMENT (on-premises, Docker)
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Employee device (browser, IDE, CLI, CI/CD)                     │
│       │ AI API call (ChatGPT, Claude, Gemini, OpenRouter)       │
│       ▼                                                         │
│  Kaelus Proxy  ← docker run -p 8080:8080 kaelus/proxy          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Receive prompt (OpenAI-compatible API)                 │  │
│  │ 2. Extract text from all message roles                    │  │
│  │ 3. Run CUI/PII/PHI scanner (pure regex, <10ms)           │  │
│  │ 4. BLOCK → return 403 error, log to local SQLite          │  │
│  │    ALLOW → forward to upstream AI provider               │  │
│  │ 5. POST metadata-only event → kaelus.online (async)      │  │
│  │    Metadata: {timestamp, action, pattern_name, risk_level}│  │
│  │    NEVER: prompt text, CUI content, user data            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │ metadata only (no content, no CUI)
         ▼
KAELUS CLOUD (kaelus.online — Vercel)
┌─────────────────────────────────────────────────────────────────┐
│  Event ingestion: POST /api/events/ingest                       │
│  Dashboard: SPRS score, timeline, block analytics               │
│  C3PAO Partner Portal: multi-tenant client management           │
│  PDF audit reports: CMMC control references                     │
│  Stripe billing + license management                            │
└─────────────────────────────────────────────────────────────────┘
```

### Data Residency Guarantee

The Docker proxy:
- Scans ALL prompt content locally (in-memory, no disk write of content)
- Logs to local SQLite: timestamp, action, pattern_name, risk_level, request_id ONLY
- Never stores prompt text, never transmits prompt text
- Outbound call to kaelus.online: license key validation (HTTPS, key hash only)
- Outbound call to kaelus.online: scan metadata (no content, async, non-blocking)

Verification: `tcpdump port 8080` during a CUI block — zero content in outbound traffic. Demonstrable to any auditor in 60 seconds.

---

## Build Plan: 4 Phases

### Phase 1: Docker Local Proxy (Days 1-4)
**Unlocks: CMMC compliance pitch, beats Nightfall/Strac/Cisco**

New directory: `/proxy/` (standalone Node.js package, no Next.js)

Files:
```
proxy/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── server.ts          ← Express server, OpenAI-compatible API
├── scanner.ts         ← Extracts + ports classifier logic (pure, no Supabase)
├── patterns/
│   ├── cmmc.ts        ← CAGE codes, contract numbers, CUI markings
│   ├── hipaa.ts       ← PHI patterns
│   └── pii.ts         ← SSN, PII patterns
├── storage.ts         ← Local SQLite event log (better-sqlite3)
├── webhook.ts         ← Metadata-only POST to kaelus.online/api/events/ingest
├── license.ts         ← License key validation (HTTPS, no content)
└── install.sh         ← One-command install + start
```

API surface (identical to existing `/api/v1/chat/completions`):
```
POST http://localhost:8080/v1/chat/completions
Authorization: Bearer <kaelus-license-key>
x-provider-api-key: <upstream-key>
x-provider: openai | anthropic | google | openrouter

Body: standard OpenAI ChatCompletionCreateParams
Response: standard OpenAI ChatCompletion (streaming or non-streaming)

Response headers added:
  X-Kaelus-Risk-Level: NONE | LOW | MEDIUM | HIGH | CRITICAL
  X-Kaelus-Action: ALLOWED | BLOCKED | QUARANTINED
  X-Kaelus-Scan-Ms: <latency>
  X-Kaelus-Request-Id: <uuid>
```

Install experience:
```bash
# One command install
curl -sSL https://kaelus.online/install | bash
# OR
docker run -d -p 8080:8080 \
  -e KAELUS_LICENSE_KEY=xxx \
  -e UPSTREAM_API_KEY=sk-xxx \
  kaelus/proxy:latest
```

Customer changes ONE setting: `baseURL = "http://localhost:8080/v1"`

### Phase 2: C3PAO Partner Portal (Days 5-7)
**Unlocks: channel strategy, MSSP reseller tier**

New route section: `/app/partner/`

Pages:
- `/partner` — Partner dashboard: all client orgs, aggregate stats
- `/partner/clients` — Client list with SPRS score per org, last activity
- `/partner/clients/[orgId]` — Per-client detail: block events, SPRS breakdown, deploy key
- `/partner/deploy` — Generate Docker deploy instructions per client (pre-filled with their org key)
- `/partner/billing` — Partner billing: $75/client/month, invoice management

New DB migration `010_partner_portal.sql`:
```sql
-- Partner organizations (C3PAOs managing multiple client orgs)
CREATE TABLE partner_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  docker_api_key TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_user_id, client_org_id)
);

-- Docker proxy event ingestion (metadata only, no content)
CREATE TABLE proxy_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('ALLOWED', 'BLOCKED', 'QUARANTINED')),
  risk_level TEXT NOT NULL,
  pattern_name TEXT,
  nist_control TEXT,         -- e.g. "AC.L2-3.1.3"
  scan_ms INTEGER,
  source TEXT DEFAULT 'docker_proxy',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Phase 3: Audit PDF Upgrade (Day 8)
**Unlocks: audit-ready evidence, C3PAO value prop**

Update `lib/reports/pdf-generator.ts`:
- Add "CMMC Control Evidence" section
- Per block event: control ID (e.g. AC.L2-3.1.3), control name, SPRS point impact
- Add "DCSA Reportable Event" flag for CRITICAL blocks
- Add cover page with SPRS score delta (before/after Kaelus)
- Add footer: "This report constitutes audit evidence for CMMC Level 2 practice AC.L2-3.1.3 (Control the flow of CUI in accordance with approved authorizations)"

### Phase 4: MCP Server Endpoint (Days 9-10)
**Unlocks: AI coding tool protection — unique, nobody does this**

New route: `/api/v1/mcp/route.ts`

Implements MCP (Model Context Protocol) server spec. Intercepts:
- Claude Code tool calls (file reads, web fetches containing CUI)
- Cursor AI context windows
- Copilot context sent to GitHub's servers

This is genuinely uncovered by every competitor. Defense contractors increasingly use AI coding tools. A developer pasting a config file containing CAGE codes or contract numbers into Cursor sends it to GitHub's cloud. Nobody is scanning this today.

MCP server exposes standard MCP tools that wrap the CUI scanner, blocking tool execution if CUI detected in inputs.

---

## Existing Code to Reuse

| Existing | Reuse in |
|---|---|
| `lib/classifier/risk-engine.ts` | Docker proxy (port patterns, strip Supabase deps) |
| `lib/classifier/cmmc-patterns.ts` | Docker proxy (copy as-is, pure regex) |
| `lib/classifier/hipaa-patterns.ts` | Docker proxy (copy as-is, pure regex) |
| `lib/classifier/patterns.ts` | Docker proxy (copy as-is) |
| `app/api/v1/chat/completions/route.ts` | Docker proxy server.ts (port logic, replace Next.js with Express) |
| `lib/reports/pdf-generator.ts` | Upgrade in-place (add CMMC control columns) |
| `lib/shieldready/scoring.ts` | Partner portal (SPRS aggregation per client) |

---

## Non-Goals (Do Not Build)

- Electron desktop app (too complex, no billing, updates hard)
- Browser extension (Nightfall just launched same thing, not differentiated)
- SIEM integrations (Phase 2 engineering, not revenue-critical now)
- Blockchain audit anchoring expansion (already built, don't touch)
- Multi-cloud deployment tooling (customer runs Docker locally, not our problem)

---

## Success Criteria

**Phase 1 done when:**
- `docker run kaelus/proxy` starts in <30s on clean machine
- CUI block fires within 10 min on fake CAGE code test
- Block logged to local SQLite
- Metadata POSTed to kaelus.online (verified via network tab)
- Existing cloud dashboard shows the block event from Docker proxy
- Install end-to-end under 20 minutes for non-technical user

**Phase 2 done when:**
- C3PAO partner can log in and see all their client orgs
- Per-client SPRS score visible
- Docker deploy key generated per client org
- Partner can provision a new client in under 2 minutes

**Phase 3 done when:**
- PDF includes CMMC control references (AC.L2-3.1.3, AU.L2-3.3.1, SI.L2-3.14.1)
- PDF is presentable to a C3PAO auditor as evidence of technical control
- SPRS score impact section present

**Phase 4 done when:**
- MCP server responds to `initialize` handshake
- Tool call containing CAGE code returns blocked result
- Claude Code can connect to `/api/v1/mcp` as an MCP server

---

## Stack (All Free/Open Source)

**Docker proxy:**
- Node.js 22 slim (Docker)
- Express 4 (HTTP server)
- better-sqlite3 (local event log)
- zod (input validation)
- node-fetch (upstream proxy)

**Cloud additions:**
- Existing Next.js 15 / Supabase / Stripe stack — no new deps
- New Supabase migration for partner portal tables

---

## Pricing Impact

| Tier | Before | After |
|---|---|---|
| Starter FREE | Cloud SaaS | Cloud SaaS |
| Pro $199/mo | Cloud SaaS | Cloud SaaS + Docker proxy |
| Growth $499/mo | Cloud SaaS | Cloud SaaS + Docker + Priority support |
| Enterprise $999/mo | Cloud SaaS | Cloud SaaS + Docker + Multi-tenant + White-label |
| Agency $2,499/mo | Cloud SaaS | Cloud SaaS + Docker + C3PAO Portal + Partner billing |

---

*Spec by: Claude Code (Kaelus.Online worktree cool-jones, 2026-04-16)*
*Next step: Execute Phase 1 immediately.*
