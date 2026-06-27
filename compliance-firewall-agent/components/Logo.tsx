import Image from "next/image";

/** Intrinsic aspect ratio of the Doberman shield mark (1236 × 1607). */
const WIDTH_RATIO = 1236 / 1607;

interface LogoProps {
  className?: string;
  /** Rendered height in px; width derives from the mark's aspect ratio. */
  size?: number;
  /**
   * Tone of the mark, chosen explicitly per surface — never inferred from the
   * ambient theme. `"dark"` paints the mark white (for dark surfaces);
   * anything else renders the native dark mark (for light surfaces).
   *
   * This is deterministic on purpose. The old `dark:invert` utility keyed off
   * the `.dark` class, which `theme-provider` toggles from the visitor's *system*
   * theme — so a dark-OS visitor on a light marketing page got a white mark on a
   * white background (invisible). Tone is now a property of the surface, not the OS.
   */
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
  // Pointer hover (desktop) on the mark itself or a parent `group/brand` link.
  "hover:[transform:rotate(-4deg)_scale(1.06)] " +
  "group-hover/brand:[transform:rotate(-4deg)_scale(1.06)] " +
  // Touch/tap (mobile): :active fires while a finger is down, so the mark
  // still animates where :hover never triggers.
  "active:[transform:rotate(-4deg)_scale(1.06)] " +
  "group-active/brand:[transform:rotate(-4deg)_scale(1.06)] " +
  "motion-reduce:transition-none " +
  "motion-reduce:hover:[transform:none] motion-reduce:active:[transform:none] " +
  "motion-reduce:group-hover/brand:[transform:none] motion-reduce:group-active/brand:[transform:none]";

export function Logo({ className = "", size = 38, variant }: LogoProps) {
  const toneClass = variant === "dark" ? "logo-on-dark" : "logo-img";
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
