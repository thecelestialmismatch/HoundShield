import { eventBus } from "@/lib/gateway/event-bus";
import type { ComplianceStreamEvent, DashboardMetrics } from "@/lib/gateway/event-bus";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const METRICS_INTERVAL_MS = 5_000;
const HEARTBEAT_INTERVAL_MS = 15_000;
const SIMULATED_EVENT_INTERVAL_MS = 4_000; // Simulated event every 4s

// ---------------------------------------------------------------------------
// Simulated event generator (makes the dashboard feel alive)
// ---------------------------------------------------------------------------

const PROVIDERS = ["openai", "anthropic", "google", "openrouter"];
const MODELS: Record<string, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
  anthropic: ["claude-3.5-sonnet", "claude-3-haiku"],
  google: ["gemini-2.0-flash", "gemini-pro"],
  openrouter: ["meta-llama/llama-3.3-70b", "deepseek/deepseek-v3", "qwen/qwen-72b"],
};
const USERS = [
  "user-a1b2c3", "user-d4e5f6", "user-g7h8i9", "user-j0k1l2",
  "dev-team", "qa-bot", "staging-svc", "prod-worker",
];
const CLASSIFICATIONS = [
  ["PII_SSN", "PII_EMAIL"],
  ["FINANCIAL_REVENUE", "FINANCIAL_ACCOUNT"],
  ["IP_API_KEY"],
  ["STRATEGIC_ROADMAP"],
  ["PII_CREDIT_CARD", "PII_PHONE"],
  ["IP_AWS_CREDENTIALS"],
  [],
  [],
  [],
  [],
  [],
];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSimulatedEvent(): ComplianceStreamEvent {
  const provider = randomChoice(PROVIDERS);
  const model = randomChoice(MODELS[provider] || ["unknown"]);
  const classifications = randomChoice(CLASSIFICATIONS);
  const hasEntities = classifications.length > 0;

  let action: "ALLOWED" | "BLOCKED" | "QUARANTINED";
  let risk_level: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  if (!hasEntities) {
    action = "ALLOWED";
    risk_level = randomChoice(["NONE", "LOW"] as const);
  } else if (
    classifications.some((c) => c.includes("SSN") || c.includes("CREDIT_CARD") || c.includes("AWS"))
  ) {
    action = randomChoice(["BLOCKED", "QUARANTINED"] as const);
    risk_level = randomChoice(["HIGH", "CRITICAL"] as const);
  } else {
    action = randomChoice(["ALLOWED", "QUARANTINED", "QUARANTINED"] as const);
    risk_level = randomChoice(["MEDIUM", "HIGH"] as const);
  }

  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action,
    risk_level,
    user_id: randomChoice(USERS),
    provider,
    model,
    timestamp: new Date().toISOString(),
    processing_time_ms: Math.round(5 + Math.random() * 45),
    classifications,
    entities_found: classifications.length,
  };
}

// ---------------------------------------------------------------------------
// GET /api/events/stream
// ---------------------------------------------------------------------------

export async function GET() {
  let cleanupFn: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          const ssePayload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(ssePayload));
        } catch {
          closed = true;
        }
      };

      // --- Event subscription ---
      const unsubscribeEvent = eventBus.subscribe((event: ComplianceStreamEvent) => {
        send("event", event);
      });

      // --- Metrics subscription ---
      const unsubscribeMetrics = eventBus.subscribeMetrics((metrics: DashboardMetrics) => {
        send("metric", metrics);
      });

      // Broadcast metrics on a timer
      const metricsTimer = setInterval(() => {
        if (closed) return;
        eventBus.broadcastMetrics();
      }, METRICS_INTERVAL_MS);

      // --- Heartbeat ---
      const heartbeatTimer = setInterval(() => {
        send("heartbeat", { timestamp: Date.now() });
      }, HEARTBEAT_INTERVAL_MS);

      // --- Simulated events (makes dashboard feel alive) ---
      // Send an initial burst of 3 events so the feed isn't empty
      for (let i = 0; i < 3; i++) {
        const evt = generateSimulatedEvent();
        evt.timestamp = new Date(Date.now() - (3 - i) * 2000).toISOString();
        eventBus.publish(evt);
      }

      const simulationTimer = setInterval(() => {
        if (closed) return;
        // 70% chance of generating an event each interval
        if (Math.random() < 0.7) {
          const evt = generateSimulatedEvent();
          eventBus.publish(evt);
        }
      }, SIMULATED_EVENT_INTERVAL_MS);

      // Send an initial metrics snapshot
      send("metric", eventBus.getMetrics());

      // --- Cleanup on disconnect ---
      cleanupFn = () => {
        if (closed) return;
        closed = true;
        clearInterval(metricsTimer);
        clearInterval(heartbeatTimer);
        clearInterval(simulationTimer);
        unsubscribeEvent();
        unsubscribeMetrics();
      };
    },

    cancel() {
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

export const dynamic = "force-dynamic";
