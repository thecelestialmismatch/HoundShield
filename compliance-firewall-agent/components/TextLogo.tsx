import React from "react";

interface TextLogoProps {
  className?: string;
  /**
   * `dark` = renders on a dark surface (white wordmark).
   * `light` = renders on a light/cream surface (ink wordmark).
   * Both refer to the *surface* the logo sits on (matches the v3 reference,
   * which exposed a `dark` boolean for the surface).
   */
  variant?: "light" | "dark";
}

/**
 * Wordmark: single-word "HoundShield" set in Fraunces serif.
 *
 * Mirrors the v3 reference where the nav rendered:
 *   fontFamily: 'Fraunces, Georgia, serif'
 *   fontWeight: 400
 *   fontSize:   17
 *   letterSpacing: -0.015em
 * We keep that look but route through Tailwind so theming/responsive sizing stays consistent.
 */
export function TextLogo({ className = "", variant = "light" }: TextLogoProps) {
  const color = variant === "dark" ? "text-white" : "text-ink-primary";
  return (
    <span
      className={`font-display font-normal tracking-tight leading-none ${color} ${className}`}
      style={{ letterSpacing: "-0.015em" }}
    >
      HoundShield
    </span>
  );
}
