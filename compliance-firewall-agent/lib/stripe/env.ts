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
    // Usable — but a TEST-mode key silently sells nothing: checkout runs in
    // test mode and real customer cards are declined. Say so loudly.
    if (key.startsWith('sk_test_') || key.startsWith('rk_test_')) {
      return {
        status: 'connected',
        hint:
          'This is a TEST-mode key (sk_test_) — checkout will open but every real card will be declined. Fine for the Step-4 dry run; swap in the live "sk_live_" key before selling.',
      };
    }
    // Mention silently-repaired paste artifacts so the operator knows.
    return raw.trim() === key
      ? { status: 'connected' }
      : { status: 'connected', hint: 'Key contained quotes/whitespace from the paste — auto-cleaned, no action needed.' };
  }
  // The exact failure that took checkout down on 2026-07-16: the PUBLISHABLE
  // key pasted into the secret slot. Stripe shows the two keys side by side,
  // both ~107 characters — the publishable one is visible by default, the
  // secret one hides behind "Reveal". Name the mistake precisely.
  if (key.startsWith('pk_')) {
    return {
      status: 'malformed_key',
      hint:
        'STRIPE_SECRET_KEY contains your PUBLISHABLE key (it starts with "pk_"). Stripe shows two look-alike keys — the publishable one is visible by default; the Secret key is the one behind the "Reveal" button (starts with "sk_live_"). Stripe → Developers → API keys → Secret key → Reveal → copy THAT into Vercel (Production box ticked) → redeploy. Check the value starts with "sk_" before saving.',
    };
  }
  if (key.startsWith('whsec_')) {
    return {
      status: 'malformed_key',
      hint:
        'STRIPE_SECRET_KEY contains a webhook signing secret (it starts with "whsec_") — that value belongs in STRIPE_WEBHOOK_SECRET. The two variables are swapped or mis-pasted: STRIPE_SECRET_KEY takes the API Secret key ("sk_live_…") from Stripe → Developers → API keys.',
    };
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
  // Mirror of the pk_-in-the-key-slot failure: an API key pasted into the
  // webhook slot. Name which key landed here so the operator can un-swap.
  if (secret.startsWith('sk_') || secret.startsWith('rk_') || secret.startsWith('pk_')) {
    const kind = secret.startsWith('pk_') ? 'publishable API key ("pk_")' : 'API secret key ("sk_"/"rk_")';
    return {
      status: 'malformed_secret',
      hint: `STRIPE_WEBHOOK_SECRET contains a ${kind} — the wrong kind of secret. The webhook signing secret starts with "whsec_" and lives in Stripe → Developers → Webhooks → your endpoint → Signing secret → Reveal. API keys never go in this variable.`,
    };
  }
  return {
    status: 'malformed_secret',
    hint: `STRIPE_WEBHOOK_SECRET is set (${secret.length} characters) but does not start with "whsec_" — it is not a webhook signing secret. Copy it from Stripe → Developers → Webhooks → your endpoint → Signing secret.`,
  };
}
