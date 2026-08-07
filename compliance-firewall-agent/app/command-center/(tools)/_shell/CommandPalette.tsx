"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { NAV_ITEMS, type NavItem } from "./nav";

/**
 * ⌘K navigation over the same 23 destinations the sidebar renders.
 *
 * The affordance was already on screen and had been for months: the sidebar
 * showed a search field with a `K` keycap hint. It was a `<div>` with
 * `cursor-pointer`, no handler, no tab stop and no keyboard binding — it looked
 * like the product's search and did nothing. This makes the promise true rather
 * than removing it, because with 23 destinations behind three collapsible
 * sections the palette is genuinely the fastest way to move.
 *
 * It reads `NAV_ITEMS`, the same array the sidebar reads. No second list, no new
 * data source, no dependency: a palette that drifts from the nav is how a
 * destination becomes reachable from one and not the other.
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  // The panel is a separate component that only exists while the palette is
  // open, so its query and highlight start fresh on every mount. The obvious
  // alternative — keeping the state up here and clearing it in an effect on
  // `open` — is a setState-in-effect cascade, and React's own guidance is to
  // reset state by remounting instead. A palette that reopens showing the last
  // search also just feels stale.
  if (!open) return null;
  return <PalettePanel onClose={onClose} />;
}

function PalettePanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV_ITEMS;
    return NAV_ITEMS.filter(
      (i) => i.label.toLowerCase().includes(q) || i.href.toLowerCase().includes(q),
    );
  }, [query]);

  // Derived, not synchronised. As the results narrow the stored highlight can
  // point past the end; clamping at read time keeps Enter firing on something
  // that exists without a second render pass.
  const active = highlight >= results.length ? 0 : highlight;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const setActive = setHighlight;

  const go = (item: NavItem | undefined) => {
    if (!item) return;
    onClose();
    router.push(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (results.length === 0 ? 0 : (a + 1) % results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (results.length === 0 ? 0 : (a - 1 + results.length) % results.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-[12vh]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the Command Center"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--hs-border-ink)] bg-[var(--hs-surface-0)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--hs-border-ink)] px-4 py-3">
          <Search className="w-4 h-4 text-slate-500 flex-shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the Command Center…"
            aria-label="Search the Command Center"
            aria-controls="cc-palette-results"
            className="w-full bg-transparent text-sm text-[var(--hs-ink)] placeholder:text-slate-500 focus:outline-none"
          />
          <kbd className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-slate-500 font-mono flex-shrink-0">
            esc
          </kbd>
        </div>

        <ul id="cc-palette-results" role="listbox" className="max-h-[50vh] overflow-y-auto py-1.5">
          {results.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-500">
              No destination matches “{query}”.
            </li>
          )}
          {results.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(item)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-left text-[13px] transition-colors ${
                    i === active
                      ? "bg-brand-500/10 text-brand-400"
                      : "text-[var(--hs-ink-secondary)] hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span className="flex-1 truncate">{item.label}</span>
                  <span className="font-mono text-[10px] text-slate-500 truncate">{item.href}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/**
 * Binds ⌘K / Ctrl+K globally.
 *
 * Separate from the component so the listener lives for the life of the shell
 * rather than only while the palette is mounted — otherwise the shortcut that
 * opens it would only work once it was already open.
 */
export function usePaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpen();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onOpen]);
}
