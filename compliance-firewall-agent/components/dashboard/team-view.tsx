'use client';

import React, { useState } from 'react';
import {
  Brain,
  BarChart3,
  Palette,
  ShieldCheck,
  Star,
  Cpu,
  Users,
  Activity,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  ListTodo,
  History,
  ChevronRight,
  Zap,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AgentType = 'orchestrator' | 'analyst' | 'creator' | 'monitor' | 'specialist';
type AgentStatus = 'active' | 'idle' | 'working' | 'offline';

interface Agent {
  id: string;
  name: string;
  role: string;
  type: AgentType;
  status: AgentStatus;
  tasksCompleted: number;
  currentTask: string | null;
  uptime: string;
  efficiency: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<AgentType, { color: string; icon: React.ElementType; label: string }> = {
  orchestrator: { color: '#16a34a', icon: Brain, label: 'Orchestrator' },
  analyst: { color: '#3b82f6', icon: BarChart3, label: 'Analyst' },
  creator: { color: '#8b5cf6', icon: Palette, label: 'Creator' },
  monitor: { color: '#f59e0b', icon: ShieldCheck, label: 'Monitor' },
  specialist: { color: '#ec4899', icon: Star, label: 'Specialist' },
};

const STATUS_CONFIG: Record<AgentStatus, { color: string; label: string; icon: React.ElementType }> = {
  active: { color: '#16a34a', label: 'Active', icon: Wifi },
  working: { color: '#3b82f6', label: 'Working', icon: Activity },
  idle: { color: '#f59e0b', label: 'Idle', icon: Clock },
  offline: { color: '#9ca3af', label: 'Offline', icon: WifiOff },
};

const AGENTS: Agent[] = [
  {
    id: 'a1',
    name: 'Kaelus Prime',
    role: 'Chief Orchestrator — Coordinates all agents, manages workflows, and delegates complex tasks across the system.',
    type: 'orchestrator',
    status: 'active',
    tasksCompleted: 347,
    currentTask: 'Orchestrating quarterly compliance review pipeline',
    uptime: '99.8%',
    efficiency: 96,
  },
  {
    id: 'a2',
    name: 'Cipher',
    role: 'Data Analyst — Deep-dives into datasets, generates reports, and identifies compliance patterns.',
    type: 'analyst',
    status: 'working',
    tasksCompleted: 218,
    currentTask: 'Analyzing vendor contract risk scores',
    uptime: '99.2%',
    efficiency: 93,
  },
  {
    id: 'a3',
    name: 'Scribe',
    role: 'Content Creator — Drafts policies, blog posts, documentation, and communication materials.',
    type: 'creator',
    status: 'working',
    tasksCompleted: 164,
    currentTask: 'Drafting GDPR compliance newsletter',
    uptime: '98.5%',
    efficiency: 91,
  },
  {
    id: 'a4',
    name: 'Sentinel',
    role: 'Security Monitor — Watches for threats, anomalies, rate-limit violations, and real-time incidents.',
    type: 'monitor',
    status: 'active',
    tasksCompleted: 412,
    currentTask: null,
    uptime: '99.9%',
    efficiency: 98,
  },
  {
    id: 'a5',
    name: 'Aegis',
    role: 'Compliance Specialist — Handles SOC 2 audits, regulatory checklists, and certification processes.',
    type: 'specialist',
    status: 'idle',
    tasksCompleted: 89,
    currentTask: null,
    uptime: '97.1%',
    efficiency: 88,
  },
  {
    id: 'a6',
    name: 'Nova',
    role: 'Research Analyst — Scans the web for regulatory updates, competitive intelligence, and emerging risks.',
    type: 'analyst',
    status: 'active',
    tasksCompleted: 156,
    currentTask: 'Monitoring EU AI Act regulatory updates',
    uptime: '98.8%',
    efficiency: 94,
  },
  {
    id: 'a7',
    name: 'Forge',
    role: 'Code Specialist — Builds automations, integrations, scripts, and technical tooling.',
    type: 'specialist',
    status: 'working',
    tasksCompleted: 132,
    currentTask: 'Building automated evidence collection pipeline',
    uptime: '99.0%',
    efficiency: 95,
  },
  {
    id: 'a8',
    name: 'Warden',
    role: 'Safeguard Monitor — Enforces system guardrails, validates outputs, and ensures safety protocols.',
    type: 'monitor',
    status: 'offline',
    tasksCompleted: 278,
    currentTask: null,
    uptime: '96.3%',
    efficiency: 90,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TeamView() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState<string | null>(null);
  const [assignText, setAssignText] = useState('');

  const activeCount = AGENTS.filter((a) => a.status === 'active' || a.status === 'working').length;
  const todayCompleted = AGENTS.reduce((sum, a) => sum + Math.floor(a.tasksCompleted * 0.04), 0);
  const totalCompleted = AGENTS.reduce((sum, a) => sum + a.tasksCompleted, 0);

  const handleAssign = (agentId: string) => {
    if (!assignText.trim()) return;
    // In a real app this would push to the agent's queue
    setAssignText('');
    setAssignModalOpen(null);
  };

  return (
    <div className="min-h-full bg-[#0c0c10]">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Meet the Team</h2>
        <p className="text-sm text-slate-500 mt-0.5">Your AI workforce at a glance</p>

        {/* Top Stats */}
        <div className="mt-4 grid grid-cols-4 gap-4">
          {[
            { label: 'Total Agents', value: AGENTS.length, icon: Users, color: '#6366f1' },
            { label: 'Active Now', value: activeCount, icon: Activity, color: '#3b82f6' },
            { label: 'Tasks Today', value: todayCompleted, icon: Zap, color: '#f59e0b' },
            { label: 'Lifetime Tasks', value: totalCompleted.toLocaleString(), icon: CheckCircle2, color: '#8b5cf6' },
          ].map((stat) => {
            const StatIcon = stat.icon;
            return (
              <div key={stat.label} className="bg-[#141419] rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: stat.color + '14' }}
                >
                  <StatIcon className="w-4.5 h-4.5" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                  <p className="text-[11px] text-slate-500">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {AGENTS.map((agent) => {
            const typeConf = TYPE_CONFIG[agent.type];
            const statusConf = STATUS_CONFIG[agent.status];
            const TypeIcon = typeConf.icon;
            const StatusIcon = statusConf.icon;

            return (
              <div
                key={agent.id}
                className="bg-[#141419] rounded-xl border border-slate-200 overflow-hidden hover:border-white/10 transition-all"
                style={{ borderLeftWidth: '3px', borderLeftColor: typeConf.color }}
              >
                <div className="p-4">
                  {/* Top row: avatar + name + status */}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: typeConf.color + '18' }}
                    >
                      <TypeIcon className="w-5 h-5" style={{ color: typeConf.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">{agent.name}</h3>
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: statusConf.color + '18', color: statusConf.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusConf.color }} />
                          {statusConf.label}
                        </span>
                      </div>
                      <p
                        className="text-[10px] font-medium mt-0.5 px-1.5 py-0.5 rounded inline-block"
                        style={{ backgroundColor: typeConf.color + '12', color: typeConf.color }}
                      >
                        {typeConf.label}
                      </p>
                    </div>
                  </div>

                  {/* Role description */}
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed line-clamp-2">{agent.role}</p>

                  {/* Current task */}
                  {agent.currentTask && (
                    <div className="mt-3 px-2.5 py-2 rounded-lg bg-[#1a1a21] border border-slate-200">
                      <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-0.5">Current Task</p>
                      <p className="text-xs text-slate-800 leading-snug">{agent.currentTask}</p>
                    </div>
                  )}
                  {!agent.currentTask && agent.status !== 'offline' && (
                    <div className="mt-3 px-2.5 py-2 rounded-lg bg-[#1a1a21] border border-slate-200">
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic">Awaiting task assignment</p>
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <CheckCircle2 className="w-3 h-3" style={{ color: '#16a34a' }} />
                      <span className="font-semibold text-slate-800">{agent.tasksCompleted}</span> tasks
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Activity className="w-3 h-3" style={{ color: '#3b82f6' }} />
                      <span className="font-semibold text-slate-800">{agent.efficiency}%</span> eff.
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" style={{ color: '#f59e0b' }} />
                      <span className="font-semibold text-slate-800">{agent.uptime}</span> up
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2">
                    <button
                      onClick={() => setAssignModalOpen(agent.id)}
                      className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md bg-indigo-500 hover:bg-indigo-600 text-slate-900 transition-colors"
                    >
                      <ListTodo className="w-3 h-3" /> Assign Task
                    </button>
                    <button
                      onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                      className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md border border-white/10 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      <History className="w-3 h-3" /> View History
                    </button>
                  </div>

                  {/* Expanded history panel (demo) */}
                  {selectedAgent === agent.id && (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                      <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Recent Activity</p>
                      {[
                        { text: `Completed ${agent.type === 'analyst' ? 'risk analysis' : 'assigned task'}`, time: '2h ago' },
                        { text: 'System health check passed', time: '5h ago' },
                        { text: 'Processed 12 pipeline items', time: '1d ago' },
                      ].map((entry, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                          <ChevronRight className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                          <span className="flex-1">{entry.text}</span>
                          <span className="text-slate-600 dark:text-slate-400">{entry.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assign Task Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#141419] rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Assign Task to {AGENTS.find((a) => a.id === assignModalOpen)?.name}
              </h3>
              <button onClick={() => setAssignModalOpen(null)} className="p-1 rounded-md hover:bg-slate-50 text-slate-600 dark:text-slate-400">
                <Cpu className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-4">
              <textarea
                autoFocus
                value={assignText}
                onChange={(e) => setAssignText(e.target.value)}
                placeholder="Describe the task..."
                rows={3}
                className="w-full text-sm bg-[#0c0c10] border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-white/20 focus:outline-none focus:border-indigo-500/50 resize-none"
              />
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setAssignModalOpen(null)}
                className="text-sm px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAssign(assignModalOpen)}
                className="text-sm font-medium px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-slate-900 transition-colors"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
