'use client';

import { motion } from 'framer-motion';
import { PixelOffice } from '@/components/dashboard/pixel-office/pixel-office';

export default function PixelOfficePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PixelOffice />
    </motion.div>
  );
}
