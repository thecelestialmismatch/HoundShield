'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Filter,
  ListTodo,
  Clock,
  PlayCircle,
  Eye,
  CheckCircle2,
  X,
  Calendar,
  RotateCcw,
  Zap,
  Target,
  ChevronDown,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type TaskType = 'recurring' | 'one-time' | 'automated';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignee: string;
  priority: TaskPriority;
  dueDate: string;
  type: TaskType;
  tags: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLUMNS: { key: TaskStatus; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'backlog', label: 'Backlog', icon: ListTodo, color: '#9ca3af' },
  { key: 'todo', label: 'Todo', icon: Target, color: '#6366f1' },
  { key: 'in_progress', label: 'In Progress', icon: PlayCircle, color: '#f59e0b' },
  { key: 'review', label: 'Review', icon: Eye, color: '#f97316' },
  { key: 'done', label: 'Done', icon: CheckCircle2, color: '#16a34a' },
];

const PRIORITY_DOTS: Record<TaskPriority, string> = {
  low: 'bg-white/40',
  medium: 'bg-amber-400',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

const TYPE_BADGE: Record<TaskType, { icon: React.ElementType; bg: string; text: string }> = {
  recurring: { icon: RotateCcw, bg: 'bg-brand-500/100/10', text: 'text-brand-400' },
  'one-time': { icon: Target, bg: 'bg-white/[0.05]', text: 'text-slate-400' },
  automated: { icon: Zap, bg: 'bg-purple-500/10', text: 'text-purple-400' },
};

const AGENTS = ['Hound Shield', 'Analyst', 'Creator', 'Monitor', 'Specialist', 'Orchestrator'];

const SAMPLE_TASKS: Task[] = [
  { id: 't1', title: 'Scan vendor contracts for GDPR compliance', status: 'backlog', assignee: 'Analyst', priority: 'medium', dueDate: '2026-03-05', type: 'one-time', tags: ['compliance'] },
  { id: 't2', title: 'Generate weekly threat intelligence digest', status: 'todo', assignee: 'Monitor', priority: 'high', dueDate: '2026-03-01', type: 'recurring', tags: ['security'] },
  { id: 't3', title: 'Automated SOC 2 evidence collection', status: 'in_progress', assignee: 'Specialist', priority: 'urgent', dueDate: '2026-02-28', type: 'automated', tags: ['audit', 'soc2'] },
  { id: 't4', title: 'Draft privacy policy update for EU markets', status: 'in_progress', assignee: 'Creator', priority: 'high', dueDate: '2026-03-03', type: 'one-time', tags: ['policy'] },
  { id: 't5', title: 'Monitor API rate-limit violations', status: 'done', assignee: 'Monitor', priority: 'medium', dueDate: '2026-02-25', type: 'automated', tags: ['api'] },
  { id: 't6', title: 'Build compliance training quiz module', status: 'review', assignee: 'Creator', priority: 'low', dueDate: '2026-03-10', type: 'one-time', tags: ['training'] },
  { id: 't7', title: 'Daily security log aggregation', status: 'done', assignee: 'Hound Shield', priority: 'medium', dueDate: '2026-02-27', type: 'recurring', tags: ['logging'] },
  { id: 't8', title: 'Evaluate new encryption library', status: 'todo', assignee: 'Specialist', priority: 'high', dueDate: '2026-03-08', type: 'one-time', tags: ['security'] },
  { id: 't9', title: 'Orchestrate quarterly risk assessment', status: 'backlog', assignee: 'Orchestrator', priority: 'urgent', dueDate: '2026-03-15', type: 'recurring', tags: ['risk'] },
  { id: 't10', title: 'Auto-tag sensitive documents in knowledge base', status: 'review', assignee: 'Analyst', priority: 'medium', dueDate: '2026-03-02', type: 'automated', tags: ['knowledge'] },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TasksBoard() {
  const [tasks, setTasks] = useState<Task[]>(SAMPLE_TASKS);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', assignee: AGENTS[0], priority: 'medium' as TaskPriority, type: 'one-time' as TaskType, dueDate: '' });

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterAssignee !== 'all' && t.assignee !== filterAssignee) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      return true;
    });
  }, [tasks, filterStatus, filterAssignee, filterPriority]);

  const byStatus = (status: TaskStatus) => filtered.filter((t) => t.status === status);

  const totalDone = tasks.filter((t) => t.status === 'done').length;
  const progress = tasks.length > 0 ? Math.round((totalDone / tasks.length) * 100) : 0;

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    const task: Task = {
      id: `t_${Date.now()}`,
      title: newTask.title.trim(),
      status: 'backlog',
      assignee: newTask.assignee,
      priority: newTask.priority,
      type: newTask.type,
      dueDate: newTask.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      tags: [],
    };
    setTasks((prev) => [...prev, task]);
    setNewTask({ title: '', assignee: AGENTS[0], priority: 'medium', type: 'one-time', dueDate: '' });
    setShowAddModal(false);
  };

  const advanceTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const idx = COLUMNS.findIndex((c) => c.key === t.status);
        if (idx < COLUMNS.length - 1) return { ...t, status: COLUMNS[idx + 1].key };
        return t;
      })
    );
  };

  const removeTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="min-h-full bg-[#0c0c10]">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white tracking-tight">Tasks Board</h2>
            <p className="text-sm text-slate-500 mt-0.5">{tasks.length} tasks &middot; {totalDone} completed</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-indigo-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-400 w-10 text-right">{progress}%</span>
        </div>

        {/* Filters */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
              className="appearance-none text-xs bg-[#0c0c10] border border-white/10 rounded-md pl-2.5 pr-7 py-1.5 text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {COLUMNS.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Assignee filter */}
          <div className="relative">
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="appearance-none text-xs bg-[#0c0c10] border border-white/10 rounded-md pl-2.5 pr-7 py-1.5 text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              <option value="all">All Agents</option>
              {AGENTS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Priority filter */}
          <div className="relative">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as TaskPriority | 'all')}
              className="appearance-none text-xs bg-[#0c0c10] border border-white/10 rounded-md pl-2.5 pr-7 py-1.5 text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {(filterStatus !== 'all' || filterAssignee !== 'all' || filterPriority !== 'all') && (
            <button
              onClick={() => { setFilterStatus('all'); setFilterAssignee('all'); setFilterPriority('all'); }}
              className="text-xs text-slate-500 hover:text-slate-200 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Board */}
      <div className="p-6 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {COLUMNS.map((col) => {
            const items = byStatus(col.key);
            const Icon = col.icon;
            return (
              <div key={col.key} className="w-72 flex-shrink-0 bg-white rounded-xl border border-white/10 overflow-hidden">
                <div className="h-1" style={{ backgroundColor: col.color }} />
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: col.color }} />
                    <span className="text-sm font-semibold text-white">{col.label}</span>
                    <span
                      className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: col.color + '18', color: col.color }}
                    >
                      {items.length}
                    </span>
                  </div>
                </div>

                <div className="px-3 pb-3 space-y-2 max-h-[480px] overflow-y-auto">
                  {items.map((task) => {
                    const typeBadge = TYPE_BADGE[task.type];
                    const TypeIcon = typeBadge.icon;
                    const colIdx = COLUMNS.findIndex((c) => c.key === task.status);
                    return (
                      <div
                        key={task.id}
                        className="group bg-white rounded-lg border border-white/10 p-3 hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-white leading-snug flex-1">{task.title}</p>
                          <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOTS[task.priority]}`} title={task.priority} />
                        </div>

                        <div className="flex items-center justify-between mt-2.5">
                          <span className="text-xs text-slate-500">{task.assignee}</span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${typeBadge.bg} ${typeBadge.text}`}>
                            <TypeIcon className="w-2.5 h-2.5" />
                            {task.type}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {task.dueDate}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {colIdx < COLUMNS.length - 1 && (
                              <button
                                onClick={() => advanceTask(task.id)}
                                className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
                              >
                                Advance
                              </button>
                            )}
                            <button
                              onClick={() => removeTask(task.id)}
                              className="p-0.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {items.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-xs text-slate-400">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-white/10">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">New Task</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-md hover:bg-white/[0.03] text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Title</label>
                <input
                  autoFocus
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  placeholder="What needs to be done?"
                  className="w-full text-sm bg-[#0c0c10] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Assignee</label>
                  <select
                    value={newTask.assignee}
                    onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                    className="w-full text-sm bg-[#0c0c10] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50"
                  >
                    {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                    className="w-full text-sm bg-[#0c0c10] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Type</label>
                  <select
                    value={newTask.type}
                    onChange={(e) => setNewTask({ ...newTask, type: e.target.value as TaskType })}
                    className="w-full text-sm bg-[#0c0c10] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="one-time">One-Time</option>
                    <option value="recurring">Recurring</option>
                    <option value="automated">Automated</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full text-sm bg-[#0c0c10] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="text-sm px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.03] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                className="text-sm font-medium px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
