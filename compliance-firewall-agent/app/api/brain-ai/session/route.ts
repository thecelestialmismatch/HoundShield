/**
 * Brain AI — Session Routes
 *
 * GET    /api/brain-ai/session?id=<sessionId>  — retrieve YOUR session
 * POST   /api/brain-ai/session                 — create a session you own
 * DELETE /api/brain-ai/session?id=<sessionId>  — delete YOUR session
 *
 * WHAT THIS REPLACES — three findings in one 63-line file, all unauthenticated
 * and live in production (verified 2026-08-11: an anonymous GET returned 200):
 *
 *   1. `GET` with no `id` returned `listSessionIds()` — every session id in the
 *      store, for every user. Not a guessing problem: an enumeration endpoint.
 *   2. `GET ?id=<any>` returned the full StoredSession, conversation history
 *      included, with no ownership check. Classic IDOR, and step 1 handed you
 *      the ids.
 *   3. `DELETE ?id=<any>` destroyed any session, again with no check.
 *
 *   Ids were minted as `brain-${Date.now()}-${Math.random().toString(36)...}` —
 *   weakly random, though that hardly mattered while (1) enumerated them.
 *
 * Today's containment was accidental, not designed: `lib/brain-ai/session-store.ts`
 * falls back to a per-instance in-memory Map on serverless, so a cold instance
 * held only its own sessions. The moment Brain AI moves to shared storage —
 * the obvious next step — that becomes a cross-tenant conversation read. Fixed
 * here on the code as written, not on the accident.
 *
 * HOW OWNERSHIP IS ENFORCED. Every id is namespaced with the server-resolved
 * user id (`scopedSessionId`), so the id a caller supplies can only ever
 * address their own row. The prefix is never read from the request, so it
 * cannot be forged. The list-everything branch is gone entirely — no caller
 * needed it, and there is no safe version of it.
 */

import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import {
  loadSession,
  saveSession,
  deleteSession,
  createSession,
} from '@/lib/brain-ai';
import { guardBrainAi, scopedSessionId } from '@/lib/brain-ai/route-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** One response for "no such session" and "not yours" — the difference is not the caller's business. */
const notFound = () => Response.json({ error: 'Session not found' }, { status: 404 });

export async function GET(req: NextRequest) {
  const { blocked, user } = await guardBrainAi(req, 'read');
  if (blocked) return blocked;

  const rawId = req.nextUrl.searchParams.get('id');
  // No list-all branch. It existed, it leaked every tenant's ids, and nothing
  // in the app called it.
  if (!rawId) return Response.json({ error: 'id is required' }, { status: 400 });

  const session = await loadSession(scopedSessionId(user!.id, rawId));
  if (!session) return notFound();
  return Response.json({ ...session, sessionId: rawId });
}

export async function POST(req: NextRequest) {
  const { blocked, user } = await guardBrainAi(req, 'read');
  if (blocked) return blocked;

  let body: { systemPrompt?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // The id is minted server-side with a CSPRNG. A client-supplied id would let
  // a caller pick a value that collides with — or probes for — another's.
  const rawId = randomUUID();
  const session = createSession(
    scopedSessionId(user!.id, rawId),
    typeof body.systemPrompt === 'string' ? body.systemPrompt.slice(0, 8_000) : undefined,
  );
  await saveSession(session);

  // Hand back the unscoped id: the prefix is an internal tenancy detail and
  // echoing it would tell a caller exactly what to try to forge.
  return Response.json({ session: { ...session, sessionId: rawId }, created: true });
}

export async function DELETE(req: NextRequest) {
  const { blocked, user } = await guardBrainAi(req, 'read');
  if (blocked) return blocked;

  const rawId = req.nextUrl.searchParams.get('id');
  if (!rawId) return Response.json({ error: 'id is required' }, { status: 400 });

  const scoped = scopedSessionId(user!.id, rawId);
  // Confirm it is ours before deleting, so a delete cannot be used as an
  // existence oracle for someone else's session.
  const existing = await loadSession(scoped);
  if (!existing) return notFound();

  await deleteSession(scoped);
  return Response.json({ deleted: true, sessionId: rawId });
}
