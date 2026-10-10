"use client";

import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

// A spotlight tour: dims the page, cuts a glowing hole around one element
// (found by data-tour="…") and explains it. Steps whose element isn't on
// screen are skipped, so the tour works on any page and on phones.
export type TourStep = { target: string; title: string; text: string };

export const TOUR: TourStep[] = [
  { target: "new", title: "Ask for anything", text: "Start here. Pick what you need, write a sentence, and it becomes a ticket on the board. Shortcut: C." },
  { target: "nav", title: "Your views", text: "My work shows your tickets. Inbox holds new ones waiting for triage. Board, Sprint and Backlog are for planning." },
  { target: "filters", title: "Find anything fast", text: "Search and filter by type, priority, people or tags. The link updates, so you can share exactly what you see." },
  { target: "search", title: "Jump anywhere", text: "Press Ctrl K to open any ticket or view, or create something, without touching the mouse." },
  { target: "guide", title: "Help is always here", text: "Open the guide any time for tips, shortcuts and this tour." },
];

const PAD = 8;

export function Tour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const steps = TOUR;

  const locate = useCallback((from: number, dir: 1 | -1) => {
    for (let k = from; k >= 0 && k < steps.length; k += dir) {
      const el = document.querySelector<HTMLElement>(`[data-tour="${steps[k].target}"]`);
      const r = el?.getBoundingClientRect();
      if (el && r && r.width > 0 && r.height > 0) {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        setI(k);
        setRect(el.getBoundingClientRect());
        return true;
      }
    }
    return false;
  }, [steps]);

  const next = () => { if (!locate(i + 1, 1)) onClose(); };

  // Open → find the first visible step; follow resizes while open.
  useEffect(() => {
    if (!open) return;
    const start = requestAnimationFrame(() => { if (!locate(0, 1)) onClose(); });
    const onResize = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${steps[i]?.target}"]`);
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(start); window.removeEventListener("resize", onResize); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") locate(i - 1, -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const step = steps[i];
  const below = rect ? rect.bottom + 200 < window.innerHeight : true;
  const left = rect ? Math.min(Math.max(16, rect.left), window.innerWidth - 336) : 16;

  return (
    <AnimatePresence>
      {open && rect && step && (
        <motion.div key="tour" className="fixed inset-0 z-[100]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          role="dialog" aria-modal aria-labelledby="tour-title">
          <button className="absolute inset-0 cursor-default" aria-label="Close tour" onClick={onClose} />
          <motion.div aria-hidden className="pointer-events-none absolute rounded-2xl ring-2 ring-primary"
            animate={{ left: rect.left - PAD, top: rect.top - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            style={{ boxShadow: "0 0 0 9999px color-mix(in oklch, black 55%, transparent), 0 0 40px 4px color-mix(in oklch, var(--primary) 55%, transparent)" }} />
          <motion.div className="absolute w-80 rounded-2xl border bg-popover p-5 text-popover-foreground shadow-2xl"
            animate={{ left, top: below ? rect.bottom + PAD + 12 : rect.top - PAD - 12, y: below ? 0 : "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}>
            <p className="text-xs font-medium text-primary">Step {i + 1} of {steps.length}</p>
            <h2 id="tour-title" className="mt-1 text-base font-semibold">{step.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            <div className="mt-4 flex items-center gap-1.5">
              {steps.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"}`} />)}
              <div className="ml-auto flex gap-1.5">
                <Button size="sm" variant="ghost" onClick={onClose}>Skip</Button>
                <Button size="sm" onClick={next} autoFocus>{i === steps.length - 1 ? "Finish" : "Next"}</Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
