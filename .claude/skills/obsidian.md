# obsidian — Second Brain for HoundShield Research

Obsidian vault management as structured knowledge base. Maps to HoundShield's brain/ directory and research workflow.

## Vault Structure → HoundShield Mapping

```
vault/
  00-inbox/           → brain/research.md (raw notes, append-only)
  10-projects/        → tasks/todo.md + tasks/lessons.md
  20-knowledge/
    cmmc/             → lib/brain-ai/ knowledge graph (CMMC domain)
    competitors/      → lib/brain-ai/ knowledge graph (competitor domain)
    market/           → lib/brain-ai/ knowledge graph (market domain)
  30-resources/       → docs/ (PRD, architecture, playbooks)
```

## Core Workflow

### Research → Brain AI Pipeline
1. Drop raw research into `brain/research.md` (append-only)
2. Run `/firecrawl-ingest <url>` to scrape structured competitor/CMMC data
3. `addKnowledge()` ingests into the BM25 graph with TTL
4. `/api/brain/query?q=<question>` queries the combined graph

### Atomic Notes → Knowledge Graph Nodes
Each Obsidian note maps to a `KnowledgeGraphNode`:
```typescript
{
  id: "cmmc-ac-l2-3.1.3",
  domain: "cmmc",
  title: "AC.L2-3.1.3 — Control CUI Flow",
  content: "...",
  keywords: ["CUI", "flow control", "DFARS 7012"],
  ttl: 0,  // permanent — regulatory fact
  weight: 1.5
}
```

### Link Syntax → Brain Query
Obsidian `[[wikilinks]]` pattern maps to brain query chains:
```typescript
// [[DFARS-7012]] in a note = ask("DFARS 7012")
const related = await ask("DFARS 7012 compliance requirement");
```

## HoundShield Research Templates

### Competitor Analysis Note
```markdown
---
domain: competitor
ttl: 7
---
# [Company Name]
**Pricing:** $X/mo
**Architecture:** cloud-only / on-prem / hybrid
**CMMC gap:** [what they can't do that HoundShield can]
**Sales counter:** "[exact sentence]"
```

### CMMC Control Note
```markdown
---
domain: cmmc
ttl: 0
control: AC.L2-3.1.3
---
# [Control Title]
**Requirement:** [exact NIST 800-171 text]
**HoundShield implementation:** [how proxy satisfies this]
**Evidence for C3PAO:** [what to show the assessor]
```

## Trigger: `/obsidian <note-type>`

Generates a structured research note in the correct template format.
