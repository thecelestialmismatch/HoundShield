import type { Metadata } from 'next'
import { LiveCommandCenter } from '@/components/dashboard/LiveCommandCenter'
import { WelcomeBanner } from '@/components/WelcomeBanner'

export const metadata: Metadata = {
  title: 'Live Command Center — HoundShield',
  description: 'HoundShield Live Command Center — real-time AI prompt interception, SPRS posture, CMMC assessment, and on-device Brain AI.',
  robots: { index: false, follow: false },
}

export default function ConsolePage() {
  return (
    <>
      <div className="px-4 pt-4 sm:px-6 lg:px-8">
        <WelcomeBanner />
      </div>
      <LiveCommandCenter />
    </>
  )
}
