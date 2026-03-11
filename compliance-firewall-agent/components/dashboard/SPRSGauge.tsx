"use client";

import { motion } from "framer-motion";

interface SPRSGaugeProps {
  score: number;        // -203 to 110
  maxScore?: number;    // default 110
  minScore?: number;    // default -203
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animate?: boolean;
}

export default function SPRSGauge({
  score,
  maxScore = 110,
  minScore = -203,
  size = "md",
  showLabel = true,
  animate = true,
}: SPRSGaugeProps) {
  const range = maxScore - minScore;
  const normalized = Math.max(0, Math.min(1, (score - minScore) / range));
  const percentage = Math.round(normalized * 100);

  // Color based on score
  const getColor = () => {
    if (score >= 90) return { stroke: "#10b981", text: "text-emerald-400", bg: "bg-emerald-500/10", glow: "shadow-emerald-500/20" };
    if (score >= 50) return { stroke: "#3b82f6", text: "text-blue-400", bg: "bg-blue-500/10", glow: "shadow-blue-500/20" };
    if (score >= 0) return { stroke: "#f59e0b", text: "text-amber-400", bg: "bg-amber-500/10", glow: "shadow-amber-500/20" };
    return { stroke: "#ef4444", text: "text-red-400", bg: "bg-red-500/10", glow: "shadow-red-500/20" };
  };

  const color = getColor();
  const dims = size === "sm" ? 120 : size === "md" ? 180 : 240;
  const strokeWidth = size === "sm" ? 8 : size === "md" ? 10 : 14;
  const radius = (dims - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - normalized);

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${color.glow} shadow-2xl rounded-full`} style={{ width: dims, height: dims }}>
        <svg width={dims} height={dims} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={radius}
            fill="none"
            stroke="rgba(100,116,139,0.15)"
            strokeWidth={strokeWidth}
          />
          {/* Score arc */}
          <motion.circle
            cx={dims / 2}
            cy={dims / 2}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={animate ? { strokeDashoffset: circumference } : { strokeDashoffset }}
            animate={{ strokeDashoffset }}
            transition={{ type: "spring", stiffness: 60, damping: 15, delay: 0.2 }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`${color.text} font-bold ${
              size === "sm" ? "text-2xl" : size === "md" ? "text-4xl" : "text-5xl"
            }`}
            initial={animate ? { opacity: 0, scale: 0.5 } : {}}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            {score}
          </motion.span>
          <span className={`text-slate-500 ${size === "sm" ? "text-[10px]" : "text-xs"} mt-0.5`}>
            / {maxScore}
          </span>
        </div>
      </div>
      {showLabel && (
        <div className="text-center mt-3">
          <span className={`text-sm font-medium ${color.text}`}>
            SPRS Score
          </span>
          <div className="text-slate-500 text-xs mt-0.5">{percentage}% of maximum</div>
        </div>
      )}
    </div>
  );
}
