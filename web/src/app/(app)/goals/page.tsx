"use client";

import { BrandLoader } from "@/components/brand/logo";
import { ErrorState } from "@/components/brand/states";
import { cleanTitle, TypeIcon } from "@/components/ticket/bits";
import { StatusIcon } from "@/components/ticket/status-icons";
import { TicketSearch } from "@/components/ticket/search-pickers";
import { DateInput } from "@/components/ticket/pickers";
import { Button } from "@/components/ui/button";
import { dueInfo, isDone, today } from "@/lib/board";
import { useBoard } from "@/lib/data";
import { health, useGoalActions, useMilestones, type Health } from "@/lib/goals";
import type { Board, Milestone } from "@/lib/types";
import { useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { ChevronRight, Pencil, Plus, X } from "@/components/icons";
import * as P from "@phosphor-icons/react";
import { ViewTabs } from "@/components/shell/view-tabs";
import { format, parseISO } from "date-fns";
import { Suspense, useState } from "react";

// Goals & milestones (ClickUp Goals, on GitHub milestones): each goal is a
// target date plus the tickets that reach it, with progress and health.

const HEALTH: Record<Health, { label: string; cls: string; icon: P.Icon }> = {
  "on-track": { label: "On track", cls: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300", icon: P.TrendUp },
  "at-risk": { label: "At risk", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300", icon: P.Warning },
  overdue: { label: "Overdue", cls: "bg-destructive/12 text-destructive", icon: P.Alarm },
  done: { label: "Done", cls: "bg-primary/12 text-primary", icon: P.CheckCircle },
  "no-date": { label: "No date", cls: "bg-muted text-muted-foreground", icon: P.CalendarBlank },
};

export default function GoalsPage() {
  const { data: board, error, isLoading, refetch } = useBoard();
  const ms = useMilestones();
  if (error || ms.error) return <div className="p-6"><ErrorState title="We couldn't load the goals" message={((error ?? ms.error) as Error).message} onRetry={() => { void refetch(); void ms.refetch(); }} /></div>;
  if (isLoading || !board || ms.isLoading) return <div className="grid flex-1 place-items-center"><BrandLoader /></div>;
  return <Goals board={board} milestones={ms.data ?? []} />;
}

function Goals({ board, milestones }: { board: Board; milestones: Milestone[] }) {
  const [adding, setAdding] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const open = milestones.filter((m) => m.state === "OPEN").sort((a, b) => (a.dueOn ?? "9999").localeCompare(b.dueOn ?? "9999"));
  const closed = milestones.filter((m) => m.state === "CLOSED");
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-3 pb-8 md:px-6 md:pt-4">
      <header className="flex min-h-9 flex-wrap items-center gap-3">
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 className="shrink-0 text-xl leading-tight font-semibold">Goals</h1>
          <p className="hidden truncate text-sm text-muted-foreground lg:block">Targets with a date and the tickets that reach them. Stored as GitHub milestones.</p>
        </div>
        <Button size="sm" className="ml-auto" onClick={() => setAdding(true)}><Plus />New goal</Button>
      </header>
      <Suspense fallback={null}><ViewTabs /></Suspense>

      {adding && <GoalForm onDone={() => setAdding(false)} />}

      {open.length ? (
        <div className="grid gap-4 lg:grid-cols-2">{open.map((m) => <GoalCard key={m.number} board={board} m={m} />)}</div>
      ) : !adding && (
        <div className="grid place-items-center gap-3 rounded-2xl border bg-card px-6 py-14 text-center shadow-card">
          <span className="grid size-14 place-items-center rounded-2xl bg-accent text-primary"><P.Target size={30} weight="duotone" /></span>
          <p className="text-lg font-semibold">Set your first goal</p>
          <p className="max-w-md text-sm text-muted-foreground">A goal is a target date, like &ldquo;Beta launch by 30 Nov&rdquo;. Attach tickets to it and the progress fills in as they&apos;re finished.</p>
          <Button onClick={() => setAdding(true)}><Plus />New goal</Button>
        </div>
      )}

      {closed.length > 0 && (
        <section>
          <button onClick={() => setShowClosed(!showClosed)} aria-expanded={showClosed} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ChevronRight className={cn("size-4 transition-transform", showClosed && "rotate-90")} />Closed goals<span className="font-normal">{closed.length}</span>
          </button>
          {showClosed && <div className="mt-3 grid gap-4 lg:grid-cols-2">{closed.map((m) => <GoalCard key={m.number} board={board} m={m} />)}</div>}
        </section>
      )}
    </div>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" className="size-16 shrink-0 -rotate-90" aria-hidden>
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="7" className="stroke-muted" />
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="7" strokeLinecap="round" className="stroke-primary transition-[stroke-dashoffset] duration-700"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
    </svg>
  );
}

function GoalCard({ board, m }: { board: Board; m: Milestone }) {
  const actions = useGoalActions();
  const [, open] = useOpenTicket();
  const [editing, setEditing] = useState(false);
  const total = m.open + m.closed;
  const pct = total ? m.closed / total : 0;
  const h = HEALTH[health(m, today())];
  const tickets = board.tickets.filter((t) => t.milestone?.number === m.number).sort((a, b) => Number(isDone(a)) - Number(isDone(b)));
  const due = m.dueOn ? dueInfo(m.dueOn, m.state === "CLOSED") : null;
  if (editing) return <GoalForm goal={m} onDone={() => setEditing(false)} />;
  return (
    <article className="flex flex-col rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex items-start gap-4">
        <div className="relative grid place-items-center">
          <Ring pct={pct} />
          <span className="absolute text-sm font-bold tabular">{Math.round(pct * 100)}%</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h2 className="min-w-0 flex-1 text-base leading-snug font-semibold">{m.title}</h2>
            <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", h.cls)}><h.icon size={12} weight="bold" />{h.label}</span>
          </div>
          {m.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{m.description}</p>}
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {m.dueOn ? <span className="inline-flex items-center gap-1"><P.CalendarBlank size={13} />{format(parseISO(m.dueOn), "EEE d MMM yyyy")}{due && m.state === "OPEN" && <> · {due.tone === "overdue" ? (due.label || `${-due.days} days ago`) : due.days > 6 ? `${due.days} days left` : due.label}</>}</span> : <span>No target date</span>}
            <span>{m.closed} of {total} ticket{total === 1 ? "" : "s"} done</span>
          </p>
        </div>
      </div>

      <ul className="mt-4 divide-y rounded-xl border">
        {tickets.slice(0, 6).map((t) => (
          <li key={t.url} className="group/gt flex items-center gap-2 px-3 py-1.5 text-sm">
            <StatusIcon name={t.fields.Status} size={14} />
            <button onClick={() => void open(t.number)} className="flex min-w-0 flex-1 items-center gap-2 text-left hover:underline">
              <TypeIcon ticket={t} size={16} /><span className={cn("truncate", isDone(t) && "text-muted-foreground line-through")}>{cleanTitle(t.title)}</span>
            </button>
            <button onClick={() => void actions.attach(t, null)} aria-label={`Remove #${t.number} from this goal`} className="grid size-6 place-items-center rounded text-muted-foreground opacity-0 group-hover/gt:opacity-100 hover:text-destructive focus-visible:opacity-100 [@media(hover:none)]:opacity-100"><X className="size-3" /></button>
          </li>
        ))}
        {tickets.length > 6 && <li className="px-3 py-1.5 text-xs text-muted-foreground">+{tickets.length - 6} more</li>}
        {!tickets.length && <li className="px-3 py-3 text-center text-xs text-muted-foreground">No tickets yet. Add the ones that reach this goal.</li>}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {m.state === "OPEN" && (
          <TicketSearch tickets={board.tickets.filter((t) => !t.milestone && !isDone(t))} exclude={[]} placeholder="Add which ticket to this goal?"
            onPick={(t) => void actions.attach(t, m)} trigger={<Button size="sm" variant="outline"><Plus />Add ticket</Button>} />
        )}
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><Pencil />Edit</Button>
        {m.state === "OPEN"
          ? <Button size="sm" variant="ghost" className="ml-auto" onClick={() => void actions.close(m)}><P.CheckCircle />Close goal</Button>
          : <Button size="sm" variant="ghost" className="ml-auto" onClick={() => void actions.reopen(m)}><P.ArrowCounterClockwise />Reopen</Button>}
      </div>
    </article>
  );
}

function GoalForm({ goal, onDone }: { goal?: Milestone; onDone: () => void }) {
  const actions = useGoalActions();
  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [dueOn, setDueOn] = useState<string | null>(goal?.dueOn ?? null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!title.trim()) return;
    setBusy(true);
    const ok = await actions.save({ number: goal?.number, title: title.trim(), description: description.trim(), dueOn, state: goal?.state });
    setBusy(false);
    if (ok) onDone();
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="field-frame space-y-3 rounded-2xl border bg-card p-5 shadow-card">
      <p className="flex items-center gap-2 text-sm font-semibold"><P.Target weight="duotone" className="size-4 text-primary" />{goal ? "Edit goal" : "New goal"}</p>
      <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Self-serve reporting beta" aria-label="Goal name"
        className="h-11 w-full rounded-xl border bg-background px-3 text-base font-medium outline-none focus:border-ring" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What does success look like? (optional)" aria-label="Description"
        className="w-full resize-y rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-ring" />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Target date</span>
        <span className="w-52"><DateInput label="Target date" value={dueOn ?? undefined} onChange={(v) => setDueOn(v)} /></span>
        <span className="ml-auto flex gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
          <Button type="submit" disabled={!title.trim() || busy}>{goal ? "Save" : "Create goal"}</Button>
        </span>
      </div>
    </form>
  );
}
