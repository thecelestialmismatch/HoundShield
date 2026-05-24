"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  ChevronRight,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { scan, SAMPLE_PROMPTS, type ScanResult, type ScanHit, type RiskLevel } from "@/lib/scanner-demo/patterns";

// ── Risk styling ──────────────────────────────────────────────────────────────

const RISK_STYLE: Record<RiskLevel, { bg: string; border: string; text: string; label: string }> = {
  CRITICAL: {
    bg: "bg-red-950/50",
    border: "border-red-500/50",
    text: "text-red-400",
    label: "CRITICAL",
  },
  HIGH: {
    bg: "bg-orange-950/40",
    border: "border-orange-500/40",
    text: "text-orange-400",
    label: "HIGH",
  },
  MEDIUM: {
    bg: "bg-brand-950/30",
    border: "border-brand-400/40",
    text: "text-brand-400",
    label: "MEDIUM",
  },
  LOW: {
    bg: "bg-blue-950/30",
    border: "border-blue-500/30",
    text: "text-blue-400",
    label: "LOW",
  },
  NONE: {
    bg: "bg-emerald-950/30",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    label: "NONE",
  },
};

const CATEGORY_STYLE: Record<string, string> = {
  CUI: "bg-red-900/40 text-red-300 border-red-800/60",
  PHI: "bg-purple-900/40 text-purple-300 border-purple-800/60",
  PII: "bg-orange-900/40 text-orange-300 border-orange-800/60",
  IP: "bg-blue-900/40 text-blue-300 border-blue-800/60",
  CREDENTIAL: "bg-rose-900/40 text-rose-300 border-rose-800/60",
};

const ACTION_STYLE: Record<string, string> = {
  BLOCK: "bg-red-900/60 text-red-200 border-red-700",
  QUARANTINE: "bg-orange-900/40 text-orange-200 border-orange-700/60",
  ALLOW: "bg-emerald-900/40 text-emerald-200 border-emerald-700/60",
};

// ── Hit card ──────────────────────────────────────────────────────────────────

function HitCard({ hit }: { hit: ScanHit }) {
  const risk = RISK_STYLE[hit.risk_level];
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-lg border p-3 ${risk.bg} ${risk.border}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-sm font-semibold text-white/90 leading-snug">{hit.pattern}</span>
        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${ACTION_STYLE[hit.action]}`}>
          {hit.action}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${CATEGORY_STYLE[hit.category]}`}>
          {hit.category}
        </span>
        <span className={`text-[10px] font-mono ${risk.text}`}>
          {hit.risk_level}
        </span>
        {hit.snippet && (
          <span className="text-[10px] font-mono text-white/30 ml-auto">
            match: {hit.snippet}
          </span>
        )}
      </div>
      {hit.nist_controls.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {hit.nist_controls.map((c) => (
            <span key={c} className="text-[9px] font-mono text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded">
              {c}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Results panel ─────────────────────────────────────────────────────────────

function ResultsPanel({ result, isScanning }: { result: ScanResult | null; isScanning: boolean }) {
  if (isScanning) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        >
          <Zap className="w-7 h-7 text-brand-400" />
        </motion.div>
        <p className="text-sm text-white/40 font-mono">scanning…</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 gap-3 text-center px-4">
        <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-white/20" />
        </div>
        <p className="text-sm text-white/30">Type or paste a prompt to see it scanned</p>
        <p className="text-xs text-white/20 font-mono">{35} patterns · runs in your browser</p>
      </div>
    );
  }

  if (result.risk_level === "NONE") {
    return (
      <motion.div
        key="clean"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-full py-12 gap-3 text-center px-4"
      >
        <div className="w-14 h-14 rounded-full bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 text-emerald-400" />
        </div>
        <p className="text-base font-semibold text-emerald-400">Clean — no violations</p>
        <p className="text-sm text-white/40">
          {result.pattern_count} patterns checked in {result.scan_ms}ms
        </p>
        <p className="text-xs text-white/25 max-w-[200px]">
          This prompt would pass through the HoundShield gateway
        </p>
      </motion.div>
    );
  }

  const risk = RISK_STYLE[result.risk_level];
  const blockCount = result.hits.filter((h) => h.action === "BLOCK").length;
  const quarantineCount = result.hits.filter((h) => h.action === "QUARANTINE").length;

  return (
    <motion.div key="violations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {/* Summary bar */}
      <div className={`rounded-xl border p-4 ${risk.bg} ${risk.border}`}>
        <div className="flex items-center gap-3 mb-2">
          <ShieldAlert className={`w-5 h-5 ${risk.text} flex-shrink-0`} />
          <span className={`text-sm font-bold ${risk.text}`}>
            {result.risk_level} — {result.action}
          </span>
        </div>
        <p className="text-xs text-white/60 leading-relaxed">
          {result.hits.length} violation{result.hits.length !== 1 ? "s" : ""} detected.{" "}
          {blockCount > 0 && `${blockCount} would be blocked. `}
          {quarantineCount > 0 && `${quarantineCount} quarantined. `}
          This prompt would not reach the AI model.
        </p>
        <p className="text-[10px] font-mono text-white/30 mt-1">
          {result.pattern_count} patterns · {result.scan_ms}ms
        </p>
      </div>

      {/* Hit cards */}
      <div className="space-y-2">
        <AnimatePresence>
          {result.hits.map((hit, i) => (
            <motion.div
              key={hit.pattern}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <HitCard hit={hit} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* In-line CTA */}
      <div className="pt-2">
        <Link
          href="/docs/quickstart"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-brand-600/80 hover:bg-brand-600 border border-brand-500/50 text-white text-sm font-semibold transition-colors"
        >
          <Lock className="w-3.5 h-3.5" />
          Deploy this protection in 15 minutes
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const EXAMPLE_BUTTONS = [
  { label: "CMMC / CUI", key: "cui" as const, color: "border-red-800/50 text-red-400 hover:bg-red-950/40" },
  { label: "HIPAA / PHI", key: "phi" as const, color: "border-purple-800/50 text-purple-400 hover:bg-purple-950/40" },
  { label: "Credentials", key: "credential" as const, color: "border-blue-800/50 text-blue-400 hover:bg-blue-950/40" },
];

export function ScannerDemo() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runScan = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResult(null);
      setIsScanning(false);
      return;
    }
    setIsScanning(true);
    debounceRef.current = setTimeout(() => {
      const res = scan(value);
      setResult(res);
      setIsScanning(false);
    }, 180);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      runScan(e.target.value);
    },
    [runScan]
  );

  const loadSample = useCallback(
    (key: keyof typeof SAMPLE_PROMPTS) => {
      const sample = SAMPLE_PROMPTS[key];
      setText(sample);
      runScan(sample);
    },
    [runScan]
  );

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <section className="relative bg-[#07070b] py-24 overflow-hidden">
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(234,88,12,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-brand-400/20 bg-brand-400/5 mb-5">
            <Zap className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-xs font-mono font-semibold text-brand-400 uppercase tracking-wider">
              Live Scanner Demo
            </span>
          </div>
          <h2 className="font-editorial text-[clamp(28px,4vw,48px)] font-bold leading-tight tracking-[-1.5px] text-white mb-4">
            Paste any AI prompt.
            <br />
            <span className="text-white/40">Watch it get scanned.</span>
          </h2>
          <p className="text-base text-slate-400 max-w-lg mx-auto">
            {35} detection patterns running in your browser. Zero data leaves this page. This is exactly what HoundShield runs on your infrastructure.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Input panel */}
          <div className="flex flex-col bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5">
            {/* Example buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs text-white/30 font-mono self-center mr-1">Try:</span>
              {EXAMPLE_BUTTONS.map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => loadSample(btn.key)}
                  className={`text-xs px-3 py-1 rounded-full border bg-transparent transition-colors font-medium ${btn.color}`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              value={text}
              onChange={handleChange}
              placeholder="Paste an AI prompt, email excerpt, or document text. Try copying something from your team's ChatGPT history..."
              className="flex-1 w-full min-h-[280px] bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 text-sm text-white/80 placeholder:text-white/20 font-mono resize-none outline-none focus:border-brand-400/40 focus:ring-1 focus:ring-brand-400/20 transition-colors leading-relaxed"
              spellCheck={false}
            />

            <div className="flex items-center justify-between mt-3">
              <p className="text-[10px] font-mono text-white/20">
                {35} patterns · <span className="text-white/30">&lt;2ms scan time</span>
              </p>
              {text && (
                <button
                  onClick={() => { setText(""); setResult(null); }}
                  className="text-[10px] text-white/30 hover:text-white/60 transition-colors font-mono"
                >
                  clear
                </button>
              )}
            </div>
          </div>

          {/* Results panel */}
          <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 min-h-[380px] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-white/30" />
              <span className="text-xs font-mono text-white/30 uppercase tracking-wider">Scan Results</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ResultsPanel result={result} isScanning={isScanning} />
            </div>
          </div>
        </div>

        {/* Bottom disclaimer + CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <p className="text-xs text-white/25 font-mono text-center sm:text-left">
            Scanning happens locally — no prompt content transmitted · matches redacted for display
          </p>
          <Link
            href="/docs/quickstart"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors"
          >
            Deploy in 15 minutes
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
