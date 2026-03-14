"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Building2,
  Shield,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";
import SPRSGauge from "@/components/dashboard/SPRSGauge";
import { ALL_CONTROLS } from "@/lib/shieldready/controls";
import { CONTROL_FAMILIES } from "@/lib/shieldready/controls/families";
import {
  calculateSPRS,
  calculateFamilyBreakdown,
  getRemediationPriorities,
  getCompletionPercent,
} from "@/lib/shieldready/scoring";
import { getAssessmentResponses, getOrganization } from "@/lib/shieldready/storage";
import type { AssessmentResponse, ControlFamily } from "@/lib/shieldready/types";

export default function ReportsPage() {
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setResponses(getAssessmentResponses());
  }, []);

  const org = useMemo(() => {
    if (typeof window === "undefined") return null;
    return getOrganization();
  }, []);

  const sprs = useMemo(() => calculateSPRS(ALL_CONTROLS, responses), [responses]);
  const breakdown = useMemo(() => calculateFamilyBreakdown(ALL_CONTROLS, responses), [responses]);
  const priorities = useMemo(() => getRemediationPriorities(ALL_CONTROLS, responses), [responses]);
  const completionPercent = useMemo(() => getCompletionPercent(ALL_CONTROLS.length, responses), [responses]);

  const responseMap = useMemo(() => new Map(responses.map((r) => [r.controlId, r])), [responses]);

  // Status counts
  const statusCounts = useMemo(() => {
    let met = 0, partial = 0, unmet = 0, notAssessed = 0;
    for (const c of ALL_CONTROLS) {
      const status = responseMap.get(c.id)?.status ?? "NOT_ASSESSED";
      if (status === "MET") met++;
      else if (status === "PARTIAL") partial++;
      else if (status === "UNMET") unmet++;
      else notAssessed++;
    }
    return { met, partial, unmet, notAssessed };
  }, [responseMap]);

  const handlePrint = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Assessment Report</h1>
          <p className="text-slate-600 dark:text-slate-400">
            SPRS self-assessment summary for {org?.name ?? "your organization"}.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 text-sm transition-colors"
          >
            <Printer size={16} />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="space-y-6 print:space-y-4">
        {/* Title Block */}
        <div className="bg-slate-50/70 backdrop-blur-xl border border-slate-200 dark:border-slate-200 dark:border-slate-700/50 rounded-2xl p-8 print:border-slate-300 print:bg-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 print:text-black mb-1">
                SPRS Self-Assessment Report
              </h2>
              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 print:text-slate-600 mt-2">
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} />
                  {org?.name ?? "Organization not set"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {today}
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield size={14} />
                  CMMC Level {org?.cmmcLevel ?? 2}
                </span>
              </div>
            </div>
            <SPRSGauge score={sprs.total} size="sm" animate={false} />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-50/70 border border-slate-200 dark:border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 print:border-slate-300">
            <div className="text-xs text-slate-500 mb-1">SPRS Score</div>
            <div className="text-3xl font-bold text-slate-900 print:text-black">{sprs.total}</div>
            <div className="text-xs text-slate-500 mt-1">of 110 maximum</div>
          </div>
          <div className="bg-slate-50/70 border border-slate-200 dark:border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 print:border-slate-300">
            <div className="text-xs text-slate-500 mb-1">Completion</div>
            <div className="text-3xl font-bold text-slate-900 print:text-black">{completionPercent}%</div>
            <div className="text-xs text-slate-500 mt-1">{responses.length} of {ALL_CONTROLS.length}</div>
          </div>
          <div className="bg-slate-50/70 border border-emerald-500/20 rounded-2xl p-5 print:border-slate-300">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-1">
              <CheckCircle2 size={12} />
              Controls Met
            </div>
            <div className="text-3xl font-bold text-emerald-400 print:text-emerald-600">{statusCounts.met}</div>
          </div>
          <div className="bg-slate-50/70 border border-red-500/20 rounded-2xl p-5 print:border-slate-300">
            <div className="flex items-center gap-1.5 text-xs text-red-400 mb-1">
              <XCircle size={12} />
              Gaps Found
            </div>
            <div className="text-3xl font-bold text-red-400 print:text-red-600">
              {statusCounts.unmet + statusCounts.partial}
            </div>
          </div>
        </div>

        {/* Family Breakdown Table */}
        <div className="bg-slate-50/70 border border-slate-200 dark:border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden print:border-slate-300">
          <div className="p-5 border-b border-slate-200 dark:border-slate-200 dark:border-slate-700/50 print:border-slate-300">
            <h3 className="text-lg font-bold text-slate-900 print:text-black flex items-center gap-2">
              <BarChart3 size={18} />
              Control Family Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-200 dark:border-slate-700/50 print:border-slate-300">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase px-5 py-3">Family</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase px-3 py-3">Controls</th>
                  <th className="text-center text-xs font-semibold text-emerald-500 uppercase px-3 py-3">Met</th>
                  <th className="text-center text-xs font-semibold text-amber-500 uppercase px-3 py-3">Partial</th>
                  <th className="text-center text-xs font-semibold text-red-500 uppercase px-3 py-3">Unmet</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase px-3 py-3">Score</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase px-5 py-3">Max</th>
                </tr>
              </thead>
              <tbody>
                {CONTROL_FAMILIES.map((family) => {
                  const stats = sprs.byFamily[family.code];
                  const maxForFamily = family.maxDeduction;
                  return (
                    <tr
                      key={family.code}
                      className="border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/50 print:border-slate-200 hover:bg-slate-100/30 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="text-slate-900 print:text-black font-medium">{family.code}</div>
                        <div className="text-xs text-slate-500">{family.name}</div>
                      </td>
                      <td className="text-center text-slate-700 dark:text-slate-300 print:text-black px-3 py-3">{family.controlCount}</td>
                      <td className="text-center text-emerald-400 print:text-emerald-600 font-medium px-3 py-3">{stats?.met ?? 0}</td>
                      <td className="text-center text-amber-400 print:text-amber-600 font-medium px-3 py-3">{stats?.partial ?? 0}</td>
                      <td className="text-center text-red-400 print:text-red-600 font-medium px-3 py-3">{stats?.unmet ?? 0}</td>
                      <td className="text-center text-slate-900 print:text-black font-bold px-3 py-3">{stats?.score ?? 0}</td>
                      <td className="text-right text-slate-500 px-5 py-3">{-maxForFamily}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-600 print:border-slate-400">
                  <td className="px-5 py-3 font-bold text-slate-900 print:text-black">TOTAL</td>
                  <td className="text-center font-bold text-slate-900 print:text-black px-3 py-3">{ALL_CONTROLS.length}</td>
                  <td className="text-center font-bold text-emerald-400 px-3 py-3">{statusCounts.met}</td>
                  <td className="text-center font-bold text-amber-400 px-3 py-3">{statusCounts.partial}</td>
                  <td className="text-center font-bold text-red-400 px-3 py-3">{statusCounts.unmet}</td>
                  <td className="text-center font-bold text-slate-900 print:text-black text-lg px-3 py-3">{sprs.total}</td>
                  <td className="text-right font-bold text-slate-600 dark:text-slate-400 px-5 py-3">-203</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Top Remediation Priorities */}
        {priorities.length > 0 && (
          <div className="bg-slate-50/70 border border-slate-200 dark:border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden print:border-slate-300">
            <div className="p-5 border-b border-slate-200 dark:border-slate-200 dark:border-slate-700/50 print:border-slate-300">
              <h3 className="text-lg font-bold text-slate-900 print:text-black flex items-center gap-2">
                <AlertTriangle size={18} />
                Top 10 Remediation Priorities
              </h3>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800/50 print:divide-slate-200">
              {priorities.slice(0, 10).map((item, i) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="text-slate-500 font-mono text-xs w-5">{i + 1}</span>
                  <span className="text-blue-400 text-xs font-bold">{item.id}</span>
                  <span className="text-slate-900 print:text-black text-sm flex-1">{item.title}</span>
                  <span className="text-red-400 text-xs font-bold">{item.sprsDeduction}pts</span>
                  <span className="text-slate-500 text-xs flex items-center gap-1">
                    <Clock size={12} />{item.estimatedHours}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-slate-100/30 border border-slate-200 dark:border-slate-700/30 rounded-xl p-4 text-xs text-slate-500 print:border-slate-300 print:text-slate-600">
          <p className="font-medium mb-1">Disclaimer</p>
          <p>
            This report is generated by ShieldReady for internal planning purposes only.
            It does not constitute an official CMMC assessment or DoD certification.
            For official SPRS scores, submit via the SPRS portal (https://www.sprs.csd.disa.mil/).
            Consult with a C3PAO for formal CMMC certification.
          </p>
        </div>
      </div>
    </div>
  );
}
