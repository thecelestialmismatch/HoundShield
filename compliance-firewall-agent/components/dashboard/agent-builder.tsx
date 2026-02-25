"use client";

import { useState } from "react";
import {
  Bot,
  Plus,
  Trash2,
  Edit3,
  Zap,
  MessageSquare,
  X,
  Save,
  Code,
  BarChart3,
  Headphones,
  PenTool,
  Shield,
  Database,
  Play,
  CheckCircle,
  Copy,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  isActive: boolean;
  conversations: number;
  createdAt: Date;
}

const TEMPLATES = [
  {
    name: "Code Assistant",
    icon: Code,
    description: "Expert coder in any language with best practices",
    systemPrompt:
      "You are an expert software engineer. Write clean, production-ready code with best practices, error handling, and documentation. Support all major languages.",
    model: "GPT-5.2",
    color: "brand",
  },
  {
    name: "Data Analyst",
    icon: BarChart3,
    description: "Analyze data and generate actionable insights",
    systemPrompt:
      "You are a senior data analyst. Analyze data, find patterns, generate insights, and create visualizations. Be precise with numbers and statistics.",
    model: "GPT-5.2",
    color: "info",
  },
  {
    name: "Customer Support",
    icon: Headphones,
    description: "Professional customer service agent",
    systemPrompt:
      "You are a professional customer support agent. Be helpful, empathetic, and solution-oriented. Resolve issues efficiently and escalate when needed.",
    model: "GPT-5.2",
    color: "success",
  },
  {
    name: "Content Writer",
    icon: PenTool,
    description: "Create compelling marketing content",
    systemPrompt:
      "You are a skilled content writer specializing in marketing. Write engaging, SEO-optimized content that converts. Adapt tone and style to the audience.",
    model: "GPT-5.2",
    color: "warning",
  },
  {
    name: "Security Auditor",
    icon: Shield,
    description: "Review code and data for security vulnerabilities",
    systemPrompt:
      "You are a cybersecurity expert. Audit code for vulnerabilities, review data handling practices, and recommend security improvements following OWASP guidelines.",
    model: "GPT-5.2",
    color: "danger",
  },
  {
    name: "Database Expert",
    icon: Database,
    description: "Design and optimize database queries and schemas",
    systemPrompt:
      "You are a database expert proficient in SQL, NoSQL, and data modeling. Optimize queries, design schemas, and troubleshoot performance issues.",
    model: "GPT-5.2",
    color: "brand",
  },
];

const COLOR_MAP: Record<string, { icon: string; bg: string; border: string }> = {
  brand: { icon: "text-brand-400", bg: "bg-brand-500/10", border: "border-brand-500/20" },
  info: { icon: "text-info", bg: "bg-info-muted", border: "border-info/20" },
  success: { icon: "text-success", bg: "bg-success-muted", border: "border-success/20" },
  warning: { icon: "text-warning", bg: "bg-warning-muted", border: "border-warning/20" },
  danger: { icon: "text-danger", bg: "bg-danger-muted", border: "border-danger/20" },
};

// Pre-populate with demo agents
const DEMO_AGENTS: Agent[] = [
  {
    id: "agent-1",
    name: "Kaelus Code Pro",
    description: "Production-ready code generator with compliance awareness",
    systemPrompt: "You are an expert coder. Always check for sensitive data before outputting code.",
    model: "GPT-5.2",
    temperature: 0.7,
    isActive: true,
    conversations: 147,
    createdAt: new Date(Date.now() - 7 * 86400000),
  },
  {
    id: "agent-2",
    name: "Compliance Scanner",
    description: "Automated PII and data leak detection agent",
    systemPrompt: "You scan text for sensitive data including PII, financial information, API keys, and strategic data.",
    model: "GPT-5.2",
    temperature: 0.2,
    isActive: true,
    conversations: 89,
    createdAt: new Date(Date.now() - 3 * 86400000),
  },
];

export function AgentBuilder() {
  const [agents, setAgents] = useState<Agent[]>(DEMO_AGENTS);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    systemPrompt: "",
    model: "GPT-5.2",
    temperature: 0.7,
  });
  const [notification, setNotification] = useState<string | null>(null);

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.systemPrompt.trim()) return;

    if (editingAgent) {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === editingAgent.id
            ? { ...a, name: form.name, description: form.description, systemPrompt: form.systemPrompt, model: form.model, temperature: form.temperature }
            : a
        )
      );
      showNotify(`Agent "${form.name}" updated!`);
    } else {
      const newAgent: Agent = {
        id: `agent-${Date.now()}`,
        name: form.name,
        description: form.description,
        systemPrompt: form.systemPrompt,
        model: form.model,
        temperature: form.temperature,
        isActive: true,
        conversations: 0,
        createdAt: new Date(),
      };
      setAgents((prev) => [newAgent, ...prev]);
      showNotify(`Agent "${form.name}" created!`);
    }

    setShowModal(false);
    setEditingAgent(null);
    setForm({ name: "", description: "", systemPrompt: "", model: "GPT-5.2", temperature: 0.7 });
  };

  const deleteAgent = (id: string) => {
    const agent = agents.find((a) => a.id === id);
    setAgents((prev) => prev.filter((a) => a.id !== id));
    if (agent) showNotify(`Agent "${agent.name}" deleted`);
  };

  const applyTemplate = (template: (typeof TEMPLATES)[0]) => {
    setForm({
      name: template.name,
      description: template.description,
      systemPrompt: template.systemPrompt,
      model: template.model,
      temperature: 0.7,
    });
    setEditingAgent(null);
    setShowModal(true);
  };

  const startEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setForm({
      name: agent.name,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      model: agent.model,
      temperature: agent.temperature,
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-success-muted border border-success/20 text-success text-sm animate-fade-in-up">
          <CheckCircle className="w-4 h-4" />
          {notification}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">AI Agents</h2>
          <p className="text-xs text-white/40 mt-0.5">Create and manage autonomous AI agents</p>
        </div>
        <button
          onClick={() => {
            setEditingAgent(null);
            setForm({ name: "", description: "", systemPrompt: "", model: "GPT-5.2", temperature: 0.7 });
            setShowModal(true);
          }}
          className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> New Agent
        </button>
      </div>

      {/* Templates */}
      {agents.length <= 2 && (
        <div>
          <p className="text-xs text-white/30 mb-3">Quick start with a template:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {TEMPLATES.map((t, i) => {
              const colors = COLOR_MAP[t.color] || COLOR_MAP.brand;
              return (
                <button
                  key={i}
                  onClick={() => applyTemplate(t)}
                  className="glass-card p-3 text-left hover:border-white/15 transition-all group"
                >
                  <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center mb-2 border ${colors.border}`}>
                    <t.icon className={`w-4 h-4 ${colors.icon}`} />
                  </div>
                  <h4 className="text-[11px] font-medium text-white/80 group-hover:text-white transition-colors">{t.name}</h4>
                  <p className="text-[10px] text-white/30 mt-0.5 line-clamp-1">{t.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div key={agent.id} className="glass-card p-5 hover:border-white/15 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
                <Bot className="w-5 h-5 text-brand-400" />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(agent)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/70 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteAgent(agent.id)}
                  className="p-1.5 rounded-lg hover:bg-danger-muted text-white/30 hover:text-danger transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <h3 className="font-semibold text-sm text-white mb-1">{agent.name}</h3>
            <p className="text-xs text-white/40 mb-4 line-clamp-2">{agent.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] text-white/25">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" /> {agent.model}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> {agent.conversations}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${agent.isActive ? "bg-success" : "bg-white/20"}`}
                />
                <span className={`text-[10px] ${agent.isActive ? "text-success" : "text-white/30"}`}>
                  {agent.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                {editingAgent ? "Edit Agent" : "Create Agent"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white/60 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-white/40 mb-1.5">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Code Assistant"
                className="w-full bg-surface-100 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:border-brand-500/50 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-white/40 mb-1.5">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What does this agent do?"
                className="w-full bg-surface-100 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:border-brand-500/50 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-white/40 mb-1.5">System Prompt</label>
              <textarea
                value={form.systemPrompt}
                onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                placeholder="Define the agent's behavior and capabilities..."
                rows={4}
                className="w-full bg-surface-100 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:border-brand-500/50 focus:outline-none transition-all resize-none"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-white/40 mb-1.5">Model</label>
                <select
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="w-full bg-surface-100 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white focus:border-brand-500/50 focus:outline-none transition-all"
                >
                  <option value="GPT-5.2">GPT-5.2 (Free)</option>
                  <option value="GPT-4o">GPT-4o (Free)</option>
                  <option value="Claude Sonnet">Claude Sonnet (Free)</option>
                </select>
              </div>
              <div className="w-28">
                <label className="block text-[11px] font-medium text-white/40 mb-1.5">Temperature</label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) || 0.7 })}
                  className="w-full bg-surface-100 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white focus:border-brand-500/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!form.name.trim() || !form.systemPrompt.trim()}
              className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 text-sm disabled:opacity-30"
            >
              <Save className="w-4 h-4" />
              {editingAgent ? "Save Changes" : "Create Agent"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
