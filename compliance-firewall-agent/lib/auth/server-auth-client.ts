/**
 * Browser-side caller for the server credential routes, with the 501 fallback.
 *
 * The rollback story lives here. When AUTH_SERVER_ROUTES=off the routes answer
 * 501 and this returns `{ kind: 'unavailable' }`, which every caller treats as
 * "do what you did before" — i.e. call Supabase directly from the browser.
 * That makes the new path revertible with one server-side environment change
 * and no rebuild, which matters because NEXT_PUBLIC_* values are inlined at
 * build time and a public flag would have needed a redeploy to flip.
 *
 * A network failure is NOT a fallback. If the request never reached us we
 * cannot know whether the server path is on, and silently dropping to the
 * unlimited direct-to-GoTrue call would hand an attacker a way to switch the
 * rate limiting off by causing errors. It reports an error instead.
 */

export type ServerAuthResult =
  | { kind: 'ok'; data: Record<string, unknown> }
  | { kind: 'error'; message: string; status: number; captchaRequired: boolean }
  | { kind: 'unavailable' };

const NETWORK_ERROR = "We couldn't reach the sign-in service. Please try again in a moment.";
const UNREADABLE = 'Something went wrong. Please try again.';

export async function postAuth(path: string, body: unknown): Promise<ServerAuthResult> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return { kind: 'error', message: NETWORK_ERROR, status: 0, captchaRequired: false };
  }

  // Route switched off — the caller reverts to its legacy direct-to-Supabase path.
  if (res.status === 501) return { kind: 'unavailable' };

  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    // Empty or non-JSON body: treat a 2xx as success, anything else as failure.
    if (res.ok) return { kind: 'ok', data: {} };
    return { kind: 'error', message: UNREADABLE, status: res.status, captchaRequired: false };
  }

  if (res.ok) return { kind: 'ok', data };

  return {
    kind: 'error',
    message: typeof data.error === 'string' && data.error.trim() ? data.error : UNREADABLE,
    status: res.status,
    captchaRequired: data.captchaRequired === true,
  };
}
