import { siteUrl } from "@/lib/site-url";

/**
 * The one email chrome — header, footer, button, escaping.
 *
 * WHAT WAS WRONG. Seven templates plus `app/api/email/welcome/route.ts` each
 * carried a byte-identical copy of the same dark header band and footer, and
 * three more send paths (`/api/contact`, `/api/report/snapshot-lead`, the
 * partner founder-alert) carried no chrome at all — bare `<h2>`/`<p>` fragments
 * that reach a BUYER looking like a broken mailing-list message.
 *
 * And in every one of those eleven copies, the brand was the *word*
 * "HoundShield" in an `<h1>`. There was no `<img>` in any email in the
 * repository — the doberman mark shipped in the PDF report (`lib/reports/
 * logo-data.ts`) and on the site, but never in the mail a buyer actually opens
 * first. Eleven copies is also eleven places for the fix to not land.
 *
 * WHY A HOSTED URL AND NOT THE BASE64 THE PDF USES. `lib/reports/logo-data.ts`
 * exports a ~46 KB `data:` URI, and reusing it here is the obvious-looking
 * move. It does not work: Gmail strips `data:` URI images outright, and it
 * would add 46 KB to every message. Email wants an absolute `https` URL, which
 * `public/logo.png` already is once served — so this adds no asset, no build
 * step and no dependency.
 *
 * THE MARK NEVER APPEARS ALONE (founder rule, 2026-08-08 pitch-deck entry). The
 * wordmark sits beside it in live text, not baked into the image — so when a
 * client blocks images, which is the default in Outlook and for any unknown
 * sender, the header still reads "HoundShield" rather than collapsing to an
 * empty box. `alt` carries the name for the same reason.
 */

/** The brand mark, absolute — `public/logo.png`, 512x512, served by the app. */
export const LOGO_URL = siteUrl("/logo.png");

/** The strapline under the wordmark, unless a caller overrides it. */
export const DEFAULT_TAGLINE = "AI Compliance Firewall for Defense Contractors";

/**
 * Escape untrusted text before interpolating into email HTML.
 *
 * Consolidates four near-identical private copies (`/api/contact`,
 * `/api/report/snapshot-lead`, `/api/partners/apply`, and `esc()` in
 * `templates/report-order.ts`). They had already drifted: `esc()` omitted the
 * apostrophe the other three escaped. Every value that originated with a
 * visitor, a Stripe payload or a form POST goes through this before it reaches
 * a template literal.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * The brand band: mark + wordmark + strapline, on a LIGHT ground.
 *
 * WHY LIGHT, WHEN THIS BAND USED TO BE #0f172a. Both brand assets
 * (`public/logo.png` and `houndshield-logo.png`) are a near-black doberman
 * shield. On the old dark-navy band the mark was invisible — and seating it in
 * a small white chip, the way `drawBadge()` does on the PDF cover, only traded
 * invisible for illegible: at 30px the shield's interior detail collapses into
 * a grey smudge. The mark is drawn for a light ground, so it gets one. This
 * also matches the site itself, whose landing surface is light mode.
 *
 * The size is the other half of the fix. 44px is the smallest at which the
 * doberman's silhouette still reads as a dog rather than a blob — checked by
 * rendering it, not by picking a number that sounded reasonable.
 */
export function emailHeader(tagline: string = DEFAULT_TAGLINE): string {
  return `
    <div style="background:#ffffff;border-bottom:1px solid #e2e8f0;padding:28px 40px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding-right:14px;vertical-align:middle;line-height:0;">
            <img src="${LOGO_URL}" width="44" height="44" alt="HoundShield"
              style="display:block;width:44px;height:44px;border:0;outline:none;text-decoration:none;" />
          </td>
          <td style="vertical-align:middle;">
            <h1 style="color:#0f172a;margin:0;font-size:23px;font-weight:700;line-height:1.15;letter-spacing:-0.01em;">HoundShield</h1>
            <p style="color:#ea580c;margin:3px 0 0;font-size:13px;font-weight:600;">${tagline}</p>
          </td>
        </tr>
      </table>
    </div>`;
}

/** The primary call-to-action button. */
export function emailButton(href: string, label: string): string {
  return `
      <div style="text-align:center;margin:32px 0;">
        <a href="${href}"
          style="background:#ea580c;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
          ${label}
        </a>
      </div>`;
}

/**
 * The closing band. `extraHtml` carries whatever the individual message needs
 * there — the "Manage notifications" link for account mail, the CAN-SPAM block
 * for marketing mail, nothing at all for a reply to a stranger who has no
 * account to manage.
 */
export function emailFooter(extraHtml = ""): string {
  return `
    <div style="border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        HoundShield &mdash; AI Compliance Firewall<br />
        <a href="${siteUrl("/")}" style="color:#94a3b8;">www.houndshield.com</a>${extraHtml}
      </p>
    </div>`;
}

/** The settings link most account-lifecycle mail closes with. */
export function manageNotificationsFooter(): string {
  return emailFooter(
    `<br /><a href="${siteUrl("/command-center/settings")}" style="color:#94a3b8;">Manage notifications</a>`
  );
}

/**
 * Wrap body HTML in the full branded document.
 *
 * `bodyHtml` is the message-specific middle; it is inserted verbatim, so every
 * untrusted value inside it must already have gone through `escapeHtml`.
 */
export function emailShell(options: {
  bodyHtml: string;
  tagline?: string;
  footerHtml?: string;
}): string {
  const { bodyHtml, tagline, footerHtml } = options;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 20px;">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
${emailHeader(tagline)}

    <div style="padding:40px;">
${bodyHtml}
    </div>
${footerHtml ?? manageNotificationsFooter()}
  </div>
</body>
</html>`;
}
