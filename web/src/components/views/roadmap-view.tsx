"use client";

import { Button } from "@/components/ui/button";
import { addDays, currentSprint, isChildOf, isDone, isEpic, iterationField, sprintById, sprintEnd, today } from "@/lib/board";
import type { Board, Ticket } from "@/lib/types";
import { useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { differenceInCalendarDays, eachMonthOfInterval, format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { AvatarStack, cleanTitle, TypeIcon } from "../ticket/bits";
import { Segmented } from "../ui-plus/segmented";

const DAY_PX = { week: 28, month: 10, quarter: 4 } as const;
type Zoom = keyof typeof DAY_PX;

// A ticket's span: explicit start/due dates, else its sprint, else nothing.
function span(b: Board, t: Ticket): [string, string] | null {
  const sprint = sprintById(b, t.fields.Sprint);
  const start = t.fields["Start date"] ?? sprint?.startDate ?? t.fields["Target date"];
  const end = t.fields["Target date"] ?? (sprint ? sprintEnd(sprint) : undefined) ?? start;
  return start && end ? [start <= end ? start : end, end >= start ? end : start] : null;
}

export function RoadmapView({ board, tickets }: { board: Board; tickets: Ticket[] }) {
  const [zoom, setZoom] = useState<Zoom>("month");
  const [, open] = useOpenTicket();
  const px = DAY_PX[zoom];

  // Epics first, each followed by its children; then everything else with dates.
  const rows = useMemo(() => {
    const dated = tickets.filter((t) => span(board, t));
    const epics = dated.filter(isEpic);
    const out: { t: Ticket; depth: number }[] = [];
    const used = new Set<number>();
    for (const e of epics) {
      out.push({ t: e, depth: 0 }); used.add(e.number);
      for (const c of dated.filter((c) => isChildOf(c, e))) { out.push({ t: c, depth: 1 }); used.add(c.number); }
    }
    for (const t of dated) if (!used.has(t.number)) out.push({ t, depth: 0 });
    return out;
  }, [tickets, board]);

  const [from, to] = useMemo(() => {
    const dates = rows.flatMap(({ t }) => span(board, t) ?? []);
    const lo = dates.reduce((a, b) => (b < a ? b : a), today());
    const hi = dates.reduce((a, b) => (b > a ? b : a), today());
    return [addDays(lo, -7), addDays(hi, 21)];
  }, [rows, board]);
  const x = (d: string) => differenceInCalendarDays(parseISO(d), parseISO(from)) * px;
  const width = x(to) + px;
  const months = eachMonthOfInterval({ start: parseISO(from), end: parseISO(to) });
  const sprints = iterationField(board)?.iterations ?? [];
  const now = currentSprint(board);
  const undated = tickets.filter((t) => !span(board, t) && !isDone(t)).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-1 text-sm">
        <span className="mr-1 text-xs font-medium text-muted-foreground">Zoom</span>
        <Segmented label="Zoom" value={zoom} onChange={setZoom} options={[["week", "Week"], ["month", "Month"], ["quarter", "Quarter"]] as const} />
        {undated > 0 && <span className="ml-auto text-xs text-muted-foreground">{undated} open tickets have no dates or sprint yet</span>}
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded-xl border bg-card">
        <div className="grid" style={{ gridTemplateColumns: `minmax(14rem, 18rem) ${width}px` }}>
          <div className="sticky top-0 left-0 z-30 border-r border-b bg-card px-3 py-2 text-xs font-medium text-muted-foreground">Ticket</div>
          <div className="sticky top-0 z-20 border-b bg-card">
            <div className="relative h-6">
              {months.map((m) => <span key={m.toISOString()} className="absolute top-1 border-l pl-1.5 text-xs font-medium" style={{ left: Math.max(0, x(format(m, "yyyy-MM-dd"))) }}>{format(m, zoom === "quarter" ? "MMM yy" : "MMMM yyyy")}</span>)}
            </div>
            <div className="relative h-5 text-[10px] text-muted-foreground">
              {sprints.map((s) => (
                <span key={s.id} className={cn("absolute top-0.5 truncate rounded px-1", s.id === now?.id ? "bg-primary/15 font-semibold text-primary" : "bg-muted")}
                  style={{ left: x(s.startDate), width: s.duration * px - 2 }}>{s.title}</span>
              ))}
            </div>
          </div>
          {rows.map(({ t, depth }) => {
            const [s, e] = span(board, t)!;
            return (
              <div key={t.number} className="contents group">
                <button onClick={() => void open(t.number)} className="sticky left-0 z-10 flex min-w-0 items-center gap-2 border-r border-b bg-card px-3 py-2 text-left text-sm hover:bg-muted" style={{ paddingLeft: 12 + depth * 18 }}>
                  <TypeIcon ticket={t} /><span className={cn("truncate", isEpic(t) && "font-semibold", isDone(t) && "text-muted-foreground line-through")}>{cleanTitle(t.title)}</span>
                </button>
                <div className="relative border-b">
                  <div className="absolute inset-y-0 w-px bg-primary/60" style={{ left: x(today()) }} aria-hidden />
                  <button onClick={() => void open(t.number)} title={`${s} → ${e}`}
                    className={cn("absolute top-1.5 bottom-1.5 flex items-center gap-1.5 overflow-hidden rounded-md px-2 text-xs font-medium text-white shadow-sm transition-transform hover:scale-y-110",
                      isEpic(t) ? "bg-violet-500" : isDone(t) ? "bg-emerald-500/80" : t.fields["Target date"] && t.fields["Target date"] < today() ? "bg-red-500" : "bg-primary")}
                    style={{ left: x(s), width: Math.max(px, x(e) - x(s) + px) }}>
                    {isEpic(t) && t.subIssues.total > 0 && <span className="tabular-nums">{Math.round((t.subIssues.completed / t.subIssues.total) * 100)}%</span>}
                    <span className="truncate">{cleanTitle(t.title)}</span>
                    <span className="ml-auto"><AvatarStack people={t.assignees} size={16} max={2} /></span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {!rows.length && <p className="p-10 text-center text-sm text-muted-foreground">Give tickets a start date, due date or sprint and they&apos;ll appear here.</p>}
      </div>
      <p className="text-xs text-muted-foreground">Bars use start and due dates, or the ticket&apos;s sprint. Purple = epic, red = overdue, green = done. Edit dates in the ticket.</p>
    </div>
  );
}
