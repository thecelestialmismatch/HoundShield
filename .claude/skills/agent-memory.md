---
name: agent-memory
description: Use when implementing persistent memory for AI agents across sessions. Covers Anthropic Managed Memory (beta API), filesystem-backed memory stores, session creation with resources, and memory versioning patterns. Use when building agents that need to remember context across conversations.
---

# Agent Memory — Persistent Memory Stores

## Overview

Two patterns for giving AI agents persistent memory:

1. **Anthropic Managed Memory** (beta) — server-side memory stores via API
2. **Filesystem-backed Memory** — local markdown files (current Hound Shield pattern)

---

## Pattern 1: Anthropic Managed Memory (Beta API)

Managed memory stores persist across sessions server-side. Agent can read/write structured facts without reloading full context.

### Setup

```python
import anthropic

client = anthropic.Anthropic()

# Create a memory store (once, store the ID)
memory_store = client.beta.memory_stores.create(
    name="houndshield-compliance-knowledge",
    description="CMMC, NIST 800-171, and security knowledge for Brain AI"
)
memory_store_id = memory_store.id  # persist this
```

### Create Session with Memory

```python
session = client.beta.sessions.create(
    resources=[{
        "type": "memory_store",
        "memory_store_id": memory_store_id
    }]
)
session_id = session.id
```

### Use Memory in Conversation

```python
response = client.beta.messages.create(
    model="claude-opus-4-7",
    max_tokens=1024,
    session_id=session_id,
    messages=[
        {"role": "user", "content": "What CMMC controls does our proxy satisfy?"}
    ]
)
```

### Add Facts to Memory

```python
# Write structured facts into the memory store
client.beta.memory_stores.documents.create(
    memory_store_id=memory_store_id,
    title="CMMC Level 2 Controls Satisfied",
    content="""
    HoundShield proxy satisfies:
    - AC.L2-3.1.3: CUI marking detection blocks unauthorized exfiltration
    - AU.L2-3.3.1: SHA-256 chained audit log provides non-repudiation
    - SC.L2-3.13.1: No prompt content leaves customer network
    - IA.L2-3.5.3: API key and credential detection and blocking
    """,
    metadata={"category": "compliance", "framework": "cmmc", "version": "2.0"}
)
```

### Limits

- Memory store: 100KB per document, versioned snapshots
- Session: 30-day TTL by default
- Memory is mounted at session creation — facts added after session start appear in next session

---

## Pattern 2: Filesystem-Backed Memory (Current Hound Shield Pattern)

All persistent memory lives in `memory/*.md` and `primer.md`. Claude reads these at session start.

### File Structure

```
~/.claude/
  primer.md                    — Active project state (100 lines max)
  projects/<project-id>/
    memory/
      MEMORY.md                — Index of all memory files
      user.md                  — Who the user is, expertise, style
      decisions.md             — Architectural decisions (WHY)
      preferences.md           — Workflow preferences
      feedback.md              — What to do / NOT do
      people.md                — Stakeholders
      compliance-domain.md     — CMMC, NIST 800-171, SPRS rules
      project.md               — Current state, phase, revenue targets
```

### Read Pattern (Session Start)

```markdown
On session start:
1. Read primer.md — active project state
2. Read memory/MEMORY.md — find relevant files
3. Read memory/decisions.md — architectural context
4. Read memory/compliance-domain.md — domain knowledge
5. Read tasks/todo.md — current sprint
```

### Write Pattern (Session End)

```markdown
On session end:
1. Update primer.md — active project, completed, next step, blockers
2. Update memory/decisions.md if new decisions made
3. Update memory/preferences.md if feedback received
4. Create .claude-session-state.md at project root if complex state
```

### Hound Shield Memory Files

```
compliance-firewall-agent/
  tasks/
    todo.md          — Sprint tasks (ACTIVE / DONE)
    lessons.md       — Dated corrections and learnings
  memory/
    MEMORY.md        — Index
    user.md          — Founder profile
    decisions.md     — Architecture decisions
    project.md       — State, phase, MRR targets
    compliance-domain.md — CMMC domain rules
```

---

## Pattern 3: KnowledgeGraph (Brain AI v3)

For CMMC-specific knowledge, Hound Shield uses a queryable knowledge graph:

```typescript
// lib/brain/knowledge-base.ts
import { queryKnowledge } from "@/lib/brain";

const result = await queryKnowledge({
  query: "What NIST controls does AC.L2-3.1.3 cover?",
  framework: "cmmc",
  maxNodes: 5
});
// Returns: { nodes, answer, confidence, sources }
```

Knowledge graph lives in `lib/brain/knowledge-base.ts` — 60+ nodes covering all 14 NIST 800-171 Rev 2 domains.

---

## Choosing the Right Pattern

| Use case | Pattern |
|---|---|
| Session continuity within a project | Filesystem (primer.md + memory/) |
| CMMC/compliance Q&A | KnowledgeGraph (lib/brain/) |
| Multi-session agent with durable facts | Anthropic Managed Memory (beta) |
| Cross-device memory | Anthropic Managed Memory (beta) |
| Local-only (CMMC compliance) | Filesystem only — never send prompts to external |

**CRITICAL**: Brain AI processes data locally. Memory stores via Anthropic API send content to Anthropic servers. Only use Anthropic Managed Memory for non-CUI data (agent instructions, general knowledge, not customer prompts).
