---
name: dreams
description: Run a Claude Dreams memory consolidation job on the HoundShield knowledge graph. Merges duplicates, removes stale entries, converts relative dates to ISO-8601. Use after 20+ ingestion sessions or when brain answers become inconsistent.
user-invocable: true
---

# Claude Dreams — HoundShield Knowledge Consolidation

Run automated memory consolidation on the HoundShield BM25 knowledge graph using Claude Dreams (Managed Agents research preview).

## What it does
- Merges duplicate nodes across all 9 domains (cmmc, nist, hipaa, soc2, competitor, market, architecture, pricing, customer)
- Resolves contradictions by keeping the most recently updated fact
- Converts every relative date ("yesterday", "last week") to absolute ISO-8601
- Surfaces cross-session patterns not visible in any single session
- Outputs a NEW separate memory store — the live graph is never modified until you promote

## When to run
- After 20+ ingestion sessions
- Weekly on long-running workflows
- When brain query answers become inconsistent or contradictory
- Before a major product phase transition

## Run via Claude Code (TUI)

```
Start a Claude Dreams consolidation job on the HoundShield knowledge graph.

Use this Python script exactly as written (fill in your INGEST_API_KEY):

import requests, time

BASE = "http://localhost:3000"
HEADERS = {"x-ingest-key": "YOUR_INGEST_API_KEY", "Content-Type": "application/json"}

# Start the dream
resp = requests.post(f"{BASE}/api/brain/dreams", headers=HEADERS, json={})
resp.raise_for_status()
data = resp.json()["data"]
dream_id = data["dreamId"]
print(f"Dream started: {dream_id}  status: {data['status']}")
print(f"Nodes submitted: {data['nodeCount']}")

# Poll until done
while True:
    r = requests.get(f"{BASE}/api/brain/dreams?id={dream_id}", headers=HEADERS)
    result = r.json()["data"]
    print(f"  status: {result['status']}")
    if result["status"] not in ("pending", "running"):
        break
    time.sleep(15)

if result["status"] == "succeeded":
    print(f"Output store: {result['outputStoreId']}")
    print(f"Nodes consolidated: {result.get('nodeCount', '?')}")
    print(result["summary"])
    
    # Promote to live graph
    promo = requests.post(f"{BASE}/api/brain/dreams", headers=HEADERS, json={
        "action": "promote",
        "dreamId": dream_id,
        "outputStoreId": result["outputStoreId"],
    })
    print(promo.json())
else:
    print(f"Dream failed: {result.get('error', 'unknown')}")

Tell me when it finishes.
```

## Run via API directly

```bash
# Start dream (production auth via session cookie)
curl -X POST https://houndshield.com/api/brain/dreams \
  -H "x-ingest-key: $INGEST_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"instructions": "Merge duplicates. Remove stale. Convert all dates to ISO-8601."}'

# Poll
curl "https://houndshield.com/api/brain/dreams?id=drm_01..." \
  -H "x-ingest-key: $INGEST_API_KEY"

# Promote output to live graph
curl -X POST https://houndshield.com/api/brain/dreams \
  -H "x-ingest-key: $INGEST_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "promote", "dreamId": "drm_01...", "outputStoreId": "memstore_01..."}'
```

## Rate limit
3 dream jobs per hour per IP. Dreams are expensive — run deliberately.

## Required env vars
- `ANTHROPIC_API_KEY` — required for real dreams (without it, demo mode returns mock)
- `INGEST_API_KEY` — auth header for demo/local mode

## Supported models
- `claude-opus-4-7` (default — best consolidation quality)
- `claude-sonnet-4-6` (faster, lower cost)

## Beta status
Research preview. Anthropic may ship breaking changes (≥1 week notice before GA).
Access: claude.com/form/claude-managed-agents
