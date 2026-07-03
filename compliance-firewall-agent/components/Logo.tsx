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
 * Brand-mark hover motion is NOT defined here. The shared `.logo-img` /
 * `.logo-on-dark` rule in `app/globals.css` owns it: on hover (own, parent
 * `group/brand`, or direct a/button parent) the mark tilts in place —
 * rotate(-4deg) scale(1.06), the approved Direction-A demo pose. Never add
 * per-component `[animation:…]` classes back onto the mark: a running
 * animation's keyframe transform overrides the hover pose in the cascade,
 * which is how the sideways-sway regression shipped.
 * Guard: app/__tests__/logo-motion-contract.test.ts
 */
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
      className={`${toneClass} flex-shrink-0 object-contain ${className}`}
    />
  );
}
