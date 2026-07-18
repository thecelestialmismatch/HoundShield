/**
 * Control Map sidebar — the navigation shell.
 *
 * Mirrors the reference IA (Dashboard · Clients · Frameworks · Controls ·
 * Assessments · Evidence · Reports · Settings) but every item resolves to a
 * REAL destination — in-page anchors for the sections that live on this screen,
 * and existing command-center routes for the rest. No dead links.
 */
'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Shield,
  ListChecks,
  ClipboardCheck,
  FileText,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from '@/components/Logo';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  /** true = in-page anchor on this dashboard; false = app route. */
  local: boolean;
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '#top', local: true },
  { id: 'clients', label: 'Clients', icon: Users, href: '#clients', local: true },
  { id: 'frameworks', label: 'Frameworks', icon: Shield, href: '#frameworks', local: true },
  { id: 'controls', label: 'Controls', icon: ListChecks, href: '#controls', local: true },
  { id: 'assessments', label: 'Assessments', icon: ClipboardCheck, href: '/command-center/shield/assessment', local: false },
  { id: 'evidence', label: 'Evidence', icon: FileText, href: '/command-center/events', local: false },
  { id: 'reports', label: 'Reports', icon: BarChart3, href: '/command-center/shield/reports', local: false },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/command-center/settings', local: false },
];

export function Sidebar({ activeId = 'dashboard' }: { activeId?: string }) {
  return (
    <aside className="hidden md:flex w-[236px] flex-shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.015]">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-white/[0.06] px-5">
        <Logo variant="dark" size={26} />
        <div className="flex flex-col leading-none">
          <span className="font-editorial text-[15px] font-semibold text-white">Control Map</span>
          <span className="mt-0.5 text-[9px] font-mono uppercase tracking-[0.14em] text-slate-500">
            MSP Console
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV.map(({ id, label, icon: Icon, href, local }) => {
            const active = id === activeId;
            const cls = `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
              active
                ? 'bg-brand-500/[0.12] text-white'
                : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
            }`;
            const inner = (
              <>
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand-400" />
                )}
                <Icon
                  className={`h-[18px] w-[18px] flex-shrink-0 ${
                    active ? 'text-brand-300' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <span className="flex-1 truncate">{label}</span>
              </>
            );
            return (
              <li key={id}>
                {local ? (
                  <a href={href} className={cls} aria-current={active ? 'page' : undefined}>
                    {inner}
                  </a>
                ) : (
                  <Link href={href} className={cls}>
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer status */}
      <div className="border-t border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-slate-500">Local scan · &lt;10ms</span>
        </div>
      </div>
    </aside>
  );
}
