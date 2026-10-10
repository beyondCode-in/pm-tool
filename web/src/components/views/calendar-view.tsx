"use client";

import { draggable, dropTargetForElements, monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { byPriorityThenNumber, isDone, plain, today } from "@/lib/board";
import { useActions } from "@/lib/data";
import type { Ticket } from "@/lib/types";
import { useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isWeekend, startOfMonth, startOfWeek } from "date-fns";
import { CalendarX2, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { cleanTitle, TypeIcon } from "../ticket/bits";

const iso = (d: Date) => format(d, "yyyy-MM-dd");
const SHOWN_PER_DAY = 3;

// Priority → the chip's left edge colour (with the name in its tooltip, so
// colour is never the only signal).
const EDGE: Record<string, string> = { critical: "before:bg-red-500", high: "before:bg-orange-500", medium: "before:bg-amber-400", low: "before:bg-sky-500" };

export function CalendarView({ tickets }: { tickets: Ticket[] }) {
  const actions = useActions();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const days = useMemo(() => eachDayOfInterval({ start: startOfWeek(month, { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) }), [month]);
  const byDay = useMemo(() => {
    const m = new Map<string, Ticket[]>();
    for (const t of [...tickets].sort(byPriorityThenNumber)) {
      const d = t.fields["Target date"];
      if (d) m.set(d, [...(m.get(d) ?? []), t]);
    }
    return m;
  }, [tickets]);
  const unscheduled = tickets.filter((t) => !t.fields["Target date"] && !isDone(t)).sort(byPriorityThenNumber);
  const inMonth = tickets.filter((t) => t.fields["Target date"]?.startsWith(format(month, "yyyy-MM"))).length;

  const onDrop = useEffectEvent((number: unknown, day: string | undefined) => {
    const t = tickets.find((x) => x.number === number);
    if (t && day !== undefined && (t.fields["Target date"] ?? "") !== day) void actions.setField(t, "Target date", day || null);
  });
  useEffect(() => monitorForElements({
    onDrop({ source, location }) { onDrop(source.data.ticket, location.current.dropTargets[0]?.data.day as string | undefined); },
  }), []);

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-card shadow-card" aria-label={format(month, "MMMM yyyy")}>
        <header className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
          <h2 className="text-xl font-semibold">{format(month, "MMMM")} <span className="text-muted-foreground">{format(month, "yyyy")}</span></h2>
          <span className="text-xs text-muted-foreground tabular">{inMonth} due this month</span>
          <div className="ml-auto flex items-center rounded-lg border p-0.5">
            <Button variant="ghost" size="icon-sm" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft /></Button>
            <Button variant="ghost" size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>Today</Button>
            <Button variant="ghost" size="icon-sm" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight /></Button>
          </div>
        </header>
        <div className="grid grid-cols-7 border-b bg-muted/40 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="px-3 py-2">{d}</div>)}
        </div>
        <div className="grid min-h-0 flex-1 auto-rows-[minmax(7.5rem,1fr)] grid-cols-7 overflow-auto">
          {days.map((d, i) => (
            <Day key={iso(d)} date={d} inMonth={isSameMonth(d, month)} tickets={byDay.get(iso(d)) ?? []} lastCol={i % 7 === 6} />
          ))}
        </div>
      </section>

      <aside className="hidden w-72 shrink-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-card lg:flex" aria-label="No due date">
        <header className="flex items-center gap-2 border-b px-4 py-3">
          <CalendarX2 className="size-4 text-muted-foreground" aria-hidden />
          <h3 className="text-sm font-semibold">No due date</h3>
          <span className="ml-auto rounded-md bg-muted px-1.5 text-xs tabular text-muted-foreground">{unscheduled.length}</span>
        </header>
        <DropZone day="" className="flex-1 space-y-1.5 overflow-auto p-3">
          {unscheduled.map((t) => <Chip key={t.number} t={t} />)}
          {!unscheduled.length && <p className="p-4 text-center text-xs text-muted-foreground">Every open ticket has a date.</p>}
          <p className="pt-2 text-center text-[11px] text-muted-foreground">Drag a ticket onto a day to schedule it, or back here to clear its date.</p>
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
  return <div ref={ref} className={cn(className, "transition-colors", over && "bg-accent/70 ring-2 ring-inset ring-primary/50")}>{children}</div>;
}

function Day({ date, inMonth, tickets, lastCol }: { date: Date; inMonth: boolean; tickets: Ticket[]; lastCol: boolean }) {
  const isToday = iso(date) === today();
  const extra = tickets.length - SHOWN_PER_DAY;
  return (
    <DropZone day={iso(date)} className={cn("flex min-w-0 flex-col gap-1 border-b p-1.5", !lastCol && "border-r",
      !inMonth && "bg-muted/35", inMonth && isWeekend(date) && "bg-muted/20", isToday && "bg-accent/40")}>
      <div className="flex items-center justify-between px-1">
        <span className={cn("grid size-6 place-items-center rounded-full text-xs tabular",
          isToday ? "bg-primary font-semibold text-primary-foreground" : inMonth ? "font-medium" : "text-muted-foreground/60")}>
          {format(date, "d")}
        </span>
        {date.getDate() === 1 && <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{format(date, "MMM")}</span>}
      </div>
      {tickets.slice(0, SHOWN_PER_DAY).map((t) => <Chip key={t.number} t={t} />)}
      {extra > 0 && (
        <Popover>
          <PopoverTrigger className="rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            +{extra} more
          </PopoverTrigger>
          <PopoverContent className="w-64 space-y-1.5 p-2">
            <p className="px-1 pb-1 text-xs font-semibold">{format(date, "EEEE d MMMM")}</p>
            {tickets.map((t) => <Chip key={t.number} t={t} />)}
          </PopoverContent>
        </Popover>
      )}
    </DropZone>
  );
}

function Chip({ t }: { t: Ticket }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [, open] = useOpenTicket();
  useEffect(() => (ref.current ? draggable({ element: ref.current, getInitialData: () => ({ ticket: t.number }) }) : undefined), [t.number]);
  const overdue = !isDone(t) && !!t.fields["Target date"] && t.fields["Target date"] < today();
  const p = plain(t.fields.Priority).toLowerCase();
  return (
    <button ref={ref} onClick={() => void open(t.number)} title={`#${t.number} ${cleanTitle(t.title)}${p ? ` · ${plain(t.fields.Priority)} priority` : ""}${overdue ? " · overdue" : ""}`}
      className={cn("relative flex w-full min-w-0 cursor-grab items-center gap-1.5 overflow-hidden rounded-md border bg-background py-1 pr-1.5 pl-2.5 text-left text-xs shadow-card transition-[box-shadow,transform] hover:-translate-y-px hover:shadow-pop active:cursor-grabbing",
        "before:absolute before:inset-y-0 before:left-0 before:w-[3px]", EDGE[p] ?? "before:bg-border",
        isDone(t) && "text-muted-foreground line-through opacity-70", overdue && "border-destructive/40 bg-destructive/5")}>
      <TypeIcon ticket={t} />
      <span className="truncate font-medium">{cleanTitle(t.title)}</span>
    </button>
  );
}
