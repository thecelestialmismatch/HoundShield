"use client";

import { useEffect, useState } from "react";

interface LiveCounterProps {
  /** Initial count; seeded so it doesn't reset every render. */
  seed?: number;
  /** Tick interval in ms. Defaults to 4200. */
  intervalMs?: number;
  className?: string;
}

/** Animated red-dot pill showing intercept count. Ticks +1..+3 every ~4s. */
export function LiveCounter({ seed = 14363, intervalMs = 4200, className = "" }: LiveCounterProps) {
  const [count, setCount] = useState(seed);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 3) + 1);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${className}`}
      style={{
        borderColor: "var(--hs-border-subtle)",
        borderWidth: 1,
        borderStyle: "solid",
        background: "rgba(255,90,90,0.06)",
        color: "#9A2D2D",
        fontVariantNumeric: "tabular-nums",
      }}
      aria-live="polite"
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#E14B4B",
          animation: "hs-live-pulse 1.6s ease-out infinite",
          flexShrink: 0,
        }}
      />
      {count.toLocaleString()} intercepted
      <style jsx>{`
        @keyframes hs-live-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(225, 75, 75, 0.55);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(225, 75, 75, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(225, 75, 75, 0);
          }
        }
      `}</style>
    </span>
  );
}
