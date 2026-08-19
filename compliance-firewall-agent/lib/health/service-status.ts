import { isSupabaseConfigured, createServiceClient } from "@/lib/supabase/client";
import { isLlmConfigured } from "@/lib/agent/provider";
import { stripeKeyDiagnostic, stripeWebhookDiagnostic } from "@/lib/stripe/env";
import { idleEnforcementMode, IDLE_TIMEOUT_MS } from "@/lib/auth/idle-session";
import { passwordResetDiagnostic } from "@/lib/auth/reset-diagnostics";
import { founderInboxDiagnostic } from "@/lib/email/identity";
import { marketingBlockReason } from "@/lib/legal/marketing-email";

/**
 * What /api/health reports, and which of it means a control is actually doing
 * its job.
 *
 * TWO DEFECTS THIS MODULE EXISTS TO CLOSE.
 *
 * 1. Three of the reported services were string literals — `classifier`,
 *    `quarantine` and `audit_chain` were each hardcoded `"operational"`. They
 *    described nothing and could never go red. `tasks/lessons.md` records the
 *    rule the hard way: a display fed by a constant gets deleted, not re-plumbed
 *    through an HTTP round trip, because "an HTTP round trip is not evidence".
 *    They are gone. `app/command-center/(tools)/_shell/Topbar.tsx` deleted its
 *    status pill for exactly this reason and carries a `ponytail:` marker
 *    pointing here; that marker is now discharged.
 *
 * 2. Audit finding #20c — three security controls FAIL OPEN and say nothing:
 *      • lib/rate-limit-shared.ts:149  no bucket table  -> per-instance counting
 *      • lib/auth/lockout.ts:117,146   no lockout table -> no account lockout
 *      • lib/auth/captcha.ts           no Turnstile key -> challenge fails CLOSED
 *    The first two controls can degrade under datastore failure; CAPTCHA and
 *    recovery-code configuration are release-critical and now fail closed once
 *    reached. Every such condition is nevertheless reported here: an operator
 *    needs a precise remediation signal, not a generic red health light.
 *
 * WHY `degraded` IS COMPUTED HERE AND NOT BY THE READER. `app/status/page.tsx`
 * used to decide what "operational" meant with its own local
 * `new Set(["operational","connected","healthy"])`. The vocabulary had long
 * since outgrown it — `passwordResetDiagnostic()` emits "set"/"ok"/"suspect",
 * `founderInboxDiagnostic()` emits "override"/"default" and a bare domain
 * string — so the public status page put a warning triangle next to a row
 * reading "houndshield.com" and said "Some services need attention"
 * permanently, whatever the truth was. One producer now names the degraded
 * keys and every reader is told rather than guessing.
 *
 * VALUE-FREE, ALWAYS. /api/health is public and unauthenticated. Every status
 * below is derived from the SHAPE or PRESENCE of configuration, never its
 * content, matching the posture already set by `stripeKeyDiagnostic()`.
 */

export type Services = Record<string, string>;

export interface HealthReport {
  services: Services;
  /** Service keys whose control is not currently doing its job. Empty = healthy. */
  degraded: string[];
}

/** Hex-key length the quarantine cipher requires (32 bytes → 64 hex chars). */
const ENCRYPTION_KEY_HEX_LENGTH = 64;

/**
 * The tables and PRIMARY-KEY COLUMNS the probes below select.
 *
 * Named as constants, and pinned against the migration DDL by
 * `__tests__/service-status.test.ts`, because getting one wrong is invisible:
 * a bad column name makes PostgREST return an error, the probe catches it, and
 * the endpoint reports the control as DEGRADED. The failure mode of a
 * misspelled probe is therefore a false outage, which is a worse lie than the
 * hardcoded "operational" this module was written to delete.
 *
 * That is not hypothetical. The first version of this file selected "key" from
 * rate_limit_buckets, whose primary key is `bucket_key`. It shipped, and
 * production reported `rate_limit_store: degraded_local` while shared rate
 * limiting was working perfectly — caught only by reading the live endpoint
 * after deploy.
 */
const RATE_LIMIT_TABLE = "rate_limit_buckets";
const RATE_LIMIT_COLUMN = "bucket_key";
const LOCKOUT_TABLE = "auth_lockouts";
const LOCKOUT_COLUMN = "email_hash";
const OPT_OUT_TABLE = "profiles";
const OPT_OUT_COLUMN = "marketing_opt_out_at";

/** Exposed so the guard can pin these against the migration DDL. */
export const PROBED_TABLES = {
  [RATE_LIMIT_TABLE]: RATE_LIMIT_COLUMN,
  [LOCKOUT_TABLE]: LOCKOUT_COLUMN,
  [OPT_OUT_TABLE]: OPT_OUT_COLUMN,
} as const;

/**
 * Can the shared rate-limit store be reached?
 *
 * Read-only on purpose. The obvious probe — calling the `consume_rate_limit`
 * RPC — would spend a token from a real bucket on every poll, so the health
 * check would become a small denial of service against itself. A HEAD count
 * against the table detects the failure that actually occurs (migration 028
 * never applied, or Postgres unreachable), which is the exact condition
 * `lib/rate-limit-shared.ts` degrades on.
 *
 * ponytail: table reachability, not RPC correctness. A present table with a
 * broken function body would still read `shared` here. Probe the RPC directly
 * if that failure ever shows up in practice — it needs a bucket key the
 * limiter never uses, so it is more code than it is worth today.
 */
async function rateLimitStore(): Promise<string> {
  if (!isSupabaseConfigured()) return "not_configured";
  try {
    const { error } = await createServiceClient()
      .from(RATE_LIMIT_TABLE)
      .select(RATE_LIMIT_COLUMN, { count: "exact", head: true })
      .limit(1);
    if (error) throw new Error(error.message);
    return "shared";
  } catch {
    // Same fallback the limiter itself takes: still bounded per instance, so a
    // flood is slowed rather than ignored — but the real ceiling is
    // (limit x live instances) and it resets on every cold start.
    return "degraded_local";
  }
}

/** Is account lockout backed by a store, or is every failed login forgotten? */
async function authLockoutStore(): Promise<string> {
  if (!isSupabaseConfigured()) return "not_configured";
  try {
    const { error } = await createServiceClient()
      .from(LOCKOUT_TABLE)
      .select(LOCKOUT_COLUMN, { count: "exact", head: true })
      .limit(1);
    if (error) throw new Error(error.message);
    return "enforcing";
  } catch {
    // lockout.ts returns DEGRADED and lets the attempt through. Credential
    // stuffing is unbounded in this state.
    return "degraded_open";
  }
}

/**
 * Can an unsubscribe be RECORDED?
 *
 * Migration 034 adds `profiles.marketing_opt_out_at`, and it is not applied to
 * production yet. That creates an ordering trap with a silent failure mode: the
 * moment MARKETING_POSTAL_ADDRESS is set, the CAN-SPAM gate opens and the drip
 * starts selecting a column that does not exist. PostgREST errors, processDayN
 * throws, `Promise.allSettled` records it, and the run reports nothing sent —
 * a drip that looks configured and is silently dark.
 *
 * It fails in the safe direction (no unlawful mail), but silence is exactly
 * what this module exists to stop, and the fix is one migration. Probed
 * separately from the env check because the two failures have different
 * remedies and an operator should not have to guess which one they have.
 */
async function marketingOptOutStore(): Promise<string> {
  if (!isSupabaseConfigured()) return "not_configured";
  try {
    const { error } = await createServiceClient()
      .from(OPT_OUT_TABLE)
      .select(OPT_OUT_COLUMN, { count: "exact", head: true })
      .limit(1);
    if (error) throw new Error(error.message);
    return "enforcing";
  } catch {
    return "missing_migration";
  }
}

/** Turnstile is a required escalation control; a missing secret fails closed. */
function captcha(): string {
  return (process.env.TURNSTILE_SECRET_KEY ?? "").trim() ? "enforcing" : "not_configured";
}

/** Recovery-code HMAC material is presence-only: values never reach this endpoint. */
function resetCodePepper(): string {
  return (process.env.AUTH_RESET_CODE_PEPPER ?? "").trim() ? "set" : "not_configured";
}

/**
 * Quarantine encryption. Unlike the three above this one fails CLOSED —
 * `lib/quarantine/encryption.ts:11-17` throws without a 64-hex key, so a
 * quarantine write fails rather than storing a flagged prompt in the clear.
 * Reported anyway: the operator should learn that quarantine is unavailable
 * from a status page, not from an exception in production.
 */
function quarantineEncryption(): string {
  const key = (process.env.ENCRYPTION_KEY ?? "").trim();
  return key.length === ENCRYPTION_KEY_HEX_LENGTH && /^[0-9a-fA-F]+$/.test(key)
    ? "enabled"
    : "unavailable";
}

/**
 * Values that mean "this control is doing its job". Everything else in a
 * non-hint key counts as degraded.
 *
 * `_hint` keys are prose written for an operator, never a state — they are
 * attached to a parent key that already carries the state, so they are excluded
 * rather than being permanently unmatched (which is what made the old page
 * alarm on its own explanatory text).
 */
const OPERATIONAL_VALUES = new Set([
  // Pre-existing vocabulary
  "connected",
  "operational",
  "healthy",
  "set",
  "ok",
  // Control vocabulary added here
  "shared",
  "enforcing",
  "enabled",
]);

/** Keys that carry operator prose rather than a control state. */
export function isHintKey(key: string): boolean {
  return key.endsWith("_hint");
}

/**
 * Keys that describe a deployment fact rather than a control that can fail.
 * `founder_inbox` is "override" or "default" — both are working states, and a
 * broken override is reported through `founder_inbox_hint` instead.
 */
const INFORMATIONAL_KEYS = new Set([
  "reset_sender_domain",
  "founder_inbox",
  "founder_inbox_domain",
]);

export function isOperationalValue(value: string): boolean {
  return OPERATIONAL_VALUES.has(value);
}

/** The service keys whose control is not doing its job. */
export function degradedKeys(services: Services): string[] {
  return Object.entries(services)
    .filter(([key]) => !isHintKey(key) && !INFORMATIONAL_KEYS.has(key))
    .filter(([, value]) => !isOperationalValue(value))
    .map(([key]) => key);
}

/**
 * Build the full report. Never throws — a health endpoint that 500s during an
 * incident is the one time it had a job to do.
 */
export async function buildHealthReport(): Promise<HealthReport> {
  const payments = stripeKeyDiagnostic();
  const webhook = stripeWebhookDiagnostic();
  const reset = passwordResetDiagnostic();
  const founderMail = founderInboxDiagnostic();

  // All three probes hit the same database; run them together rather than
  // serially — this endpoint is polled by uptime monitors.
  const [rateLimit, lockout, optOut] = await Promise.all([
    rateLimitStore(),
    authLockoutStore(),
    marketingOptOutStore(),
  ]);
  const captchaState = captcha();
  const resetPepper = resetCodePepper();
  const marketingBlocked = marketingBlockReason();
  const encryptionState = quarantineEncryption();
  const idleState = idleEnforcementMode(process.env);

  const services: Services = {
    database: isSupabaseConfigured() ? "connected" : "demo_mode",
    ai_router: isLlmConfigured() ? "connected" : "missing_key",
    payments: payments.status,
    ...(payments.hint ? { payments_hint: payments.hint } : {}),
    payments_webhook: webhook.status,
    ...(webhook.hint ? { payments_webhook_hint: webhook.hint } : {}),
    reset_service_role: reset.service_role,
    reset_resend: reset.resend,
    reset_code_pepper: resetPepper,
    ...(resetPepper !== "set"
      ? {
          reset_code_pepper_hint:
            "AUTH_RESET_CODE_PEPPER is not set. Password-reset code issuance is disabled rather than storing an unkeyed recovery secret. Add a 32-byte-or-more random value in Vercel before enabling production reset.",
        }
      : {}),
    reset_app_url: reset.app_url,
    ...(reset.app_url_hint ? { reset_app_url_hint: reset.app_url_hint } : {}),
    reset_sender_domain: reset.sender_domain,
    founder_inbox: founderMail.source,
    founder_inbox_domain: founderMail.domain,
    ...(founderMail.broken
      ? {
          founder_inbox_hint:
            "FOUNDER_EMAIL is set but is not a valid email address, so it is being ignored and alerts are falling back to the default mailbox. Fix or remove the variable in Vercel (project compliance-firewall-agent, Production), then redeploy.",
        }
      : {}),

    // Security controls that can be entirely absent while everything else reads
    // green. Audit finding #20c.
    rate_limit_store: rateLimit,
    ...(rateLimit !== "shared"
      ? {
          rate_limit_store_hint:
            rateLimit === "not_configured"
              ? "No database is configured, so request rate limiting counts in a per-process map only."
              : "The shared rate-limit bucket table is unreachable, so limits count per instance and reset on every cold start. Apply supabase/migrations/028_rate_limit_buckets.sql.",
        }
      : {}),
    auth_lockout_store: lockout,
    ...(lockout !== "enforcing"
      ? {
          auth_lockout_store_hint:
            lockout === "not_configured"
              ? "No database is configured, so repeated failed sign-ins are not counted and no account can lock."
              : "The lockout table is unreachable, so failed sign-ins are not counted and brute-force attempts are unbounded. Apply supabase/migrations/031_auth_lockouts.sql.",
        }
      : {}),
    // Automatic logoff (NIST 800-171 3.1.11 / HIPAA §164.312(a)(2)(iii)).
    // Reported for the same reason as `captcha` above: an access control that
    // is silently not running is indistinguishable from one that is, and this
    // one is evidence an assessor asks for.
    idle_logout: idleState === "enforced" ? "enforcing" : idleState,
    ...(idleState !== "enforced"
      ? {
          idle_logout_hint:
            `No server secret is available to sign the activity stamp, so sessions are NOT terminated after ${Math.round(IDLE_TIMEOUT_MS / 60000)} minutes of inactivity. Set BETTER_AUTH_SECRET (or ensure SUPABASE_SERVICE_ROLE_KEY is set) and redeploy.`,
        }
      : {}),
    captcha: captchaState,
    ...(captchaState !== "enforcing"
      ? {
          captcha_hint:
            "TURNSTILE_SECRET_KEY is not set. Escalated authentication challenges fail closed; set the secret and matching NEXT_PUBLIC_TURNSTILE_SITE_KEY before release.",
        }
      : {}),
    // Onboarding email. NOT a control failing open — it fails CLOSED by design
    // (CAN-SPAM 15 U.S.C. 7704). Reported because the operator otherwise has no
    // way to learn the drip is silently sending nothing, and the fix is one
    // environment variable.
    marketing_email: marketingBlocked === null ? "enabled" : "disabled",
    ...(marketingBlocked ? { marketing_email_hint: marketingBlocked } : {}),
    // The other half of the same control: an opt-out that cannot be STORED
    // cannot be honoured within the 10 business days 7704(a)(4) allows.
    marketing_opt_out_store: optOut,
    ...(optOut !== "enforcing"
      ? {
          marketing_opt_out_store_hint:
            optOut === "not_configured"
              ? "No database is configured, so an unsubscribe cannot be recorded."
              : `The ${OPT_OUT_TABLE}.${OPT_OUT_COLUMN} column is unreachable, so unsubscribe requests cannot be recorded and the onboarding drip will fail on every run once it is enabled. Apply supabase/migrations/034_marketing_opt_out.sql BEFORE setting MARKETING_POSTAL_ADDRESS.`,
        }
      : {}),
    quarantine_encryption: encryptionState,
    ...(encryptionState !== "enabled"
      ? {
          quarantine_encryption_hint:
            "ENCRYPTION_KEY is missing or is not 64 hex characters. Quarantine writes fail closed rather than storing a flagged prompt unencrypted — generate one with: openssl rand -hex 32",
        }
      : {}),
  };

  return { services, degraded: degradedKeys(services) };
}
