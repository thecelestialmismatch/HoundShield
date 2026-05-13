'use client';

import { motion } from 'framer-motion';
import { EventTable } from '@/components/dashboard/event-table';

export default function EventsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <EventTable />
    </motion.div>
  );
}
