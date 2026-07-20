import type { Metadata } from 'next';
import { RoiDashboard } from '@/components/dashboard/roi/RoiDashboard';

export const metadata: Metadata = {
  title: 'Compliance ROI — Value Protected by HoundShield',
  description:
    'The dollars-saved view: prevented CUI, PHI, PII and secret-leak incidents turned into a defensible ROI figure against NIST 800-171, scanned locally on customer infrastructure. The number that justifies the $499 report.',
  // Internal/partner console preview — kept out of the index like /console and /control-map.
  robots: { index: false, follow: false },
};

/**
 * /roi — the "Compliance ROI" console.
 *
 * Self-contained dark dashboard (own header + mobile tab bar). RootLayout adds
 * no marketing chrome here, so it renders full-bleed. The RoiDashboard is
 * SSR-safe (pure inline SVG, no Recharts), so no `dynamic(ssr:false)` wrapper
 * is needed.
 */
export default function RoiPage() {
  return <RoiDashboard />;
}
