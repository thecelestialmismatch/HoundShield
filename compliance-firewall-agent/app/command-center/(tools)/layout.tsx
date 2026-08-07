"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DemoBanner } from "@/components/ui/demo-banner";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { Sidebar } from "./_shell/Sidebar";
import { Topbar } from "./_shell/Topbar";
import { CommandPalette, usePaletteShortcut } from "./_shell/CommandPalette";

/**
 * The shell every one of the 23 Command Center pages renders inside.
 *
 * Split into `_shell/` on 2026-08-07. The single file had reached 427 lines
 * before the responsive drawer and the ⌘K palette landed, which would have put
 * it well past the repo's 500-line component rule. `_shell` is underscore-
 * prefixed so Next.js treats it as private — it is a folder of components, never
 * a route, and the "nothing escapes the tool shell" guard in
 * `dashboard-auth-gate.test.ts` still holds.
 *
 * The guards that grep this shell now read `layout.tsx` + `_shell/*` as ONE
 * source via `app/__tests__/helpers/shell-source.ts`, so the invariants they
 * encode (the customer's company not a build badge, sign-out present, no
 * indigo, every nav href resolving to a real page) survived the split intact
 * and will survive the next one.
 *
 * This file is now composition only: state, the three regions, and the layout
 * arithmetic that keeps them aligned as the sidebar changes width.
 *
 * Access was decided upstream by the fail-closed gate in
 * `app/command-center/layout.tsx`, the parent of this route group. Nothing here
 * is a security control.
 */
export default function CommandCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Desktop rail width. Pre-existing feature, persisted nowhere by design.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Off-canvas drawer, below `lg` only. Distinct from `sidebarCollapsed`: a
  // phone always gets the full labelled drawer, never a 68px icon rail.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const demoMode = !isSupabaseConfigured();

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const openPalette = useCallback(() => {
    setMobileNavOpen(false);
    setPaletteOpen(true);
  }, []);

  usePaletteShortcut(openPalette);

  return (
    <div className="cc-light min-h-screen bg-[var(--hs-surface-1)] text-[var(--hs-ink)] font-sans">
      {/* Keyboard users land here first. With 23 nav destinations ahead of the
          content, tabbing to the page itself was a 30-stop journey on every
          navigation. */}
      <a
        href="#cc-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[80] focus:rounded-lg focus:bg-[var(--hs-surface-0)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--hs-ink)] focus:ring-2 focus:ring-brand-500"
      >
        Skip to main content
      </a>

      {/* Subtle background mesh (steel + warm cream haze — matches /console) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[40%] rounded-full bg-brand-400/[0.06] blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] h-[50%] w-[35%] rounded-full bg-[rgba(243,227,208,0.4)] blur-[120px]" />
      </div>

      {/* Scrim. Below `lg` only — on desktop the rail is permanent furniture and
          must never be dimmed behind an overlay. */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeMobileNav}
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={mobileNavOpen}
        onCloseMobile={closeMobileNav}
        onOpenPalette={openPalette}
      />
      <Topbar
        sidebarCollapsed={sidebarCollapsed}
        onOpenMobileNav={() => setMobileNavOpen(true)}
      />

      {/* Demo mode banner — fixed below topbar, above content */}
      <div
        className={`fixed top-14 right-0 left-0 z-40 transition-all duration-300 ${
          sidebarCollapsed ? "lg:left-[68px]" : "lg:left-[260px]"
        }`}
      >
        <DemoBanner show={demoMode} />
      </div>

      <main
        id="cc-main"
        className={`relative z-10 min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-[260px]"
        } ${demoMode ? "pt-[88px]" : "pt-14"}`}
      >
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
