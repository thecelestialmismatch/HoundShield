"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { ParticleField } from "@/components/landing/ParticleField";
import { PostHogProvider } from "@/components/PostHogProvider";

/**
 * Client-side shell that wraps the app with ThemeProvider,
 * PostHog analytics, and the WebGL ParticleField background.
 */
export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      <ThemeProvider>
        <ParticleField />
        {children}
      </ThemeProvider>
    </PostHogProvider>
  );
}
