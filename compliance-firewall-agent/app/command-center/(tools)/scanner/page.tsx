'use client';

import { motion } from 'framer-motion';
import { LocalScanPanel } from '@/components/scan/LocalScanPanel';

/**
 * Command Center → Scanner.
 *
 * This page used to render `LiveScanner`, which POSTed the customer's pasted
 * text to `/api/scan` — and from there to Bytez and Google Gemini. On a product
 * sold to organisations handling CUI and PHI, the one place a logged-in
 * customer was invited to paste a real prompt was the one place it left their
 * machine. Even with those API keys unset the text still reached the Vercel
 * plane, which CLAUDE.md records as NOT the CUI data path and not
 * FedRAMP-authorized.
 *
 * It now runs the same in-browser engine as the public demo. No `commerce` —
 * a paying customer does not need to be sold the thing they already bought.
 */
export default function ScannerPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <LocalScanPanel
        theme="dark"
        surface="/command-center/scanner"
        heading="Local prompt scanner"
        intro="Paste any prompt, code or message before it goes to an AI tool. It is scanned here, on this machine, against every shipped detection pattern — and the panel below measures that nothing left."
      />
    </motion.div>
  );
}
