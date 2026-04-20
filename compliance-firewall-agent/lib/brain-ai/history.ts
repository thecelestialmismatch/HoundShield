/**
 * Brain AI — Conversation History
 *
 * Manages conversation history with compaction to prevent unbounded growth.
 * Brain AI original implementation for Hound Shield.
 */

import { StoredMessage } from "./models";

export interface HistoryEntry {
  role: StoredMessage["role"];
  content: string;
  timestamp: number;
  tokens?: number;
  toolCallId?: string;
  name?: string;
}

export interface CompactedHistory {
  messages: HistoryEntry[];
  droppedCount: number;
  summarized: boolean;
}

const DEFAULT_MAX_MESSAGES = 50;
const DEFAULT_MAX_TOKENS = 4000;

/**
 * Compact conversation history to stay within limits.
 * Preserves: system message, last N user/assistant turns.
 * Drops: oldest middle messages.
 */
export function compactHistory(
  messages: HistoryEntry[],
  options: {
    maxMessages?: number;
    maxTokens?: number;
    keepSystemMessage?: boolean;
  } = {}
): CompactedHistory {
  const maxMessages = options.maxMessages ?? DEFAULT_MAX_MESSAGES;
  const keepSystem = options.keepSystemMessage ?? true;

  if (messages.length <= maxMessages) {
    return { messages, droppedCount: 0, summarized: false };
  }

  const system = keepSystem ? messages.filter((m) => m.role === "system") : [];
  const nonSystem = messages.filter((m) => m.role !== "system");

  // Keep first system + last (maxMessages - system.length) non-system messages
  const keep = maxMessages - system.length;
  const trimmed = nonSystem.slice(-keep);
  const dropped = nonSystem.length - trimmed.length;

  return {
    messages: [...system, ...trimmed],
    droppedCount: dropped,
    summarized: false,
  };
}

/**
 * Convert StoredMessages to HistoryEntries.
 */
export function fromStoredMessages(messages: StoredMessage[]): HistoryEntry[] {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
    timestamp: Date.now(),
    toolCallId: m.toolCallId,
    name: m.name,
  }));
}

/**
 * Convert HistoryEntries to StoredMessages.
 */
export function toStoredMessages(entries: HistoryEntry[]): StoredMessage[] {
  return entries.map((e) => ({
    role: e.role,
    content: e.content,
    toolCallId: e.toolCallId,
    name: e.name,
  }));
}

/**
 * Estimate token count for a message (whitespace tokenization approximation).
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

/**
 * Estimate total tokens in a history.
 */
export function estimateTotalTokens(messages: HistoryEntry[]): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
}

/**
 * Build a history manager for a session.
 */
export class HistoryManager {
  private entries: HistoryEntry[] = [];
  private maxMessages: number;

  constructor(maxMessages = DEFAULT_MAX_MESSAGES) {
    this.maxMessages = maxMessages;
  }

  add(entry: HistoryEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.maxMessages) {
      const compacted = compactHistory(this.entries, {
        maxMessages: this.maxMessages,
      });
      this.entries = compacted.messages;
    }
  }

  addUser(content: string): void {
    this.add({ role: "user", content, timestamp: Date.now() });
  }

  addAssistant(content: string): void {
    this.add({ role: "assistant", content, timestamp: Date.now() });
  }

  addSystem(content: string): void {
    // System message goes at the front
    this.entries = [
      { role: "system", content, timestamp: Date.now() },
      ...this.entries.filter((e) => e.role !== "system"),
    ];
  }

  getAll(): HistoryEntry[] {
    return [...this.entries];
  }

  getLast(n: number): HistoryEntry[] {
    return this.entries.slice(-n);
  }

  clear(): void {
    const system = this.entries.filter((e) => e.role === "system");
    this.entries = system;
  }

  toStoredMessages(): StoredMessage[] {
    return toStoredMessages(this.entries);
  }

  estimatedTokens(): number {
    return estimateTotalTokens(this.entries);
  }

  get length(): number {
    return this.entries.length;
  }
}
