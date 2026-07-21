/**
 * Pure interpretation of a Supabase (or Better Auth) email sign-up result.
 * Extracted from the signup page so the branching — which is easy to get subtly
 * wrong — is unit tested independently of React and the network.
 *
 * The three Supabase quirks this handles:
 *   1. Auto-confirm ON  -> a `session` is returned; the account is already live.
 *   2. Email confirm ON -> `session` is null; the user must click an email link.
 *   3. Email already in use -> Supabase returns a user with an EMPTY identities
 *      array and NO error (to avoid leaking which emails exist). Without this
 *      check the tester is told to "check your email" for an account that is
 *      already theirs.
 *
 * And one hard-won rule about the ERROR path: never surface a raw error object
 * to the user. A Supabase `AuthError` is an `Error` subclass whose fields are
 * non-enumerable, so `JSON.stringify(err)` (or any accidental coercion) yields
 * the string `"{}"` — which once rendered in the signup banner as a literal
 * empty object (see 2026-07-20 incident). `extractMessage` + the mappers below
 * guarantee every error becomes a safe, human, non-empty message.
 */

export type SignUpOutcome =
  | { kind: "redirect"; to: string }
  | { kind: "check-email" }
  | { kind: "already-registered" }
  | { kind: "error"; message: string };

export interface SignUpResultLike {
  user: { identities?: unknown[] | null } | null;
  session: unknown | null;
}

const ALREADY_REGISTERED_MESSAGE =
  "That email is already registered. Sign in instead — and if you first signed up with Google or GitHub, use that button above.";
const GENERIC_ERROR_MESSAGE =
  "We couldn't create your account just now — a temporary problem on our end. Please try again in a minute.";
const RATE_LIMIT_MESSAGE =
  "Too many attempts — please wait a minute, then try again.";

// Values that are technically strings but carry no meaning for a human. A
// stringified Error/empty object lands here, which is the whole point.
const JUNK_MESSAGES = new Set(["", "{}", "[]", "[object object]", "null", "undefined"]);

/** Best-effort human string from any auth error shape; "" when nothing usable. */
function extractMessage(error: unknown): string {
  let raw = "";
  if (typeof error === "string") raw = error;
  else if (error instanceof Error) raw = error.message ?? "";
  else if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") raw = message;
  }
  raw = raw.trim();
  return JUNK_MESSAGES.has(raw.toLowerCase()) ? "" : raw;
}

/** Email collision — Supabase text, a raw DB unique-constraint violation, or Better Auth. */
function isDuplicateEmail(low: string): boolean {
  return (
    low.includes("already") ||
    low.includes("registered") ||
    low.includes("exists") ||
    low.includes("duplicate key") ||
    low.includes("unique constraint") ||
    low.includes("profiles_email_unique")
  );
}

/** Opaque 5xx from GoTrue (e.g. a failing DB trigger) — never show the raw text. */
function isOpaqueServerError(low: string): boolean {
  return (
    low.includes("database error") ||
    low.includes("unexpected_failure") ||
    low.includes("error creating new user") ||
    low.includes("internal server")
  );
}

function isRateLimited(low: string): boolean {
  return (
    low.includes("rate limit") ||
    low.includes("too many") ||
    low.includes("security purposes")
  );
}

/**
 * Any sign-up error -> a safe, human, never-empty, never-"{}" message.
 * Shared by both the Supabase and Better Auth code paths.
 */
export function signUpErrorMessage(error: unknown): string {
  const raw = extractMessage(error);
  const low = raw.toLowerCase();
  if (isDuplicateEmail(low)) return ALREADY_REGISTERED_MESSAGE;
  if (isRateLimited(low)) return RATE_LIMIT_MESSAGE;
  if (!raw || isOpaqueServerError(low)) return GENERIC_ERROR_MESSAGE;
  return raw;
}

export function interpretSignUp(
  data: SignUpResultLike | null,
  error: unknown,
): SignUpOutcome {
  if (error) {
    const raw = extractMessage(error);
    const low = raw.toLowerCase();
    if (isDuplicateEmail(low)) return { kind: "already-registered" };
    if (isRateLimited(low)) return { kind: "error", message: RATE_LIMIT_MESSAGE };
    if (!raw || isOpaqueServerError(low)) {
      return { kind: "error", message: GENERIC_ERROR_MESSAGE };
    }
    return { kind: "error", message: raw };
  }

  if (data?.user && (data.user.identities?.length ?? 0) === 0) {
    return { kind: "already-registered" };
  }

  if (data?.session) {
    return { kind: "redirect", to: "/console?welcome=true" };
  }

  return { kind: "check-email" };
}

/** Returns an error string for invalid input, or null when the input is valid. */
export function validateSignUpInput(email: string, password: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}
