"use client";

/**
 * Agent Simulation Page
 *
 * Visualizes the live multi-agent compliance pipeline graph.
 * Uses the SimulationGraph component with filter controls and status sidebar.
 */

import dynamic from "next/dynamic";
import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Network, Zap, Clock, Brain, Activity } from "lucide-react";
import type { SimAgent, SimEdge } from "@/components/dashboard/simulation-graph";

const SimulationGraph = dynamic(
  () => import("@/components/dashboard/simulation-graph").then((m) => m.SimulationGraph),
  { ssr: false }
);

const AGENTS: SimAgent[] = [
  { id: "orchestrator", name: "Orchestrator", role: "Task Coordinator", group: "Core", status: "thinking", sentiment: 0.7, sentiment_intensity: 0.8, recently_active: true, last_interaction: "2s ago", last_interaction_summary: "Delegating compliance scan to Scanner agent" },
  { id: "scanner", name: "Scanner", role: "Compliance Engine", group: "Core", status: "interacting", sentiment: 0.85, sentiment_intensity: 0.9, recently_active: true, last_interaction: "1s ago", last_interaction_summary: "HIGH risk PII detected. Blocking request." },
  { id: "classifier", name: "Classifier", role: "Risk Classifier", group: "Core", status: "thinking", sentiment: 0.6, sentiment_intensity: 0.6, recently_active: true, last_interaction: "3s ago", last_interaction_summary: "Running Gemini Flash scan on payload" },
  { id: "memory", name: "Memory", role: "Context Store", group: "Support", status: "idle", sentiment: 0.5, sentiment_intensity: 0.3, recently_active: false, last_interaction: "12s ago", last_interaction_summary: "Retrieved prior conversation context" },
  { id: "audit", name: "Auditor", role: "Audit Logger", group: "Support", status: "interacting", sentiment: 0.9, sentiment_intensity: 0.7, recently_active: true, last_interaction: "now", last_interaction_summary: "Writing tamper-proof log to Supabase" },
  { id: "hipaa", name: "HIPAA Guard", role: "PHI Detector", group: "Compliance", status: "idle", sentiment: 0.5, sentiment_intensity: 0.2, recently_active: false, last_interaction: "28s ago", last_interaction_summary: "No PHI detected in last scan" },
  { id: "quarantine", name: "Quarantine", role: "Isolation Handler", group: "Compliance", status: "idle", sentiment: 0.4, sentiment_intensity: 0.5, recently_active: false, last_interaction: "45s ago", last_interaction_summary: "4 items pending human review" },
  { id: "gateway", name: "Gateway", role: "Proxy Router", group: "Network", status: "interacting", sentiment: 0.75, sentiment_intensity: 0.8, recently_active: true, last_interaction: "now", last_interaction_summary: "Streaming response from OpenAI gpt-4o" },
];

const EDGES: SimEdge[] = [
  { source: "orchestrator", target: "scanner", strength: 0.9 },
  { source: "orchestrator", target: "classifier", strength: 0.8 },
  { source: "orchestrator", target: "memory", strength: 0.5 },
  { source: "scanner", target: "audit", strength: 0.9 },
  { source: "scanner", target: "quarantine", strength: 0.6 },
  { source: "scanner", target: "hipaa", strength: 0.7 },
  { source: "classifier", target: "scanner", strength: 0.8 },
  { source: "gateway", target: "orchestrator", strength: 0.9 },
  { source: "gateway", target: "scanner", strength: 0.7 },
  { source: "audit", target: "memory", strength: 0.4 },
];

const STATUS_ICON: Record<string, React.ComponentType<{ className?: string }>> = { idle: Clock, thinking: Brain, interacting: Zap };
const STATUS_COLOR: Record<string, string> = { idle: "text-slate-400", thinking: "text-amber-400", interacting: "text-brand-400" };

export default function AgentsPage() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const allGroups = Array.from(new Set(AGENTS.map((a) => a.group)));
  const activeCount = AGENTS.filter((a) => a.recently_active).length;
  const interactingCount = AGENTS.filter((a) => a.status === "interacting").length;
  const thinkingCount = AGENTS.filter((a) => a.status === "thinking").length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <Network className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Agent Simulation</h1>
            <p className="text-sm text-white/40">Live compliance pipeline multi-agent graph</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6 max-w-md">
        {[
          { label: "Active", value: activeCount, icon: Activity, color: "text-brand-400" },
          { label: "Interacting", value: interactingCount, icon: Zap, color: "text-brand-400" },
          { label: "Thinking", value: thinkingCount, icon: Brain, color: "text-amber-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
            <div>
              <p className="text-lg font-semibold text-white leading-none">{value}</p>
              <p className="text-xs text-white/40 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-5 flex-wrap xl:flex-nowrap">
        <div className="flex-1 min-w-0">
          <SimulationGraph agents={AGENTS} edges={EDGES} width={720} height={480} />
        </div>
        <div className="w-full xl:w-72 flex-shrink-0">
          <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-brand-400" />
                <span className="text-sm font-medium text-white">Agents</span>
              </div>
              <div className="flex items-center gap-1">
                {allGroups.map((g) => (
                  <button key={g} onClick={() => setSelectedGroup(selectedGroup === g ? null : g)}
                    className={`text-xs px-2 py-1 rounded-md border transition-colors ${selectedGroup === g ? "bg-brand-500/20 border-brand-400/30 text-brand-300" : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-white/[0.04] max-h-96 overflow-y-auto">
              {AGENTS.filter((a) => !selectedGroup || a.group === selectedGroup).map((agent) => {
                const Icon = STATUS_ICON[agent.status] ?? Clock;
                const color = STATUS_COLOR[agent.status] ?? "text-slate-400";
                return (
                  <motion.div key={agent.id} layout className="flex items-start gap-3 p-3.5 hover:bg-white/[0.03] transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${agent.recently_active ? "animate-pulse" : ""}`}
                      style={{ backgroundColor: agent.status === "idle" ? "#64748b" : agent.status === "thinking" ? "#f59e0b" : "#818cf8" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white truncate">{agent.name}</span>
                        <Icon className={`w-3 h-3 ${color} flex-shrink-0`} />
                      </div>
                      <p className="text-xs text-white/30 truncate">{agent.role}</p>
                      {agent.last_interaction_summary && (
                        <p className="text-xs text-white/25 truncate mt-0.5">{agent.last_interaction_summary}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
