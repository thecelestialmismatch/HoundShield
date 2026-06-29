import { describe, it, expect } from "vitest";
import { interpretSignUp, validateSignUpInput } from "@/lib/auth/signup-result";

describe("validateSignUpInput", () => {
  it("rejects malformed emails", () => {
    expect(validateSignUpInput("not-an-email", "longenough")).toMatch(/valid email/i);
    expect(validateSignUpInput("a@b", "longenough")).toMatch(/valid email/i);
  });

  it("rejects short passwords", () => {
    expect(validateSignUpInput("a@b.com", "short")).toMatch(/8 characters/i);
  });

  it("accepts valid input", () => {
    expect(validateSignUpInput("jordan@vector.dev", "supersecret")).toBeNull();
  });
});

describe("interpretSignUp", () => {
  it("redirects into the product when a session is returned (auto-confirm)", () => {
    const out = interpretSignUp(
      { user: { identities: [{}] }, session: { access_token: "x" } },
      null,
    );
    expect(out).toEqual({ kind: "redirect", to: "/console?welcome=true" });
  });

  it("asks the user to check email when confirmation is required", () => {
    const out = interpretSignUp({ user: { identities: [{}] }, session: null }, null);
    expect(out.kind).toBe("check-email");
  });

  it("detects an already-registered email via the empty identities quirk", () => {
    const out = interpretSignUp({ user: { identities: [] }, session: null }, null);
    expect(out.kind).toBe("already-registered");
  });

  it("detects an already-registered email via the error message", () => {
    const out = interpretSignUp(null, { message: "User already registered" });
    expect(out.kind).toBe("already-registered");
  });

  it("passes through other errors verbatim", () => {
    const out = interpretSignUp(null, { message: "Password is too weak" });
    expect(out).toEqual({ kind: "error", message: "Password is too weak" });
  });
});
