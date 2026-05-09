---
name: firecrawl-ingest
description: Structured web scraping for Brain AI knowledge ingestion. Use to scrape CMMC documentation, competitor pages, market research, and regulatory updates into LLM-ready markdown for the Brain AI knowledge graph.
user-invocable: true
---

# Firecrawl Ingest Skill

Scrape and structure web content for Brain AI ingestion.
Built on: https://github.com/firecrawl/firecrawl

## When to Use

- Ingesting CMMC framework documentation into Brain AI
- Scraping competitor feature pages for competitive intelligence
- Pulling regulatory updates (DFARS, NIST 800-171 revisions)
- Building the Brain AI knowledge graph with fresh external data
- Any structured data extraction from public web sources

## Setup

```bash
# Install Firecrawl MCP server for Claude Code integration
npx @firecrawl/mcp-server
```

Or use via API:
```bash
npm install firecrawl-js
export FIRECRAWL_API_KEY=your_key_here
```

## Core Usage Patterns

### Scrape a single page to markdown
```typescript
import FirecrawlApp from 'firecrawl-js';

const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
const result = await app.scrapeUrl('https://example.com', {
  formats: ['markdown'],
});
console.log(result.markdown);
```

### Crawl an entire site (e.g. NIST documentation)
```typescript
const crawlResult = await app.crawlUrl('https://csrc.nist.gov/publications/detail/sp/800-171/rev-2/final', {
  limit: 50,
  scrapeOptions: { formats: ['markdown'] }
});
```

### Extract structured data with a schema
```typescript
const result = await app.scrapeUrl('https://nightfall.ai/pricing', {
  formats: ['extract'],
  extract: {
    schema: {
      type: 'object',
      properties: {
        plans: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, price: { type: 'string' }, features: { type: 'array', items: { type: 'string' } } } } }
      }
    }
  }
});
```

## HoundShield Brain AI Ingestion Targets

### Priority 1: Regulatory Sources

```bash
# CMMC Level 2 official requirements
firecrawl scrape https://www.dodcmmc.mil/cmmc-model/level-2

# NIST 800-171 Rev 2 all controls
firecrawl crawl https://csrc.nist.gov/publications/detail/sp/800-171/rev-2/final --limit 100

# DFARS 7012 clause text
firecrawl scrape https://www.acquisition.gov/dfars/252.204-7012
```

### Priority 2: Competitor Intelligence

```bash
# Nightfall DLP pricing and features
firecrawl scrape https://www.nightfall.ai/pricing
firecrawl scrape https://www.nightfall.ai/features

# Strac features
firecrawl scrape https://www.strac.io/features

# Cyberhaven
firecrawl scrape https://www.cyberhaven.com/product
```

### Priority 3: Market Validation

```bash
# CMMC-AB marketplace (C3PAO directory)
firecrawl scrape https://marketplace.cmmcab.org

# DoD CMMC enforcement timeline
firecrawl scrape https://www.dodcmmc.mil/news
```

## Brain AI Integration

After scraping, ingest into the knowledge graph:

```typescript
// brain/ingest.ts
import { knowledgeGraph } from './knowledge-graph';

async function ingestFromFirecrawl(url: string, domain: string) {
  const content = await firecrawlScrape(url);
  await knowledgeGraph.addNode({
    domain,
    content: content.markdown,
    source: url,
    timestamp: Date.now(),
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}
```

## Environment Variables
- `FIRECRAWL_API_KEY`: Required for firecrawl-js SDK
- `FIRECRAWL_MCP_ENABLED`: Set to `true` to enable MCP server integration
