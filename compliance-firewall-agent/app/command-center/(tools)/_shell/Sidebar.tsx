"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, Search, Settings, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { TextLogo } from "@/components/TextLogo";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { NAV_SECTIONS, isNavItemActive } from "./nav";
import { useQuarantineCount } from "./useQuarantineCount";
import { useViewer, dashboardLabel } from "./useViewer";

/**
 * The Command Center sidebar — a fixed rail on desktop, an off-canvas drawer
 * below `lg`.
 *
 * WHY THE DRAWER EXISTS: until 2026-08-07 this shell declared no breakpoints at
 * all. A grep for `sm:|md:|lg:|xl:` across the whole 427-line layout returned
 * nothing. The rail was `fixed w-[260px]` and `<main>` was `ml-[260px]`
 * unconditionally, so on a 375px phone the content column was 115px wide — 67px
 * after `p-6` — on every one of the 23 pages, with no way to dismiss it. The
 * panels inside were responsive the whole time (13 media queries in
 * `lccStyles.ts`); they were reflowing correctly inside a column too narrow to
 * read. `app/__tests__/dashboard-responsive-contract.test.ts` guards this.
 *
 * The desktop collapse (68px icon rail) is a separate, pre-existing feature and
 * is untouched: `collapsed` is the desktop width, `mobileOpen` is the drawer.
 * They compose — a phone always gets the full 260px labelled drawer, because a
 * 68px icon-only rail on a touch screen is a worse answer than no rail.
 */
export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  onOpenPalette,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenPalette: () => void;
}) {
  const pathname = usePathname();
  const asideRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sectionId = useId();
  const quarantineCount = useQuarantineCount();
  const { name } = useViewer();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Firewall: true,
    "CMMC Shield": true,
    Response: true,
  });

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Navigating closes the drawer. Without this the operator taps a destination,
  // the page changes behind the overlay, and the drawer is still covering it.
  useEffect(() => {
    if (mobileOpen) onCloseMobile();
    // Intentionally keyed on pathname alone: this fires on navigation, not on
    // every render where onCloseMobile happens to be a new closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Escape closes, and focus moves into the drawer when it opens — the two
  // things that separate a dialog from a div that happens to be on top.
  useEffect(() => {
    if (!mobileOpen) return;

    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseMobile();
        return;
      }
      if (e.key !== "Tab") return;

      // Minimal focus trap. The drawer covers the page on a phone, so Tab
      // escaping into the content behind it strands keyboard and screen-reader
      // users on invisible controls.
      const focusables = asideRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const width = collapsed ? "lg:w-[68px]" : "lg:w-[260px]";

  return (
    <aside
      ref={asideRef}
      /* Drawer semantics apply only while it is overlaying the page. On desktop
         it is permanent furniture, and announcing permanent furniture as a
         modal dialog is worse than announcing nothing. */
      {...(mobileOpen ? { role: "dialog" as const, "aria-modal": true } : {})}
      aria-label="Command Center navigation"
      className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[var(--hs-surface-1)] border-r border-[var(--hs-border-ink)] transition-transform duration-300 lg:transition-all ${width} ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
    >
      {/* Brand — aspect-correct dark-on-light Doberman mark (no forced square
          box), tilts on hover via the shared group/brand rule. */}
      <div className="flex h-16 items-center gap-2.5 border-b border-[var(--hs-border-ink)] px-4">
        <Link href="/" className="flex items-center gap-2.5 group group/brand">
          <Logo size={34} />
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <TextLogo className="text-lg" />
              <span className="text-[10px] text-[var(--hs-ink-tertiary)] -mt-0.5 tracking-wider uppercase">
                Command Center
              </span>
            </motion.div>
          )}
        </Link>

        {/* Drawer dismiss. Only reachable below `lg`, where the drawer is the
            thing covering the page. */}
        <button
          ref={closeRef}
          type="button"
          onClick={onCloseMobile}
          className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors lg:hidden"
        >
          <X className="w-4 h-4" aria-hidden="true" />
          <span className="sr-only">Close navigation</span>
        </button>
      </div>

      {/* Search — a real control that opens the ⌘K palette.
          It was a <div> with cursor-pointer, no handler, and no tab stop: it
          looked like the product's search and did nothing when clicked. */}
      {!collapsed && (
        <div className="px-3 py-3">
          <button
            type="button"
            onClick={onOpenPalette}
            className="w-full flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-400 hover:border-white/20 focus-visible:border-white/30 transition-colors"
          >
            <Search className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Search…</span>
            <kbd className="ml-auto text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-slate-500 font-mono">
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav aria-label="Command Center" className="flex-1 overflow-y-auto px-2 py-2">
        {NAV_SECTIONS.map((section) => {
          const SectionIcon = section.icon;
          const isExpanded = expandedSections[section.label];
          const panelId = `${sectionId}-${section.label.replace(/\s+/g, "-")}`;

          return (
            <div key={section.label} className="mb-1">
              <button
                type="button"
                onClick={() => !collapsed && toggleSection(section.label)}
                aria-expanded={collapsed ? undefined : isExpanded}
                aria-controls={collapsed ? undefined : panelId}
                className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors ${
                  collapsed ? "lg:justify-center" : ""
                }`}
              >
                <SectionIcon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{section.label}</span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`w-3 h-3 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                    />
                  </>
                )}
              </button>

              <AnimatePresence initial={false}>
                {(isExpanded || collapsed) && (
                  <motion.div
                    id={panelId}
                    initial={collapsed ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {section.items.map(({ id, label: staticLabel, icon: Icon, href, count, personalize }) => {
                      const isActive = isNavItemActive(href, pathname);
                      // "Sam's Dashboard" once /api/me answers; the static
                      // "Your Dashboard" until then and whenever there is no
                      // name. Never an invented stand-in.
                      const label = personalize ? dashboardLabel(name, staticLabel) : staticLabel;
                      // Only ever a real number, and only when there is
                      // something to act on. Null (loading, failed, demo) and
                      // zero both render nothing — see useQuarantineCount.
                      const badge =
                        count === "quarantine" && quarantineCount !== null && quarantineCount > 0
                          ? String(quarantineCount)
                          : null;

                      return (
                        <Link
                          key={id}
                          href={href}
                          aria-current={isActive ? "page" : undefined}
                          className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
                            collapsed ? "lg:justify-center" : ""
                          } ${
                            isActive
                              ? "bg-brand-500/10 text-brand-400"
                              : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                          }`}
                          title={collapsed ? label : undefined}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="sidebarActive"
                              aria-hidden="true"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-brand-500"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                          )}
                          <Icon
                            aria-hidden="true"
                            className={`w-4 h-4 flex-shrink-0 transition-colors ${
                              isActive
                                ? "text-brand-500"
                                : "text-slate-500 group-hover:text-slate-300"
                            }`}
                          />
                          {!collapsed && (
                            <>
                              <span className="flex-1 truncate">{label}</span>
                              {badge && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20">
                                  {badge}
                                  <span className="sr-only"> items awaiting review</span>
                                </span>
                              )}
                            </>
                          )}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/*
        Pinned footer — always the last thing in the rail, never a nav row.

        It was already last in the DOM and `nav` already carries `flex-1`, so it
        measured flush to the viewport bottom (900px of a 900px viewport). What
        it did NOT do was LOOK pinned: the 23-item nav scrolls (1012px of content
        in 625px), so the list cut off mid-section directly above a hairline, and
        Settings read as simply the next item after whatever the scroll happened
        to end on.

        `mt-auto` makes the intent explicit rather than emergent, and the
        stronger surface + shadow separates the footer from the scrolling list so
        it reads as chrome. The fade above the border tells the operator the nav
        continues — nothing is missing, it scrolls.
      */}
      <div className="relative mt-auto flex-shrink-0 border-t border-[var(--hs-border-ink)] bg-[var(--hs-surface-1)] p-3 space-y-1 shadow-[0_-8px_16px_-12px_rgba(15,30,46,0.18)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-6 right-0 left-0 h-6 bg-gradient-to-t from-[var(--hs-surface-1)] to-transparent"
        />
        <Link
          href="/command-center/settings"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors"
        >
          <Settings className="w-4 h-4" aria-hidden="true" />
          {!collapsed && <span>Settings</span>}
        </Link>
        {/* A dashboard the customer cannot leave is a trust smell. The Live
            Command Center has had a sign-out since PR #205; this shell never
            did, which only became visible once the subtree was actually gated. */}
        {/* Collapsed = icon only. `text-[0px]` zeroes the label's box without
            removing it from the accessibility tree (a lucide <svg> sizes from
            its own width/height, not font-size), so the button keeps its
            accessible name when the rail is narrow. */}
        <SignOutButton
          className={`w-full flex items-center rounded-lg px-3 py-2 text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors [&>svg]:w-4 [&>svg]:h-4 [&>svg]:flex-shrink-0 ${
            collapsed ? "lg:justify-center lg:gap-0 lg:text-[0px] gap-2.5 text-[13px]" : "gap-2.5 text-[13px]"
          }`}
        />
        {/* Desktop-only: collapsing to a 68px icon rail is meaningless on a
            phone, where the whole drawer is already off-canvas. */}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="hidden lg:flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors"
        >
          <Menu className="w-4 h-4" aria-hidden="true" />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
