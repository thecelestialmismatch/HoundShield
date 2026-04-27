---
description: Run a CMMC Level 2 compliance check against the current codebase — verifies proxy patterns, audit log integrity, Brain AI accuracy, and generates a readiness score. Use before any C3PAO assessment prep.
---

# /check-compliance

Runs a comprehensive CMMC Level 2 compliance readiness check across the Hound Shield codebase.

## Step 1 — Pattern verification

Verify all 16 CUI detection patterns are present and correct:

```bash
# Count patterns
grep -c 'name:' proxy/patterns/index.ts

# Verify CRITICAL patterns exist
grep -E "CUI|ITAR|SSN|API.key|Private.key" proxy/patterns/index.ts | head -20

# Check NIST control mappings
grep "nist_controls" proxy/patterns/index.ts | wc -l
```

Expected: 16 patterns, all with NIST control mappings.

## Step 2 — Audit log integrity

```bash
# Verify SHA-256 chaining exists in storage layer
grep -n "sha256\|SHA256\|hash\|chain" proxy/storage.ts | head -20

# Verify nothing is transmitted externally
grep -n "fetch\|axios\|http\|send" proxy/storage.ts | grep -v "//\|license"
```

Expected: SHA-256 chaining present, no external transmission of log content.

## Step 3 — Local-only data boundary

```bash
# Scan for any prompt content going external
grep -rn "body.*fetch\|prompt.*external\|content.*transmit" \
  proxy/ compliance-firewall-agent/lib/gateway/ | grep -v "license\|hash\|count"

# Verify webhook only sends metadata, not prompt content
grep -A 10 "webhook" proxy/webhook.ts | grep -v "content\|body\|prompt"
```

Expected: Zero prompt content leaving the network.

## Step 4 — Brain AI accuracy check

```bash
# Run knowledge graph validation
cd compliance-firewall-agent && npx tsx -e "
import { KNOWLEDGE_BASE } from './lib/brain/knowledge-base';
const nodes = KNOWLEDGE_BASE;
const nistNodes = nodes.filter(n => n.source?.includes('NIST'));
const highConf = nodes.filter(n => n.confidence >= 1.0);
console.log('Total nodes:', nodes.length);
console.log('NIST nodes (confidence=1.0):', nistNodes.length);
console.log('High confidence nodes:', highConf.length);
console.log('Domains covered:', [...new Set(nodes.map(n => n.category))].join(', '));
"
```

Expected: 60+ nodes, 13+ NIST domain nodes at confidence=1.0.

## Step 5 — SPRS score calculation

```bash
# Verify SPRS scoring logic exists
grep -n "sprs\|SPRS\|score" compliance-firewall-agent/lib/ -r | grep -v ".d.ts\|node_modules"

# Check NIST 800-171 Rev 2 control weights
grep -n "sprsWeight\|weight" compliance-firewall-agent/lib/brain/knowledge-base.ts | head -20
```

## Step 6 — PDF export capability

```bash
# Verify PDF route exists
ls compliance-firewall-agent/app/api/ | grep -i "pdf\|report\|export"

# Check PDF is not gated behind higher tier than Growth
grep -rn "pdf\|PDF" compliance-firewall-agent/app/api/ | grep "tier\|plan\|price"
```

Expected: PDF export available at Growth tier ($499/mo) or below.

## Step 7 — Build verification

```bash
cd compliance-firewall-agent && npm run build 2>&1 | tail -20
```

Expected: Build passes with 0 errors.

## Step 8 — Report

Generate compliance readiness report:

```
## CMMC Level 2 Readiness Check — [date]

### Detection Engine
- [ ] Pattern count: [n]/16
- [ ] All patterns have NIST mappings: YES/NO
- [ ] Luhn validation on CC patterns: YES/NO

### Audit Log
- [ ] SHA-256 chaining: YES/NO
- [ ] No prompt content external: YES/NO

### Data Boundary
- [ ] All prompt processing local: YES/NO
- [ ] Webhook sends metadata only: YES/NO

### Brain AI
- [ ] Knowledge Graph nodes: [n]/60+
- [ ] NIST domains covered: [n]/14
- [ ] No hallucinated controls: [verified/unverified]

### PDF Export
- [ ] Route exists: YES/NO
- [ ] Available at Growth tier: YES/NO

### Build
- [ ] npm run build passes: YES/NO

**Readiness Score**: [n]/10
**Gaps**: [list any gaps]
**Recommendation**: [ready | fix gaps first]
```

## Guardrails

- This check is READ-ONLY — no modifications to any files
- If gaps found, surface them clearly and stop — do not auto-fix
- SPRS weights must match NIST SP 800-171 Rev 2 official table — verify against csrc.nist.gov
