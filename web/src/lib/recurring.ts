// Recurring tickets (ClickUp's "Recurring"): a hidden marker in the issue body
//   <!-- beyondpm:repeat=weekly -->
// When the ticket is finished, the next one is created with its dates moved on
// by one interval. The marker travels with the issue and is invisible on GitHub.

import { addDays } from "./board";
import type { NewTicket, Ticket } from "./types";

export type Repeat = "daily" | "weekdays" | "weekly" | "biweekly" | "monthly";
export const REPEATS: { id: Repeat; label: string }[] = [
  { id: "daily", label: "Every day" },
  { id: "weekdays", label: "Every weekday" },
  { id: "weekly", label: "Every week" },
  { id: "biweekly", label: "Every 2 weeks" },
  { id: "monthly", label: "Every month" },
];

const MARK = /\n*<!-- beyondpm:repeat=(\w+) -->\s*/;

export function repeatOf(body: string): Repeat | null {
  const m = MARK.exec(body);
  return m && REPEATS.some((r) => r.id === m[1]) ? (m[1] as Repeat) : null;
}

export function withRepeat(body: string, repeat: Repeat | null): string {
  const clean = body.replace(MARK, "\n").trimEnd();
  return repeat ? `${clean}${clean ? "\n\n" : ""}<!-- beyondpm:repeat=${repeat} -->` : clean;
}

/** The same date one interval later (weekdays skip Saturday and Sunday). */
export function nextDate(iso: string, repeat: Repeat): string {
  switch (repeat) {
    case "daily": return addDays(iso, 1);
    case "weekly": return addDays(iso, 7);
    case "biweekly": return addDays(iso, 14);
    case "weekdays": {
      let d = addDays(iso, 1);
      while ([0, 6].includes(new Date(`${d}T00:00:00`).getDay())) d = addDays(d, 1);
      return d;
    }
    case "monthly": {
      const [y, m, day] = iso.split("-").map(Number);
      const last = new Date(y, m + 1, 0).getDate(); // days in next month
      const nm = m === 12 ? 1 : m + 1, ny = m === 12 ? y + 1 : y;
      return `${ny}-${String(nm).padStart(2, "0")}-${String(Math.min(day, last)).padStart(2, "0")}`;
    }
  }
}

/** The next occurrence of a finished recurring ticket. */
export function nextOccurrence(t: Ticket, repeat: Repeat, startStatus: string | null, today: string): NewTicket {
  const base = t.fields["Target date"] ?? t.fields["Start date"] ?? today;
  const shift = (d?: string) => (d ? nextDate(d, repeat) : undefined);
  // If the ticket was finished late, catch up so the next one isn't already overdue.
  let due = shift(t.fields["Target date"]);
  let start = shift(t.fields["Start date"]);
  while (due && due < today) { due = nextDate(due, repeat); start = start ? nextDate(start, repeat) : undefined; }
  return {
    title: t.title,
    body: t.body,
    labels: t.labels.map((l) => l.name),
    assignees: t.assignees.map((a) => a.login),
    fields: {
      ...t.fields,
      Status: startStatus ?? undefined,
      Sprint: undefined,
      "Start date": start,
      "Target date": due ?? (t.fields["Target date"] || t.fields["Start date"] ? undefined : shift(base)),
    },
  };
}
