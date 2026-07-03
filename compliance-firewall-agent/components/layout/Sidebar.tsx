'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Shield,
  FileText,
  Activity,
  Settings,
  Users,
  BookOpen,
  ChevronRight,
} from 'lucide-react'

interface NavEntry {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string
}

const NAV_ENTRIES: NavEntry[] = [
  { label: 'Dashboard',    href: '/command-center',                  icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Shield',       href: '/command-center/shield',           icon: <Shield className="w-4 h-4" /> },
  { label: 'CMMC Coverage',href: '/command-center/shield/coverage',  icon: <FileText className="w-4 h-4" />, badge: 'NEW' },
  { label: 'Live Feed',    href: '/command-center/feed',             icon: <Activity className="w-4 h-4" /> },
  { label: 'Team',         href: '/command-center/team',             icon: <Users className="w-4 h-4" /> },
  { label: 'Knowledge',    href: '/command-center/knowledge',        icon: <BookOpen className="w-4 h-4" /> },
  { label: 'Settings',     href: '/command-center/settings',         icon: <Settings className="w-4 h-4" /> },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="sidebar-arctic flex flex-col"
      style={{ width: 240 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-[var(--hs-border-subtle)] shrink-0">
        <div
          className="group/brand w-7 h-7 rounded-md overflow-hidden bg-white"
          style={{ boxShadow: 'var(--shadow-logo)' }}
        >
          <Image
            src="/houndshield-logo.png"
            alt="HoundShield"
            width={28}
            height={28}
            className="logo-img w-full h-full object-cover"
          />
        </div>
        <span className="font-semibold text-[var(--hs-ink)] text-sm font-[var(--font-body)]">
          HoundShield
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ENTRIES.map((entry) => {
          const active = pathname === entry.href || pathname.startsWith(entry.href + '/')
          return (
            <Link
              key={entry.href}
              href={entry.href}
              className={`nav-item ${active ? 'nav-item-active' : ''}`}
            >
              {entry.icon}
              <span className="flex-1 font-[var(--font-body)]">{entry.label}</span>
              {entry.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--hs-steel)] text-white font-[var(--font-body)]">
                  {entry.badge}
                </span>
              )}
              {active && <ChevronRight className="w-3 h-3 opacity-40" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[var(--hs-border-subtle)] shrink-0">
        <p className="text-[10px] text-[var(--hs-ink-tertiary)] font-[var(--font-body)]">
          Local-only · Data never leaves your network
        </p>
      </div>
    </aside>
  )
}
