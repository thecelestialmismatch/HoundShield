'use client';

import { motion } from 'framer-motion';
import { ThreatTimeline } from '@/components/dashboard/threat-timeline';

export default function TimelinePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ThreatTimeline />
    </motion.div>
  );
}
