'use client';

import { motion } from 'framer-motion';
import { LiveScanner } from '@/components/dashboard/live-scanner';

export default function ScannerPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <LiveScanner />
    </motion.div>
  );
}
