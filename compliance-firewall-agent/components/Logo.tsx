import Image from "next/image";

interface LogoProps {
    className?: string;
    size?: number;
    /** Kept for backward compat — visual is now handled by circular container, not CSS filter */
    variant?: "dark" | "light" | "auto";
}

export function Logo({ className = "", size = 36 }: LogoProps) {
    return (
        <div
            className={`rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 bg-[#0F1E2E] ${className}`}
            style={{ width: size, height: size }}
        >
            <Image
                src="/houndshield-logo.png"
                alt="HoundShield"
                width={size}
                height={size}
                className="object-cover"
                priority
            />
        </div>
    );
}
