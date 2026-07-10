import { NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { getAuth, isBetterAuthEnabled } from "@/lib/auth/better-auth";

/**
 * Better Auth catch-all handler (/api/auth/*): sign-in, sign-up, social
 * callbacks, session, sign-out.
 *
 * Gated: when Better Auth is disabled (default, app on Supabase) this returns
 * 501 rather than constructing an auth instance, so the route is inert until
 * the founder flips AUTH_PROVIDER=better-auth. GitHub/Google OAuth callbacks
 * land at /api/auth/callback/{provider}.
 */

const auth = getAuth();

function disabled() {
  return NextResponse.json(
    { error: "Better Auth is not enabled (AUTH_PROVIDER!=better-auth)." },
    { status: 501 },
  );
}

const handlers = auth && isBetterAuthEnabled() ? toNextJsHandler(auth) : null;

export async function GET(req: Request) {
  return handlers ? handlers.GET(req) : disabled();
}

export async function POST(req: Request) {
  return handlers ? handlers.POST(req) : disabled();
}
