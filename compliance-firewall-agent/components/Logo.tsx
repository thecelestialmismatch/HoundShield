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

export function Logo({ className = "", size = 38, variant }: LogoProps) {
  const toneClass = variant === "dark" ? "logo-on-dark" : "logo-img dark:invert";
  return (
    <Image
      src="/houndshield-logo.png"
      alt=""
      aria-hidden="true"
      width={Math.round(size * WIDTH_RATIO)}
      height={size}
      className={`${toneClass} flex-shrink-0 object-contain ${className}`}
    />
  );
}
