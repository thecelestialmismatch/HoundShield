---
paths:
  - "compliance-firewall-agent/**"
  - "proxy/**"
  - "brain/**"
---

# HoundShield Stack Reference

```
compliance-firewall-agent/          Next.js 15, React 19, Tailwind, Framer Motion, Recharts
  app/                              App Router (Server Components by default)
  components/landing/               Landing page sections (max 500 lines each)
  lib/gateway/                      Core AI interception proxy engine
  lib/classifier/                   16-pattern CUI/PII/IP/PHI detector
  lib/agent/memory.ts               Memory system — reuse for Brain AI module
  lib/agent/memory-dna.ts           Compressed memory pattern
  lib/brain-ai/knowledge-graph.ts   BM25-indexed knowledge graph (queryable, token-efficient)
  lib/brain-ai/brain-query.ts       Public query interface (ask(), addKnowledge(), marketCheck())
  supabase/migrations/              001-004 locally, 003+004 pending prod push

proxy/                              Node.js HTTPS proxy (the actual product)
  server.ts                         HTTP proxy server
  scanner.ts                        Pattern scanner (COMPLETE — reuse as-is)
  patterns/index.ts                 16 detection patterns (extend, never replace)
  storage.ts, webhook.ts            Audit log + webhook delivery
  license.ts                        License validation (hash only, zero prompt content)

brain/
  research.md                       Append-only research log (human-readable)

.claude/
  agents/                           8 agents (code-reviewer, debugger, test-writer,
                                    security-auditor, compliance-specialist, refactorer,
                                    doc-writer, team-lead)
  skills/                           Skills library (user-invocable)
  hooks/pre-commit.sh               tsc + eslint + npm test gates
  settings.json                     model: claude-sonnet-4-6, autoMemoryEnabled: true
tasks/
  todo.md                           Task queue (Boris Cherny pattern)
  lessons.md                        Self-improvement loop
```

## Key Commands

```bash
cd compliance-firewall-agent
npm run dev          # Start dev server (port 3000)
npm run build        # Must pass before commit
npm test -- --silent # Run test suite
npx tsc --noEmit     # Type check only

npx supabase db push # Push pending migrations to prod

git push origin <branch>  # NEVER push to main directly
```
