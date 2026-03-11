'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardCheck,
  SearchX,
  FileBarChart,
  Settings,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/shieldready', icon: LayoutDashboard },
  { label: 'Assessment', href: '/shieldready/assessment', icon: ClipboardCheck },
  { label: 'Gap Analysis', href: '/shieldready/gaps', icon: SearchX },
  { label: 'Reports', href: '/shieldready/reports', icon: FileBarChart },
  { label: 'Settings', href: '/shieldready/settings', icon: Settings },
] as const;

export default function ShieldReadyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#0c0c10]">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/[0.06] bg-[#111116]/80 backdrop-blur-xl">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2.5 border-b border-white/[0.06] px-5">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
          <span className="text-lg font-semibold tracking-tight text-white">
            ShieldReady
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === '/shieldready'
                ? pathname === '/shieldready'
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] ${
                    isActive
                      ? 'text-emerald-400'
                      : 'text-white/30 group-hover:text-white/60'
                  }`}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Back to main app */}
        <div className="border-t border-white/[0.06] p-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white/70"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Kaelus
          </Link>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────── */}
      <main className="ml-64 flex-1">
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
