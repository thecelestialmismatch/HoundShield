'use client';

import { motion } from 'framer-motion';
import TasksBoard from '@/components/dashboard/tasks-board';
import { SampleDataNotice } from '@/components/dashboard/SampleDataNotice';

/**
 * `TasksBoard` renders a hardcoded `SAMPLE_TASKS` set and issues no request.
 * Remediation tasks are the surface an operator would most reasonably assume is
 * their own — an invented one implies work is tracked that nobody is doing.
 */
export default function TasksPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SampleDataNotice surface="remediation board" />
      <TasksBoard />
    </motion.div>
  );
}
