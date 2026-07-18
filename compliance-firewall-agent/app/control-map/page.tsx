import type { Metadata } from 'next';
import { ControlMap } from '@/components/dashboard/control-map/ControlMap';

export const metadata: Metadata = {
  title: 'Control Map — MSP Compliance Console',
  description:
    'The multi-client CMMC Control Map — run NIST 800-171 posture, framework rollups, and mapped-control evidence across every client an RPO/MSP manages, scanned locally on customer infrastructure.',
  // Internal partner console preview — kept out of the index like /console.
  robots: { index: false, follow: false },
};

/**
 * /control-map — the multi-client CMMC command surface for RPO/MSP partners.
 *
 * Self-contained dark dashboard (own sidebar + topbar); the marketing chrome
 * lives elsewhere and RootLayout adds none, so this renders full-bleed. The
 * ControlMap component is SSR-safe (pure inline SVG, no Recharts), so no
 * `dynamic(ssr:false)` wrapper is needed.
 */
export default function ControlMapPage() {
  return <ControlMap />;
}
