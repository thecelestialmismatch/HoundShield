"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  ArrowRight,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  FileText,
  Crosshair,
  BookOpen,
  Zap,
} from "lucide-react";
import SPRSGauge from "@/components/dashboard/SPRSGauge";
import { ALL_CONTROLS } from "@/lib/shieldready/controls";
import { CONTROL_FAMILIES } from "@/lib/shieldready/controls/families";
import {
  calculateSPRS,
  getCompletionPercent,
  getRemediationPriorities,
} from "@/lib/shieldready/scoring";
import { getAssessmentResponses, getOrganization } from "@/lib/shieldready/storage";

const NAV_CARDS = [
  {
    title: "Assessment",
    description: "Walk through all 110 NIST 800-171 controls",
    href: "/command-center/shield/assessment",
    icon: Shield,
    color: "blue",
  },
  {
    title: "Gap Analysis",
    description: "Prioritized remediation roadmap",
    href: "/command-center/shield/gaps",
    icon: Crosshair,
    color: "amber",
  },
  {
    title: "Reports",
    description: "Print-ready SPRS assessment summary",
    href: "/command-center/shield/reports",
    icon: FileText,
    color: "emerald",
  },
  {
    title: "Resources",
    description: "CMMC guides, templates, and tools",
    href: "/command-center/shield/resources",
    icon: BookOpen,
    color: "purple",
  },
];

export default function ShieldReadyDashboard() {
  const [responses, setResponses] = useState<any[]>([]);

  useEffect(() => {
    setResponses(getAssessmentResponses());
  }, []);

  const org = useMemo(() => {
    if (typeof window === "undefined") return null;
    return getOrganization();
  }, []);

  const sprs = useMemo(() => calculateSPRS(ALL_CONTROLS, responses), [responses]);
  const completion = useMemo(() => getCompletionPercent(ALL_CONTROLS.length, responses), [responses]);
  const priorities = useMemo(() => getRemediationPriorities(ALL_CONTROLS, responses), [responses]);

  const responseMap = useMemo(() => new Map(responses.map((r: any) => [r.controlId, r])), [responses]);

  const statusCounts = useMemo(() => {
    let met = 0, partial = 0, unmet = 0, open = 0;
    for (const c of ALL_CONTROLS) {
      const s = responseMap.get(c.id)?.status ?? "NOT_ASSESSED";
      if (s === "MET") met++;
      else if (s === "PARTIAL") partial++;
      else if (s === "UNMET") unmet++;
      else open++;
    }
    return { met, partial, unmet, open };
  }, [responseMap]);

  const hasStarted = responses.length > 0;

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="mb-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Hound Shield CMMC</h1>
            <p className="text-slate-400 text-sm">
              CMMC Compliance Readiness • {org?.name ?? "Get started with onboarding"}
            </p>
          </div>
        </motion.div>

        {!hasStarted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 bg-gradient-to-r from-brand-500/10 to-emerald-500/10 border border-brand-500/20 rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <Zap size={24} className="text-brand-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Welcome! Let&apos;s get started.</h3>
                <p className="text-slate-300 dark:text-slate-300 text-sm mb-4">
                  Complete your organization profile, then walk through each NIST 800-171 control
                  to calculate your SPRS score and identify gaps.
                </p>
                <Link
                  href="/command-center/shield/onboarding"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500/100 hover:bg-brand-400 rounded-xl text-white text-sm font-medium transition-colors"
                >
                  Start Onboarding <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Score + Stats */}
      {hasStarted && (
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mb-8">
          <div className="lg:col-span-2 bg-white/[0.03]/70 backdrop-blur-xl border border-white/10 dark:border-white/10 dark:border-slate-700/50 rounded-2xl p-8 flex items-center justify-center">
            <SPRSGauge score={sprs.total} size="md" />
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-3">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white/[0.03]/70 border border-white/10 dark:border-white/10 dark:border-slate-700/50 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <BarChart3 size={14} />
                Completion
              </div>
              <div className="text-3xl font-bold text-white">{completion}%</div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 mt-3 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full"
                  animate={{ width: `${completion}%` }}
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white/[0.03]/70 border border-emerald-500/20 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 text-emerald-400 text-xs mb-2">
                <CheckCircle2 size={14} />
                Controls Met
              </div>
              <div className="text-3xl font-bold text-emerald-400">{statusCounts.met}</div>
              <div className="text-xs text-slate-500 mt-1">of {ALL_CONTROLS.length}</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white/[0.03]/70 border border-amber-500/20 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 text-amber-400 text-xs mb-2">
                <AlertTriangle size={14} />
                Partial
              </div>
              <div className="text-3xl font-bold text-amber-400">{statusCounts.partial}</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-white/[0.03]/70 border border-red-500/20 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 text-red-400 text-xs mb-2">
                <XCircle size={14} />
                Gaps
              </div>
              <div className="text-3xl font-bold text-red-400">{statusCounts.unmet + statusCounts.open}</div>
              <div className="text-xs text-slate-500 mt-1">
                {statusCounts.unmet} unmet, {statusCounts.open} not assessed
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Nav Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {NAV_CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <Link
                href={card.href}
                className={`block bg-white/[0.03]/70 backdrop-blur-xl border border-white/10 dark:border-white/10 dark:border-slate-700/50 rounded-2xl p-6 group hover:border-${card.color}-500/30 hover:bg-${card.color}-500/5 transition-all`}
              >
                <Icon size={24} className={`text-${card.color}-400 mb-3`} />
                <h3 className="text-white font-semibold mb-1 group-hover:text-white">{card.title}</h3>
                <p className="text-slate-400 text-sm mb-3">{card.description}</p>
                <span className={`text-${card.color}-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all`}>
                  Open <ArrowRight size={14} />
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Top priorities (if assessment started) */}
      {hasStarted && priorities.length > 0 && (
        <div className="bg-white/[0.03]/70 backdrop-blur-xl border border-white/10 dark:border-white/10 dark:border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-white/10 dark:border-white/10 dark:border-slate-700/50">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" />
              Top Remediation Priorities
            </h3>
            <Link
              href="/command-center/shield/gaps"
              className="text-brand-400 hover:text-brand-300 text-sm font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800/50">
            {priorities.slice(0, 5).map((item, i) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.05]/30 transition-colors">
                <span className="text-slate-500 font-mono text-xs w-5">{i + 1}</span>
                <span className="text-brand-400 text-xs font-bold">{item.id}</span>
                <span className="text-white text-sm flex-1 truncate">{item.title}</span>
                <span className="text-red-400 text-xs font-bold">{item.sprsDeduction}pts</span>
                <span className="text-slate-500 text-xs flex items-center gap-1">
                  <Clock size={12} />{item.estimatedHours}h
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
