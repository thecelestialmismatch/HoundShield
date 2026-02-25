# Compliance Firewall Agent — Available Tools

## Interception
- **Request Parser** — Extracts prompt content from OpenAI, Anthropic, Google, and generic LLM API formats
- **Provider Detector** — Identifies target LLM provider from URL patterns

## Classification
- **Risk Engine** — Multi-stage regex-based classifier for PII, Financial, Strategic, and IP data
- **Obfuscation Decoder** — Detects and decodes base64/hex-encoded payloads to prevent bypass
- **Pattern Library** — 16 built-in detection patterns, extensible via policy_rules table

## Security
- **AES-256-CBC Encryption** — Encrypts quarantined prompt content
- **SHA-256 Seed Anchors** — Creates tamper-evident integrity chain for audit records
- **Merkle Tree Verification** — Batch-verifies audit trail integrity

## Storage
- **Supabase Client** — Server-side (service role) and client-side (anon) database access
- **Compliance Event Logger** — Writes events with automatic seed anchoring
- **Quarantine Handler** — Encrypts and queues flagged requests for review

## Governance
- **HITL Approval Gate** — Blocks destructive operations until human approval
- **Notification Dispatcher** — Sends Slack alerts for approval requests and critical events
- **Report Generator** — Creates aggregated compliance reports with integrity proofs
