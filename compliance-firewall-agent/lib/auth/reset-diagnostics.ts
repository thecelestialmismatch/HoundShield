/**
 * reset-diagnostics — value-free password-reset readiness for /api/health.
 *
 * WHY THIS EXISTS: the reset send route (`app/api/auth/reset-password/route.ts`)
 * is enumeration-safe by design — it ALWAYS answers 200 and the UI always shows
 * "check your email", whether or not mail was actually sent. Every real-world
 * failure (missing service-role key, unset RESEND_API_KEY, a stale
 * NEXT_PUBLIC_APP_URL pointing at the old kaelus.ai host, an unverified Resend
 * sender domain) is therefore INVISIBLE from the browser. This is the loop that
 * kept "password reset is broken" alive across many sessions: the fixes were in
 * code; the breakage was in config, and nothing surfaced which knob was wrong.
 *
 * These checks report presence / shape / host ONLY. They never emit any part of
 * a secret value — a leak here would be worse than the bug. Guard: the unit
 * tests assert no configured secret substring ever appears in the output.
 */
import { RESET_SENDER_DOMAIN } from "./auth-emails";

export interface ResetDiagnostic {
  /** SUPABASE_SERVICE_ROLE_KEY present + plausible (needed by admin.generateLink). */
  service_role: "set" | "missing";
  /** RESEND_API_KEY present + plausible (the actual sender of the reset email). */
  resend: "set" | "missing";
  /** NEXT_PUBLIC_APP_URL sanity — the base the emailed confirm link is built on. */
  app_url: "ok" | "default" | "suspect";
  /** Present only when app_url is default/suspect — a value-free next step. */
  app_url_hint?: string;
  /** The host the reset email is sent FROM — must be a verified Resend domain. */
  sender_domain: string;
}

function classifyServiceRole(): "set" | "missing" {
  const k = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  // JWT service keys are long (eyJ…) as are the newer sb_secret_… keys. Reject
  // obvious placeholders. Length + placeholder only — never the value itself.
  return k.length > 20 && !k.toLowerCase().includes("your-") ? "set" : "missing";
}

function classifyResend(): "set" | "missing" {
  const k = (process.env.RESEND_API_KEY ?? "").trim();
  // Resend keys are prefixed re_. Accept that shape; reject empty/placeholder.
  return k.startsWith("re_") && k.length > 10 ? "set" : "missing";
}

function classifyAppUrl(): { status: "ok" | "default" | "suspect"; hint?: string } {
  const raw = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
  if (!raw) {
    return {
      status: "default",
      hint: "unset — links use the https://houndshield.com fallback; set NEXT_PUBLIC_APP_URL to be explicit",
    };
  }
  let host: string;
  try {
    host = new URL(raw).host.toLowerCase();
  } catch {
    return { status: "suspect", hint: "not a valid URL — set it to https://houndshield.com" };
  }
  // The host is a public URL, never a secret, so it is safe to name in the hint.
  if (host.includes("kaelus")) {
    return { status: "suspect", hint: `points at the old "${host}" host — set NEXT_PUBLIC_APP_URL to https://houndshield.com` };
  }
  if (host === "localhost" || host.startsWith("localhost:") || host.startsWith("127.")) {
    return { status: "suspect", hint: `points at "${host}" — set it to https://houndshield.com in production` };
  }
  if (host.endsWith(".vercel.app")) {
    return { status: "suspect", hint: `points at a Vercel preview host "${host}" — set it to https://houndshield.com` };
  }
  if (host === "houndshield.com" || host === "www.houndshield.com") {
    return { status: "ok" };
  }
  return { status: "suspect", hint: `unexpected host "${host}" — expected houndshield.com` };
}

export function passwordResetDiagnostic(): ResetDiagnostic {
  const appUrl = classifyAppUrl();
  return {
    service_role: classifyServiceRole(),
    resend: classifyResend(),
    app_url: appUrl.status,
    ...(appUrl.hint ? { app_url_hint: appUrl.hint } : {}),
    sender_domain: RESET_SENDER_DOMAIN,
  };
}
