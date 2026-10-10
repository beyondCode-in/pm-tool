"use client";

import { draggable, dropTargetForElements, monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Button } from "@/components/ui/button";
import { isDone, today } from "@/lib/board";
import { useActions } from "@/lib/data";
import type { Ticket } from "@/lib/types";
import { useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { cleanTitle, TypeIcon } from "../ticket/bits";

const iso = (d: Date) => format(d, "yyyy-MM-dd");

export function CalendarView({ tickets }: { tickets: Ticket[] }) {
  const actions = useActions();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const days = useMemo(() => eachDayOfInterval({ start: startOfWeek(month, { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) }), [month]);
  const byDay = useMemo(() => {
    const m = new Map<string, Ticket[]>();
    for (const t of tickets) { const d = t.fields["Target date"]; if (d) m.set(d, [...(m.get(d) ?? []), t]); }
    return m;
  }, [tickets]);
  const unscheduled = tickets.filter((t) => !t.fields["Target date"] && !isDone(t));
  const onDrop = useEffectEvent((number: unknown, day: string | undefined) => {
    const t = tickets.find((x) => x.number === number);
    if (t && day !== undefined) void actions.setField(t, "Target date", day || null);
  });
  useEffect(() => monitorForElements({
    onDrop({ source, location }) { onDrop(source.data.ticket, location.current.dropTargets[0]?.data.day as string | undefined); },
  }), []);

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">{format(month, "MMMM yyyy")}</h2>
          <Button variant="outline" size="icon-sm" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft /></Button>
          <Button variant="outline" size="icon-sm" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight /></Button>
          <Button variant="ghost" size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>Today</Button>
          <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">Drag a ticket to a day to change its due date.</span>
        </div>
        <div className="grid grid-cols-7 border-b text-xs font-medium text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="px-2 py-1.5">{d}</div>)}
        </div>
        <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-7 overflow-auto rounded-b-xl border-x border-b">
          {days.map((d) => <Day key={iso(d)} date={d} inMonth={isSameMonth(d, month)} tickets={byDay.get(iso(d)) ?? []} />)}
        </div>
      </div>
      <aside className="hidden w-64 shrink-0 flex-col lg:flex" aria-label="No due date">
        <h3 className="mb-2 text-sm font-semibold">No due date <span className="font-normal text-muted-foreground">{unscheduled.length}</span></h3>
        <DropZone day="" className="flex-1 space-y-1.5 overflow-auto rounded-xl border border-dashed p-2">
          {unscheduled.map((t) => <Chip key={t.number} t={t} />)}
          {!unscheduled.length && <p className="p-3 text-center text-xs text-muted-foreground">Everything open has a date.</p>}
        </DropZone>
      </aside>
    </div>
  );
}

function DropZone({ day, className, children }: { day: string; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    return dropTargetForElements({ element: ref.current, getData: () => ({ day }), onDragEnter: () => setOver(true), onDragLeave: () => setOver(false), onDrop: () => setOver(false) });
  }, [day]);
  return <div ref={ref} className={cn(className, over && "bg-accent ring-2 ring-inset ring-primary/40")}>{children}</div>;
}

function Day({ date, inMonth, tickets }: { date: Date; inMonth: boolean; tickets: Ticket[] }) {
  const isToday = iso(date) === today();
  return (
    <DropZone day={iso(date)} className={cn("min-h-24 border-t border-r p-1 last:border-r-0 [&:nth-child(7n)]:border-r-0", !inMonth && "bg-muted/40")}>
      <div className={cn("mb-1 inline-grid size-6 place-items-center rounded-full text-xs", isToday ? "bg-primary font-semibold text-primary-foreground" : inMonth ? "" : "text-muted-foreground")}>
        {format(date, "d")}
      </div>
      <div className="space-y-1">
        {tickets.slice(0, 4).map((t) => <Chip key={t.number} t={t} />)}
        {tickets.length > 4 && <p className="px-1 text-[11px] text-muted-foreground">+{tickets.length - 4} more</p>}
      </div>
    </DropZone>
  );
}

function Chip({ t }: { t: Ticket }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [, open] = useOpenTicket();
  useEffect(() => (ref.current ? draggable({ element: ref.current, getInitialData: () => ({ ticket: t.number }) }) : undefined), [t.number]);
  const overdue = !isDone(t) && t.fields["Target date"] && t.fields["Target date"] < today();
  return (
    <button ref={ref} onClick={() => void open(t.number)} title={`#${t.number} ${t.title}`}
      className={cn("flex w-full cursor-grab items-center gap-1 truncate rounded-md border bg-card px-1.5 py-0.5 text-left text-[11px] shadow-xs hover:shadow-sm",
        isDone(t) && "text-muted-foreground line-through", overdue && "border-destructive/50 bg-destructive/5")}>
      <TypeIcon ticket={t} /><span className="truncate">{cleanTitle(t.title)}</span>
    </button>
  );
}
