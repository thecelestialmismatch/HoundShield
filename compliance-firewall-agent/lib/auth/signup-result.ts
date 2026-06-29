/**
 * Pure interpretation of a Supabase email sign-up result. Extracted from the
 * signup page so the branching — which is easy to get subtly wrong — is unit
 * tested independently of React and the network.
 *
 * The three Supabase quirks this handles:
 *   1. Auto-confirm ON  -> a `session` is returned; the account is already live.
 *   2. Email confirm ON -> `session` is null; the user must click an email link.
 *   3. Email already in use -> Supabase returns a user with an EMPTY identities
 *      array and NO error (to avoid leaking which emails exist). Without this
 *      check the tester is told to "check your email" for an account that is
 *      already theirs.
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

export function interpretSignUp(
  data: SignUpResultLike | null,
  error: { message: string } | null,
): SignUpOutcome {
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return { kind: "already-registered" };
    }
    return { kind: "error", message: error.message };
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
