"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { PostHogProvider } from "@/components/PostHogProvider";
import { CursorGlow } from "@/components/CursorGlow";
import { CookieConsent } from "@/components/CookieConsent";

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      <ThemeProvider>
        <CursorGlow />
        {children}
        <CookieConsent />
      </ThemeProvider>
    </PostHogProvider>
  );
}
