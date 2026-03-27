/**
 * Kaelus Secrets Manager
 *
 * Single source of truth for all runtime secrets.
 * Reads from environment variables today; interface is async so it can be
 * swapped to AWS Secrets Manager, HashiCorp Vault, or Vercel Secret Store
 * in future without touching call sites.
 *
 * Rules:
 *  - Never log or expose secret values, only presence/validity
 *  - All accessors are async (future-proof for remote secret stores)
 *  - Validation helpers return boolean, not the secret itself
 */

// ---------------------------------------------------------------------------
// Core secret accessors
// ---------------------------------------------------------------------------

/** Anthropic API key (primary) */
export async function getAnthropicApiKey(): Promise<string | null> {
  return process.env.ANTHROPIC_API_KEY_PRIMARY ?? process.env.ANTHROPIC_API_KEY ?? null;
}

/** OpenAI API key */
export async function getOpenAiApiKey(): Promise<string | null> {
  return process.env.OPENAI_API_KEY ?? null;
}

/** OpenRouter API key */
export async function getOpenRouterApiKey(): Promise<string | null> {
  return process.env.OPENROUTER_API_KEY ?? null;
}

/** Google AI / Gemini API key */
export async function getGoogleApiKey(): Promise<string | null> {
  return process.env.GOOGLE_API_KEY ?? null;
}

/** Stripe secret key */
export async function getStripeSecretKey(): Promise<string | null> {
  return process.env.STRIPE_SECRET_KEY ?? null;
}

/** Stripe webhook signing secret */
export async function getStripeWebhookSecret(): Promise<string | null> {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null;
}

/** Resend transactional email API key */
export async function getResendApiKey(): Promise<string | null> {
  return process.env.RESEND_API_KEY ?? null;
}

/** Supabase service role key (server-only, never expose to client) */
export async function getSupabaseServiceKey(): Promise<string | null> {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}

/** Encryption key for quarantine payloads (must be 64 hex chars / 32 bytes) */
export async function getEncryptionKey(): Promise<string | null> {
  const key = process.env.ENCRYPTION_KEY ?? null;
  if (key && key.length < 64) {
    console.warn("[secrets-manager] ENCRYPTION_KEY is too short (need 64 hex chars)");
    return null;
  }
  return key;
}

// ---------------------------------------------------------------------------
// Synchronous helpers for backward-compat (no async call sites)
// ---------------------------------------------------------------------------

/** Sync accessor — use only in module-level initialization, not in request handlers */
export function getSecretSync(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/** Returns true if all AI provider secrets needed for the compliance engine are present */
export function hasMinimumSecrets(): boolean {
  const hasAI =
    !!(process.env.ANTHROPIC_API_KEY_PRIMARY ?? process.env.ANTHROPIC_API_KEY) ||
    !!process.env.OPENAI_API_KEY ||
    !!process.env.OPENROUTER_API_KEY;

  const hasSupabase =
    !!(process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("https://")) &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  return hasAI && hasSupabase;
}

/** Logs which secrets are configured vs. missing — safe (values never logged) */
export function auditSecrets(): void {
  const checks: Record<string, boolean> = {
    ANTHROPIC_API_KEY:    !!(process.env.ANTHROPIC_API_KEY_PRIMARY ?? process.env.ANTHROPIC_API_KEY),
    OPENAI_API_KEY:       !!process.env.OPENAI_API_KEY,
    OPENROUTER_API_KEY:   !!process.env.OPENROUTER_API_KEY,
    GOOGLE_API_KEY:       !!process.env.GOOGLE_API_KEY,
    STRIPE_SECRET_KEY:    !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET:!!process.env.STRIPE_WEBHOOK_SECRET,
    RESEND_API_KEY:       !!process.env.RESEND_API_KEY,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ENCRYPTION_KEY:       (process.env.ENCRYPTION_KEY?.length ?? 0) >= 64,
  };

  const missing = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
  const present = Object.entries(checks).filter(([, ok]) => ok).map(([k]) => k);

  if (present.length) console.log(`[secrets] ✅ Configured: ${present.join(", ")}`);
  if (missing.length) console.warn(`[secrets] ⚠️  Missing: ${missing.join(", ")}`);
}
