'use client';

import { motion } from 'framer-motion';
import { AIChat } from '@/components/dashboard/ai-chat';

export default function ChatPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <AIChat />
    </motion.div>
  );
}
