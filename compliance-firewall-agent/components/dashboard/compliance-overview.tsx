"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  Activity,
  RefreshCw,
  Zap,
} from "lucide-react";

interface Stats {
  total_events: number;
  blocked: number;
  quarantined: number;
  allowed: number;
  critical: number;
}

const STAT_CARDS = [
  {
    key: "total_events" as const,
    label: "Total Events",
    icon: ShieldCheck,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    valueColor: "text-slate-900",
    gradient: "from-brand-500/10 to-transparent",
  },
  {
    key: "blocked" as const,
    label: "Blocked",
    icon: ShieldAlert,
    iconBg: "bg-danger-muted",
    iconColor: "text-danger",
    valueColor: "text-danger",
    gradient: "from-danger/10 to-transparent",
  },
  {
    key: "quarantined" as const,
    label: "Quarantined",
    icon: Clock,
    iconBg: "bg-warning-muted",
    iconColor: "text-warning",
    valueColor: "text-warning",
    gradient: "from-warning/10 to-transparent",
  },
  {
    key: "allowed" as const,
    label: "Allowed",
    icon: CheckCircle,
    iconBg: "bg-success-muted",
    iconColor: "text-success",
    valueColor: "text-success",
    gradient: "from-success/10 to-transparent",
  },
  {
    key: "critical" as const,
    label: "Critical",
    icon: AlertTriangle,
    iconBg: "bg-danger-muted",
    iconColor: "text-danger",
    valueColor: "text-danger",
    gradient: "from-danger/10 to-transparent",
  },
];

function AnimatedValue({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    const from = prevTarget.current;
    const diff = target - from;
    if (diff === 0) return;
    const duration = 800;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    prevTarget.current = target;
  }, [target]);

  return <>{display}</>;
}

function ThreatChart({ events }: { events: any[] }) {
  const now = Date.now();
  const hours = Array.from({ length: 12 }, (_, i) => {
    const hourStart = now - (11 - i) * 3600000;
    const hourEnd = hourStart + 3600000;
    const hourEvents = events.filter((e) => {
      const t = new Date(e.created_at).getTime();
      return t >= hourStart && t < hourEnd;
    });
    return {
      label: new Date(hourStart).toLocaleTimeString([], { hour: "2-digit" }),
      total: hourEvents.length,
      blocked: hourEvents.filter((e: any) => e.action_taken === "BLOCKED").length,
    };
  });
  const maxVal = Math.max(...hours.map((h) => h.total), 1);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-slate-900">Threat Activity</h3>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">Last 12 hours</p>
        </div>
        <Activity className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex items-end gap-1.5 h-24">
        {hours.map((hour, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="w-full flex flex-col-reverse" style={{ height: "80px" }}>
              {hour.total > 0 && (
                <div
                  className="w-full rounded-sm bg-brand-500/30 hover:bg-brand-500/50 transition-colors relative"
                  style={{ height: `${(hour.total / maxVal) * 100}%`, minHeight: "4px" }}
                >
                  {hour.blocked > 0 && (
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-danger/40 rounded-sm"
                      style={{ height: `${(hour.blocked / hour.total) * 100}%` }}
                    />
                  )}
                </div>
              )}
            </div>
            <span className="text-[8px] text-slate-700 dark:text-slate-300 group-hover:text-slate-600 dark:text-slate-400 transition-colors">
              {hour.label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-brand-500/30" />Total</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-danger/40" />Blocked</div>
      </div>
    </div>
  );
}

function RecentThreats({ events }: { events: any[] }) {
  const threats = events
    .filter((e: any) => e.risk_level === "CRITICAL" || e.risk_level === "HIGH")
    .slice(0, 4);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-slate-900">Recent Threats</h3>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">Critical & high risk events</p>
        </div>
        <ShieldAlert className="w-4 h-4 text-danger" />
      </div>
      <div className="space-y-3">
        {threats.length === 0 ? (
          <p className="text-xs text-slate-600 dark:text-slate-400 text-center py-4">No recent threats</p>
        ) : (
          threats.map((event: any) => (
            <div
              key={event.id}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-white hover:bg-slate-100 transition-colors"
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                event.risk_level === "CRITICAL" ? "bg-danger" : "bg-warning"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 truncate">{event.user_id}</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">
                  {event.classifications.join(", ")} - {event.destination_provider}
                </p>
              </div>
              <span className={`badge text-[10px] ${
                event.action_taken === "BLOCKED"
                  ? "bg-danger-muted text-danger"
                  : "bg-warning-muted text-warning"
              }`}>
                {event.action_taken}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ProviderBreakdown({ events }: { events: any[] }) {
  const providers = events.reduce((acc: Record<string, number>, e: any) => {
    const p = e.destination_provider || "Unknown";
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});
  const total = events.length || 1;
  const entries = Object.entries(providers).sort((a, b) => b[1] - a[1]);
  const colors = ["bg-brand-500", "bg-purple-500", "bg-pink-500", "bg-blue-500"];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-slate-900">Provider Breakdown</h3>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">Requests by AI provider</p>
        </div>
        <Zap className="w-4 h-4 text-blue-600" />
      </div>
      <div className="space-y-3">
        {entries.map(([provider, count], i) => (
          <div key={provider}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600">{provider}</span>
              <span className="text-slate-600 dark:text-slate-400">{count} ({Math.round((count / total) * 100)}%)</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-1000`}
                style={{ width: `${(count / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/5" />
        <div className="w-12 h-4 rounded bg-white/5" />
      </div>
      <div className="w-16 h-8 rounded bg-white/5 mb-1" />
      <div className="w-20 h-3 rounded bg-white/5" />
    </div>
  );
}

export function ComplianceOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/compliance/events?limit=200");
      const data = await res.json();
      const evts = data.events ?? [];
      setEvents(evts);
      setStats({
        total_events: data.total ?? evts.length,
        blocked: evts.filter((e: any) => e.action_taken === "BLOCKED").length,
        quarantined: evts.filter((e: any) => e.action_taken === "QUARANTINED").length,
        allowed: evts.filter((e: any) => e.action_taken === "ALLOWED").length,
        critical: evts.filter((e: any) => e.risk_level === "CRITICAL").length,
      });
      setLastUpdated(new Date());
    } catch {
      setStats({ total_events: 0, blocked: 0, quarantined: 0, allowed: 0, critical: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(), 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Compliance Overview</h2>
          {lastUpdated && (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last updated: {lastUpdated.toLocaleTimeString()}
              <span className="text-slate-500"> | Auto-refreshes every 30s</span>
            </p>
          )}
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="btn-ghost text-xs px-3 py-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          const value = stats?.[card.key] ?? 0;
          const total = stats?.total_events ?? 1;
          const percentage = card.key === "total_events" ? 100 : Math.round((value / total) * 100);
          const isGood = card.key === "allowed" || (card.key === "critical" && value === 0);
          const TrendIcon = isGood ? TrendingUp : TrendingDown;

          return (
            <div key={card.key} className="glass-card p-5 group relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  {card.key !== "total_events" && (
                    <div className={`flex items-center gap-1 text-xs ${isGood ? "text-success" : "text-slate-600 dark:text-slate-400"}`}>
                      <TrendIcon className="w-3 h-3" />
                      <span>{percentage}%</span>
                    </div>
                  )}
                </div>
                <p className={`text-2xl font-bold ${card.valueColor} counter-value`}>
                  <AnimatedValue target={value} />
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ThreatChart events={events} />
        <RecentThreats events={events} />
        <ProviderBreakdown events={events} />
      </div>

      <div className="glass-card p-6">
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Quick Actions</h3>
        <div className="flex gap-3 flex-wrap">
          <a
            href={`/api/reports/generate?from=${new Date(Date.now() - 7 * 86400000).toISOString()}&to=${new Date().toISOString()}`}
            target="_blank"
            className="btn-primary inline-flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Weekly Report
          </a>
          <a
            href={`/api/reports/generate?from=${new Date(Date.now() - 30 * 86400000).toISOString()}&to=${new Date().toISOString()}`}
            target="_blank"
            className="btn-ghost inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Monthly Report
          </a>
          <a href="/api/health" target="_blank" className="btn-ghost inline-flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Health Check
          </a>
        </div>
      </div>
    </div>
  );
}
