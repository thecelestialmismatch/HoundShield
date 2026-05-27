"use client";

import { useEffect } from "react";
import { NavV3 } from "./NavV3";
import { FooterV3 } from "./FooterV3";

interface PublicShellProps {
  children: React.ReactNode;
  /** Hide footer (rare — e.g. system pages). */
  noFooter?: boolean;
  /** Hide nav (rare — e.g. auth pages). */
  noNav?: boolean;
}

/**
 * Wraps every public page. Single source of truth for nav + footer + hover affordances.
 * Sets --mx/--my CSS variables globally so every .spotlight section reacts to cursor identically.
 */
export function PublicShell({ children, noFooter = false, noNav = false }: PublicShellProps) {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--my", `${e.clientY}px`);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div
      className="min-h-screen font-body"
      style={{ background: "var(--hs-surface-0)", color: "var(--hs-ink)" }}
    >
      {!noNav && <NavV3 />}
      <main style={{ paddingTop: noNav ? 0 : 64 }}>{children}</main>
      {!noFooter && <FooterV3 />}
    </div>
  );
}
