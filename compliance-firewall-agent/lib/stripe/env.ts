/**
 * Stripe env plumbing — the ONE place the Stripe keys are read.
 *
 * Born from a real go-live failure: the founder pasted STRIPE_SECRET_KEY into
 * Vercel repeatedly and production kept reading "missing_key". The classic
 * paste failure modes (stray quotes, trailing newline, non-breaking spaces
 * from a password manager, or pasting the whole "STRIPE_SECRET_KEY=sk_..."
 * line into the value box) are all survivable — so survive them here instead
 * of asking a human to paste perfectly.
 *
 * Every reader also gets a DIAGNOSTIC that /api/health can expose safely:
 * it never echoes any part of the configured value — only its shape
 * (missing / malformed / connected) and a plain-English hint.
 */

/** Strip whitespace, wrapping quotes, and an accidental "NAME=" prefix. */
export function sanitizeSecret(raw: string | undefined | null, name: string): string | null {
  if (!raw) return null;
  let v = raw.trim();
  // Whole-line paste: "STRIPE_SECRET_KEY=sk_..." dropped into the value box.
  const prefix = `${name}=`;
  if (v.toUpperCase().startsWith(prefix.toUpperCase())) {
    v = v.slice(prefix.length).trim();
  }
  // Wrapping quotes (possibly doubled: '"sk_..."' from a shell-escaped copy).
  for (let i = 0; i < 2; i++) {
    const first = v[0];
    const last = v[v.length - 1];
    if (v.length >= 2 && first === last && (first === '"' || first === "'" || first === '`')) {
      v = v.slice(1, -1).trim();
    }
  }
  // Non-breaking / zero-width characters that password managers smuggle in.
  v = v.replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, '').trim();
  return v.length > 0 ? v : null;
}

/** The Stripe secret key, cleaned. null when unset/blank. */
export function getStripeSecretKey(): string | null {
  return sanitizeSecret(process.env.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY');
}

/** The Stripe webhook signing secret, cleaned. null when unset/blank. */
export function getStripeWebhookSecret(): string | null {
  return sanitizeSecret(process.env.STRIPE_WEBHOOK_SECRET, 'STRIPE_WEBHOOK_SECRET');
}

export type StripeKeyDiagnostic = {
  /** connected = usable · malformed_key = set but not a Stripe secret · missing_key = unset/blank */
  status: 'connected' | 'malformed_key' | 'missing_key';
  /** Plain-English, value-free hint for the operator. Only set when actionable. */
  hint?: string;
};

/**
 * Shape-only diagnostic for /api/health. NEVER includes any part of the
 * configured value — length and prefix-match booleans only.
 */
export function stripeKeyDiagnostic(): StripeKeyDiagnostic {
  const raw = process.env.STRIPE_SECRET_KEY;
  if (!raw || raw.trim().length === 0) {
    return {
      status: 'missing_key',
      hint:
        'STRIPE_SECRET_KEY is not set for this deployment. In Vercel: project compliance-firewall-agent → Settings → Environment Variables → add it with the Production box checked, then redeploy.',
    };
  }
  const key = getStripeSecretKey();
  if (!key) {
    return {
      status: 'missing_key',
      hint: 'STRIPE_SECRET_KEY is set but contains only whitespace/quotes. Delete it and paste the bare key value.',
    };
  }
  if (key.startsWith('sk_') || key.startsWith('rk_')) {
    // Usable. Mention silently-repaired paste artifacts so the operator knows.
    return raw.trim() === key
      ? { status: 'connected' }
      : { status: 'connected', hint: 'Key contained quotes/whitespace from the paste — auto-cleaned, no action needed.' };
  }
  return {
    status: 'malformed_key',
    hint: `STRIPE_SECRET_KEY is set (${key.length} characters) but does not start with "sk_" — it is not a Stripe secret key. Copy the Secret key from Stripe → Developers → API keys (not the publishable "pk_" key, not a price or product id).`,
  };
}

export type StripeWebhookDiagnostic = {
  /** configured = usable · malformed_secret = set but not a whsec_ value · missing_secret = unset/blank */
  status: 'configured' | 'malformed_secret' | 'missing_secret';
  /** Plain-English, value-free hint for the operator. Only set when actionable. */
  hint?: string;
};

/**
 * Shape-only diagnostic for the webhook signing secret. Matters because a live
 * key without the webhook means a card can be CHARGED but the order is never
 * recorded and no fulfillment alert goes out. Value-free like the key
 * diagnostic — length and prefix booleans only.
 */
export function stripeWebhookDiagnostic(): StripeWebhookDiagnostic {
  const raw = process.env.STRIPE_WEBHOOK_SECRET;
  if (!raw || raw.trim().length === 0) {
    return {
      status: 'missing_secret',
      hint:
        'STRIPE_WEBHOOK_SECRET is not set. Payments can complete but orders will NOT be recorded and no sale alert will be sent. In Stripe: Developers → Webhooks → Add endpoint (https://houndshield.com/api/stripe/webhook), copy the whsec_ signing secret into Vercel project compliance-firewall-agent with the Production box checked, then redeploy.',
    };
  }
  const secret = getStripeWebhookSecret();
  if (!secret) {
    return {
      status: 'missing_secret',
      hint: 'STRIPE_WEBHOOK_SECRET is set but contains only whitespace/quotes. Delete it and paste the bare whsec_ value.',
    };
  }
  if (secret.startsWith('whsec_')) {
    return { status: 'configured' };
  }
  return {
    status: 'malformed_secret',
    hint: `STRIPE_WEBHOOK_SECRET is set (${secret.length} characters) but does not start with "whsec_" — it is not a webhook signing secret. Copy it from Stripe → Developers → Webhooks → your endpoint → Signing secret.`,
  };
}
