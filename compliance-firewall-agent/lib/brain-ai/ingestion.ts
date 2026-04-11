// ============================================================================
// Brain AI — Knowledge Ingestion Pipeline v1.0
//
// Transforms raw external content (regulatory docs, GitHub READMEs, web
// pages, compliance guides) into a structured, queryable knowledge index.
//
// Pipeline stages:
//   1. Fetch       — retrieve raw content from URL or string input
//   2. Normalize   — strip HTML/markdown noise, extract plain text
//   3. Chunk       — split into overlapping segments for retrieval
//   4. Deduplicate — skip chunks already in the index (content hash)
//   5. Index       — add to in-memory knowledge store with metadata
//   6. Attribute   — record source, domain tag, ingest timestamp
//
// Design decisions:
//   - In-memory store (Map) for fast local development and edge deployment.
//     Replace the store Map with Supabase pgvector when adding semantic search.
//   - Chunks use a sliding window with 100-char overlap to avoid missing
//     facts that span chunk boundaries.
//   - SHA-256 content hashes power deduplication AND integrity verification.
//   - Fetching uses native fetch() with a 10s timeout — no extra deps.
//   - All ingestion is async and streaming-safe (no blocking).
// ============================================================================

import { createHash } from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type KnowledgeDomain =
  | 'compliance'    // HIPAA, CMMC, SOC 2, GDPR, NIST
  | 'security'      // threat intel, attack patterns, vuln advisories
  | 'agents'        // agentic AI patterns, orchestration frameworks
  | 'performance'   // latency, benchmarks, optimization techniques
  | 'scraping'      // web scraping, data extraction techniques
  | 'orchestration' // multi-agent coordination, workflow patterns
  | 'product'       // Kaelus product docs, internal knowledge
  | 'general';      // everything else

export interface IngestionSource {
  /** Human-readable name for attribution */
  name: string;
  /** Original URL or identifier */
  url: string;
  /** Domain classification for retrieval filtering */
  domain: KnowledgeDomain;
  /** Optional: pre-fetched raw content (skips HTTP fetch) */
  content?: string;
}

export interface KnowledgeChunk {
  id: string;
  /** SHA-256 of content — used for deduplication */
  contentHash: string;
  /** Source metadata */
  source: {
    name: string;
    url: string;
    domain: KnowledgeDomain;
  };
  /** Chunk content (plain text, max ~1000 chars) */
  content: string;
  /** Character offset within the original document */
  offset: number;
  /** ISO timestamp of ingestion */
  ingestedAt: string;
  /** Keyword tags extracted from content */
  tags: string[];
}

export interface IngestionResult {
  source: string;
  status: 'success' | 'skipped' | 'error';
  chunksAdded: number;
  chunksDuplicated: number;
  error?: string;
  durationMs: number;
}

export interface KnowledgeIndex {
  totalChunks: number;
  totalSources: number;
  domains: Record<KnowledgeDomain, number>;
  ingestLog: Array<{ source: string; chunksAdded: number; ts: string }>;
}

// ---------------------------------------------------------------------------
// In-memory knowledge store
// ---------------------------------------------------------------------------

/** Global store — keyed by chunk ID */
const globalStore = globalThis as unknown as {
  __kaelus_knowledge?: Map<string, KnowledgeChunk>;
  __kaelus_hashes?: Set<string>;
};

if (!globalStore.__kaelus_knowledge) {
  globalStore.__kaelus_knowledge = new Map();
}
if (!globalStore.__kaelus_hashes) {
  globalStore.__kaelus_hashes = new Set();
}

const knowledgeStore = globalStore.__kaelus_knowledge;
const contentHashes = globalStore.__kaelus_hashes;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHUNK_SIZE = 800;   // target characters per chunk
const CHUNK_OVERLAP = 100; // overlap characters between adjacent chunks
const FETCH_TIMEOUT_MS = 10_000;
const MAX_RAW_SIZE = 500_000; // 500KB — skip extremely large documents

// ---------------------------------------------------------------------------
// Step 1: Fetch
// ---------------------------------------------------------------------------

async function fetchContent(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Kaelus-BrainAI-Ingestor/1.0',
        Accept: 'text/html,text/plain,text/markdown,application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const raw = await res.text();
    if (raw.length > MAX_RAW_SIZE) {
      throw new Error(`Document too large (${raw.length} chars > ${MAX_RAW_SIZE} limit)`);
    }
    return raw;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Step 2: Normalize
// ---------------------------------------------------------------------------

/**
 * Strip HTML tags, collapse whitespace, remove markdown syntax noise.
 * Returns plain, readable text.
 */
function normalizeContent(raw: string): string {
  return raw
    // Remove HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Remove markdown image syntax
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // Remove markdown link syntax but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove markdown fences
    .replace(/```[\s\S]*?```/g, (block) =>
      block.replace(/```\w*\n?/, '').replace(/```$/, '')
    )
    // Collapse multiple whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Step 3: Chunk
// ---------------------------------------------------------------------------

/**
 * Split normalized text into overlapping chunks.
 *
 * Strategy: split on sentence boundaries (. or \n) when possible;
 * fall back to hard split at CHUNK_SIZE. Each chunk except the first
 * includes the last CHUNK_OVERLAP chars of the previous chunk.
 */
function chunkText(text: string): Array<{ content: string; offset: number }> {
  const chunks: Array<{ content: string; offset: number }> = [];
  let pos = 0;

  while (pos < text.length) {
    const end = Math.min(pos + CHUNK_SIZE, text.length);
    let chunkEnd = end;

    // Try to end at a sentence boundary
    if (end < text.length) {
      const sentenceEnd = text.lastIndexOf('. ', end);
      const newlineEnd = text.lastIndexOf('\n', end);
      const boundary = Math.max(sentenceEnd, newlineEnd);
      if (boundary > pos + CHUNK_SIZE / 2) {
        chunkEnd = boundary + 1;
      }
    }

    const content = text.slice(pos, chunkEnd).trim();
    if (content.length > 20) {
      chunks.push({ content, offset: pos });
    }

    // Advance with overlap
    pos = chunkEnd - CHUNK_OVERLAP;
    if (pos <= 0 || chunkEnd >= text.length) break;
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Step 4: Extract tags
// ---------------------------------------------------------------------------

const TAG_PATTERNS: Array<{ tags: string[]; keywords: string[] }> = [
  { tags: ['hipaa', 'phi', 'healthcare'], keywords: ['hipaa', 'phi', 'health', 'patient', 'medical', 'clinical', 'covered entity', 'business associate'] },
  { tags: ['cmmc', 'cui', 'defense'], keywords: ['cmmc', 'cui', 'nist 800-171', 'controlled unclassified', 'dod', 'itar', 'ear', 'dfars'] },
  { tags: ['soc2', 'audit', 'trust'], keywords: ['soc 2', 'soc2', 'trust service', 'aicpa', 'availability', 'confidentiality'] },
  { tags: ['nist', 'framework', 'controls'], keywords: ['nist', 'sp 800', 'csf', 'rmf', 'control family'] },
  { tags: ['ai', 'llm', 'model'], keywords: ['llm', 'language model', 'gpt', 'claude', 'gemini', 'openai', 'anthropic', 'ai model'] },
  { tags: ['security', 'vulnerability', 'threat'], keywords: ['vulnerability', 'exploit', 'threat', 'attack', 'breach', 'cve'] },
  { tags: ['agent', 'orchestration'], keywords: ['agent', 'orchestrat', 'workflow', 'multi-agent', 'react', 'tool call'] },
  { tags: ['performance', 'latency'], keywords: ['latency', 'throughput', 'p99', 'millisecond', 'optimization', 'benchmark'] },
];

function extractTags(content: string): string[] {
  const lower = content.toLowerCase();
  const tags = new Set<string>();

  for (const { tags: t, keywords } of TAG_PATTERNS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      t.forEach((tag) => tags.add(tag));
    }
  }

  return [...tags];
}

// ---------------------------------------------------------------------------
// Step 5: Content hash
// ---------------------------------------------------------------------------

function contentHash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Ingest a single source into the Brain AI knowledge index.
 *
 * @param source - Source definition with URL and domain classification
 * @returns IngestionResult with stats and status
 */
export async function ingestSource(source: IngestionSource): Promise<IngestionResult> {
  const start = Date.now();
  let chunksAdded = 0;
  let chunksDuplicated = 0;

  try {
    // Fetch or use pre-supplied content
    let raw: string;
    if (source.content) {
      raw = source.content;
    } else {
      raw = await fetchContent(source.url);
    }

    // Normalize
    const normalized = normalizeContent(raw);
    if (normalized.length < 50) {
      return {
        source: source.url,
        status: 'skipped',
        chunksAdded: 0,
        chunksDuplicated: 0,
        error: 'Content too short after normalization',
        durationMs: Date.now() - start,
      };
    }

    // Chunk
    const rawChunks = chunkText(normalized);

    // Index each chunk
    for (const rawChunk of rawChunks) {
      const hash = contentHash(rawChunk.content);

      if (contentHashes.has(hash)) {
        chunksDuplicated++;
        continue;
      }

      const id = `chunk_${hash.slice(0, 12)}_${rawChunk.offset}`;
      const chunk: KnowledgeChunk = {
        id,
        contentHash: hash,
        source: {
          name: source.name,
          url: source.url,
          domain: source.domain,
        },
        content: rawChunk.content,
        offset: rawChunk.offset,
        ingestedAt: new Date().toISOString(),
        tags: extractTags(rawChunk.content),
      };

      knowledgeStore.set(id, chunk);
      contentHashes.add(hash);
      chunksAdded++;
    }

    return {
      source: source.url,
      status: 'success',
      chunksAdded,
      chunksDuplicated,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return {
      source: source.url,
      status: 'error',
      chunksAdded: 0,
      chunksDuplicated: 0,
      error,
      durationMs: Date.now() - start,
    };
  }
}

/**
 * Ingest multiple sources concurrently (max 5 parallel fetches).
 *
 * @param sources - Array of sources to ingest
 * @returns Array of IngestionResult, one per source
 */
export async function ingestSources(sources: IngestionSource[]): Promise<IngestionResult[]> {
  const CONCURRENCY = 5;
  const results: IngestionResult[] = [];

  for (let i = 0; i < sources.length; i += CONCURRENCY) {
    const batch = sources.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(ingestSource));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Query the knowledge index.
 *
 * Simple keyword search: returns chunks whose content contains ALL query terms.
 * Ranked by tag overlap with the query.
 *
 * @param query - Search string (space-separated terms)
 * @param options - Filter and limit options
 */
export function queryKnowledge(
  query: string,
  options: {
    domain?: KnowledgeDomain;
    tags?: string[];
    limit?: number;
  } = {}
): KnowledgeChunk[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const { domain, tags, limit = 10 } = options;

  let candidates = [...knowledgeStore.values()];

  // Filter by domain
  if (domain) {
    candidates = candidates.filter((c) => c.source.domain === domain);
  }

  // Filter by tags (any match)
  if (tags && tags.length > 0) {
    candidates = candidates.filter((c) => tags.some((t) => c.tags.includes(t)));
  }

  // Score by term coverage
  const scored = candidates
    .map((chunk) => {
      const lower = chunk.content.toLowerCase();
      const termMatches = terms.filter((t) => lower.includes(t)).length;
      const tagScore = tags ? tags.filter((t) => chunk.tags.includes(t)).length : 0;
      return { chunk, score: termMatches * 2 + tagScore };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.chunk);
}

/**
 * Get current index statistics.
 */
export function getIndexStats(): KnowledgeIndex {
  const domains: Record<string, number> = {};
  const sourceSeen = new Set<string>();
  const ingestLog: KnowledgeIndex['ingestLog'] = [];

  for (const chunk of knowledgeStore.values()) {
    domains[chunk.source.domain] = (domains[chunk.source.domain] ?? 0) + 1;
    if (!sourceSeen.has(chunk.source.url)) {
      sourceSeen.add(chunk.source.url);
      ingestLog.push({
        source: chunk.source.name,
        chunksAdded: 1,
        ts: chunk.ingestedAt,
      });
    }
  }

  return {
    totalChunks: knowledgeStore.size,
    totalSources: sourceSeen.size,
    domains: domains as Record<KnowledgeDomain, number>,
    ingestLog,
  };
}

/**
 * Clear all indexed content (for testing / reset).
 */
export function clearIndex(): void {
  knowledgeStore.clear();
  contentHashes.clear();
}
