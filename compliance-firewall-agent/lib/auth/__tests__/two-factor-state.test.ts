import { describe, it, expect } from "vitest";
import {
  needsSecondFactor,
  normalizeOtpInput,
  isCompleteOtp,
  resendWaitSeconds,
  otpErrorMessage,
  OTP_LENGTH,
  RESEND_COOLDOWN_SECONDS,
} from "../two-factor-state";

/**
 * The login interstitial and the /console/security enable wizard both lean on
 * these branches; pinning them here means the two surfaces can never disagree
 * about what a valid code is or when a resend is allowed.
 */

describe("needsSecondFactor", () => {
  it("is true only for the twoFactorRedirect flag", () => {
    expect(needsSecondFactor({ twoFactorRedirect: true })).toBe(true);
    expect(needsSecondFactor({ twoFactorRedirect: true, twoFactorMethods: ["otp"] })).toBe(true);
  });
  it("is false for normal session payloads and junk", () => {
    expect(needsSecondFactor({ user: { id: "u1" }, token: "t" })).toBe(false);
    expect(needsSecondFactor({ twoFactorRedirect: false })).toBe(false);
    expect(needsSecondFactor({ twoFactorRedirect: "true" })).toBe(false);
    expect(needsSecondFactor(null)).toBe(false);
    expect(needsSecondFactor(undefined)).toBe(false);
    expect(needsSecondFactor("twoFactorRedirect")).toBe(false);
  });
});

describe("normalizeOtpInput", () => {
  it("strips non-digits a paste drags in", () => {
    expect(normalizeOtpInput(" 482-913 ")).toBe("482913");
    expect(normalizeOtpInput("48 29 13")).toBe("482913");
  });
  it("caps at OTP_LENGTH digits", () => {
    expect(normalizeOtpInput("1234567890")).toBe("123456");
    expect(normalizeOtpInput("1234567890").length).toBe(OTP_LENGTH);
  });
  it("passes clean input through", () => {
    expect(normalizeOtpInput("000000")).toBe("000000");
    expect(normalizeOtpInput("")).toBe("");
  });
});

describe("isCompleteOtp", () => {
  it("accepts exactly six digits", () => {
    expect(isCompleteOtp("482913")).toBe(true);
    expect(isCompleteOtp("000000")).toBe(true);
  });
  it("rejects short, long, and non-numeric codes", () => {
    expect(isCompleteOtp("48291")).toBe(false);
    expect(isCompleteOtp("4829131")).toBe(false);
    expect(isCompleteOtp("48291a")).toBe(false);
    expect(isCompleteOtp("")).toBe(false);
  });
});

describe("resendWaitSeconds", () => {
  const t0 = 1_700_000_000_000;

  it("allows immediately when no code was ever sent", () => {
    expect(resendWaitSeconds(null, t0)).toBe(0);
  });
  it("enforces the full cooldown right after a send", () => {
    expect(resendWaitSeconds(t0, t0)).toBe(RESEND_COOLDOWN_SECONDS);
  });
  it("counts down and rounds partial seconds UP (never early)", () => {
    expect(resendWaitSeconds(t0, t0 + 10_000)).toBe(RESEND_COOLDOWN_SECONDS - 10);
    expect(resendWaitSeconds(t0, t0 + 10_500)).toBe(RESEND_COOLDOWN_SECONDS - 10);
    expect(resendWaitSeconds(t0, t0 + 29_001)).toBe(1);
  });
  it("hits zero at the cooldown boundary and stays there", () => {
    expect(resendWaitSeconds(t0, t0 + RESEND_COOLDOWN_SECONDS * 1000)).toBe(0);
    expect(resendWaitSeconds(t0, t0 + 120_000)).toBe(0);
  });
});

describe("otpErrorMessage", () => {
  it("maps every Better Auth two-factor error code to a human line", () => {
    expect(otpErrorMessage("INVALID_CODE")).toMatch(/isn't right/);
    expect(otpErrorMessage("OTP_HAS_EXPIRED")).toMatch(/expired/);
    expect(otpErrorMessage("TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE")).toMatch(/new code/);
    expect(otpErrorMessage("ACCOUNT_TEMPORARILY_LOCKED")).toMatch(/locked/);
    expect(otpErrorMessage("INVALID_TWO_FACTOR_COOKIE")).toMatch(/start again/i);
    expect(otpErrorMessage("INVALID_PASSWORD")).toMatch(/password/);
  });
  it("falls back to the server message, then a generic line — never raw codes", () => {
    expect(otpErrorMessage("SOMETHING_NEW", "Custom server text")).toBe("Custom server text");
    expect(otpErrorMessage("SOMETHING_NEW")).toMatch(/try again/i);
    expect(otpErrorMessage(undefined)).toMatch(/try again/i);
  });
});
