"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingDown, DollarSign, ShieldCheck, ArrowRight, Info } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type Industry = "dod" | "healthcare" | "tech";

interface IndustryConfig {
  label: string;
  description: string;
  regulation: string;
  annualBreachCost: number;
  incidentProbabilityPerUser: number;
  currency: string;
}

const INDUSTRIES: Record<Industry, IndustryConfig> = {
  dod: {
    label: "Defense Contractor (DoD)",
    description: "CMMC Level 2 required · DFARS 7012",
    regulation: "CMMC / DFARS 7012",
    annualBreachCost: 500_000,
    incidentProbabilityPerUser: 0.025,
    currency: "USD",
  },
  healthcare: {
    label: "Healthcare / HIPAA",
    description: "PHI exposure risk · OCR enforcement",
    regulation: "HIPAA / HITECH",
    annualBreachCost: 1_270_000,
    incidentProbabilityPerUser: 0.03,
    currency: "USD",
  },
  tech: {
    label: "Technology / SOC 2",
    description: "Customer data · PII / credential exposure",
    regulation: "SOC 2 / GDPR",
    annualBreachCost: 3_500_000,
    incidentProbabilityPerUser: 0.015,
    currency: "USD",
  },
};

const PLANS = [
  { name: "Free", price: 0, maxUsers: 10 },
  { name: "Pro", price: 199, maxUsers: 50 },
  { name: "Growth", price: 499, maxUsers: 200 },
  { name: "Enterprise", price: 999, maxUsers: Infinity },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function recommendedPlan(users: number) {
  return PLANS.find((p) => users <= p.maxUsers) ?? PLANS[PLANS.length - 1];
}

// ── Slider ────────────────────────────────────────────────────────────────────

function Slider({
  value,
  min,
  max,
  step,
  onChange,
  label,
  display,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  label: string;
  display: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm text-white/60">{label}</label>
        <span className="text-sm font-mono font-bold text-white">{display}</span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="w-full h-1.5 bg-white/10 rounded-full relative">
          <div
            className="absolute h-full bg-brand-400 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute w-4 h-4 rounded-full bg-brand-400 border-2 border-[#07070b] shadow-lg transition-all pointer-events-none"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function RoiCalculator() {
  const [industry, setIndustry] = useState<Industry>("dod");
  const [aiUsers, setAiUsers] = useState(25);

  const config = INDUSTRIES[industry];
  const plan = recommendedPlan(aiUsers);

  const calc = useMemo(() => {
    const annualBreachProbability = Math.min(
      aiUsers * config.incidentProbabilityPerUser,
      0.9
    );
    const annualExposure = Math.round(annualBreachProbability * config.annualBreachCost);
    const annualHoundShieldCost = plan.price * 12;
    const annualSavings = Math.round(annualExposure * 0.92); // 92% reduction
    const roi = annualHoundShieldCost > 0
      ? Math.round((annualSavings - annualHoundShieldCost) / annualHoundShieldCost * 100)
      : 0;
    const breakEvenDays =
      annualHoundShieldCost > 0 && annualSavings > 0
        ? Math.max(1, Math.round((annualHoundShieldCost / annualSavings) * 365))
        : 0;

    return { annualExposure, annualHoundShieldCost, annualSavings, roi, breakEvenDays };
  }, [industry, aiUsers, config, plan]);

  return (
    <section className="relative bg-[#07070b] py-20">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-brand-400/20 bg-brand-400/5 mb-5">
            <DollarSign className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-xs font-mono font-semibold text-brand-400 uppercase tracking-wider">
              Risk Calculator
            </span>
          </div>
          <h2 className="font-editorial text-[clamp(24px,3.5vw,42px)] font-bold leading-tight tracking-[-1.5px] text-white mb-4">
            What does an unprotected AI
            <br />
            <span className="text-white/40">prompt actually cost you?</span>
          </h2>
          <p className="text-base text-slate-400 max-w-md mx-auto">
            Model your annual breach exposure vs. HoundShield cost. Based on DFARS enforcement data, HHS breach settlements, and IBM Cost of a Data Breach 2024.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Input panel */}
          <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 space-y-7">
            <div>
              <p className="text-xs font-mono text-white/40 uppercase tracking-wider mb-3">Industry</p>
              <div className="space-y-2">
                {(Object.entries(INDUSTRIES) as [Industry, IndustryConfig][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setIndustry(key)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      industry === key
                        ? "bg-brand-400/10 border-brand-400/40 text-white"
                        : "bg-white/[0.02] border-white/[0.06] text-white/50 hover:text-white/70 hover:border-white/15"
                    }`}
                  >
                    <p className="text-sm font-semibold leading-snug">{cfg.label}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">{cfg.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <Slider
              label="AI users in your org"
              display={aiUsers.toString()}
              value={aiUsers}
              min={1}
              max={500}
              step={1}
              onChange={setAiUsers}
            />

            <div className="text-[11px] text-white/25 font-mono flex items-start gap-1.5 leading-relaxed">
              <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>
                Based on DFARS enforcement precedents and IBM Cost of Data Breach 2024. Estimates only — consult legal counsel for compliance specifics.
              </span>
            </div>
          </div>

          {/* Results panel */}
          <div className="lg:col-span-3 space-y-4">
            {/* Exposure card */}
            <motion.div
              key={`${industry}-${aiUsers}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-red-950/30 border border-red-500/25 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-xs font-mono text-red-400 uppercase tracking-wider">
                  Without HoundShield
                </span>
              </div>
              <p className="text-4xl font-bold text-red-400 font-mono mb-1">
                {formatDollars(calc.annualExposure)}
              </p>
              <p className="text-sm text-white/50">
                estimated annual {config.regulation} breach exposure
              </p>
              <p className="text-xs text-white/30 mt-2">
                {aiUsers} AI users · {Math.round(config.incidentProbabilityPerUser * 100 * aiUsers)}% annual incident probability
              </p>
            </motion.div>

            {/* HoundShield cost card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 }}
              className="bg-emerald-950/30 border border-emerald-500/25 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                  With HoundShield {plan.name}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <p className="text-2xl font-bold text-white font-mono">
                    {plan.price === 0 ? "Free" : `$${plan.price}/mo`}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">plan cost</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400 font-mono">
                    {formatDollars(calc.annualSavings)}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">annual savings</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white font-mono">
                    {calc.breakEvenDays === 0 ? "∞" : `${calc.breakEvenDays}d`}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">break-even</p>
                </div>
              </div>
              {calc.roi > 0 && (
                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <p className="text-xs text-white/40">
                    <span className="text-emerald-400 font-semibold">{calc.roi.toLocaleString()}% ROI</span>
                    {" "}· HoundShield eliminates ~92% of AI-induced breach risk
                  </p>
                </div>
              )}
            </motion.div>

            {/* CTA */}
            <Link
              href={plan.price === 0 ? "/signup" : `/pricing#${plan.name.toLowerCase()}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors"
            >
              Start with {plan.name}
              {plan.price > 0 && ` — $${plan.price}/mo`}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
