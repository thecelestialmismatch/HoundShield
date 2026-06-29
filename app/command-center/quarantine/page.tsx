'use client';

import { motion } from 'framer-motion';
import { QuarantinePanel } from '@/components/dashboard/quarantine-panel';

export default function QuarantinePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <QuarantinePanel />
    </motion.div>
  );
}
