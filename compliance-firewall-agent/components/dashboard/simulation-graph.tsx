"use client";

/**
 * SimulationGraph
 *
 * A force-directed multi-agent visualization for the Kaelus command center.
 * Renders agents as circular nodes on an SVG canvas with:
 *   - Tooltip on hover: name, role, status, recent interaction, sentiment
 *   - Status colors: idle (slate), interacting (brand/indigo), thinking (amber)
 *   - Sentiment ring: thickness and glow driven by sentiment value (0-1)
 *   - Pulse animation for recently active agents
 *   - Status filter: show/hide by status
 *   - Group filter: show/hide by group
 *
 * The layout uses a simple spring simulation that runs in a requestAnimationFrame
 * loop and settles quickly. No external physics library required.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Zap,
  Clock,
  Filter,
  ChevronDown,
  Users,
  Activity,
  Eye,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AgentStatus = "idle" | "interacting" | "thinking";

export interface SimAgent {
  id: string;
  name: string;
  role: string;
  group: string;
  status: AgentStatus;
  sentiment: number; // 0.0 = negative, 0.5 = neutral, 1.0 = positive
  sentiment_intensity: number; // 0.0 = low, 1.0 = high
  last_interaction?: string;
  last_interaction_summary?: string;
  recently_active: boolean; // drives pulse animation
}

export interface SimEdge {
  source: string;
  target: string;
  strength?: number; // 0-1
}

interface SimulationGraphProps {
  agents?: SimAgent[];
  edges?: SimEdge[];
  width?: number;
  height?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Demo data (used when no props are passed)
// ---------------------------------------------------------------------------

const DEMO_AGENTS: SimAgent[] = [
  {
    id: "orchestrator",
    name: "Orchestrator",
    role: "Task Coordinator",
    group: "Core",
    status: "thinking",
    sentiment: 0.7,
    sentiment_intensity: 0.8,
    recently_active: true,
    last_interaction: "2s ago",
    last_interaction_summary: "Delegating compliance scan to Scanner agent",
  },
  {
    id: "scanner",
    name: "Scanner",
    role: "Compliance Engine",
    group: "Core",
    status: "interacting",
    sentiment: 0.85,
    sentiment_intensity: 0.9,
    recently_active: true,
    last_interaction: "1s ago",
    last_interaction_summary: "Detected HIGH risk PII in prompt. Blocking.",
  },
  {
    id: "classifier",
    name: "Classifier",
    role: "Risk Classifier",
    group: "Core",
    status: "thinking",
    sentiment: 0.6,
    sentiment_intensity: 0.6,
    recently_active: true,
    last_interaction: "3s ago",
    last_interaction_summary: "Running Gemini Flash scan on payload",
  },
  {
    id: "memory",
    name: "Memory",
    role: "Context Store",
    group: "Support",
    status: "idle",
    sentiment: 0.5,
    sentiment_intensity: 0.3,
    recently_active: false,
    last_interaction: "12s ago",
    last_interaction_summary: "Retrieved prior conversation context",
  },
  {
    id: "audit",
    name: "Auditor",
    role: "Audit Logger",
    group: "Support",
    status: "interacting",
    sentiment: 0.9,
    sentiment_intensity: 0.7,
    recently_active: true,
    last_interaction: "now",
    last_interaction_summary: "Writing tamper-proof log entry to Supabase",
  },
  {
    id: "hipaa",
    name: "HIPAA Guard",
    role: "PHI Detector",
    group: "Compliance",
    status: "idle",
    sentiment: 0.5,
    sentiment_intensity: 0.2,
    recently_active: false,
    last_interaction: "28s ago",
    last_interaction_summary: "No PHI detected in last scan",
  },
  {
    id: "quarantine",
    name: "Quarantine",
    role: "Isolation Handler",
    group: "Compliance",
    status: "idle",
    sentiment: 0.4,
    sentiment_intensity: 0.5,
    recently_active: false,
    last_interaction: "45s ago",
    last_interaction_summary: "Holding 4 items pending human review",
  },
  {
    id: "gateway",
    name: "Gateway",
    role: "Proxy Router",
    group: "Network",
    status: "interacting",
    sentiment: 0.75,
    sentiment_intensity: 0.8,
    recently_active: true,
    last_interaction: "now",
    last_interaction_summary: "Streaming response from OpenAI gpt-4o",
  },
];

const DEMO_EDGES: SimEdge[] = [
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

// ---------------------------------------------------------------------------
// Status visual config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  AgentStatus,
  {
    color: string;
    glow: string;
    label: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    textClass: string;
  }
> = {
  idle: {
    color: "#64748b",
    glow: "rgba(100,116,139,0.15)",
    label: "Idle",
    icon: Clock,
    textClass: "text-slate-500",
  },
  thinking: {
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.25)",
    label: "Thinking",
    icon: Brain,
    textClass: "text-amber-500",
  },
  interacting: {
    color: "#818cf8",
    glow: "rgba(129,140,248,0.3)",
    label: "Interacting",
    icon: Zap,
    textClass: "text-indigo-400",
  },
};

// ---------------------------------------------------------------------------
// Sentiment ring helpers
// ---------------------------------------------------------------------------

function sentimentColor(sentiment: number): string {
  if (sentiment >= 0.7) return "#10b981"; // emerald
  if (sentiment >= 0.4) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

function ringThickness(intensity: number): number {
  return 2 + intensity * 4; // 2px to 6px
}

function ringOpacity(intensity: number): number {
  return 0.3 + intensity * 0.7; // 0.3 to 1.0
}

// ---------------------------------------------------------------------------
// Spring layout
// ---------------------------------------------------------------------------

interface NodePos {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function initPositions(agents: SimAgent[], w: number, h: number): Map<string, NodePos> {
  const positions = new Map<string, NodePos>();
  const cx = w / 2;
  const cy = h / 2;
  agents.forEach((agent, i) => {
    const angle = (i / agents.length) * Math.PI * 2;
    const radius = Math.min(w, h) * 0.3;
    positions.set(agent.id, {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
    });
  });
  return positions;
}

function tickLayout(
  positions: Map<string, NodePos>,
  agents: SimAgent[],
  edges: SimEdge[],
  w: number,
  h: number
): Map<string, NodePos> {
  const next = new Map(Array.from(positions.entries()).map(([id, p]) => [id, { ...p }]));
  const REPULSION = 3500;
  const ATTRACTION = 0.04;
  const DAMPING = 0.85;
  const BOUNDARY_PADDING = 48;

  // Repulsion between all pairs
  const ids = Array.from(next.keys());
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = next.get(ids[i])!;
      const b = next.get(ids[j])!;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = REPULSION / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }
  }

  // Attraction along edges
  for (const edge of edges) {
    const a = next.get(edge.source);
    const b = next.get(edge.target);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const strength = (edge.strength ?? 0.5) * ATTRACTION;
    const fx = dx * strength;
    const fy = dy * strength;
    a.vx += fx;
    a.vy += fy;
    b.vx -= fx;
    b.vy -= fy;
  }

  // Center gravity (weak pull toward center)
  const cx = w / 2;
  const cy = h / 2;
  for (const [, pos] of next) {
    pos.vx += (cx - pos.x) * 0.002;
    pos.vy += (cy - pos.y) * 0.002;
  }

  // Integrate + damp + boundary
  for (const [, pos] of next) {
    pos.vx *= DAMPING;
    pos.vy *= DAMPING;
    pos.x += pos.vx;
    pos.y += pos.vy;
    pos.x = Math.max(BOUNDARY_PADDING, Math.min(w - BOUNDARY_PADDING, pos.x));
    pos.y = Math.max(BOUNDARY_PADDING, Math.min(h - BOUNDARY_PADDING, pos.y));
  }

  return next;
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

function AgentTooltip({ agent, x, y }: { agent: SimAgent; x: number; y: number }) {
  const statusConfig = STATUS_CONFIG[agent.status];
  const StatusIcon = statusConfig.icon;
  const statusColor = statusConfig.color;

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{ left: x + 20, top: y - 10, transform: "translateY(-50%)" }}
    >
      <div className="bg-[#0d0d14] border border-white/[0.12] rounded-xl shadow-2xl p-3.5 w-64">
        <div className="flex items-start gap-2.5 mb-2">
          <div
            className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
            style={{ backgroundColor: statusColor }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{agent.name}</p>
            <p className="text-xs text-white/40 truncate">{agent.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-2">
          <StatusIcon className={`w-3 h-3 ${statusConfig.textClass}`} style={{ color: statusColor }} />
          <span className={`text-xs font-medium ${statusConfig.textClass}`}>
            {statusConfig.label}
          </span>
          <span className="ml-auto text-xs text-white/30">{agent.last_interaction}</span>
        </div>

        {agent.last_interaction_summary && (
          <p className="text-xs text-white/50 leading-relaxed border-t border-white/[0.06] pt-2 mt-2">
            {agent.last_interaction_summary}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-white/30">Sentiment</span>
          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${agent.sentiment * 100}%`,
                backgroundColor: sentimentColor(agent.sentiment),
              }}
            />
          </div>
          <span className="text-xs text-white/40">{Math.round(agent.sentiment * 100)}%</span>
        </div>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-white/30">Group</span>
          <span className="text-xs text-brand-300 bg-brand-500/10 px-1.5 py-0.5 rounded-md border border-brand-400/20">
            {agent.group}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SimulationGraph({
  agents = DEMO_AGENTS,
  edges = DEMO_EDGES,
  width = 720,
  height = 480,
  className = "",
}: SimulationGraphProps) {
  const [positions, setPositions] = useState<Map<string, NodePos>>(() =>
    initPositions(agents, width, height)
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AgentStatus | "all">("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showGroupFilter, setShowGroupFilter] = useState(false);
  const rafRef = useRef<number | null>(null);
  const ticksRef = useRef(0);
  const MAX_TICKS = 200; // settle after N frames

  // Reset positions when agents change
  useEffect(() => {
    setPositions(initPositions(agents, width, height));
    ticksRef.current = 0;
  }, [agents, width, height]);

  // Spring simulation loop
  useEffect(() => {
    const tick = () => {
      if (ticksRef.current >= MAX_TICKS) return;
      ticksRef.current++;
      setPositions((prev) => tickLayout(prev, agents, edges, width, height));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [agents, edges, width, height]);

  const allGroups = useMemo(
    () => Array.from(new Set(agents.map((a) => a.group))),
    [agents]
  );

  const visibleAgents = useMemo(
    () =>
      agents.filter((a) => {
        if (statusFilter !== "all" && a.status !== statusFilter) return false;
        if (groupFilter !== "all" && a.group !== groupFilter) return false;
        return true;
      }),
    [agents, statusFilter, groupFilter]
  );

  const visibleIds = useMemo(
    () => new Set(visibleAgents.map((a) => a.id)),
    [visibleAgents]
  );

  const hoveredAgent = hoveredId ? agents.find((a) => a.id === hoveredId) ?? null : null;
  const hoveredPos = hoveredId ? positions.get(hoveredId) ?? null : null;

  const NODE_RADIUS = 24;

  return (
    <div className={`relative select-none ${className}`}>
      {/* Filter toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Filter className="w-4 h-4 text-white/30 flex-shrink-0" />

        {/* Status filter */}
        <div className="relative">
          <button
            onClick={() => { setShowStatusFilter((v) => !v); setShowGroupFilter(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:text-white hover:border-white/20 transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            {statusFilter === "all" ? "All statuses" : STATUS_CONFIG[statusFilter as AgentStatus].label}
            <ChevronDown className="w-3 h-3" />
          </button>
          <AnimatePresence>
            {showStatusFilter && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 mt-1 z-50 w-40 bg-[#0d0d14] border border-white/10 rounded-xl shadow-xl overflow-hidden"
              >
                {(["all", "idle", "thinking", "interacting"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setShowStatusFilter(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${
                      statusFilter === s ? "bg-brand-500/20 text-brand-300" : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {s !== "all" && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: STATUS_CONFIG[s as AgentStatus].color }}
                      />
                    )}
                    {s === "all" ? "All statuses" : STATUS_CONFIG[s as AgentStatus].label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Group filter */}
        <div className="relative">
          <button
            onClick={() => { setShowGroupFilter((v) => !v); setShowStatusFilter(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:text-white hover:border-white/20 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            {groupFilter === "all" ? "All groups" : groupFilter}
            <ChevronDown className="w-3 h-3" />
          </button>
          <AnimatePresence>
            {showGroupFilter && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 mt-1 z-50 w-36 bg-[#0d0d14] border border-white/10 rounded-xl shadow-xl overflow-hidden"
              >
                {["all", ...allGroups].map((g) => (
                  <button
                    key={g}
                    onClick={() => { setGroupFilter(g); setShowGroupFilter(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${
                      groupFilter === g ? "bg-brand-500/20 text-brand-300" : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {g === "all" ? "All groups" : g}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span className="ml-auto text-xs text-white/20">
          {visibleAgents.length} of {agents.length} agents
        </span>
      </div>

      {/* Graph canvas */}
      <div className="relative overflow-hidden rounded-xl bg-[#07070b] border border-white/[0.06]" style={{ width, height }}>
        <svg
          width={width}
          height={height}
          className="absolute inset-0"
          onClick={() => { setShowStatusFilter(false); setShowGroupFilter(false); }}
        >
          {/* Edge lines */}
          {edges.map((edge) => {
            if (!visibleIds.has(edge.source) || !visibleIds.has(edge.target)) return null;
            const src = positions.get(edge.source);
            const tgt = positions.get(edge.target);
            if (!src || !tgt) return null;
            const isActive =
              (agents.find((a) => a.id === edge.source)?.recently_active ||
                agents.find((a) => a.id === edge.target)?.recently_active) ??
              false;
            return (
              <line
                key={`${edge.source}-${edge.target}`}
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={isActive ? "rgba(129,140,248,0.25)" : "rgba(255,255,255,0.05)"}
                strokeWidth={isActive ? 1.5 : 0.75}
                strokeDasharray={isActive ? undefined : "4 4"}
              />
            );
          })}

          {/* Agent nodes */}
          {visibleAgents.map((agent) => {
            const pos = positions.get(agent.id);
            if (!pos) return null;
            const statusConfig = STATUS_CONFIG[agent.status];
            const ringThick = ringThickness(agent.sentiment_intensity);
            const ringAlpha = ringOpacity(agent.sentiment_intensity);
            const ringColor = sentimentColor(agent.sentiment);
            const isHovered = hoveredId === agent.id;

            return (
              <g
                key={agent.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredId(agent.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Sentiment ring glow (if intensity > 0.5) */}
                {agent.sentiment_intensity > 0.5 && (
                  <circle
                    r={NODE_RADIUS + ringThick + 4}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={ringThick + 4}
                    opacity={ringAlpha * 0.2}
                    filter="url(#glow)"
                  />
                )}

                {/* Sentiment ring */}
                <circle
                  r={NODE_RADIUS + ringThick / 2 + 2}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth={ringThick}
                  opacity={ringAlpha}
                />

                {/* Status ring */}
                <circle
                  r={NODE_RADIUS + 1}
                  fill="none"
                  stroke={statusConfig.color}
                  strokeWidth={2}
                  opacity={0.8}
                />

                {/* Node body */}
                <circle
                  r={NODE_RADIUS}
                  fill={isHovered ? "#1a1a2e" : "#111118"}
                  stroke={statusConfig.color}
                  strokeWidth={1.5}
                />

                {/* Pulse animation for recently active agents */}
                {agent.recently_active && (
                  <circle
                    r={NODE_RADIUS}
                    fill="none"
                    stroke={statusConfig.color}
                    strokeWidth={2}
                    opacity={0}
                    className={agent.recently_active ? "animate-ping" : ""}
                    style={{
                      animationDuration: `${1.2 - agent.sentiment_intensity * 0.4}s`,
                    }}
                  />
                )}

                {/* Status dot */}
                <circle
                  r={5}
                  cx={NODE_RADIUS - 5}
                  cy={-(NODE_RADIUS - 5)}
                  fill={statusConfig.color}
                />

                {/* Label */}
                <text
                  textAnchor="middle"
                  dy="0.35em"
                  fontSize="10"
                  fontWeight="600"
                  fill="white"
                  fillOpacity={0.9}
                >
                  {agent.name.slice(0, 8)}
                </text>
              </g>
            );
          })}

          {/* SVG filter for glow */}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredAgent && hoveredPos && (
            <motion.div
              key={hoveredAgent.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.1 }}
              className="absolute pointer-events-none z-50"
              style={{
                left: Math.min(hoveredPos.x + 30, width - 270),
                top: Math.min(Math.max(hoveredPos.y - 80, 8), height - 160),
              }}
            >
              <AgentTooltip
                agent={hoveredAgent}
                x={0}
                y={0}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <div key={status} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: config.color }}
              />
              <span className="text-xs text-white/30">{config.label}</span>
            </div>
          ))}
        </div>

        {/* Active count badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/[0.06]">
          <Eye className="w-3 h-3 text-white/30" />
          <span className="text-xs text-white/40">
            {agents.filter((a) => a.recently_active).length} active
          </span>
        </div>
      </div>
    </div>
  );
}

export default SimulationGraph;
