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

import { timingSafeEqual } from "node:crypto";

import express, { type Request, type Response, type NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { ChatRequestSchema } from "./schema.js";
import { queryEvents, getStats, verifyChain } from "./storage.js";
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
// Lives in schema.ts so tests can import it without starting the listener.

const OrgPolicyUpdateSchema = z.object({
  warn_before_block: z.boolean().optional(),
  redact_low_risk: z.boolean().optional(),
  max_requests_per_minute: z.number().int().min(1).max(10000).optional(),
  lockout_after_n_blocks: z.number().int().min(1).max(100).optional(),
  lockout_duration_minutes: z.number().int().min(1).max(10080).optional(),
});

/*
 * Admin token for management and audit routes.
 *
 * This used to default to HOUNDSHIELD_LICENSE_KEY "so single-tenant Docker
 * deployments work out of the box". The cost of that convenience: ONE secret
 * both authenticated the product and administered it, so a licence key shared
 * with a contractor, pasted into a ticket, or read out of `docker inspect` also
 * released quarantined CUI and rewrote the customer's detection policy.
 *
 * The fallback is kept — removing it would break every existing install on
 * upgrade — but it is no longer silent. `credentialsAreSeparated` is reported
 * by /health so an assessor can see the control state, and startup warns once.
 */
const ADMIN_TOKEN = process.env.HOUNDSHIELD_ADMIN_TOKEN ?? LICENSE_KEY;
const ADMIN_TOKEN_IS_SHARED_WITH_LICENSE =
  !process.env.HOUNDSHIELD_ADMIN_TOKEN && LICENSE_KEY !== "";

if (ADMIN_TOKEN_IS_SHARED_WITH_LICENSE) {
  console.warn(
    "[houndshield] HOUNDSHIELD_ADMIN_TOKEN not set — falling back to the licence key. " +
      "One secret now both licenses and administers this proxy. Set HOUNDSHIELD_ADMIN_TOKEN " +
      "to a separate value so a leaked licence key cannot release quarantined CUI."
  );
}

// ── App ─────────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json({ limit: "4mb" }));

/**
 * Guard for mutating/management endpoints (audit H5).
 *
 * Previously only POST /v1/chat/completions validated the license; the
 * quarantine-release and policy-update routes had NO auth, so anyone with
 * network reach to the container could release quarantined CUI or weaken the
 * customer's own detection policy. Require the admin token on every such route.
 */
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const provided =
    (req.headers["x-admin-token"] as string | undefined) ??
    (req.headers["x-license-key"] as string | undefined) ??
    "";
  if (!ADMIN_TOKEN || !safeEqual(provided, ADMIN_TOKEN)) {
    res.status(401).json({ error: { message: "Unauthorized — x-admin-token required" } });
    return;
  }
  next();
}

/**
 * Constant-time string compare.
 *
 * `provided !== ADMIN_TOKEN` short-circuits on the first differing byte, which
 * leaks the token prefix to anyone who can time the 401. The proxy is bound to
 * loopback by default, but "bound to loopback" is a deployment property the
 * customer controls, not a property of this code — so the comparison does not
 * rely on it. Lengths are compared first because timingSafeEqual throws on a
 * length mismatch; the length of an admin token is not the secret.
 */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// ── Health ──────────────────────────────────────────────────────────────────

/*
 * Liveness AND the control state an assessor asks about, with nothing that
 * identifies the customer: no org id, no counts, no hostnames, no key material.
 * `licence_source` names HOW entitlement was established, which is exactly the
 * question "is this box actually licensed, or is it coasting on an unplugged
 * network?" — the question the old offline branch made unanswerable.
 */
app.get("/health", async (_req: Request, res: Response) => {
  const license = await validateLicense(LICENSE_KEY);
  res.json({
    status: "ok",
    version: "2.0.0",
    source: "houndshield-proxy",
    ooda: true,
    licence_source: license.source ?? "unknown",
    licence_valid: license.valid,
    audit_chain: "sha256-linked",
    admin_credentials_separated: !ADMIN_TOKEN_IS_SHARED_WITH_LICENSE,
  });
});

// ── Main proxy endpoint (OODA loop) ─────────────────────────────────────────

app.post("/v1/chat/completions", async (req: Request, res: Response) => {
  const requestId = uuidv4();

  /*
   * Validate licence — and ACT on the result.
   *
   * This read `license.org_id` and never looked at `license.valid`, so the
   * field was computed on every request and discarded. Combined with the
   * offline branch in license.ts that minted `plan: "pro"` on any network
   * failure, entitlement was unenforceable by construction.
   *
   * The split below is the one that matters: NO key configured is evaluation
   * mode and still serves (the free demo and Mode C trials depend on it, and
   * hard-gating the open-source proxy is a pricing decision, not a security
   * fix). A key that is configured but does not verify is refused — someone
   * who set a licence key expects it to mean something.
   */
  const license = await validateLicense(LICENSE_KEY);
  if (LICENSE_KEY && !license.valid) {
    res.status(402).json({
      error: {
        message:
          "Licence could not be verified. Check HOUNDSHIELD_LICENSE_KEY, or for an " +
          "air-gapped deployment set HOUNDSHIELD_OFFLINE_LICENSE and HOUNDSHIELD_LICENSE_PUBLIC_KEY.",
        code: "LICENSE_UNVERIFIED",
        licence_source: license.source ?? "unknown",
      },
    });
    return;
  }
  const orgId = license.org_id || (LICENSE_KEY ? "unknown" : "evaluation");
  res.setHeader("X-HoundShield-Licence", license.source ?? "unknown");

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
      error: { message: "Invalid request body", details: parsed.error.issues },
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

app.get("/v1/events", requireAdmin, (req: Request, res: Response) => {
  const limit = Math.min(parseInt((req.query.limit as string) ?? "100", 10), 500);
  const offset = parseInt((req.query.offset as string) ?? "0", 10);
  const action = req.query.action as string | undefined;
  const since = req.query.since as string | undefined;
  res.json({ success: true, data: queryEvents({ limit, offset, action, since }) });
});

/*
 * Guarded (audit 1.3). This route and /v1/baselines were the only two reads
 * with no auth: every other management route already required the admin token.
 * Event volume, block counts and last-seen leak the customer's AI usage
 * profile, and the behavioural baseline route leaked it per entity id.
 */
app.get("/v1/stats", requireAdmin, (_req: Request, res: Response) => {
  res.json({ success: true, data: getStats() });
});

/**
 * GET /v1/audit/verify — recompute the whole hash chain.
 *
 * This is the endpoint that makes the tamper-evident claim checkable by the
 * party who cares: the customer, inside their own boundary, without sending a
 * single event to us. `tip_hash` is the value to anchor externally (print it,
 * mail it, commit it) if they want evidence the log has not been rewound.
 */
app.get("/v1/audit/verify", requireAdmin, (_req: Request, res: Response) => {
  const result = verifyChain();
  res.status(result.ok ? 200 : 409).json({ success: result.ok, data: result });
});

// ── Quarantine management ───────────────────────────────────────────────────

app.get("/v1/quarantine", requireAdmin, (req: Request, res: Response) => {
  const orgId = req.query.org_id as string | undefined;
  if (!orgId) {
    res.status(400).json({ error: { message: "org_id query param required" } });
    return;
  }
  const status = (req.query.status as "pending" | "released" | "blocked") ?? "pending";
  const limit = Math.min(parseInt((req.query.limit as string) ?? "100", 10), 500);
  res.json({ success: true, data: getQuarantineRows(orgId, status, limit) });
});

app.put("/v1/quarantine/:requestId", requireAdmin, (req: Request, res: Response) => {
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

app.get("/v1/baselines/:entityId", requireAdmin, (req: Request, res: Response) => {
  const entityId = req.params.entityId as string;
  const baseline = getBaselineRow(entityId);
  if (!baseline) {
    res.status(404).json({ error: { message: "No baseline found for this entity" } });
    return;
  }
  res.json({ success: true, data: baseline });
});

// ── Org policy management ───────────────────────────────────────────────────

app.get("/v1/policy/:orgId", requireAdmin, (req: Request, res: Response) => {
  const orgId = req.params.orgId as string;
  const policy = getOrgPolicyRow(orgId) ?? { ...DEFAULT_POLICY, org_id: orgId };
  res.json({ success: true, data: policy });
});

app.put("/v1/policy/:orgId", requireAdmin, (req: Request, res: Response) => {
  const orgId = req.params.orgId as string;
  const parsed = OrgPolicyUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { message: "Invalid policy", details: parsed.error.issues } });
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
