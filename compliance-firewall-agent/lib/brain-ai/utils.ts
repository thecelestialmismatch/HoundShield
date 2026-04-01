/**
 * Brain AI — Utilities
 *
 * Shared helpers for formatting, ID generation, text processing, and REPL support.
 * Brain AI original implementation for Kaelus.online.
 */

// ─── ID generation ─────────────────────────────────────────────────────────────

export function generateId(prefix = "id"): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const ts = Date.now().toString(36);
  return `${prefix}_${ts}${rand}`;
}

export function generateSessionId(): string {
  return generateId("sess");
}

export function generateCallId(): string {
  return generateId("call");
}

// ─── Text helpers ─────────────────────────────────────────────────────────────

export function truncate(text: string, maxLen: number, suffix = "…"): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - suffix.length) + suffix;
}

export function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .trim();
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateReadingTimeMin(text: string): number {
  return Math.ceil(countWords(text) / 200);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function capitalize(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function titleCase(text: string): string {
  return text
    .split(/\s+/)
    .map((w) => capitalize(w.toLowerCase()))
    .join(" ");
}

// ─── Number / formatting ───────────────────────────────────────────────────────

export function formatNumber(n: number, decimals = 0): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDurationMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ─── Object helpers ────────────────────────────────────────────────────────────

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const k of keys) delete result[k];
  return result as Omit<T, K>;
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const k of keys) result[k] = obj[k];
  return result;
}

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ─── Array helpers ─────────────────────────────────────────────────────────────

export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function sortBy<T>(arr: T[], key: (item: T) => number | string, dir: "asc" | "desc" = "asc"): T[] {
  return [...arr].sort((a, b) => {
    const av = key(a), bv = key(b);
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === "asc" ? cmp : -cmp;
  });
}

// ─── Async helpers ─────────────────────────────────────────────────────────────

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 500
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) await sleep(delayMs * attempt);
    }
  }
  throw lastError;
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ]);
}

// ─── REPL / interactive helpers ───────────────────────────────────────────────

export interface ReplLine {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export function buildReplPrompt(lines: ReplLine[]): string {
  return lines
    .map((l) => {
      const prefix = l.role === "user" ? "You" : l.role === "assistant" ? "Brain AI" : "System";
      return `**${prefix}:** ${l.content}`;
    })
    .join("\n\n");
}

export function parseDeepLinkQuery(url: string): string | null {
  try {
    const u = new URL(url);
    return u.searchParams.get("q");
  } catch {
    return null;
  }
}

export function buildDeepLink(baseUrl: string, prompt: string): string {
  const u = new URL("/chat", baseUrl);
  u.searchParams.set("q", prompt);
  return u.toString();
}

// ─── Compliance-specific utils ────────────────────────────────────────────────

export function maskPII(text: string): string {
  return text
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "***-**-****")           // SSN
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "**** **** **** ****")  // credit card
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[EMAIL]")
    .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[PHONE]");
}

export function isCUIKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = [
    "controlled unclassified", "cui", "itar", "fouo", "official use only",
    "export controlled", "sensitive but unclassified", "sbu",
  ];
  return keywords.some((k) => lower.includes(k));
}
