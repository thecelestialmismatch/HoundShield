import { eventBus } from "@/lib/gateway/event-bus";
import type { ComplianceStreamEvent, DashboardMetrics } from "@/lib/gateway/event-bus";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Interval between metrics broadcasts (ms). */
const METRICS_INTERVAL_MS = 5_000;

/** Interval between heartbeat pings (ms). */
const HEARTBEAT_INTERVAL_MS = 15_000;

// ---------------------------------------------------------------------------
// GET /api/events/stream
// ---------------------------------------------------------------------------

/**
 * Real-time compliance event SSE feed for the dashboard.
 *
 * This is a long-lived Server-Sent Events connection that pushes:
 *   - `event`     — individual compliance events as they happen
 *   - `metric`    — aggregated metrics snapshot every 5 seconds
 *   - `heartbeat` — keep-alive ping every 15 seconds
 *
 * Clients connect from the dashboard and receive live updates without
 * polling. When the client disconnects, the subscription is cleaned up
 * automatically.
 *
 * Usage:
 *   const source = new EventSource("/api/events/stream");
 *   source.addEventListener("event", (e) => { ... });
 *   source.addEventListener("metric", (e) => { ... });
 */
export async function GET() {
  // Shared cleanup function — set inside `start`, called from `cancel`.
  let cleanupFn: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      // Helper to safely enqueue SSE data
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          const ssePayload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(ssePayload));
        } catch {
          // Controller may be closed if client disconnected between checks
          closed = true;
        }
      };

      // --- Event subscription ---------------------------------------------
      const unsubscribeEvent = eventBus.subscribe(
        (event: ComplianceStreamEvent) => {
          send("event", event);
        }
      );

      // --- Metrics subscription -------------------------------------------
      const unsubscribeMetrics = eventBus.subscribeMetrics(
        (metrics: DashboardMetrics) => {
          send("metric", metrics);
        }
      );

      // Broadcast metrics on a timer
      const metricsTimer = setInterval(() => {
        if (closed) return;
        eventBus.broadcastMetrics();
      }, METRICS_INTERVAL_MS);

      // --- Heartbeat ------------------------------------------------------
      const heartbeatTimer = setInterval(() => {
        send("heartbeat", { timestamp: Date.now() });
      }, HEARTBEAT_INTERVAL_MS);

      // Send an initial metrics snapshot so the dashboard has data immediately
      send("metric", eventBus.getMetrics());

      // --- Cleanup on disconnect ------------------------------------------
      cleanupFn = () => {
        if (closed) return;
        closed = true;
        clearInterval(metricsTimer);
        clearInterval(heartbeatTimer);
        unsubscribeEvent();
        unsubscribeMetrics();
      };
    },

    cancel() {
      // Called when the client disconnects (browser tab closed, EventSource.close())
      if (cleanupFn) {
        cleanupFn();
        cleanupFn = null;
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/**
 * Force Next.js to treat this route as dynamic (no static generation).
 * SSE endpoints must never be pre-rendered.
 */
export const dynamic = "force-dynamic";
