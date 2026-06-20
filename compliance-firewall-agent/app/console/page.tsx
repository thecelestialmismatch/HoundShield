import type { Metadata } from 'next'
import { LiveCommandCenter } from '@/components/dashboard/LiveCommandCenter'

export const metadata: Metadata = {
  title: 'Live Command Center — HoundShield',
  description: 'HoundShield Live Command Center — real-time AI prompt interception, SPRS posture, CMMC assessment, and on-device Brain AI.',
  robots: { index: false, follow: false },
}

export default function ConsolePage() {
  return <LiveCommandCenter />
}
