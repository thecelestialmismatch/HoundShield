# Hound Shield — Architectural Decisions

Decisions recorded here explain WHY the architecture is shaped this way.
Code explains what. This explains why.

---

## ADR-001: 16-Pattern Detection Engine (regex-first, AI-second)

**Decision:** Run regex patterns before any AI model.

**Why:** The latency budget is <10ms for the gateway intercept path. Regex
runs in 0.1–2ms for prompt-sized inputs. AI models (even Haiku) take 200–800ms.
Calling AI first would break the latency promise for 100% of requests to fix
the 5% of cases regex misses.

**How to apply:** Regex handles NONE/LOW/HIGH/CRITICAL confidently. The grey
zone is MEDIUM — that's where the Advisor Strategy (ADR-004) fires.

---

## ADR-002: Gemini Flash as Stage 0 (concurrent, non-blocking)

**Decision:** Fire Gemini Flash in parallel with regex, cap at 12ms.

**Why:** Gemini Flash is context-aware in ways regex isn't (implicit PHI,
strategic trade secrets without keywords). Race against a 12ms timer —
if it wins, it can elevate risk. If it loses, regex result stands.

**Alternative considered:** Run Gemini sequentially after regex. Rejected
because it adds 50–200ms to every scan, breaking the <10ms claim for most
cases. The race approach gets the benefit ~30% of the time for free.

---

## ADR-003: Supabase for All Persistence

**Decision:** Single Supabase project for auth, profiles, subscriptions,
audit logs, webhooks, custom patterns, zero-trust rules.

**Why:** Avoid operating multiple databases. Supabase handles RLS at the
database layer — compliance-sensitive data doesn't depend on application-
layer access control. Row-level security means even a compromised API key
can only read data belonging to its org.

**Risk:** Free tier auto-pauses after 1 week. Documented workaround:
use `mcp__eb94e6c2__restore_project` via Supabase MCP to revive.
Upgrade to Pro before first paying customer.

---

## ADR-004: Advisor Strategy — Haiku + Opus for Borderline Cases

**Decision:** Use Anthropic's `advisor_20260301` tool type. Haiku executes,
Opus advises only when Haiku is uncertain.

**Why:** Sonnet-only costs ~$0.002/scan and is overkill for 90% of
classifications (clearly NONE or clearly CRITICAL). Haiku + Opus advisor
costs ~$0.0003 for confident cases, ~$0.002 only when Opus is actually needed.
Net result: ~85% cost reduction with better accuracy on borderline cases.

**Where it fires:** Stage 6.5 in `lib/classifier/risk-engine.ts` — only when
`highestRisk === 'MEDIUM'` after regex + Gemini. Never blocks fast-path.
Degrades to regex-only when `ANTHROPIC_API_KEY` not set.

**Beta status:** `advisor_20260301` is a beta feature. If Anthropic returns
400/404, the module returns null and the caller uses regex result. Monitor
`lib/advisor/compliance-advisor.ts` line 106 for `status === 400` handling.

---

## ADR-005: PlatformDashboard Must Stay `ssr: false`

**Decision:** `dynamic(() => import('./PlatformDashboard'), { ssr: false })`

**Why:** Recharts uses `window` and `document` during module initialization.
Next.js SSR runs in a Node.js environment with no DOM. The import itself
(not just rendering) crashes the build. `ssr: false` defers the import to
the browser where these globals exist.

**Never remove** the `ssr: false` unless Recharts explicitly announces SSR
support.

---

## ADR-006: Output Standalone for Docker

**Decision:** `output: "standalone"` in next.config.js.

**Why:** Docker images need a self-contained Node.js server. Standalone mode
copies only necessary files (no `node_modules/` duplication). Image size drops
from ~2GB to ~200MB.

**Side effect:** `.next/standalone/` must be used as the Docker context, not
the repo root. See deployment docs.

---

## ADR-007: Webhook DLQ Pattern for Integration Reliability

**Decision:** Two-table webhook system: `webhook_deliveries` (audit trail) +
`webhook_dlq` (permanently failed, awaiting replay).

**Why:** Enterprise SIEM integrations (Splunk, Sentinel, Elastic) can have
outages. Losing webhook events during an outage means missing compliance
violations from the audit trail — a regulatory problem, not just a technical
one. DLQ enables manual replay of failed events with the full original payload.

**Retention:** `webhook_deliveries` prune at 90 days. `webhook_dlq` keep
forever until manually replayed or dismissed.

---

## ADR-008: Managed Agents Architecture (Deferred)

**Decision:** Keep brain/hands/session in a single Next.js app for now.
Target state (post-Series A): decouple.

**Why deferred:** Splitting into stateless microservices requires shared
state (Redis/Supabase Realtime), service discovery, and distributed tracing
— all O(weeks) to implement correctly. Current architecture handles ~10K
concurrent scans before hitting Next.js response stream limits.

**When to revisit:** When gateway latency p95 exceeds 50ms under load, or
when a single outage in one subsystem takes down the whole product.

**Target architecture** (per Anthropic managed-agents blog):
- Edge function: stateless prompt interceptor (hands)
- Serverless: compliance analysis + classifier (brain)
- Supabase: scan decisions + audit events (session)
