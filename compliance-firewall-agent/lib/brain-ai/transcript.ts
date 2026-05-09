/**
 * Brain AI — Transcript
 *
 * Exports conversation transcripts in multiple formats.
 * Brain AI original implementation for Hound Shield.
 */

import { StoredSession } from "./models";
import { loadSession } from "./session-store";

export type TranscriptFormat = "markdown" | "json" | "text" | "html";

export interface TranscriptOptions {
  format?: TranscriptFormat;
  includeTimestamps?: boolean;
  includeTokenUsage?: boolean;
  title?: string;
}

export async function generateTranscript(
  sessionId: string,
  options: TranscriptOptions = {}
): Promise<string | null> {
  const session = await loadSession(sessionId);
  if (!session) return null;
  return formatTranscript(session, options);
}

export function formatTranscript(
  session: StoredSession,
  options: TranscriptOptions = {}
): string {
  const { format = "markdown", includeTimestamps = false, includeTokenUsage = false, title } = options;

  const messages = session.messages.filter((m) => m.role !== "system");

  switch (format) {
    case "markdown":
      return toMarkdown(session, messages, { includeTimestamps, includeTokenUsage, title });
    case "text":
      return toPlainText(session, messages, { title });
    case "json":
      return JSON.stringify(
        {
          sessionId: session.sessionId,
          createdAt: new Date(session.createdAt).toISOString(),
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          tokens: { input: session.inputTokens, output: session.outputTokens },
        },
        null,
        2
      );
    case "html":
      return toHtml(session, messages, { title });
    default:
      return toMarkdown(session, messages, { includeTimestamps, includeTokenUsage, title });
  }
}

function toMarkdown(
  session: StoredSession,
  messages: StoredSession["messages"],
  opts: { includeTimestamps: boolean; includeTokenUsage: boolean; title?: string }
): string {
  const lines = [
    `# ${opts.title ?? "Brain AI Conversation Transcript"}`,
    `**Session ID:** ${session.sessionId}`,
    `**Date:** ${new Date(session.createdAt).toISOString().split("T")[0]}`,
    "",
  ];

  if (opts.includeTokenUsage) {
    lines.push(
      `**Tokens used:** ${session.inputTokens + session.outputTokens} (${session.inputTokens} in / ${session.outputTokens} out)`,
      ""
    );
  }

  lines.push("---", "");

  for (const msg of messages) {
    const label = msg.role === "user" ? "**You**" : "**Brain AI**";
    lines.push(label);
    lines.push(msg.content);
    lines.push("");
  }

  return lines.join("\n");
}

function toPlainText(
  session: StoredSession,
  messages: StoredSession["messages"],
  opts: { title?: string }
): string {
  const lines = [
    opts.title ?? "Brain AI Conversation Transcript",
    `Session: ${session.sessionId}`,
    `Date: ${new Date(session.createdAt).toISOString().split("T")[0]}`,
    "",
    "=" .repeat(60),
    "",
  ];

  for (const msg of messages) {
    const label = msg.role === "user" ? "YOU:" : "BRAIN AI:";
    lines.push(label);
    lines.push(msg.content);
    lines.push("");
  }

  return lines.join("\n");
}

function toHtml(
  session: StoredSession,
  messages: StoredSession["messages"],
  opts: { title?: string }
): string {
  const title = opts.title ?? "Brain AI Transcript";
  const msgHtml = messages
    .map((m) => {
      const cls = m.role === "user" ? "user" : "assistant";
      const label = m.role === "user" ? "You" : "Brain AI";
      return `<div class="msg ${cls}"><strong>${label}:</strong><p>${escapeHtml(m.content)}</p></div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${escapeHtml(title)}</title>
<style>
body{font-family:system-ui,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;color:#1a1a2e;}
h1{color:#4f46e5;}.msg{margin:1rem 0;padding:1rem;border-radius:8px;}
.user{background:#f0f0ff;border-left:3px solid #6366f1;}
.assistant{background:#f0fff4;border-left:3px solid #10b981;}
strong{display:block;margin-bottom:.5rem;font-size:.85rem;opacity:.7;}
p{margin:0;white-space:pre-wrap;}
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<p><small>Session: ${escapeHtml(session.sessionId)} · ${new Date(session.createdAt).toLocaleDateString()}</small></p>
${msgHtml}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
