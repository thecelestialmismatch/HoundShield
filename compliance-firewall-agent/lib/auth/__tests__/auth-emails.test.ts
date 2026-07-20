import { describe, it, expect } from "vitest";
import {
  buildPasswordResetEmail,
  buildTwoFactorCodeEmail,
  buildVerificationEmail,
} from "../auth-emails";

/**
 * Auth email content is pinned so a template edit can't silently ship a broken
 * reset flow (missing link, wrong subject). The reset link must appear in BOTH
 * the button href and the plain-text fallback (some clients strip HTML).
 */

describe("password reset email", () => {
  const url = "https://www.houndshield.com/reset-password?token=abc123";
  const mail = buildPasswordResetEmail(url);

  it("has a clear reset subject", () => {
    expect(mail.subject).toMatch(/reset your houndshield password/i);
  });
  it("embeds the reset link in the html button and the text body", () => {
    expect(mail.html).toContain(`href="${url}"`);
    expect(mail.text).toContain(url);
  });
  it("is HoundShield-branded and states single-use expiry", () => {
    expect(mail.html).toMatch(/Hound<span[^>]*>Shield/);
    expect(mail.text.toLowerCase()).toMatch(/expires|single use|once/);
  });
});

describe("verification email", () => {
  const url = "https://www.houndshield.com/api/auth/verify-email?token=xyz";
  const mail = buildVerificationEmail(url);

  it("has a verify subject and the verify link in html + text", () => {
    expect(mail.subject).toMatch(/verify your houndshield email/i);
    expect(mail.html).toContain(`href="${url}"`);
    expect(mail.text).toContain(url);
  });
});

describe("two-factor sign-in code email", () => {
  const code = "482913";
  const mail = buildTwoFactorCodeEmail(code);

  it("shows the code in html and text — but NEVER in the subject", () => {
    expect(mail.html).toContain(code);
    expect(mail.text).toContain(code);
    // Lock-screen previews show subjects; a code there defeats the factor.
    expect(mail.subject).not.toContain(code);
  });
  it("states expiry and single use, and warns about unrequested codes", () => {
    expect(mail.text.toLowerCase()).toMatch(/expires/);
    expect(mail.text.toLowerCase()).toMatch(/once/);
    expect(mail.text.toLowerCase()).toMatch(/didn't try to sign in/);
  });
  it("is HoundShield-branded and says we never ask for the code", () => {
    expect(mail.html).toMatch(/Hound<span[^>]*>Shield/);
    expect(mail.html.toLowerCase()).toContain("never ask you for this code");
  });
});
