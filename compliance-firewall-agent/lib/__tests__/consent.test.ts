import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  CONSENT_KEY,
  CONSENT_EVENT,
  getConsent,
  setConsent,
  hasAnalyticsConsent,
  consentUndecided,
} from "@/lib/consent";

describe("consent", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts undecided with no stored value", () => {
    expect(getConsent()).toBeNull();
    expect(consentUndecided()).toBe(true);
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("persists and reads an 'accepted' choice", () => {
    setConsent("accepted");
    expect(getConsent()).toBe("accepted");
    expect(hasAnalyticsConsent()).toBe(true);
    expect(consentUndecided()).toBe(false);
    expect(window.localStorage.getItem(CONSENT_KEY)).toBe("accepted");
  });

  it("persists a 'rejected' choice without granting analytics", () => {
    setConsent("rejected");
    expect(getConsent()).toBe("rejected");
    expect(hasAnalyticsConsent()).toBe(false);
    expect(consentUndecided()).toBe(false);
  });

  it("treats unknown stored values as no choice", () => {
    window.localStorage.setItem(CONSENT_KEY, "maybe");
    expect(getConsent()).toBeNull();
    expect(consentUndecided()).toBe(true);
  });

  it("dispatches the consent-changed event when a choice is made", () => {
    const handler = vi.fn();
    window.addEventListener(CONSENT_EVENT, handler);
    setConsent("accepted");
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(CONSENT_EVENT, handler);
  });
});
