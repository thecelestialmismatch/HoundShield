"use client";

import { motion } from "framer-motion";

interface SPRSGaugeProps {
  score: number;
  maxScore?: number;
  minScore?: number;
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

  const getColor = () => {
    if (score >= 90)
      return { stroke: "#10b981", text: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200" };
    if (score >= 50)
      return { stroke: "#2563eb", text: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-200" };
    if (score >= 0)
      return { stroke: "#f59e0b", text: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200" };
    return { stroke: "#ef4444", text: "text-rose-600", bg: "bg-rose-50", ring: "ring-rose-200" };
  };

  const color = getColor();
  const dims = size === "sm" ? 120 : size === "md" ? 180 : 240;
  const strokeWidth = size === "sm" ? 8 : size === "md" ? 10 : 14;
  const radius = (dims - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - normalized);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative rounded-full"
        style={{ width: dims, height: dims }}
      >
        <svg width={dims} height={dims} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={radius}
            fill="none"
            stroke="rgba(226,232,240,0.6)"
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
            className={`${color.text} font-display font-bold ${
              size === "sm" ? "text-2xl" : size === "md" ? "text-4xl" : "text-5xl"
            }`}
            initial={animate ? { opacity: 0, scale: 0.5 } : {}}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            {score}
          </motion.span>
          <span className={`text-slate-600 dark:text-slate-400 ${size === "sm" ? "text-[10px]" : "text-xs"} mt-0.5`}>
            / {maxScore}
          </span>
        </div>
      </div>
      {showLabel && (
        <div className="text-center mt-3">
          <span className={`text-sm font-semibold ${color.text}`}>SPRS Score</span>
          <div className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">{percentage}% of maximum</div>
        </div>
      )}
    </div>
  );
}
