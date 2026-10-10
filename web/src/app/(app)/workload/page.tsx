"use client";

import { ViewPage } from "@/components/shell/view-page";
import { Avatar, cleanTitle, TypeIcon } from "@/components/ticket/bits";
import { StatusIcon } from "@/components/ticket/status-icons";
import { Segmented } from "@/components/ui-plus/segmented";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDays, today } from "@/lib/board";
import type { Board, Ticket } from "@/lib/types";
import { useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { isWeekend, tone, workload, type Measure, type Row } from "@/lib/workload";
import { useWorkspace } from "@/lib/workspace";
import { ChevronLeft, ChevronRight, Settings } from "@/components/icons";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useState } from "react";

// Workload (ClickUp): people × days, each day a bar measured against the
// person's daily capacity (Settings → Workflow). Click a day for its tickets.

const monday = (iso: string) => addDays(iso, -((parseISO(iso).getDay() + 6) % 7));
const fmt = (n: number, m: Measure) => (m === "points" ? (Math.round(n * 10) / 10).toString() : String(Math.round(n)));
const TONE = {
  free: "bg-transparent",
  ok: "bg-emerald-500/70 dark:bg-emerald-400/60",
  near: "bg-amber-500/80 dark:bg-amber-400/70",
  over: "bg-destructive/85",
} as const;

export default function Page() {
  return (
    <ViewPage title="Workload" description="Who has how much, day by day, against their capacity.">
      {(board, tickets) => <Workload board={board} tickets={tickets} />}
    </ViewPage>
  );
}

function Workload({ board, tickets }: { board: Board; tickets: Ticket[] }) {
  const ws = useWorkspace();
  const [start, setStart] = useState(() => monday(today()));
  const [measure, setMeasure] = useState<Measure>("tickets");
  const days = Array.from({ length: 14 }, (_, i) => addDays(start, i));
  const cap = ws.capacity[measure];
  const rows = workload(board, tickets, days, measure);
  const person = (login: string | null) => (login ? board.people.find((p) => p.login === login) : null);
  // Everyone on the board gets a row, busiest first; unassigned work last.
  const all: Row[] = [
    ...board.people.map((p) => rows.find((r) => r.login === p.login) ?? { login: p.login, days: Object.fromEntries(days.map((d) => [d, { load: 0, tickets: [] }])), unscheduled: [] }),
  ].sort((a, b) => total(b) - total(a));
  const unassigned = rows.find((r) => r.login === null);
  const isNow = start === monday(today());

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border bg-card p-0.5">
          <Button variant="ghost" size="icon-sm" aria-label="Previous week" onClick={() => setStart(addDays(start, -7))}><ChevronLeft /></Button>
          <Button variant="ghost" size="sm" disabled={isNow} onClick={() => setStart(monday(today()))}>Today</Button>
          <Button variant="ghost" size="icon-sm" aria-label="Next week" onClick={() => setStart(addDays(start, 7))}><ChevronRight /></Button>
        </div>
        <h2 className="text-base font-semibold">{format(parseISO(days[0]), "d MMM")} – {format(parseISO(days[13]), "d MMM")}</h2>
        <span className="ml-auto text-xs text-muted-foreground">Capacity {cap} {measure} / day</span>
        <Segmented size="sm" label="Measure" value={measure} onChange={setMeasure} options={[["tickets", "Tickets"], ["points", "Points"]] as const} />
        <Button size="sm" variant="ghost" nativeButton={false} render={<Link href="/settings/" />} title="Change capacity in Settings → Workflow"><Settings />Capacity</Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border bg-card shadow-card">
        <table className="w-full min-w-[1080px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
            <tr className="border-b">
              <th scope="col" className="sticky left-0 z-10 w-52 bg-card px-4 py-2 text-left">Person</th>
              {days.map((d) => (
                <th key={d} scope="col" className={cn("px-0.5 py-2 text-center", isWeekend(d) ? "w-8 text-muted-foreground/60" : "w-[6%]", d === today() && "text-primary")}>
                  <span className="block">{format(parseISO(d), isWeekend(d) ? "EEEEE" : "EEE")}</span>
                  <span className="block text-[13px] font-semibold tracking-normal normal-case tabular">{format(parseISO(d), "d")}</span>
                </th>
              ))}
              <th scope="col" className="w-24 px-3 text-right">No date</th>
            </tr>
          </thead>
          <tbody>
            {all.map((r) => <PersonRow key={r.login} row={r} days={days} cap={cap} measure={measure} person={person(r.login)} />)}
            {unassigned && <PersonRow row={unassigned} days={days} cap={cap} measure={measure} person={null} />}
          </tbody>
        </table>
      </div>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className={cn("size-2.5 rounded-sm", TONE.ok)} />Under capacity</span>
        <span className="inline-flex items-center gap-1.5"><span className={cn("size-2.5 rounded-sm", TONE.near)} />80% or more</span>
        <span className="inline-flex items-center gap-1.5"><span className={cn("size-2.5 rounded-sm", TONE.over)} />Over capacity</span>
        <span>A ticket counts on each working day from its start to its due date (or across its sprint).</span>
      </p>
    </div>
  );
}

const total = (r: Row) => Object.values(r.days).reduce((s, c) => s + c.load, 0);

function PersonRow({ row, days, cap, measure, person }: { row: Row; days: string[]; cap: number; measure: Measure; person: Board["people"][number] | null | undefined }) {
  const work = days.filter((d) => !isWeekend(d));
  const avg = work.reduce((s, d) => s + row.days[d].load, 0) / Math.max(1, work.length);
  return (
    <tr className="border-b last:border-0 hover:bg-muted/20">
      <th scope="row" className="sticky left-0 z-[1] bg-card px-4 py-2 text-left font-normal">
        <div className="flex items-center gap-2.5">
          {person ? <Avatar person={person} size={28} /> : <span className="grid size-7 place-items-center rounded-full border border-dashed text-xs text-muted-foreground">?</span>}
          <div className="min-w-0">
            <p className="truncate font-medium">{person ? person.name || person.login : "Unassigned"}</p>
            <p className="text-[11px] text-muted-foreground">avg {fmt(avg, measure)} / day · {Math.round((avg / cap) * 100)}%</p>
          </div>
        </div>
      </th>
      {days.map((d) => <DayCell key={d} day={d} load={row.days[d].load} tickets={row.days[d].tickets} cap={cap} measure={measure} who={person ? person.name || person.login : "Unassigned"} />)}
      <td className="px-3 text-right">
        {row.unscheduled.length ? <TicketList title={`${person ? person.name || person.login : "Unassigned"} · no dates`} tickets={row.unscheduled}
          trigger={<button className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">{row.unscheduled.length} ticket{row.unscheduled.length === 1 ? "" : "s"}</button>} />
          : <span className="text-xs text-muted-foreground/60">–</span>}
      </td>
    </tr>
  );
}

function DayCell({ day, load, tickets, cap, measure, who }: { day: string; load: number; tickets: Ticket[]; cap: number; measure: Measure; who: string }) {
  const weekend = isWeekend(day);
  const t = tone(load, cap);
  const pct = Math.min(100, (load / cap) * 100);
  const cell = (
    <div className={cn("relative mx-auto flex h-11 w-full items-end overflow-hidden rounded-md", weekend ? "bg-muted/40" : "bg-muted/60", day === today() && "ring-1 ring-primary/40")}>
      <span className={cn("absolute inset-x-0 bottom-0 rounded-md transition-[height] duration-500", TONE[t])} style={{ height: `${pct}%` }} />
      {load > 0 && <span className={cn("relative z-[1] w-full pb-0.5 text-center text-[11px] font-semibold tabular", t === "over" ? "text-white" : "text-foreground")}>{fmt(load, measure)}</span>}
    </div>
  );
  return (
    <td className="px-0.5 py-1.5">
      {tickets.length ? (
        <TicketList title={`${who} · ${format(parseISO(day), "EEE d MMM")} · ${fmt(load, measure)}/${cap} ${measure}`} tickets={tickets}
          trigger={<button className="block w-full" aria-label={`${who}, ${format(parseISO(day), "EEEE d MMMM")}: ${fmt(load, measure)} of ${cap} ${measure}. Show tickets`}>{cell}</button>} />
      ) : cell}
    </td>
  );
}

function TicketList({ title, tickets, trigger }: { title: string; tickets: Ticket[]; trigger: React.ReactElement }) {
  const [, open] = useOpenTicket();
  return (
    <Popover>
      <PopoverTrigger render={trigger} />
      <PopoverContent className="w-80 p-2">
        <p className="px-2 pt-1 pb-2 text-xs font-semibold text-muted-foreground">{title}</p>
        <ul className="max-h-72 overflow-y-auto">
          {tickets.map((t) => (
            <li key={t.url}>
              <button onClick={() => void open(t.number)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted">
                <StatusIcon name={t.fields.Status} size={14} /><TypeIcon ticket={t} size={16} />
                <span className="min-w-0 flex-1 truncate">{cleanTitle(t.title)}</span>
                {t.fields["Story Points"] != null && <span className="rounded bg-muted px-1 text-[10px] font-semibold tabular">{t.fields["Story Points"]} pt</span>}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
