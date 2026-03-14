"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  User,
  Globe,
  TrendingUp,
  Activity,
  RefreshCw,
  Zap,
} from "lucide-react";

interface TimelineEvent {
  id: string;
  created_at: string;
  user_id: string;
  risk_level: string;
  classifications: string[];
  action_taken: string;
  confidence_score: number;
  destination_provider: string | null;
  processing_time_ms: number | null;
}

const RISK_CONFIG: Record<string, { icon: typeof Shield; color: string; bg: string; border: string; glow: string }> = {
  CRITICAL: {
    icon: ShieldAlert,
    color: "text-danger",
    bg: "bg-danger-muted",
    border: "border-danger/30",
    glow: "shadow-[0_0_12px_rgba(244,63,94,0.15)]",
  },
  HIGH: {
    icon: AlertTriangle,
    color: "text-[#f97316]",
    bg: "bg-[#f97316]/10",
    border: "border-[#f97316]/30",
    glow: "shadow-[0_0_12px_rgba(249,115,22,0.15)]",
  },
  MEDIUM: {
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning-muted",
    border: "border-warning/30",
    glow: "",
  },
  LOW: {
    icon: Shield,
    color: "text-info",
    bg: "bg-info-muted",
    border: "border-info/20",
    glow: "",
  },
  NONE: {
    icon: ShieldCheck,
    color: "text-success",
    bg: "bg-success-muted",
    border: "border-success/20",
    glow: "",
  },
};

const ACTION_STYLES: Record<string, string> = {
  BLOCKED: "bg-danger-muted text-danger",
  QUARANTINED: "bg-warning-muted text-warning",
  ALLOWED: "bg-success-muted text-success",
};

export function ThreatTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liveCount, setLiveCount] = useState(0);

  const fetchEvents = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/compliance/events?limit=20");
      const data = await res.json();
      const newEvents = data.events ?? [];
      if (newEvents.length > events.length) {
        setLiveCount((prev) => prev + (newEvents.length - events.length));
      }
      setEvents(newEvents);
    } catch {
      // Keep existing events
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [events.length]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(() => fetchEvents(), 15000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Summary stats
  const criticalCount = events.filter((e) => e.risk_level === "CRITICAL").length;
  const blockedCount = events.filter((e) => e.action_taken === "BLOCKED").length;
  const avgProcessingTime = events.length
    ? Math.round(events.reduce((sum, e) => sum + (e.processing_time_ms || 0), 0) / events.length)
    : 0;

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Threat Timeline</h2>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
            </span>
            <span className="text-[10px] text-success font-medium">LIVE</span>
          </div>
        </div>
        <button
          onClick={() => fetchEvents(true)}
          disabled={refreshing}
          className="btn-ghost text-[11px] px-3 py-1.5"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3.5 text-center">
          <p className="text-xl font-bold text-danger">{criticalCount}</p>
          <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">Critical Threats</p>
        </div>
        <div className="glass-card p-3.5 text-center">
          <p className="text-xl font-bold text-warning">{blockedCount}</p>
          <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">Blocked</p>
        </div>
        <div className="glass-card p-3.5 text-center">
          <p className="text-xl font-bold text-blue-600">{avgProcessingTime}ms</p>
          <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">Avg Scan Time</p>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-white/5" />
                  <div className="h-2 w-48 rounded bg-white/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ShieldCheck className="w-10 h-10 text-slate-700 dark:text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-400">No threat events yet</p>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">Events appear here when LLM requests are intercepted</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

          <div className="space-y-1">
            {events.map((event, index) => {
              const config = RISK_CONFIG[event.risk_level] || RISK_CONFIG.NONE;
              const Icon = config.icon;

              return (
                <div
                  key={event.id}
                  className={`relative flex gap-3 py-3 px-3 rounded-lg hover:bg-white transition-all ${
                    index === 0 ? "animate-fade-in-up" : ""
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0 z-10 border ${config.border} ${config.glow}`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${config.color}`}>{event.risk_level}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${ACTION_STYLES[event.action_taken] || ""}`}>
                        {event.action_taken}
                      </span>
                      {event.classifications.map((c, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-600 dark:text-slate-400">
                          {c}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {event.user_id}
                      </span>
                      {event.destination_provider && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {event.destination_provider}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {Math.round(event.confidence_score * 100)}%
                      </span>
                      {event.processing_time_ms && (
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {event.processing_time_ms}ms
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(event.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
