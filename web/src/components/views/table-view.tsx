"use client";

import { Button } from "@/components/ui/button";
import { byPriorityThenNumber, hasField, isDone, iterationField, options, priorityRank, sprintById } from "@/lib/board";
import { useActions } from "@/lib/data";
import type { Board, Ticket } from "@/lib/types";
import { useGroupBy, useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ChevronRight, SearchX } from "lucide-react";
import { EmptyState } from "../brand/states";
import { useMemo, useState } from "react";
import { cleanTitle, OptionPill, TicketMeta, TypeIcon } from "../ticket/bits";
import { DateInput, NumberInput, OptionPicker, PeoplePicker, SprintPicker } from "../ticket/pickers";

type SortKey = "number" | "title" | "status" | "priority" | "due" | "points";
const GROUPS: [string, string][] = [["none", "None"], ["status", "Status"], ["sprint", "Sprint"], ["type", "Type"], ["priority", "Priority"], ["assignee", "Person"], ["component", "Component"]];

function groupKey(board: Board, t: Ticket, by: string): string[] {
  switch (by) {
    case "status": return [t.fields.Status ?? "No status"];
    case "sprint": return [sprintById(board, t.fields.Sprint)?.title ?? "No sprint"];
    case "type": return [t.fields["Ticket Type"] ?? "No type"];
    case "priority": return [t.fields.Priority ?? "No priority"];
    case "component": return [t.fields.Component ?? "No component"];
    case "assignee": return t.assignees.length ? t.assignees.map((a) => a.name || a.login) : ["Unassigned"];
    default: return ["All"];
  }
}

export function TableView({ board, tickets, defaultGroup = "none" }: { board: Board; tickets: Ticket[]; defaultGroup?: string }) {
  const [group, setGroup] = useGroupBy(defaultGroup);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "priority", dir: 1 });
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => {
    const v = (t: Ticket): string | number => ({
      number: t.number, title: t.title.toLowerCase(), status: options(board, "Status").findIndex((o) => o.name === t.fields.Status),
      priority: priorityRank(t), due: t.fields["Target date"] ?? "9999", points: t.fields["Story Points"] ?? -1,
    })[sort.key];
    return [...tickets].sort((a, b) => (v(a) < v(b) ? -sort.dir : v(a) > v(b) ? sort.dir : byPriorityThenNumber(a, b)));
  }, [tickets, sort, board]);

  const groups = useMemo(() => {
    const m = new Map<string, Ticket[]>();
    // Show every sprint, even empty ones, so planning can see free capacity.
    if (group === "sprint") for (const it of iterationField(board)?.iterations ?? []) m.set(it.title, []);
    for (const t of sorted) for (const k of groupKey(board, t, group)) m.set(k, [...(m.get(k) ?? []), t]);
    return [...m.entries()].filter(([, ts]) => ts.length || group === "sprint");
  }, [sorted, group, board]);

  const head = (key: SortKey, label: string, className = "") => (
    <th scope="col" className={cn("px-2 py-2 text-left text-xs font-medium text-muted-foreground", className)}
      aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSort({ key, dir: sort.key === key ? (-sort.dir as 1 | -1) : 1 })}>
        {label}{sort.key === key && (sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
      </button>
    </th>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1 text-sm">
        <span className="mr-1 text-muted-foreground">Group by</span>
        {GROUPS.map(([k, l]) => <Button key={k} size="xs" variant={group === k ? "secondary" : "ghost"} aria-pressed={group === k} onClick={() => void setGroup(k)}>{l}</Button>)}
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded-xl border bg-card">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
            <tr className="border-b">
              {head("number", "#", "w-16 pl-4")}{head("title", "Title")}{head("status", "Status", "w-40")}{head("priority", "Priority", "w-36")}
              <th scope="col" className="w-44 px-2 text-left text-xs font-medium text-muted-foreground">Assignees</th>
              {hasField(board, "Sprint") && <th scope="col" className="w-40 px-2 text-left text-xs font-medium text-muted-foreground">Sprint</th>}
              {hasField(board, "Story Points") && head("points", "Points", "w-20")}
              {head("due", "Due", "w-36")}
            </tr>
          </thead>
          {groups.map(([name, rows]) => (
            <tbody key={name}>
              {group !== "none" && (
                <tr className="border-b bg-muted/40">
                  <th colSpan={8} scope="rowgroup" className="px-3 py-1.5 text-left">
                    <button className="inline-flex items-center gap-1.5 text-xs font-semibold" aria-expanded={!collapsed.has(name)}
                      onClick={() => setCollapsed((s) => { const n = new Set(s); if (n.has(name)) n.delete(name); else n.add(name); return n; })}>
                      <ChevronRight className={cn("size-3.5 transition-transform", !collapsed.has(name) && "rotate-90")} />{name}
                      <span className="font-normal text-muted-foreground">{rows.length}{group === "sprint" && rows.length ? ` · ${rows.reduce((s, t) => s + (t.fields["Story Points"] ?? 0), 0)} pts` : ""}</span>
                    </button>
                  </th>
                </tr>
              )}
              {!collapsed.has(name) && rows.map((t) => <Row key={`${name}-${t.number}`} board={board} t={t} />)}
              {!collapsed.has(name) && !rows.length && <tr><td colSpan={8} className="px-4 py-3 text-xs text-muted-foreground">Nothing here yet.</td></tr>}
            </tbody>
          ))}
        </table>
        {!tickets.length && <EmptyState icon={SearchX} title="No tickets match" text="Try removing a filter, or search for something else." />}
      </div>
    </div>
  );
}

function Row({ board, t }: { board: Board; t: Ticket }) {
  const actions = useActions();
  const [, open] = useOpenTicket();
  return (
    <tr className={cn("group border-b last:border-0 hover:bg-muted/40", isDone(t) && "text-muted-foreground")}>
      <td className="py-1 pl-4 font-mono text-xs text-muted-foreground">#{t.number}</td>
      <td className="max-w-0 px-2 py-1">
        <button onClick={() => void open(t.number)} className="flex w-full min-w-0 items-center gap-2 text-left hover:underline">
          <TypeIcon ticket={t} /><span className={cn("truncate font-medium", isDone(t) && "line-through")}>{cleanTitle(t.title)}</span>
          <span className="hidden shrink-0 xl:inline"><TicketMeta ticket={{ ...t, fields: { ...t.fields, "Target date": undefined } }} /></span>
        </button>
      </td>
      <td className="px-1"><OptionPicker board={board} field="Status" label="Status" value={t.fields.Status} onChange={(v) => v && void actions.move(t, v)} /></td>
      <td className="px-1"><OptionPicker board={board} field="Priority" label="Priority" value={t.fields.Priority} onChange={(v) => void actions.setField(t, "Priority", v)} /></td>
      <td className="px-1"><PeoplePicker people={board.people} value={t.assignees} onChange={(l) => void actions.setAssignees(t, l)} /></td>
      {hasField(board, "Sprint") && <td className="px-1"><SprintPicker board={board} value={t.fields.Sprint} onChange={(v) => void actions.setField(t, "Sprint", v)} /></td>}
      {hasField(board, "Story Points") && <td className="px-1"><NumberInput key={t.fields["Story Points"] ?? "x"} label="Story points" value={t.fields["Story Points"]} onChange={(v) => void actions.setField(t, "Story Points", v)} /></td>}
      <td className="px-1"><DateInput warnPast={!isDone(t)} label="Due date" value={t.fields["Target date"]} onChange={(v) => void actions.setField(t, "Target date", v)} /></td>
    </tr>
  );
}

// Compact grouped list for My work and Inbox.
export function ListView({ board, groups, empty }: { board: Board; groups: { name: string; hint?: string; tickets: Ticket[] }[]; empty: React.ReactNode }) {
  const [, open] = useOpenTicket();
  const shown = groups.filter((g) => g.tickets.length);
  if (!shown.length) return <>{empty}</>;
  return (
    <div className="space-y-6 overflow-auto pb-6">
      {shown.map((g) => (
        <section key={g.name} aria-label={g.name}>
          <h3 className="mb-2 flex items-baseline gap-2 text-sm font-semibold">{g.name}<span className="text-xs font-normal text-muted-foreground">{g.tickets.length}{g.hint ? ` · ${g.hint}` : ""}</span></h3>
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {g.tickets.map((t) => (
              <li key={t.number}>
                <button onClick={() => void open(t.number)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50">
                  <TypeIcon ticket={t} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{cleanTitle(t.title)}</span>
                    <span className="mt-0.5 flex items-center gap-2"><span className="font-mono text-[11px] text-muted-foreground">#{t.number}</span><TicketMeta ticket={t} /></span>
                  </span>
                  <span className="hidden sm:inline"><OptionPill board={board} field="Priority" value={t.fields.Priority} compact /></span>
                  <OptionPill board={board} field="Status" value={t.fields.Status} compact />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
