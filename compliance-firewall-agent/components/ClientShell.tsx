"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { PostHogProvider } from "@/components/PostHogProvider";

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </PostHogProvider>
  );
}
