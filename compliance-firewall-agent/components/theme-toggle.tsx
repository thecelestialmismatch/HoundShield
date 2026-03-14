"use client";

import { useTheme } from "@/components/theme-provider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-100 dark:bg-slate-800 dark:border-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 dark:text-slate-700 dark:text-slate-300 dark:hover:text-slate-900"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <>
          <Sun className="w-4 h-4 text-amber-400" strokeWidth={2} />
          <span className="text-[11px] font-semibold tracking-wide">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-blue-600" strokeWidth={2} />
          <span className="text-[11px] font-semibold tracking-wide">Dark</span>
        </>
      )}
    </button>
  );
}
