'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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
  { label: 'Resources', href: '/shieldready/resources', icon: Settings },
  { label: 'Onboarding', href: '/shieldready/onboarding', icon: Settings },
] as const;

export default function ShieldReadyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#0c0c10] text-slate-300 font-sans selection:bg-emerald-500/30">
      {/* ── Background Glow Effects ─────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full bg-emerald-900/20 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] h-[60%] w-[40%] rounded-full bg-teal-900/10 blur-[150px]" />
      </div>

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/[0.04] bg-[#111116]/60 backdrop-blur-2xl transition-all duration-300">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2.5 border-b border-white/[0.04] px-5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
            <ShieldCheck className="h-5 w-5" />
            <div className="absolute inset-0 block rounded-lg shadow-[0_0_12px_rgba(16,185,129,0.3)]" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white/90">
            ShieldReady
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1.5 px-3 py-6">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === '/shieldready'
                ? pathname === '/shieldready'
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20'
                    : 'text-white/50 hover:bg-white/[0.03] hover:text-white/80'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavBackground"
                    className="absolute inset-0 rounded-lg bg-emerald-500/5"
                    initial={false}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon
                  className={`relative z-10 h-[18px] w-[18px] transition-colors duration-300 ${
                    isActive
                      ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                      : 'text-white/30 group-hover:text-white/60'
                  }`}
                />
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Back to main app */}
        <div className="border-t border-white/[0.04] p-4">
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/40 transition-all duration-300 hover:bg-white/[0.03] hover:text-white/70"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Kaelus
          </Link>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────── */}
      <main className="relative z-10 ml-64 flex-1">
        <div className="mx-auto max-w-[1400px] px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
