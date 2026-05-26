'use client'

import dynamic from 'next/dynamic'

const PlatformDashboard = dynamic(
  () => import('./PlatformDashboard').then(m => ({ default: m.PlatformDashboard })),
  { ssr: false }
)

export function PlatformDashboardClient() {
  return <PlatformDashboard />
}
