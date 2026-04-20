/**
 * Hound Shield Proxy — Express server.
 *
 * OpenAI-compatible API surface:
 *   POST /v1/chat/completions
 *   GET  /health
 *   GET  /v1/events          (local audit log)
 *   GET  /v1/stats           (local stats)
 *
 * Intercepts prompts, scans for CUI/PII/PHI, blocks or forwards to upstream AI.
 * Metadata (never content) is forwarded async to houndshield.com dashboard.
 */

import express, { type Request, type Response, type NextFunction } from "express";
import fetch, { type Response as FetchResponse } from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { scanMessages } from "./scanner.js";
import { logEvent } from "./storage.js";
import { enqueueEvent, setWebhookLicenseKey, flushWebhook } from "./webhook.js";
import { validateLicense } from "./license.js";

// ── Environment ─────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? "8080", 10);
const LICENSE_KEY = process.env.HOUNDSHIELD_LICENSE_KEY ?? "";
const UPSTREAM_API_KEY = process.env.UPSTREAM_API_KEY ?? "";
const DEFAULT_PROVIDER = (process.env.UPSTREAM_PROVIDER ?? "openai") as Provider;

if (!LICENSE_KEY) {
  console.warn("[houndshield] HOUNDSHIELD_LICENSE_KEY not set — running in evaluation mode");
}

setWebhookLicenseKey(LICENSE_KEY);

// ── Provider routing ────────────────────────────────────────────────────────

type Provider = "openai" | "anthropic" | "google" | "openrouter";

const PROVIDER_ENDPOINTS: Record<Provider, string> = {
  openai: "https://api.openai.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
  google: "https://generativelanguage.googleapis.com/v1beta/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
};

function providerEndpoint(provider: Provider): string {
  return PROVIDER_ENDPOINTS[provider] ?? PROVIDER_ENDPOINTS.openai;
}

// ── Request schema ──────────────────────────────────────────────────────────

const MessageSchema = z.object({
  role: z.string(),
  content: z.union([z.string(), z.array(z.record(z.unknown()))]),
});

const ChatRequestSchema = z.object({
  model: z.string().optional(),
  messages: z.array(MessageSchema),
  stream: z.boolean().optional(),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
});

// ── App ─────────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json({ limit: "4mb" }));

// ── Health ──────────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", version: "1.0.0", source: "houndshield-proxy" });
});

// ── Main proxy endpoint ─────────────────────────────────────────────────────

app.post("/v1/chat/completions", async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const startMs = Date.now();

  // Validate license
  const license = await validateLicense(LICENSE_KEY);
  const orgId = license.org_id;

  // Determine upstream provider
  const providerHeader = req.headers["x-provider"] as Provider | undefined;
  const provider: Provider = providerHeader ?? DEFAULT_PROVIDER;
  const upstreamKey =
    (req.headers["x-provider-api-key"] as string | undefined) ?? UPSTREAM_API_KEY;

  // Parse and validate request body
  const parsed = ChatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: { message: "Invalid request body", details: parsed.error.errors },
    });
    return;
  }

  const { messages, stream, ...rest } = parsed.data;

  // ── SCAN ──────────────────────────────────────────────────────────────────
  const scanResult = scanMessages(messages as Array<{ role: string; content: unknown }>);
  const scanMs = scanResult.scan_ms;

  const topEntity = scanResult.entities[0];
  const patternName = topEntity?.pattern_name;
  const nistControl = topEntity?.nist_controls?.[0];

  // Log locally (metadata only, no content)
  const actionMapped =
    scanResult.action === "BLOCK"
      ? "BLOCKED"
      : scanResult.action === "QUARANTINE"
      ? "QUARANTINED"
      : "ALLOWED";

  logEvent({
    request_id: requestId,
    org_id: orgId,
    action: actionMapped,
    risk_level: scanResult.risk_level,
    pattern_name: patternName,
    nist_control: nistControl,
    scan_ms: Math.round(scanMs),
  });

  // Forward metadata async to cloud dashboard
  enqueueEvent({
    request_id: requestId,
    org_id: orgId,
    action: actionMapped,
    risk_level: scanResult.risk_level,
    pattern_name: patternName,
    nist_control: nistControl,
    scan_ms: Math.round(scanMs),
  });

  // Set response headers before any branching
  res.setHeader("X-HoundShield-Request-Id", requestId);
  res.setHeader("X-HoundShield-Risk-Level", scanResult.risk_level);
  res.setHeader("X-HoundShield-Action", actionMapped);
  res.setHeader("X-HoundShield-Scan-Ms", String(Math.round(scanMs)));

  // ── BLOCK ─────────────────────────────────────────────────────────────────
  if (scanResult.action === "BLOCK") {
    res.status(403).json({
      error: {
        message: "Request blocked by Hound Shield compliance firewall",
        code: "HOUNDSHIELD_BLOCKED",
        risk_level: scanResult.risk_level,
        pattern: patternName ?? "unknown",
        nist_control: nistControl,
        request_id: requestId,
      },
    });
    return;
  }

  // ── QUARANTINE — allow but flag ────────────────────────────────────────────
  // (falls through to forward — dashboard will show QUARANTINED status)

  // ── FORWARD to upstream AI ────────────────────────────────────────────────
  const upstreamUrl = providerEndpoint(provider);

  let upstreamRes: FetchResponse;
  try {
    upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${upstreamKey}`,
        ...(provider === "anthropic"
          ? { "anthropic-version": "2023-06-01" }
          : {}),
      },
      body: JSON.stringify({ messages, stream, ...rest }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upstream unreachable";
    res.status(502).json({ error: { message: msg, code: "UPSTREAM_ERROR" } });
    return;
  }

  // ── Streaming passthrough ─────────────────────────────────────────────────
  if (stream && upstreamRes.body) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    upstreamRes.body.pipe(res);
    return;
  }

  // ── Non-streaming response ────────────────────────────────────────────────
  const data = await upstreamRes.json();
  res.status(upstreamRes.status).json(data);
  void startMs; // suppress unused warning
});

// ── Local audit endpoints ───────────────────────────────────────────────────

app.get("/v1/events", (req: Request, res: Response) => {
  const { queryEvents } = require("./storage.js") as typeof import("./storage.js");
  const limit = Math.min(parseInt((req.query.limit as string) ?? "100", 10), 500);
  const offset = parseInt((req.query.offset as string) ?? "0", 10);
  const action = req.query.action as string | undefined;
  const since = req.query.since as string | undefined;
  res.json({ success: true, data: queryEvents({ limit, offset, action, since }) });
});

app.get("/v1/stats", (_req: Request, res: Response) => {
  const { getStats } = require("./storage.js") as typeof import("./storage.js");
  res.json({ success: true, data: getStats() });
});

// ── Error handler ───────────────────────────────────────────────────────────

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const msg = err instanceof Error ? err.message : "Internal error";
  res.status(500).json({ error: { message: msg, code: "INTERNAL_ERROR" } });
});

// ── Start ────────────────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  console.log(`[houndshield] Proxy listening on http://localhost:${PORT}`);
  console.log(`[houndshield] Set baseURL = "http://localhost:${PORT}/v1" in your AI client`);
  console.log(`[houndshield] Provider: ${DEFAULT_PROVIDER}`);
});

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  console.log(`[houndshield] ${signal} — flushing events and shutting down`);
  await flushWebhook();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

export default app;
