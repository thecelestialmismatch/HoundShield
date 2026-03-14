"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  StickyNote,
  FileCheck,
  Wrench,
  DollarSign,
  ClipboardList,
} from "lucide-react";
import type { NISTControl, ControlStatus } from "@/lib/shieldready/types";

interface ControlCardProps {
  control: NISTControl;
  status: ControlStatus;
  notes: string;
  evidenceUploaded: boolean;
  onStatusChange: (status: ControlStatus) => void;
  onNotesChange: (notes: string) => void;
  onEvidenceChange: (uploaded: boolean) => void;
}

const STATUS_CONFIG = {
  MET: { icon: CheckCircle2, color: "emerald", label: "Met" },
  PARTIAL: { icon: AlertTriangle, color: "amber", label: "Partial" },
  UNMET: { icon: XCircle, color: "red", label: "Not Met" },
  NOT_ASSESSED: { icon: ClipboardList, color: "slate", label: "Not Assessed" },
} as const;

export default function ControlCard({
  control,
  status,
  notes,
  evidenceUploaded,
  onStatusChange,
  onNotesChange,
  onEvidenceChange,
}: ControlCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const statusColor = status === "MET" ? "emerald" : status === "PARTIAL" ? "amber" : status === "UNMET" ? "red" : "slate";

  return (
    <div className="bg-slate-50 backdrop-blur-xl border border-slate-200 dark:border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden">
      {/* ── Header ── */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold bg-${statusColor}-500/20 text-${statusColor}-400 border border-${statusColor}-500/30`}>
              {control.id}
            </span>
            <span className="text-slate-500 text-xs">{control.familyName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">SPRS Impact:</span>
            <span className="text-red-400 font-bold">{control.sprsDeduction}</span>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-2">{control.title}</h3>
        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{control.assessmentQuestion}</p>
      </div>

      {/* ── Status Buttons ── */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-3 gap-2">
          {(["MET", "PARTIAL", "UNMET"] as ControlStatus[]).map((s) => {
            const config = STATUS_CONFIG[s];
            const Icon = config.icon;
            const isActive = status === s;
            const colorBase = config.color;
            return (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                  isActive
                    ? `bg-${colorBase}-500/20 border-${colorBase}-500 text-${colorBase}-400 shadow-[0_0_12px_rgba(0,0,0,0.3)]`
                    : "bg-slate-100 border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-500"
                }`}
              >
                <Icon size={16} />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Notes & Evidence ── */}
      <div className="px-6 pb-4 space-y-3">
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            <StickyNote size={12} />
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Add implementation notes, exceptions, or context..."
            rows={2}
            className="w-full bg-slate-100 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all resize-none"
          />
        </div>
        <button
          onClick={() => onEvidenceChange(!evidenceUploaded)}
          className={`flex items-center gap-2 text-sm py-2 px-3 rounded-lg transition-all ${
            evidenceUploaded
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-slate-100 text-slate-600 dark:text-slate-400 hover:text-slate-500"
          }`}
        >
          <FileCheck size={14} />
          {evidenceUploaded ? "Evidence documented" : "Mark evidence as documented"}
        </button>
      </div>

      {/* ── Expandable Details ── */}
      <div className="border-t border-slate-200 dark:border-slate-200 dark:border-slate-700/50">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between px-6 py-3 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 transition-colors"
        >
          <span>Remediation details & tools</span>
          <motion.div animate={{ rotate: showDetails ? 180 : 0 }}>
            <ChevronDown size={16} />
          </motion.div>
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 space-y-4">
                {/* Official Description */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Official Requirement</h4>
                  <p className="text-slate-700 dark:text-slate-300 text-sm">{control.officialDescription}</p>
                </div>

                {/* Remediation Steps */}
                {control.remediationSteps.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      <Wrench size={12} />
                      Remediation Steps
                    </h4>
                    <ol className="space-y-1.5">
                      {control.remediationSteps.map((step, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-500">
                          <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Affordable Tools */}
                {control.affordableTools.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      <DollarSign size={12} />
                      Affordable Tools
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {control.affordableTools.map((tool, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evidence Required */}
                {control.evidenceRequired.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      <ClipboardList size={12} />
                      Evidence Required
                    </h4>
                    <ul className="space-y-1">
                      {control.evidenceRequired.map((ev, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-500">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          {ev}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Metadata row */}
                <div className="flex items-center gap-4 pt-2 border-t border-slate-200 dark:border-slate-700/30 text-xs text-slate-500">
                  <span>Est. {control.estimatedHours}h to implement</span>
                  <span>•</span>
                  <span className={`font-medium ${
                    control.riskPriority === "CRITICAL" ? "text-red-400" :
                    control.riskPriority === "HIGH" ? "text-amber-400" :
                    control.riskPriority === "MEDIUM" ? "text-blue-400" : "text-slate-600 dark:text-slate-400"
                  }`}>
                    {control.riskPriority} priority
                  </span>
                  <span>•</span>
                  <span>CMMC Level {control.cmmcLevel}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
