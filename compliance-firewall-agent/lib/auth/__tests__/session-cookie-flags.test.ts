import { describe, it, expect } from "vitest";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { createServerClient, DEFAULT_COOKIE_OPTIONS } from "@supabase/ssr";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Audit finding #2 — the session cookie's flags.
 *
 * Every one of these four values is INHERITED from @supabase/ssr rather than
 * declared by this codebase, so a dependency bump could change any of them in
 * either direction and nothing would notice. The audit asked for exactly this
 * test. It asserts against the installed library and against a real cookie
 * write, not against documentation.
 *
 * The `maxAge` case is the important one. The audit recommended shortening the
 * session "via cookieOptions on createServerClient". That is not implementable
 * in 0.12.4: the library spreads caller options and then overwrites `maxAge`
 * with its own default on both set paths. Shipping that recommendation would
 * have produced a diff that reads like a fix and changes nothing — so this test
 * pins the library's actual behaviour. When an upgrade starts honouring the
 * option, this goes red, and that redness is the signal that the session
 * lifetime can finally be set in code instead of in the Supabase dashboard.
 */

/**
 * Drive one real session write and capture the options handed to `setAll`.
 * A local stub stands in for GoTrue so `setSession` completes without leaving
 * the machine (it performs a user lookup before persisting).
 */
async function captureSessionCookieOptions(
  cookieOptions?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const srv = createServer((_req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        id: "00000000-0000-0000-0000-000000000000",
        aud: "authenticated",
        role: "authenticated",
        email: "probe@example.test",
      }),
    );
  });
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", () => r()));

  try {
    const { port } = srv.address() as AddressInfo;
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const jwt = [
      b64({ alg: "HS256", typ: "JWT" }),
      b64({
        sub: "00000000-0000-0000-0000-000000000000",
        exp: Math.floor(Date.now() / 1000) + 3600,
        aud: "authenticated",
        role: "authenticated",
      }),
      // Must be valid base64url: auth-js rejects a segment whose length % 4 == 1.
      Buffer.from("signature").toString("base64url"),
    ].join(".");

    const captured: Array<Record<string, unknown>> = [];
    const client = createServerClient(`http://127.0.0.1:${port}`, "a".repeat(40), {
      ...(cookieOptions ? { cookieOptions } : {}),
      cookies: {
        getAll: () => [],
        setAll: (list) =>
          captured.push(...list.map((c) => (c.options ?? {}) as Record<string, unknown>)),
      },
    });

    const { error } = await client.auth.setSession({
      access_token: jwt,
      refresh_token: "refresh-token",
    });
    expect(error, "stub auth server should let setSession complete").toBeNull();
    expect(captured.length, "a session cookie should have been written").toBeGreaterThan(0);
    return captured[0];
  } finally {
    srv.close();
  }
}

describe("session cookie flags are pinned, not inherited silently", () => {
  it("the library defaults are still the four values the audit recorded", () => {
    // If any of these change under a dependency bump, the reasoning in
    // lib/supabase/server.ts and in docs/SECURITY-PHASE-2-AUDIT.md #2 needs
    // re-checking — including the claim that httpOnly cannot simply be flipped.
    expect(DEFAULT_COOKIE_OPTIONS).toMatchObject({
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      maxAge: 400 * 24 * 60 * 60,
    });
  });

  it("SameSite=Lax holds — it is the CSRF defence finding #1 leans on", async () => {
    const options = await captureSessionCookieOptions();
    expect(options.sameSite).toBe("lax");
  });

  it("secure IS honoured when passed — this is the half of #2 that shipped", async () => {
    const options = await captureSessionCookieOptions({ secure: true });
    expect(options.secure).toBe(true);
  });

  it("maxAge is NOT honoured — the audit's recommended fix is a no-op here", async () => {
    const THIRTY_DAYS = 60 * 60 * 24 * 30;
    const options = await captureSessionCookieOptions({ maxAge: THIRTY_DAYS });

    // The requested value is discarded and the library's own default is
    // substituted. Documented at @supabase/ssr cookies.js:231-234 and :461-465.
    expect(options.maxAge).not.toBe(THIRTY_DAYS);
    expect(options.maxAge).toBe(DEFAULT_COOKIE_OPTIONS.maxAge);
  });

  it("server.ts sets secure and does NOT pretend to set maxAge", () => {
    // Source assertion, deliberately: a future edit adding `maxAge` here would
    // look like a session-lifetime fix in review while doing nothing at all.
    const src = readFileSync(resolve(process.cwd(), "lib/supabase/server.ts"), "utf8");
    expect(src).toMatch(/cookieOptions:\s*\{/);
    expect(src).toMatch(/secure:\s*process\.env\.NODE_ENV === 'production'/);

    const cookieOptionsBlock = src.match(/cookieOptions:\s*\{[^}]*\}/s)?.[0] ?? "";
    expect(
      cookieOptionsBlock,
      "maxAge in cookieOptions is silently discarded by @supabase/ssr — set the session lifetime in the Supabase dashboard instead",
    ).not.toMatch(/maxAge/);
  });

  it("httpOnly stays false, and the browser client is the reason", () => {
    // Not a defect to fix in passing: lib/supabase/browser.ts reads the session
    // from this cookie client-side. This pins the dependency so the comment in
    // server.ts cannot quietly become false.
    expect(DEFAULT_COOKIE_OPTIONS.httpOnly).toBe(false);
    const browser = readFileSync(resolve(process.cwd(), "lib/supabase/browser.ts"), "utf8");
    expect(browser).toMatch(/createBrowserClient/);
  });
});
