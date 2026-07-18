/**
 * BottomTabBar — the mobile bottom navigation from the reference.
 *
 * Mobile-only (hidden ≥ md, where the full dashboard is already in view). Three
 * in-page section anchors plus a CTA to the $499 report — the revenue action
 * the whole ROI story exists to justify. Active state is tracked client-side on
 * tap so the bar gives real feedback; the Report tab is a real route, not an
 * anchor.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, PiggyBank, TrendingUp, FileText } from 'lucide-react';

const ANCHORS = [
  { id: 'top', label: 'Overview', icon: LayoutGrid, href: '#top' },
  { id: 'savings', label: 'Savings', icon: PiggyBank, href: '#savings' },
  { id: 'trend', label: 'Trend', icon: TrendingUp, href: '#trend' },
] as const;

export function BottomTabBar() {
  const [active, setActive] = useState<string>('top');

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-white/[0.08] bg-[#0a0b11]/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Dashboard sections"
    >
      {ANCHORS.map(({ id, label, icon: Icon, href }) => {
        const on = active === id;
        return (
          <a
            key={id}
            href={href}
            onClick={() => setActive(id)}
            aria-current={on ? 'true' : undefined}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
              on ? 'text-brand-200' : 'text-slate-500'
            }`}
          >
            <Icon className={`h-5 w-5 ${on ? 'text-brand-300' : 'text-slate-500'}`} />
            {label}
          </a>
        );
      })}
      <Link
        href="/assessment"
        className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold text-emerald-300"
      >
        <FileText className="h-5 w-5" />
        Report
      </Link>
    </nav>
  );
}
