import Image from "next/image";

/** Intrinsic aspect ratio of the Doberman shield mark (1236 × 1607). */
const WIDTH_RATIO = 1236 / 1607;

interface LogoProps {
  className?: string;
  /** Rendered height in px; width derives from the mark's aspect ratio. */
  size?: number;
  /** "dark" forces the light (inverted) treatment for dark surfaces. */
  variant?: "light" | "dark";
}

/**
 * Brand-mark hover: rotates toward the cursor and scales up, matching the
 * approved Direction-A demo (`.brand:hover .brand-mark` → rotate(-4deg) scale(1.06)).
 * Triggers on the mark's own hover *and* on a parent `group/brand` link hover,
 * so it animates whether the logo stands alone or sits beside the wordmark.
 * `transform` (animation) and `filter` (dark-surface invert) are independent
 * CSS properties, so the tone treatments below coexist with the motion.
 */
const HOVER_MOTION =
  "transition-transform duration-300 ease-[cubic-bezier(.22,.61,.36,1)] " +
  "hover:[transform:rotate(-4deg)_scale(1.06)] " +
  "group-hover/brand:[transform:rotate(-4deg)_scale(1.06)] " +
  "motion-reduce:transition-none";

export function Logo({ className = "", size = 38, variant }: LogoProps) {
  const toneClass = variant === "dark" ? "logo-on-dark" : "logo-img dark:invert";
  return (
    <Image
      src="/houndshield-logo.png"
      alt=""
      aria-hidden="true"
      width={Math.round(size * WIDTH_RATIO)}
      height={size}
      className={`${toneClass} ${HOVER_MOTION} flex-shrink-0 object-contain ${className}`}
    />
  );
}
