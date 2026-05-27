import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: number;
  /**
   * When true (default), wraps the mark in a soft cream card —
   * matches the v3 reference embed style.
   */
  card?: boolean;
  /**
   * Surface variant. `"light"` (default) renders the cream card unchanged.
   * `"dark"` swaps the card to a translucent slate surface so the mark
   * still reads on dark navbars/footers. Accepted for back-compat with
   * callers that pass `variant` down from the parent Navbar.
   */
  variant?: "light" | "dark";
}

/**
 * Brand mark: doberman + shield image inside a soft rounded card.
 *
 * Reference: HoundShield Landing v3 (`Logo({ size, dark })`) which used
 * `borderRadius: size * 0.12`, a light backing surface, and `objectFit: contain`.
 * We translate the JSX-style inline embed into a Next.js `<Image>` so the
 * file stays statically optimized.
 */
export function Logo({
  className = "",
  size = 32,
  card = true,
  variant = "light",
}: LogoProps) {
  const radius = Math.round(size * 0.18);
  const inner = Math.round(size * 0.78);
  const pad = Math.round((size - inner) / 2);

  if (!card) {
    return (
      <Image
        src="/houndshield-logo.png"
        alt="HoundShield"
        width={size}
        height={size}
        priority
        className={`flex-shrink-0 object-contain ${className}`}
        style={{ borderRadius: radius }}
      />
    );
  }

  const cardSurface =
    variant === "dark"
      ? "bg-white/10 ring-1 ring-white/15 shadow-card"
      : "bg-cream-100 ring-1 ring-cream-300/60 shadow-card";

  return (
    <span
      className={`inline-flex items-center justify-center flex-shrink-0 ${cardSurface} ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        padding: pad,
      }}
      aria-hidden="false"
    >
      <Image
        src="/houndshield-logo.png"
        alt="HoundShield"
        width={inner}
        height={inner}
        priority
        className="object-contain"
        style={{ borderRadius: Math.round(radius * 0.6) }}
      />
    </span>
  );
}
