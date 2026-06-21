"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import {
  consentUndecided,
  setConsent,
  CONSENT_EVENT,
} from "@/lib/consent";

/**
 * GDPR / ePrivacy cookie-consent banner.
 *
 * Renders only until the visitor makes a choice. Until then, PostHog analytics
 * stays off (see PostHogProvider, which gates init on `hasAnalyticsConsent()`).
 * "Reject" keeps the product fully functional — only non-essential analytics
 * cookies are withheld.
 */
export function CookieConsent() {
  // Start hidden so SSR markup matches the first client paint (no flash).
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => setVisible(consentUndecided());
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  if (!visible) return null;

  const choose = (choice: "accepted" | "rejected") => {
    setConsent(choice);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-0)] p-5 shadow-2xl shadow-black/10 sm:flex sm:items-center sm:gap-5">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-[var(--hs-steel)]" aria-hidden />
          <p className="text-sm leading-relaxed text-[var(--hs-ink-secondary)]">
            We use essential cookies to run HoundShield and, with your consent,
            anonymous analytics to improve it. Your prompt content is{" "}
            <strong className="text-[var(--hs-ink)]">never</strong> tracked.{" "}
            <Link href="/privacy" className="text-brand-700 underline hover:text-brand-700">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="mt-4 flex shrink-0 gap-2 sm:mt-0">
          <button
            type="button"
            onClick={() => choose("rejected")}
            className="flex-1 rounded-lg border border-[var(--hs-border)] px-4 py-2 text-sm font-medium text-[var(--hs-ink-secondary)] transition-colors hover:bg-[var(--hs-surface-1)] sm:flex-none"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="flex-1 rounded-lg bg-[var(--hs-ink)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:flex-none"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
