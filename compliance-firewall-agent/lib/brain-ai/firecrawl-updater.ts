/**
 * Brain AI v3 — FirecrawlUpdater
 *
 * Scrapes external sources to keep the KnowledgeGraph current.
 * Only updates a KG node if scraped content changed >10% (diff detection).
 * Logs failures to Supabase brain_update_failures table.
 *
 * 8 update targets: Nightfall, Strac, Forcepoint, Cloudflare AI GW,
 * CMMC AB, CUI registry, GitHub CMMC patterns, NIST news.
 */

import { addKnowledgeNode, queryKnowledgeGraph } from "./knowledge-graph";

export interface UpdateTarget {
  id: string;
  name: string;
  url: string;
  domain: import("./knowledge-graph").KnowledgeDomain;
  selector?: string;
}

export interface UpdateResult {
  target: string;
  success: boolean;
  changed: boolean;
  error?: string;
}

const UPDATE_TARGETS: UpdateTarget[] = [
  {
    id: "nightfall-pricing",
    name: "Nightfall DLP Pricing",
    url: "https://nightfall.ai/pricing",
    domain: "competitor",
  },
  {
    id: "strac-pricing",
    name: "Strac DLP Pricing",
    url: "https://strac.io/pricing",
    domain: "competitor",
  },
  {
    id: "forcepoint-dlp",
    name: "Forcepoint DLP",
    url: "https://www.forcepoint.com/product/dlp-data-loss-prevention",
    domain: "competitor",
  },
  {
    id: "cloudflare-ai-gateway",
    name: "Cloudflare AI Gateway",
    url: "https://developers.cloudflare.com/ai-gateway/",
    domain: "competitor",
  },
  {
    id: "cmmc-ab-news",
    name: "CMMC Accreditation Body News",
    url: "https://cyberab.org/news/",
    domain: "cmmc",
  },
  {
    id: "cui-registry",
    name: "CUI Registry (NARA)",
    url: "https://www.archives.gov/cui/registry/category-list",
    domain: "nist",
  },
  {
    id: "github-cmmc-patterns",
    name: "GitHub CMMC Pattern Repos",
    url: "https://github.com/search?q=cmmc+cui+detection&type=repositories",
    domain: "cmmc",
  },
  {
    id: "nist-csrc-news",
    name: "NIST CSRC News (800-171 updates)",
    url: "https://csrc.nist.gov/publications/detail/sp/800-171/rev-2/final",
    domain: "nist",
  },
];

function contentDiffRatio(oldContent: string, newContent: string): number {
  if (!oldContent) return 1;
  const oldWords = new Set(oldContent.toLowerCase().split(/\s+/));
  const newWords = newContent.toLowerCase().split(/\s+/);
  const changed = newWords.filter((w) => !oldWords.has(w)).length;
  return changed / Math.max(newWords.length, 1);
}

async function scrapeWithFirecrawl(url: string): Promise<string | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ url, formats: ["markdown"] }),
    });

    if (!response.ok) return null;
    const data = await response.json() as { data?: { markdown?: string } };
    return data?.data?.markdown ?? null;
  } catch {
    return null;
  }
}

async function logFailure(targetId: string, error: string): Promise<void> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    );
    await supabase.from("brain_update_failures").insert({
      target_id: targetId,
      error,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Best-effort logging — don't throw
  }
}

export async function runKnowledgeGraphUpdate(
  targetIds?: string[],
): Promise<UpdateResult[]> {
  const targets = targetIds
    ? UPDATE_TARGETS.filter((t) => targetIds.includes(t.id))
    : UPDATE_TARGETS;

  const results: UpdateResult[] = [];

  for (const target of targets) {
    try {
      const scraped = await scrapeWithFirecrawl(target.url);

      if (!scraped) {
        await logFailure(target.id, "Firecrawl returned null — check FIRECRAWL_API_KEY");
        results.push({ target: target.id, success: false, changed: false, error: "scrape failed" });
        continue;
      }

      // Check existing node for diff
      const existing = await queryKnowledgeGraph({
        query: target.name,
        domains: [target.domain],
        limit: 1,
      });

      const existingContent = existing[0]?.node.content ?? "";
      const diffRatio = contentDiffRatio(existingContent, scraped);

      if (diffRatio < 0.1) {
        results.push({ target: target.id, success: true, changed: false });
        continue;
      }

      const summary = scraped.slice(0, 800);
      addKnowledgeNode({
        id: target.id,
        domain: target.domain,
        title: target.name,
        content: summary,
        keywords: target.name.toLowerCase().split(/\s+/),
        source: target.url,
        sourceType: "firecrawl",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ttl: 7 * 24 * 60 * 60 * 1000,
        weight: 0.7,
      });

      results.push({ target: target.id, success: true, changed: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await logFailure(target.id, message);
      results.push({ target: target.id, success: false, changed: false, error: message });
    }
  }

  return results;
}
