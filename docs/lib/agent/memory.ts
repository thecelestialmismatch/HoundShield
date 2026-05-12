// ============================================================================
// Hound Shield Agent Memory System
// Short-term (conversation), medium-term (session insights), long-term (knowledge)
// ============================================================================

import { MemoryEntry, OpenRouterMessage } from './types';

interface MemoryStore {
  conversations: Map<string, OpenRouterMessage[]>;
  insights: MemoryEntry[];
  preferences: Map<string, string>;
  executionHistory: Array<{
    id: string;
    agentName: string;
    task: string;
    result: string;
    timestamp: number;
    tokens: number;
    cost: number;
  }>;
}

// Singleton memory store
const globalMem = globalThis as unknown as { __houndshield_memory?: MemoryStore };
if (!globalMem.__houndshield_memory) {
  globalMem.__houndshield_memory = {
    conversations: new Map(),
    insights: [],
    preferences: new Map(),
    executionHistory: [],
  };
}
const memory = globalMem.__houndshield_memory;

export const agentMemory = {
  // ---- Conversation Memory ----
  getConversation(sessionId: string): OpenRouterMessage[] {
    return memory.conversations.get(sessionId) || [];
  },

  addMessage(sessionId: string, message: OpenRouterMessage): void {
    if (!memory.conversations.has(sessionId)) {
      memory.conversations.set(sessionId, []);
    }
    memory.conversations.get(sessionId)!.push(message);

    // Keep last 50 messages per conversation to prevent memory bloat
    const msgs = memory.conversations.get(sessionId)!;
    if (msgs.length > 50) {
      memory.conversations.set(sessionId, msgs.slice(-50));
    }
  },

  clearConversation(sessionId: string): void {
    memory.conversations.delete(sessionId);
  },

  // ---- Insights Memory ----
  addInsight(content: string, tags: string[] = []): string {
    const id = `insight_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    memory.insights.push({
      id,
      type: 'insight',
      content,
      metadata: {},
      timestamp: Date.now(),
      tags,
    });

    // Keep last 100 insights
    if (memory.insights.length > 100) {
      memory.insights = memory.insights.slice(-100);
    }

    return id;
  },

  getInsights(tags?: string[]): MemoryEntry[] {
    if (!tags || tags.length === 0) return memory.insights;
    return memory.insights.filter(i =>
      tags.some(tag => i.tags.includes(tag))
    );
  },

  searchInsights(query: string): MemoryEntry[] {
    const terms = query.toLowerCase().split(/\s+/);
    return memory.insights
      .filter(i => terms.some(t => i.content.toLowerCase().includes(t)))
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  // ---- Preferences ----
  setPreference(key: string, value: string): void {
    memory.preferences.set(key, value);
  },

  getPreference(key: string): string | undefined {
    return memory.preferences.get(key);
  },

  getAllPreferences(): Record<string, string> {
    return Object.fromEntries(memory.preferences);
  },

  // ---- Execution History ----
  addExecution(entry: MemoryStore['executionHistory'][0]): void {
    memory.executionHistory.push(entry);
    // Keep last 50 executions
    if (memory.executionHistory.length > 50) {
      memory.executionHistory = memory.executionHistory.slice(-50);
    }
  },

  getExecutionHistory(): MemoryStore['executionHistory'] {
    return memory.executionHistory;
  },

  getStats(): {
    totalConversations: number;
    totalInsights: number;
    totalExecutions: number;
    totalTokens: number;
    totalCost: number;
  } {
    return {
      totalConversations: memory.conversations.size,
      totalInsights: memory.insights.length,
      totalExecutions: memory.executionHistory.length,
      totalTokens: memory.executionHistory.reduce((s, e) => s + e.tokens, 0),
      totalCost: memory.executionHistory.reduce((s, e) => s + e.cost, 0),
    };
  },

  // Build a context summary for the agent system prompt
  buildContextSummary(): string {
    const prefs = this.getAllPreferences();
    const recentInsights = this.getInsights().slice(-5);
    const recentExecutions = this.getExecutionHistory().slice(-3);

    const parts: string[] = [];

    if (Object.keys(prefs).length > 0) {
      parts.push('User Preferences: ' + Object.entries(prefs).map(([k, v]) => `${k}: ${v}`).join(', '));
    }

    if (recentInsights.length > 0) {
      parts.push('Recent Insights: ' + recentInsights.map(i => i.content).join('; '));
    }

    if (recentExecutions.length > 0) {
      parts.push('Recent Tasks: ' + recentExecutions.map(e => `${e.agentName}: ${e.task.slice(0, 100)}`).join('; '));
    }

    return parts.length > 0 ? '\n\n[Memory Context]\n' + parts.join('\n') : '';
  },
};

export default agentMemory;
