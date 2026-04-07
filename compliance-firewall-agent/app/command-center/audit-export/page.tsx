"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Calendar,
  Filter,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Info,
} from "lucide-react";

type ExportFormat = "csv" | "json";
type RiskLevel = "ALL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type ActionTaken = "ALL" | "ALLOW" | "BLOCK" | "QUARANTINE";

const PRESETS = [
  { label: "Last 24 hours", days: 1 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export default function AuditExportPage() {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("ALL");
  const [actionTaken, setActionTaken] = useState<ActionTaken>("ALL");
  const [fromDate, setFromDate] = useState(isoDate(30));
  const [toDate, setToDate] = useState(isoDate(0));
  const [limit, setLimit] = useState(10000);
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<{
    format: string;
    rows: number;
    chainValid: boolean;
    timestamp: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (days: number) => {
    setFromDate(isoDate(days));
    setToDate(isoDate(0));
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const params = new URLSearchParams({ format, limit: String(limit) });
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (riskLevel !== "ALL") params.set("risk_level", riskLevel);
      if (actionTaken !== "ALL") params.set("action_taken", actionTaken);

      const res = await fetch(`/api/audit/export?${params.toString()}`);

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? `Export failed (${res.status})`);
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get("content-disposition") ?? "";
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
      const filename =
        filenameMatch?.[1] ??
        `kaelus-audit-${new Date().toISOString().slice(0, 10)}.${format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      const rowCount = parseInt(res.headers.get("x-row-count") ?? "0", 10);
      const chainValid = res.headers.get("x-chain-valid") === "true";

      setLastExport({
        format: format.toUpperCase(),
        rows: rowCount || 0,
        chainValid,
        timestamp: new Date().toLocaleString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">
            Export Audit Log
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Download tamper-proof compliance records for SOC 2, HIPAA, and CMMC
            audits. Every export includes a hash chain integrity report.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
          <Shield className="w-3.5 h-3.5" />
          SHA-256 Verified
        </div>
      </div>

      {/* Format selector */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <FileJson className="w-4 h-4 text-brand-400" />
          Export Format
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {(["csv", "json"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
                format === f
                  ? "border-brand-500/50 bg-brand-500/10 text-white"
                  : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/10 hover:text-slate-300"
              }`}
            >
              {f === "csv" ? (
                <FileSpreadsheet
                  className={`w-8 h-8 ${format === f ? "text-brand-400" : "text-slate-500"}`}
                />
              ) : (
                <FileJson
                  className={`w-8 h-8 ${format === f ? "text-brand-400" : "text-slate-500"}`}
                />
              )}
              <div>
                <div className="font-semibold text-sm uppercase tracking-wide">
                  {f}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {f === "csv"
                    ? "Excel, Google Sheets compatible"
                    : "Structured, machine-readable"}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Date range */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-400" />
          Date Range
        </h2>

        <div className="flex gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              onClick={() => applyPreset(p.days)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/[0.06] bg-white/[0.03] text-slate-400 hover:border-white/10 hover:text-slate-200 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "From", value: fromDate, setter: setFromDate },
            { label: "To", value: toDate, setter: setToDate },
          ].map(({ label, value, setter }) => (
            <div key={label} className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                {label}
              </label>
              <input
                type="date"
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 focus:bg-brand-500/5 transition-colors"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-400" />
          Filters
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Risk Level
            </label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
              className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 transition-colors appearance-none cursor-pointer"
            >
              {(["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((r) => (
                <option key={r} value={r} className="bg-[#0d0d14]">
                  {r === "ALL" ? "All Levels" : r}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Action Taken
            </label>
            <select
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value as ActionTaken)}
              className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 transition-colors appearance-none cursor-pointer"
            >
              {(["ALL", "ALLOW", "BLOCK", "QUARANTINE"] as const).map((a) => (
                <option key={a} value={a} className="bg-[#0d0d14]">
                  {a === "ALL" ? "All Actions" : a}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Max Rows
            </label>
            <span className="text-xs font-mono text-brand-400">
              {limit.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={10000}
            step={100}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full accent-brand-500"
          />
          <div className="flex justify-between text-[10px] text-slate-600">
            <span>100</span>
            <span>10,000</span>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="flex gap-3 rounded-xl border border-brand-500/20 bg-brand-500/5 p-4">
        <Info className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
        <div className="text-[12px] text-slate-400 leading-relaxed">
          Exports include a{" "}
          <span className="text-white font-medium">hash chain integrity report</span>{" "}
          in the final column. Each row is linked via SHA-256 to the previous,
          creating a tamper-evident audit trail. Present this to auditors
          alongside your SPRS score report for CMMC Level 2 compliance evidence.
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400"
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Last export result */}
      {lastExport && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <div className="text-emerald-400 font-medium">Export complete</div>
            <div className="text-slate-400 text-xs space-y-0.5">
              <div>
                Format: <span className="text-white">{lastExport.format}</span>
                {" · "}
                Rows:{" "}
                <span className="text-white">
                  {lastExport.rows.toLocaleString()}
                </span>
                {" · "}
                Hash chain:{" "}
                <span
                  className={
                    lastExport.chainValid ? "text-emerald-400" : "text-rose-400"
                  }
                >
                  {lastExport.chainValid ? "✓ Valid" : "⚠ Integrity issue detected"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-600">
                <Clock className="w-3 h-3" />
                {lastExport.timestamp}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 shadow-lg shadow-brand-500/20"
      >
        {isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating export...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Export{" "}
            {riskLevel !== "ALL" ? `${riskLevel} ` : ""}
            {actionTaken !== "ALL" ? `${actionTaken} ` : ""}
            Events as {format.toUpperCase()}
          </>
        )}
      </button>

      <p className="text-center text-[11px] text-slate-600">
        Audit logs are retained per your Supabase project settings. For CMMC
        Level 2, DoD requires minimum 3-year retention of CUI access logs (NIST
        SP 800-171 3.3.1).
      </p>
    </div>
  );
}
