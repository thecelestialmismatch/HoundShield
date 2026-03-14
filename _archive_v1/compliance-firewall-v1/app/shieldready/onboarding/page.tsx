"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Users,
  ShieldCheck,
  Rocket,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
} from "lucide-react";
import { createOrganization, logActivity } from "@/lib/shieldready/storage";
import type { CMMCLevel } from "@/lib/shieldready/types";

// ─── Step Configuration ──────────────────────────────────────────────────────
const STEPS = [
  { id: 0, title: "Organization", icon: Building2, label: "Org Profile" },
  { id: 1, title: "Team Setup", icon: Users, label: "Team" },
  { id: 2, title: "CMMC Level", icon: ShieldCheck, label: "Level" },
  { id: 3, title: "Confirm & Launch", icon: Rocket, label: "Launch" },
];

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

  // Step 2 — Team (local-only, no backend)
  const [teamEmails, setTeamEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");

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

  const handleAddEmail = () => {
    const trimmed = emailInput.trim();
    if (trimmed && trimmed.includes("@") && !teamEmails.includes(trimmed)) {
      setTeamEmails([...teamEmails, trimmed]);
      setEmailInput("");
    }
  };

  const handleRemoveEmail = (email: string) => {
    setTeamEmails(teamEmails.filter((e) => e !== email));
  };

  const handleLaunch = () => {
    createOrganization({
      name: orgName.trim(),
      employeeCount: employeeCount ?? 10,
      contractTypes: contractType ? [contractType] : [],
      handlesCUI,
      handlesFCI,
      cmmcLevel,
    });
    logActivity("Completed onboarding wizard");
    router.push("/shieldready/assessment");
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
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : isActive
                      ? "bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      : "bg-slate-800/50 border-slate-600 text-slate-500"
                  }`}
                >
                  {isDone ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${
                    isActive ? "text-blue-400" : isDone ? "text-emerald-400" : "text-slate-500"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
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
            <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
              {/* STEP 0: Org Profile */}
              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Organization Profile</h2>
                    <p className="text-slate-400">Tell us about your defense contracting organization.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Company Name *</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Vertex Defense Systems"
                      className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">Employee Count *</label>
                    <div className="grid grid-cols-4 gap-3">
                      {EMPLOYEE_RANGES.map((range) => (
                        <button
                          key={range.value}
                          onClick={() => setEmployeeCount(range.value)}
                          className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                            employeeCount === range.value
                              ? "bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                              : "bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-500"
                          }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">Contract Type *</label>
                    <div className="grid grid-cols-3 gap-3">
                      {CONTRACT_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => setContractType(type)}
                          className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                            contractType === type
                              ? "bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                              : "bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-500"
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
                          ? "bg-amber-500/10 border-amber-500/50 text-amber-400"
                          : "bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-500"
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
                          ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
                          : "bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-500"
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

              {/* STEP 1: Team Setup */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Team Setup</h2>
                    <p className="text-slate-400">
                      Add team members who will help with the assessment.{" "}
                      <span className="text-slate-500">(Optional — you can do this later)</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
                      placeholder="team@company.com"
                      className="flex-1 bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                    <button
                      onClick={handleAddEmail}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  {teamEmails.length > 0 ? (
                    <div className="space-y-2">
                      {teamEmails.map((email) => (
                        <div
                          key={email}
                          className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold">
                              {email[0].toUpperCase()}
                            </div>
                            <span className="text-white text-sm">{email}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveEmail(email)}
                            className="text-slate-500 hover:text-red-400 text-sm transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <Users size={40} className="mx-auto mb-3 opacity-50" />
                      <p>No team members added yet.</p>
                      <p className="text-sm mt-1">You can do this later — skip to continue.</p>
                    </div>
                  )}
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
                          ? "bg-blue-500/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                          : "bg-slate-800/50 border-slate-600 hover:border-slate-500"
                      }`}
                    >
                      {cmmcLevel === 1 && (
                        <div className="absolute top-4 right-4">
                          <CheckCircle2 size={20} className="text-blue-400" />
                        </div>
                      )}
                      <div className="text-3xl font-bold text-blue-400 mb-2">Level 1</div>
                      <div className="text-white font-semibold mb-1">Foundational</div>
                      <div className="text-slate-400 text-sm mb-4">Basic safeguarding of FCI</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-300">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          17 controls
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          Self-assessment
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          Annual affirmation
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setCmmcLevel(2)}
                      className={`relative p-6 rounded-2xl border text-left transition-all ${
                        cmmcLevel === 2
                          ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                          : "bg-slate-800/50 border-slate-600 hover:border-slate-500"
                      }`}
                    >
                      {cmmcLevel === 2 && (
                        <div className="absolute top-4 right-4">
                          <CheckCircle2 size={20} className="text-emerald-400" />
                        </div>
                      )}
                      <div className="inline-block bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full mb-2">
                        RECOMMENDED
                      </div>
                      <div className="text-3xl font-bold text-emerald-400 mb-2">Level 2</div>
                      <div className="text-white font-semibold mb-1">Advanced</div>
                      <div className="text-slate-400 text-sm mb-4">Protection of CUI</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-300">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          110 controls (NIST 800-171)
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          C3PAO assessment
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          Triennial certification
                        </div>
                      </div>
                    </button>
                  </div>

                  {handlesCUI && cmmcLevel === 1 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
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
                    <div className="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-slate-400">Organization</span>
                      <span className="text-white font-medium">{orgName || "—"}</span>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-slate-400">Employees</span>
                      <span className="text-white font-medium">
                        {EMPLOYEE_RANGES.find((r) => r.value === employeeCount)?.label || "—"}
                      </span>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-slate-400">Contract Type</span>
                      <span className="text-white font-medium">{contractType || "—"}</span>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-slate-400">Data Types</span>
                      <span className="text-white font-medium">
                        {[handlesCUI && "CUI", handlesFCI && "FCI"].filter(Boolean).join(", ") || "—"}
                      </span>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-slate-400">CMMC Level</span>
                      <span className={`font-bold ${cmmcLevel === 2 ? "text-emerald-400" : "text-blue-400"}`}>
                        Level {cmmcLevel} — {cmmcLevel === 1 ? "Foundational" : "Advanced"}
                      </span>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-slate-400">Controls to Assess</span>
                      <span className="text-white font-bold text-lg">
                        {cmmcLevel === 1 ? "17" : "110"}
                      </span>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-slate-400">Team Members</span>
                      <span className="text-white font-medium">
                        {teamEmails.length > 0 ? teamEmails.length : "Solo (just you)"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Navigation Buttons ── */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700/50">
                <button
                  onClick={handleBack}
                  disabled={step === 0}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    step === 0
                      ? "text-slate-600 cursor-not-allowed"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
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
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                        : "bg-slate-700 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    Continue
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleLaunch}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 rounded-xl text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
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
