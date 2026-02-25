# Compliance Firewall Agent — Memory Management

## Strategy
All persistent knowledge is stored in Supabase tables with cryptographic
seed anchors. The agent does NOT rely on conversational memory.

## Memory Types

### Policy Rules (hot memory)
- Stored in `policy_rules` table
- Loaded on each request (cached per edge function invocation)
- Changes require HITL approval and are seed-anchored

### Compliance Events (append-only log)
- Stored in `compliance_events` table
- Never modified after creation
- Each violation event gets a seed anchor
- Chained via previous_hash for tamper detection

### Seed Anchors (integrity chain)
- Stored in `seed_anchors` table
- Each anchor: SHA-256(content + previous_hash)
- Chain can be verified end-to-end
- Merkle roots computed for batch verification in reports

### Quarantine Queue (ephemeral)
- Items exist only until reviewed
- Encrypted content (AES-256-CBC)
- Auto-expires after configurable timeout

## State Discovery
The agent discovers current state by:
1. Querying the policy_rules table for active rules
2. Reading recent compliance_events for context
3. Checking seed_anchors for integrity verification
4. Scanning hitl_approvals for pending decisions
