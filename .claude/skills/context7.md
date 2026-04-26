# context7 — Up-to-date Library Docs in Context

Injects version-specific, current library documentation directly into Claude's context via MCP, eliminating hallucinated APIs and outdated method signatures.

## Setup

Add to `.claude/mcp.json`:
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

## Usage

Add `use context7` to any prompt involving a library:

```
How do I set up streaming with the Anthropic SDK? use context7
```

```
Show me Next.js 15 App Router middleware syntax use context7
```

## HoundShield Priority Libraries

- `next` — App Router, middleware, route handlers
- `@anthropic-ai/sdk` — Claude API, streaming, tool use
- `@supabase/supabase-js` — auth, RLS, realtime
- `framer-motion` — animation API (avoid deprecated props)
- `jspdf` — PDF generation for C3PAO reports
- `stripe` — webhook construction, subscription management

## Why This Matters

Without context7, Claude uses training-data docs that may be 6-18 months stale. For HoundShield:
- Next.js 15 broke several App Router patterns from v14
- jsPDF v4 has a different API than v2 (which most training data covers)
- Supabase SSR helpers changed significantly in @supabase/ssr v0.5+

## Trigger Phrases

- "use context7" — append to any library question
- `/context7 <library>` — fetch docs for a specific library
