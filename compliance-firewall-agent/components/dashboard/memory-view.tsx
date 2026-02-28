'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Brain,
  BookOpen,
  Shield,
  Settings2,
  Plus,
  X,
  Trash2,
  Download,
  Upload,
  Tag,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Star,
  Flame,
  BarChart3,
  Lightbulb,
  Eye,
  EyeOff,
  RotateCcw,
  ChevronDown,
  FileJson,
  Sparkles,
  Layers,
} from 'lucide-react';
import { memoryDNA } from '@/lib/agent/memory-dna';

// ---------------------------------------------------------------------------
// Types (mirrors the memory-dna store)
// ---------------------------------------------------------------------------

interface Memory {
  id: string;
  content: string;
  category: 'interaction' | 'discovery' | 'achievement' | 'journal';
  importance: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  tags: string[];
}

interface Lesson {
  id: string;
  category: 'success' | 'failure' | 'optimization' | 'insight';
  lesson: string;
  context: string;
  timestamp: number;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

interface Safeguard {
  id: string;
  rule: string;
  reason: string;
  severity: 'warning' | 'critical' | 'absolute';
  active: boolean;
  timestamp: number;
}

type TabKey = 'all' | 'memories' | 'lessons' | 'safeguards' | 'preferences';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const IMPORTANCE_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  low: { color: '#9ca3af', icon: Tag },
  medium: { color: '#f59e0b', icon: Star },
  high: { color: '#f97316', icon: Flame },
  critical: { color: '#ef4444', icon: AlertTriangle },
};

const CATEGORY_COLORS: Record<string, string> = {
  interaction: '#3b82f6',
  discovery: '#8b5cf6',
  achievement: '#16a34a',
  journal: '#f59e0b',
  success: '#16a34a',
  failure: '#ef4444',
  optimization: '#3b82f6',
  insight: '#8b5cf6',
  warning: '#f59e0b',
  critical: '#ef4444',
  absolute: '#7f1d1d',
};

const SEVERITY_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  absolute: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' },
};

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'All', icon: Layers },
  { key: 'memories', label: 'Memories', icon: Brain },
  { key: 'lessons', label: 'Lessons', icon: BookOpen },
  { key: 'safeguards', label: 'Safeguards', icon: Shield },
  { key: 'preferences', label: 'Preferences', icon: Settings2 },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MemoryView() {
  // State
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [safeguards, setSafeguards] = useState<Safeguard[]>([]);
  const [preferences, setPreferences] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ totalInteractions: 0, totalTasksCompleted: 0, totalTokensUsed: 0, totalCostUSD: 0, streak: 0, lastActiveDate: '' });

  // Add forms
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showAddSafeguard, setShowAddSafeguard] = useState(false);
  const [showAddPref, setShowAddPref] = useState(false);

  // Form data
  const [memForm, setMemForm] = useState({ content: '', category: 'journal' as Memory['category'], importance: 'medium' as Memory['importance'], tags: '' });
  const [lessonForm, setLessonForm] = useState({ lesson: '', context: '', category: 'insight' as Lesson['category'], importance: 'medium' as Lesson['importance'] });
  const [sgForm, setSgForm] = useState({ rule: '', reason: '', severity: 'warning' as Safeguard['severity'] });
  const [prefForm, setPrefForm] = useState({ key: '', value: '' });

  // Import/export
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');

  // ---------------------------------------------------------------------------
  // Load data from memoryDNA
  // ---------------------------------------------------------------------------
  const reload = useCallback(() => {
    setMemories(memoryDNA.getMemories(undefined, 200));
    setLessons(memoryDNA.getLessons());
    // getSafeguards returns only active ones; we want all for the UI
    // Use exportDNA to get the full list including inactive
    try {
      const full = JSON.parse(memoryDNA.exportDNA());
      setSafeguards(full.safeguards || []);
    } catch {
      setSafeguards([]);
    }
    setPreferences(memoryDNA.getAllPreferences());
    setStats(memoryDNA.getStats());
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // ---------------------------------------------------------------------------
  // Filtered data
  // ---------------------------------------------------------------------------
  const filteredMemories = useMemo(() => {
    if (!searchQuery.trim()) return memories;
    return memoryDNA.searchMemories(searchQuery);
  }, [memories, searchQuery]);

  const filteredLessons = useMemo(() => {
    if (!searchQuery.trim()) return lessons;
    const q = searchQuery.toLowerCase();
    return lessons.filter((l) => l.lesson.toLowerCase().includes(q) || l.context.toLowerCase().includes(q));
  }, [lessons, searchQuery]);

  const filteredSafeguards = useMemo(() => {
    if (!searchQuery.trim()) return safeguards;
    const q = searchQuery.toLowerCase();
    return safeguards.filter((s) => s.rule.toLowerCase().includes(q) || s.reason.toLowerCase().includes(q));
  }, [safeguards, searchQuery]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleAddMemory = () => {
    if (!memForm.content.trim()) return;
    const tags = memForm.tags.split(',').map((t) => t.trim()).filter(Boolean);
    memoryDNA.addMemory(memForm.content.trim(), memForm.category, memForm.importance, tags);
    setMemForm({ content: '', category: 'journal', importance: 'medium', tags: '' });
    setShowAddMemory(false);
    reload();
  };

  const handleDeleteMemory = (id: string) => {
    memoryDNA.deleteMemory(id);
    reload();
  };

  const handleAddLesson = () => {
    if (!lessonForm.lesson.trim()) return;
    memoryDNA.addLesson(lessonForm.lesson.trim(), lessonForm.context.trim(), lessonForm.category, lessonForm.importance);
    setLessonForm({ lesson: '', context: '', category: 'insight', importance: 'medium' });
    setShowAddLesson(false);
    reload();
  };

  const handleDeleteLesson = (id: string) => {
    memoryDNA.deleteLesson(id);
    reload();
  };

  const handleAddSafeguard = () => {
    if (!sgForm.rule.trim()) return;
    memoryDNA.addSafeguard(sgForm.rule.trim(), sgForm.reason.trim(), sgForm.severity);
    setSgForm({ rule: '', reason: '', severity: 'warning' });
    setShowAddSafeguard(false);
    reload();
  };

  const handleToggleSafeguard = (id: string) => {
    memoryDNA.toggleSafeguard(id);
    reload();
  };

  const handleDeleteSafeguard = (id: string) => {
    memoryDNA.deleteSafeguard(id);
    reload();
  };

  const handleAddPref = () => {
    if (!prefForm.key.trim()) return;
    memoryDNA.setPreference(prefForm.key.trim(), prefForm.value.trim());
    setPrefForm({ key: '', value: '' });
    setShowAddPref(false);
    reload();
  };

  const handleExport = () => {
    const json = memoryDNA.exportDNA();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaelus-memory-dna-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importJson.trim()) return;
    const success = memoryDNA.importDNA(importJson.trim());
    if (success) {
      setImportJson('');
      setShowImport(false);
      reload();
    }
  };

  const handleReset = () => {
    memoryDNA.resetDNA();
    reload();
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderMemoryCard = (mem: Memory) => {
    const impConf = IMPORTANCE_CONFIG[mem.importance];
    const ImpIcon = impConf.icon;
    const catColor = CATEGORY_COLORS[mem.category] || '#9ca3af';

    return (
      <div key={mem.id} className="bg-[#141419] rounded-lg border border-white/[0.06] p-4 hover:border-white/10 transition-all group">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/80 leading-relaxed">{mem.content}</p>
          </div>
          <button
            onClick={() => handleDeleteMemory(mem.id)}
            className="p-1 rounded hover:bg-red-500/10 text-white/30 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ backgroundColor: catColor + '18', color: catColor }}
          >
            {mem.category}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/[0.06]" style={{ color: impConf.color }}>
            <ImpIcon className="w-2.5 h-2.5" />
            {mem.importance}
          </span>
          {mem.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a21] text-white/50 border border-white/[0.06]">
              {tag}
            </span>
          ))}
          <span className="flex items-center gap-1 text-[10px] text-white/40 ml-auto">
            <Clock className="w-2.5 h-2.5" />
            {formatTime(mem.timestamp)}
          </span>
        </div>
      </div>
    );
  };

  const renderLessonCard = (lesson: Lesson) => {
    const impConf = IMPORTANCE_CONFIG[lesson.importance];
    const ImpIcon = impConf.icon;
    const catColor = CATEGORY_COLORS[lesson.category] || '#9ca3af';

    return (
      <div key={lesson.id} className="bg-[#141419] rounded-lg border border-white/[0.06] p-4 hover:border-white/10 transition-all group">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb className="w-3.5 h-3.5" style={{ color: catColor }} />
              <span className="text-xs font-semibold text-white/80">Lesson</span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{lesson.lesson}</p>
            {lesson.context && (
              <p className="text-xs text-white/50 mt-1.5 leading-relaxed italic">&ldquo;{lesson.context}&rdquo;</p>
            )}
          </div>
          <button
            onClick={() => handleDeleteLesson(lesson.id)}
            className="p-1 rounded hover:bg-red-500/10 text-white/30 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ backgroundColor: catColor + '18', color: catColor }}
          >
            {lesson.category}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/[0.06]" style={{ color: impConf.color }}>
            <ImpIcon className="w-2.5 h-2.5" />
            {lesson.importance}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-white/40 ml-auto">
            <Clock className="w-2.5 h-2.5" />
            {formatTime(lesson.timestamp)}
          </span>
        </div>
      </div>
    );
  };

  const renderSafeguardCard = (sg: Safeguard) => {
    const sevConf = SEVERITY_CONFIG[sg.severity];
    const sevColor = CATEGORY_COLORS[sg.severity] || '#9ca3af';

    return (
      <div key={sg.id} className={`rounded-lg border p-4 hover:border-white/10 transition-all group ${sevConf.bg} ${sevConf.border}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Shield className="w-3.5 h-3.5" style={{ color: sevColor }} />
              <span className={`text-xs font-semibold ${sevConf.text}`}>{sg.severity.toUpperCase()}</span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${sg.active ? 'bg-indigo-500/10 text-indigo-400' : 'bg-white/[0.06] text-white/50'}`}
              >
                {sg.active ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                {sg.active ? 'Active' : 'Disabled'}
              </span>
            </div>
            <p className={`text-sm leading-relaxed ${sevConf.text}`}>{sg.rule}</p>
            {sg.reason && (
              <p className="text-xs text-white/50 mt-1">{sg.reason}</p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleToggleSafeguard(sg.id)}
              className="p-1 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/60 transition-colors"
              title={sg.active ? 'Disable' : 'Enable'}
            >
              {sg.active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => handleDeleteSafeguard(sg.id)}
              className="p-1 rounded hover:bg-red-500/10 text-white/40 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-full bg-[#0c0c10]">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: '#6366f1' }} />
              Memory DNA
            </h2>
            <p className="text-sm text-white/50 mt-0.5">The agent&apos;s persistent identity and learned knowledge</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.03] transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export DNA
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.03] transition-colors"
            >
              <Upload className="w-3.5 h-3.5" /> Import DNA
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-5 gap-3">
          {[
            { label: 'Memories', value: memories.length, icon: Brain, color: '#3b82f6' },
            { label: 'Lessons', value: lessons.length, icon: BookOpen, color: '#8b5cf6' },
            { label: 'Safeguards', value: safeguards.filter((s) => s.active).length, icon: Shield, color: '#f59e0b' },
            { label: 'Tasks Done', value: stats.totalTasksCompleted, icon: CheckCircle2, color: '#6366f1' },
            { label: 'Streak', value: `${stats.streak}d`, icon: Flame, color: '#ef4444' },
          ].map((s) => {
            const StatIcon = s.icon;
            return (
              <div key={s.label} className="bg-[#141419] rounded-xl border border-white/[0.06] p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + '14' }}>
                  <StatIcon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-base font-bold text-white">{s.value}</p>
                  <p className="text-[10px] text-white/50">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search + Tabs */}
      <div className="px-6 pt-4 pb-0">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories, lessons, safeguards..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#0c0c10] border border-white/[0.06] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white/[0.03] text-white/40"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-white/[0.06]">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 border-b-2 transition-colors ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-white/50 hover:text-white/80 hover:border-white/30'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {/* Memories */}
        {(activeTab === 'all' || activeTab === 'memories') && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-1.5">
                <Brain className="w-4 h-4" style={{ color: '#3b82f6' }} />
                Memories ({filteredMemories.length})
              </h3>
              <button
                onClick={() => setShowAddMemory(!showAddMemory)}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Memory
              </button>
            </div>

            {/* Add Memory Form */}
            {showAddMemory && (
              <div className="bg-[#141419] rounded-xl border border-white/[0.06] p-4 mb-3 space-y-3">
                <textarea
                  autoFocus
                  value={memForm.content}
                  onChange={(e) => setMemForm({ ...memForm, content: e.target.value })}
                  placeholder="What should I remember?"
                  rows={2}
                  className="w-full text-sm bg-[#0c0c10] border border-white/[0.06] rounded-lg px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 resize-none"
                />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-white/50 block mb-1">Category</label>
                    <select
                      value={memForm.category}
                      onChange={(e) => setMemForm({ ...memForm, category: e.target.value as Memory['category'] })}
                      className="w-full text-xs bg-[#0c0c10] border border-white/[0.06] rounded-md px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500/50"
                    >
                      <option value="journal">Journal</option>
                      <option value="interaction">Interaction</option>
                      <option value="discovery">Discovery</option>
                      <option value="achievement">Achievement</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-white/50 block mb-1">Importance</label>
                    <select
                      value={memForm.importance}
                      onChange={(e) => setMemForm({ ...memForm, importance: e.target.value as Memory['importance'] })}
                      className="w-full text-xs bg-[#0c0c10] border border-white/[0.06] rounded-md px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500/50"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-white/50 block mb-1">Tags (comma separated)</label>
                    <input
                      value={memForm.tags}
                      onChange={(e) => setMemForm({ ...memForm, tags: e.target.value })}
                      placeholder="tag1, tag2"
                      className="w-full text-xs bg-[#0c0c10] border border-white/[0.06] rounded-md px-2 py-1.5 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowAddMemory(false)} className="text-xs text-white/50 hover:text-white/80 px-3 py-1.5">Cancel</button>
                  <button onClick={handleAddMemory} className="text-xs font-medium px-3 py-1.5 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white transition-colors">Save Memory</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {filteredMemories.length === 0 && (
                <div className="text-center py-8">
                  <Brain className="w-8 h-8 text-white/30 mx-auto mb-2" />
                  <p className="text-sm text-white/40">No memories yet. Add your first memory above.</p>
                </div>
              )}
              {filteredMemories.slice().reverse().map(renderMemoryCard)}
            </div>
          </div>
        )}

        {/* Lessons */}
        {(activeTab === 'all' || activeTab === 'lessons') && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                Lessons ({filteredLessons.length})
              </h3>
              <button
                onClick={() => setShowAddLesson(!showAddLesson)}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Lesson
              </button>
            </div>

            {showAddLesson && (
              <div className="bg-[#141419] rounded-xl border border-white/[0.06] p-4 mb-3 space-y-3">
                <textarea
                  autoFocus
                  value={lessonForm.lesson}
                  onChange={(e) => setLessonForm({ ...lessonForm, lesson: e.target.value })}
                  placeholder="What was learned?"
                  rows={2}
                  className="w-full text-sm bg-[#0c0c10] border border-white/[0.06] rounded-lg px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 resize-none"
                />
                <input
                  value={lessonForm.context}
                  onChange={(e) => setLessonForm({ ...lessonForm, context: e.target.value })}
                  placeholder="In what context?"
                  className="w-full text-sm bg-[#0c0c10] border border-white/[0.06] rounded-lg px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-white/50 block mb-1">Category</label>
                    <select
                      value={lessonForm.category}
                      onChange={(e) => setLessonForm({ ...lessonForm, category: e.target.value as Lesson['category'] })}
                      className="w-full text-xs bg-[#0c0c10] border border-white/[0.06] rounded-md px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500/50"
                    >
                      <option value="insight">Insight</option>
                      <option value="success">Success</option>
                      <option value="failure">Failure</option>
                      <option value="optimization">Optimization</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-white/50 block mb-1">Importance</label>
                    <select
                      value={lessonForm.importance}
                      onChange={(e) => setLessonForm({ ...lessonForm, importance: e.target.value as Lesson['importance'] })}
                      className="w-full text-xs bg-[#0c0c10] border border-white/[0.06] rounded-md px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500/50"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowAddLesson(false)} className="text-xs text-white/50 hover:text-white/80 px-3 py-1.5">Cancel</button>
                  <button onClick={handleAddLesson} className="text-xs font-medium px-3 py-1.5 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white transition-colors">Save Lesson</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {filteredLessons.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="w-8 h-8 text-white/30 mx-auto mb-2" />
                  <p className="text-sm text-white/40">No lessons learned yet.</p>
                </div>
              )}
              {filteredLessons.slice().reverse().map(renderLessonCard)}
            </div>
          </div>
        )}

        {/* Safeguards */}
        {(activeTab === 'all' || activeTab === 'safeguards') && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-1.5">
                <Shield className="w-4 h-4" style={{ color: '#f59e0b' }} />
                Safeguards ({safeguards.length})
              </h3>
              <button
                onClick={() => setShowAddSafeguard(!showAddSafeguard)}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Safeguard
              </button>
            </div>

            {showAddSafeguard && (
              <div className="bg-[#141419] rounded-xl border border-white/[0.06] p-4 mb-3 space-y-3">
                <input
                  autoFocus
                  value={sgForm.rule}
                  onChange={(e) => setSgForm({ ...sgForm, rule: e.target.value })}
                  placeholder="Rule (e.g., Never expose API keys)"
                  className="w-full text-sm bg-[#0c0c10] border border-white/[0.06] rounded-lg px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
                />
                <input
                  value={sgForm.reason}
                  onChange={(e) => setSgForm({ ...sgForm, reason: e.target.value })}
                  placeholder="Reason"
                  className="w-full text-sm bg-[#0c0c10] border border-white/[0.06] rounded-lg px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
                />
                <div>
                  <label className="text-[10px] font-medium text-white/50 block mb-1">Severity</label>
                  <select
                    value={sgForm.severity}
                    onChange={(e) => setSgForm({ ...sgForm, severity: e.target.value as Safeguard['severity'] })}
                    className="w-full text-xs bg-[#0c0c10] border border-white/[0.06] rounded-md px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                    <option value="absolute">Absolute</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowAddSafeguard(false)} className="text-xs text-white/50 hover:text-white/80 px-3 py-1.5">Cancel</button>
                  <button onClick={handleAddSafeguard} className="text-xs font-medium px-3 py-1.5 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white transition-colors">Save Safeguard</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {filteredSafeguards.length === 0 && (
                <div className="text-center py-8">
                  <Shield className="w-8 h-8 text-white/30 mx-auto mb-2" />
                  <p className="text-sm text-white/40">No safeguards configured.</p>
                </div>
              )}
              {filteredSafeguards.map(renderSafeguardCard)}
            </div>
          </div>
        )}

        {/* Preferences */}
        {(activeTab === 'all' || activeTab === 'preferences') && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-1.5">
                <Settings2 className="w-4 h-4" style={{ color: '#6366f1' }} />
                Preferences ({Object.keys(preferences).length})
              </h3>
              <button
                onClick={() => setShowAddPref(!showAddPref)}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Preference
              </button>
            </div>

            {showAddPref && (
              <div className="bg-[#141419] rounded-xl border border-white/[0.06] p-4 mb-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    autoFocus
                    value={prefForm.key}
                    onChange={(e) => setPrefForm({ ...prefForm, key: e.target.value })}
                    placeholder="Key (e.g., outputStyle)"
                    className="w-full text-sm bg-[#0c0c10] border border-white/[0.06] rounded-lg px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
                  />
                  <input
                    value={prefForm.value}
                    onChange={(e) => setPrefForm({ ...prefForm, value: e.target.value })}
                    placeholder="Value (e.g., detailed)"
                    className="w-full text-sm bg-[#0c0c10] border border-white/[0.06] rounded-lg px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowAddPref(false)} className="text-xs text-white/50 hover:text-white/80 px-3 py-1.5">Cancel</button>
                  <button onClick={handleAddPref} className="text-xs font-medium px-3 py-1.5 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white transition-colors">Save</button>
                </div>
              </div>
            )}

            <div className="bg-[#141419] rounded-xl border border-white/[0.06] overflow-hidden">
              {Object.entries(preferences).length === 0 && (
                <div className="text-center py-8">
                  <Settings2 className="w-8 h-8 text-white/30 mx-auto mb-2" />
                  <p className="text-sm text-white/40">No preferences set.</p>
                </div>
              )}
              {Object.entries(preferences).map(([key, value], idx) => (
                <div
                  key={key}
                  className={`flex items-center justify-between px-4 py-3 ${
                    idx < Object.entries(preferences).length - 1 ? 'border-b border-white/[0.06]' : ''
                  } hover:bg-white/[0.03] transition-colors`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium text-white/80 bg-white/[0.06] px-2 py-0.5 rounded">{key}</span>
                  </div>
                  <span className="text-sm text-white/60">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#141419] rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-white/[0.06] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <FileJson className="w-4 h-4" style={{ color: '#6366f1' }} />
                Import Memory DNA
              </h3>
              <button onClick={() => setShowImport(false)} className="p-1 rounded-md hover:bg-white/[0.03] text-white/40">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-4">
              <textarea
                autoFocus
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="Paste exported DNA JSON here..."
                rows={10}
                className="w-full text-xs font-mono bg-[#0c0c10] border border-white/[0.06] rounded-lg px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 resize-none"
              />
            </div>
            <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end gap-2">
              <button onClick={() => setShowImport(false)} className="text-sm px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.03] transition-colors">Cancel</button>
              <button
                onClick={handleImport}
                className="text-sm font-medium px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
