/**
 * houndshield Brain AI — Firecrawl Knowledge Updater
 *
 * Uses Firecrawl to automatically update the knowledge graph with:
 * - NIST 800-171 / CMMC regulatory changes
 * - Competitor pricing and feature updates
 * - Market intelligence (enforcement timelines, assessor capacity)
 *
 * Architecture: runs as a background job (cron or manual trigger).
 * No prompt content is ever sent to Firecrawl — only public URLs.
 */

import { KnowledgeGraph, upsertNode, KGNode } from "./knowledge-graph";

interface FirecrawlScrapeResult {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: { title?: string; description?: string };
  };
  error?: string;
}

interface UpdateTarget {
  id: string;
  url: string;
  category: KGNode["category"];
  title: string;
  extractionPrompt: string;
}

const UPDATE_TARGETS: UpdateTarget[] = [
  {
    id: "competitor-nightfall",
    url: "https://www.nightfall.ai/pricing",
    category: "competitor",
    title: "Nightfall AI — Competitor Analysis",
    extractionPrompt: "Extract current pricing tiers and any AI DLP specific features",
  },
  {
    id: "market-cmmc-enforcement",
    url: "https://www.acq.osd.mil/cmmc/",
    category: "market",
    title: "CMMC Enforcement Timeline",
    extractionPrompt: "Extract current enforcement phase dates and contractor requirements",
  },
];

/**
 * Scrape a single URL via Firecrawl API.
 * Only sends the URL — no customer data, no prompt content.
 */
async function scrapeUrl(url: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 10000,
      }),
    });

    if (!response.ok) return null;

    const result: FirecrawlScrapeResult = await response.json() as FirecrawlScrapeResult;
    return result.data?.markdown ?? null;
  } catch {
    return null;
  }
}

/**
 * Run a knowledge graph update cycle.
 * Safe to call in a cron job — idempotent.
 */
export async function runKnowledgeUpdate(
  graph: KnowledgeGraph,
  options: {
    firecrawlApiKey?: string;
    targets?: string[]; // specific node IDs to update, or all if omitted
    dryRun?: boolean;
  } = {}
): Promise<{ graph: KnowledgeGraph; updatedNodes: string[]; errors: string[] }> {
  const { firecrawlApiKey, targets, dryRun = false } = options;

  if (!firecrawlApiKey) {
    return {
      graph,
      updatedNodes: [],
      errors: ["FIRECRAWL_API_KEY not configured — skipping knowledge update"],
    };
  }

  const updatedNodes: string[] = [];
  const errors: string[] = [];
  let currentGraph = graph;

  const targetsToUpdate = targets
    ? UPDATE_TARGETS.filter((t) => targets.includes(t.id))
    : UPDATE_TARGETS;

  for (const target of targetsToUpdate) {
    const content = await scrapeUrl(target.url, firecrawlApiKey);
    if (!content) {
      errors.push(`Failed to scrape ${target.url}`);
      continue;
    }

    // Truncate to reasonable size for storage
    const truncated = content.slice(0, 2000);

    if (!dryRun) {
      currentGraph = upsertNode(currentGraph, {
        id: target.id,
        category: target.category,
        title: target.title,
        content: `[Auto-updated via Firecrawl on ${new Date().toISOString().split("T")[0]}]\n\n${truncated}`,
        confidence: 0.75, // lower confidence for auto-scraped content
        sources: [target.url],
      });
    }

    updatedNodes.push(target.id);
  }

  return { graph: currentGraph, updatedNodes, errors };
}
