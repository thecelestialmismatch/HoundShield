"use client";

import { clearConsent } from "@/lib/consent";

/**
 * The GDPR Art. 7(3) withdrawal control.
 *
 * This page's "Changing your mind" section told visitors to use the "Cookie
 * settings" control in the consent banner. That control is real, but the
 * banner that hosts it renders `null` as soon as a choice is stored — and a
 * visitor only reads a cookie policy after dismissing the banner. So the
 * instruction pointed at something the reader could not see.
 *
 * Clearing the stored choice re-fires CONSENT_EVENT; the globally-mounted
 * banner listens for it and re-opens with the full settings modal available.
 */
export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={clearConsent}
      className="mt-3 rounded-lg border border-[var(--hs-border)] px-4 py-2 text-sm font-medium text-[var(--hs-ink-secondary)] transition-colors hover:bg-[var(--hs-surface-1)]"
    >
      Change cookie settings
    </button>
  );
}
