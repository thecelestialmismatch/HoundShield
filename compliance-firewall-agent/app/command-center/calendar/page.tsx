'use client';

import { motion } from 'framer-motion';
import CalendarView from '@/components/dashboard/calendar-view';

export default function CalendarPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <CalendarView />
    </motion.div>
  );
}
