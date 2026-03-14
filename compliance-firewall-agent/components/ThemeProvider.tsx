"use client";

// Consolidated theme provider — uses the custom Kaelus implementation
// which manages localStorage + data-theme attribute directly.
// This file re-exports from theme-provider.tsx for backward compatibility.
export { ThemeProvider, useTheme } from "@/components/theme-provider";
