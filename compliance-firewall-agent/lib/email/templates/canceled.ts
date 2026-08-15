const APP_URL = SITE_URL;
import { transactionalFrom } from '@/lib/email/identity';
import { emailHeader, manageNotificationsFooter } from '@/lib/email/shell';

import { SITE_URL } from "@/lib/site-url";

const FROM = transactionalFrom();

/**
 * Transactional cancellation confirmation + soft win-back — fires from the
 * Stripe webhook on customer.subscription.deleted. Confirms the downgrade,
 * states plainly what coverage they keep on Free, and leaves a no-pressure
 * door open. The CMMC deadline does the persuading; we don't beg.
 */
export const canceledEmail = {
  from: FROM,
  subject: 'Your HoundShield subscription was canceled',
  html: (orgName: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 20px;">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

${emailHeader()}

    <div style="padding:40px;">
      <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Your plan was canceled, ${orgName}</h2>

      <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
        We've moved your account to the Free plan. Your local scanning still runs and your
        existing audit history stays intact — you just lose extended retention, unlimited PDF
        exports, and the full control-coverage map.
      </p>

      <div style="background:#fef9ec;border:1px solid #fde68a;border-radius:10px;padding:20px;margin:0 0 24px;">
        <p style="color:#92400e;font-weight:600;margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">Before you go</p>
        <p style="color:#78350f;font-size:14px;margin:0;line-height:1.6;">
          CMMC Phase 2 was suspended on 13 July 2026, but your annual SPRS self-attestation was
          not — and with no assessor in the loop it is your own representation to the government.
          The evidence trail you keep <em>now</em> is what you'll be asked for then. Reactivating
          takes one click and your data is right where you left it.
        </p>
      </div>

      <div style="text-align:center;margin:32px 0;">
        <a href="${APP_URL}/pricing"
          style="background:#ea580c;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
          Reactivate any time →
        </a>
      </div>

      <p style="color:#64748b;font-size:13px;line-height:1.6;">
        Mind telling us why you left? Just reply — a real person reads every response, and it
        genuinely shapes what we build next.
      </p>
    </div>

${manageNotificationsFooter()}
  </div>
</body>
</html>`,
};
