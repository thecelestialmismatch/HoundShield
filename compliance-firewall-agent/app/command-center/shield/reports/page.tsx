"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handleDownloadPDF = useCallback(async () => {
    setPdfLoading(true);
    setPdfError(null);
    try {
      const to = new Date().toISOString();
      const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch(`/api/reports/generate?format=pdf&from=${from}&to=${to}`);

      if (res.status === 402) {
        const body = await res.json();
        setPdfError(body.error ?? "PDF reports require the Growth plan or higher.");
        return;
      }
      if (res.status === 401) {
        setPdfError("Sign in to download PDF reports.");
        return;
      }
      if (!res.ok) {
        setPdfError("Failed to generate PDF. Please try again.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kaelus-compliance-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setPdfError("Network error — could not download PDF.");
    } finally {
      setPdfLoading(false);
    }
  }, []);

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
          <h1 className="text-3xl font-bold text-white mb-2">Assessment Report</h1>
          <p className="text-slate-400">
            SPRS self-assessment summary for {org?.name ?? "your organization"}.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] rounded-xl text-slate-300 dark:text-slate-300 text-sm transition-colors"
          >
            <Printer size={16} />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl text-white text-sm font-medium transition-colors"
          >
            <Download size={16} />
            {pdfLoading ? "Generating…" : "Download PDF Report"}
          </button>
        </div>
      </div>

      {/* PDF error / upgrade nudge */}
      {pdfError && (
        <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-300">
          <span>{pdfError}</span>
          <a href="/pricing" className="text-brand-400 hover:text-brand-300 font-medium underline underline-offset-2 whitespace-nowrap">
            Upgrade →
          </a>
        </div>
      )}

      {/* Report Content */}
      <div ref={reportRef} className="space-y-6 print:space-y-4">
        {/* Title Block */}
        <div className="bg-white/[0.03]/70 backdrop-blur-xl border border-white/10 dark:border-white/10 dark:border-slate-700/50 rounded-2xl p-8 print:border-slate-300 print:bg-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white print:text-black mb-1">
                SPRS Self-Assessment Report
              </h2>
              <div className="flex items-center gap-4 text-sm text-slate-400 print:text-slate-400 mt-2">
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
          <div className="bg-white/[0.03]/70 border border-white/10 dark:border-white/10 dark:border-slate-700/50 rounded-2xl p-5 print:border-slate-300">
            <div className="text-xs text-slate-500 mb-1">SPRS Score</div>
            <div className="text-3xl font-bold text-white print:text-black">{sprs.total}</div>
            <div className="text-xs text-slate-500 mt-1">of 110 maximum</div>
          </div>
          <div className="bg-white/[0.03]/70 border border-white/10 dark:border-white/10 dark:border-slate-700/50 rounded-2xl p-5 print:border-slate-300">
            <div className="text-xs text-slate-500 mb-1">Completion</div>
            <div className="text-3xl font-bold text-white print:text-black">{completionPercent}%</div>
            <div className="text-xs text-slate-500 mt-1">{responses.length} of {ALL_CONTROLS.length}</div>
          </div>
          <div className="bg-white/[0.03]/70 border border-emerald-500/20 rounded-2xl p-5 print:border-slate-300">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-1">
              <CheckCircle2 size={12} />
              Controls Met
            </div>
            <div className="text-3xl font-bold text-emerald-400 print:text-emerald-600">{statusCounts.met}</div>
          </div>
          <div className="bg-white/[0.03]/70 border border-red-500/20 rounded-2xl p-5 print:border-slate-300">
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
        <div className="bg-white/[0.03]/70 border border-white/10 dark:border-white/10 dark:border-slate-700/50 rounded-2xl overflow-hidden print:border-slate-300">
          <div className="p-5 border-b border-white/10 dark:border-white/10 dark:border-slate-700/50 print:border-slate-300">
            <h3 className="text-lg font-bold text-white print:text-black flex items-center gap-2">
              <BarChart3 size={18} />
              Control Family Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 dark:border-white/10 dark:border-slate-700/50 print:border-slate-300">
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
                      className="border-b border-white/10 dark:border-white/10 dark:border-slate-800/50 print:border-white/10 hover:bg-white/[0.05]/30 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="text-white print:text-black font-medium">{family.code}</div>
                        <div className="text-xs text-slate-500">{family.name}</div>
                      </td>
                      <td className="text-center text-slate-300 dark:text-slate-300 print:text-black px-3 py-3">{family.controlCount}</td>
                      <td className="text-center text-emerald-400 print:text-emerald-600 font-medium px-3 py-3">{stats?.met ?? 0}</td>
                      <td className="text-center text-amber-400 print:text-amber-600 font-medium px-3 py-3">{stats?.partial ?? 0}</td>
                      <td className="text-center text-red-400 print:text-red-600 font-medium px-3 py-3">{stats?.unmet ?? 0}</td>
                      <td className="text-center text-white print:text-black font-bold px-3 py-3">{stats?.score ?? 0}</td>
                      <td className="text-right text-slate-500 px-5 py-3">{-maxForFamily}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-600 print:border-slate-400">
                  <td className="px-5 py-3 font-bold text-white print:text-black">TOTAL</td>
                  <td className="text-center font-bold text-white print:text-black px-3 py-3">{ALL_CONTROLS.length}</td>
                  <td className="text-center font-bold text-emerald-400 px-3 py-3">{statusCounts.met}</td>
                  <td className="text-center font-bold text-amber-400 px-3 py-3">{statusCounts.partial}</td>
                  <td className="text-center font-bold text-red-400 px-3 py-3">{statusCounts.unmet}</td>
                  <td className="text-center font-bold text-white print:text-black text-lg px-3 py-3">{sprs.total}</td>
                  <td className="text-right font-bold text-slate-400 px-5 py-3">-203</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Top Remediation Priorities */}
        {priorities.length > 0 && (
          <div className="bg-white/[0.03]/70 border border-white/10 dark:border-white/10 dark:border-slate-700/50 rounded-2xl overflow-hidden print:border-slate-300">
            <div className="p-5 border-b border-white/10 dark:border-white/10 dark:border-slate-700/50 print:border-slate-300">
              <h3 className="text-lg font-bold text-white print:text-black flex items-center gap-2">
                <AlertTriangle size={18} />
                Top 10 Remediation Priorities
              </h3>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800/50 print:divide-slate-200">
              {priorities.slice(0, 10).map((item, i) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="text-slate-500 font-mono text-xs w-5">{i + 1}</span>
                  <span className="text-brand-400 text-xs font-bold">{item.id}</span>
                  <span className="text-white print:text-black text-sm flex-1">{item.title}</span>
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
        <div className="bg-white/[0.05]/30 border border-white/10 dark:border-slate-700/30 rounded-xl p-4 text-xs text-slate-500 print:border-slate-300 print:text-slate-400">
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
