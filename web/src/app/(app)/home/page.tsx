"use client";

import { BrandLoader } from "@/components/brand/logo";
import { ErrorState } from "@/components/brand/states";
import { NotificationBell } from "@/components/notifications/bell";
import { RunningTimer } from "@/components/shell/running-timer";
import { cleanTitle, DueChip, PriorityChip, TypeIcon } from "@/components/ticket/bits";
import { StatusIcon } from "@/components/ticket/status-icons";
import { Segmented } from "@/components/ui-plus/segmented";
import { CardMenu } from "@/components/views/card-menu";
import { Button } from "@/components/ui/button";
import { addDays, byPriorityThenNumber, isDone, today } from "@/lib/board";
import { useBoard } from "@/lib/data";
import { toggleFavorite, useFavorites } from "@/lib/favorites";
import { completeReminder, deleteReminder, openReminder, useReminders } from "@/lib/reminders";
import type { Board, Ticket } from "@/lib/types";
import { useNewTicket, useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { ChevronRight, Plus, Sun, X } from "@/components/icons";
import * as P from "@phosphor-icons/react";
import { format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

// Home (ClickUp): your LineUp of starred priorities, a To Do list split into
// Today / Overdue / Next / Unscheduled with Mine, Comments, Done and Delegated
// tabs, and an agenda of the week beside it.

const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };

type Tab = "mine" | "comments" | "done" | "delegated";

export default function HomePage() {
  const { data: board, error, isLoading, refetch } = useBoard();
  const [, newTicket] = useNewTicket();
  if (error) return <div className="p-6"><ErrorState title="We couldn't load the board" message={(error as Error).message} onRetry={() => void refetch()} /></div>;
  if (isLoading || !board) return <div className="grid flex-1 place-items-center"><BrandLoader /></div>;
  const first = (board.viewer.name || board.viewer.login).split(/\s+/)[0];
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-y-auto p-4 md:p-6">
      <header className="flex flex-wrap items-end gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{format(parseISO(today()), "EEEE, d MMMM")}</p>
          <h1 className="text-2xl font-semibold sm:text-[1.75rem]">{greeting()}, {first}</h1>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="md:hidden"><NotificationBell compact /></span>
          <Button size="sm" onClick={() => void newTicket("pick")}><Plus />New ticket</Button>
        </div>
      </header>
      <div className="md:hidden"><RunningTimer /></div>
      <LineUp board={board} />
      <div className="grid shrink-0 gap-5 pb-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <ToDo board={board} />
        <div className="flex min-w-0 flex-col gap-5">
          <Reminders />
          <Agenda board={board} />
        </div>
      </div>
    </div>
  );
}

function Panel({ title, action, children, className }: { title: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border bg-card shadow-card", className)}>
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        <span className="ml-auto">{action}</span>
      </header>
      {children}
    </section>
  );
}

// LineUp: the starred tickets you've chosen as today's priorities.
function LineUp({ board }: { board: Board }) {
  const favorites = useFavorites();
  const [, open] = useOpenTicket();
  const line = favorites.map((u) => board.tickets.find((t) => t.url === u)).filter((t): t is Ticket => !!t && !isDone(t));
  return (
    <Panel title={<span className="inline-flex items-center gap-2"><P.Lightning weight="duotone" className="ico size-4 text-primary" />LineUp</span>}
      action={<span className="text-xs text-muted-foreground">Star a ticket (☆ in its header) to add it here</span>}>
      <div className="flex gap-2 overflow-x-auto p-3">
        {line.map((t, i) => (
          <div key={t.url} className="group/lu flex w-64 shrink-0 items-center gap-2 rounded-xl border bg-background px-3 py-2.5 transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-card">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/12 text-[11px] font-bold text-primary tabular">{i + 1}</span>
            <button onClick={() => void open(t.number)} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-medium">{cleanTitle(t.title)}</span>
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><StatusIcon name={t.fields.Status} size={11} />#{t.number}</span>
            </button>
            <button onClick={() => toggleFavorite(t.url)} aria-label={`Remove #${t.number} from LineUp`} className="grid size-6 place-items-center rounded text-muted-foreground opacity-0 group-hover/lu:opacity-100 hover:text-foreground focus-visible:opacity-100">
              <X className="size-3" />
            </button>
          </div>
        ))}
        {!line.length && <p className="px-1 py-2 text-sm text-muted-foreground">Your LineUp is empty. Star the tickets that matter most today and they&apos;ll line up here.</p>}
      </div>
    </Panel>
  );
}

function ToDo({ board }: { board: Board }) {
  const [tab, setTab] = useState<Tab>("mine");
  const me = board.viewer.login;
  const now = today(), week = addDays(now, 7);
  const mine = (t: Ticket) => t.assignees.some((a) => a.login === me);
  const lists: Record<Tab, Ticket[]> = {
    mine: board.tickets.filter((t) => mine(t) && !isDone(t)),
    comments: board.tickets.filter((t) => (mine(t) || t.author?.login === me) && t.commentCount > 0 && !isDone(t)),
    done: board.tickets.filter((t) => mine(t) && isDone(t) && (t.closedAt ?? "") >= addDays(now, -14)),
    delegated: board.tickets.filter((t) => t.author?.login === me && t.assignees.length > 0 && !mine(t) && !isDone(t)),
  };
  const list = [...lists[tab]].sort(byPriorityThenNumber);
  const due = (t: Ticket) => t.fields["Target date"];
  const groups: [string, Ticket[], string?][] = tab === "done"
    ? [["Finished in the last 14 days", list]]
    : [
      ["Overdue", list.filter((t) => due(t) && due(t)! < now), "text-destructive"],
      ["Today", list.filter((t) => due(t) === now), "text-amber-600 dark:text-amber-400"],
      ["Next 7 days", list.filter((t) => due(t) && due(t)! > now && due(t)! <= week)],
      ["Later", list.filter((t) => due(t) && due(t)! > week)],
      ["Unscheduled", list.filter((t) => !due(t))],
    ];
  return (
    <Panel title="To Do" action={
      <Segmented size="xs" label="Show" value={tab} onChange={setTab}
        options={[["mine", `Mine · ${lists.mine.length}`], ["comments", "Comments"], ["done", "Done"], ["delegated", "Delegated"]] as const} />
    }>
      <div className="p-2">
        {groups.filter(([, ts]) => ts.length).map(([name, ts, tone]) => <Group key={name} board={board} name={name} tone={tone} tickets={ts} />)}
        {!list.length && (
          <div className="grid place-items-center gap-2 px-6 py-12 text-center">
            <Sun className="size-8 text-amber-500" />
            <p className="font-medium">{tab === "done" ? "Nothing finished in the last two weeks" : tab === "delegated" ? "Nothing you've handed to others is open" : tab === "comments" ? "No conversations waiting" : "Nothing on your plate"}</p>
            <p className="text-sm text-muted-foreground">{tab === "mine" ? "Pick something up from the Board, or enjoy the calm." : "Switch tabs to see the rest of your work."}</p>
          </div>
        )}
      </div>
    </Panel>
  );
}

function Group({ board, name, tone, tickets }: { board: Board; name: string; tone?: string; tickets: Ticket[] }) {
  const [open, setOpen] = useState(true);
  const [, show] = useOpenTicket();
  return (
    <div className="mb-1">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[13px] font-semibold hover:bg-muted/50">
        <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
        <span className={tone}>{name}</span><span className="text-xs font-normal text-muted-foreground tabular">{tickets.length}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            {tickets.map((t) => (
              <CardMenu key={t.url} board={board} ticket={t}>
                <li className="group/row flex items-center gap-2.5 rounded-lg py-1.5 pr-2 pl-7 text-sm transition-colors hover:bg-muted/50">
                  <StatusIcon name={t.fields.Status} size={15} />
                  <button onClick={() => void show(t.number)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <TypeIcon ticket={t} size={16} /><span className={cn("truncate", isDone(t) && "text-muted-foreground line-through")}>{cleanTitle(t.title)}</span>
                  </button>
                  <span className="hidden text-xs sm:inline">{t.fields["Target date"] && <DueChip due={t.fields["Target date"]} done={isDone(t)} />}</span>
                  <span className="hidden md:inline"><PriorityChip value={t.fields.Priority} /></span>
                </li>
              </CardMenu>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// The next seven days, one row per day, with what's due on each.
function Agenda({ board }: { board: Board }) {
  const [, open] = useOpenTicket();
  const me = board.viewer.login;
  const now = today();
  const days = Array.from({ length: 7 }, (_, i) => addDays(now, i));
  const dueOn = (d: string) => board.tickets.filter((t) => t.fields["Target date"] === d && !isDone(t)).sort(byPriorityThenNumber);
  return (
    <Panel title={<span className="inline-flex items-center gap-2"><P.CalendarDots weight="duotone" className="ico size-4 text-primary" />This week</span>}
      action={<Link href="/calendar/" className="text-xs text-muted-foreground hover:text-foreground">Open calendar →</Link>}>
      <ol className="divide-y">
        {days.map((d) => {
          const ts = dueOn(d);
          const isToday = d === now;
          return (
            <li key={d} className="flex gap-3 px-4 py-2.5">
              <span className={cn("grid w-10 shrink-0 place-items-center rounded-lg py-1 text-center leading-tight", isToday ? "bg-primary text-primary-foreground" : "bg-muted/60")}>
                <span className="text-[10px] font-semibold uppercase">{format(parseISO(d), "EEE")}</span>
                <span className="text-base font-semibold tabular">{format(parseISO(d), "d")}</span>
              </span>
              <div className="min-w-0 flex-1 space-y-1 py-0.5">
                {ts.slice(0, 3).map((t) => (
                  <button key={t.url} onClick={() => void open(t.number)} className="flex w-full items-center gap-1.5 truncate rounded-md px-1.5 py-0.5 text-left text-[13px] hover:bg-muted">
                    <StatusIcon name={t.fields.Status} size={12} />
                    <span className={cn("truncate", t.assignees.some((a) => a.login === me) && "font-medium")}>{cleanTitle(t.title)}</span>
                  </button>
                ))}
                {ts.length > 3 && <p className="px-1.5 text-xs text-muted-foreground">+{ts.length - 3} more</p>}
                {!ts.length && <p className="px-1.5 py-0.5 text-xs text-muted-foreground/70">{isToday ? "Nothing due today" : "—"}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

const isPast = (iso: string) => new Date(iso).getTime() <= Date.now();

// Your reminders (press R anywhere to add one).
function Reminders() {
  const list = useReminders().filter((r) => !r.done);
  const [, open] = useOpenTicket();
  return (
    <Panel title={<span className="inline-flex items-center gap-2"><P.Alarm weight="duotone" className="ico size-4 text-primary" />Reminders</span>}
      action={<Button size="xs" variant="ghost" onClick={() => openReminder()}><Plus />New<kbd className="ml-1 text-[10px] text-muted-foreground">R</kbd></Button>}>
      <ul className="divide-y">
        {list.slice(0, 6).map((r) => {
          const due = isPast(r.at);
          return (
            <li key={r.id} className="group/rm flex items-start gap-2.5 px-4 py-2.5">
              <button onClick={() => completeReminder(r.id)} aria-label={`Mark "${r.text}" done`} title="Done"
                className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-2 border-muted-foreground/40 transition-colors hover:border-success hover:bg-success/15" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{r.text}</p>
                <p className={cn("text-xs", due ? "font-medium text-destructive" : "text-muted-foreground")}>
                  {due ? "Due · " : ""}{format(new Date(r.at), "EEE d MMM, h:mm a")}
                  {r.ticket && <> · <button onClick={() => void open(r.ticket!)} className="hover:underline">#{r.ticket}</button></>}
                </p>
              </div>
              <button onClick={() => deleteReminder(r.id)} aria-label={`Delete reminder "${r.text}"`} className="grid size-6 place-items-center rounded text-muted-foreground opacity-0 group-hover/rm:opacity-100 hover:text-destructive focus-visible:opacity-100 [@media(hover:none)]:opacity-100">
                <X className="size-3" />
              </button>
            </li>
          );
        })}
        {!list.length && <li className="px-4 py-5 text-center text-sm text-muted-foreground">No reminders. Press <kbd className="rounded border px-1 text-xs">R</kbd> anywhere to set one.</li>}
        {list.length > 6 && <li className="px-4 py-2 text-xs text-muted-foreground">+{list.length - 6} more</li>}
      </ul>
    </Panel>
  );
}
