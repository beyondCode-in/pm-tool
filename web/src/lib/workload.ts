// Workload: how much each person carries on each day.
//
// A ticket counts on every working day (Mon–Fri) between its start and due
// dates. Missing dates fall back to its sprint, then to the single known
// date. Measured in tickets (1 per day while it runs) or story points (spread
// evenly over its working days). Done tickets don't count.

import { addDays, isDone, sprintById, sprintEnd } from "./board";
import type { Board, Ticket } from "./types";

export type Measure = "tickets" | "points";

const weekday = (iso: string) => new Date(`${iso}T00:00:00`).getDay(); // 0 Sun … 6 Sat
export const isWeekend = (iso: string) => weekday(iso) === 0 || weekday(iso) === 6;

/** The days a ticket is scheduled across, or null if it has no dates at all. */
export function spanOf(board: Board, t: Ticket): { start: string; end: string } | null {
  const sprint = sprintById(board, t.fields.Sprint);
  const start = t.fields["Start date"] ?? sprint?.startDate ?? t.fields["Target date"];
  const end = t.fields["Target date"] ?? (sprint ? sprintEnd(sprint) : undefined) ?? start;
  if (!start || !end) return null;
  return start <= end ? { start, end } : { start: end, end: start };
}

/** Working days in a span; if the span is only a weekend, its own days. */
export function workDays(start: string, end: string): string[] {
  const all: string[] = [];
  for (let d = start; d <= end && all.length < 366; d = addDays(d, 1)) all.push(d);
  const work = all.filter((d) => !isWeekend(d));
  return work.length ? work : all;
}

export type Cell = { load: number; tickets: Ticket[] };
export type Row = { login: string | null; days: Record<string, Cell>; unscheduled: Ticket[] };

/** Load per person per day for the given days. Unassigned work has login null. */
export function workload(board: Board, tickets: Ticket[], days: string[], measure: Measure): Row[] {
  const rows = new Map<string | null, Row>();
  const row = (login: string | null) => {
    if (!rows.has(login)) rows.set(login, { login, days: Object.fromEntries(days.map((d) => [d, { load: 0, tickets: [] }])), unscheduled: [] });
    return rows.get(login)!;
  };
  const inView = new Set(days);
  for (const t of tickets) {
    if (isDone(t)) continue;
    const owners = t.assignees.length ? t.assignees.map((a) => a.login) : [null];
    const span = spanOf(board, t);
    if (!span) { owners.forEach((o) => row(o).unscheduled.push(t)); continue; }
    const wd = workDays(span.start, span.end);
    const per = measure === "points" ? (t.fields["Story Points"] ?? 0) / wd.length : 1;
    for (const o of owners) {
      const r = row(o);
      for (const d of wd) {
        if (!inView.has(d)) continue;
        r.days[d].load += per;
        r.days[d].tickets.push(t);
      }
    }
  }
  return [...rows.values()];
}

export type Tone = "free" | "ok" | "near" | "over";
export function tone(load: number, capacity: number): Tone {
  if (load <= 0) return "free";
  const r = load / capacity;
  return r > 1 ? "over" : r >= 0.8 ? "near" : "ok";
}
