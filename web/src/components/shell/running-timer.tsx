"use client";

import { Button } from "@/components/ui/button";
import { useBoard } from "@/lib/data";
import { fmtElapsed, stopTimer, useTicketExtras, useTimer } from "@/lib/ticket-extras";
import { useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { Pause, X } from "@/components/icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cleanTitle } from "../ticket/bits";

// ClickUp's global timer: while a timer runs it stays in view on every page,
// ticking, with stop-and-log and discard. One timer at a time per browser.
export function RunningTimer({ compact }: { compact?: boolean }) {
  const running = useTimer();
  const { data: board } = useBoard();
  const extras = useTicketExtras();
  const [, open] = useOpenTicket();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const ticket = running && board?.tickets.find((t) => t.number === running.ticket);
  const elapsed = running ? now - running.startedAt : 0;
  const stop = async () => {
    if (!running) return;
    const minutes = Math.max(1, Math.round((Date.now() - running.startedAt) / 60000));
    stopTimer();
    if (board && ticket) await extras.logTime(board, ticket, minutes, "timer");
    else toast.error(`#${running.ticket} isn't on this board any more, so the time wasn't logged.`);
  };
  const discard = () => { if (running) { stopTimer(); toast(`Timer on #${running.ticket} discarded`, { description: "Nothing was logged." }); } };

  return (
    <AnimatePresence initial={false}>
      {running && (
        <motion.div key="timer" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          {compact ? (
            <Button size="icon" variant="outline" onClick={() => void stop()} aria-label={`Stop the timer on #${running.ticket} (${fmtElapsed(elapsed)}) and log it`} title={`#${running.ticket} · ${fmtElapsed(elapsed)} · click to stop and log`}
              className="relative mx-auto flex size-10 border-destructive/40 text-destructive">
              <span className="timer-dot absolute top-1 right-1" aria-hidden /><Pause />
            </Button>
          ) : (
            <div role="status" aria-live="off" className="timer-bar flex items-center gap-2 rounded-xl border px-2.5 py-2">
              <span className="timer-dot shrink-0" aria-hidden />
              <button onClick={() => void open(running.ticket)} className="min-w-0 flex-1 text-left" title="Open the ticket">
                <span className="block text-[15px] leading-tight font-semibold tabular">{fmtElapsed(elapsed)}</span>
                <span className="block truncate text-[11px] text-muted-foreground">#{running.ticket} {cleanTitle(ticket ? ticket.title : running.title)}</span>
              </button>
              <Button size="icon-xs" variant="ghost" aria-label="Discard the timer without logging" title="Discard" onClick={discard} className="text-muted-foreground"><X /></Button>
              <Button size="icon-sm" onClick={() => void stop()} aria-label="Stop and log the time" title="Stop and log"
                className={cn("bg-destructive text-white hover:bg-destructive/90")}><Pause /></Button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
