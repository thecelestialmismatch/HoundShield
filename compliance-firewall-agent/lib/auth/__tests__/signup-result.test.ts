import { describe, it, expect } from "vitest";
import {
  interpretSignUp,
  signUpErrorMessage,
  validateSignUpInput,
} from "@/lib/auth/signup-result";

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

describe("interpretSignUp — happy paths", () => {
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
});

describe("interpretSignUp — error path is bulletproof", () => {
  it("detects an already-registered email via the error message", () => {
    const out = interpretSignUp(null, { message: "User already registered" });
    expect(out.kind).toBe("already-registered");
  });

  it("treats a raw DB unique-constraint violation as already-registered", () => {
    const out = interpretSignUp(null, {
      message: 'duplicate key value violates unique constraint "profiles_email_unique"',
    });
    expect(out.kind).toBe("already-registered");
  });

  it("passes through a genuine, human error verbatim", () => {
    const out = interpretSignUp(null, { message: "Password should be at least 6 characters" });
    expect(out).toEqual({ kind: "error", message: "Password should be at least 6 characters" });
  });

  // Regression: the 2026-07-20 incident — the banner rendered a literal "{}".
  it('never surfaces a stringified-empty-object "{}" message', () => {
    const out = interpretSignUp(null, { message: "{}" });
    expect(out.kind).toBe("error");
    if (out.kind === "error") {
      expect(out.message).not.toBe("{}");
      expect(out.message).toMatch(/try again/i);
    }
  });

  // A Supabase AuthError is an Error subclass with non-enumerable fields.
  it("gives a human message for a bare Error instance (non-enumerable fields)", () => {
    const out = interpretSignUp(null, new Error("Database error creating new user"));
    expect(out).toEqual({
      kind: "error",
      message: expect.stringMatching(/temporary problem|try again/i),
    });
  });

  it("gives a human message when the error object carries no usable message", () => {
    for (const bad of [{}, { message: null }, { message: undefined }, { message: "" }]) {
      const out = interpretSignUp(null, bad);
      expect(out.kind).toBe("error");
      if (out.kind === "error") expect(out.message.length).toBeGreaterThan(10);
    }
  });

  it("maps rate-limit errors to a wait-and-retry message", () => {
    const out = interpretSignUp(null, {
      message: "For security purposes, you can only request this after 45 seconds",
    });
    expect(out).toEqual({
      kind: "error",
      message: expect.stringMatching(/wait a minute|too many/i),
    });
  });
});

describe("signUpErrorMessage — shared safe mapper (Better Auth + Supabase)", () => {
  it("never returns an empty or object-looking string", () => {
    for (const bad of [null, undefined, {}, new Error(), { message: "{}" }, { message: "  " }]) {
      const msg = signUpErrorMessage(bad);
      expect(msg.trim().length).toBeGreaterThan(10);
      expect(msg).not.toBe("{}");
      expect(msg.toLowerCase()).not.toBe("[object object]");
    }
  });

  it("returns the already-registered guidance for a duplicate email", () => {
    expect(signUpErrorMessage({ message: "user already exists" })).toMatch(/already registered/i);
  });

  it("passes a specific, usable message through unchanged", () => {
    expect(signUpErrorMessage({ message: "Password is too weak" })).toBe("Password is too weak");
  });

  it("accepts a plain string error", () => {
    expect(signUpErrorMessage("Signups are disabled")).toBe("Signups are disabled");
  });
});
