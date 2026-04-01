"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useInView } from "framer-motion";
import { Monitor, Search, Cpu, Shuffle, ClipboardList } from "lucide-react";

const STAGES = [
  { id: 0, Icon: Monitor,       label: "Intercept" },
  { id: 1, Icon: Search,        label: "Scan" },
  { id: 2, Icon: Cpu,           label: "Classify" },
  { id: 3, Icon: Shuffle,       label: "Route" },
  { id: 4, Icon: ClipboardList, label: "Log" },
];

type LogType = "info" | "success" | "danger" | "warn";

interface LogEntry {
  time: string;
  type: LogType;
  msg: string;
}

const SEQUENCES: Array<{ stage: number; logs: LogEntry[] }> = [
  {
    stage: 0,
    logs: [{ time: "00:00:01", type: "info", msg: "→ Intercepted: POST /v1/chat/completions" }],
  },
  {
    stage: 1,
    logs: [
      { time: "00:00:01", type: "info", msg: "→ Running 16 detection engines in parallel..." },
      { time: "00:00:02", type: "warn", msg: " API key pattern detected: sk-proj-***" },
    ],
  },
  {
    stage: 2,
    logs: [
      { time: "00:00:02", type: "info", msg: "→ ReAct agent classifying threat..." },
      { time: "00:00:03", type: "danger", msg: " HIGH RISK: OpenAI API key in plaintext" },
    ],
  },
  {
    stage: 3,
    logs: [
      { time: "00:00:03", type: "info", msg: "→ Policy: BLOCK + QUARANTINE" },
      { time: "00:00:04", type: "warn", msg: "→ AES-256 encrypting sensitive payload..." },
    ],
  },
  {
    stage: 4,
    logs: [
      { time: "00:00:04", type: "success", msg: " Quarantine saved. SHA-256 hash generated." },
      { time: "00:00:05", type: "success", msg: " Audit log entry written. Request BLOCKED." },
    ],
  },
];

function getNow(): string {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

const LOG_COLOR: Record<LogType, string> = {
  info: "text-gray-400",
  success: "text-emerald-400 font-semibold",
  danger: "text-rose-400 font-bold",
  warn: "text-amber-400 font-semibold",
};

export function PipelineSimulator() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeStage, setActiveStage] = useState(-1);
  const [doneStages, setDoneStages] = useState<number[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const runRef = useRef(false);

  const runPipeline = useCallback(async () => {
    if (runRef.current) return;
    runRef.current = true;
    setRunning(true);
    setActiveStage(-1);
    setDoneStages([]);
    setLogEntries([]);
    setProgress(0);

    for (let i = 0; i < SEQUENCES.length; i++) {
      if (!runRef.current) break;
      const seq = SEQUENCES[i];
      setActiveStage(seq.stage);
      setProgress(Math.round(((i + 0.5) / SEQUENCES.length) * 100));

      await new Promise((r) => setTimeout(r, 800));

      for (const log of seq.logs) {
        if (!runRef.current) break;
        setLogEntries((prev) => [...prev, { ...log, time: getNow() }]);
        await new Promise((r) => setTimeout(r, 500));
      }

      setDoneStages((prev) => [...prev, seq.stage]);
      setProgress(Math.round(((i + 1) / SEQUENCES.length) * 100));
      await new Promise((r) => setTimeout(r, 400));
    }

    setActiveStage(-1);
    setRunning(false);
    runRef.current = false;
  }, []);

  const reset = useCallback(() => {
    runRef.current = false;
    setRunning(false);
    setActiveStage(-1);
    setDoneStages([]);
    setLogEntries([]);
    setProgress(0);
  }, []);

  const toggle = useCallback(() => {
    if (running) {
      runRef.current = false;
      setRunning(false);
    } else {
      reset();
      setTimeout(runPipeline, 50);
    }
  }, [running, reset, runPipeline]);

  useEffect(() => {
    if (isInView && !running && logEntries.length === 0) {
      const t = setTimeout(runPipeline, 600);
      return () => clearTimeout(t);
    }
  }, [isInView]);

  return (
    <section ref={ref} className="py-24 md:py-32 bg-[#07070b]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-4">
            Live Simulator
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-extrabold tracking-tight leading-[1.1] text-white mb-4">
            Watch the Firewall Work
          </h2>
          <p className="text-lg text-slate-400 max-w-[520px] mx-auto">
            See every request get intercepted, scanned, classified, routed, and logged — in real time.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden bg-[#0a0a10]/80 border border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ${running ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
              <span className="text-sm font-semibold text-white tracking-wider">
                LIVE FIREWALL SIMULATOR
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggle}
                className="w-[34px] h-[34px] rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:scale-105 transition-all flex items-center justify-center text-sm"
              >
                {running ? "" : "▶"}
              </button>
              <button
                onClick={() => { reset(); setTimeout(runPipeline, 50); }}
                className="w-[34px] h-[34px] rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:scale-105 transition-all flex items-center justify-center text-sm"
              >
                ↺
              </button>
            </div>
          </div>

          <div className="p-7">
            {/* Stages */}
            <div className="relative flex items-center justify-between mb-5">
              <div className="absolute left-6 right-6 h-[3px] bg-white/[0.05] rounded-full">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {STAGES.map((stage) => {
                const isActive = activeStage === stage.id;
                const isDone = doneStages.includes(stage.id);
                const Icon = stage.Icon;
                return (
                  <div key={stage.id} className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-[52px] h-[52px] rounded-[14px] flex items-center justify-center border-2 transition-all duration-400 ${
                        isActive
                          ? "bg-indigo-500/15 border-indigo-500/45 scale-110"
                          : isDone
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-gray-800 border-gray-700"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-indigo-300" : isDone ? "text-emerald-400" : "text-white/30"}`} />
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                        isActive
                          ? "text-indigo-300"
                          : isDone
                          ? "text-emerald-400/70"
                          : "text-white/30"
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Overall progress bar */}
            <div className="h-[3px] rounded-full bg-black/40 border border-white/[0.04] overflow-hidden mb-5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Log terminal */}
            <div className="rounded-xl bg-black/50 border border-white/[0.05] overflow-hidden">
              <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-white/[0.04] bg-white/[0.02]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                <span className="text-xs text-white/30 font-mono ml-2">kaelus-pipeline.log</span>
              </div>
              <div className="p-4 min-h-[200px] max-h-[240px] overflow-hidden flex flex-col gap-1.5 font-mono">
                {logEntries.length === 0 ? (
                  <div className="flex items-center justify-center h-[180px] text-white/20 text-sm gap-2">
                     Waiting for intercept...
                  </div>
                ) : (
                  logEntries.map((entry, i) => (
                    <div
                      key={i}
                      className="flex gap-3 text-[12.5px] leading-relaxed"
                      style={{ animation: "fadeSlideIn 0.3s ease both" }}
                    >
                      <span className="text-white/25 flex-shrink-0">{entry.time}</span>
                      <span className={LOG_COLOR[entry.type]}>{entry.msg}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
