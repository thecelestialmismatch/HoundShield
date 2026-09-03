/**
 * Tests for the degraded-money-path alert.
 *
 * This email is the one that turns a diagnostic nobody reads (a JSON field
 * behind an admin session, a line in a Vercel log) into something that arrives
 * in a human inbox. Its value is entirely in being specific and honest, so
 * that is what is pinned here.
 */
import { describe, it, expect } from 'vitest';
import { moneyPathAlertEmail } from '@/lib/email/templates/money-path-alert';

const BROKEN_WEBHOOK = { webhookOk: false, keyOk: true, hints: ['Set STRIPE_WEBHOOK_SECRET in Vercel.'] };
const BROKEN_KEY = { webhookOk: true, keyOk: false, hints: ['STRIPE_SECRET_KEY contains your PUBLISHABLE key.'] };

describe('moneyPathAlertEmail', () => {
  it('leads with the consequence, not the variable name', () => {
    // "STRIPE_WEBHOOK_SECRET is unset" is a fact. "A customer can pay right now
    // and you would never hear about it" is the reason to stop and fix it.
    const mail = moneyPathAlertEmail(BROKEN_WEBHOOK);
    expect(mail.html).toContain('you would never hear about it');
    expect(mail.subject).toContain('sales are not being recorded');
  });

  it('distinguishes the two failures — they have different fixes', () => {
    expect(moneyPathAlertEmail(BROKEN_KEY).subject).toContain('Stripe key unusable');
    expect(moneyPathAlertEmail(BROKEN_KEY).subject).not.toContain('sales are not being recorded');
  });

  it('marks each rail OK or BROKEN rather than describing them in prose', () => {
    const html = moneyPathAlertEmail(BROKEN_WEBHOOK).html;
    expect(html).toContain('Webhook signing secret');
    expect(html).toContain('Stripe API secret key');
    expect(html).toContain('BROKEN');
    expect(html).toContain('OK');
  });

  it('stays honest about what still works with a broken API key', () => {
    // Overstating the damage is as costly as understating it: the $499 report
    // genuinely still sells on the Stripe-hosted Payment Link with no key at
    // all, and an alert that claims otherwise would send the founder chasing
    // the wrong thing.
    expect(moneyPathAlertEmail(BROKEN_KEY).html).toContain('STILL SELLS');
  });

  it('carries the operator hints verbatim', () => {
    expect(moneyPathAlertEmail(BROKEN_WEBHOOK).html).toContain('Set STRIPE_WEBHOOK_SECRET in Vercel.');
  });

  it('renders with no hints at all', () => {
    const mail = moneyPathAlertEmail({ webhookOk: false, keyOk: false, hints: [] });
    expect(mail.html).toContain('BROKEN');
    expect(mail.html).not.toContain('Exactly what to do');
  });

  it('escapes hint text rather than interpolating it raw', () => {
    // Hints are authored in this repo, not user input — but they are the kind
    // of string that grows quotes and angle brackets, and an email template
    // that interpolates raw is one refactor away from being fed something else.
    const mail = moneyPathAlertEmail({ webhookOk: false, keyOk: true, hints: ['<script>x</script>'] });
    expect(mail.html).not.toContain('<script>x</script>');
    expect(mail.html).toContain('&lt;script&gt;');
  });

  it('is an internal system alert, so it carries no marketing unsubscribe', () => {
    // CAN-SPAM transactional/relationship content (16 CFR 316.3). Adding an
    // unsubscribe would let the operator mute their own outage alarm.
    const html = moneyPathAlertEmail(BROKEN_WEBHOOK).html;
    expect(html.toLowerCase()).not.toContain('unsubscribe');
  });

  it('points at the runbook so the reader has somewhere to go next', () => {
    expect(moneyPathAlertEmail(BROKEN_WEBHOOK).html).toContain('docs/RUNBOOK-MONEY-PATH.md');
  });
});
