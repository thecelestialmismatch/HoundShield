import { NextRequest, NextResponse } from "next/server";
import {
  calculateCost,
  detectProvider,
  PROVIDER_BASE_URLS,
  type Provider,
} from "@/lib/providers/pricing";
import { checkBudget, fireAlert } from "@/lib/budget/enforce";
import { createServiceClient } from "@/lib/supabase/server";

// Attribution headers clients attach to identify who made the request
const ATTR_USER_HEADER = "x-user-id";
const ATTR_PROJECT_HEADER = "x-project-id";
const ATTR_ORG_HEADER = "x-org-id";

// Headers stripped before forwarding (internal to AIBudgetGuard)
const INTERNAL_HEADERS = new Set([
  ATTR_USER_HEADER,
  ATTR_PROJECT_HEADER,
  ATTR_ORG_HEADER,
]);

interface RouteParams {
  params: Promise<{ path: string[] }>;
}

async function handleProxy(req: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  const upstreamPath = "/" + path.join("/");

  // Read attribution from request headers
  const orgId = req.headers.get(ATTR_ORG_HEADER);
  const userId = req.headers.get(ATTR_USER_HEADER) ?? "anonymous";
  const projectId = req.headers.get(ATTR_PROJECT_HEADER) ?? "default";

  // Require org ID — without it we can't attribute cost or enforce budgets
  if (!orgId) {
    return NextResponse.json(
      {
        error:
          "Missing required header: x-org-id. Get your org ID from aibudgetguard.com/dashboard/settings.",
      },
      { status: 400 }
    );
  }

  // Parse body once — needed for model detection and forwarding
  let body: unknown;
  let rawBody: string | null = null;
  try {
    rawBody = await req.text();
    body = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Detect provider from model field
  const modelId =
    body && typeof body === "object" && "model" in body
      ? String((body as Record<string, unknown>).model)
      : null;

  const provider: Provider | null = modelId ? detectProvider(modelId) : null;

  if (!provider) {
    return NextResponse.json(
      {
        error:
          "Cannot detect provider from 'model' field. Supported: gpt-*, claude-*, gemini-*.",
      },
      { status: 400 }
    );
  }

  // ── Budget enforcement ────────────────────────────────────────────────────
  const budget = await checkBudget(orgId);

  // Fire Slack alert asynchronously — never blocks the response
  if (budget.alertPayload) {
    fireAlert(budget.alertPayload);
  }

  if (!budget.allowed) {
    const resetDate = new Date();
    resetDate.setMonth(resetDate.getMonth() + 1, 1);
    resetDate.setHours(0, 0, 0, 0);

    // Record the blocked attempt before returning 429
    void recordUsage({
      orgId,
      userId,
      projectId,
      modelId: modelId!,
      provider,
      cost: { costUsd: 0, modelId: modelId!, provider, known: true },
      inputTokens: 0,
      outputTokens: 0,
      blocked: true,
    });

    return NextResponse.json(
      {
        error: "Budget exceeded",
        message: `This org has reached its AI spending limit ($${budget.limitUsd?.toFixed(2)}). ` +
          `Current spend: $${budget.usedUsd.toFixed(4)} (${budget.pctUsed?.toFixed(1)}%). ` +
          `Budget resets ${resetDate.toISOString().split("T")[0]}. ` +
          `Increase limit at aibudgetguard.com/dashboard/budget.`,
        used_usd: budget.usedUsd,
        limit_usd: budget.limitUsd,
        pct_used: budget.pctUsed,
      },
      { status: 429 }
    );
  }

  // ── Forward to upstream ───────────────────────────────────────────────────
  const upstreamBase = PROVIDER_BASE_URLS[provider];
  const upstreamUrl = `${upstreamBase}${upstreamPath}${req.nextUrl.search}`;

  // Build forwarded headers — strip internal attribution headers
  const forwardHeaders = new Headers();
  req.headers.forEach((value, key) => {
    if (!INTERNAL_HEADERS.has(key.toLowerCase())) {
      forwardHeaders.set(key, value);
    }
  });
  if (rawBody) {
    forwardHeaders.set("content-type", "application/json");
  }

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstreamUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: rawBody || undefined,
    });
  } catch (err) {
    console.error("[proxy] upstream fetch error", { upstreamUrl, err });
    return NextResponse.json(
      { error: "Failed to reach upstream provider" },
      { status: 502 }
    );
  }

  const upstreamBody = await upstreamRes.text();

  // ── Record usage ──────────────────────────────────────────────────────────
  if (upstreamRes.ok && modelId) {
    try {
      const parsed = JSON.parse(upstreamBody);
      const usage = parsed?.usage;
      if (usage) {
        const cost = calculateCost(modelId, {
          inputTokens: usage.prompt_tokens ?? usage.input_tokens ?? 0,
          outputTokens: usage.completion_tokens ?? usage.output_tokens ?? 0,
          cachedInputTokens: usage.prompt_tokens_details?.cached_tokens,
        });
        void recordUsage({
          orgId,
          userId,
          projectId,
          modelId,
          provider,
          cost,
          inputTokens: usage.prompt_tokens ?? usage.input_tokens ?? 0,
          outputTokens: usage.completion_tokens ?? usage.output_tokens ?? 0,
          blocked: false,
        });
      }
    } catch {
      // Streaming or non-JSON response — skip usage recording
    }
  }

  // Return upstream response to client
  const resHeaders = new Headers(upstreamRes.headers);
  resHeaders.delete("transfer-encoding");

  return new NextResponse(upstreamBody, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}

async function recordUsage(event: {
  orgId: string;
  userId: string;
  projectId: string;
  modelId: string;
  provider: Provider;
  cost: ReturnType<typeof calculateCost>;
  inputTokens: number;
  outputTokens: number;
  blocked: boolean;
}): Promise<void> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("usage_events").insert({
      org_id: event.orgId,
      user_id: event.userId,
      project_id: event.projectId,
      model_id: event.modelId,
      provider: event.provider,
      input_tokens: event.inputTokens,
      output_tokens: event.outputTokens,
      cost_usd: event.cost.costUsd,
      blocked: event.blocked,
    });
    if (error) {
      console.error("[usage] insert failed", error);
    }
  } catch (err) {
    console.error("[usage] unexpected error", err);
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
