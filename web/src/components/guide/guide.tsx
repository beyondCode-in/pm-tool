"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CHECKLIST, markDone, useOnboarding } from "@/lib/onboarding";
import { useNewTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { Check, Compass, Keyboard, Lightbulb, Sparkles } from "@/components/icons";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Tour } from "./tour";

// Tips for whichever view is open.
const TIPS: Record<string, string[]> = {
  "/board": ["Drag a card to another column to change its stage.", "Use Swimlanes → People to see who's overloaded.", "Columns turn red when they're over their limit."],
  "/sprint": ["Only tickets in the current sprint appear here.", "Plan the next sprint from the Backlog, grouped by Sprint."],
  "/backlog": ["Click any cell to edit it in place.", "Group by Sprint and watch the points total per sprint."],
  "/my-work": ["Overdue tickets are listed first.", "Open a ticket and press a status pill to move it."],
  "/inbox": ["Set an owner and priority, then remove the triage tag.", "Customer requests are grouped at the top."],
  "/roadmap": ["Bars use start and due dates, or the ticket's sprint.", "Zoom out to Quarter to see the big picture."],
  "/calendar": ["Drag a ticket to a day to change its due date.", "Drag it to 'No due date' to clear the date."],
  "/epics": ["Progress fills in as child tickets are closed.", "Add a parent issue number to a ticket to nest it."],
  "/dashboard": ["The dashed line is the even pace for the sprint.", "Click anything in 'Needs attention' to open it."],
};

const SHORTCUTS: [string, string][] = [["C", "New ticket"], ["/", "Search"], ["Ctrl K", "Jump anywhere"], ["G B", "Go to Board"], ["?", "All shortcuts"]];

export function Guide() {
  const [open, setOpen] = useState(false);
  const [touring, setTouring] = useState(false);
  const done = useOnboarding();
  const pathname = usePathname() ?? "";
  const [, newTicket] = useNewTicket();
  const tips = Object.entries(TIPS).find(([k]) => pathname.startsWith(k))?.[1] ?? [];
  const count = CHECKLIST.filter((c) => done.has(c.id)).length;
  const pct = Math.round((count / CHECKLIST.length) * 100);

  // First visit: offer the tour once, gently.
  useEffect(() => {
    if (done.size) return;
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTour = () => { setOpen(false); setTimeout(() => setTouring(true), 150); };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger data-tour="guide" aria-label="Open the guide"
          render={
            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              className="glow fixed right-4 bottom-20 z-40 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground md:right-6 md:bottom-6" />
          }>
          <Sparkles className="size-5" />
          {count < CHECKLIST.length && (
            <span className="absolute -top-0.5 -right-0.5 grid size-5 place-items-center rounded-full border-2 border-background bg-foreground text-[10px] font-bold text-background">
              {CHECKLIST.length - count}
            </span>
          )}
        </PopoverTrigger>
        <PopoverContent side="top" align="end" sideOffset={12} className="w-80 overflow-hidden p-0">
          <div className="relative overflow-hidden border-b bg-gradient-to-br from-[var(--brand-from)] to-[var(--brand-to)] p-4 text-white">
            <p className="flex items-center gap-1.5 text-sm font-semibold"><Compass className="size-4" />Guide</p>
            <p className="mt-0.5 text-xs text-white/80">Getting started · {pct}% done</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/25"><motion.div className="h-full rounded-full bg-white" animate={{ width: `${pct}%` }} /></div>
          </div>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4">
            <ul className="space-y-1.5" aria-label="Getting started">
              {CHECKLIST.map((c) => {
                const ok = done.has(c.id);
                const act = c.id === "tour" ? startTour : c.id === "create" ? () => { setOpen(false); void newTicket("pick"); } : undefined;
                return (
                  <li key={c.id}>
                    <button disabled={!act} onClick={act} className={cn("flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1 text-left text-sm", act && "hover:bg-muted")}>
                      <span className={cn("grid size-5 place-items-center rounded-full border transition-colors", ok && "border-success bg-success text-white")}>{ok && <Check className="size-3" />}</span>
                      <span className={cn(ok && "text-muted-foreground line-through")}>{c.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {tips.length > 0 && (
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold"><Lightbulb className="size-3.5 text-warning" />On this page</p>
                <ul className="space-y-1 text-xs leading-relaxed text-muted-foreground">{tips.map((t) => <li key={t}>• {t}</li>)}</ul>
              </div>
            )}
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold"><Keyboard className="size-3.5" />Shortcuts</p>
              <div className="grid grid-cols-2 gap-1">
                {SHORTCUTS.map(([k, l]) => (
                  <span key={k} className="flex items-center gap-2 text-xs text-muted-foreground"><kbd className="min-w-7 rounded border bg-background px-1 text-center font-mono text-[10px] text-foreground">{k}</kbd>{l}</span>
                ))}
              </div>
            </div>
            <Button className="w-full" variant="outline" onClick={startTour}><Compass />Take the tour</Button>
          </div>
        </PopoverContent>
      </Popover>
      <Tour open={touring} onClose={() => { setTouring(false); markDone("tour"); }} />
    </>
  );
}
