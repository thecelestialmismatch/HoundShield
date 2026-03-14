"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  Clock,
  DollarSign,
  TrendingUp,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import SPRSGauge from "@/components/dashboard/SPRSGauge";
import { ALL_CONTROLS } from "@/lib/shieldready/controls";
import {
  calculateSPRS,
  getRemediationPriorities,
  estimateTimeToTarget,
} from "@/lib/shieldready/scoring";
import { getAssessmentResponses, getOrganization } from "@/lib/shieldready/storage";
import type { AssessmentResponse, NISTControl, RiskPriority } from "@/lib/shieldready/types";

const PRIORITY_COLORS: Record<RiskPriority, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
  HIGH: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  MEDIUM: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  LOW: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", border: "border-slate-500/30" },
};

export default function GapsPage() {
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [expandedControl, setExpandedControl] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"impact" | "hours" | "priority">("impact");

  useEffect(() => {
    setResponses(getAssessmentResponses());
  }, []);

  const org = useMemo(() => {
    if (typeof window === "undefined") return null;
    return getOrganization();
  }, []);

  const sprs = useMemo(() => calculateSPRS(ALL_CONTROLS, responses), [responses]);

  const priorities = useMemo(
    () => getRemediationPriorities(ALL_CONTROLS, responses),
    [responses],
  );

  const timeEstimate = useMemo(
    () => estimateTimeToTarget(ALL_CONTROLS, responses, 110),
    [responses],
  );

  // Gaps = controls that are UNMET or PARTIAL
  const gaps = useMemo(() => {
    const responseMap = new Map(responses.map((r) => [r.controlId, r]));
    return ALL_CONTROLS.filter((c) => {
      const status = responseMap.get(c.id)?.status ?? "NOT_ASSESSED";
      return status === "UNMET" || status === "PARTIAL" || status === "NOT_ASSESSED";
    }).sort((a, b) => {
      if (sortBy === "impact") return a.sprsDeduction - b.sprsDeduction; // most negative first
      if (sortBy === "hours") return a.estimatedHours - b.estimatedHours; // quickest first
      // priority order
      const order: Record<RiskPriority, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return order[a.riskPriority] - order[b.riskPriority];
    });
  }, [responses, sortBy]);

  // Stats
  const totalGaps = gaps.length;
  const criticalCount = gaps.filter((g) => g.riskPriority === "CRITICAL").length;
  const highCount = gaps.filter((g) => g.riskPriority === "HIGH").length;
  const totalHours = gaps.reduce((sum, g) => sum + g.estimatedHours, 0);
  const potentialPoints = Math.abs(gaps.reduce((sum, g) => sum + g.sprsDeduction, 0));

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Gap Analysis</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Prioritized remediation roadmap based on SPRS impact and risk priority.
        </p>
      </div>

      {/* Score + Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
        {/* SPRS Gauge */}
        <div className="lg:col-span-1 bg-slate-50/70 backdrop-blur-xl border border-slate-200 dark:border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 flex items-center justify-center">
          <SPRSGauge score={sprs.total} size="sm" />
        </div>

        {/* Stat cards */}
        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-50/70 backdrop-blur-xl border border-slate-200 dark:border-slate-200 dark:border-slate-700/50 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs mb-2">
              <AlertTriangle size={14} />
              Open Gaps
            </div>
            <div className="text-3xl font-bold text-slate-900">{totalGaps}</div>
            <div className="text-xs text-slate-500 mt-1">of {ALL_CONTROLS.length} controls</div>
          </div>

          <div className="bg-slate-50/70 backdrop-blur-xl border border-red-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-red-400 text-xs mb-2">
              <Shield size={14} />
              Critical + High
            </div>
            <div className="text-3xl font-bold text-red-400">{criticalCount + highCount}</div>
            <div className="text-xs text-slate-500 mt-1">
              {criticalCount} critical, {highCount} high
            </div>
          </div>

          <div className="bg-slate-50/70 backdrop-blur-xl border border-slate-200 dark:border-slate-200 dark:border-slate-700/50 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs mb-2">
              <Clock size={14} />
              Est. Hours
            </div>
            <div className="text-3xl font-bold text-slate-900">{totalHours}</div>
            <div className="text-xs text-slate-500 mt-1">to full remediation</div>
          </div>

          <div className="bg-slate-50/70 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-emerald-400 text-xs mb-2">
              <TrendingUp size={14} />
              Recoverable Points
            </div>
            <div className="text-3xl font-bold text-emerald-400">+{potentialPoints}</div>
            <div className="text-xs text-slate-500 mt-1">
              potential SPRS improvement
            </div>
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xs text-slate-500 font-medium">Sort by:</span>
        {[
          { key: "impact" as const, label: "SPRS Impact" },
          { key: "priority" as const, label: "Risk Priority" },
          { key: "hours" as const, label: "Quickest Fix" },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sortBy === opt.key
                ? "bg-blue-500/20 border border-blue-500/30 text-blue-400"
                : "bg-slate-100/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Gaps Table */}
      <div className="space-y-3">
        {gaps.map((control, i) => {
          const colors = PRIORITY_COLORS[control.riskPriority];
          const isExpanded = expandedControl === control.id;
          const responseForControl = responses.find((r) => r.controlId === control.id);
          const currentStatus = responseForControl?.status ?? "NOT_ASSESSED";

          return (
            <motion.div
              key={control.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="bg-slate-50/70 backdrop-blur-xl border border-slate-200 dark:border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedControl(isExpanded ? null : control.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-100/30 transition-colors"
              >
                <span className="text-slate-500 font-mono text-xs w-6">{i + 1}</span>

                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${colors.bg} ${colors.text} border ${colors.border}`}>
                  {control.riskPriority}
                </span>

                <span className="text-blue-400 text-xs font-bold shrink-0">{control.id}</span>

                <span className="text-slate-900 text-sm font-medium flex-1 truncate">
                  {control.title}
                </span>

                <span className="text-red-400 font-bold text-sm shrink-0">
                  {control.sprsDeduction}pts
                </span>

                <span className="text-slate-500 text-xs shrink-0">{control.estimatedHours}h</span>

                <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${
                  currentStatus === "PARTIAL" ? "bg-amber-500/10 text-amber-400" :
                  currentStatus === "UNMET" ? "bg-red-500/10 text-red-400" :
                  "bg-slate-500/10 text-slate-600 dark:text-slate-400"
                }`}>
                  {currentStatus === "NOT_ASSESSED" ? "OPEN" : currentStatus}
                </span>

                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                  <ChevronDown size={16} className="text-slate-500" />
                </motion.div>
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-200 dark:border-slate-700/30 px-5 pb-5 pt-4"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">What to do</h4>
                      <p className="text-slate-700 dark:text-slate-300 text-sm mb-4">{control.plainEnglish}</p>

                      {control.remediationSteps.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Fix Steps</h4>
                          <ol className="space-y-1.5">
                            {control.remediationSteps.map((step, j) => (
                              <li key={j} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <span className="text-blue-400 font-bold shrink-0">{j + 1}.</span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {control.affordableTools.length > 0 && (
                        <div>
                          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase mb-2">
                            <DollarSign size={12} /> Budget-Friendly Tools
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {control.affordableTools.map((tool, j) => (
                              <span key={j} className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300">
                                {tool}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {control.evidenceRequired.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Evidence Needed</h4>
                          <ul className="space-y-1">
                            {control.evidenceRequired.map((ev, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <span className="text-emerald-400 mt-0.5">•</span>{ev}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {gaps.length === 0 && (
          <div className="text-center py-20">
            <Shield size={48} className="mx-auto mb-4 text-emerald-400" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">All clear!</h3>
            <p className="text-slate-600 dark:text-slate-400">
              No gaps found. All controls are marked as Met.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
