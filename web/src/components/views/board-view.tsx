"use client";

import { dropTargetForElements, monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Button } from "@/components/ui/button";
import { byPriorityThenNumber, dotClass, options, plain } from "@/lib/board";
import { useActions } from "@/lib/data";
import type { Board, Option, Ticket } from "@/lib/types";
import { useGroupBy, useNewTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { LayoutGroup } from "motion/react";
import { ArrowLeft, ArrowRight, ChevronRight, ChevronsLeftRight, EyeOff, MoreHorizontal, Plus } from "@/components/icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLayout, type Layout } from "@/lib/layout";
import { CustomiseMenu } from "../layout/custom-section";
import { Segmented } from "../ui-plus/segmented";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "../ticket/bits";
import { DragDock, type DockAction } from "./drag-dock";
import { TicketCard } from "./ticket-card";

// Work-in-progress limits, matching .github/workflows/board-health.yml.
const WIP: Record<string, number> = { "In Progress": 5, "Code Review": 3, QA: 4 };
const wipFor = (status: string) => Object.entries(WIP).find(([k]) => status.includes(k))?.[1];

type Lane = { key: string; title: React.ReactNode; tickets: Ticket[] };

function lanesFor(board: Board, tickets: Ticket[], by: string): Lane[] {
  if (by === "priority") {
    const opts = options(board, "Priority");
    return [...opts.map((o) => ({ key: o.name, title: <><span className={cn("size-2 rounded-full", dotClass(o.color))} />{o.name}</>, tickets: tickets.filter((t) => t.fields.Priority === o.name) })),
      { key: "none", title: "No priority", tickets: tickets.filter((t) => !t.fields.Priority) }];
  }
  if (by === "assignee") {
    return [...board.people.map((p) => ({ key: p.login, title: <><Avatar person={p} size={18} />{p.name || p.login}</>, tickets: tickets.filter((t) => t.assignees.some((a) => a.login === p.login)) })),
      { key: "none", title: "Unassigned", tickets: tickets.filter((t) => !t.assignees.length) }];
  }
  if (by === "type") {
    const opts = options(board, "Ticket Type");
    return [...opts.map((o) => ({ key: o.name, title: o.name, tickets: tickets.filter((t) => t.fields["Ticket Type"] === o.name) })),
      { key: "none", title: "No type", tickets: tickets.filter((t) => !t.fields["Ticket Type"]) }];
  }
  return [{ key: "all", title: null, tickets }];
}

// Type a title straight into a column, like Trello: Enter creates it there,
// Esc cancels, and the full form is one click away for more detail.
function QuickAdd({ board, status, onDone }: { board: Board; status: string; onDone: () => void }) {
  const actions = useActions();
  const [, newTicket] = useNewTicket();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!title.trim()) return onDone();
    setBusy(true);
    const type = options(board, "Ticket Type").find((o) => /task/i.test(o.name))?.name;
    const n = await actions.create({ title: `[Task] ${title.trim()}`, body: "", labels: ["task"], assignees: [], fields: { Status: status, "Ticket Type": type } });
    setBusy(false);
    if (n) { setTitle(""); toast.success(`#${n} added to ${plain(status)}`); }
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="rounded-xl border border-primary/50 bg-card p-2 shadow-pop">
      <textarea autoFocus value={title} onChange={(e) => setTitle(e.target.value)} rows={2} placeholder="What needs doing?" aria-label="New ticket title"
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit(); } if (e.key === "Escape") onDone(); }}
        className="w-full resize-none bg-transparent text-sm outline-none" />
      <div className="flex items-center gap-1">
        <Button type="submit" size="xs" disabled={busy}>{busy ? "Adding…" : "Add"}</Button>
        <Button type="button" size="xs" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button type="button" size="xs" variant="ghost" className="ml-auto text-muted-foreground" onClick={() => { onDone(); void newTicket("pick"); }}>Full form</Button>
      </div>
    </form>
  );
}

export function BoardView({ board, tickets }: { board: Board; tickets: Ticket[] }) {
  const actions = useActions();
  const [group, setGroup] = useGroupBy("none");
  const allStatuses = options(board, "Status");
  // Columns can be hidden, collapsed and reordered per person.
  const cols = useLayout("board-columns", allStatuses.map((o) => o.name));
  const statuses = cols.visible.map((n) => allStatuses.find((o) => o.name === n)!).filter(Boolean);
  const lanes = useMemo(() => lanesFor(board, tickets, group).filter((l) => l.key === "all" || l.tickets.length), [board, tickets, group]);
  // One monitor for the whole board: a card dropped on a column changes its Status.
  const onDrop = useEffectEvent((number: unknown, data: Record<string, unknown>) => {
    const t = tickets.find((x) => x.number === number);
    if (!t) return;
    const dock = data as DockAction | Record<string, unknown>;
    if ("action" in dock) {
      if (dock.action === "assign" && typeof dock.login === "string" && !t.assignees.some((a) => a.login === dock.login))
        void actions.setAssignees(t, [...t.assignees.map((a) => a.login), dock.login]);
      if (dock.action === "priority" && typeof dock.value === "string") void actions.setField(t, "Priority", dock.value);
      if (dock.action === "wontdo") void actions.setState(t, "CLOSED", "NOT_PLANNED");
      return;
    }
    const status = data.status as string;
    if (!status || t.fields.Status === status) return;
    void actions.move(t, status);
    const n = tickets.filter((x) => x.fields.Status === status).length + 1;
    const limit = wipFor(status);
    if (limit && n > limit) toast.warning(`${plain(status)} now has ${n} tickets (limit ${limit}). Finish something before starting more.`);
  });
  useEffect(() => monitorForElements({
    onDrop({ source, location }) {
      const target = location.current.dropTargets[0];
      if (target) onDrop(source.data.ticket, target.data);
    },
  }), []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-2 overflow-x-auto text-sm [scrollbar-width:none]">
        <span className="shrink-0 text-xs font-medium text-muted-foreground">Swimlanes</span>
        <Segmented label="Swimlanes" value={group} onChange={(v) => void setGroup(v)} options={[["none", "None"], ["priority", "Priority"], ["assignee", "People"], ["type", "Type"]] as const} />
        <span className="ml-auto shrink-0"><CustomiseMenu layout={cols} label="Columns" heading="Show columns" labels={Object.fromEntries(allStatuses.map((o) => [o.name, o.name]))} /></span>
      </div>
      <LayoutGroup>
        <div className="min-h-0 flex-1 overflow-auto pb-4">
          {lanes.map((lane) => <LaneRow key={lane.key} board={board} lane={lane} statuses={statuses} allStatuses={allStatuses} cols={cols} showTitle={lane.key !== "all"} />)}
        </div>
      </LayoutGroup>
      <DragDock board={board} />
    </div>
  );
}

function LaneRow({ board, lane, statuses, allStatuses, cols, showTitle }: { board: Board; lane: Lane; statuses: Option[]; allStatuses: Option[]; cols: Layout; showTitle: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const noStatus = lane.tickets.filter((t) => !t.fields.Status || !allStatuses.some((s) => s.name === t.fields.Status));
  return (
    <section className="mb-4" aria-label={typeof lane.title === "string" ? lane.title : undefined}>
      {showTitle && (
        <button onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed} className="sticky left-0 mb-2 flex items-center gap-2 text-sm font-semibold">
          <ChevronRight className={cn("size-4 transition-transform", !collapsed && "rotate-90")} />{lane.title}
          <span className="text-xs font-normal text-muted-foreground">{lane.tickets.length}</span>
        </button>
      )}
      {!collapsed && (
        <div className="flex snap-x snap-mandatory gap-3 sm:snap-none">
          {noStatus.length > 0 && <Column board={board} status={null} tickets={noStatus} scope={lane.key} />}
          {statuses.map((s) => <Column key={s.id} board={board} status={s} scope={lane.key} cols={cols} tickets={lane.tickets.filter((t) => t.fields.Status === s.name)} />)}
        </div>
      )}
    </section>
  );
}

function Column({ board, status, tickets, scope, cols }: { board: Board; status: Option | null; tickets: Ticket[]; scope: string; cols?: Layout }) {
  const ref = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);
  const [adding, setAdding] = useState(false);
  const [, newTicket] = useNewTicket();
  const limit = status ? wipFor(status.name) : undefined;
  const sorted = useMemo(() => [...tickets].sort(byPriorityThenNumber), [tickets]);
  const points = tickets.reduce((s, t) => s + (t.fields["Story Points"] ?? 0), 0);
  const folded = !!status && !!cols?.isCollapsed(status.name);
  const pos = status && cols ? cols.order.indexOf(status.name) : -1;

  useEffect(() => {
    const el = ref.current;
    if (!el || !status) return;
    return dropTargetForElements({ element: el, getData: () => ({ status: status.name }), onDragEnter: () => setOver(true), onDragLeave: () => setOver(false), onDrop: () => setOver(false) });
  }, [status]);

  if (folded && status && cols) {
    return (
      <div ref={ref} className={cn("flex w-11 shrink-0 snap-start flex-col items-center gap-2 rounded-2xl bg-muted/50 py-3 transition-colors", over && "bg-accent ring-2 ring-primary/40")}
        aria-label={`${status.name}, ${tickets.length} tickets, collapsed`}>
        <button onClick={() => cols.toggleCollapsed(status.name)} aria-label={`Expand ${status.name}`} className="flex flex-col items-center gap-2 rounded-lg px-1 py-1 hover:bg-muted">
          <span className={cn("size-2 rounded-full", dotClass(status.color))} aria-hidden />
          <span className="text-xs tabular text-muted-foreground">{tickets.length}</span>
          <span className="text-sm font-semibold [writing-mode:vertical-rl]">{status.name}</span>
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("group/col flex w-[min(85vw,18rem)] shrink-0 snap-start flex-col rounded-2xl bg-muted/50 p-2 transition-colors sm:w-72", over && "bg-accent ring-2 ring-primary/40")}
      aria-label={`${status?.name ?? "No status"}, ${tickets.length} tickets`}>
      <div className="flex items-center gap-2 px-1.5 pt-1 pb-2">
        <span className={cn("size-2 rounded-full", dotClass(status?.color))} aria-hidden />
        <h3 className="min-w-0 truncate text-sm font-semibold" title={status?.name}>{status?.name ?? "No status"}</h3>
        <span className={cn("shrink-0 rounded-md bg-background/70 px-1.5 text-xs tabular-nums text-muted-foreground", limit && tickets.length > limit && "bg-destructive/15 font-semibold text-destructive")}
          title={[limit ? `Limit ${limit}` : "", points ? `${points} story points` : ""].filter(Boolean).join(" · ") || undefined}>
          {tickets.length}{limit ? `/${limit}` : ""}
        </span>
        <Button variant="ghost" size="icon-xs" className="ml-auto" aria-label={`Add a ticket to ${status?.name ?? "this column"}`}
          onClick={() => (status ? setAdding(true) : void newTicket("pick"))}><Plus /></Button>
        {status && cols && (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`${status.name} column options`} />}><MoreHorizontal /></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem onClick={() => setAdding(true)}><Plus />Add ticket</DropdownMenuItem>
              <DropdownMenuItem onClick={() => cols.toggleCollapsed(status.name)}><ChevronsLeftRight />Collapse column</DropdownMenuItem>
              <DropdownMenuItem disabled={pos <= 0} onClick={() => cols.moveBy(status.name, -1)}><ArrowLeft />Move left</DropdownMenuItem>
              <DropdownMenuItem disabled={pos >= cols.order.length - 1} onClick={() => cols.moveBy(status.name, 1)}><ArrowRight />Move right</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => cols.toggleHidden(status.name)}><EyeOff />Hide column</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="flex min-h-16 flex-col gap-2">
        {adding && status && <QuickAdd board={board} status={status.name} onDone={() => setAdding(false)} />}
        {sorted.map((t) => <TicketCard key={t.number} board={board} ticket={t} layoutScope={scope} />)}
        {!tickets.length && <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">Drop tickets here</p>}
      </div>
    </div>
  );
}
