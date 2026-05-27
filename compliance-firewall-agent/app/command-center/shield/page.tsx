"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  ArrowRight,
  AlertTriangle,
  Clock,
  FileText,
  Crosshair,
  BookOpen,
  Zap,
  TrendingUp,
} from "lucide-react";
import SPRSDashboardWidget from "@/components/dashboard/SPRSDashboardWidget";
import { ALL_CONTROLS } from "@/lib/shieldready/controls";
import { getRemediationPriorities } from "@/lib/shieldready/scoring";
import { getAssessmentResponses, getOrganization } from "@/lib/shieldready/storage";
import type { AssessmentResponse } from "@/lib/shieldready/types";

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
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);

  useEffect(() => {
    setResponses(getAssessmentResponses());
  }, []);

  const org = useMemo(() => {
    if (typeof window === "undefined") return null;
    return getOrganization();
  }, []);

  const priorities = useMemo(() => getRemediationPriorities(ALL_CONTROLS, responses), [responses]);

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
      <SPRSDashboardWidget variant="full" />

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

      {/* HoundShield SPRS protection card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-brand-500/10 to-emerald-500/10 border border-brand-500/20 rounded-2xl p-6 mb-6"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-brand-400" />
              <span className="text-sm font-semibold text-brand-400">HoundShield Gateway Active</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Protects up to <span className="text-brand-400">+22 SPRS points</span>
            </h3>
            <p className="text-slate-400 text-sm max-w-xl">
              HoundShield&apos;s AI prompt scanner directly enforces 6 NIST 800-171 Rev 2 controls — blocking CUI/PHI/credential exfiltration before it reaches any AI model.
            </p>
          </div>
          <Link
            href="/command-center/shield/coverage"
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 text-brand-300 text-sm font-medium transition-colors"
          >
            View coverage map <ArrowRight size={14} />
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { id: "3.1.3", label: "CUI flow control", pts: 5 },
            { id: "3.1.22", label: "CUI on public systems", pts: 3 },
            { id: "3.3.1", label: "Audit logging", pts: 3 },
            { id: "3.3.2", label: "User traceability", pts: 3 },
            { id: "3.13.1", label: "Boundary protection", pts: 1 },
            { id: "3.12.3", label: "Control monitoring", pts: 3 },
          ].map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs font-mono"
            >
              <span className="text-brand-400">{c.id}</span>
              <span className="text-white/50">{c.label}</span>
              <span className="text-emerald-400 font-bold">+{c.pts}pts</span>
            </span>
          ))}
        </div>
      </motion.div>

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
