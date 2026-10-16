"use client";

import { BrandLoader } from "@/components/brand/logo";
import { ErrorState } from "@/components/brand/states";
import { cleanTitle, TypeIcon, Avatar } from "@/components/ticket/bits";
import { TicketSearch } from "@/components/ticket/search-pickers";
import { StatusIcon } from "@/components/ticket/status-icons";
import { Segmented } from "@/components/ui-plus/segmented";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDays, isDone, today } from "@/lib/board";
import { useBoard, useSource } from "@/lib/data";
import { fmtMinutes, startTimer, useTicketExtras } from "@/lib/ticket-extras";
import { entryDay, parseDuration, parseTime } from "@/lib/time-entry";
import type { Board, Comment, Ticket } from "@/lib/types";
import { useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Play, Plus, Trash2 } from "@/components/icons";
import * as P from "@phosphor-icons/react";
import { ViewTabs } from "@/components/shell/view-tabs";
import { useQueries } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";

// Timesheet (ClickUp): tickets × days for one week, with totals. Click a cell
// to log time for that day. Entries are the "⏱️ Logged" comments on each
// ticket, so the timesheet and the tickets always agree.

type Entry = { ticket: Ticket; comment: Comment; minutes: number; note: string; day: string; who: string };

const monday = (iso: string) => { const d = parseISO(iso); return addDays(iso, -((d.getDay() + 6) % 7)); };

export default function TimesheetPage() {
  const { data: board, error, isLoading, refetch } = useBoard();
  if (error) return <div className="p-6"><ErrorState title="We couldn't load the board" message={(error as Error).message} onRetry={() => void refetch()} /></div>;
  if (isLoading || !board) return <div className="grid flex-1 place-items-center"><BrandLoader /></div>;
  return <Timesheet board={board} />;
}

function Timesheet({ board }: { board: Board }) {
  const source = useSource();
  const [week, setWeek] = useState(() => monday(today()));
  const [who, setWho] = useState<"me" | "everyone">("me");
  const [view, setView] = useState<"grid" | "entries">("grid");
  const [extra, setExtra] = useState<string[]>([]);
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const end = days[6];
  const me = board.viewer.login;

  // Tickets that may hold entries for this week: anything touched since the
  // week began (a new comment updates the ticket) plus rows you added.
  const candidates = useMemo(() => board.tickets.filter((t) => t.updatedAt.slice(0, 10) >= addDays(week, -1) || extra.includes(t.url)), [board.tickets, week, extra]);
  const results = useQueries({
    queries: candidates.map((t) => ({ queryKey: ["comments", t.url], queryFn: () => source!.comments(t), enabled: !!source, staleTime: 60_000 })),
  });
  const loading = results.some((r) => r.isLoading);
  const entries: Entry[] = candidates.flatMap((t, i) => (results[i]?.data ?? []).flatMap((c) => {
    const e = parseTime(c.body);
    if (!e) return [];
    const day = entryDay(e, c.createdAt);
    return day >= week && day <= end ? [{ ticket: t, comment: c, minutes: e.minutes, note: e.note, day, who: c.author?.login ?? "" }] : [];
  })).filter((e) => who === "everyone" || e.who === me);

  const rowUrls = [...new Set([...entries.map((e) => e.ticket.url), ...extra])];
  const rows = rowUrls.map((u) => board.tickets.find((t) => t.url === u)).filter((t): t is Ticket => !!t);
  const sum = (f: (e: Entry) => boolean) => entries.filter(f).reduce((s, e) => s + e.minutes, 0);
  const total = sum(() => true);
  const isThisWeek = week === monday(today());
  const addRows = (ts: Ticket[]) => setExtra((x) => [...new Set([...x, ...ts.map((t) => t.url)])]);
  const mineOpen = board.tickets.filter((t) => t.assignees.some((a) => a.login === me) && !isDone(t));

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-3 pb-6 md:px-6 md:pt-4">
      <header className="flex min-h-9 flex-wrap items-center gap-3">
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 className="shrink-0 text-xl leading-tight font-semibold">Timesheet</h1>
          <p className="hidden truncate text-sm text-muted-foreground lg:block">Time logged on tickets, by day. Click a cell to add time for that day.</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Segmented size="sm" label="Whose time" value={who} onChange={setWho} options={[["me", "My time"], ["everyone", "Everyone"]] as const} />
          <Segmented size="sm" label="Show" value={view} onChange={setView} options={[["grid", "Timesheet"], ["entries", "Time entries"]] as const} />
        </div>
      </header>
      <Suspense fallback={null}><ViewTabs /></Suspense>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border bg-card p-0.5">
          <Button variant="ghost" size="icon-sm" aria-label="Previous week" onClick={() => setWeek(addDays(week, -7))}><ChevronLeft /></Button>
          <Button variant="ghost" size="sm" disabled={isThisWeek} onClick={() => setWeek(monday(today()))}>This week</Button>
          <Button variant="ghost" size="icon-sm" aria-label="Next week" onClick={() => setWeek(addDays(week, 7))}><ChevronRight /></Button>
        </div>
        <h2 className="text-lg font-semibold">{format(parseISO(week), "d MMM")} – {format(parseISO(end), "d MMM yyyy")}</h2>
        <span className="ml-auto rounded-lg bg-accent px-2.5 py-1 text-sm font-semibold text-accent-foreground tabular">{fmtMinutes(total)} total</span>
        <TicketSearch tickets={board.tickets} exclude={rows.map((t) => t.number)} placeholder="Add which ticket to this week?" onPick={(t) => addRows([t])}
          trigger={<Button size="sm" variant="outline"><Plus />Add ticket</Button>} />
      </div>

      {view === "grid" ? (
        rows.length ? (
          <div className="overflow-x-auto rounded-2xl border bg-card shadow-card">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th scope="col" className="px-4 py-2.5 text-left">Ticket</th>
                  {days.map((d) => (
                    <th key={d} scope="col" className={cn("w-[8.5%] px-1 py-2 text-center", d === today() && "text-primary")}>
                      <span className="block">{format(parseISO(d), "EEE")}</span>
                      <span className="block text-[13px] font-semibold tracking-normal normal-case tabular">{format(parseISO(d), "d")}</span>
                    </th>
                  ))}
                  <th scope="col" className="w-20 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const rowTotal = sum((e) => e.ticket.url === t.url);
                  return (
                    <tr key={t.url} className="group border-b last:border-0 hover:bg-muted/30">
                      <td className="max-w-0 px-4 py-1.5"><TicketCell ticket={t} /></td>
                      {days.map((d) => <td key={d} className={cn("px-1 py-1 text-center", d === today() && "bg-primary/[0.04]")}><Cell board={board} ticket={t} day={d} minutes={sum((e) => e.ticket.url === t.url && e.day === d)} /></td>)}
                      <td className="px-3 text-right font-semibold tabular">{rowTotal ? fmtMinutes(rowTotal) : <span className="text-muted-foreground">–</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/40 font-semibold">
                  <td className="px-4 py-2.5 text-xs tracking-wider text-muted-foreground uppercase">Day total</td>
                  {days.map((d) => { const m = sum((e) => e.day === d); return <td key={d} className="px-1 text-center tabular">{m ? fmtMinutes(m) : <span className="font-normal text-muted-foreground">–</span>}</td>; })}
                  <td className="px-3 text-right text-primary tabular">{fmtMinutes(total)}</td>
                </tr>
              </tfoot>
            </table>
            {loading && <p className="border-t px-4 py-2 text-xs text-muted-foreground">Loading time entries…</p>}
          </div>
        ) : (
          <Empty loading={loading} onAssigned={() => addRows(mineOpen)} assignedCount={mineOpen.length} board={board} onPick={(t) => addRows([t])} />
        )
      ) : (
        <Entries board={board} entries={entries} loading={loading} />
      )}
    </div>
  );
}

function TicketCell({ ticket: t }: { ticket: Ticket }) {
  const [, open] = useOpenTicket();
  return (
    <div className="flex min-w-0 items-center gap-2">
      <StatusIcon name={t.fields.Status} size={14} />
      <button onClick={() => void open(t.number)} className="flex min-w-0 items-center gap-2 text-left hover:underline">
        <TypeIcon ticket={t} size={16} /><span className="font-mono text-[11px] text-muted-foreground">#{t.number}</span>
        <span className="truncate font-medium">{cleanTitle(t.title)}</span>
      </button>
      <Button size="icon-xs" variant="ghost" aria-label={`Start a timer on #${t.number}`} title="Start timer" className="ml-auto opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
        onClick={() => { startTimer(t); toast.success(`Timer started on #${t.number}`); }}><Play /></Button>
    </div>
  );
}

// One day for one ticket: shows the total, click to add more.
function Cell({ board, ticket: t, day, minutes }: { board: Board; ticket: Ticket; day: string; minutes: number }) {
  const extras = useTicketExtras();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const parsed = parseDuration(value);
  const save = async () => {
    if (parsed <= 0) return;
    if ((await extras.logTime(board, t, parsed, note.trim(), day === today() ? undefined : day)) !== null) { setValue(""); setNote(""); setOpen(false); }
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<button aria-label={`${minutes ? fmtMinutes(minutes) : "No time"} on #${t.number}, ${format(parseISO(day), "EEEE d MMM")}. Add time`}
        className={cn("h-8 w-full rounded-md text-sm tabular transition-colors",
          minutes ? "bg-primary/10 font-semibold text-foreground hover:bg-primary/20" : "text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground")} />}>
        {minutes ? fmtMinutes(minutes) : <span className="opacity-0 group-hover:opacity-100">+</span>}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3">
        <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="space-y-2">
          <p className="text-sm font-semibold">Add time · {format(parseISO(day), "EEE d MMM")}</p>
          <p className="truncate text-xs text-muted-foreground">#{t.number} {cleanTitle(t.title)}</p>
          <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 1h 30m, 45, 1:15" aria-label="Duration"
            className="h-9 w-full rounded-lg border bg-background px-3 text-sm tabular outline-none focus:border-ring" />
          <div className="flex flex-wrap gap-1">
            {["15m", "30m", "1h", "2h", "4h"].map((q) => <Button key={q} type="button" size="xs" variant="outline" onClick={() => setValue(q)}>{q}</Button>)}
          </div>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you do? (optional)" aria-label="Note"
            className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{value && !parsed ? "Try 1h 30m or 90" : parsed ? `= ${fmtMinutes(parsed)}` : ""}</span>
            <Button type="submit" size="sm" disabled={parsed <= 0}>Log time</Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function Empty({ loading, onAssigned, assignedCount, board, onPick }: { loading: boolean; onAssigned: () => void; assignedCount: number; board: Board; onPick: (t: Ticket) => void }) {
  if (loading) return <div className="grid h-48 place-items-center rounded-2xl border bg-card"><BrandLoader /></div>;
  const tile = "flex flex-col items-center gap-2 rounded-xl border bg-background p-4 text-sm font-medium transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card disabled:opacity-50";
  return (
    <div className="grid place-items-center gap-5 rounded-2xl border bg-card px-6 py-12 text-center shadow-card">
      <span className="grid size-14 place-items-center rounded-2xl bg-accent text-primary"><P.Timer size={30} weight="duotone" /></span>
      <div>
        <p className="text-lg font-semibold">Add entries to this week&apos;s timesheet</p>
        <p className="text-sm text-muted-foreground">Pick the tickets you worked on, then click a day to log time.</p>
      </div>
      <div className="grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-3">
        <button className={tile} onClick={onAssigned} disabled={!assignedCount}><P.UserList size={22} weight="duotone" className="text-primary" />All my open tickets<span className="text-xs font-normal text-muted-foreground">{assignedCount} assigned</span></button>
        <TicketSearch tickets={board.tickets} exclude={[]} placeholder="Which ticket?" onPick={onPick}
          trigger={<button className={tile}><P.PlusCircle size={22} weight="duotone" className="text-primary" />One ticket<span className="text-xs font-normal text-muted-foreground">search by name or #</span></button>} />
        <TicketSearch tickets={board.tickets.filter((t) => !isDone(t))} exclude={[]} placeholder="Start a timer on which ticket?" onPick={(t) => { startTimer(t); onPick(t); toast.success(`Timer started on #${t.number}`); }}
          trigger={<button className={tile}><P.Timer size={22} weight="duotone" className="text-primary" />Track time<span className="text-xs font-normal text-muted-foreground">start a timer</span></button>} />
      </div>
    </div>
  );
}

function Entries({ board, entries, loading }: { board: Board; entries: Entry[]; loading: boolean }) {
  const extras = useTicketExtras();
  const [, open] = useOpenTicket();
  const sorted = [...entries].sort((a, b) => b.day.localeCompare(a.day) || b.comment.createdAt.localeCompare(a.comment.createdAt));
  if (!sorted.length) return <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">{loading ? "Loading time entries…" : "No time logged this week."}</div>;
  return (
    <ul className="divide-y overflow-hidden rounded-2xl border bg-card shadow-card">
      {sorted.map((e) => (
        <li key={e.comment.id} className="group flex items-center gap-3 px-4 py-2.5 text-sm">
          <span className="w-20 shrink-0 text-xs text-muted-foreground">{format(parseISO(e.day), "EEE d MMM")}</span>
          {e.comment.author ? <Avatar person={e.comment.author} size={22} /> : <span className="size-[22px] rounded-full bg-muted" />}
          <b className="w-16 shrink-0 tabular">{fmtMinutes(e.minutes)}</b>
          <button onClick={() => void open(e.ticket.number)} className="min-w-0 flex-1 truncate text-left hover:underline">
            <span className="font-mono text-[11px] text-muted-foreground">#{e.ticket.number}</span> {cleanTitle(e.ticket.title)}
            {e.note && <span className="text-muted-foreground"> — {e.note}</span>}
          </button>
          {e.who === board.viewer.login && (
            <Button size="icon-xs" variant="ghost" aria-label="Delete this time entry" className="opacity-0 group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
              onClick={() => void extras.deleteTime(board, e.ticket, e.comment)}><Trash2 /></Button>
          )}
        </li>
      ))}
    </ul>
  );
}
