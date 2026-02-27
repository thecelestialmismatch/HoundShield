"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Activity,
  Shield,
  ShieldAlert,
  ShieldX,
  Clock,
  Zap,
  Users,
  Radio,
  ChevronDown,
  Pause,
  Play,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ComplianceEvent {
  id: string;
  action: "ALLOWED" | "BLOCKED" | "QUARANTINED";
  risk_level: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  user_id: string;
  provider: string;
  model: string;
  timestamp: string;
  processing_time_ms: number;
  classifications: string[];
  entities_found: number;
}

interface DashboardMetrics {
  total_requests: number;
  blocked_count: number;
  quarantined_count: number;
  allowed_count: number;
  avg_latency_ms: number;
  active_connections: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RISK_COLORS: Record<string, string> = {
  NONE: "text-zinc-400",
  LOW: "text-emerald-400",
  MEDIUM: "text-amber-400",
  HIGH: "text-orange-500",
  CRITICAL: "text-red-500",
};

const RISK_BG: Record<string, string> = {
  NONE: "bg-zinc-500/10",
  LOW: "bg-emerald-500/10",
  MEDIUM: "bg-amber-500/10",
  HIGH: "bg-orange-500/10",
  CRITICAL: "bg-red-500/10",
};

const ACTION_ICONS: Record<string, typeof Shield> = {
  ALLOWED: Shield,
  BLOCKED: ShieldX,
  QUARANTINED: ShieldAlert,
};

const ACTION_COLORS: Record<string, string> = {
  ALLOWED: "text-emerald-400",
  BLOCKED: "text-red-400",
  QUARANTINED: "text-amber-400",
};

const MAX_EVENTS = 200;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RealtimeFeed() {
  const [events, setEvents] = useState<ComplianceEvent[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ComplianceEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Connect to SSE stream
  useEffect(() => {
    const es = new EventSource("/api/events/stream");
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.addEventListener("event", (e) => {
      if (paused) return;
      try {
        const event = JSON.parse(e.data) as ComplianceEvent;
        setEvents((prev) => {
          const updated = [event, ...prev];
          return updated.slice(0, MAX_EVENTS);
        });
      } catch {
        // Skip malformed events
      }
    });

    es.addEventListener("metric", (e) => {
      try {
        const m = JSON.parse(e.data) as DashboardMetrics;
        setMetrics(m);
      } catch {
        // Skip malformed metrics
      }
    });

    es.addEventListener("heartbeat", () => {
      setConnected(true);
    });

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [paused]);

  // Auto-scroll feed
  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [events, autoScroll]);

  const formatTime = useCallback((ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, []);

  const formatLatency = useCallback((ms: number) => {
    if (ms < 1) return "<1ms";
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }, []);

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio
              className={`h-4 w-4 ${connected ? "text-emerald-400 animate-pulse" : "text-red-400"}`}
            />
            <span className="text-sm font-medium">
              {connected ? "Live" : "Disconnected"}
            </span>
          </div>
          {metrics && (
            <span className="text-xs text-zinc-500">
              {metrics.active_connections} connection{metrics.active_connections !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaused(!paused)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              paused
                ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {paused ? (
              <>
                <Play className="h-3 w-3" /> Resume
              </>
            ) : (
              <>
                <Pause className="h-3 w-3" /> Pause
              </>
            )}
          </button>
          <button
            onClick={() => setEvents([])}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      {metrics && metrics.total_requests > 0 && (
        <div className="grid grid-cols-5 gap-px bg-zinc-800 border-b border-zinc-800">
          <MetricCell
            icon={<Zap className="h-3.5 w-3.5 text-blue-400" />}
            label="Total"
            value={metrics.total_requests.toLocaleString()}
          />
          <MetricCell
            icon={<Shield className="h-3.5 w-3.5 text-emerald-400" />}
            label="Allowed"
            value={metrics.allowed_count.toLocaleString()}
          />
          <MetricCell
            icon={<ShieldX className="h-3.5 w-3.5 text-red-400" />}
            label="Blocked"
            value={metrics.blocked_count.toLocaleString()}
          />
          <MetricCell
            icon={<ShieldAlert className="h-3.5 w-3.5 text-amber-400" />}
            label="Quarantined"
            value={metrics.quarantined_count.toLocaleString()}
          />
          <MetricCell
            icon={<Clock className="h-3.5 w-3.5 text-purple-400" />}
            label="Avg Latency"
            value={formatLatency(metrics.avg_latency_ms)}
          />
        </div>
      )}

      {/* Event Feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto min-h-0">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3 py-12">
            <Activity className="h-8 w-8 animate-pulse" />
            <p className="text-sm">Waiting for events...</p>
            <p className="text-xs text-zinc-600">
              Events appear here in real-time as the gateway processes requests
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {events.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                formatTime={formatTime}
                formatLatency={formatLatency}
                isSelected={selectedEvent?.id === event.id}
                onSelect={() =>
                  setSelectedEvent(selectedEvent?.id === event.id ? null : event)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Selected Event Detail */}
      {selectedEvent && (
        <div className="border-t border-zinc-800 bg-zinc-900/50 p-4 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400">
              Event Detail
            </span>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Close
            </button>
          </div>
          <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
            {JSON.stringify(selectedEvent, null, 2)}
          </pre>
        </div>
      )}

      {/* Scroll indicator */}
      {!autoScroll && events.length > 0 && (
        <button
          onClick={() => {
            setAutoScroll(true);
            if (feedRef.current) feedRef.current.scrollTop = 0;
          }}
          className="absolute bottom-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
        >
          <ChevronDown className="h-3 w-3" /> New events
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MetricCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/50">
      {icon}
      <div className="flex flex-col">
        <span className="text-xs text-zinc-500">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{value}</span>
      </div>
    </div>
  );
}

function EventRow({
  event,
  formatTime,
  formatLatency,
  isSelected,
  onSelect,
}: {
  event: ComplianceEvent;
  formatTime: (ts: string) => string;
  formatLatency: (ms: number) => string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const ActionIcon = ACTION_ICONS[event.action] ?? Shield;
  const actionColor = ACTION_COLORS[event.action] ?? "text-zinc-400";
  const riskColor = RISK_COLORS[event.risk_level] ?? "text-zinc-400";
  const riskBg = RISK_BG[event.risk_level] ?? "bg-zinc-500/10";

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-zinc-800/30 ${
        isSelected ? "bg-zinc-800/50" : ""
      }`}
    >
      {/* Action Icon */}
      <ActionIcon className={`h-4 w-4 shrink-0 ${actionColor}`} />

      {/* Provider & Model */}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {event.provider}
            <span className="text-zinc-500 font-normal">/{event.model}</span>
          </span>
          <span
            className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${riskBg} ${riskColor}`}
          >
            {event.risk_level}
          </span>
        </div>
        <span className="text-xs text-zinc-500 truncate">
          {event.user_id}
          {event.entities_found > 0 && (
            <span className="text-amber-400 ml-1">
              · {event.entities_found} entit{event.entities_found === 1 ? "y" : "ies"}
            </span>
          )}
        </span>
      </div>

      {/* Latency */}
      <span className="text-xs text-zinc-500 tabular-nums shrink-0">
        {formatLatency(event.processing_time_ms)}
      </span>

      {/* Timestamp */}
      <span className="text-xs text-zinc-600 tabular-nums shrink-0">
        {formatTime(event.timestamp)}
      </span>
    </button>
  );
}

export default RealtimeFeed;
