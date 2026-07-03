import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";

import { CookieConsent } from "@/components/CookieConsent";
import { CONSENT_KEY, getConsent } from "@/lib/consent";

describe("CookieConsent", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the banner when the visitor has not chosen", () => {
    render(<CookieConsent />);
    expect(screen.getByRole("dialog", { name: /cookie consent/i })).toBeTruthy();
    expect(screen.getByText(/essential cookies/i)).toBeTruthy();
  });

  it("offers three choices and never a bare 'Reject'", () => {
    render(<CookieConsent />);
    expect(screen.getByRole("button", { name: /accept all/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /accept essential/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /cookie settings/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^reject$/i })).toBeNull();
  });

  it("stores 'accepted' when Accept all is clicked", () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByRole("button", { name: /accept all/i }));
    expect(getConsent()).toBe("accepted");
    expect(screen.queryByRole("dialog", { name: /cookie consent/i })).toBeNull();
  });

  it("stores 'rejected' (essential only) when Accept essential is clicked", () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByRole("button", { name: /accept essential/i }));
    expect(getConsent()).toBe("rejected");
    expect(screen.queryByRole("dialog", { name: /cookie consent/i })).toBeNull();
  });

  it("opens the settings modal and saves analytics-on as 'accepted'", () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByRole("button", { name: /cookie settings/i }));
    // Modal appears with the analytics toggle (off by default).
    const toggle = screen.getByRole("switch", { name: /analytics/i });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("button", { name: /save preferences/i }));
    expect(getConsent()).toBe("accepted");
  });

  it("does not render when a choice already exists", () => {
    window.localStorage.setItem(CONSENT_KEY, "accepted");
    render(<CookieConsent />);
    expect(screen.queryByRole("dialog", { name: /cookie consent/i })).toBeNull();
  });
});
