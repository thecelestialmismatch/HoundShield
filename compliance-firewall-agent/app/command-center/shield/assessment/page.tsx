"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  RotateCcw,
  Filter,
  BarChart3,
} from "lucide-react";
import SPRSGauge from "@/components/dashboard/SPRSGauge";
import ControlCard from "@/components/dashboard/ControlCard";
import FamilySidebar from "@/components/dashboard/FamilySidebar";
import { ALL_CONTROLS, getControlsByFamily } from "@/lib/shieldready/controls";
import { CONTROL_FAMILIES } from "@/lib/shieldready/controls/families";
import { calculateSPRS, getCompletionPercent } from "@/lib/shieldready/scoring";
import {
  getAssessmentResponses,
  saveAssessmentResponse,
  getOrganization,
  logActivity,
} from "@/lib/shieldready/storage";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  AssessmentResponse,
  ControlStatus,
  ControlFamily,
} from "@/lib/shieldready/types";

// ─── Tailwind safelist for dynamic colors (rendered at build time) ───────────
const _TW_SAFELIST = [
  "bg-emerald-500/100/20", "text-emerald-400", "border-emerald-500", "border-emerald-500/30",
  "bg-amber-500/100/20", "text-amber-400", "border-amber-500", "border-amber-500/30",
  "bg-red-500/20", "text-red-400", "border-red-500", "border-red-500/30",
  "bg-white/[0.03]0/20", "text-slate-400", "border-slate-500", "border-slate-500/30",
  "shadow-[0_0_12px_rgba(0,0,0,0.3)]",
];
void _TW_SAFELIST;

type StatusFilter = ControlStatus | "ALL";

export default function AssessmentPage() {
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [activeFamily, setActiveFamily] = useState<ControlFamily | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setResponses(getAssessmentResponses());
  }, []);

  // Get org (if onboarded)
  const org = useMemo(() => {
    if (typeof window === "undefined") return null;
    return getOrganization();
  }, []);

  // Calculate SPRS score
  const sprsScore = useMemo(() => {
    return calculateSPRS(ALL_CONTROLS, responses);
  }, [responses]);

  const completionPercent = useMemo(() => {
    return getCompletionPercent(ALL_CONTROLS.length, responses);
  }, [responses]);

  // Get controls to display
  const displayControls = useMemo(() => {
    let controls = activeFamily
      ? getControlsByFamily(activeFamily)
      : ALL_CONTROLS;

    if (statusFilter !== "ALL") {
      const responseMap = new Map(responses.map((r) => [r.controlId, r]));
      controls = controls.filter((c) => {
        const status = responseMap.get(c.id)?.status ?? "NOT_ASSESSED";
        return status === statusFilter;
      });
    }

    return controls;
  }, [activeFamily, statusFilter, responses]);

  // Response lookup
  const responseMap = useMemo(() => {
    return new Map(responses.map((r) => [r.controlId, r]));
  }, [responses]);

  // Handlers
  const handleStatusChange = useCallback(
    (controlId: string, status: ControlStatus) => {
      const existing = responseMap.get(controlId);
      const response: AssessmentResponse = {
        controlId,
        status,
        notes: existing?.notes ?? "",
        evidenceUploaded: existing?.evidenceUploaded ?? false,
        answeredAt: new Date().toISOString(),
      };
      saveAssessmentResponse(response);
      logActivity(`Set ${controlId} to ${status}`, controlId);
      setResponses(getAssessmentResponses());
    },
    [responseMap],
  );

  const handleNotesChange = useCallback(
    (controlId: string, notes: string) => {
      const existing = responseMap.get(controlId);
      const response: AssessmentResponse = {
        controlId,
        status: existing?.status ?? "NOT_ASSESSED",
        notes,
        evidenceUploaded: existing?.evidenceUploaded ?? false,
        answeredAt: new Date().toISOString(),
      };
      saveAssessmentResponse(response);
      setResponses(getAssessmentResponses());
    },
    [responseMap],
  );

  const handleEvidenceChange = useCallback(
    (controlId: string, uploaded: boolean) => {
      const existing = responseMap.get(controlId);
      const response: AssessmentResponse = {
        controlId,
        status: existing?.status ?? "NOT_ASSESSED",
        notes: existing?.notes ?? "",
        evidenceUploaded: uploaded,
        answeredAt: new Date().toISOString(),
      };
      saveAssessmentResponse(response);
      setResponses(getAssessmentResponses());
    },
    [responseMap],
  );

  // Stats bar
  const answered = responses.filter((r) => r.status !== "NOT_ASSESSED").length;
  const total = ALL_CONTROLS.length;

  const isDemo = !isSupabaseConfigured();

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ── */}
      <aside className={`w-64 shrink-0 border-r border-white/10 dark:border-white/10 dark:border-slate-700/50 bg-white/[0.03] dark:bg-slate-950/50 backdrop-blur-xl p-4 overflow-y-auto hidden lg:block`}>
        <div className="mb-6 flex justify-center">
          <SPRSGauge score={sprsScore.total} size="sm" />
        </div>

        <div className="mb-4 bg-white/[0.05]/50 rounded-xl p-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Progress</span>
            <span className="text-white font-bold">{answered}/{total}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full"
              animate={{ width: `${completionPercent}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
        </div>

        <button
          onClick={() => { setActiveFamily(null); setStatusFilter("ALL"); }}
          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium mb-2 transition-all ${
            activeFamily === null
              ? "bg-brand-500/100/10 border border-brand-500/30 text-brand-400"
              : "text-slate-400 hover:text-white hover:bg-white/[0.05]/50 border border-transparent"
          }`}
        >
          All Controls ({total})
        </button>

        <FamilySidebar
          families={CONTROL_FAMILIES}
          responses={responses}
          activeFamily={activeFamily}
          onFamilyClick={(code) => setActiveFamily(code as ControlFamily)}
        />
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Demo mode save warning */}
        {isDemo && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
            <span className="mt-0.5 text-amber-400">⚠️</span>
            <span>
              <span className="font-semibold text-amber-200">Results are not being saved.</span>{" "}
              Complete your account setup to persist assessment data across sessions.{" "}
              <a href="/command-center/settings" className="underline underline-offset-2 hover:text-amber-100 transition-colors">
                Go to Settings →
              </a>
            </span>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {activeFamily
                ? CONTROL_FAMILIES.find((f) => f.code === activeFamily)?.name ?? "Controls"
                : "All Controls"}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {displayControls.length} control{displayControls.length !== 1 ? "s" : ""} shown
              {org ? ` • ${org.name}` : ""}
            </p>
          </div>

          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="lg:hidden p-2 bg-white/[0.05] rounded-xl text-slate-300 dark:text-slate-300 hover:text-white"
          >
            <BarChart3 size={20} />
          </button>
        </div>

        {/* Mobile score bar */}
        <div className="lg:hidden mb-6 flex items-center gap-4 bg-white/[0.03]/70 backdrop-blur-xl border border-white/10 dark:border-white/10 dark:border-slate-700/50 rounded-2xl p-4">
          <SPRSGauge score={sprsScore.total} size="sm" showLabel={false} />
          <div className="flex-1">
            <div className="text-white font-bold text-lg">SPRS: {sprsScore.total}</div>
            <div className="text-slate-400 text-sm">{answered}/{total} assessed • {completionPercent}%</div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Filter size={14} className="text-slate-500" />
          {(["ALL", "MET", "PARTIAL", "UNMET", "NOT_ASSESSED"] as StatusFilter[]).map((filter) => {
            const labels: Record<StatusFilter, string> = {
              ALL: "All",
              MET: "Met",
              PARTIAL: "Partial",
              UNMET: "Not Met",
              NOT_ASSESSED: "Not Assessed",
            };
            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === filter
                    ? "bg-brand-500/100/20 border border-brand-500/30 text-brand-400"
                    : "bg-white/[0.05]/50 border border-white/10 dark:border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                {labels[filter]}
              </button>
            );
          })}
        </div>

        {/* Control Cards */}
        <div className="space-y-4">
          {displayControls.map((control) => {
            const resp = responseMap.get(control.id);
            return (
              <ControlCard
                key={control.id}
                control={control}
                status={resp?.status ?? "NOT_ASSESSED"}
                notes={resp?.notes ?? ""}
                evidenceUploaded={resp?.evidenceUploaded ?? false}
                onStatusChange={(status) => handleStatusChange(control.id, status)}
                onNotesChange={(notes) => handleNotesChange(control.id, notes)}
                onEvidenceChange={(uploaded) => handleEvidenceChange(control.id, uploaded)}
              />
            );
          })}

          {displayControls.length === 0 && (
            <div className="text-center py-20 text-slate-500">
              <Filter size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-lg">No controls match the current filter.</p>
              <button
                onClick={() => { setStatusFilter("ALL"); setActiveFamily(null); }}
                className="mt-3 text-brand-400 hover:text-brand-300 text-sm font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
