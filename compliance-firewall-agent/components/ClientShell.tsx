"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { ParticleField } from "@/components/landing/ParticleField";

/**
 * Client-side shell that wraps the app with ThemeProvider
 * and renders the WebGL ParticleField background.
 * ParticleField guards all WebGL work inside useEffect,
 * so it's safe during SSR (renders an empty canvas).
 */
export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ParticleField />
      {children}
    </ThemeProvider>
  );
}
