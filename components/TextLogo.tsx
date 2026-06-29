import React from "react";

export function TextLogo({ className = "", variant = "light" }: { className?: string; variant?: "light" | "dark" }) {
  return (
    <span className={`font-black tracking-tight leading-none ${className}`}>
      <span className={variant === "dark" ? "text-white" : "text-[#1A3347]"}>Hound</span>
      <span className={`font-bold ${variant === "dark" ? "text-white/80" : "text-slate-600"}`}> Shield</span>
    </span>
  );
}
