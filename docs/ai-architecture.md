# HoundShield — AI Team Architecture
**Version:** 2.0 | May 2026 | BEAST PHASE2 Evolution
**Status:** Production-ready. These are real agents doing real work.

---

## Philosophy

HoundShield's AI system has two distinct jobs:
1. **Product intelligence** — the scanning/detection pipeline that Jordan pays for
2. **Founder intelligence** — the agent team that helps the solo founder ship faster

These are different systems with different models and different latency requirements.
Do not conflate them.

---

## System 1: Product Intelligence (What Jordan Pays For)

### The Scan Pipeline

```
User AI Query
     │
     ▼
[Proxy Intercept] ←── proxy/server.ts
     │
     ▼
[Risk Classifier] ←── lib/classifier/risk-engine.ts
  16 pattern engines
  <10ms deterministic
  No LLM — pure regex + ML patterns
     │
     ├── BLOCK → log + return 403 with explanation
     │
     └── PASS → forward to upstream AI
                    │
                    ▼
              [Metadata Logger] ←── proxy/storage.ts
              logs: timestamp, matched_patterns, controls_affected, scan_latency
              NEVER logs: prompt content (local-only data boundary)
                    │
                    ▼
              [Dashboard Sync] ←── proxy/webhook.ts
              sends: stats only (counts, latency, compliance_status)
              never: CUI content
```

**Critical rule:** Prompt content never leaves the customer's machine. Only license key hash + prompt count + compliance status go to HoundShield servers. Violating this is an immediate product kill — it makes HoundShield another Nightfall.

### Risk Classifier Engines (16 total)
1. CUI Pattern Matcher (NIST 800-171 vocabulary)
2. Export Control Detector (EAR/ITAR terms)
3. PII Scanner (SSN, DOB, address patterns)
4. PHI Detector (HIPAA-defined health identifiers)
5. Contract Number Extractor (DoD contract format: W911/N00014/FA8650)
6. Classification Marker Scanner (FOUO, CUI//SP-CTI, etc.)
7. Technical Drawing Indicator (CAD file names, part numbers)
8. Personnel Data Detector (clearance levels, positions)
9. Financial Data Scanner (budget codes, CAGE codes)
10. Network Topology Detector (IP ranges, system names in defense context)
11. Cryptographic Material Scanner (key material patterns)
12. Source Code IP Detector (file paths, proprietary function signatures)
13. Biometric Data Detector
14. Geolocation Data Scanner (coordinate patterns in classified context)
15. Aggregation Risk Assessor (individually benign + collectively CUI)
16. Entropy Anomaly Detector (encoded/obfuscated data)

**Model:** Pure deterministic (regex + keyword matching + simple ML). No LLM in the scan path. This is intentional — LLMs add latency (50-200ms), cost, and non-determinism. Jordan needs a consistent answer, not a probabilistic one.

---

## System 2: Founder Intelligence (Internal Tooling)

### Agent Team (`.claude/agents/`)

| Agent | File | Responsibility | Max Turns |
|-------|------|----------------|-----------|
| Team Lead | team-lead.md | Sprint gating, escalation, Jordan-check | 5 |
| Code Reviewer | code-reviewer.md | PR review against security + Jordan criteria | 10 |
| Security Auditor | security-auditor.md | CMMC accuracy, data boundary checks | 8 |
| Compliance Specialist | compliance-specialist.md | NIST 800-171 control accuracy | 10 |
| Test Writer | test-writer.md | Test coverage for scanner + Stripe + auth | 15 |
| Debugger | debugger.md | Runtime errors, failed builds | 10 |
| Brain Updater | brain-updater.md | Knowledge graph ingestion | 8 |
| Doc Writer | doc-writer.md | PRD, roadmap, user-facing docs | 10 |
| Refactorer | refactorer.md | Clean code without scope creep | 10 |

### Handoff Logic

```
Founder → Team Lead (always the first check)
               │
               ├── Is this in sprint? → YES → assign to specialist agent
               │
               └── Is this in sprint? → NO → block + explain Jordan priority
                         │
                         └── Override approved? → YES → assign with context
```

**Escalation rule:** Any CRITICAL finding (data boundary violation, Stripe webhook error, auth bypass) → immediately invoke team-lead before touching code.

### The LLM Council (Brain AI)

For strategic decisions (pivots, positioning, pricing changes) the LLM Council runs 5 advisor perspectives before any decision:

| Advisor | Role | Color |
|---------|------|-------|
| The Contrarian | Challenges assumptions, finds fatal flaws | Red |
| The First Principles Thinker | Strips to fundamentals | Purple |
| The Expansionist | Sees 10x opportunities | Green |
| The Outsider | Jordan's perspective, buyer psychology | Orange |
| The Executor | Revenue-first, ship now | Blue |

Council threshold: Only run for decisions with >$1K MRR impact. Not for code.

---

## System 3: Brain AI Knowledge Graph

**File:** `lib/brain-ai/knowledge-graph.ts`
**Purpose:** Queryable knowledge base for compliance accuracy and market intelligence

### Data Categories
- CMMC control library (110 NIST 800-171 Rev 2 controls, full text + SPRS weights)
- Competitor profiles (Nightfall, Strac, Cyberhaven, Netskope, Purview — updated quarterly)
- C3PAO directory (marketplace.cmmcab.org data)
- Market research (CMMC timeline, DIB contractor counts, Phase 2 data)
- Product history (decisions, rationale, evolution)

### Query Interface
```typescript
// Internal use only — never exposed to Jordan's queries directly
import { ask, addKnowledge } from '@/lib/brain-ai/brain-query';

// Query
const answer = await ask('What NIST controls does AI usage monitoring satisfy?');

// Ingest
await addKnowledge({
  category: 'cmmc',
  fact: 'AC.2.006 requires controlling access to CUI on portable devices',
  source: 'NIST SP 800-171 Rev 2',
  confidence: 1.0,
});
```

---

## Model Routing Strategy

| Use Case | Model | Rationale |
|----------|-------|-----------|
| Scan pipeline | No LLM | Deterministic, <10ms |
| Chat (FAQ) | Local FAQ → OpenRouter free tier | Cost zero for 80% of queries |
| Chat (complex) | OpenRouter: Qwen3/Llama-70B | Free tier for MVP |
| Agent work | claude-sonnet-4-5 | Best reasoning for compliance accuracy |
| Brain AI ingestion | claude-haiku | Fast, cheap, bulk processing |
| Council deliberation | claude-opus-4 | Strategic decisions only |

**Budget rule:** OpenRouter free tier handles MVP traffic. Upgrade to paid models only when MRR > $2K.

---

## What Is NOT AI (on purpose)

- Stripe webhook handling — deterministic code
- Auth flows — Supabase Auth
- PDF generation — jsPDF deterministic templates
- RLS policies — SQL
- Rate limiting — token bucket algorithm

Don't put an LLM in the path of anything that needs to be deterministic, auditable, or <50ms.
Jordan's C3PAO will audit the evidence. It must be consistent, not probabilistic.
