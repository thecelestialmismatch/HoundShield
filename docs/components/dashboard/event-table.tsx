"use client";

import { useEffect, useState, useCallback } from "react";
import { Inbox, RefreshCw, Download, Search, X } from "lucide-react";

interface ComplianceEvent {
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

const RISK_CONFIG: Record<string, { dot: string; text: string }> = {
  NONE: { dot: "bg-white/30", text: "text-slate-500" },
  LOW: { dot: "bg-info", text: "text-info" },
  MEDIUM: { dot: "bg-warning", text: "text-warning" },
  HIGH: { dot: "bg-[#f97316]", text: "text-[#f97316]" },
  CRITICAL: { dot: "bg-danger", text: "text-danger" },
};

const ACTION_BADGE: Record<string, string> = {
  ALLOWED: "bg-success-muted text-success",
  BLOCKED: "bg-danger-muted text-danger",
  QUARANTINED: "bg-warning-muted text-warning",
};

const FILTERS = ["all", "BLOCKED", "QUARANTINED", "ALLOWED"] as const;

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 w-20 rounded bg-white/5" />
        </td>
      ))}
    </tr>
  );
}

export function EventTable() {
  const [events, setEvents] = useState<ComplianceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    const params = new URLSearchParams({ limit: "50" });
    if (filter !== "all") params.set("action", filter);

    try {
      const res = await fetch(`/api/compliance/events?${params}`);
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const interval = setInterval(() => fetchEvents(), 30000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const filteredEvents = searchQuery
    ? events.filter(
        (e) =>
          e.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.risk_level.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.classifications.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (e.destination_provider ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : events;

  function exportCSV() {
    const headers = ["Time", "User", "Risk Level", "Categories", "Action", "Confidence", "Provider", "Processing Time"];
    const rows = filteredEvents.map((e) => [
      new Date(e.created_at).toISOString(),
      e.user_id,
      e.risk_level,
      e.classifications.join("; "),
      e.action_taken,
      `${Math.round(e.confidence_score * 100)}%`,
      e.destination_provider ?? "",
      e.processing_time_ms ? `${e.processing_time_ms}ms` : "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `houndshield-events-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Compliance Events</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchEvents(true)}
            disabled={refreshing}
            className="btn-ghost text-xs px-3 py-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button onClick={exportCSV} className="btn-ghost text-xs px-3 py-1.5">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                filter === f
                  ? "bg-brand-500/100/15 text-brand-500 border border-brand-500/30"
                  : "text-slate-400 hover:text-slate-400 hover:bg-white/5 border border-transparent"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-400 focus:border-brand-400 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-slate-400">
        Showing {filteredEvents.length} of {events.length} events
        {filter !== "all" && ` (filtered: ${filter.toLowerCase()})`}
        {searchQuery && ` matching "${searchQuery}"`}
      </p>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {["Time", "User", "Risk", "Categories", "Action", "Confidence", "Provider"].map((h) => (
                  <th key={h} className="text-left text-[10px] font-medium text-slate-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Inbox className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-slate-400 text-sm">
              {searchQuery ? `No events matching "${searchQuery}"` : "No events yet"}
            </p>
            <p className="text-slate-300 dark:text-slate-300 text-xs mt-1">
              {searchQuery ? "Try a different search term." : "Events appear here when LLM requests are intercepted."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {["Time", "User", "Risk", "Categories", "Action", "Confidence", "Provider"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-medium text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredEvents.map((event) => {
                  const risk = RISK_CONFIG[event.risk_level] ?? RISK_CONFIG.NONE;
                  return (
                    <tr key={event.id} className="hover:bg-white transition-colors">
                      <td className="px-4 py-3.5 text-slate-500 font-mono text-xs whitespace-nowrap">
                        {new Date(event.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-xs truncate max-w-[140px]">
                        {event.user_id}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${risk.dot} ${event.risk_level === "CRITICAL" ? "animate-pulse" : ""}`} />
                          <span className={`text-xs font-medium ${risk.text}`}>
                            {event.risk_level}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">
                        {event.classifications.length > 0
                          ? event.classifications.map((c, i) => (
                              <span key={i} className="inline-block bg-white/5 px-1.5 py-0.5 rounded text-[10px] mr-1">
                                {c}
                              </span>
                            ))
                          : <span className="text-slate-500">-</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`badge ${ACTION_BADGE[event.action_taken] ?? ""}`}>
                          {event.action_taken}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">
                        {Math.round(event.confidence_score * 100)}%
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-xs">
                        {event.destination_provider ?? "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
