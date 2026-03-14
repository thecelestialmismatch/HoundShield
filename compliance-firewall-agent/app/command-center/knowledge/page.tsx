'use client';

import { motion } from 'framer-motion';
import KnowledgeBase from '@/components/dashboard/knowledge-base';

export default function KnowledgePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <KnowledgeBase />
    </motion.div>
  );
}
