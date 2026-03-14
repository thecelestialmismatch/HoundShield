"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  User,
  Globe,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Filter,
} from "lucide-react";

interface QuarantineItem {
  id: string;
  created_at: string;
  review_status: string;
  priority: number;
  detected_entities: Array<{
    type: string;
    value_redacted: string;
    pattern_matched: string;
    confidence: number;
  }>;
  compliance_events: {
    user_id: string;
    risk_level: string;
    destination_provider: string | null;
  } | null;
}

const PRIORITY_CONFIG: Record<number, { icon: typeof AlertTriangle; color: string; stripe: string; label: string; bg: string }> = {
  5: { icon: AlertTriangle, color: "bg-danger-muted text-danger", stripe: "bg-danger", label: "Critical", bg: "from-danger/5 to-transparent" },
  4: { icon: AlertCircle, color: "bg-danger-muted text-danger", stripe: "bg-danger", label: "High", bg: "from-danger/5 to-transparent" },
  3: { icon: AlertCircle, color: "bg-warning-muted text-warning", stripe: "bg-warning", label: "Medium", bg: "from-warning/5 to-transparent" },
  2: { icon: Info, color: "bg-info-muted text-info", stripe: "bg-info", label: "Low", bg: "from-info/5 to-transparent" },
  1: { icon: Info, color: "bg-white/5 text-slate-500", stripe: "bg-white/30", label: "Minimal", bg: "from-white/5 to-transparent" },
};

function SkeletonCard() {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="flex">
        <div className="w-1 bg-white/5" />
        <div className="flex-1 p-5 space-y-4">
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="h-3 w-32 rounded bg-white/5" />
              <div className="h-3 w-48 rounded bg-white/5" />
            </div>
            <div className="h-6 w-16 rounded-full bg-white/5" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-24 rounded bg-white/5" />
            <div className="h-6 w-20 rounded bg-white/5" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 rounded-lg bg-white/5" />
            <div className="h-9 w-20 rounded-lg bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuarantinePanel() {
  const [items, setItems] = useState<QuarantineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewedItems, setReviewedItems] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/quarantine/review");
      const data = await res.json();
      const allItems = data.items ?? [];
      // Filter out items that have been reviewed in this session
      setItems(allItems.filter((item: QuarantineItem) => !reviewedItems.has(item.id)));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(
    quarantineId: string,
    decision: "APPROVED" | "REJECTED"
  ) {
    setReviewingId(quarantineId);
    try {
      await fetch("/api/quarantine/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quarantine_id: quarantineId,
          decision,
          reviewer_id: "dashboard-user",
        }),
      });
      // Remove from list and track in session
      setReviewedItems((prev) => new Set(prev).add(quarantineId));
      setItems((prev) => prev.filter((item) => item.id !== quarantineId));
      setSuccessMessage(decision === "APPROVED" ? "Item released successfully" : "Item rejected and blocked");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Review failed:", err);
    } finally {
      setReviewingId(null);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Quarantine Queue</h2>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Quarantine Queue</h2>
          {items.length > 0 && (
            <span className="badge bg-warning-muted text-warning">
              {items.length} pending
            </span>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-ghost text-xs px-3 py-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Success notification */}
      {successMessage && (
        <div className="glass-card p-3 border-l-2 border-success animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span className="text-sm text-success">{successMessage}</span>
        </div>
      )}

      {/* Reviewed count */}
      {reviewedItems.size > 0 && (
        <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          {reviewedItems.size} item{reviewedItems.size !== 1 ? "s" : ""} reviewed this session
        </div>
      )}

      {items.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-success-muted flex items-center justify-center mb-4 relative">
            <ShieldCheck className="w-8 h-8 text-success" />
            <div className="absolute inset-0 rounded-full bg-success/10 animate-ping" style={{ animationDuration: "3s" }} />
          </div>
          <p className="text-slate-600 font-medium text-lg">All Clear</p>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-xs">
            No items pending review. Your AI pipeline is clean and protected.
          </p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {items.map((item) => {
            const priority = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG[2];
            const PriorityIcon = priority.icon;
            const isReviewing = reviewingId === item.id;

            return (
              <div
                key={item.id}
                className="glass-card overflow-hidden group hover:border-white/10 transition-all"
              >
                <div className="flex">
                  {/* Severity stripe */}
                  <div className={`w-1.5 ${priority.stripe} flex-shrink-0`} />

                  <div className="flex-1 p-5 relative">
                    <div className={`absolute inset-0 bg-gradient-to-r ${priority.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <div className="relative z-10">
                      {/* Header row */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            {item.compliance_events?.user_id ?? "unknown"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" />
                            {item.compliance_events?.destination_provider ?? "unknown"}
                          </span>
                        </div>
                        <span className={`badge ${priority.color} flex items-center gap-1.5 flex-shrink-0`}>
                          <PriorityIcon className="w-3 h-3" />
                          {priority.label}
                        </span>
                      </div>

                      {/* Entities */}
                      <div className="mb-4">
                        <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                          Detected Entities
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.detected_entities.map((entity, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg hover:border-white/10 transition-colors"
                            >
                              <span className="font-mono text-slate-600 dark:text-slate-400">{entity.type}</span>
                              <span className="text-slate-500">|</span>
                              <span>{entity.value_redacted}</span>
                              <span className="text-slate-600 dark:text-slate-400 font-mono">
                                {Math.round(entity.confidence * 100)}%
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(item.id, "APPROVED")}
                          disabled={isReviewing}
                          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-success/30 text-success hover:bg-success-muted disabled:opacity-50 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isReviewing ? "Processing..." : "Release"}
                        </button>
                        <button
                          onClick={() => handleReview(item.id, "REJECTED")}
                          disabled={isReviewing}
                          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-danger/30 text-danger hover:bg-danger-muted disabled:opacity-50 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {isReviewing ? "..." : "Reject"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
