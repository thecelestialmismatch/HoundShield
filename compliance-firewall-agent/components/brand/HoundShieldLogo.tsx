import Image from "next/image";
import Link from "next/link";

interface HoundShieldLogoProps {
  /** Pixel size of the square mark. Defaults to 36. */
  size?: number;
  /** Show the "HoundShield" wordmark next to the mark. Defaults to true. */
  showWordmark?: boolean;
  /** Wrap in a Link to "/". Defaults to true. */
  asLink?: boolean;
  className?: string;
}

export function HoundShieldLogo({
  size = 36,
  showWordmark = true,
  asLink = true,
  className = "",
}: HoundShieldLogoProps) {
  const content = (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`}
      style={{ lineHeight: 1 }}
    >
      <Image
        src="/houndshield-logo.png"
        alt="HoundShield"
        width={size}
        height={size}
        priority
        style={{ display: "block", flexShrink: 0 }}
      />
      {showWordmark && (
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "1.1rem",
            letterSpacing: "-0.01em",
            color: "var(--hs-ink)",
          }}
        >
          HoundShield
        </span>
      )}
    </span>
  );

  return asLink ? (
    <Link href="/" aria-label="HoundShield home" style={{ textDecoration: "none" }}>
      {content}
    </Link>
  ) : (
    content
  );
}
