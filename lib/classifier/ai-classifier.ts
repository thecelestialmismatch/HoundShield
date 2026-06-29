/**
 * Bytez AI-powered classification layer.
 * Uses the free tier of Bytez (https://bytez.com) for zero-shot
 * text classification to enhance the regex-based risk engine.
 *
 * Free tier: 1 concurrent request, access to 7B+ models, $0.
 *
 * This is an OPTIONAL enhancement — the regex engine works standalone.
 * When BYTEZ_API_KEY is set, classifications get AI confidence boosting.
 */

const BYTEZ_API_URL = "https://api.bytez.com/models/v2";
const BYTEZ_MODEL = "facebook/bart-large-mnli"; // Zero-shot classifier

const SENSITIVE_LABELS = [
  "personal_identifiable_information",
  "financial_data",
  "credentials_and_secrets",
  "strategic_business_data",
  "medical_records",
  "safe_content",
];

export interface AIClassificationResult {
  labels: string[];
  scores: number[];
  top_label: string;
  top_score: number;
  is_sensitive: boolean;
}

/**
 * Classify text using Bytez zero-shot classification (free tier).
 * Returns null if Bytez is not configured or the call fails —
 * the regex engine will still work as the primary classifier.
 */
export async function classifyWithAI(
  text: string
): Promise<AIClassificationResult | null> {
  const apiKey = process.env.BYTEZ_API_KEY;
  if (!apiKey) return null;

  try {
    // Truncate to first 500 chars for speed on free tier
    const truncated = text.length > 500 ? text.slice(0, 500) : text;

    const res = await fetch(`${BYTEZ_API_URL}/${BYTEZ_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: truncated,
        candidate_labels: SENSITIVE_LABELS,
      }),
      signal: AbortSignal.timeout(5000), // 5s timeout — don't block the pipeline
    });

    if (!res.ok) {
      console.warn(`Bytez AI classification failed: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const output = data.output ?? data;

    const labels: string[] = output.labels ?? [];
    const scores: number[] = output.scores ?? [];

    if (labels.length === 0) return null;

    const topLabel = labels[0];
    const topScore = scores[0] ?? 0;
    const isSensitive = topLabel !== "safe_content" && topScore > 0.6;

    return {
      labels,
      scores,
      top_label: topLabel,
      top_score: topScore,
      is_sensitive: isSensitive,
    };
  } catch (err) {
    // Non-fatal — AI classification is an enhancement, not a requirement
    console.warn("Bytez AI classification unavailable:", (err as Error).message);
    return null;
  }
}
