import { transactionalFrom } from '@/lib/email/identity';
import { emailFooter, emailShell, escapeHtml } from '@/lib/email/shell';

const FROM = transactionalFrom();

/**
 * Weekly internal alert: the money path is degraded.
 *
 * WHY THIS EXISTS. `stripeKeyDiagnostic()` and `stripeWebhookDiagnostic()` have
 * produced precise, actionable, plain-English hints for months — into a JSON
 * body behind an admin session and into Vercel logs. Nobody reads either. The
 * result is a company with zero paid customers whose #1 blocker has been the
 * same five-minute env-var paste since 2026-08-15, restated in `tasks/todo.md`
 * every session and never surfaced anywhere a human would trip over it.
 *
 * This turns the existing diagnostic into a message that arrives in the
 * founder's inbox. Sent by `app/api/cron/reconcile-orders` on Mondays only, and
 * only while the path is actually degraded — it stops arriving the moment the
 * variables are set, which is what makes it worth reading rather than filtering.
 *
 * Internal-only: no marketing footer, no unsubscribe. This is a system alert to
 * the operator of the system, not a commercial message (CAN-SPAM
 * transactional/relationship content, 16 CFR 316.3).
 */
export function moneyPathAlertEmail({
  webhookOk,
  keyOk,
  hints,
}: {
  webhookOk: boolean;
  keyOk: boolean;
  hints: string[];
}): { from: string; subject: string; html: string } {
  // The webhook is named first everywhere in this email, deliberately. It is
  // the variable that decides whether a completed sale is ever seen; the API
  // key only decides how good the experience around it is. An operator with
  // five minutes should spend them on the webhook.
  const headline = !webhookOk
    ? 'A customer can pay right now and you would never hear about it'
    : 'Stripe API key is not usable — reconciliation and promo codes are down';

  const rows: Array<{ label: string; ok: boolean; detail: string }> = [
    {
      label: 'Webhook signing secret',
      ok: webhookOk,
      detail: webhookOk
        ? 'Set. Completed sales are recorded and alerted in real time.'
        : 'NOT SET. Every Stripe delivery is rejected: no order row, no buyer receipt, no sale alert.',
    },
    {
      label: 'Stripe API secret key',
      ok: keyOk,
      detail: keyOk
        ? 'Usable. Daily reconciliation, promo codes and the branded thank-you page all work.'
        : 'Not usable. The $499 report STILL SELLS on the Stripe-hosted Payment Link, but the daily reconciler cannot read those sales back, so nothing rescues a missed one.',
    },
  ];

  const rowHtml = rows
    .map(
      (r) => `
        <tr>
          <td style="padding:10px 0;color:#64748b;width:190px;vertical-align:top;">${escapeHtml(r.label)}</td>
          <td style="padding:10px 0;vertical-align:top;">
            <strong style="color:${r.ok ? '#15803d' : '#b91c1c'};">${r.ok ? 'OK' : 'BROKEN'}</strong><br />
            <span style="color:#475569;font-size:13px;line-height:1.6;">${escapeHtml(r.detail)}</span>
          </td>
        </tr>`,
    )
    .join('');

  const hintHtml = hints.length
    ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin:22px 0 0;">
        <p style="color:#0f172a;font-weight:600;margin:0 0 10px;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">Exactly what to do</p>
        ${hints
          .map(
            (h) =>
              `<p style="color:#334155;font-size:13px;line-height:1.7;margin:0 0 12px;">${escapeHtml(h)}</p>`,
          )
          .join('')}
      </div>`
    : '';

  return {
    from: FROM,
    subject: `⚠️ HoundShield money path degraded — ${!webhookOk ? 'sales are not being recorded' : 'Stripe key unusable'}`,
    // The shared chrome, like every other message — a system alert that looks
    // unlike the rest of the mail is a system alert that reads as spam.
    html: emailShell({
      tagline: 'System alert',
      bodyHtml: `
      <div style="background:#7f1d1d;border-radius:10px;padding:18px 22px;margin:0 0 24px;">
        <p style="color:#fecaca;margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Money path degraded</p>
        <h2 style="color:#fff;margin:6px 0 0;font-size:19px;font-weight:700;line-height:1.35;">${escapeHtml(headline)}</h2>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;">${rowHtml}</table>
      ${hintHtml}
      <p style="color:#64748b;font-size:13px;line-height:1.7;margin:22px 0 0;">
        The daily reconciler (<code>/api/cron/reconcile-orders</code>) is the safety net: it
        re-reads paid Stripe sessions and records anything the webhook missed, so a sale is
        late rather than lost. It needs the API key to do that. Full failure map:
        <code>docs/RUNBOOK-MONEY-PATH.md</code>.
      </p>
      <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:18px 0 0;">
        Sent once a week while the money path is degraded. It stops as soon as the variables
        are set and the deployment is redeployed.
      </p>`,
      // The plain footer, NOT manageNotificationsFooter(): there is no settings
      // screen that can turn this off, and offering one would let the operator
      // mute their own outage alarm.
      footerHtml: emailFooter(),
    }),
  };
}
