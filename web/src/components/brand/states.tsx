"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

// One look for every "nothing here" moment: a glowing icon, a plain sentence,
// and the single action that fixes it.
export function EmptyState({ icon: Icon, title, text, action, className }: {
  icon: LucideIcon; title: string; text: string; action?: ReactNode; className?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("grid flex-1 place-items-center p-10 text-center", className)}>
      <div className="max-w-sm">
        <span className="relative mx-auto mb-5 grid size-16 place-items-center">
          <span className="absolute inset-0 rounded-3xl bg-primary/25 blur-xl" aria-hidden />
          <span className="relative grid size-16 place-items-center rounded-3xl border bg-card text-primary shadow-sm">
            <Icon className="size-7" aria-hidden />
          </span>
        </span>
        <p className="text-lg font-semibold tracking-tight">{title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
        {action && <div className="mt-5 flex justify-center gap-2">{action}</div>}
      </div>
    </motion.div>
  );
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex max-w-xl items-start gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-destructive/15 text-destructive"><AlertTriangle className="size-5" /></span>
      <div className="space-y-2">
        <p className="font-semibold">{title}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>
        {onRetry && <Button size="sm" variant="outline" onClick={onRetry}><RotateCcw />Try again</Button>}
      </div>
    </div>
  );
}
