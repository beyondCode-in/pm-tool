"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { addReminder, allReminders, closeReminder, completeReminder, markFired, quickTimes, snoozeReminder, useReminderDraft } from "@/lib/reminders";
import { useOpenTicket } from "@/lib/url-state";
import { useBoard } from "@/lib/data";
import { cleanTitle } from "../ticket/bits";
import { cn } from "@/lib/utils";
import { Alarm as AlarmClock } from "@phosphor-icons/react";
import { format } from "date-fns";
import { useEffect, useEffectEvent, useState } from "react";
import { toast } from "sonner";

const localInput = (d: Date) => `${format(d, "yyyy-MM-dd")}T${format(d, "HH:mm")}`;
const tile = <span className="toast-tile" aria-hidden><AlarmClock size={18} weight="fill" /></span>;

// The "R" dialog: what, when, and (optionally) which ticket.
export function ReminderDialog() {
  const draft = useReminderDraft();
  const { data: board } = useBoard();
  const linked = draft?.ticket ? board?.tickets.find((t) => t.number === draft.ticket) : undefined;
  return (
    <Dialog open={!!draft} onOpenChange={(o: boolean) => { if (!o) closeReminder(); }}>
      <DialogContent className="sm:max-w-md">
        {draft && <ReminderForm key={JSON.stringify(draft)} ticket={linked ? draft.ticket : undefined} ticketTitle={draft.ticketTitle ?? (linked ? cleanTitle(linked.title) : undefined)} />}
      </DialogContent>
    </Dialog>
  );
}

function ReminderForm({ ticket, ticketTitle }: { ticket?: number; ticketTitle?: string }) {
  const quick = quickTimes();
  const [text, setText] = useState(ticketTitle ? `Follow up on #${ticket}` : "");
  const [when, setWhen] = useState(() => (quick[1] ?? quick[0]).at.getTime());
  const [custom, setCustom] = useState(false);
  const [linked, setLinked] = useState(!!ticket);
  const save = () => {
    if (!text.trim() || when <= Date.now()) return;
    addReminder({ text: text.trim(), at: new Date(when).toISOString(), ...(linked && ticket ? { ticket, ticketTitle } : {}) });
    // Ask once, at a moment the person chose to set a reminder.
    if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
    toast.success("Reminder set", { description: `${format(new Date(when), "EEE d MMM, h:mm a")} · ${text.trim()}` });
    closeReminder();
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><AlarmClock weight="duotone" className="size-5 text-primary" />New reminder</DialogTitle>
        <DialogDescription>Press R anywhere to set one. It pops up here when it&apos;s due.</DialogDescription>
      </DialogHeader>
      <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Remind me to…" aria-label="Reminder"
        className="h-11 w-full rounded-xl border bg-background px-3 text-base outline-none focus:border-ring" />
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">When</p>
        <div className="flex flex-wrap gap-1.5">
          {quick.map((q) => (
            <button key={q.label} type="button" onClick={() => { setWhen(q.at.getTime()); setCustom(false); }} aria-pressed={!custom && when === q.at.getTime()}
              className={cn("rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors", !custom && when === q.at.getTime() ? "border-primary/50 bg-accent text-accent-foreground ring-2 ring-primary/15" : "bg-card text-muted-foreground hover:text-foreground")}>
              {q.label}
            </button>
          ))}
          <button type="button" onClick={() => setCustom(true)} aria-pressed={custom}
            className={cn("rounded-lg border px-2.5 py-1.5 text-xs font-medium", custom ? "border-primary/50 bg-accent text-accent-foreground ring-2 ring-primary/15" : "bg-card text-muted-foreground hover:text-foreground")}>
            Pick a time…
          </button>
        </div>
        {custom && (
          <input type="datetime-local" aria-label="Reminder time" value={localInput(new Date(when))} min={localInput(new Date())}
            onChange={(e) => { const t = new Date(e.target.value).getTime(); if (!Number.isNaN(t)) setWhen(t); }}
            className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring" />
        )}
        <p className="mt-2 text-xs text-muted-foreground">{format(new Date(when), "EEEE d MMMM, h:mm a")}</p>
      </div>
      {ticket && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={linked} onChange={(e) => setLinked(e.target.checked)} className="size-4 accent-[var(--primary)]" />
          Link to #{ticket} {ticketTitle && <span className="truncate text-muted-foreground">{ticketTitle}</span>}
        </label>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={closeReminder}>Cancel</Button>
        <Button type="submit" disabled={!text.trim()}>Set reminder</Button>
      </div>
    </form>
  );
}

// Checks every 20 seconds and when the tab comes back into view; shows due
// reminders once, with Done / Snooze / Open.
export function ReminderRunner() {
  const [, open] = useOpenTicket();
  const fire = useEffectEvent(() => {
    const now = Date.now();
    for (const r of allReminders()) {
      if (r.done || r.fired || new Date(r.at).getTime() > now) continue;
      markFired(r.id);
      toast(r.text, {
        icon: tile, duration: Infinity,
        description: r.ticket ? `Reminder · #${r.ticket}${r.ticketTitle ? ` ${r.ticketTitle}` : ""}` : "Reminder",
        action: { label: "Done", onClick: () => completeReminder(r.id) },
        cancel: r.ticket ? { label: "Open", onClick: () => { completeReminder(r.id); void open(r.ticket!); } } : { label: "Snooze 1h", onClick: () => snoozeReminder(r.id, 60) },
      });
      if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.visibilityState !== "visible") {
        try { new Notification("Reminder", { body: r.text, tag: r.id }); } catch { /* some browsers need a service worker */ }
      }
    }
  });
  useEffect(() => {
    fire();
    const id = setInterval(fire, 20_000);
    const onVis = () => { if (document.visibilityState === "visible") fire(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  return null;
}
