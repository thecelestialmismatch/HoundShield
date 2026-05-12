'use client';

import React, { useState } from 'react';
import {
  Plus,
  Lightbulb,
  Search,
  PenTool,
  Eye,
  CheckCircle2,
  Tag,
  MoreHorizontal,
  GripVertical,
  X,
  ArrowRight,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Stage = 'ideas' | 'research' | 'drafting' | 'review' | 'published';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface PipelineCard {
  id: string;
  title: string;
  stage: Stage;
  priority: Priority;
  assignee: { name: string; color: string };
  tags: string[];
  description?: string;
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAGES: { key: Stage; label: string; icon: React.ElementType; accent: string }[] = [
  { key: 'ideas', label: 'Ideas', icon: Lightbulb, accent: '#a78bfa' },
  { key: 'research', label: 'Research', icon: Search, accent: '#3b82f6' },
  { key: 'drafting', label: 'Drafting', icon: PenTool, accent: '#f59e0b' },
  { key: 'review', label: 'Review', icon: Eye, accent: '#f97316' },
  { key: 'published', label: 'Published', icon: CheckCircle2, accent: '#16a34a' },
];

const PRIORITY_COLORS: Record<Priority, { bg: string; text: string; dot: string }> = {
  low: { bg: 'bg-white/[0.05]', text: 'text-slate-500', dot: 'bg-white/40' },
  medium: { bg: 'bg-amber-500/100/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-500' },
  urgent: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500' },
};

const SAMPLE_DATA: PipelineCard[] = [
  {
    id: 'p1',
    title: 'AI Governance Framework Blog Post',
    stage: 'ideas',
    priority: 'high',
    assignee: { name: 'Hound Shield', color: '#16a34a' },
    tags: ['blog', 'governance'],
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'p2',
    title: 'Q1 Compliance Report',
    stage: 'research',
    priority: 'urgent',
    assignee: { name: 'Analyst', color: '#3b82f6' },
    tags: ['report', 'compliance'],
    updatedAt: Date.now() - 172800000,
  },
  {
    id: 'p3',
    title: 'Data Privacy Policy Update',
    stage: 'drafting',
    priority: 'high',
    assignee: { name: 'Creator', color: '#8b5cf6' },
    tags: ['policy', 'privacy'],
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'p4',
    title: 'SOC 2 Audit Prep Checklist',
    stage: 'review',
    priority: 'medium',
    assignee: { name: 'Monitor', color: '#f59e0b' },
    tags: ['audit', 'soc2'],
    updatedAt: Date.now() - 7200000,
  },
  {
    id: 'p5',
    title: 'API Security Best Practices Guide',
    stage: 'published',
    priority: 'low',
    assignee: { name: 'Specialist', color: '#ec4899' },
    tags: ['guide', 'security'],
    updatedAt: Date.now() - 259200000,
  },
  {
    id: 'p6',
    title: 'GDPR Compliance Newsletter',
    stage: 'ideas',
    priority: 'medium',
    assignee: { name: 'Creator', color: '#8b5cf6' },
    tags: ['newsletter', 'gdpr'],
    updatedAt: Date.now() - 432000000,
  },
  {
    id: 'p7',
    title: 'Incident Response Playbook',
    stage: 'drafting',
    priority: 'urgent',
    assignee: { name: 'Hound Shield', color: '#16a34a' },
    tags: ['playbook', 'incident'],
    updatedAt: Date.now() - 1800000,
  },
  {
    id: 'p8',
    title: 'Vendor Risk Assessment Template',
    stage: 'research',
    priority: 'low',
    assignee: { name: 'Analyst', color: '#3b82f6' },
    tags: ['template', 'vendor'],
    updatedAt: Date.now() - 518400000,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ContentPipeline() {
  const [cards, setCards] = useState<PipelineCard[]>(SAMPLE_DATA);
  const [addingTo, setAddingTo] = useState<Stage | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const byStage = (stage: Stage) => cards.filter((c) => c.stage === stage);

  const handleAdd = (stage: Stage) => {
    if (!newTitle.trim()) return;
    const card: PipelineCard = {
      id: `p_${Date.now()}`,
      title: newTitle.trim(),
      stage,
      priority: 'medium',
      assignee: { name: 'Hound Shield', color: '#16a34a' },
      tags: [],
      updatedAt: Date.now(),
    };
    setCards((prev) => [...prev, card]);
    setNewTitle('');
    setAddingTo(null);
  };

  const moveCard = (id: string, direction: 'next' | 'prev') => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const idx = STAGES.findIndex((s) => s.key === c.stage);
        const newIdx = direction === 'next' ? Math.min(idx + 1, STAGES.length - 1) : Math.max(idx - 1, 0);
        return { ...c, stage: STAGES[newIdx].key, updatedAt: Date.now() };
      })
    );
  };

  const removeCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-full bg-[#0c0c10]">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white tracking-tight">Content Pipeline</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {cards.length} items across {STAGES.length} stages
            </p>
          </div>
          <div className="flex items-center gap-2">
            {STAGES.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.accent }} />
                <span>{byStage(s.key).length}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="p-6 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {STAGES.map((stage) => {
            const items = byStage(stage.key);
            const Icon = stage.icon;
            return (
              <div
                key={stage.key}
                className="w-72 flex-shrink-0 bg-white rounded-xl border border-white/10 overflow-hidden"
              >
                {/* Column header strip */}
                <div className="h-1" style={{ backgroundColor: stage.accent }} />
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: stage.accent }} />
                    <span className="text-sm font-semibold text-white">{stage.label}</span>
                    <span
                      className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: stage.accent + '18',
                        color: stage.accent,
                      }}
                    >
                      {items.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setAddingTo(addingTo === stage.key ? null : stage.key)}
                    className="p-1 rounded-md hover:bg-white/[0.03] transition-colors text-slate-400 hover:text-slate-400"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add new card form */}
                {addingTo === stage.key && (
                  <div className="px-3 pb-3">
                    <div className="bg-white/[0.03] rounded-lg p-3 border border-white/10">
                      <input
                        autoFocus
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd(stage.key)}
                        placeholder="Enter title..."
                        className="w-full text-sm bg-transparent border-none outline-none placeholder-white/20 text-white"
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleAdd(stage.key)}
                          className="text-xs font-medium px-3 py-1 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => { setAddingTo(null); setNewTitle(''); }}
                          className="text-xs text-slate-500 hover:text-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cards */}
                <div className="px-3 pb-3 space-y-2 max-h-[520px] overflow-y-auto">
                  {items.map((card) => {
                    const pColor = PRIORITY_COLORS[card.priority];
                    const stageIdx = STAGES.findIndex((s) => s.key === card.stage);
                    const isExpanded = expandedCard === card.id;

                    return (
                      <div
                        key={card.id}
                        className="group bg-white rounded-lg border border-white/10 p-3 hover:border-slate-300 transition-all cursor-pointer"
                        onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                      >
                        {/* Grip + title */}
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white leading-snug">{card.title}</p>
                          </div>
                        </div>

                        {/* Priority + assignee row */}
                        <div className="flex items-center justify-between mt-2.5">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${pColor.bg} ${pColor.text}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${pColor.dot}`} />
                            {card.priority}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                              style={{ backgroundColor: card.assignee.color }}
                            >
                              {card.assignee.name[0]}
                            </div>
                            <span className="text-xs text-slate-500">{card.assignee.name}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        {card.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <Tag className="w-3 h-3 text-slate-400" />
                            {card.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-500"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Expanded actions */}
                        {isExpanded && (
                          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-1.5">
                            {stageIdx > 0 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); moveCard(card.id, 'prev'); }}
                                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200 px-2 py-1 rounded hover:bg-white/[0.03] transition-colors"
                              >
                                <ArrowRight className="w-3 h-3 rotate-180" /> Back
                              </button>
                            )}
                            {stageIdx < STAGES.length - 1 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); moveCard(card.id, 'next'); }}
                                className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors bg-indigo-500 hover:bg-indigo-600 text-white"
                              >
                                Next <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                            <div className="flex-1" />
                            <button
                              onClick={(e) => { e.stopPropagation(); removeCard(card.id); }}
                              className="p-1 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {items.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-xs text-slate-400">No items yet</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
