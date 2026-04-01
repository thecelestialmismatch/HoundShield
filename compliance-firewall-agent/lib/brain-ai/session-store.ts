/**
 * Brain AI — Session Store
 *
 * File-based JSON session persistence. Sessions survive server restarts.
 * generalized to TypeScript.
 *
 * In Vercel (serverless): falls back to in-memory store.
 * In Docker/Node server:  persists to .brain-sessions/ directory.
 */

import { StoredSession, StoredMessage } from "./models";

const SESSION_DIR = ".brain-sessions";
const MAX_MEMORY_SESSIONS = 500;

// In-memory fallback (used in serverless / when fs is unavailable)
const memoryStore = new Map<string, StoredSession>();

function isFileSystemAvailable(): boolean {
  try {
    if (typeof process === "undefined") return false;
    // In Next.js edge runtime, fs is not available
    if (process.env.NEXT_RUNTIME === "edge") return false;
    return true;
  } catch {
    return false;
  }
}

async function ensureSessionDir(): Promise<void> {
  if (!isFileSystemAvailable()) return;
  try {
    const { mkdir } = await import("fs/promises");
    await mkdir(SESSION_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

function sessionPath(sessionId: string): string {
  return `${SESSION_DIR}/${sessionId.replace(/[^a-zA-Z0-9-_]/g, "_")}.json`;
}

export async function saveSession(session: StoredSession): Promise<void> {
  const updated: StoredSession = { ...session, updatedAt: Date.now() };

  if (isFileSystemAvailable()) {
    try {
      await ensureSessionDir();
      const { writeFile } = await import("fs/promises");
      await writeFile(sessionPath(session.sessionId), JSON.stringify(updated, null, 2), "utf-8");
      return;
    } catch {
      // fall through to memory
    }
  }

  // In-memory fallback
  if (memoryStore.size >= MAX_MEMORY_SESSIONS) {
    // Evict oldest
    const oldest = [...memoryStore.entries()].sort((a, b) => a[1].updatedAt - b[1].updatedAt)[0];
    if (oldest) memoryStore.delete(oldest[0]);
  }
  memoryStore.set(session.sessionId, updated);
}

export async function loadSession(sessionId: string): Promise<StoredSession | null> {
  if (isFileSystemAvailable()) {
    try {
      const { readFile } = await import("fs/promises");
      const raw = await readFile(sessionPath(sessionId), "utf-8");
      return JSON.parse(raw) as StoredSession;
    } catch {
      // not found or parse error
    }
  }

  return memoryStore.get(sessionId) ?? null;
}

export async function deleteSession(sessionId: string): Promise<void> {
  if (isFileSystemAvailable()) {
    try {
      const { unlink } = await import("fs/promises");
      await unlink(sessionPath(sessionId));
    } catch {
      // ignore
    }
  }
  memoryStore.delete(sessionId);
}

export async function listSessionIds(): Promise<string[]> {
  if (isFileSystemAvailable()) {
    try {
      const { readdir } = await import("fs/promises");
      const files = await readdir(SESSION_DIR);
      return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
    } catch {
      // fall through
    }
  }
  return [...memoryStore.keys()];
}

export function createSession(
  sessionId: string,
  systemPrompt?: string
): StoredSession {
  const now = Date.now();
  const messages: StoredMessage[] = systemPrompt
    ? [{ role: "system", content: systemPrompt }]
    : [];
  return {
    sessionId,
    messages,
    inputTokens: 0,
    outputTokens: 0,
    createdAt: now,
    updatedAt: now,
    metadata: {},
  };
}

export function appendMessage(
  session: StoredSession,
  message: StoredMessage
): StoredSession {
  const messages = [...session.messages, message];
  // Keep at most 100 messages (prune oldest non-system messages)
  if (messages.length > 100) {
    const system = messages.filter((m) => m.role === "system");
    const rest = messages.filter((m) => m.role !== "system").slice(-97);
    return { ...session, messages: [...system, ...rest] };
  }
  return { ...session, messages };
}

export function addTokenUsage(
  session: StoredSession,
  inputTokens: number,
  outputTokens: number
): StoredSession {
  return {
    ...session,
    inputTokens: session.inputTokens + inputTokens,
    outputTokens: session.outputTokens + outputTokens,
  };
}
