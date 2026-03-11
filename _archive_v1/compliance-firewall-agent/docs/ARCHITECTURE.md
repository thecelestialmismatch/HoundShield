# Compliance Firewall Agent — System Architecture

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     ENTERPRISE NETWORK                           │
│                                                                  │
│  ┌─────────┐    ┌──────────────────┐    ┌──────────────────┐    │
│  │ Employee │───>│ Compliance       │───>│ External LLM     │    │
│  │ App/CLI  │    │ Firewall Gateway │    │ Provider (if     │    │
│  └─────────┘    │ (Next.js API)    │    │ allowed)         │    │
│                 └────────┬─────────┘    └──────────────────┘    │
│                          │                                       │
│               ┌──────────┴──────────┐                           │
│               │                     │                           │
│        ┌──────┴──────┐    ┌────────┴────────┐                  │
│        │ Risk        │    │ Quarantine      │                  │
│        │ Classifier  │    │ Handler         │                  │
│        │ (regex +    │    │ (AES-256 +      │                  │
│        │  patterns)  │    │  review queue)  │                  │
│        └──────┬──────┘    └────────┬────────┘                  │
│               │                     │                           │
│        ┌──────┴─────────────────────┴──────┐                   │
│        │         Supabase (Free Tier)       │                   │
│        │  ┌─────────────┬───────────────┐  │                   │
│        │  │ compliance_ │ quarantine_   │  │                   │
│        │  │ events      │ queue         │  │                   │
│        │  ├─────────────┼───────────────┤  │                   │
│        │  │ policy_     │ seed_         │  │                   │
│        │  │ rules       │ anchors       │  │                   │
│        │  ├─────────────┼───────────────┤  │                   │
│        │  │ audit_      │ hitl_         │  │                   │
│        │  │ reports     │ approvals     │  │                   │
│        │  └─────────────┴───────────────┘  │                   │
│        └───────────────────────────────────┘                   │
│                          │                                       │
│                 ┌────────┴────────┐                              │
│                 │ Dashboard       │                              │
│                 │ (Next.js App)   │                              │
│                 │ - Overview      │                              │
│                 │ - Event log     │                              │
│                 │ - Quarantine    │                              │
│                 │   review        │                              │
│                 └─────────────────┘                              │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Request Lifecycle

1. **Initiation** — Employee app sends LLM API call to the gateway
   (`POST /api/gateway/intercept`) instead of directly to OpenAI/Anthropic/etc.

2. **Parsing** — `request-parser.ts` extracts the prompt text, detects the
   target provider, and normalizes the request.

3. **Classification** — `risk-engine.ts` runs all detection patterns:
   - Decodes any obfuscation (base64, hex)
   - Matches against 16+ regex patterns across 4 categories
   - Computes per-entity and overall confidence scores
   - Returns risk level (NONE → CRITICAL) and recommended action

4. **Decision** — The middleware applies the decision matrix:
   - CRITICAL/HIGH + BLOCK action → Request blocked (HTTP 403)
   - MEDIUM + QUARANTINE action → Queued for review (HTTP 202)
   - LOW/NONE → Allowed (HTTP 200)

5. **Quarantine** (if applicable) — `handler.ts` encrypts the prompt
   (AES-256-CBC) and stores it in the quarantine_queue table.

6. **Logging** — `logger.ts` writes an immutable compliance_events record
   and creates a cryptographic seed anchor for violations.

7. **Notification** — For CRITICAL events and HITL requests, Slack
   notifications are dispatched.

## Threat Model

### Attack Vectors

| Vector | Description | Mitigation |
|--------|-------------|------------|
| Obfuscation bypass | Base64/hex encoding sensitive data to evade regex | Obfuscation decoder runs before classification |
| Prompt injection | Injecting instructions to disable the firewall | Agent has no instruction-following capability; it's pure pattern matching |
| Direct API call | Bypassing the gateway entirely | Network-level enforcement (corporate proxy/DNS) routes all LLM traffic through gateway |
| Policy weakening | Disabling detection rules | All policy changes require HITL approval |
| Audit tampering | Modifying logs to hide violations | Cryptographic seed chain detects any modification |
| Credential theft | Stealing the gateway API key | Standard key rotation with HITL gating |
| ReDoS | Crafted input that causes regex backtracking | Match count capped at 50 per pattern; input truncated at 100K chars |
| Data exfiltration via response | Sensitive data in LLM responses | Current scope is outbound-only; response scanning is a v2 feature |

### Insider Threats

- DB admins cannot read quarantined content (encrypted with app-level key)
- Policy changes leave an auditable HITL trail
- Seed chain makes log deletion/modification detectable
- All approvals are logged with approver identity

## Risk Classification Pipeline

```
Input Prompt
    │
    ▼
┌─────────────────┐
│ Obfuscation     │ ← Decode base64, hex
│ Decoder         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Pattern Matcher  │ ← 16+ regex patterns
│ (PII, Financial, │    across 4 categories
│  Strategic, IP)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Risk Aggregator  │ ← Highest risk wins
│ + Confidence     │    Confidence = f(entities, variety, specificity)
│   Scoring        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Action Decider   │ ← BLOCK / QUARANTINE / ALLOW
└─────────────────┘
```

## Seed Memory Lifecycle (Cryptographic Anchoring)

This replaces the concept of "Vanar Neutron Seeds" with standard
SHA-256 hash chaining — functionally equivalent, zero cost.

1. **Creation** — When a violation event, policy change, or report is created,
   a seed anchor is generated:
   `hash = SHA-256(JSON(content) + "|" + previous_hash)`

2. **Chaining** — Each seed references the previous seed's hash.
   The first seed in a chain uses "GENESIS" as the previous hash.

3. **Verification** — Walking the chain from newest to oldest and
   recomputing each hash detects any tampering.

4. **Batch Verification** — Merkle roots are computed for report
   periods, enabling O(log n) verification.

5. **Storage** — Seeds are stored in the `seed_anchors` table with
   entity_type, entity_id, content_hash, and previous_hash.

## HITL Gating Workflow

Gated operations: POLICY_UPDATE, POLICY_DELETE, KEY_ROTATION,
QUARANTINE_RELEASE, RULE_DEACTIVATION, DATA_EXPORT, DEPLOYMENT,
ENCRYPTION_KEY_CHANGE.

```
Requester → requestApproval() → PENDING record created
                                     │
                                     ▼
                              Slack/console notification
                                     │
                                     ▼
                              Approver reviews in dashboard
                                     │
                            ┌────────┴────────┐
                            ▼                 ▼
                       APPROVED           REJECTED
                            │                 │
                            ▼                 ▼
                    Apply change          Log rejection
                    + Seed anchor         + Seed anchor

Timeout (24h default) → EXPIRED → No action taken
```

## Supabase Schema

See `/supabase/migrations/001_initial_schema.sql` for complete DDL.

Six tables: compliance_events, quarantine_queue, policy_rules,
audit_reports, hitl_approvals, seed_anchors.

All tables have RLS enabled. Service role has full access.

## API Contract

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/gateway/intercept | Main gateway — intercept LLM requests |
| GET | /api/compliance/events | Query compliance event history |
| POST | /api/quarantine/review | Submit quarantine review decision |
| GET | /api/quarantine/review | List pending quarantine items |
| GET | /api/reports/generate | Generate audit report |
| POST | /api/policy/update | Request policy rule change (HITL gated) |
| GET | /api/policy/update?approval_id=X | Check/apply approved policy change |

## Deployment Topology

```
Vercel (free tier)
├── Next.js App (frontend + API routes)
├── Environment variables (encrypted)
└── Serverless functions (API routes)

Supabase (free tier)
├── PostgreSQL database (500MB)
├── Auth (50K monthly active users)
└── Row Level Security policies
```

### Setup Steps (< 24 hours)

1. `npx create-next-app` or clone this repo
2. Create Supabase project (free) at supabase.com
3. Run `/supabase/migrations/001_initial_schema.sql` in SQL Editor
4. Set environment variables (see `.env.example`)
5. Generate encryption key: `openssl rand -hex 32`
6. `npm install && npm run dev` (local)
7. Deploy to Vercel: `npx vercel` (free)
8. Configure corporate proxy to route LLM API calls through the gateway

## EU AI Act Compliance Alignment

| Article | Requirement | Implementation |
|---------|------------|----------------|
| Art. 6 | High-risk classification | System classified as high-risk (monitors AI usage) |
| Art. 9 | Risk management | Real-time risk classification pipeline with 4 categories |
| Art. 10 | Data governance | All data encrypted at rest; quarantined content AES-256 |
| Art. 11 | Technical documentation | This architecture document + inline code documentation |
| Art. 12 | Record-keeping | Immutable audit trail with cryptographic integrity chain |
| Art. 13 | Transparency | Dashboard shows all decisions; reports explain classifications |
| Art. 14 | Human oversight | HITL gating for all policy changes and destructive operations |

## Edge Cases and Failure Modes

| Scenario | Behavior |
|----------|----------|
| Supabase unavailable | Request blocked (fail-closed); error logged to console |
| Classification ambiguity (multiple categories) | All categories reported; highest risk wins |
| Base64-encoded sensitive data | Decoded and scanned (obfuscation decoder) |
| Prompt > 100K characters | Truncated to first + last 50K chars; warning logged |
| Seed chain verification failure | Alert sent; manual investigation required |
| HITL timeout (no approver) | Auto-expires after 24h; operation not performed |
| Concurrent policy updates | Database-level serialization (PostgreSQL row locks) |
| False positive | Quarantine review allows manual release |

## Cost Analysis (Free Tier)

| Service | Free Tier Limit | Expected Usage |
|---------|----------------|----------------|
| Vercel | 100GB bandwidth, 100K function invocations | Well within limits |
| Supabase | 500MB DB, 50K MAU, 2GB bandwidth | Sufficient for MVP |
| Total monthly cost | **$0** | — |
