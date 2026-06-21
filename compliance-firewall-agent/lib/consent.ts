/**
 * Cookie / analytics consent — GDPR + ePrivacy.
 *
 * HoundShield sells to regulated buyers (DoD, healthcare). Non-essential
 * analytics (PostHog) must not run until the visitor opts in. This module is
 * the single source of truth for that choice; it is SSR-safe (every accessor
 * guards `typeof window`) so it can be imported from server and client code.
 */

export type ConsentChoice = "accepted" | "rejected";

/** localStorage key holding the visitor's choice. */
export const CONSENT_KEY = "hs-cookie-consent";

/** Window event dispatched whenever the choice changes, so listeners react. */
export const CONSENT_EVENT = "hs-consent-changed";

/** Returns the stored choice, or `null` if the visitor has not chosen yet. */
export function getConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    // Private mode / storage disabled — treat as "no choice yet".
    return null;
  }
}

/** Persists the visitor's choice and notifies listeners in the same tab. */
export function setConsent(choice: ConsentChoice): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // Best-effort: still fire the event so in-memory listeners update.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
}

/** True only when the visitor has explicitly opted into analytics cookies. */
export function hasAnalyticsConsent(): boolean {
  return getConsent() === "accepted";
}

/** True until the visitor makes a choice — drives banner visibility. */
export function consentUndecided(): boolean {
  return getConsent() === null;
}
