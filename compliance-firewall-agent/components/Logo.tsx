export function Logo({ className = "", size = 38, variant }: { className?: string; size?: number; variant?: "light" | "dark" }) {
  const colorClass = variant === "dark" ? "text-white" : "text-slate-900 dark:text-white";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="currentColor"
      className={`${colorClass} flex-shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16 31 Q3 24 3 18 L3 9 Q3 7 5 7 L8 7 L9.5 2 L12 7 Q14 5.5 16 5.5 Q18 5.5 20 7 L22.5 2 L24 7 L27 7 Q29 7 29 9 L29 18 Q29 24 16 31Z M8 15 L13 13.5 L13 14.5 L8 16Z M24 15 L19 13.5 L19 14.5 L24 16Z M9 18.5 Q12 16 14.5 17 Q14 20 11.5 20 Q9 19.5 9 18.5Z M23 18.5 Q20 16 17.5 17 Q18 20 20.5 20 Q23 19.5 23 18.5Z"
      />
    </svg>
  );
}
