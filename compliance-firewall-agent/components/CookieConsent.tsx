"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import {
  consentUndecided,
  hasAnalyticsConsent,
  setConsent,
  CONSENT_EVENT,
} from "@/lib/consent";

/**
 * GDPR / ePrivacy cookie-consent banner.
 *
 * Three choices — never a bare "Reject":
 *   • Accept all       → essential + anonymous analytics (setConsent "accepted")
 *   • Accept essential → essential only, analytics stays off (setConsent "rejected")
 *   • Cookie settings  → granular modal (essential locked on, analytics toggle)
 *
 * "Accept essential" is the legally-compliant way to decline analytics without
 * the word "Reject" (essential cookies are strictly necessary and need no
 * consent; only analytics is gated). PostHog stays off until "accepted"
 * (see PostHogProvider, which gates init on `hasAnalyticsConsent()`). Prompt
 * content is never tracked in any mode.
 */
export function CookieConsent() {
  // Start hidden so SSR markup matches the first client paint (no flash).
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(false);

  useEffect(() => {
    const sync = () => {
      setVisible(consentUndecided());
      setAnalyticsOn(hasAnalyticsConsent());
    };
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  if (!visible) return null;

  const acceptAll = () => {
    setConsent("accepted");
    setSettingsOpen(false);
    setVisible(false);
  };

  const acceptEssential = () => {
    setConsent("rejected");
    setSettingsOpen(false);
    setVisible(false);
  };

  const savePreferences = () => {
    setConsent(analyticsOn ? "accepted" : "rejected");
    setSettingsOpen(false);
    setVisible(false);
  };

  return (
    <>
      {/* ── Banner ─────────────────────────────────────────────────────── */}
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
          <div className="mt-4 flex shrink-0 flex-col gap-2 sm:mt-0 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="order-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--hs-ink-secondary)] underline-offset-2 transition-colors hover:text-[var(--hs-ink)] hover:underline sm:order-1"
            >
              Cookie settings
            </button>
            <button
              type="button"
              onClick={acceptEssential}
              className="order-2 rounded-lg border border-[var(--hs-border)] px-4 py-2 text-sm font-medium text-[var(--hs-ink-secondary)] transition-colors hover:bg-[var(--hs-surface-1)]"
            >
              Accept essential
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="order-1 rounded-lg bg-[var(--hs-ink)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:order-3"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>

      {/* ── Settings modal ─────────────────────────────────────────────── */}
      {settingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cookie preferences"
          className="fixed inset-0 z-[110] flex items-center justify-center px-4"
        >
          <button
            type="button"
            aria-label="Close cookie preferences"
            onClick={() => setSettingsOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-0)] p-6 shadow-2xl shadow-black/20">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Cookie className="h-5 w-5 text-[var(--hs-steel)]" aria-hidden />
                <h2 className="text-base font-semibold text-[var(--hs-ink)]">Cookie preferences</h2>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-md p-1 text-[var(--hs-ink-tertiary)] transition-colors hover:bg-[var(--hs-surface-1)] hover:text-[var(--hs-ink)]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Essential — always on */}
            <div className="mb-3 rounded-xl border border-[var(--hs-border)] bg-[var(--hs-surface-1)] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--hs-ink)]">Essential</p>
                  <p className="mt-0.5 text-xs text-[var(--hs-ink-secondary)]">
                    Required to run the site, sign you in, and keep it secure. Always on.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--hs-steel)]/15 px-3 py-1 text-xs font-semibold text-[var(--hs-steel-dark)]">
                  Always on
                </span>
              </div>
            </div>

            {/* Analytics — toggle */}
            <div className="mb-5 rounded-xl border border-[var(--hs-border)] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--hs-ink)]">Anonymous analytics</p>
                  <p className="mt-0.5 text-xs text-[var(--hs-ink-secondary)]">
                    Helps us improve HoundShield. No prompt content, ever.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={analyticsOn}
                  aria-label="Toggle anonymous analytics"
                  onClick={() => setAnalyticsOn((v) => !v)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    analyticsOn ? "bg-[var(--hs-steel)]" : "bg-[var(--hs-border)]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      analyticsOn ? "translate-x-[22px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={acceptEssential}
                className="rounded-lg border border-[var(--hs-border)] px-4 py-2 text-sm font-medium text-[var(--hs-ink-secondary)] transition-colors hover:bg-[var(--hs-surface-1)]"
              >
                Accept essential
              </button>
              <button
                type="button"
                onClick={savePreferences}
                className="rounded-lg bg-[var(--hs-ink)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
