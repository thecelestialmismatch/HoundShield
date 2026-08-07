'use client';

import { motion } from 'framer-motion';
import TeamView from '@/components/dashboard/team-view';
import { SampleDataNotice } from '@/components/dashboard/SampleDataNotice';

/**
 * `TeamView` renders a hardcoded `AGENTS` roster and issues no request, so every
 * signed-in customer sees the same invented colleagues. Until it reads the real
 * `profiles` table it has to say so — see SampleDataNotice.
 */
export default function TeamPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SampleDataNotice surface="team roster" />
      <TeamView />
    </motion.div>
  );
}
