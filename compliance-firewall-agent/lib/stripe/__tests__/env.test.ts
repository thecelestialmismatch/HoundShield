/**
 * The Stripe key reader must survive every classic paste failure mode — the
 * founder pasted the key into Vercel repeatedly and production kept reading
 * "missing_key". These tests pin the sanitizer and the value-free diagnostic
 * that /api/health now exposes.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  sanitizeSecret,
  getStripeSecretKey,
  getStripeWebhookSecret,
  stripeKeyDiagnostic,
  stripeWebhookDiagnostic,
} from '@/lib/stripe/env';

const KEY = 'sk_live_a1b2c3d4e5f6';

const saved: Record<string, string | undefined> = {};
beforeEach(() => {
  saved.k = process.env.STRIPE_SECRET_KEY;
  saved.w = process.env.STRIPE_WEBHOOK_SECRET;
});
afterEach(() => {
  if (saved.k === undefined) delete process.env.STRIPE_SECRET_KEY;
  else process.env.STRIPE_SECRET_KEY = saved.k;
  if (saved.w === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
  else process.env.STRIPE_WEBHOOK_SECRET = saved.w;
});

describe('sanitizeSecret — survives every classic paste failure', () => {
  it('passes a clean key through untouched', () => {
    expect(sanitizeSecret(KEY, 'STRIPE_SECRET_KEY')).toBe(KEY);
  });

  it('strips whitespace and trailing newlines', () => {
    expect(sanitizeSecret(`  ${KEY}\n`, 'STRIPE_SECRET_KEY')).toBe(KEY);
  });

  it('strips wrapping quotes — single, double, backtick, even doubled', () => {
    expect(sanitizeSecret(`"${KEY}"`, 'STRIPE_SECRET_KEY')).toBe(KEY);
    expect(sanitizeSecret(`'${KEY}'`, 'STRIPE_SECRET_KEY')).toBe(KEY);
    expect(sanitizeSecret('`' + KEY + '`', 'STRIPE_SECRET_KEY')).toBe(KEY);
    expect(sanitizeSecret(`'"${KEY}"'`, 'STRIPE_SECRET_KEY')).toBe(KEY);
  });

  it('strips a whole-line "NAME=value" paste, case-insensitively', () => {
    expect(sanitizeSecret(`STRIPE_SECRET_KEY=${KEY}`, 'STRIPE_SECRET_KEY')).toBe(KEY);
    expect(sanitizeSecret(`stripe_secret_key="${KEY}"`, 'STRIPE_SECRET_KEY')).toBe(KEY);
  });

  it('strips non-breaking and zero-width characters from password managers', () => {
    expect(sanitizeSecret(` ${KEY}​﻿`, 'STRIPE_SECRET_KEY')).toBe(KEY);
  });

  it('returns null for unset, empty, whitespace-only, or quotes-only values', () => {
    expect(sanitizeSecret(undefined, 'STRIPE_SECRET_KEY')).toBeNull();
    expect(sanitizeSecret(null, 'STRIPE_SECRET_KEY')).toBeNull();
    expect(sanitizeSecret('   \n', 'STRIPE_SECRET_KEY')).toBeNull();
    expect(sanitizeSecret('""', 'STRIPE_SECRET_KEY')).toBeNull();
  });
});

describe('getStripeSecretKey / getStripeWebhookSecret', () => {
  it('reads and cleans the env vars', () => {
    process.env.STRIPE_SECRET_KEY = ` "${KEY}" `;
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test123\n';
    expect(getStripeSecretKey()).toBe(KEY);
    expect(getStripeWebhookSecret()).toBe('whsec_test123');
  });
});

describe('stripeKeyDiagnostic — value-free operator diagnosis for /api/health', () => {
  it('missing: unset or blank, with a fix-it hint naming the right project', () => {
    delete process.env.STRIPE_SECRET_KEY;
    const d = stripeKeyDiagnostic();
    expect(d.status).toBe('missing_key');
    expect(d.hint).toMatch(/compliance-firewall-agent/);
  });

  it('connected: a clean sk_ key, no hint needed', () => {
    process.env.STRIPE_SECRET_KEY = KEY;
    expect(stripeKeyDiagnostic()).toEqual({ status: 'connected' });
  });

  it('connected with a note when paste artifacts were auto-cleaned', () => {
    process.env.STRIPE_SECRET_KEY = `"${KEY}"`;
    const d = stripeKeyDiagnostic();
    expect(d.status).toBe('connected');
    expect(d.hint).toMatch(/auto-cleaned/);
  });

  it('malformed: set but not a Stripe secret — hint explains without echoing the value', () => {
    process.env.STRIPE_SECRET_KEY = 'pk_live_this_is_the_wrong_key';
    const d = stripeKeyDiagnostic();
    expect(d.status).toBe('malformed_key');
    expect(d.hint).toMatch(/does not start with "sk_"/);
    // The diagnostic must NEVER leak the configured value.
    expect(d.hint).not.toContain('pk_live');
    expect(d.hint).not.toContain('wrong_key');
  });

  it('restricted keys (rk_) also count as connected', () => {
    process.env.STRIPE_SECRET_KEY = 'rk_live_restricted123';
    expect(stripeKeyDiagnostic().status).toBe('connected');
  });
});

describe('stripeWebhookDiagnostic — a live key without the webhook loses orders', () => {
  it('missing: unset, with a hint that warns orders will not be recorded', () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const d = stripeWebhookDiagnostic();
    expect(d.status).toBe('missing_secret');
    expect(d.hint).toMatch(/NOT be recorded/);
    expect(d.hint).toMatch(/api\/stripe\/webhook/);
  });

  it('missing: quotes-only value is treated as unset', () => {
    process.env.STRIPE_WEBHOOK_SECRET = '""';
    expect(stripeWebhookDiagnostic().status).toBe('missing_secret');
  });

  it('configured: a clean whsec_ value, even with paste artifacts', () => {
    process.env.STRIPE_WEBHOOK_SECRET = '"whsec_abc123"\n';
    expect(stripeWebhookDiagnostic()).toEqual({ status: 'configured' });
  });

  it('malformed: set but not whsec_ — hint never echoes the value', () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'sk_live_pasted_the_wrong_secret';
    const d = stripeWebhookDiagnostic();
    expect(d.status).toBe('malformed_secret');
    expect(d.hint).toMatch(/does not start with "whsec_"/);
    expect(d.hint).not.toContain('sk_live');
    expect(d.hint).not.toContain('wrong_secret');
  });
});
