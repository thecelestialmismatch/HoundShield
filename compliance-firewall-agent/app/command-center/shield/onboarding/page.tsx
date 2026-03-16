"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Plug,
  ShieldCheck,
  Rocket,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";
import { createOrganization, logActivity } from "@/lib/shieldready/storage";
import type { CMMCLevel } from "@/lib/shieldready/types";

// ─── Step Configuration ──────────────────────────────────────────────────────
const STEPS = [
  { id: 0, title: "Organization", icon: Building2, label: "Org Profile" },
  { id: 1, title: "Connect AI", icon: Plug, label: "Connect" },
  { id: 2, title: "CMMC Level", icon: ShieldCheck, label: "Level" },
  { id: 3, title: "Confirm & Launch", icon: Rocket, label: "Launch" },
];

const GATEWAY_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/gateway/intercept`
  : "https://kaelus.ai/api/gateway/intercept";

const EMPLOYEE_RANGES = [
  { label: "1–10", value: 10 },
  { label: "11–50", value: 50 },
  { label: "51–200", value: 200 },
  { label: "200+", value: 500 },
];

const CONTRACT_TYPES = ["Prime Contractor", "Subcontractor", "Both"];

// ─── Page Component ──────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1 — Org info
  const [orgName, setOrgName] = useState("");
  const [employeeCount, setEmployeeCount] = useState<number | null>(null);
  const [contractType, setContractType] = useState<string | null>(null);
  const [handlesCUI, setHandlesCUI] = useState(false);
  const [handlesFCI, setHandlesFCI] = useState(true);

  // Step 2 — Connect AI (snippet copy state)
  const [copiedSnippet, setCopiedSnippet] = useState<"python" | "js" | null>(null);

  // Step 3 — CMMC Level
  const [cmmcLevel, setCmmcLevel] = useState<CMMCLevel>(2);

  // Navigation
  const canProceed = (): boolean => {
    if (step === 0) return orgName.trim().length > 0 && employeeCount !== null && contractType !== null;
    if (step === 1) return true; // team is optional
    if (step === 2) return true;
    return true;
  };

  const handleNext = () => {
    if (step < 3 && canProceed()) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleCopySnippet = (lang: "python" | "js", text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSnippet(lang);
      setTimeout(() => setCopiedSnippet(null), 2000);
    });
  };

  const handleLaunch = async () => {
    createOrganization({
      name: orgName.trim(),
      employeeCount: employeeCount ?? 10,
      contractTypes: contractType ? [contractType] : [],
      handlesCUI,
      handlesFCI,
      cmmcLevel,
    });
    logActivity("Completed onboarding wizard");

    // Fire welcome email — non-blocking, graceful failure
    try {
      await fetch("/api/email/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName: orgName.trim() }),
      });
    } catch {
      // Email failure should never block onboarding
    }

    router.push("/command-center/shield/assessment");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-8 px-4">
      {/* ── Progress Bar ── */}
      <div className="w-full max-w-3xl mb-10">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.id} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isDone
                      ? "bg-emerald-500/100/20 border-emerald-500 text-emerald-400"
                      : isActive
                      ? "bg-brand-500/100/20 border-brand-500 text-brand-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      : "bg-white/[0.05]/50 border-slate-600 text-slate-500"
                  }`}
                >
                  {isDone ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${
                    isActive ? "text-brand-400" : isDone ? "text-emerald-400" : "text-slate-500"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="w-full bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          />
        </div>
      </div>

      {/* ── Step Content ── */}
      <div className="w-full max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="bg-white/[0.03]/70 backdrop-blur-xl border border-white/10 dark:border-white/10 dark:border-slate-700/50 rounded-2xl p-8 shadow-2xl">
              {/* STEP 0: Org Profile */}
              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Organization Profile</h2>
                    <p className="text-slate-400">Tell us about your defense contracting organization.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 dark:text-slate-300 mb-2">Company Name *</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Vertex Defense Systems"
                      className="w-full bg-white/[0.05]/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 dark:text-slate-300 mb-3">Employee Count *</label>
                    <div className="grid grid-cols-4 gap-3">
                      {EMPLOYEE_RANGES.map((range) => (
                        <button
                          key={range.value}
                          onClick={() => setEmployeeCount(range.value)}
                          className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                            employeeCount === range.value
                              ? "bg-brand-500/100/20 border-brand-500 text-brand-400 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                              : "bg-white/[0.05]/50 border-slate-600 text-slate-400 hover:border-slate-500"
                          }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 dark:text-slate-300 mb-3">Contract Type *</label>
                    <div className="grid grid-cols-3 gap-3">
                      {CONTRACT_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => setContractType(type)}
                          className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                            contractType === type
                              ? "bg-brand-500/100/20 border-brand-500 text-brand-400 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                              : "bg-white/[0.05]/50 border-slate-600 text-slate-400 hover:border-slate-500"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setHandlesCUI(!handlesCUI)}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                        handlesCUI
                          ? "bg-amber-500/100/10 border-amber-500/50 text-amber-400"
                          : "bg-white/[0.05]/50 border-slate-600 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      <AlertTriangle size={18} />
                      <div className="text-left">
                        <p className="text-sm font-medium">Handles CUI</p>
                        <p className="text-xs opacity-70">Controlled Unclassified Info</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setHandlesFCI(!handlesFCI)}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                        handlesFCI
                          ? "bg-brand-500/100/10 border-brand-500/50 text-brand-400"
                          : "bg-white/[0.05]/50 border-slate-600 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      <FileCheck size={18} />
                      <div className="text-left">
                        <p className="text-sm font-medium">Handles FCI</p>
                        <p className="text-xs opacity-70">Federal Contract Info</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 1: Connect Your AI Tool */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Connect Your AI Tool</h2>
                    <p className="text-slate-400">
                      Route your AI queries through Kaelus in under 60 seconds.
                    </p>
                  </div>

                  {/* Gateway URL */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Your Gateway URL</p>
                    <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-4 py-3">
                      <code className="flex-1 text-emerald-400 text-sm font-mono break-all">{GATEWAY_URL}</code>
                      <button
                        onClick={() => handleCopySnippet("python", GATEWAY_URL)}
                        className="shrink-0 text-slate-500 hover:text-white transition-colors"
                        title="Copy URL"
                      >
                        {copiedSnippet === "python" ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Python snippet */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Python (OpenAI SDK)</p>
                      <button
                        onClick={() => handleCopySnippet("python", `import openai\n\nclient = openai.OpenAI(\n    base_url="${GATEWAY_URL}",\n    api_key="your-openai-key",\n)\n\nresponse = client.chat.completions.create(\n    model="gpt-4o",\n    messages=[{"role": "user", "content": "Hello"}],\n    extra_headers={"X-Kaelus-Org": "${orgName || "your-org"}"},\n)`)}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors"
                      >
                        {copiedSnippet === "python" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        {copiedSnippet === "python" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <pre className="bg-slate-900 border border-white/10 rounded-xl px-4 py-4 text-xs text-slate-300 font-mono overflow-x-auto leading-relaxed">{`import openai

client = openai.OpenAI(
    base_url="${GATEWAY_URL}",
    api_key="your-openai-key",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
    extra_headers={"X-Kaelus-Org": "${orgName || "your-org"}"},
)`}</pre>
                  </div>

                  {/* JS snippet */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">JavaScript / TypeScript</p>
                      <button
                        onClick={() => handleCopySnippet("js", `import OpenAI from "openai";\n\nconst client = new OpenAI({\n  baseURL: "${GATEWAY_URL}",\n  apiKey: process.env.OPENAI_API_KEY,\n  defaultHeaders: { "X-Kaelus-Org": "${orgName || "your-org"}" },\n});\n\nconst response = await client.chat.completions.create({\n  model: "gpt-4o",\n  messages: [{ role: "user", content: "Hello" }],\n});`)}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors"
                      >
                        {copiedSnippet === "js" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        {copiedSnippet === "js" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <pre className="bg-slate-900 border border-white/10 rounded-xl px-4 py-4 text-xs text-slate-300 font-mono overflow-x-auto leading-relaxed">{`import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${GATEWAY_URL}",
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: { "X-Kaelus-Org": "${orgName || "your-org"}" },
});

const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello" }],
});`}</pre>
                  </div>

                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-sm text-indigo-300">
                    <span className="font-semibold">Skip for now —</span> you can grab your API key and gateway docs from the dashboard anytime. The assessment doesn&apos;t require connection.
                  </div>
                </div>
              )}

              {/* STEP 2: CMMC Level */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">CMMC Level Selection</h2>
                    <p className="text-slate-400">Choose the certification level you need to achieve.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setCmmcLevel(1)}
                      className={`relative p-6 rounded-2xl border text-left transition-all ${
                        cmmcLevel === 1
                          ? "bg-brand-500/100/10 border-brand-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                          : "bg-white/[0.05]/50 border-slate-600 hover:border-slate-500"
                      }`}
                    >
                      {cmmcLevel === 1 && (
                        <div className="absolute top-4 right-4">
                          <CheckCircle2 size={20} className="text-brand-400" />
                        </div>
                      )}
                      <div className="text-3xl font-bold text-brand-400 mb-2">Level 1</div>
                      <div className="text-white font-semibold mb-1">Foundational</div>
                      <div className="text-slate-400 text-sm mb-4">Basic safeguarding of FCI</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-300 dark:text-slate-300">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          17 controls
                        </div>
                        <div className="flex items-center gap-2 text-slate-300 dark:text-slate-300">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          Self-assessment
                        </div>
                        <div className="flex items-center gap-2 text-slate-300 dark:text-slate-300">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          Annual affirmation
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setCmmcLevel(2)}
                      className={`relative p-6 rounded-2xl border text-left transition-all ${
                        cmmcLevel === 2
                          ? "bg-emerald-500/100/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                          : "bg-white/[0.05]/50 border-slate-600 hover:border-slate-500"
                      }`}
                    >
                      {cmmcLevel === 2 && (
                        <div className="absolute top-4 right-4">
                          <CheckCircle2 size={20} className="text-emerald-400" />
                        </div>
                      )}
                      <div className="inline-block bg-emerald-500/100/20 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full mb-2">
                        RECOMMENDED
                      </div>
                      <div className="text-3xl font-bold text-emerald-400 mb-2">Level 2</div>
                      <div className="text-white font-semibold mb-1">Advanced</div>
                      <div className="text-slate-400 text-sm mb-4">Protection of CUI</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-300 dark:text-slate-300">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          110 controls (NIST 800-171)
                        </div>
                        <div className="flex items-center gap-2 text-slate-300 dark:text-slate-300">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          C3PAO assessment
                        </div>
                        <div className="flex items-center gap-2 text-slate-300 dark:text-slate-300">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          Triennial certification
                        </div>
                      </div>
                    </button>
                  </div>

                  {handlesCUI && cmmcLevel === 1 && (
                    <div className="bg-amber-500/100/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                      <AlertTriangle size={18} className="text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-amber-300 text-sm font-medium">CUI requires Level 2</p>
                        <p className="text-amber-400/70 text-sm">
                          You indicated your organization handles CUI. CMMC Level 2 is required for CUI protection.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Confirm & Launch */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Ready to Launch</h2>
                    <p className="text-slate-400">Review your settings and begin the assessment.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white/[0.05]/50 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-slate-400">Organization</span>
                      <span className="text-white font-medium">{orgName || "—"}</span>
                    </div>
                    <div className="bg-white/[0.05]/50 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-slate-400">Employees</span>
                      <span className="text-white font-medium">
                        {EMPLOYEE_RANGES.find((r) => r.value === employeeCount)?.label || "—"}
                      </span>
                    </div>
                    <div className="bg-white/[0.05]/50 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-slate-400">Contract Type</span>
                      <span className="text-white font-medium">{contractType || "—"}</span>
                    </div>
                    <div className="bg-white/[0.05]/50 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-slate-400">Data Types</span>
                      <span className="text-white font-medium">
                        {[handlesCUI && "CUI", handlesFCI && "FCI"].filter(Boolean).join(", ") || "—"}
                      </span>
                    </div>
                    <div className="bg-white/[0.05]/50 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-slate-400">CMMC Level</span>
                      <span className={`font-bold ${cmmcLevel === 2 ? "text-emerald-400" : "text-brand-400"}`}>
                        Level {cmmcLevel} — {cmmcLevel === 1 ? "Foundational" : "Advanced"}
                      </span>
                    </div>
                    <div className="bg-white/[0.05]/50 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-slate-400">Controls to Assess</span>
                      <span className="text-white font-bold text-lg">
                        {cmmcLevel === 1 ? "17" : "110"}
                      </span>
                    </div>
                    <div className="bg-white/[0.05]/50 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-slate-400">Gateway</span>
                      <span className="text-emerald-400 font-medium text-sm">Ready to connect</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Navigation Buttons ── */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10 dark:border-white/10 dark:border-slate-700/50">
                <button
                  onClick={handleBack}
                  disabled={step === 0}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    step === 0
                      ? "text-slate-400 cursor-not-allowed"
                      : "text-slate-300 dark:text-slate-300 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <ArrowLeft size={16} />
                  Back
                </button>

                {step < 3 ? (
                  <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      canProceed()
                        ? "bg-brand-500/100 hover:bg-brand-400 text-white shadow-lg shadow-brand-500/20"
                        : "bg-slate-700 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    Continue
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleLaunch}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-brand-500 hover:from-emerald-500 hover:to-brand-400 rounded-xl text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    <Rocket size={18} />
                    Begin Assessment
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
