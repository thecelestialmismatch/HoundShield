// ============================================================================
// Brain AI — Knowledge Ingestion API
//
// POST /api/brain-ai/ingest
//   Ingests one or more knowledge sources into the Brain AI index.
//   Supports URL-based fetch or inline content ingestion.
//
// GET /api/brain-ai/ingest
//   Returns current index statistics (source count, chunk count, domains).
//
// WHAT THIS REPLACES. Both verbs were unauthenticated and live in production.
// POST fetched caller-supplied URLs from inside the Vercel function — a
// server-side request forgery — and stored what came back in the knowledge
// index, which GET then read out again. That pairing is what made it serious:
// not a blind SSRF but one with an exfiltration channel bolted on, so anything
// the function could reach, a stranger could read. Twenty URLs per request,
// unmetered.
//
// Two bounds now apply. The address is judged by lib/net/safe-fetch.ts, which
// resolves the hostname and refuses private and reserved ranges (see that file
// for why a hostname regex does not work). Reachability is bounded here: a
// session is required, and the fetching verb is metered on the LLM bucket
// because it is the one that spends.
// ============================================================================

import { NextRequest } from 'next/server';
import {
  ingestSource,
  ingestSources,
  getIndexStats,
  queryKnowledge,
  type IngestionSource,
  type KnowledgeDomain,
} from '@/lib/brain-ai/ingestion';
import { guardBrainAi } from '@/lib/brain-ai/route-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const VALID_DOMAINS: KnowledgeDomain[] = [
  'compliance', 'security', 'agents', 'performance',
  'scraping', 'orchestration', 'product', 'general',
];

// ---------------------------------------------------------------------------
// POST — ingest sources
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // 'llm' tier: this verb makes outbound requests and grows the index, so it
  // is metered on the spending bucket rather than the read one.
  const { blocked } = await guardBrainAi(req, 'llm');
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Normalize: accept single source or array
  const sources: unknown[] = Array.isArray(body) ? body : [body];

  if (sources.length === 0) {
    return Response.json({ error: 'No sources provided' }, { status: 400 });
  }

  if (sources.length > 20) {
    return Response.json({ error: 'Maximum 20 sources per request' }, { status: 400 });
  }

  // Validate each source
  const validated: IngestionSource[] = [];
  for (let i = 0; i < sources.length; i++) {
    const s = sources[i] as Record<string, unknown>;

    if (!s.name || typeof s.name !== 'string') {
      return Response.json({ error: `sources[${i}].name is required` }, { status: 400 });
    }
    if (!s.url || typeof s.url !== 'string') {
      return Response.json({ error: `sources[${i}].url is required` }, { status: 400 });
    }
    if (!s.domain || !VALID_DOMAINS.includes(s.domain as KnowledgeDomain)) {
      return Response.json({
        error: `sources[${i}].domain must be one of: ${VALID_DOMAINS.join(', ')}`,
      }, { status: 400 });
    }

    validated.push({
      name: s.name as string,
      url: s.url as string,
      domain: s.domain as KnowledgeDomain,
      content: typeof s.content === 'string' ? s.content : undefined,
    });
  }

  // Ingest — single vs. batch
  const results = validated.length === 1
    ? [await ingestSource(validated[0])]
    : await ingestSources(validated);

  const totalAdded = results.reduce((s, r) => s + r.chunksAdded, 0);
  const totalDuplicated = results.reduce((s, r) => s + r.chunksDuplicated, 0);
  const errors = results.filter((r) => r.status === 'error');

  return Response.json({
    success: errors.length < results.length,
    summary: {
      sourcesProcessed: results.length,
      chunksAdded: totalAdded,
      chunksDuplicated: totalDuplicated,
      errors: errors.length,
    },
    results,
    indexStats: getIndexStats(),
  });
}

// ---------------------------------------------------------------------------
// GET — index statistics + optional search
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  // Read-only, but still gated: this is the read-back half of the pair above,
  // and it is what turned the SSRF into an exfiltration channel.
  const { blocked } = await guardBrainAi(req, 'read');
  if (blocked) return blocked;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const domain = searchParams.get('domain') as KnowledgeDomain | null;
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 50);

  const stats = getIndexStats();

  if (q) {
    const chunks = queryKnowledge(q, {
      domain: domain ?? undefined,
      limit,
    });

    return Response.json({
      query: q,
      domain: domain ?? 'all',
      results: chunks.map((c) => ({
        id: c.id,
        content: c.content,
        source: c.source,
        tags: c.tags,
        ingestedAt: c.ingestedAt,
      })),
      total: chunks.length,
      indexStats: stats,
    });
  }

  return Response.json({ indexStats: stats });
}
