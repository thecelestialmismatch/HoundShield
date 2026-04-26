/**
 * Hound Shield Proxy — Express server.
 *
 * OpenAI-compatible API surface:
 *   POST /v1/chat/completions  — main proxy endpoint (OODA loop)
 *   GET  /health               — liveness check
 *   GET  /v1/events            — local audit log
 *   GET  /v1/stats             — local stats
 *   GET  /v1/quarantine        — quarantine queue (pending review)
 *   PUT  /v1/quarantine/:id    — release or block quarantined request
 *   GET  /v1/baselines/:orgId  — behavioral baseline for an org
 *   GET  /v1/policy/:orgId     — org policy
 *   PUT  /v1/policy/:orgId     — update org policy
 *
 * All prompt content stays local. Only metadata reaches houndshield.com dashboard.
 */

import express, { type Request, type Response, type NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { queryEvents, getStats } from "./storage.js";
import { setWebhookLicenseKey, flushWebhook } from "./webhook.js";
import { validateLicense } from "./license.js";
import { runOODALoop } from "./ooda/loop.js";
import {
  getQuarantineRows,
  updateQuarantineStatus,
  getOrgPolicyRow,
  upsertOrgPolicyRow,
  getBaselineRow,
} from "./ooda/db.js";
import { DEFAULT_POLICY } from "./ooda/types.js";

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

const OrgPolicyUpdateSchema = z.object({
  warn_before_block: z.boolean().optional(),
  redact_low_risk: z.boolean().optional(),
  max_requests_per_minute: z.number().int().min(1).max(10000).optional(),
  lockout_after_n_blocks: z.number().int().min(1).max(100).optional(),
  lockout_duration_minutes: z.number().int().min(1).max(10080).optional(),
});

// ── App ─────────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json({ limit: "4mb" }));

// ── Health ──────────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    version: "2.0.0",
    source: "houndshield-proxy",
    ooda: true,
  });
});

// ── Main proxy endpoint (OODA loop) ─────────────────────────────────────────

app.post("/v1/chat/completions", async (req: Request, res: Response) => {
  const requestId = uuidv4();

  // Validate license
  const license = await validateLicense(LICENSE_KEY);
  const orgId = license.org_id;

  // Determine upstream provider and credentials
  const providerHeader = req.headers["x-provider"] as Provider | undefined;
  const provider: Provider = providerHeader ?? DEFAULT_PROVIDER;
  const upstreamKey =
    (req.headers["x-provider-api-key"] as string | undefined) ?? UPSTREAM_API_KEY;
  const upstreamUrl = providerEndpoint(provider);

  // Extract user/session identifiers from headers (optional, fallback to org-level)
  const userId = (req.headers["x-user-id"] as string | undefined) ?? orgId;
  const sessionId = (req.headers["x-session-id"] as string | undefined) ?? requestId;

  // Parse and validate request body
  const parsed = ChatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: { message: "Invalid request body", details: parsed.error.errors },
    });
    return;
  }

  const { messages, stream, ...rest } = parsed.data;

  // Run full OODA loop
  await runOODALoop(
    {
      request_id: requestId,
      org_id: orgId,
      user_id: userId,
      session_id: sessionId,
      messages: messages as Array<{ role: string; content: unknown }>,
      provider,
      upstream_key: upstreamKey,
      upstream_url: upstreamUrl,
      stream,
      rest,
    },
    res
  );
});

// ── Local audit endpoints ───────────────────────────────────────────────────

app.get("/v1/events", (req: Request, res: Response) => {
  const limit = Math.min(parseInt((req.query.limit as string) ?? "100", 10), 500);
  const offset = parseInt((req.query.offset as string) ?? "0", 10);
  const action = req.query.action as string | undefined;
  const since = req.query.since as string | undefined;
  res.json({ success: true, data: queryEvents({ limit, offset, action, since }) });
});

app.get("/v1/stats", (_req: Request, res: Response) => {
  res.json({ success: true, data: getStats() });
});

// ── Quarantine management ───────────────────────────────────────────────────

app.get("/v1/quarantine", (req: Request, res: Response) => {
  const orgId = req.query.org_id as string | undefined;
  if (!orgId) {
    res.status(400).json({ error: { message: "org_id query param required" } });
    return;
  }
  const status = (req.query.status as "pending" | "released" | "blocked") ?? "pending";
  const limit = Math.min(parseInt((req.query.limit as string) ?? "100", 10), 500);
  res.json({ success: true, data: getQuarantineRows(orgId, status, limit) });
});

app.put("/v1/quarantine/:requestId", (req: Request, res: Response) => {
  const requestId = req.params.requestId as string;
  const { status, reviewed_by } = req.body as {
    status?: "released" | "blocked";
    reviewed_by?: string;
  };
  if (!status || !["released", "blocked"].includes(status)) {
    res.status(400).json({ error: { message: "status must be 'released' or 'blocked'" } });
    return;
  }
  updateQuarantineStatus(requestId, status, reviewed_by ?? "api");
  res.json({ success: true });
});

// ── Behavioral baseline ─────────────────────────────────────────────────────

app.get("/v1/baselines/:entityId", (req: Request, res: Response) => {
  const entityId = req.params.entityId as string;
  const baseline = getBaselineRow(entityId);
  if (!baseline) {
    res.status(404).json({ error: { message: "No baseline found for this entity" } });
    return;
  }
  res.json({ success: true, data: baseline });
});

// ── Org policy management ───────────────────────────────────────────────────

app.get("/v1/policy/:orgId", (req: Request, res: Response) => {
  const orgId = req.params.orgId as string;
  const policy = getOrgPolicyRow(orgId) ?? { ...DEFAULT_POLICY, org_id: orgId };
  res.json({ success: true, data: policy });
});

app.put("/v1/policy/:orgId", (req: Request, res: Response) => {
  const orgId = req.params.orgId as string;
  const parsed = OrgPolicyUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { message: "Invalid policy", details: parsed.error.errors } });
    return;
  }
  const existing = getOrgPolicyRow(orgId) ?? { ...DEFAULT_POLICY, org_id: orgId };
  const updated = { ...existing, ...parsed.data, org_id: orgId };
  upsertOrgPolicyRow(updated);
  res.json({ success: true, data: updated });
});

// ── Error handler ───────────────────────────────────────────────────────────

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const msg = err instanceof Error ? err.message : "Internal error";
  res.status(500).json({ error: { message: msg, code: "INTERNAL_ERROR" } });
});

// ── Start ────────────────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  console.log(`[houndshield] Proxy v2.0 (OODA) listening on http://localhost:${PORT}`);
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
