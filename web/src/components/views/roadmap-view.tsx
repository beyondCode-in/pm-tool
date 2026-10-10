"use client";

import { Button } from "@/components/ui/button";
import { addDays, currentSprint, isChildOf, isDone, isEpic, iterationField, sprintById, sprintEnd, today } from "@/lib/board";
import type { Board, Ticket } from "@/lib/types";
import { useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { differenceInCalendarDays, eachMonthOfInterval, format, parseISO } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useSource } from "@/lib/data";
import { GitBranch } from "@/components/icons";
import { AvatarStack, cleanTitle, TypeIcon } from "../ticket/bits";
import { Segmented } from "../ui-plus/segmented";

const DAY_PX = { week: 28, month: 10, quarter: 4 } as const;
type Zoom = keyof typeof DAY_PX;
// Fixed sizes so dependency lines can be drawn between bars.
const LABEL_W = 272, ROW_H = 40, HEAD_H = 44;
const MAX_DEP_ROWS = 80; // dependency look-ups are one request per ticket on GitHub

// A ticket's span: explicit start/due dates, else its sprint, else nothing.
function span(b: Board, t: Ticket): [string, string] | null {
  const sprint = sprintById(b, t.fields.Sprint);
  const start = t.fields["Start date"] ?? sprint?.startDate ?? t.fields["Target date"];
  const end = t.fields["Target date"] ?? (sprint ? sprintEnd(sprint) : undefined) ?? start;
  return start && end ? [start <= end ? start : end, end >= start ? end : start] : null;
}

export function RoadmapView({ board, tickets }: { board: Board; tickets: Ticket[] }) {
  const [zoom, setZoom] = useState<Zoom>("month");
  const [showDeps, setShowDeps] = useState(true);
  const [, open] = useOpenTicket();
  const source = useSource();
  const scroller = useRef<HTMLDivElement>(null);
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

  // Blocked-by links for the rows on screen, drawn as arrows blocker → blocked.
  const depRows = showDeps ? rows.slice(0, MAX_DEP_ROWS) : [];
  const deps = useQueries({ queries: depRows.map(({ t }) => ({ queryKey: ["deps", t.url], queryFn: () => source!.dependencies(t), enabled: !!source, staleTime: 120_000 })) });
  const index = new Map(rows.map(({ t }, i) => [t.url, i]));
  const edges = depRows.flatMap(({ t }, i) => (deps[i]?.data?.blockedBy ?? []).flatMap((u) => {
    const from = index.get(u);
    return from === undefined ? [] : [{ from, to: index.get(t.url)!, blocker: rows[from].t, blocked: t }];
  }));
  const barEnd = (t: Ticket) => { const [s0, e0] = span(board, t)!; return x(s0) + Math.max(px, x(e0) - x(s0) + px); };
  const barStart = (t: Ticket) => x(span(board, t)![0]);

  const scrollToToday = () => { const el = scroller.current; if (el) el.scrollTo({ left: Math.max(0, x(today()) - (el.clientWidth - LABEL_W) / 3), behavior: "smooth" }); };
  // Autofit: the most detailed zoom that shows the whole range on screen.
  const autofit = () => {
    const w = (scroller.current?.clientWidth ?? 1000) - LABEL_W;
    const days = differenceInCalendarDays(parseISO(to), parseISO(from)) + 1;
    setZoom((["week", "month", "quarter"] as Zoom[]).find((z) => days * DAY_PX[z] <= w) ?? "quarter");
  };
  useEffect(() => { scrollToToday(); }, [zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5 text-sm">
        <Button size="sm" variant="outline" onClick={scrollToToday}>Today</Button>
        <Segmented label="Zoom" value={zoom} onChange={setZoom} options={[["week", "Week"], ["month", "Month"], ["quarter", "Quarter"]] as const} />
        <Button size="sm" variant="ghost" onClick={autofit} title="Fit the whole plan on screen">Autofit</Button>
        <Button size="sm" variant={showDeps ? "secondary" : "ghost"} aria-pressed={showDeps} onClick={() => setShowDeps(!showDeps)} title="Show blocked-by arrows between bars">
          <GitBranch />Dependencies{showDeps && edges.length > 0 && <span className="rounded bg-background/70 px-1 text-[10px] tabular">{edges.length}</span>}
        </Button>
        {undated > 0 && <span className="ml-auto text-xs text-muted-foreground">{undated} open tickets have no dates or sprint yet</span>}
      </div>
      <div ref={scroller} className="min-h-0 flex-1 overflow-auto rounded-xl border bg-card">
        <div className="relative grid" style={{ gridTemplateColumns: `${LABEL_W}px ${width}px` }}>
          <div className="sticky top-0 left-0 z-30 flex items-end border-r border-b bg-card px-3 pb-2 text-xs font-medium text-muted-foreground" style={{ height: HEAD_H }}>Ticket</div>
          <div className="sticky top-0 z-20 border-b bg-card" style={{ height: HEAD_H }}>
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
                <button onClick={() => void open(t.number)} className="sticky left-0 z-10 flex min-w-0 items-center gap-2 border-r border-b bg-card px-3 text-left text-sm hover:bg-muted" style={{ paddingLeft: 12 + depth * 18, height: ROW_H }}>
                  <TypeIcon ticket={t} /><span className={cn("truncate", isEpic(t) && "font-semibold", isDone(t) && "text-muted-foreground line-through")}>{cleanTitle(t.title)}</span>
                </button>
                <div className="relative border-b" style={{ height: ROW_H }}>
                  <div className="absolute inset-y-0 w-px bg-primary/60" style={{ left: x(today()) }} aria-hidden />
                  <button onClick={() => void open(t.number)} title={`${s} → ${e}`}
                    className={cn("absolute top-1.5 bottom-1.5 z-[2] flex items-center gap-1.5 overflow-hidden rounded-md px-2 text-xs font-medium text-white shadow-sm transition-transform hover:scale-y-110",
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
          {edges.length > 0 && (
            <svg className="pointer-events-none absolute z-[3]" style={{ left: LABEL_W, top: HEAD_H, width, height: rows.length * ROW_H }} aria-hidden>
              <defs>
                <marker id="dep-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 8 4 0 8z" fill="context-stroke" /></marker>
              </defs>
              {edges.map(({ from, to: target, blocker, blocked }) => {
                const x1 = barEnd(blocker), y1 = from * ROW_H + ROW_H / 2;
                const x2 = barStart(blocked), y2 = target * ROW_H + ROW_H / 2;
                // A conflict: the blocked ticket starts before its blocker is finished.
                const clash = !isDone(blocker) && x2 < x1;
                const bend = Math.max(14, Math.min(40, Math.abs(x2 - x1) / 2));
                const d = x2 >= x1 + 8
                  ? `M${x1} ${y1} C${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2 - 2} ${y2}`
                  : `M${x1} ${y1} h10 V${(y1 + y2) / 2} H${x2 - 12} V${y2} H${x2 - 2}`;
                return <path key={`${blocker.url}>${blocked.url}`} d={d} fill="none" strokeWidth={1.75} markerEnd="url(#dep-arrow)"
                  className={clash ? "stroke-destructive" : "stroke-muted-foreground/60"} strokeDasharray={isDone(blocker) ? "4 3" : undefined} />;
              })}
            </svg>
          )}
        </div>
        {!rows.length && <p className="p-10 text-center text-sm text-muted-foreground">Give tickets a start date, due date or sprint and they&apos;ll appear here.</p>}
      </div>
      <p className="text-xs text-muted-foreground">Bars use start and due dates, or the ticket&apos;s sprint. Purple = epic, red = overdue, green = done. Arrows run from a blocking ticket to the one it blocks; a red arrow means the blocked ticket starts before its blocker ends, a dashed one that the blocker is done. Edit dates in the ticket.</p>
    </div>
  );
}
