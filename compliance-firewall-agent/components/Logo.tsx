import Image from "next/image";

interface LogoProps {
    className?: string;
    size?: number;
    /** "dark" = white logo on dark bg; "light" = black logo on light bg; "auto" = CSS invert via dark class */
    variant?: "dark" | "light" | "auto";
}

export function Logo({ className = "", size = 32, variant = "auto" }: LogoProps) {
    const filterClass =
        variant === "dark" ? "invert" :
        variant === "light" ? "" :
        "dark:invert";

    return (
        <Image
            src="/houndshield-logo.png"
            alt="Hound Shield"
            width={size}
            height={size}
            className={`flex-shrink-0 ${filterClass} ${className}`}
            priority
        />
    );
}
