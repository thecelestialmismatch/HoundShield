"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  ArrowRight,
  Target,
} from "lucide-react";
import SPRSGauge from "@/components/dashboard/SPRSGauge";
import { ALL_CONTROLS } from "@/lib/shieldready/controls";
import { CONTROL_FAMILIES } from "@/lib/shieldready/controls/families";
import {
  calculateSPRS,
  getCompletionPercent,
  getRemediationPriorities,
  estimateTimeToTarget,
} from "@/lib/shieldready/scoring";
import { getAssessmentResponses } from "@/lib/shieldready/storage";
import type { AssessmentResponse } from "@/lib/shieldready/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const DOD_THRESHOLD = 70;
const HOUNDSHIELD_IMPACT = 18;
const HOUNDSHIELD_CONTROLS = ["AC.L2-3.1.3", "AU.L2-3.3.1", "SI.L2-3.14.1"] as const;

function scoreToProgress(score: number): number {
  return Math.min(100, Math.max(0, ((score + 203) / 313) * 100));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SPRSDashboardWidgetProps {
  variant?: "compact" | "full";
  className?: string;
}

// ─── Family chart tooltip ─────────────────────────────────────────────────────

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
  label?: string;
}

function FamilyTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-white font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-slate-300">
          {p.name}:{" "}
          <span className="text-white font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SPRSDashboardWidget({
  variant = "compact",
  className,
}: SPRSDashboardWidgetProps) {
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);

  useEffect(() => {
    setResponses(getAssessmentResponses());
  }, []);

  const sprs = useMemo(() => calculateSPRS(ALL_CONTROLS, responses), [responses]);
  const completion = useMemo(
    () => getCompletionPercent(ALL_CONTROLS.length, responses),
    [responses],
  );
  const timeEstimate = useMemo(
    () => estimateTimeToTarget(ALL_CONTROLS, responses, DOD_THRESHOLD),
    [responses],
  );

  const hasStarted = responses.length > 0;

  const statusDetails = useMemo(() => {
    const responseMap = new Map(responses.map((r) => [r.controlId, r]));
    let explicitUnmet = 0;
    let notAssessed = 0;
    for (const c of ALL_CONTROLS) {
      const s = responseMap.get(c.id)?.status ?? "NOT_ASSESSED";
      if (s === "UNMET") explicitUnmet++;
      else if (s === "NOT_ASSESSED") notAssessed++;
    }
    return { explicitUnmet, notAssessed };
  }, [responses]);

  const familyChartData = useMemo(
    () =>
      CONTROL_FAMILIES.map((f) => {
        const fb = sprs.byFamily[f.code];
        const retained = Math.max(0, f.maxDeduction + fb.score);
        const lost = f.maxDeduction - retained;
        return { name: f.code, fullName: f.name, retained, lost };
      }),
    [sprs],
  );

  const dodProgress = scoreToProgress(sprs.total);
  const dodThresholdProgress = scoreToProgress(DOD_THRESHOLD);
  const atOrAboveDod = sprs.total >= DOD_THRESHOLD;

  // ── compact variant ─────────────────────────────────────────────────────────

  if (variant === "compact") {
    return (
      <div className={`glass-card p-5 text-center${className ? ` ${className}` : ""}`}>
        <h3 className="font-display font-bold text-base text-white mb-4">
          SPRS Score
        </h3>

        <SPRSGauge score={sprs.total} size="md" />

        {/* DoD threshold row */}
        <div className="mt-4 flex items-center justify-between px-1 mb-1">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Target size={11} /> DoD Threshold
          </span>
          <span
            className={`text-xs font-semibold ${
              atOrAboveDod ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {atOrAboveDod
              ? "Met ✓"
              : `${timeEstimate.controlsToFix} controls needed`}
          </span>
        </div>

        {/* Progress bar with threshold marker */}
        <div className="relative w-full bg-slate-700 rounded-full h-1.5 overflow-hidden mb-4">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full"
            animate={{ width: `${dodProgress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80"
            style={{ left: `${dodThresholdProgress}%` }}
          />
        </div>

        {/* Control counts */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="font-display font-bold text-lg text-emerald-600">
              {sprs.metCount}
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Met</p>
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-lg text-amber-500">
              {sprs.partialCount}
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Partial</p>
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-lg text-rose-500">
              {sprs.unmetCount}
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Unmet</p>
          </div>
        </div>

        {/* HoundShield impact callout */}
        <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
          <p className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider mb-0.5">
            HoundShield Impact
          </p>
          <p className="text-xs text-emerald-300">
            <span className="font-bold">+{HOUNDSHIELD_IMPACT} pts</span> protected
            {" — "}{HOUNDSHIELD_CONTROLS.join(", ")}
          </p>
          <p className="text-[10px] text-emerald-500/70 mt-0.5">
            CUI flow control · audit logging · flaw remediation
          </p>
        </div>

        <Link
          href="/command-center/shield"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
        >
          View Full Assessment <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  // ── full variant ─────────────────────────────────────────────────────────────

  if (!hasStarted) return null;

  return (
    <>
      {/* Score + Stats grid */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-6 gap-4 mb-4${
          className ? ` ${className}` : ""
        }`}
      >
        {/* Gauge */}
        <div className="lg:col-span-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 flex items-center justify-center">
          <SPRSGauge score={sprs.total} size="md" />
        </div>

        {/* Stats */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <BarChart3 size={14} /> Completion
            </div>
            <div className="text-3xl font-bold text-white">{completion}%</div>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full"
                animate={{ width: `${completion}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/[0.03] border border-emerald-500/20 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 text-emerald-400 text-xs mb-2">
              <CheckCircle2 size={14} /> Controls Met
            </div>
            <div className="text-3xl font-bold text-emerald-400">{sprs.metCount}</div>
            <div className="text-xs text-slate-500 mt-1">of {ALL_CONTROLS.length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/[0.03] border border-amber-500/20 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 text-amber-400 text-xs mb-2">
              <AlertTriangle size={14} /> Partial
            </div>
            <div className="text-3xl font-bold text-amber-400">{sprs.partialCount}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white/[0.03] border border-red-500/20 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 text-red-400 text-xs mb-2">
              <XCircle size={14} /> Gaps
            </div>
            <div className="text-3xl font-bold text-red-400">{sprs.unmetCount}</div>
            <div className="text-xs text-slate-500 mt-1">
              {statusDetails.explicitUnmet} unmet, {statusDetails.notAssessed} not assessed
            </div>
          </motion.div>
        </div>
      </div>

      {/* DoD threshold strip */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-4 flex items-center gap-4">
        <Target
          size={16}
          className={atOrAboveDod ? "text-emerald-400" : "text-amber-400"}
        />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400">DoD SPRS Threshold (≥70 pts)</span>
            <span
              className={`text-xs font-semibold ${
                atOrAboveDod ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {sprs.total} / {DOD_THRESHOLD}
              {atOrAboveDod
                ? " — Threshold met ✓"
                : ` — ${timeEstimate.controlsToFix} controls to reach threshold`}
            </span>
          </div>
          <div className="relative w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full"
              animate={{ width: `${dodProgress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80"
              style={{ left: `${dodThresholdProgress}%` }}
            />
          </div>
        </div>
        {!atOrAboveDod && timeEstimate.quickWins.length > 0 && (
          <div className="text-right shrink-0">
            <p className="text-xs text-emerald-400 font-semibold">
              {timeEstimate.quickWins.length} quick wins
            </p>
            <p className="text-[10px] text-slate-500">≤8h each</p>
          </div>
        )}
      </div>

      {/* Family breakdown chart */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8">
        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 size={14} className="text-brand-400" />
          Score by Control Family
        </h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={familyChartData} barGap={2} barCategoryGap="20%">
              <XAxis
                dataKey="name"
                stroke="#475569"
                fontSize={10}
                tick={{ fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <RechartsTooltip
                content={<FamilyTooltip />}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar dataKey="retained" name="Retained" stackId="a" radius={[0, 0, 0, 0]}>
                {familyChartData.map((_, i) => (
                  <Cell key={i} fill="#10b981" opacity={0.7} />
                ))}
              </Bar>
              <Bar dataKey="lost" name="Lost" stackId="a" radius={[2, 2, 0, 0]}>
                {familyChartData.map((_, i) => (
                  <Cell key={i} fill="#ef4444" opacity={0.5} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-emerald-500/70 inline-block" />
            Retained pts
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-red-500/50 inline-block" />
            Lost pts
          </span>
        </div>
      </div>
    </>
  );
}
