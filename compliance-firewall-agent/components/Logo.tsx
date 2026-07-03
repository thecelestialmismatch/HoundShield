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
const SWAY = "[animation:hs-logo-sway_.55s_ease-in-out_infinite]";
const HOVER_MOTION =
  // Pointer hover (desktop) on the mark itself or a parent `group/brand` link:
  // the mark sways side-to-side. Touch/tap (:active) triggers it on mobile too.
  `hover:${SWAY} group-hover/brand:${SWAY} active:${SWAY} group-active/brand:${SWAY} ` +
  "motion-reduce:[animation:none] " +
  "motion-reduce:hover:[animation:none] motion-reduce:active:[animation:none] " +
  "motion-reduce:group-hover/brand:[animation:none] motion-reduce:group-active/brand:[animation:none]";

export function Logo({ className = "", size = 36, variant }: LogoProps) {
  const toneClass = variant === "dark" ? "logo-on-dark" : "logo-img";
  return (
    <Image
      src="/houndshield-logo.png"
      alt=""
      aria-hidden="true"
      width={Math.round(size * WIDTH_RATIO)}
      height={size}
      // Inline height + auto width LOCKS the aspect ratio: the mark always
      // renders exactly `size` px tall on every surface, so a stray width
      // utility class (w-10, w-9, …) can never stretch or resize it. This is
      // the sanctioned inline-style exception (deterministic sizing).
      style={{ height: `${size}px`, width: "auto" }}
      className={`${toneClass} ${HOVER_MOTION} flex-shrink-0 object-contain ${className}`}
    />
  );
}
