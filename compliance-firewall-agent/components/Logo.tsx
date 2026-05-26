import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = "", size = 32 }: LogoProps) {
  return (
    <Image
      src="/houndshield-logo.png"
      alt="HoundShield"
      width={size}
      height={size}
      priority
      className={`flex-shrink-0 ${className}`}
    />
  );
}
