"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useId } from "react";

// A segmented control with a sliding indicator — one look for every
// "Group by", "Swimlanes", "Zoom" and filter switch in the app.
export function Segmented<T extends string>({ value, onChange, options, label, size = "sm", className }: {
  value: T; onChange: (v: T) => void; options: readonly (readonly [T, string])[]; label: string; size?: "xs" | "sm"; className?: string;
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label}
      className={cn("inline-flex shrink-0 items-center gap-0.5 rounded-xl border bg-muted/60 p-0.5", className)}>
      {options.map(([v, l]) => {
        const on = v === value;
        return (
          <button key={v} role="radio" aria-checked={on} onClick={() => onChange(v)}
            className={cn("relative rounded-[9px] font-medium whitespace-nowrap transition-colors",
              size === "xs" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-[13px]",
              on ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {on && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-[9px] bg-card shadow-card ring-1 ring-border" transition={{ type: "spring", stiffness: 520, damping: 38 }} aria-hidden />}
            <span className="relative">{l}</span>
          </button>
        );
      })}
    </div>
  );
}
