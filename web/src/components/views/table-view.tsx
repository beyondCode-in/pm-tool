"use client";

import { Button } from "@/components/ui/button";
import { byPriorityThenNumber, hasField, isDone, iterationField, options, plain, priorityRank, sprintById } from "@/lib/board";
import { quickTicket } from "@/lib/quick-ticket";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PriorityIcon, StatusIcon, StatusPill } from "../ticket/status-icons";
import { useActions } from "@/lib/data";
import type { Board, FieldValues, Ticket } from "@/lib/types";
import { useGroupBy, useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ChevronRight, Plus, SearchX } from "@/components/icons";
import { EmptyState } from "../brand/states";
import { Checkbox } from "@/components/ui/checkbox";
import { TicketPreview } from "../ticket/ticket-preview";
import { BulkBar } from "./bulk-bar";
import { CardMenu } from "./card-menu";
import { Fragment, useMemo, useState } from "react";
import { useLayout } from "@/lib/layout";
import { CustomiseMenu } from "../layout/custom-section";
import { Segmented } from "../ui-plus/segmented";
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

// The fields a new ticket gets when it's added inside a group, so it lands
// in the group it was typed into (ClickUp's "+ Add task" per group).
function groupDefaults(board: Board, by: string, name: string): { fields: FieldValues; assignees: string[] } {
  const none = /^No |^Unassigned$|^All$/.test(name);
  if (none) return { fields: {}, assignees: [] };
  switch (by) {
    case "status": return { fields: { Status: name }, assignees: [] };
    case "priority": return { fields: { Priority: name }, assignees: [] };
    case "type": return { fields: { "Ticket Type": name }, assignees: [] };
    case "component": return { fields: { Component: name }, assignees: [] };
    case "sprint": return { fields: { Sprint: iterationField(board)?.iterations.find((i) => i.title === name)?.id }, assignees: [] };
    case "assignee": return { fields: {}, assignees: board.people.filter((x) => (x.name || x.login) === name).map((x) => x.login) };
    default: return { fields: {}, assignees: [] };
  }
}

function GroupTitle({ by, name }: { by: string; name: string }) {
  if (by === "status") return <StatusPill name={name} />;
  if (by === "priority") return <span className="inline-flex items-center gap-1.5"><PriorityIcon value={name} size={14} />{plain(name)}</span>;
  return <>{plain(name) || name}</>;
}

// The inline "+ Add task" row at the end of each group.
function AddRow({ board, by, name, span }: { board: Board; by: string; name: string; span: number }) {
  const actions = useActions();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!title.trim()) { setOpen(false); return; }
    setBusy(true);
    const d = groupDefaults(board, by, name);
    const base = quickTicket(title, d.fields);
    const n = await actions.create({ ...base, fields: { ...base.fields, ...d.fields }, assignees: d.assignees });
    setBusy(false);
    if (n) { setTitle(""); toast.success(`#${n} added${by !== "none" ? ` to ${plain(name)}` : ""}`); }
  };
  return (
    <tr className="border-b last:border-0">
      <td />
      <td colSpan={span - 1} className="py-1 pr-3">
        {open ? (
          <form className="field-frame flex items-center gap-2 rounded-lg border bg-background px-2 py-1" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
            <Plus className="size-3.5 text-muted-foreground" />
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task name — Enter to add, Esc to close" aria-label={`New task in ${plain(name)}`}
              onKeyDown={(e) => { if (e.key === "Escape") { setOpen(false); setTitle(""); } }}
              className="field-bare h-7 min-w-0 flex-1 bg-transparent text-sm outline-none" />
            <Button type="submit" size="xs" disabled={busy || !title.trim()}>{busy ? "Adding…" : "Save"}</Button>
            <Button type="button" size="xs" variant="ghost" onClick={() => { setOpen(false); setTitle(""); }}>Cancel</Button>
          </form>
        ) : (
          <button onClick={() => setOpen(true)} className="flex h-8 w-full items-center gap-1.5 rounded-md px-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
            <Plus className="size-3.5" />Add task
          </button>
        )}
      </td>
    </tr>
  );
}

const COLUMNS: Record<string, string> = { status: "Status", priority: "Priority", assignees: "Assignees", sprint: "Sprint", points: "Points", due: "Due" };

function Cell({ id, board, t }: { id: string; board: Board; t: Ticket }) {
  const actions = useActions();
  switch (id) {
    case "status": return <OptionPicker board={board} field="Status" label="Status" value={t.fields.Status} onChange={(v) => v && void actions.move(t, v)} />;
    case "priority": return <OptionPicker board={board} field="Priority" label="Priority" value={t.fields.Priority} onChange={(v) => void actions.setField(t, "Priority", v)} />;
    case "assignees": return <PeoplePicker people={board.people} value={t.assignees} onChange={(l) => void actions.setAssignees(t, l)} />;
    case "sprint": return <SprintPicker board={board} value={t.fields.Sprint} onChange={(v) => void actions.setField(t, "Sprint", v)} />;
    case "points": return <NumberInput key={t.fields["Story Points"] ?? "x"} label="Story points" value={t.fields["Story Points"]} onChange={(v) => void actions.setField(t, "Story Points", v)} />;
    case "due": return <DateInput warnPast={!isDone(t)} label="Due date" value={t.fields["Target date"]} onChange={(v) => void actions.setField(t, "Target date", v)} />;
    default: return null;
  }
}
const WIDTH: Record<string, string> = { status: "w-40", priority: "w-36", assignees: "w-44", sprint: "w-40", points: "w-20", due: "w-40" };
const SORTS: Partial<Record<string, SortKey>> = { status: "status", priority: "priority", points: "points", due: "due" };

export function TableView({ board, tickets, defaultGroup = "none" }: { board: Board; tickets: Ticket[]; defaultGroup?: string }) {
  const [group, setGroup] = useGroupBy(defaultGroup);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "priority", dir: 1 });
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  // Selection for bulk edit, keyed by board item; shift-click selects a range.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [anchor, setAnchor] = useState<string | null>(null);
  const available = Object.keys(COLUMNS).filter((c) => (c === "sprint" ? hasField(board, "Sprint") : c === "points" ? hasField(board, "Story Points") : true));
  const cols = useLayout("table-columns", available);
  const span = cols.visible.length + 3;

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

  const flat = groups.flatMap(([name, rows]) => (collapsed.has(name) ? [] : rows));
  const toggle = (t: Ticket, range: boolean) => setSelected((prev) => {
    const next = new Set(prev);
    if (range && anchor) {
      const a = flat.findIndex((x) => x.itemId === anchor), b = flat.findIndex((x) => x.itemId === t.itemId);
      if (a >= 0 && b >= 0) { for (const x of flat.slice(Math.min(a, b), Math.max(a, b) + 1)) next.add(x.itemId); return next; }
    }
    if (next.has(t.itemId)) next.delete(t.itemId); else next.add(t.itemId);
    return next;
  });
  const toggleAll = (rows: Ticket[]) => setSelected((prev) => {
    const next = new Set(prev);
    const all = rows.every((r) => next.has(r.itemId));
    for (const r of rows) { if (all) next.delete(r.itemId); else next.add(r.itemId); }
    return next;
  });
  const pick = (t: Ticket, range: boolean) => { toggle(t, range); setAnchor(t.itemId); };
  const selectedTickets = tickets.filter((t) => selected.has(t.itemId));

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
        <span className="mr-1 text-xs font-medium text-muted-foreground">Group by</span>
        <div className="max-w-full overflow-x-auto [scrollbar-width:none]"><Segmented label="Group by" value={group} onChange={(v) => void setGroup(v)} options={GROUPS} /></div>
        <span className="ml-auto hidden md:inline"><CustomiseMenu layout={cols} label="Columns" heading="Show columns" labels={COLUMNS} /></span>
      </div>
      <MobileList board={board} groups={groups} selected={selected} onPick={pick} />
      <div className="hidden min-h-0 flex-1 overflow-auto rounded-xl border bg-card shadow-card md:block">
        <table className="w-full min-w-[1180px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
            <tr className="border-b">
              <th scope="col" className="w-10 pl-3">
                <Checkbox aria-label="Select all shown" checked={flat.length > 0 && flat.every((t) => selected.has(t.itemId))}
                  indeterminate={selected.size > 0 && !flat.every((t) => selected.has(t.itemId))} onCheckedChange={() => toggleAll(flat)} />
              </th>
              {head("number", "#", "w-16")}{head("title", "Title", "min-w-[18rem]")}
              {cols.visible.map((c) => SORTS[c] ? <Fragment key={c}>{head(SORTS[c]!, COLUMNS[c], WIDTH[c])}</Fragment>
                : <th key={c} scope="col" className={cn("px-2 text-left text-xs font-medium text-muted-foreground", WIDTH[c])}>{COLUMNS[c]}</th>)}
            </tr>
          </thead>
          {groups.map(([name, rows]) => (
            <tbody key={name}>
              {group !== "none" && (
                <tr className="border-b">
                  <th colSpan={span} scope="rowgroup" className="px-3 pt-4 pb-1.5 text-left">
                    {rows.length > 0 && <span className="mr-2 inline-flex align-middle"><Checkbox aria-label={`Select all in ${name}`} checked={rows.every((r) => selected.has(r.itemId))} onCheckedChange={() => toggleAll(rows)} /></span>}
                    <button className="inline-flex items-center gap-1.5 text-xs font-semibold" aria-expanded={!collapsed.has(name)}
                      onClick={() => setCollapsed((s) => { const n = new Set(s); if (n.has(name)) n.delete(name); else n.add(name); return n; })}>
                      <ChevronRight className={cn("size-3.5 transition-transform", !collapsed.has(name) && "rotate-90")} /><GroupTitle by={group} name={name} />
                      <span className="font-normal text-muted-foreground">{rows.length}{group === "sprint" && rows.length ? ` · ${rows.reduce((s, t) => s + (t.fields["Story Points"] ?? 0), 0)} pts` : ""}</span>
                    </button>
                  </th>
                </tr>
              )}
              {!collapsed.has(name) && rows.map((t) => <Row key={`${name}-${t.itemId}`} board={board} t={t} columns={cols.visible} checked={selected.has(t.itemId)} onCheck={(range) => pick(t, range)} />)}
              {!collapsed.has(name) && <AddRow board={board} by={group} name={name} span={span} />}
            </tbody>
          ))}
        </table>
        {!tickets.length && <EmptyState icon={SearchX} title="No tickets match" text="Try removing a filter, or search for something else." />}
      </div>
      <BulkBar board={board} selected={selectedTickets} onClear={() => setSelected(new Set())} />
    </div>
  );
}

function Row({ board, t, columns, checked, onCheck }: { board: Board; t: Ticket; columns: string[]; checked: boolean; onCheck: (range: boolean) => void }) {
  const [, open] = useOpenTicket();
  return (
    <tr className={cn("group border-b last:border-0 hover:bg-muted/40", checked && "bg-accent/50 hover:bg-accent/60", isDone(t) && "text-muted-foreground")}>
      <td className="pl-3" onClick={(e) => { if (e.shiftKey) { e.preventDefault(); onCheck(true); } }}>
        <Checkbox aria-label={`Select #${t.number}`} checked={checked} onCheckedChange={() => onCheck(false)} />
      </td>
      <td className="py-1 font-mono text-xs text-muted-foreground">#{t.number}</td>
      <td className="max-w-0 min-w-[18rem] px-2 py-1">
        <CardMenu board={board} ticket={t}>
          <div className="flex min-w-0 items-center gap-2">
            <StatusSwitch board={board} ticket={t} />
            <TicketPreview board={board} ticket={t}>
              <button onClick={() => void open(t.number)} className="flex min-w-0 items-center gap-2 text-left hover:underline">
                <TypeIcon ticket={t} /><span className={cn("truncate font-medium", isDone(t) && "line-through")}>{cleanTitle(t.title)}</span>
              </button>
            </TicketPreview>
            <span className="hidden shrink-0 xl:inline"><TicketMeta ticket={{ ...t, fields: { ...t.fields, "Target date": undefined } }} /></span>
          </div>
        </CardMenu>
      </td>
      {columns.map((c) => <td key={c} className="px-1"><Cell id={c} board={board} t={t} /></td>)}
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

function MobileList({ board, groups, selected, onPick }: {
  board: Board; groups: [string, Ticket[]][]; selected: Set<string>; onPick: (t: Ticket, range: boolean) => void;
}) {
  const actions = useActions();
  const [, open] = useOpenTicket();
  return (
    <div className="space-y-4 pb-24 md:hidden">
      {groups.map(([name, rows]) => (
        <section key={name} aria-label={name}>
          {name !== "All" && <h3 className="mb-1.5 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{name} <span className="font-normal">· {rows.length}</span></h3>}
          <ul className="space-y-2">
            {rows.map((t) => (
              <li key={t.itemId} className={cn("rounded-xl border bg-card p-3 shadow-card", selected.has(t.itemId) && "border-primary bg-accent/50")}>
                <div className="flex items-start gap-2.5">
                  <Checkbox className="mt-0.5" aria-label={`Select #${t.number}`} checked={selected.has(t.itemId)} onCheckedChange={() => onPick(t, false)} />
                  <button onClick={() => void open(t.number)} className="flex min-w-0 flex-1 items-start gap-2 text-left">
                    <TypeIcon ticket={t} />
                    <span className="min-w-0">
                      <span className={cn("block text-[15px] leading-snug font-medium", isDone(t) && "text-muted-foreground line-through")}>{cleanTitle(t.title)}</span>
                      <span className="mt-1 flex items-center gap-2"><span className="font-mono text-[11px] text-muted-foreground">#{t.number}</span><TicketMeta ticket={t} /></span>
                    </span>
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 border-t pt-2">
                  <OptionPicker board={board} field="Status" label="Status" value={t.fields.Status} onChange={(v) => v && void actions.move(t, v)} />
                  <OptionPicker board={board} field="Priority" label="Priority" value={t.fields.Priority} onChange={(v) => void actions.setField(t, "Priority", v)} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function StatusSwitch({ board, ticket: t }: { board: Board; ticket: Ticket }) {
  const actions = useActions();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<button aria-label={`Status of #${t.number}: ${plain(t.fields.Status) || "none"}. Change`} title="Change status"
        className="grid size-6 shrink-0 place-items-center rounded-md transition-colors hover:bg-muted" />}>
        <StatusIcon name={t.fields.Status} size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuRadioGroup value={t.fields.Status ?? ""} onValueChange={(v: string) => void actions.move(t, v)}>
          {options(board, "Status").map((o) => <DropdownMenuRadioItem key={o.id} value={o.name}><StatusIcon name={o.name} size={15} />{plain(o.name)}</DropdownMenuRadioItem>)}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
