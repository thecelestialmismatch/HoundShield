// ============================================================================
// Hound Shield Memory DNA System — MoltBot-Style Persistent Identity
// MEMORY.md + LESSONS.md + SAFEGUARDS.md + PREFERENCES.md
// The agent wakes up knowing who you are.
// ============================================================================

import { LessonEntry, SafeguardEntry } from './types';

interface MemoryDNAStore {
  identity: {
    name: string;
    version: string;
    personality: string;
    mission: string;
    createdAt: number;
  };
  memories: Array<{
    id: string;
    content: string;
    category: 'interaction' | 'discovery' | 'achievement' | 'journal';
    importance: 'low' | 'medium' | 'high' | 'critical';
    timestamp: number;
    tags: string[];
  }>;
  lessons: LessonEntry[];
  safeguards: SafeguardEntry[];
  preferences: Record<string, string>;
  stats: {
    totalInteractions: number;
    totalTasksCompleted: number;
    totalTokensUsed: number;
    totalCostUSD: number;
    streak: number;
    lastActiveDate: string;
  };
}

const STORAGE_KEY = 'houndshield_memory_dna';

function getDefaultDNA(): MemoryDNAStore {
  return {
    identity: {
      name: 'Hound Shield',
      version: '3.0',
      personality: 'Elite enterprise AI — thorough, precise, proactive. I break down complex problems and deliver world-class results. I remember everything.',
      mission: 'Be the most powerful AI platform that can handle everything a company needs — from market analysis to compliance, from code to strategy.',
      createdAt: Date.now(),
    },
    memories: [],
    lessons: [],
    safeguards: [
      {
        id: 'sg_001',
        rule: 'Never expose API keys, passwords, or sensitive credentials in outputs',
        reason: 'Security first — protecting user data is non-negotiable',
        severity: 'absolute',
        active: true,
        timestamp: Date.now(),
      },
      {
        id: 'sg_002',
        rule: 'Always validate and sanitize user inputs before processing',
        reason: 'Prevent injection attacks and data corruption',
        severity: 'critical',
        active: true,
        timestamp: Date.now(),
      },
      {
        id: 'sg_003',
        rule: 'Respect rate limits and implement exponential backoff',
        reason: 'Avoid API bans and maintain service reliability',
        severity: 'warning',
        active: true,
        timestamp: Date.now(),
      },
    ],
    preferences: {
      outputStyle: 'detailed',
      codeStyle: 'typescript',
      analysisDepth: 'comprehensive',
      responseFormat: 'structured',
    },
    stats: {
      totalInteractions: 0,
      totalTasksCompleted: 0,
      totalTokensUsed: 0,
      totalCostUSD: 0,
      streak: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
    },
  };
}

function loadDNA(): MemoryDNAStore {
  if (typeof window === 'undefined') return getDefaultDNA();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...getDefaultDNA(), ...parsed };
    }
  } catch { /* use default */ }
  return getDefaultDNA();
}

function saveDNA(dna: MemoryDNAStore): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dna));
  } catch { /* storage full */ }
}

export const memoryDNA = {
  // ---- Identity ----
  getIdentity() {
    return loadDNA().identity;
  },

  updateIdentity(updates: Partial<MemoryDNAStore['identity']>) {
    const dna = loadDNA();
    dna.identity = { ...dna.identity, ...updates };
    saveDNA(dna);
  },

  // ---- Memories ----
  addMemory(content: string, category: MemoryDNAStore['memories'][0]['category'] = 'interaction', importance: MemoryDNAStore['memories'][0]['importance'] = 'medium', tags: string[] = []) {
    const dna = loadDNA();
    const memory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      content,
      category,
      importance,
      timestamp: Date.now(),
      tags,
    };
    dna.memories.push(memory);
    // Keep last 200 memories
    if (dna.memories.length > 200) {
      // Keep critical ones + most recent
      const critical = dna.memories.filter(m => m.importance === 'critical');
      const recent = dna.memories.filter(m => m.importance !== 'critical').slice(-150);
      dna.memories = [...critical, ...recent];
    }
    saveDNA(dna);
    return memory.id;
  },

  getMemories(category?: string, limit = 50): MemoryDNAStore['memories'] {
    const dna = loadDNA();
    let memories = dna.memories;
    if (category) {
      memories = memories.filter(m => m.category === category);
    }
    return memories.slice(-limit);
  },

  searchMemories(query: string): MemoryDNAStore['memories'] {
    const dna = loadDNA();
    const terms = query.toLowerCase().split(/\s+/);
    return dna.memories
      .filter(m => terms.some(t =>
        m.content.toLowerCase().includes(t) ||
        m.tags.some(tag => tag.toLowerCase().includes(t))
      ))
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  deleteMemory(id: string) {
    const dna = loadDNA();
    dna.memories = dna.memories.filter(m => m.id !== id);
    saveDNA(dna);
  },

  // ---- Lessons ----
  addLesson(lesson: string, context: string, category: LessonEntry['category'] = 'insight', importance: LessonEntry['importance'] = 'medium') {
    const dna = loadDNA();
    const entry: LessonEntry = {
      id: `lesson_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      category,
      lesson,
      context,
      timestamp: Date.now(),
      importance,
    };
    dna.lessons.push(entry);
    if (dna.lessons.length > 100) {
      const critical = dna.lessons.filter(l => l.importance === 'critical');
      const recent = dna.lessons.filter(l => l.importance !== 'critical').slice(-80);
      dna.lessons = [...critical, ...recent];
    }
    saveDNA(dna);
    return entry.id;
  },

  getLessons(category?: string): LessonEntry[] {
    const dna = loadDNA();
    if (category) return dna.lessons.filter(l => l.category === category);
    return dna.lessons;
  },

  deleteLesson(id: string) {
    const dna = loadDNA();
    dna.lessons = dna.lessons.filter(l => l.id !== id);
    saveDNA(dna);
  },

  // ---- Safeguards ----
  addSafeguard(rule: string, reason: string, severity: SafeguardEntry['severity'] = 'warning') {
    const dna = loadDNA();
    const entry: SafeguardEntry = {
      id: `sg_${Date.now()}`,
      rule,
      reason,
      severity,
      active: true,
      timestamp: Date.now(),
    };
    dna.safeguards.push(entry);
    saveDNA(dna);
    return entry.id;
  },

  getSafeguards(): SafeguardEntry[] {
    return loadDNA().safeguards.filter(s => s.active);
  },

  toggleSafeguard(id: string) {
    const dna = loadDNA();
    dna.safeguards = dna.safeguards.map(s =>
      s.id === id ? { ...s, active: !s.active } : s
    );
    saveDNA(dna);
  },

  deleteSafeguard(id: string) {
    const dna = loadDNA();
    dna.safeguards = dna.safeguards.filter(s => s.id !== id);
    saveDNA(dna);
  },

  // ---- Preferences ----
  setPreference(key: string, value: string) {
    const dna = loadDNA();
    dna.preferences[key] = value;
    saveDNA(dna);
  },

  getPreference(key: string): string | undefined {
    return loadDNA().preferences[key];
  },

  getAllPreferences(): Record<string, string> {
    return loadDNA().preferences;
  },

  // ---- Stats ----
  getStats() {
    return loadDNA().stats;
  },

  trackInteraction(tokens: number = 0, cost: number = 0) {
    const dna = loadDNA();
    const today = new Date().toISOString().split('T')[0];
    dna.stats.totalInteractions++;
    dna.stats.totalTokensUsed += tokens;
    dna.stats.totalCostUSD += cost;

    if (dna.stats.lastActiveDate === today) {
      // Same day, keep streak
    } else {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (dna.stats.lastActiveDate === yesterday) {
        dna.stats.streak++;
      } else {
        dna.stats.streak = 1;
      }
    }
    dna.stats.lastActiveDate = today;
    saveDNA(dna);
  },

  trackTaskCompleted() {
    const dna = loadDNA();
    dna.stats.totalTasksCompleted++;
    saveDNA(dna);
  },

  // ---- Build Context for System Prompt ----
  buildDNAContext(): string {
    const dna = loadDNA();
    const parts: string[] = [];

    parts.push(`[Agent Identity: ${dna.identity.name} v${dna.identity.version}]`);
    parts.push(`Mission: ${dna.identity.mission}`);

    const prefs = dna.preferences;
    if (Object.keys(prefs).length > 0) {
      parts.push('User Preferences: ' + Object.entries(prefs).map(([k, v]) => `${k}=${v}`).join(', '));
    }

    const recentMemories = dna.memories.slice(-5);
    if (recentMemories.length > 0) {
      parts.push('Recent Context: ' + recentMemories.map(m => m.content).join('; '));
    }

    const activeSafeguards = dna.safeguards.filter(s => s.active);
    if (activeSafeguards.length > 0) {
      parts.push('Active Safeguards: ' + activeSafeguards.map(s => s.rule).join('; '));
    }

    const recentLessons = dna.lessons.slice(-3);
    if (recentLessons.length > 0) {
      parts.push('Learned: ' + recentLessons.map(l => l.lesson).join('; '));
    }

    parts.push(`Stats: ${dna.stats.totalInteractions} interactions, ${dna.stats.totalTasksCompleted} tasks completed, ${dna.stats.streak}-day streak`);

    return '\n\n[Memory DNA]\n' + parts.join('\n');
  },

  // ---- Export/Import ----
  exportDNA(): string {
    return JSON.stringify(loadDNA(), null, 2);
  },

  importDNA(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      if (parsed.identity && parsed.memories) {
        saveDNA({ ...getDefaultDNA(), ...parsed });
        return true;
      }
    } catch { /* invalid */ }
    return false;
  },

  resetDNA() {
    saveDNA(getDefaultDNA());
  },
};

export default memoryDNA;
