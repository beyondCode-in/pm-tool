"use client";

import { motion } from "motion/react";

// Each view fades and rises in when you switch to it.
export default function ViewTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div className="flex min-h-0 min-w-0 flex-1 flex-col" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}
