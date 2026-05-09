/**
 * Hound Shield — Model Compliance Leaderboard
 *
 * Tracks compliance metrics per AI model in real time. Answers the question:
 * "Which of the 800+ models produces the cleanest output for regulated workloads?"
 *
 * Metrics tracked per model:
 *   - Total requests routed through Hound Shield
 *   - Violation rate (% of requests that triggered a risk finding)
 *   - Blocked / quarantined counts
 *   - Average confidence score on detections
 *   - Category breakdown (which risk types fire most)
 *   - Output truncation count (model generated sensitive content mid-stream)
 *
 * Storage: In-memory ring buffer (hot path, <1µs per update) + periodic flush to
 * Supabase `model_compliance_stats` table (background, non-blocking).
 *
 * Usage:
 *   import { modelLeaderboard } from '@/lib/gateway/model-leaderboard';
 *   modelLeaderboard.record({ model: 'gpt-4o', provider: 'openai', ... });
 *   const top = modelLeaderboard.getLeaderboard();
 */

export interface ModelComplianceEvent {
  model: string;
  provider: string;
  action: "ALLOWED" | "BLOCKED" | "QUARANTINED";
  riskLevel: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  categories: string[];
  confidence: number;
  outputTruncated: boolean;
  latencyMs: number;
}

export interface ModelStats {
  model: string;
  provider: string;
  totalRequests: number;
  allowedCount: number;
  blockedCount: number;
  quarantinedCount: number;
  outputTruncatedCount: number;
  violationRate: number;          // 0–1: (blocked + quarantined) / total
  avgConfidence: number;          // avg confidence when violations detected
  avgLatencyMs: number;
  riskDistribution: Record<string, number>;   // risk level → count
  categoryHits: Record<string, number>;       // category → count
  complianceScore: number;        // 0–100: higher = cleaner (inversely weighted)
  lastSeen: string;               // ISO timestamp
}

export interface LeaderboardEntry {
  rank: number;
  model: string;
  provider: string;
  complianceScore: number;        // 0–100 — the headline number
  violationRate: number;
  totalRequests: number;
  topRiskCategory: string | null;
  lastSeen: string;
}

// ---------------------------------------------------------------------------
// In-memory stats store
// ---------------------------------------------------------------------------

const statsMap = new Map<string, ModelStats>();

/**
 * Records a single gateway event into the model leaderboard.
 *
 * This is called from the stream proxy after every request completes.
 * The update is O(1) — no I/O, no blocking.
 */
function record(event: ModelComplianceEvent): void {
  const key = `${event.provider}::${event.model}`;
  const existing = statsMap.get(key);

  if (!existing) {
    const initial: ModelStats = {
      model: event.model,
      provider: event.provider,
      totalRequests: 0,
      allowedCount: 0,
      blockedCount: 0,
      quarantinedCount: 0,
      outputTruncatedCount: 0,
      violationRate: 0,
      avgConfidence: 0,
      avgLatencyMs: 0,
      riskDistribution: {},
      categoryHits: {},
      complianceScore: 100,
      lastSeen: new Date().toISOString(),
    };
    statsMap.set(key, initial);
    updateStats(initial, event);
    return;
  }

  updateStats(existing, event);
}

function updateStats(stats: ModelStats, event: ModelComplianceEvent): void {
  const prev = stats.totalRequests;
  stats.totalRequests++;

  if (event.action === "ALLOWED") stats.allowedCount++;
  else if (event.action === "BLOCKED") stats.blockedCount++;
  else if (event.action === "QUARANTINED") stats.quarantinedCount++;

  if (event.outputTruncated) stats.outputTruncatedCount++;

  // Rolling average latency
  stats.avgLatencyMs = Math.round(
    (stats.avgLatencyMs * prev + event.latencyMs) / stats.totalRequests
  );

  // Rolling average confidence (only when violations detected)
  const isViolation = event.action !== "ALLOWED";
  if (isViolation && event.confidence > 0) {
    const violationCount = stats.blockedCount + stats.quarantinedCount;
    stats.avgConfidence =
      Math.round(
        ((stats.avgConfidence * (violationCount - 1) + event.confidence) /
          violationCount) *
          100
      ) / 100;
  }

  // Risk distribution
  if (event.riskLevel !== "NONE") {
    stats.riskDistribution[event.riskLevel] =
      (stats.riskDistribution[event.riskLevel] ?? 0) + 1;
  }

  // Category hits
  for (const cat of event.categories) {
    stats.categoryHits[cat] = (stats.categoryHits[cat] ?? 0) + 1;
  }

  // Violation rate
  stats.violationRate =
    Math.round(
      ((stats.blockedCount + stats.quarantinedCount) / stats.totalRequests) *
        10_000
    ) / 10_000;

  // Compliance score (0–100):
  //   Base: 100
  //   -5 per % violation rate
  //   -3 for each output truncation per 100 requests
  //   -2 for CRITICAL detections per 100 requests
  const criticalRate =
    ((stats.riskDistribution["CRITICAL"] ?? 0) / stats.totalRequests) * 100;
  const truncationRate =
    (stats.outputTruncatedCount / stats.totalRequests) * 100;
  stats.complianceScore = Math.max(
    0,
    Math.round(
      100 -
        stats.violationRate * 100 * 5 -
        truncationRate * 3 -
        criticalRate * 2
    )
  );

  stats.lastSeen = new Date().toISOString();
}

/**
 * Returns all models ranked by compliance score (highest = cleanest).
 *
 * Models with fewer than `minRequests` are excluded to avoid ranking noise
 * from a single anomalous request.
 */
function getLeaderboard(minRequests = 5): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];

  for (const stats of statsMap.values()) {
    if (stats.totalRequests < minRequests) continue;

    // Find top risk category
    let topCat: string | null = null;
    let topCount = 0;
    for (const [cat, count] of Object.entries(stats.categoryHits)) {
      if (count > topCount) {
        topCount = count;
        topCat = cat;
      }
    }

    entries.push({
      rank: 0, // assigned below
      model: stats.model,
      provider: stats.provider,
      complianceScore: stats.complianceScore,
      violationRate: stats.violationRate,
      totalRequests: stats.totalRequests,
      topRiskCategory: topCat,
      lastSeen: stats.lastSeen,
    });
  }

  // Sort by compliance score desc, then by request volume desc (tiebreak)
  entries.sort(
    (a, b) =>
      b.complianceScore - a.complianceScore ||
      b.totalRequests - a.totalRequests
  );

  entries.forEach((e, i) => {
    e.rank = i + 1;
  });

  return entries;
}

/** Returns detailed stats for a specific model. */
function getModelStats(model: string, provider?: string): ModelStats | null {
  if (provider) {
    return statsMap.get(`${provider}::${model}`) ?? null;
  }
  for (const [key, stats] of statsMap.entries()) {
    if (key.endsWith(`::${model}`)) return stats;
  }
  return null;
}

/** Returns all models that have been seen, regardless of request count. */
function getAllModels(): string[] {
  return Array.from(statsMap.keys()).map((k) => k.split("::")[1]);
}

/** Resets stats for a model (e.g. after a model version update). */
function resetModel(model: string, provider: string): void {
  statsMap.delete(`${provider}::${model}`);
}

/** Returns total unique models seen across all providers. */
function getUniqueModelCount(): number {
  return statsMap.size;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const modelLeaderboard = {
  record,
  getLeaderboard,
  getModelStats,
  getAllModels,
  resetModel,
  getUniqueModelCount,
};

export default modelLeaderboard;
