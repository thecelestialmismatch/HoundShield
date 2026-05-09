# claude-mem — Persistent Memory Across Sessions

Structured memory system for preserving decisions, patterns, and context between Claude Code sessions.

## Memory Tiers

### Tier 1 — Project Memory (CLAUDE.md)
Permanent project facts. Lives in repo. Never grows beyond 100 lines.
- Product mission, buyer persona, sprint goal
- Design system rules, critical gotchas
- Pointers to detailed rules in `.claude/rules/`

### Tier 2 — Session Lessons (tasks/lessons.md)
Dated log of decisions and corrections. Append-only.
```markdown
## 2026-04-25
**What:** PDF returned 503 in demo mode
**Root cause:** Auth check ran before Supabase-configured guard
**Rule:** Always wrap auth checks in `if (isSupabaseConfigured())`
```

### Tier 3 — Brain AI (lib/brain-ai/knowledge-graph.ts)
Queryable BM25 knowledge graph. TTL-aware. Best for:
- Competitor pricing (ttl: 7 days)
- CMMC regulatory facts (permanent, ttl: 0)
- Jordan persona data
- Market intelligence from firecrawl ingestion

### Tier 4 — Memory DNA (lib/agent/memory-dna.ts)
Compressed in-session state. ~10x token reduction for long conversations.

## Memory Write Protocol

When Claude makes a significant decision:
1. If it's a one-time correction → `tasks/lessons.md`
2. If it's a permanent project fact → `CLAUDE.md` (keep under 100 lines)
3. If it's queryable knowledge → `addKnowledge()` in brain-query.ts
4. If it's a rule for a file class → `.claude/rules/<domain>.md`

## Query Pattern

Before starting any task, Claude should check:
```bash
# What do we know about this domain?
GET /api/brain/query?q=<topic>

# What have we learned from past mistakes?
grep -i "<topic>" tasks/lessons.md
```

## HoundShield Memory Index

| Topic | Location |
|-------|----------|
| CMMC controls | `lib/brain/knowledge-base.ts` + brain-ai graph |
| Competitor pricing | brain-ai graph (stale after 7d) |
| Jordan persona | `lib/brain/knowledge-base.ts` |
| Design decisions | `tasks/lessons.md` |
| Sprint state | `tasks/todo.md` |
| API rules | `.claude/rules/api.md` |
| Stack layout | `.claude/rules/stack.md` |
