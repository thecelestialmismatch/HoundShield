/**
 * Claude Dreams — Automated memory consolidation for the HoundShield knowledge graph.
 *
 * Bridges HoundShield's in-memory BM25 KnowledgeGraph to Anthropic's Dreams API:
 *   1. Serialize KnowledgeNodes → memory store documents
 *   2. Create a temporary memory store via Managed Agents API
 *   3. Start a Dreams job to consolidate: deduplicate, resolve contradictions,
 *      normalize all relative dates to ISO-8601
 *   4. Parse the output memory store back into KnowledgeNodes
 *   5. Caller decides whether to promote the output to replace the live graph
 *
 * Beta headers required: managed-agents-2026-04-01, dreaming-2026-04-21
 * Models: claude-opus-4-7 or claude-sonnet-4-6
 */

import Anthropic from "@anthropic-ai/sdk";
import type { KnowledgeNode, KnowledgeDomain } from "./knowledge-graph";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DREAMS_BETAS: [string, string] = [
  "managed-agents-2026-04-01",
  "dreaming-2026-04-21",
];

export const DREAMS_MODEL = "claude-opus-4-7";

// ---------------------------------------------------------------------------
// Pure (fully testable) functions — no API calls
// ---------------------------------------------------------------------------

/** Serialize a KnowledgeNode into a text document for a memory store. */
export function nodeToMemoryContent(node: KnowledgeNode): string {
  const createdAt = new Date(node.createdAt).toISOString();
  const updatedAt = new Date(node.updatedAt).toISOString();
  const ttlDesc = node.ttl === 0 ? "permanent" : `expires after ${node.ttl / 86400000}d`;
  return [
    `DOMAIN: ${node.domain}`,
    `TITLE: ${node.title}`,
    `SOURCE: ${node.source} (${node.sourceType})`,
    `CREATED: ${createdAt}`,
    `UPDATED: ${updatedAt}`,
    `TTL: ${ttlDesc}`,
    `WEIGHT: ${node.weight}`,
    `KEYWORDS: ${node.keywords.join(", ")}`,
    ``,
    node.content,
  ].join("\n");
}

/** Deserialize a memory store document back into a partial KnowledgeNode. */
export function parseMemoryContent(content: string): Partial<KnowledgeNode> & { title: string; domain: KnowledgeDomain } {
  const lines = content.split("\n");
  const get = (prefix: string) =>
    lines.find(l => l.startsWith(`${prefix}: `))?.slice(prefix.length + 2).trim() ?? "";

  const domain = (get("DOMAIN") || "market") as KnowledgeDomain;
  const title = get("TITLE") || "Untitled";
  const source = get("SOURCE").split(" (")[0] ?? "dreams";
  const sourceType = (get("SOURCE").match(/\((.+)\)/)?.[1] ?? "manual") as KnowledgeNode["sourceType"];
  const keywords = get("KEYWORDS").split(", ").filter(Boolean);
  const ttlRaw = get("TTL");
  const ttlDays = ttlRaw.match(/(\d+)d/)?.[1];
  const ttl = ttlRaw === "permanent" ? 0 : ttlDays ? parseInt(ttlDays) * 86400000 : 0;
  const weight = parseFloat(get("WEIGHT") || "0.8");

  // Body is everything after the blank line
  const bodyStart = lines.findIndex(l => l.trim() === "") + 1;
  const bodyText = lines.slice(bodyStart).join("\n").trim();

  return { domain, title, source, sourceType, keywords, ttl, weight, content: bodyText };
}

/** Default consolidation instructions for a HoundShield knowledge graph dream. */
export function defaultInstructions(): string {
  return [
    "You are consolidating a HoundShield compliance AI knowledge graph.",
    "Rules:",
    "1. MERGE duplicate nodes about the same topic into one authoritative entry.",
    "2. RESOLVE contradictions by keeping the most recently updated fact.",
    "3. REMOVE entries that are demonstrably stale or superseded.",
    "4. CONVERT every relative date ('yesterday', 'last week', 'next month') to an",
    "   absolute ISO-8601 date using the document's UPDATED timestamp as anchor.",
    "5. PRESERVE all DOMAIN, TITLE, SOURCE, CREATED, UPDATED, TTL, WEIGHT, KEYWORDS",
    "   header lines in the exact same format — output must be parseable.",
    "6. Do NOT remove regulatory facts (domain: cmmc, nist, hipaa, soc2) unless",
    "   explicitly superseded by a newer entry in the same domain.",
    "7. Surface any cross-session patterns not visible within a single session.",
  ].join("\n");
}

/** Build a human-readable summary of a completed dream job. */
export function buildDreamSummary(result: DreamResult): string {
  if (result.status === "failed") {
    return `Dream ${result.dreamId} failed: ${result.error ?? "unknown error"}`;
  }
  if (result.status !== "succeeded") {
    return `Dream ${result.dreamId} is ${result.status}`;
  }
  return [
    `Dream ${result.dreamId} succeeded.`,
    `Output store: ${result.outputStoreId}`,
    `Nodes consolidated: ${result.nodeCount ?? "unknown"}`,
    `To promote: POST /api/brain/dreams with action=promote and dreamId=${result.dreamId}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DreamResult {
  dreamId: string;
  status: "pending" | "running" | "succeeded" | "failed";
  outputStoreId?: string;
  nodeCount?: number;
  error?: string;
}

export interface StartDreamOptions {
  sessionIds?: string[];
  instructions?: string;
  model?: string;
}

// ---------------------------------------------------------------------------
// Dreams service — wraps Anthropic beta APIs
// ---------------------------------------------------------------------------

export class DreamsService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
  }

  /**
   * Create a memory store from the current knowledge graph nodes,
   * then start a Dreams consolidation job.
   * Returns the dream ID immediately — poll with pollDream().
   */
  async startDream(nodes: KnowledgeNode[], opts: StartDreamOptions = {}): Promise<DreamResult> {
    if (!process.env.ANTHROPIC_API_KEY) {
      // Demo mode — return a mock in-progress dream
      return {
        dreamId: `drm_demo_${Date.now()}`,
        status: "pending",
      };
    }

    // 1. Create a temporary memory store to hold the current graph
    const store = await this.client.beta.memoryStores.create(
      { name: `houndshield-graph-${Date.now()}`, description: "HoundShield knowledge graph snapshot" },
      { headers: { "anthropic-beta": DREAMS_BETAS.join(",") } }
    );

    // 2. Populate the store with serialized nodes (in parallel, batched)
    const BATCH = 10;
    for (let i = 0; i < nodes.length; i += BATCH) {
      await Promise.all(
        nodes.slice(i, i + BATCH).map(node =>
          this.client.beta.memoryStores.memories.create(
            store.id,
            { content: nodeToMemoryContent(node) },
            { headers: { "anthropic-beta": DREAMS_BETAS.join(",") } }
          )
        )
      );
    }

    // 3. Build dream inputs
    const inputs: Array<{ type: string; memory_store_id?: string; session_ids?: string[] }> = [
      { type: "memory_store", memory_store_id: store.id },
    ];
    if (opts.sessionIds && opts.sessionIds.length > 0) {
      inputs.push({ type: "sessions", session_ids: opts.sessionIds.slice(0, 100) });
    }

    // 4. Start the dream job
    const dream = await this.client.beta.dreams.create(
      {
        inputs,
        model: opts.model ?? DREAMS_MODEL,
        instructions: opts.instructions ?? defaultInstructions(),
      },
      { headers: { "anthropic-beta": DREAMS_BETAS.join(",") } }
    );

    return { dreamId: dream.id, status: dream.status };
  }

  /** Poll a dream job by ID. Returns current status + output store ID when done. */
  async pollDream(dreamId: string): Promise<DreamResult> {
    if (dreamId.startsWith("drm_demo_")) {
      return { dreamId, status: "succeeded", outputStoreId: "memstore_demo", nodeCount: 0 };
    }

    const dream = await this.client.beta.dreams.retrieve(
      dreamId,
      { headers: { "anthropic-beta": DREAMS_BETAS.join(",") } }
    );

    const result: DreamResult = { dreamId: dream.id, status: dream.status };

    if (dream.status === "succeeded" && dream.outputs?.[0]?.memory_store_id) {
      result.outputStoreId = dream.outputs[0].memory_store_id;

      // Count nodes in output store
      try {
        const memories = await this.client.beta.memoryStores.memories.list(
          result.outputStoreId,
          { headers: { "anthropic-beta": DREAMS_BETAS.join(",") } }
        );
        result.nodeCount = memories.data?.length ?? 0;
      } catch {
        // non-critical
      }
    }

    if (dream.status === "failed") {
      result.error = dream.error ?? "Dream failed with no error message";
    }

    return result;
  }

  /**
   * Read the output memory store and return parsed KnowledgeNode partials.
   * Caller decides whether to merge into the live graph.
   */
  async importOutputStore(outputStoreId: string): Promise<Array<Partial<KnowledgeNode> & { title: string; domain: KnowledgeDomain }>> {
    if (outputStoreId === "memstore_demo") return [];

    const memories = await this.client.beta.memoryStores.memories.list(
      outputStoreId,
      { headers: { "anthropic-beta": DREAMS_BETAS.join(",") } }
    );

    return (memories.data ?? [])
      .map((m: { content?: string }) => {
        try {
          return parseMemoryContent(m.content ?? "");
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _service: DreamsService | null = null;
export function getDreamsService(): DreamsService {
  if (!_service) _service = new DreamsService();
  return _service;
}
