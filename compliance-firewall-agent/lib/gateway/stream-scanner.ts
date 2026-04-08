/**
 * Kaelus Streaming Gateway — Real-Time Output Stream Scanner
 *
 * This module scans LLM output tokens IN REAL-TIME as they stream through the
 * gateway, detecting sensitive data (PII, financial data, API keys, etc) that
 * the model is generating in its response.
 *
 * Why scan output (not just input)?
 * - LLMs can hallucinate or recall sensitive data from their training set
 * - A model might output credit card numbers, SSNs, or API keys unprompted
 * - Even if the input was clean, the output might contain sensitive content
 * - Compliance regulations (SOC2, HIPAA, GDPR) require output monitoring
 *
 * Architecture — Async State Machine:
 * - `addToken(content)` is fully async — awaits each scan before advancing the
 *   scan position. This eliminates the one-scan delay that existed when scans
 *   were fire-and-forget. Callers `await` the result and receive alerts
 *   immediately when sensitive content is detected.
 * - A dedicated `scan()` method exposes the scan logic for callers that want
 *   to force an immediate scan (e.g., mid-stream policy enforcement).
 * - `finalize()` flushes any remaining unscanned tail content and returns the
 *   complete result including all alerts from the session.
 *
 * Performance design:
 * - Tokens accumulate in a buffer; scans fire every `scanInterval` chars.
 * - Sliding overlap window (256 chars) catches patterns spanning boundaries.
 * - Scan position advances only after the async classification resolves —
 *   no content is double-counted and no alerts are missed.
 * - Performance metrics (scan count, cumulative scan time) are tracked for
 *   the compliance dashboard.
 */

import { classifyRisk } from "@/lib/classifier/risk-engine";
import type { ClassificationResult, RiskLevel } from "@/lib/supabase/types";
import type { ScanAlert, OutputScanResult } from "./providers/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default: scan every 500 characters of accumulated output. */
const DEFAULT_SCAN_INTERVAL = 500;

/**
 * Overlap window in characters.
 *
 * When we scan at position N, we start from (N - OVERLAP) to catch patterns
 * that might span across the scan boundary. For example, a credit card
 * number "4111-1111-1111-1111" could start at position 490 and end at 509,
 * which would be missed if we only scan from position 500.
 *
 * 256 chars is generous — the longest pattern we detect (connection strings)
 * is typically under 200 chars.
 */
const OVERLAP_WINDOW = 256;

/**
 * Maximum buffer size before we force a scan.
 *
 * This prevents unbounded memory growth if scan intervals are set too high
 * or if the LLM generates a very long response without triggering a scan.
 */
const MAX_BUFFER_BEFORE_FORCED_SCAN = 50_000;

// ---------------------------------------------------------------------------
// Risk level to severity mapping
// ---------------------------------------------------------------------------

/** Maps the classifier's RiskLevel to the scanner's alert severity. */
function riskToSeverity(risk: RiskLevel): ScanAlert["severity"] {
  switch (risk) {
    case "CRITICAL":
      return "CRITICAL";
    case "HIGH":
      return "HIGH";
    case "MEDIUM":
      return "MEDIUM";
    case "LOW":
    case "NONE":
    default:
      return "LOW";
  }
}

// ---------------------------------------------------------------------------
// StreamScanner
// ---------------------------------------------------------------------------

/**
 * Real-time compliance scanner for streaming LLM output.
 *
 * Usage:
 * ```typescript
 * const scanner = new StreamScanner({ scanInterval: 500 });
 *
 * for await (const token of providerStream) {
 *   const alerts = await scanner.addToken(token.content);
 *   if (alerts.some(a => a.severity === "CRITICAL")) {
 *     // Truncate the stream immediately — real-time enforcement
 *     break;
 *   }
 * }
 *
 * const result = await scanner.finalize();
 * // result.alerts contains all detected issues
 * // result.clean indicates whether any issues were found
 * ```
 *
 * Key improvement over the previous implementation:
 * - `addToken` is now fully async and awaits each scan. Alerts are returned
 *   immediately after detection — no one-scan delay.
 * - The scan position advances atomically after each await, so concurrent
 *   token ingestion cannot produce a race condition on `lastScanPos`.
 */
export class StreamScanner {
  // ---- State ----

  /** Accumulated output text. */
  private buffer: string = "";

  /** Total tokens processed. */
  private tokenCount: number = 0;

  /**
   * Character position of the last completed scan end.
   * Updated only after the async classification resolves to prevent
   * two overlapping scans from both advancing past the same content.
   */
  private lastScanPos: number = 0;

  /** All alerts raised during this scanning session. */
  private alerts: ScanAlert[] = [];

  /** Number of scan passes executed. */
  private scansPerformed: number = 0;

  /** Cumulative time spent in classifyRisk() calls (ms). */
  private totalScanTimeMs: number = 0;

  // ---- Configuration ----

  /** Scan every N characters of new content. */
  private readonly scanInterval: number;

  /**
   * Creates a new StreamScanner.
   *
   * @param options.scanInterval - Scan every N characters (default: 500).
   *   Lower values increase detection speed but cost more CPU. 500 chars
   *   corresponds to ~100 tokens at an average of 5 chars/token.
   */
  constructor(options?: { scanInterval?: number }) {
    this.scanInterval = options?.scanInterval ?? DEFAULT_SCAN_INTERVAL;
  }

  /**
   * Adds a token to the buffer and triggers a compliance scan when the
   * interval threshold is reached.
   *
   * This method is **fully async** — it awaits the classification before
   * returning. Callers receive alerts in the same turn they were detected,
   * enabling real-time enforcement (e.g., stream truncation on CRITICAL).
   *
   * @param content - The text content of the token.
   * @returns Array of `ScanAlert` objects found in this scan window, or an
   *          empty array if no scan was triggered or the scan was clean.
   *
   * Performance: Token appending is O(1). Scanning fires every `scanInterval`
   * chars and typically takes <10ms for regex-only classification.
   */
  async addToken(content: string): Promise<ScanAlert[]> {
    if (!content) return [];

    this.buffer += content;
    this.tokenCount++;

    const newContentLength = this.buffer.length - this.lastScanPos;

    // Trigger a scan when enough new content has accumulated
    if (newContentLength >= this.scanInterval) {
      return this.scan();
    }

    // Safety valve: force a scan if the buffer has grown very large
    if (
      this.buffer.length >= MAX_BUFFER_BEFORE_FORCED_SCAN &&
      newContentLength > OVERLAP_WINDOW
    ) {
      return this.scan();
    }

    return [];
  }

  /**
   * Forces an immediate async scan of the current buffer window.
   *
   * The scan window starts from `(lastScanPos - OVERLAP_WINDOW)` to catch
   * patterns spanning the boundary, and extends to the current buffer end.
   *
   * `lastScanPos` is advanced atomically after the classification resolves —
   * if new tokens arrive during the await, they will be caught by the next
   * scan (or by `finalize()`).
   *
   * @returns Array of **new** `ScanAlert` objects found in this window
   *          (already-seen duplicates are filtered out).
   */
  async scan(): Promise<ScanAlert[]> {
    // Capture scan window bounds before the async gap so that tokens arriving
    // during the await don't cause us to re-scan already-covered content.
    const scanStart = Math.max(0, this.lastScanPos - OVERLAP_WINDOW);
    const capturedEnd = this.buffer.length;
    const textToScan = this.buffer.slice(scanStart, capturedEnd);

    if (!textToScan) return [];

    const startTime = performance.now();
    this.scansPerformed++;

    try {
      const classification: ClassificationResult = await classifyRisk(textToScan);
      this.totalScanTimeMs += performance.now() - startTime;

      // Advance the scan position — only after classification resolves
      this.lastScanPos = capturedEnd;

      if (
        classification.risk_level === "NONE" ||
        !classification.entities.length
      ) {
        return [];
      }

      const newAlerts: ScanAlert[] = [];

      for (const entity of classification.entities) {
        const alert: ScanAlert = {
          severity: riskToSeverity(classification.risk_level),
          message: `Sensitive content detected in LLM output: ${entity.pattern_matched} (${entity.type})`,
          position: scanStart + entity.position.start,
          matched_rule: entity.pattern_matched,
          redacted_match: entity.value_redacted,
          timestamp: Date.now(),
        };

        // Deduplicate: skip if the same rule fired at a nearby position
        // (can happen due to the overlap window)
        const isDuplicate = this.alerts.some(
          (existing) =>
            existing.matched_rule === alert.matched_rule &&
            Math.abs(existing.position - alert.position) < OVERLAP_WINDOW
        );

        if (!isDuplicate) {
          this.alerts.push(alert);
          newAlerts.push(alert);
        }
      }

      return newAlerts;
    } catch (error) {
      // Scanner errors must never crash the stream. Log and continue.
      console.error("[kaelus:scanner] Scan failed:", error);
      this.totalScanTimeMs += performance.now() - startTime;
      // Still advance position to avoid infinite retry on the same window
      this.lastScanPos = capturedEnd;
      return [];
    }
  }

  /**
   * Performs a final scan of any remaining unscanned tail content and
   * returns the complete scan result for this streaming session.
   *
   * **Must be called when the stream ends.** This catches sensitive content
   * in the tail of the response that didn't trigger an interval scan.
   *
   * @returns The complete `OutputScanResult` with all alerts and metrics.
   */
  async finalize(): Promise<OutputScanResult> {
    const remainingStart = Math.max(0, this.lastScanPos - OVERLAP_WINDOW);
    const remainingContent = this.buffer.slice(remainingStart);

    if (remainingContent.length > 0) {
      const startTime = performance.now();
      this.scansPerformed++;

      try {
        const classification = await classifyRisk(remainingContent);
        this.totalScanTimeMs += performance.now() - startTime;

        if (
          classification.risk_level !== "NONE" &&
          classification.entities.length > 0
        ) {
          for (const entity of classification.entities) {
            const alert: ScanAlert = {
              severity: riskToSeverity(classification.risk_level),
              message: `Sensitive content detected in LLM output: ${entity.pattern_matched} (${entity.type})`,
              position: remainingStart + entity.position.start,
              matched_rule: entity.pattern_matched,
              redacted_match: entity.value_redacted,
              timestamp: Date.now(),
            };

            const isDuplicate = this.alerts.some(
              (existing) =>
                existing.matched_rule === alert.matched_rule &&
                Math.abs(existing.position - alert.position) < OVERLAP_WINDOW
            );

            if (!isDuplicate) {
              this.alerts.push(alert);
            }
          }
        }
      } catch (error) {
        console.error("[kaelus:scanner] Final scan failed:", error);
        this.totalScanTimeMs += performance.now() - startTime;
      }
    }

    return {
      clean: this.alerts.length === 0,
      characters_scanned: this.buffer.length,
      tokens_processed: this.tokenCount,
      scans_performed: this.scansPerformed,
      alerts: this.alerts,
      scan_time_ms: Math.round(this.totalScanTimeMs * 100) / 100,
    };
  }

  // ---- Accessors ----

  /** Returns the current token count. */
  getTokenCount(): number {
    return this.tokenCount;
  }

  /** Returns the current buffer length. */
  getBufferLength(): number {
    return this.buffer.length;
  }

  /** Returns all alerts raised so far (a live snapshot, not a copy). */
  getAlerts(): ReadonlyArray<ScanAlert> {
    return this.alerts;
  }

  /**
   * Returns the highest severity alert seen so far.
   * Returns `null` if no alerts have been raised.
   */
  getHighestSeverity(): ScanAlert["severity"] | null {
    if (this.alerts.length === 0) return null;

    const severityOrder: Record<ScanAlert["severity"], number> = {
      LOW: 0,
      MEDIUM: 1,
      HIGH: 2,
      CRITICAL: 3,
    };

    let highest: ScanAlert["severity"] = "LOW";
    for (const alert of this.alerts) {
      if (severityOrder[alert.severity] > severityOrder[highest]) {
        highest = alert.severity;
      }
    }
    return highest;
  }

  /**
   * Returns `true` if any alert meets or exceeds the given severity threshold.
   *
   * Used by the proxy to decide whether to truncate the stream mid-flight.
   */
  hasAlertAtOrAbove(threshold: ScanAlert["severity"]): boolean {
    const severityOrder: Record<ScanAlert["severity"], number> = {
      LOW: 0,
      MEDIUM: 1,
      HIGH: 2,
      CRITICAL: 3,
    };

    const thresholdLevel = severityOrder[threshold];
    return this.alerts.some(
      (alert) => severityOrder[alert.severity] >= thresholdLevel
    );
  }
}
