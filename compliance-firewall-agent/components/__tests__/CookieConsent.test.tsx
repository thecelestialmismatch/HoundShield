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

  it("hides and stores 'accepted' when Accept is clicked", () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByRole("button", { name: /accept/i }));
    expect(getConsent()).toBe("accepted");
    expect(screen.queryByRole("dialog", { name: /cookie consent/i })).toBeNull();
  });

  it("hides and stores 'rejected' when Reject is clicked", () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByRole("button", { name: /reject/i }));
    expect(getConsent()).toBe("rejected");
    expect(screen.queryByRole("dialog", { name: /cookie consent/i })).toBeNull();
  });

  it("does not render when a choice already exists", () => {
    window.localStorage.setItem(CONSENT_KEY, "accepted");
    render(<CookieConsent />);
    expect(screen.queryByRole("dialog", { name: /cookie consent/i })).toBeNull();
  });
});
