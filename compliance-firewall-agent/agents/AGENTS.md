# Compliance Firewall Agent — Agent Definitions

## Primary Agent: Compliance Gateway

**Purpose:** Autonomously intercept, classify, and gate all outbound LLM requests
to prevent unauthorized transmission of sensitive enterprise data.

### Capabilities

1. **Intercept** — Captures all outbound API calls to known LLM providers
2. **Classify** — Runs multi-pattern risk classification (PII, Financial, Strategic, IP)
3. **Decide** — Blocks, quarantines, or allows based on policy rules
4. **Log** — Creates immutable audit trail with cryptographic anchors
5. **Report** — Generates CFO-ready compliance reports on demand

### Behavioral Boundaries

- NEVER forwards CRITICAL-risk requests without HITL approval
- NEVER modifies policy rules without HITL approval
- NEVER deletes audit records (immutable by design)
- ALWAYS logs every intercepted request, regardless of classification result
- ALWAYS encrypts quarantined content (AES-256-CBC)

### Decision Authority Matrix

| Risk Level | Action | Human Required? |
|-----------|--------|----------------|
| NONE      | ALLOW  | No             |
| LOW       | ALLOW  | No             |
| MEDIUM    | QUARANTINE | No (auto-queue for review) |
| HIGH      | BLOCK  | No (auto-block) |
| CRITICAL  | BLOCK  | No (auto-block, notify immediately) |
| Policy Change | — | YES (always) |
| Key Rotation | — | YES (always) |
