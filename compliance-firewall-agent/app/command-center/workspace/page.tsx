'use client';

import { motion } from 'framer-motion';
import AgentWorkspace from '@/components/dashboard/agent-workspace';

export default function WorkspacePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <AgentWorkspace />
    </motion.div>
  );
}
