/**
 * Compliance Event Bus
 *
 * In-memory pub/sub system for real-time compliance event distribution.
 * Used by the gateway to publish scan results and by the dashboard SSE
 * endpoint to push live updates to connected clients.
 *
 * This is a singleton — all API routes in the same Node.js process share
 * the same instance. In a multi-process deployment (e.g., cluster mode),
 * replace this with Redis pub/sub or a similar distributed bus.
 */

import type { RiskLevel, ActionTaken } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A compliance event emitted when the gateway processes a request. */
export interface ComplianceStreamEvent {
  id: string;
  action: ActionTaken;
  risk_level: RiskLevel;
  user_id: string;
  provider: string;
  model: string;
  timestamp: string;
  processing_time_ms: number;
  classifications: string[];
  entities_found: number;
}

/** Aggregated metrics snapshot sent periodically to dashboard clients. */
export interface DashboardMetrics {
  total_requests: number;
  blocked_count: number;
  quarantined_count: number;
  allowed_count: number;
  avg_latency_ms: number;
  active_connections: number;
}

type EventHandler = (event: ComplianceStreamEvent) => void;
type MetricsHandler = (metrics: DashboardMetrics) => void;

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

class ComplianceEventBus {
  private eventHandlers = new Set<EventHandler>();
  private metricsHandlers = new Set<MetricsHandler>();

  private metrics = {
    total: 0,
    blocked: 0,
    quarantined: 0,
    allowed: 0,
    totalLatency: 0,
  };

  private _activeConnections = 0;

  // -----------------------------------------------------------------------
  // Event subscription
  // -----------------------------------------------------------------------

  /**
   * Subscribe to compliance events. Returns an unsubscribe function.
   * Call the returned function when the SSE connection closes to prevent
   * memory leaks.
   */
  subscribe(handler: EventHandler): () => void {
    this.eventHandlers.add(handler);
    this._activeConnections++;

    return () => {
      this.eventHandlers.delete(handler);
      this._activeConnections = Math.max(0, this._activeConnections - 1);
    };
  }

  /**
   * Subscribe to periodic metrics updates. Returns an unsubscribe function.
   */
  subscribeMetrics(handler: MetricsHandler): () => void {
    this.metricsHandlers.add(handler);

    return () => {
      this.metricsHandlers.delete(handler);
    };
  }

  // -----------------------------------------------------------------------
  // Publishing
  // -----------------------------------------------------------------------

  /**
   * Publish a compliance event to all subscribers.
   * Called by the gateway after processing each request.
   */
  publish(event: ComplianceStreamEvent): void {
    // Update aggregated metrics
    this.metrics.total++;
    this.metrics.totalLatency += event.processing_time_ms;

    switch (event.action) {
      case "BLOCKED":
        this.metrics.blocked++;
        break;
      case "QUARANTINED":
        this.metrics.quarantined++;
        break;
      case "ALLOWED":
        this.metrics.allowed++;
        break;
    }

    // Fan out to all subscribers. Errors in one handler must not break others.
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (err) {
        console.error("[EventBus] Handler threw during event dispatch:", err);
      }
    }
  }

  /**
   * Broadcast the current metrics snapshot to all metrics subscribers.
   * Called on a timer by the events/stream route.
   */
  broadcastMetrics(): void {
    const snapshot = this.getMetrics();
    for (const handler of this.metricsHandlers) {
      try {
        handler(snapshot);
      } catch (err) {
        console.error("[EventBus] Handler threw during metrics broadcast:", err);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Accessors
  // -----------------------------------------------------------------------

  /** Returns the current aggregated metrics. */
  getMetrics(): DashboardMetrics {
    return {
      total_requests: this.metrics.total,
      blocked_count: this.metrics.blocked,
      quarantined_count: this.metrics.quarantined,
      allowed_count: this.metrics.allowed,
      avg_latency_ms:
        this.metrics.total > 0
          ? Math.round(this.metrics.totalLatency / this.metrics.total)
          : 0,
      active_connections: this._activeConnections,
    };
  }

  /** Returns the number of active SSE/WebSocket connections. */
  getActiveConnections(): number {
    return this._activeConnections;
  }

  /** Resets all metrics counters. Useful for testing. */
  resetMetrics(): void {
    this.metrics = {
      total: 0,
      blocked: 0,
      quarantined: 0,
      allowed: 0,
      totalLatency: 0,
    };
  }
}

/**
 * Global singleton event bus instance.
 *
 * Stored on `globalThis` to survive Next.js hot-module-replacement
 * during development. In production the module cache handles this.
 */
const globalForBus = globalThis as unknown as {
  __houndshieldEventBus?: ComplianceEventBus;
};

export const eventBus: ComplianceEventBus =
  globalForBus.__houndshieldEventBus ?? new ComplianceEventBus();

if (process.env.NODE_ENV !== "production") {
  globalForBus.__houndshieldEventBus = eventBus;
}
