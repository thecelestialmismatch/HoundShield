import React from "react";

interface TextLogoProps {
  className?: string;
  variant?: "light" | "dark";
}

export function TextLogo({ className = "", variant = "light" }: TextLogoProps) {
  const houndGradient =
    variant === "dark"
      ? "from-brand-300 to-brand-500"
      : "from-brand-700 to-brand-500";
  const shieldColor = variant === "dark" ? "text-white/90" : "text-slate-900";

  return (
    <span
      className={`text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r ${houndGradient} transition-all duration-300 ${className}`}
    >
      Hound
      <span className={`${shieldColor} font-bold`}> Shield</span>
    </span>
  );
}
