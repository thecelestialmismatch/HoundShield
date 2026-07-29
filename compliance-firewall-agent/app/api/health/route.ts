import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isLlmConfigured } from "@/lib/agent/provider";
import { cached } from "@/lib/cache/swr-cache";
import { stripeKeyDiagnostic, stripeWebhookDiagnostic } from "@/lib/stripe/env";
import { passwordResetDiagnostic } from "@/lib/auth/reset-diagnostics";
import { founderInboxDiagnostic } from "@/lib/email/identity";

/**
 * GET /api/health
 *
 * Health check endpoint for monitoring, load balancers, and uptime services.
 * Returns system status without exposing sensitive details.
 *
 * Status pages and uptime monitors poll this constantly, and a million clients
 * polling at once is the textbook "everyone hits the same thing" stampede. The
 * service-status block is computed at most once every few seconds via the
 * single-flight cache; the timestamp/uptime are always fresh so the response
 * never looks frozen.
 */

type Services = Record<string, string>;

function computeServices(): Services {
  // Diagnostic, not just binary: distinguishes unset / malformed / usable so
  // the operator can fix a bad paste without guessing. The hint never
  // contains any part of the configured value (shape + length only).
  const payments = stripeKeyDiagnostic();
  const webhook = stripeWebhookDiagnostic();
  // Password-reset readiness: the send route is enumeration-safe (always 200),
  // so every config failure is otherwise invisible. Value-free (shape/host only).
  const reset = passwordResetDiagnostic();
  // Where human-actionable mail lands. Domain/source only, never the mailbox.
  const founderMail = founderInboxDiagnostic();
  return {
    database: isSupabaseConfigured() ? "connected" : "demo_mode",
    ai_router: isLlmConfigured() ? "connected" : "missing_key",
    payments: payments.status,
    ...(payments.hint ? { payments_hint: payments.hint } : {}),
    payments_webhook: webhook.status,
    ...(webhook.hint ? { payments_webhook_hint: webhook.hint } : {}),
    reset_service_role: reset.service_role,
    reset_resend: reset.resend,
    reset_app_url: reset.app_url,
    ...(reset.app_url_hint ? { reset_app_url_hint: reset.app_url_hint } : {}),
    reset_sender_domain: reset.sender_domain,
    // Where human-actionable mail (the $499 sale alert, warm leads, RPO
    // applications) is delivered. A set-but-malformed FOUNDER_EMAIL is IGNORED by
    // founderInbox() so alerts still land somewhere real — but a silent fallback
    // would hide the typo forever, so it is named here. Value-free: the status
    // says the override is unusable, never what it contains.
    // Domain + source only — /api/health is public and unauthenticated, so it must
    // never print a live mailbox for a harvester to scrape. Same posture as
    // reset_sender_domain above.
    founder_inbox: founderMail.source,
    founder_inbox_domain: founderMail.domain,
    ...(founderMail.broken
      ? {
          founder_inbox_hint:
            "FOUNDER_EMAIL is set but is not a valid email address, so it is being ignored and alerts are falling back to the default mailbox. Fix or remove the variable in Vercel (project compliance-firewall-agent, Production), then redeploy.",
        }
      : {}),
    classifier: "operational",
    quarantine: "operational",
    audit_chain: "operational",
  };
}

export async function GET() {
  // Collapse poll storms: services are recomputed at most once per 5s window,
  // shared across all concurrent callers.
  const services = await cached<Services>("health:services", async () => computeServices(), {
    ttlMs: 5_000,
    staleMs: 30_000,
  });

  const status = {
    status: "healthy",
    version: "1.0.0",
    product: "HoundShield AI Compliance Firewall",
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.round(process.uptime()),
    services,
    environment: process.env.NODE_ENV ?? "development",
  };

  return NextResponse.json(status, {
    headers: { "Cache-Control": "no-cache, no-store" },
  });
}
