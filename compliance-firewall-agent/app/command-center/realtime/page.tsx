'use client';

import { motion } from 'framer-motion';
import { RealtimeFeed } from '@/components/dashboard/realtime-feed';

export default function RealtimePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <RealtimeFeed />
    </motion.div>
  );
}
