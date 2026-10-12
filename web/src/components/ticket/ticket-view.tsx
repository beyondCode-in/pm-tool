"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { joinChecklist, splitChecklist, type CheckItem } from "@/lib/checklist";
import { repeatOf, REPEATS, withRepeat, type Repeat } from "@/lib/recurring";
import { isAudit } from "@/lib/audit";
import { chordPending } from "@/lib/keys";
import { useGoalActions, useMilestones } from "@/lib/goals";
import { Target as TargetIcon } from "@/components/icons";
import { Repeat as RepeatIcon } from "@/components/icons";
import { isDoneStatus } from "@/lib/workspace";
import { Skeleton } from "@/components/ui/skeleton";
import { byPriorityThenNumber, byUrl, childrenOf, hasField, isDone, options, parentOf, plain } from "@/lib/board";
import { config } from "@/lib/config";
import { useActions, useAddComment, useBoard, useComments, useHistory, useSource } from "@/lib/data";
import { fmtElapsed, fmtMinutes, parseTime, startTimer, stopTimer, useDependencies, useTicketExtras, useTimer } from "@/lib/ticket-extras";
import type { Board, Comment, HistoryEvent, Ticket } from "@/lib/types";
import { useOpenTicket } from "@/lib/url-state";
import { toggleFavorite, useFavorites } from "@/lib/favorites";
import { Alarm as AlarmClock, Star as PStar } from "@phosphor-icons/react";
import { openReminder } from "@/lib/reminders";
import { openSaveTemplate } from "@/lib/templates";
import { Copy as CopyIcon } from "@phosphor-icons/react";
import { quickTicket } from "@/lib/quick-ticket";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  ArrowDown, ArrowRight, ArrowUp, Ban, ChevronsDownUp, ChevronsUpDown, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, Clock, Flag, Layers, LayoutGrid, ListTodo, SlidersHorizontal, Timer, UserRound, Zap, ExternalLink, FileText, GitBranch, Link2, Maximize2, MessageSquare, MoreHorizontal,
  Paperclip, Pause, Pencil, Play, Plus, RotateCcw, ShieldAlert, Tag as TagIcon, Trash2, Upload, X, XCircle,
} from "@/components/icons";
import Link from "next/link";
import { createContext, Fragment, useContext, useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useLayout, type Layout } from "@/lib/layout";
import { CustomiseMenu, CustomSection, useSectionDrops } from "../layout/custom-section";
import ReactMarkdown from "react-markdown";
import { MD_CODE, MD_PLUGINS } from "@/components/ui-plus/markdown";
import { toast } from "sonner";
import { Avatar, cleanTitle, LabelChip, OptionPill, TypeIcon } from "./bits";
import { DateInput, NumberInput, OptionPicker, PeoplePicker, SprintPicker } from "./pickers";
import { LabelPicker, TicketSearch } from "./search-pickers";
import { Segmented } from "../ui-plus/segmented";
import { markMentions, MentionTextarea } from "../ui-plus/mention-textarea";

// "@login" in a message shows as a highlighted mention.
const MENTION_LINKS = {
  a: ({ href, children }: { href?: string; children?: ReactNode }) => href?.startsWith("#mention-")
    ? <span className="mention">{children}</span>
    : <a href={href} target="_blank" rel="noreferrer">{children}</a>,
};
import { StatusIcon, statusMeta } from "./status-icons";

// The full ticket: everything about one piece of work, editable in place.
// Left: what it is and its conversation. Right: the facts, as pickers.
export function TicketView({ board, ticket: t, mode, onClose }: { board: Board; ticket: Ticket; mode: "modal" | "page"; onClose?: () => void }) {
  const actions = useActions();
  const source = useSource();
  const [, open] = useOpenTicket();
  const parent = parentOf(board, t);
  const layout = useLayout("ticket-main", Object.keys(MAIN_SECTIONS));
  useSectionDrops("ticket", layout);
  const blocks: Record<string, ReactNode> = {
    description: <Description ticket={t} />,
    subtasks: <SubTasks board={board} ticket={t} />,
    dependencies: <Dependencies board={board} ticket={t} />,
    attachments: <Attachments ticket={t} />,
    checklist: <Checklist ticket={t} />,
    time: <TimeSection board={board} ticket={t} />,
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Top bar: where it lives and what you can do with it. */}
      <header className="flex items-center gap-2 border-b px-3 py-2.5 sm:px-5 sm:py-3">
        <StepButtons board={board} ticket={t} />
        <nav className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <span className="hidden truncate sm:inline">{board.projectTitle}</span>
          {parent && (<><ChevronRight className="hidden size-3.5 shrink-0 sm:block" /><button onClick={() => void open(parent.number)} className="flex min-w-0 items-center gap-1 hover:text-foreground hover:underline"><TypeIcon ticket={parent} /><span className="truncate">{cleanTitle(parent.title)}</span></button></>)}
          <ChevronRight className="size-3.5 shrink-0" />
          <span className="flex items-center gap-1 font-medium text-foreground"><TypeIcon ticket={t} /><span className="font-mono">#{t.number}</span></span>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <span className="hidden sm:inline"><CustomiseMenu layout={layout} labels={MAIN_SECTIONS} label="Layout" /></span>
          <StarButton url={t.url} />
          <TimerButton ticket={t} board={board} />
          <Button variant="ghost" size="icon-sm" aria-label="Copy link" title="Copy link"
            onClick={() => { void navigator.clipboard?.writeText(`${window.location.origin}${config.basePath}/ticket/?n=${t.number}`); toast.success("Link copied"); }}><Link2 /></Button>
          {mode === "modal" && <Button variant="ghost" size="icon-sm" aria-label="Open as a full page" title="Open as a full page" nativeButton={false} render={<Link href={`/ticket/?n=${t.number}`} />}><Maximize2 /></Button>}
          {source?.mode === "github" && <Button variant="ghost" size="icon-sm" aria-label="Open on GitHub" title="Open on GitHub" nativeButton={false} render={<a href={t.url} target="_blank" rel="noreferrer" />}><ExternalLink /></Button>}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More actions" />}><MoreHorizontal /></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              {t.state === "OPEN" ? (<>
                <DropdownMenuItem onClick={() => void actions.setState(t, "CLOSED", "COMPLETED")}><CheckCircle2 />Mark complete</DropdownMenuItem>
                <DropdownMenuItem onClick={() => void actions.setState(t, "CLOSED", "NOT_PLANNED")}><XCircle />Close as won&apos;t do</DropdownMenuItem>
              </>) : <DropdownMenuItem onClick={() => void actions.setState(t, "OPEN")}><RotateCcw />Reopen</DropdownMenuItem>}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void actions.setAssignees(t, [...new Set([...t.assignees.map((a) => a.login), board.viewer.login])])}>Assign to me</DropdownMenuItem>
              <DropdownMenuItem onClick={() => openReminder({ ticket: t.number, ticketTitle: cleanTitle(t.title) })}><AlarmClock className="ico" />Remind me…<kbd className="ml-auto text-[10px] text-muted-foreground">R</kbd></DropdownMenuItem>
              <DropdownMenuItem onClick={() => openSaveTemplate(t)}><CopyIcon className="ico" />Save as template…</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {onClose && <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}><X /></Button>}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-x-hidden overflow-y-auto lg:grid-cols-[minmax(0,1fr)_25rem] lg:overflow-hidden">
        <main className="min-w-0 space-y-7 px-4 py-5 sm:px-6 sm:py-6 lg:overflow-y-auto">
          <TitleAndStatus board={board} ticket={t} />
          <Details board={board} ticket={t} />
          <QuickActions board={board} ticket={t} />
          <LayoutCtx.Provider value={layout}>
            {layout.visible.map((id) => <Fragment key={id}>{blocks[id]}</Fragment>)}
          </LayoutCtx.Provider>
          {layout.order.length > layout.visible.length && (
            <p className="text-xs text-muted-foreground">
              {layout.order.length - layout.visible.length} hidden section{layout.order.length - layout.visible.length === 1 ? "" : "s"} ·{" "}
              {layout.order.filter(layout.isHidden).map((id, i) => (
                <span key={id}>{i > 0 && ", "}<button className="underline-offset-2 hover:text-foreground hover:underline" onClick={() => layout.toggleHidden(id)}>show {MAIN_SECTIONS[id]}</button></span>
              ))}
            </p>
          )}
        </main>
        <aside className="flex min-h-0 min-w-0 flex-col border-t bg-muted/25 lg:border-t-0 lg:border-l" aria-label="Activity">
          <Activity ticket={t} />
        </aside>
      </div>
    </div>
  );
}

// Up/down through the tickets in this ticket's column, in board order; J and K too.
function StepButtons({ board, ticket: t }: { board: Board; ticket: Ticket }) {
  const [, open] = useOpenTicket();
  const column = board.tickets.filter((x) => x.fields.Status === t.fields.Status).sort(byPriorityThenNumber);
  const i = column.findIndex((x) => x.url === t.url);
  const prev = i > 0 ? column[i - 1] : null;
  const next = i >= 0 && i < column.length - 1 ? column[i + 1] : null;
  const step = (dir: -1 | 1) => { const to = dir < 0 ? prev : next; if (to) void open(to.number); };
  const go = useEffectEvent(step);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.defaultPrevented || chordPending() || e.metaKey || e.ctrlKey || e.altKey || el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.key === "j") { e.preventDefault(); go(1); }
      if (e.key === "k") { e.preventDefault(); go(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="flex items-center" role="group" aria-label="Move between tickets">
      <Button variant="ghost" size="icon-sm" disabled={!prev} onClick={() => step(-1)} aria-label={prev ? `Previous: #${prev.number}` : "No previous ticket"} title={prev ? `Previous (K) · #${prev.number} ${cleanTitle(prev.title)}` : "First in this column"}><ArrowUp /></Button>
      <Button variant="ghost" size="icon-sm" disabled={!next} onClick={() => step(1)} aria-label={next ? `Next: #${next.number}` : "No next ticket"} title={next ? `Next (J) · #${next.number} ${cleanTitle(next.title)}` : "Last in this column"}><ArrowDown /></Button>
      {i >= 0 && <span className="mr-1 hidden text-xs text-muted-foreground tabular sm:inline">{i + 1}/{column.length}</span>}
    </div>
  );
}

function StarButton({ url }: { url: string }) {
  const on = useFavorites().includes(url);
  return (
    <Button variant="ghost" size="icon-sm" aria-pressed={on} aria-label={on ? "Remove from favorites" : "Add to favorites"} title={on ? "Remove from favorites" : "Add to favorites"}
      onClick={() => { toggleFavorite(url); toast.success(on ? "Removed from favorites" : "Added to favorites", { description: on ? undefined : "Find it in the sidebar under Favorites." }); }}>
      <PStar weight={on ? "fill" : "regular"} className={cn("ico", on && "text-amber-500")} />
    </Button>
  );
}

// ── Left column ─────────────────────────────────────────────────────────

const MAIN_SECTIONS: Record<string, string> = { description: "Description", checklist: "Checklist", subtasks: "Sub-tasks", dependencies: "Dependencies", attachments: "Attachments", time: "Time tracking" };
const LayoutCtx = createContext<Layout | null>(null);

// Every section of the ticket can be collapsed, hidden or dragged to a new
// place; the arrangement is remembered for all tickets in this browser.
function Section({ id, icon, title, count, action, children }: { id: string; icon: typeof FileText; title: string; count?: ReactNode; action?: ReactNode; children: ReactNode }) {
  const layout = useContext(LayoutCtx)!;
  return <CustomSection id={id} scope="ticket" layout={layout} title={title} icon={icon} count={count} actions={action}>{children}</CustomSection>;
}

function TitleAndStatus({ board, ticket: t }: { board: Board; ticket: Ticket }) {
  const actions = useActions();
  const [title, setTitle] = useState(t.title);
  const save = () => { const v = title.trim(); if (v && v !== t.title) void actions.updateText(t, { title: v }); else setTitle(t.title); };
  return (
    <div>
      <textarea value={title} onChange={(e) => setTitle(e.target.value)} onBlur={save} rows={1} aria-label="Title"
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); } if (e.key === "Escape") setTitle(t.title); }}
        className="font-display field-sizing-content -mx-2 w-[calc(100%+1rem)] resize-none rounded-lg bg-transparent px-2 py-1 text-2xl leading-tight font-semibold outline-none hover:bg-muted/60 focus:bg-muted/60" />
      <StatusBar board={board} ticket={t} />
      {t.state === "CLOSED" && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
          {t.stateReason === "NOT_PLANNED" ? <Ban className="size-3.5" /> : <CheckCircle2 className="size-3.5 text-success" />}
          {t.stateReason === "NOT_PLANNED" ? "Closed as won't do" : "Closed as complete"}{t.closedAt ? ` · ${formatDistanceToNow(parseISO(t.closedAt))} ago` : ""}
        </p>
      )}
    </div>
  );
}

// ClickUp's status control: the current stage as a coloured pill that opens
// every stage, a "next stage" arrow, and a one-click complete tick.
function StatusBar({ board, ticket: t }: { board: Board; ticket: Ticket }) {
  const actions = useActions();
  const stages = options(board, "Status");
  const i = stages.findIndex((o) => o.name === t.fields.Status);
  const next = stages[i + 1];
  const done = stages.find((o) => isDoneStatus(o.name));
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <div className="inline-flex items-stretch overflow-hidden rounded-lg shadow-card">
        <DropdownMenu>
          <DropdownMenuTrigger render={<button aria-label={`Status: ${plain(t.fields.Status) || "none"}. Change`} className="status-pill inline-flex items-center gap-1.5 rounded-none px-3 py-1.5 text-xs font-semibold tracking-wide uppercase transition-[filter] hover:brightness-110"
            style={{ ["--pill-h" as string]: statusMeta(t.fields.Status).hue, ["--pill-c" as string]: Math.max(statusMeta(t.fields.Status).chroma, 0.06) }} />}>
            <StatusIcon name={t.fields.Status} size={14} className="!text-white" />{plain(t.fields.Status) || "No status"}<ChevronDown className="size-3 opacity-80" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-52">
            <DropdownMenuRadioGroup value={t.fields.Status ?? ""} onValueChange={(v: string) => void actions.move(t, v)}>
              {stages.map((o) => <DropdownMenuRadioItem key={o.id} value={o.name}><StatusIcon name={o.name} size={15} />{plain(o.name)}</DropdownMenuRadioItem>)}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {next && (
          <button onClick={() => void actions.move(t, next.name)} title={`Move to ${plain(next.name)}`} aria-label={`Move to ${plain(next.name)}`}
            className="status-pill grid place-items-center border-l border-white/25 px-2 transition-[filter] hover:brightness-110"
            style={{ ["--pill-h" as string]: statusMeta(t.fields.Status).hue, ["--pill-c" as string]: Math.max(statusMeta(t.fields.Status).chroma, 0.06) }}>
            <ChevronRight className="size-3.5" />
          </button>
        )}
      </div>
      {done && !isDone(t) && (
        <Button size="sm" variant="outline" onClick={() => void actions.move(t, done.name)} title={`Mark complete (${plain(done.name)})`} className="gap-1.5 hover:border-success/50 hover:text-success">
          <CheckCircle2 />Complete
        </Button>
      )}
      {next && <span className="text-xs text-muted-foreground">Next: <span className="inline-flex items-center gap-1 align-middle"><StatusIcon name={next.name} size={12} />{plain(next.name)}</span></span>}
    </div>
  );
}

function QuickActions({ board, ticket: t }: { board: Board; ticket: Ticket }) {
  const extras = useTicketExtras();
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => document.getElementById(`add-sub-${t.number}`)?.focus()}><GitBranch />Add sub-task</Button>
      <TicketSearch tickets={board.tickets} exclude={[t.number]} placeholder="Which ticket blocks this one?"
        onPick={(o) => void extras.addBlocker(t, o)} trigger={<Button size="sm" variant="outline"><ShieldAlert />Add blocker</Button>} />
      <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}><Paperclip />Attach file</Button>
      <input ref={fileRef} type="file" hidden multiple onChange={(e) => { for (const f of e.target.files ?? []) void extras.attach(t, f); e.target.value = ""; }} />
    </div>
  );
}

function Description({ ticket: t }: { ticket: Ticket }) {
  const actions = useActions();
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const split = splitChecklist(t.body);
  const parts = { ...split, text: withRepeat(split.text, null) };
  const [body, setBody] = useState(parts.text);
  const ref = useRef<HTMLTextAreaElement>(null);
  const wrap = (before: string, after = before) => {
    const el = ref.current; if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const next = body.slice(0, a) + before + body.slice(a, b) + after + body.slice(b);
    setBody(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + before.length, b + before.length); });
  };
  const save = () => { void actions.updateText(t, { body: joinChecklist(withRepeat(body, repeatOf(t.body)), splitChecklist(t.body).items) }); setEditing(false); };
  return (
    <Section id="description" icon={FileText} title="Description" action={!editing && <Button size="xs" variant="ghost" onClick={() => setEditing(true)}><Pencil />Edit</Button>}>
      {editing ? (
        <div className="overflow-hidden field-frame rounded-xl border bg-card">
          <div className="flex items-center gap-1 border-b bg-muted/40 px-2 py-1">
            {(["write", "preview"] as const).map((k) => (
              <button key={k} onClick={() => setTab(k)} className={cn("rounded-md px-2 py-1 text-xs font-medium capitalize", tab === k ? "bg-background shadow-card" : "text-muted-foreground")}>{k}</button>
            ))}
            {tab === "write" && (
              <div className="ml-2 flex items-center gap-0.5 border-l pl-2" role="toolbar" aria-label="Formatting">
                <Button size="xs" variant="ghost" aria-label="Bold" onClick={() => wrap("**")}><b>B</b></Button>
                <Button size="xs" variant="ghost" aria-label="Italic" onClick={() => wrap("_")}><i>I</i></Button>
                <Button size="xs" variant="ghost" aria-label="Checklist item" onClick={() => wrap("\n- [ ] ", "")}>☑</Button>
                <Button size="xs" variant="ghost" aria-label="Heading" onClick={() => wrap("\n### ", "")}>H</Button>
                <Button size="xs" variant="ghost" aria-label="Code" onClick={() => wrap("`")}>{"</>"}</Button>
              </div>
            )}
          </div>
          {tab === "write" ? (
            <MentionTextarea ref={ref} value={body} onValueChange={setBody} autoFocus rows={12} aria-label="Description"
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save(); if (e.key === "Escape") { setBody(parts.text); setEditing(false); } }}
              className="field-bare block w-full resize-y bg-transparent p-3 font-mono text-sm leading-relaxed outline-none" placeholder="Describe the work. Markdown works: **bold**, - [ ] checklists, ### headings." />
          ) : (
            <div className="prose-ticket min-h-40 p-4 text-sm"><ReactMarkdown {...MD_PLUGINS} components={MD_CODE}>{body || "_Nothing to preview._"}</ReactMarkdown></div>
          )}
          <div className="flex items-center gap-2 border-t px-3 py-2">
            <span className="text-xs text-muted-foreground">Ctrl+Enter to save · Esc to cancel</span>
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { setBody(parts.text); setEditing(false); }}>Cancel</Button>
            <Button size="sm" onClick={save}>Save</Button>
          </div>
        </div>
      ) : parts.text.trim() ? (
        <div className="prose-ticket cursor-text rounded-xl p-1 text-[15px] hover:bg-muted/40" onDoubleClick={() => { setBody(parts.text); setEditing(true); }}>
          <ReactMarkdown {...MD_PLUGINS} components={MD_CODE}>{parts.text}</ReactMarkdown>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="w-full rounded-xl border border-dashed p-5 text-left text-sm text-muted-foreground hover:bg-muted/40">
          Add a description so the team knows what&apos;s needed…
        </button>
      )}
    </Section>
  );
}

// ClickUp-style checklist: tick, add, rename, reorder, delete. Stored in the
// issue body as a task list, so it also shows and ticks on GitHub.
// The newest body each checklist has sent, kept until the loaded board shows
// it. Quick successive edits build on it instead of on a board reload that
// started before the last save. Expires after 15s in case GitHub reformats it.
const pendingBody = new Map<string, string>();
const PENDING_MS = 15_000;

function Checklist({ ticket: t }: { ticket: Ticket }) {
  const actions = useActions();
  const latest = () => {
    return splitChecklist(pendingBody.get(t.url) ?? t.body);
  };
  // Show what was last saved, not a board reload that is older than it.
  const { items } = latest();
  useEffect(() => { if (pendingBody.get(t.url) === t.body) pendingBody.delete(t.url); }, [t.url, t.body]);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [edit, setEdit] = useState("");
  const write = (change: (items: CheckItem[]) => CheckItem[]) => {
    const now = latest();
    const body = joinChecklist(now.text, change(now.items));
    pendingBody.set(t.url, body);
    const forget = () => { if (pendingBody.get(t.url) === body) pendingBody.delete(t.url); };
    setTimeout(forget, PENDING_MS);
    void actions.updateText(t, { body }).then((ok) => { if (!ok) forget(); });
  };
  const doneCount = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;
  const add = () => { const v = draft.trim(); if (!v) return; write((xs) => [...xs, { done: false, text: v }]); setDraft(""); };
  const move = (i: number, by: number) => write((xs) => { const j = i + by; if (j < 0 || j >= xs.length) return xs; const n = [...xs]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  return (
    <Section id="checklist" icon={ListTodo} title="Checklist" count={items.length ? `${doneCount}/${items.length}` : undefined}>
      {items.length > 0 && (
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><span className={cn("block h-full rounded-full transition-[width] duration-500", pct === 100 ? "bg-success" : "bg-primary")} style={{ width: `${pct}%` }} /></span>
          <span className="text-xs tabular text-muted-foreground">{pct}%</span>
        </div>
      )}
      <ul className="space-y-0.5">
        {items.map((it, i) => (
          <li key={`${i}-${it.text}`} className="group/ck flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-muted/50">
            <Checkbox checked={it.done} aria-label={`${it.done ? "Untick" : "Tick"} "${it.text}"`} onCheckedChange={() => write((xs) => xs.map((x, k) => (k === i ? { ...x, done: !x.done } : x)))} />
            {editing === i ? (
              <input autoFocus value={edit} onChange={(e) => setEdit(e.target.value)} aria-label="Edit item"
                onBlur={() => { const v = edit.trim(); if (v && v !== it.text) write((xs) => xs.map((x, k) => (k === i ? { ...x, text: v } : x))); setEditing(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditing(null); }}
                className="h-7 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm outline-none focus:border-ring" />
            ) : (
              <button onClick={() => { setEditing(i); setEdit(it.text); }} className={cn("min-w-0 flex-1 truncate text-left text-sm", it.done && "text-muted-foreground line-through")} title="Click to rename">{it.text}</button>
            )}
            <span className="flex opacity-0 transition-opacity group-hover/ck:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
              <Button size="icon-xs" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp /></Button>
              <Button size="icon-xs" variant="ghost" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}><ArrowDown /></Button>
              <Button size="icon-xs" variant="ghost" aria-label={`Delete "${it.text}"`} className="hover:text-destructive" onClick={() => write((xs) => xs.filter((_, k) => k !== i))}><Trash2 /></Button>
            </span>
          </li>
        ))}
      </ul>
      <form className="field-frame mt-1.5 flex items-center gap-2 rounded-lg border border-dashed bg-transparent px-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <Plus className="size-3.5 text-muted-foreground" />
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add an item and press Enter" aria-label="New checklist item"
          className="field-bare h-8 min-w-0 flex-1 bg-transparent text-sm outline-none" />
        {draft.trim() && <Button type="submit" size="xs">Add</Button>}
      </form>
    </Section>
  );
}

function SubTasks({ board, ticket: t }: { board: Board; ticket: Ticket }) {
  const actions = useActions();
  const [, open] = useOpenTicket();
  const kids = childrenOf(board, t);
  const done = kids.filter(isDone).length;
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const add = async () => {
    if (!title.trim()) return;
    setBusy(true);
    const base = quickTicket(title);
    const n = await actions.create({ ...base, body: `### Parent issue\n\n#${t.number}`, parent: t.number });
    setBusy(false);
    if (n) { setTitle(""); toast.success(`Sub-task #${n} added`); }
  };
  return (
    <Section id="subtasks" icon={GitBranch} title="Sub-tasks" count={kids.length ? `${done}/${kids.length}` : undefined}>
      {kids.length > 0 && (
        <>
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-success transition-[width] duration-500" style={{ width: `${(done / kids.length) * 100}%` }} /></div>
          <ul className="mb-2 divide-y overflow-hidden rounded-xl border bg-card">
            {kids.map((c) => (
              <li key={c.number} className="group flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/40">
                <button aria-label={isDone(c) ? `Reopen #${c.number}` : `Complete #${c.number}`} onClick={() => void actions.setState(c, isDone(c) ? "OPEN" : "CLOSED", "COMPLETED")}
                  className={cn("grid size-4.5 shrink-0 place-items-center rounded-full border transition-colors", isDone(c) ? "border-success bg-success text-white" : "hover:border-success")}>
                  {isDone(c) && <CheckCircle2 className="size-3" />}
                </button>
                <button onClick={() => void open(c.number)} className={cn("min-w-0 flex-1 truncate text-left hover:underline", isDone(c) && "text-muted-foreground line-through")}>{cleanTitle(c.title)}</button>
                <OptionPill board={board} field="Status" value={c.fields.Status} />
                {c.assignees[0] && <Avatar person={c.assignees[0]} size={20} />}
              </li>
            ))}
          </ul>
        </>
      )}
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void add(); }}>
        <input id={`add-sub-${t.number}`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a sub-task and press Enter"
          className="h-9 min-w-0 flex-1 rounded-lg border bg-card px-3 text-sm outline-none focus:border-ring" />
        <Button type="submit" size="sm" variant="secondary" className="h-9" disabled={!title.trim() || busy}><Plus />Add</Button>
      </form>
    </Section>
  );
}

function Dependencies({ board, ticket: t }: { board: Board; ticket: Ticket }) {
  const { data, isLoading } = useDependencies(t);
  const extras = useTicketExtras();
  const [, open] = useOpenTicket();
  const row = (url: string, kind: "blockedBy" | "blocking") => {
    const o = byUrl(board, url);
    const n = Number(url.split("/").pop());
    return (
      <li key={`${kind}-${url}`} className="group flex items-center gap-2 px-3 py-2 text-sm">
        <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-semibold", kind === "blockedBy" ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-foreground")}>
          {kind === "blockedBy" ? "Blocked by" : "Blocks"}
        </span>
        {o ? <TypeIcon ticket={o} /> : null}
        <button onClick={() => { if (o) void open(o.number); else window.open(url, "_blank"); }} className={cn("min-w-0 flex-1 truncate text-left hover:underline", o && isDone(o) && "text-muted-foreground line-through")}>
          <span className="font-mono text-xs text-muted-foreground">#{n}</span> {o ? cleanTitle(o.title) : `(in ${url.split("/").slice(3, 5).join("/")}, not on this board)`}
        </button>
        {o && <OptionPill board={board} field="Status" value={o.fields.Status} />}
        <Button size="icon-xs" variant="ghost" aria-label={`Remove link to #${n}`} className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          disabled={!o} onClick={() => { if (o) void (kind === "blockedBy" ? extras.removeBlocker(t, o) : extras.removeBlocker(o, t)); }}><X /></Button>
      </li>
    );
  };
  const blockedOpen = (data?.blockedBy ?? []).filter((u) => { const o = byUrl(board, u); return !o || !isDone(o); }).length;
  const linked = [...(data?.blockedBy ?? []), ...(data?.blocking ?? [])].map((u) => byUrl(board, u)?.number).filter((x): x is number => !!x);
  const exclude = [t.number, ...linked];
  return (
    <Section id="dependencies" icon={ShieldAlert} title="Dependencies" count={data ? data.blockedBy.length + data.blocking.length : undefined}
      action={
        <div className="flex gap-1">
          <TicketSearch tickets={board.tickets} exclude={exclude} placeholder="Which ticket blocks this one?" onPick={(o) => void extras.addBlocker(t, o)}
            trigger={<Button size="xs" variant="ghost"><Plus />Blocked by</Button>} />
          <TicketSearch tickets={board.tickets} exclude={exclude} placeholder="Which ticket does this one block?" onPick={(o) => void extras.addBlocking(t, o)}
            trigger={<Button size="xs" variant="ghost"><Plus />Blocks</Button>} />
        </div>
      }>
      {blockedOpen > 0 && <p className="mb-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">Waiting on {blockedOpen} open {blockedOpen === 1 ? "ticket" : "tickets"} before this can be finished.</p>}
      {isLoading ? <Skeleton className="h-10 w-full" /> : (data && (data.blockedBy.length || data.blocking.length)) ? (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {data.blockedBy.map((u) => row(u, "blockedBy"))}
          {data.blocking.map((u) => row(u, "blocking"))}
        </ul>
      ) : <p className="text-sm text-muted-foreground">Nothing blocks this, and it blocks nothing.</p>}
    </Section>
  );
}

const ATTACHMENT = /📎 Attached \*\*(.+?)\*\*\s+!?\[[^\]]*\]\(([^)]+)\)/;

function Attachments({ ticket: t }: { ticket: Ticket }) {
  const { data: comments } = useComments(t);
  const extras = useTicketExtras();
  const [over, setOver] = useState(false);
  const [uploading, setUploading] = useState(0);
  const files = (comments ?? []).flatMap((c) => { const m = c.body.match(ATTACHMENT); return m ? [{ name: m[1], url: m[2], when: c.createdAt }] : []; });
  const upload = async (list: FileList | File[]) => {
    const arr = [...list];
    setUploading((u) => u + arr.length);
    await Promise.all(arr.map((f) => extras.attach(t, f).finally(() => setUploading((u) => u - 1))));
  };
  return (
    <Section id="attachments" icon={Paperclip} title="Attachments" count={files.length || undefined}>
      <div onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setOver(true); } }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) void upload(e.dataTransfer.files); }}
        onPaste={(e) => { if (e.clipboardData.files.length) void upload(e.clipboardData.files); }} tabIndex={0}
        className={cn("rounded-xl border border-dashed p-3 transition-colors outline-none focus-visible:border-ring", over && "border-primary bg-accent/60")}>
        {files.length > 0 && (
          <ul className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {files.map((f) => {
              const img = /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(f.url) || f.url.startsWith("blob:");
              return (
                <li key={f.url}>
                  <a href={f.url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-lg border bg-card hover:shadow-pop">
                    {img
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={f.url} alt={f.name} className="h-24 w-full object-cover" />
                      : <span className="grid h-24 place-items-center bg-muted/50"><FileText className="size-8 text-muted-foreground" /></span>}
                    <span className="block truncate px-2 py-1.5 text-xs font-medium">{f.name}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
        <p className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
          <Upload className="size-4" />{uploading ? `Uploading ${uploading}…` : "Drop files here, or paste a screenshot"}
        </p>
      </div>
    </Section>
  );
}

function Activity({ ticket: t }: { ticket: Ticket }) {
  const { data: comments, isLoading } = useComments(t);
  const add = useAddComment();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"all" | "comments" | "history" | "time">("all");
  const { data: history } = useHistory(t);
  const endRef = useRef<HTMLDivElement>(null);
  const shown = (comments ?? []).filter((c) => !isAudit(c.body)).filter((c) => filter === "all" || (filter === "time" ? c.body.startsWith("⏱️") : filter === "comments" && !c.body.startsWith("⏱️") && !ATTACHMENT.test(c.body)));
  const events = filter === "all" || filter === "history" ? (history ?? []) : [];
  // Comments and changes in one timeline, oldest first like a conversation.
  const feed = [...shown.map((c) => ({ at: c.createdAt, c, e: null as HistoryEvent | null })), ...events.map((e) => ({ at: e.at, c: null as Comment | null, e }))]
    .sort((a, b) => a.at.localeCompare(b.at));
  const seen = useRef<number | null>(null);
  useEffect(() => {
    const n = comments?.length;
    if (n === undefined) return;
    if (seen.current !== null && n > seen.current) endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    seen.current = n;
  }, [comments?.length]);
  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    if (await add(t, text.trim())) setText("");
    setBusy(false);
  };
  return (
    <>
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <MessageSquare className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Activity</h2>
        <span className="rounded-md bg-muted px-1.5 text-xs tabular text-muted-foreground">{(comments?.length ?? 0) + (history?.length ?? 0)}</span>
      </header>
      <div className="border-b px-3 py-2">
        <Segmented size="xs" label="Show" value={filter} onChange={setFilter} options={[["all", "All"], ["comments", "Comments"], ["history", "History"], ["time", "Time log"]] as const} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      {isLoading ? <Skeleton className="h-20 w-full" /> : (
        <ol className="space-y-4">
          {feed.map((x) => (x.c ? <Message key={x.c.id} c={x.c} ticket={t} /> : <Change key={x.e!.id} e={x.e!} />))}
          {!feed.length && <li className="rounded-xl bg-muted/40 p-4 text-center text-sm text-muted-foreground">{filter === "history" ? "No changes recorded yet." : filter === "time" ? "No time logged yet. Use the timer or the Time tracking section." : "No messages yet. Start the conversation below."}</li>}
        </ol>
      )}
      <div ref={endRef} />
      </div>
      <div className="border-t p-3">
      <div className="field-frame rounded-xl border bg-card p-2 shadow-card">
        <MentionTextarea placement="above" value={text} onValueChange={setText} rows={2} placeholder="Write a message… Type @ to mention someone. Ctrl+Enter sends." aria-label="New message"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void send(); }}
          className="field-bare block w-full resize-none bg-transparent p-1.5 text-sm outline-none" />
        <div className="flex items-center justify-end gap-2">
          <span className="mr-auto pl-1 text-[11px] text-muted-foreground">Markdown supported</span>
          <Button size="sm" disabled={!text.trim() || busy} onClick={() => void send()}>{busy ? "Sending…" : "Send"}</Button>
        </div>
      </div>
      </div>
    </>
  );
}

// One change, as a compact line: "Maya moved this from Todo to In Progress".
function Change({ e }: { e: HistoryEvent }) {
  const { data: board } = useBoard();
  const who = e.actor ? (board?.people.find((p) => p.login === e.actor!.login)?.name || e.actor.login) : "Someone";
  const name = (login?: string) => board?.people.find((p) => p.login === login)?.name || login;
  const v = (s?: string) => <b className="font-medium text-foreground">{s ? plain(s) : "empty"}</b>;
  const what: ReactNode = (() => {
    switch (e.kind) {
      case "created": return <>created this ticket</>;
      case "status": return <>moved it {e.from && <>from <span className="inline-flex items-center gap-1 align-middle"><StatusIcon name={e.from} size={12} />{v(e.from)}</span> </>}to <span className="inline-flex items-center gap-1 align-middle"><StatusIcon name={e.to} size={12} />{v(e.to)}</span></>;
      case "field": return e.to ? <>set <b className="font-medium text-foreground">{e.field}</b> to {v(e.to)}{e.from && <> (was {plain(e.from)})</>}</> : <>cleared <b className="font-medium text-foreground">{e.field}</b></>;
      case "assigned": return <>assigned {v(name(e.to))}</>;
      case "unassigned": return <>unassigned {v(name(e.from))}</>;
      case "labeled": return <>added the tag <LabelChip name={e.to ?? ""} color={board?.labels.find((l) => l.name === e.to)?.color} /></>;
      case "unlabeled": return <>removed the tag <LabelChip name={e.from ?? ""} color={board?.labels.find((l) => l.name === e.from)?.color} /></>;
      case "renamed": return <>renamed it to {v(e.to)}</>;
      case "closed": return <>closed it as {e.text ?? "completed"}</>;
      case "reopened": return <>reopened it</>;
      case "parent": return <>{e.text}{e.to && <> {v(e.to)}</>}</>;
      case "linked": return <>mentioned it in {v(e.to)}</>;
      default: return <>{e.text}</>;
    }
  })();
  const dot: Record<string, string> = { status: "bg-primary", closed: "bg-success", reopened: "bg-amber-500", labeled: "bg-sky-500", unlabeled: "bg-muted-foreground", created: "bg-primary" };
  return (
    <li className="relative flex gap-3 pl-[11px] text-xs text-muted-foreground">
      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full ring-4 ring-background", dot[e.kind] ?? "bg-muted-foreground/60")} aria-hidden />
      <p className="min-w-0 flex-1 leading-relaxed">
        <span className="font-semibold text-foreground">{who}</span> {what}
        <span title={format(parseISO(e.at), "PPpp")}> · {formatDistanceToNow(parseISO(e.at))} ago</span>
      </p>
    </li>
  );
}

// One message in the activity feed. Your own messages and time entries can be
// edited in place or deleted; time entries edit as hours + minutes + note.
function Message({ c, ticket: t }: { c: Comment; ticket: Ticket }) {
  const { data: board } = useBoard();
  const extras = useTicketExtras();
  const time = parseTime(c.body);
  const system = !!time || c.body.startsWith("📎");
  const mine = !!board && (!c.author || c.author.login === board.viewer.login);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(c.body);
  const [mins, setMins] = useState(String(time?.minutes ?? ""));
  const [note, setNote] = useState(time?.note ?? "");
  const [confirm, setConfirm] = useState(false);
  const save = async () => {
    if (!board) return;
    const ok = time
      ? await extras.editTime(board, t, c, Math.max(1, Number(mins) || 0), note.trim())
      : draft.trim() && draft !== c.body ? await extras.editComment(t, c, draft.trim()) : true;
    if (ok !== null) setEditing(false);
  };
  const remove = async () => {
    if (!board) return;
    setConfirm(false);
    if (time) await extras.deleteTime(board, t, c); else await extras.deleteComment(t, c);
  };
  return (
    <li className="group/msg flex gap-3">
      {c.author ? <Avatar person={c.author} size={30} /> : <span className="size-[30px] rounded-full bg-muted" />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{c.author?.name || c.author?.login || "Someone"}</span>
          <span title={format(parseISO(c.createdAt), "PPpp")}> · {formatDistanceToNow(parseISO(c.createdAt))} ago</span>
          {c.editedAt && <span title={format(parseISO(c.editedAt), "PPpp")}>· edited</span>}
          {mine && !editing && (
            <span className="ml-auto flex gap-0.5 opacity-0 transition-opacity group-hover/msg:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
              <Button size="icon-xs" variant="ghost" aria-label={time ? "Edit time entry" : "Edit message"} onClick={() => setEditing(true)}><Pencil /></Button>
              {confirm
                ? <><Button size="xs" variant="destructive" onClick={() => void remove()}>Delete</Button><Button size="xs" variant="ghost" onClick={() => setConfirm(false)}>Keep</Button></>
                : <Button size="icon-xs" variant="ghost" aria-label={time ? "Delete time entry" : "Delete message"} className="hover:text-destructive" onClick={() => setConfirm(true)}><Trash2 /></Button>}
            </span>
          )}
        </div>
        {editing ? (
          <form className="field-frame mt-1 rounded-xl border bg-card p-2" onSubmit={(e) => { e.preventDefault(); void save(); }}
            onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setEditing(false); } }}>
            {time ? (
              <div className="flex flex-wrap items-center gap-2">
                <Clock className="size-4 text-muted-foreground" aria-hidden />
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  <input autoFocus inputMode="numeric" value={mins} onChange={(e) => setMins(e.target.value.replace(/\D/g, ""))} aria-label="Minutes"
                    className="field-bare h-7 w-16 rounded-md bg-muted px-2 text-sm text-foreground tabular outline-none" />min
                  {Number(mins) >= 60 && <span className="tabular">({fmtMinutes(Number(mins))})</span>}
                </label>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you do?" aria-label="Note"
                  className="field-bare h-7 min-w-0 flex-1 basis-32 rounded-md bg-muted px-2 text-sm outline-none" />
              </div>
            ) : (
              <MentionTextarea autoFocus value={draft} onValueChange={setDraft} rows={3} aria-label="Edit message"
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void save(); }}
                className="field-bare block w-full resize-y bg-transparent p-1 text-sm outline-none" />
            )}
            <div className="mt-2 flex justify-end gap-1">
              <Button type="button" size="xs" variant="ghost" onClick={() => { setEditing(false); setDraft(c.body); }}>Cancel</Button>
              <Button type="submit" size="xs">Save</Button>
            </div>
          </form>
        ) : time ? (
          <p className="mt-1 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm">
            <Clock className="size-3.5 text-primary" aria-hidden /><b className="tabular">{fmtMinutes(time.minutes)}</b>
            {time.note && <span className="text-muted-foreground">{time.note}</span>}
          </p>
        ) : (
          <div className={cn("prose-ticket mt-1 w-fit max-w-full rounded-2xl rounded-tl-sm px-3.5 py-2 text-sm", system ? "bg-transparent px-0 py-0 text-muted-foreground" : "bg-muted/60")}>
            <ReactMarkdown {...MD_PLUGINS} components={{ ...MD_CODE, ...MENTION_LINKS }}>{markMentions(c.body, board?.people.map((x) => x.login) ?? [])}</ReactMarkdown>
          </div>
        )}
      </div>
    </li>
  );
}

// ── Right column ────────────────────────────────────────────────────────

const HIDE_EMPTY = "beyondpm.hide-empty-fields";
const hideListeners = new Set<() => void>();
const readHide = () => { try { return localStorage.getItem(HIDE_EMPTY) === "1"; } catch { return false; } };
function useHideEmpty(): [boolean, () => void] {
  const on = useSyncExternalStore((l) => { hideListeners.add(l); return () => hideListeners.delete(l); }, readHide, () => false);
  return [on, () => { try { localStorage.setItem(HIDE_EMPTY, on ? "0" : "1"); } catch { /* per-browser */ } hideListeners.forEach((l) => l()); }];
}
const HideEmptyCtx = createContext(false);

function Field({ label, icon: Icon, wide, empty, children }: { label: string; icon: typeof FileText; wide?: boolean; empty?: boolean; children: ReactNode }) {
  if (useContext(HideEmptyCtx) && empty) return null;
  return (
    <div className={cn("grid min-h-9 grid-cols-[7.5rem_1fr] items-center gap-2 border-b border-dashed py-0.5 last:border-0", wide && "sm:col-span-2")}>
      <span className="flex items-center gap-2 text-[13px] text-muted-foreground"><Icon className="size-4 shrink-0 opacity-70" />{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
const FIELD_ICON: Record<string, typeof FileText> = { Priority: Flag, "Ticket Type": Layers, Size: SlidersHorizontal, Component: LayoutGrid };

function Details({ board, ticket: t }: { board: Board; ticket: Ticket }) {
  const actions = useActions();
  const extras = useTicketExtras();
  const [, open] = useOpenTicket();
  const parent = parentOf(board, t);
  const descendants = (p: Ticket): number[] => childrenOf(board, p).flatMap((c) => [c.number, ...descendants(c)]);
  const [hideEmpty, toggleHideEmpty] = useHideEmpty();
  const f = t.fields as Record<string, unknown>;
  const emptyCount = [!t.assignees.length, !f["Start date"] && !f["Target date"], ...(["Priority", "Ticket Type", "Size", "Component", "Sprint", "Story Points"] as const).filter((k) => hasField(board, k)).map((k) => f[k] == null || f[k] === ""), !parent, !t.labels.length].filter(Boolean).length;
  return (
    <div>
      <HideEmptyCtx.Provider value={hideEmpty}>
      <div className="grid gap-x-8 sm:grid-cols-2">
        <Field label="Assignees" icon={UserRound} empty={!t.assignees.length}><PeoplePicker people={board.people} value={t.assignees} onChange={(l) => void actions.setAssignees(t, l)} /></Field>
        {(hasField(board, "Start date") || hasField(board, "Target date")) && (
          <Field label="Dates" icon={CalendarDays} wide empty={!t.fields["Start date"] && !t.fields["Target date"]}>
            <div className="flex items-center gap-1">
              {hasField(board, "Start date") && <span className="min-w-0 flex-1"><DateInput label="Start date" value={t.fields["Start date"]} onChange={(v) => void actions.setField(t, "Start date", v)} /></span>}
              {hasField(board, "Start date") && hasField(board, "Target date") && <ArrowRight className="size-3 shrink-0 text-muted-foreground" />}
              {hasField(board, "Target date") && <span className="min-w-0 flex-1"><DateInput warnPast={!isDone(t)} label="Due date" value={t.fields["Target date"]} onChange={(v) => void actions.setField(t, "Target date", v)} /></span>}
            </div>
          </Field>
        )}
        {(["Priority", "Ticket Type", "Size", "Component"] as const).filter((f) => hasField(board, f)).map((f) => (
          <Field key={f} label={f === "Ticket Type" ? "Type" : f} icon={FIELD_ICON[f]} empty={!t.fields[f]}>
            <OptionPicker board={board} field={f} label={f} value={t.fields[f]} onChange={(v) => void actions.setField(t, f, v)} />
          </Field>
        ))}
        {hasField(board, "Sprint") && <Field label="Sprint" icon={Timer} empty={!t.fields.Sprint}><SprintPicker board={board} value={t.fields.Sprint} onChange={(v) => void actions.setField(t, "Sprint", v)} /></Field>}
        {hasField(board, "Story Points") && <Field label="Points" icon={Zap} empty={t.fields["Story Points"] == null}><NumberInput key={t.fields["Story Points"] ?? "x"} label="Story points" value={t.fields["Story Points"]} onChange={(v) => void actions.setField(t, "Story Points", v)} /></Field>}
        <Field label="Time tracked" icon={Clock}><TimeSummary board={board} ticket={t} /></Field>
        <Field label="Repeat" icon={RepeatIcon} empty={!repeatOf(t.body)}><RepeatPicker ticket={t} /></Field>
        <Field label="Goal" icon={TargetIcon} empty={!t.milestone}><GoalPicker ticket={t} /></Field>
        <Field label="Parent" icon={GitBranch} empty={!parent}>
          <div className="flex items-center gap-1">
            <TicketSearch tickets={board.tickets} exclude={[t.number, ...descendants(t)]} placeholder="Move under which ticket?" onPick={(p) => void extras.setParent(t, p, parent)}
              trigger={
                <Button variant="ghost" size="sm" className="h-8 min-w-0 flex-1 justify-start px-2 font-normal">
                  {parent ? <span className="flex min-w-0 items-center gap-1.5"><TypeIcon ticket={parent} /><span className="truncate">{cleanTitle(parent.title)}</span></span> : <span className="text-muted-foreground">None</span>}
                </Button>
              } />
            {parent && <Button size="icon-xs" variant="ghost" aria-label="Open parent" onClick={() => void open(parent.number)}><ChevronRight /></Button>}
            {parent && <Button size="icon-xs" variant="ghost" aria-label="Remove parent" onClick={() => void extras.setParent(t, null, parent)}><X /></Button>}
          </div>
        </Field>
        <Field label="Tags" icon={TagIcon} wide empty={!t.labels.length}>
          <div className="flex min-h-8 flex-wrap items-center gap-1 px-1 py-1">
            {t.labels.map((l) => <LabelChip key={l.name} {...l} onRemove={() => void actions.setLabels(t, t.labels.map((x) => x.name).filter((n) => n !== l.name))} />)}
            <LabelPicker all={board.labels} value={t.labels.map((l) => l.name)} onChange={(ls) => void actions.setLabels(t, ls)}
              trigger={
                <button type="button" aria-label="Add or edit tags"
                  className="inline-flex h-6 items-center gap-1 rounded-full border border-dashed px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent hover:text-foreground">
                  <TagIcon className="size-3" />{t.labels.length ? "Edit" : "Add tags"}
                </button>
              } />
          </div>
        </Field>
      </div>
      </HideEmptyCtx.Provider>
      {(emptyCount > 0 || hideEmpty) && (
        <button onClick={toggleHideEmpty} className="mt-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
          {hideEmpty ? <ChevronsUpDown className="size-3.5" /> : <ChevronsDownUp className="size-3.5" />}
          {hideEmpty ? `Show ${emptyCount} empty field${emptyCount === 1 ? "" : "s"}` : "Collapse empty fields"}
        </button>
      )}
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {t.author && <span className="inline-flex items-center gap-1.5">Reported by <Avatar person={t.author} size={16} /><span className="text-foreground">{t.author.name || t.author.login}</span></span>}
        <span title={format(parseISO(t.createdAt), "PPpp")}>Created {formatDistanceToNow(parseISO(t.createdAt))} ago</span>
        <span title={format(parseISO(t.updatedAt), "PPpp")}>Updated {formatDistanceToNow(parseISO(t.updatedAt))} ago</span>
      </p>
    </div>
  );
}

// Goal: the GitHub milestone this ticket counts towards.
function GoalPicker({ ticket: t }: { ticket: Ticket }) {
  const { data: milestones } = useMilestones();
  const goals = useGoalActions();
  const open = (milestones ?? []).filter((m) => m.state === "OPEN" || m.number === t.milestone?.number);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="picker-trigger h-8 w-full justify-start rounded-lg px-2 font-normal" />}>
        {t.milestone ? <span className="inline-flex min-w-0 items-center gap-1.5"><TargetIcon className="size-3.5 shrink-0 text-primary" /><span className="truncate">{t.milestone.title}</span></span> : <span className="text-muted-foreground">No goal</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-60">
        <DropdownMenuLabel>Goal</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={String(t.milestone?.number ?? "none")} onValueChange={(v: string) => void goals.attach(t, open.find((m) => String(m.number) === v) ?? null)}>
          {open.map((m) => (
            <DropdownMenuRadioItem key={m.number} value={String(m.number)}>
              <TargetIcon className="size-4 text-primary" /><span className="min-w-0 flex-1 truncate">{m.title}</span>
              {m.dueOn && <span className="text-xs text-muted-foreground">{m.dueOn.slice(5).replace("-", "/")}</span>}
            </DropdownMenuRadioItem>
          ))}
          {!open.length && <p className="px-2.5 py-2 text-xs text-muted-foreground">No goals yet. Create one on the Goals page.</p>}
          <DropdownMenuSeparator />
          <DropdownMenuRadioItem value="none"><span className="text-muted-foreground">No goal</span></DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Recurring: pick an interval; finishing the ticket creates the next one.
function RepeatPicker({ ticket: t }: { ticket: Ticket }) {
  const actions = useActions();
  const current = repeatOf(t.body);
  const set = (r: Repeat | null) => void actions.updateText(t, { body: withRepeat(t.body, r) });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="h-8 w-full justify-start px-2 font-normal" />}>
        {current ? <span className="inline-flex items-center gap-1.5"><RepeatIcon className="size-3.5 text-primary" />{REPEATS.find((r) => r.id === current)?.label}</span> : <span className="text-muted-foreground">Doesn&apos;t repeat</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownMenuRadioGroup value={current ?? "none"} onValueChange={(v: string) => set(v === "none" ? null : (v as Repeat))}>
          <DropdownMenuRadioItem value="none">Doesn&apos;t repeat</DropdownMenuRadioItem>
          {REPEATS.map((r) => <DropdownMenuRadioItem key={r.id} value={r.id}>{r.label}</DropdownMenuRadioItem>)}
        </DropdownMenuRadioGroup>
        <p className="px-2 pt-1 pb-1.5 text-[11px] leading-snug text-muted-foreground">When this ticket is done, the next one is created with its dates moved on.</p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Total logged time with a running timer, as one compact field.
function TimeSummary({ board, ticket: t }: { board: Board; ticket: Ticket }) {
  const { data: comments } = useComments(t);
  const total = (comments ?? []).reduce((sum, c) => sum + (parseTime(c.body)?.minutes ?? 0), 0);
  return (
    <div className="flex items-center gap-2 px-2">
      <span className={cn("text-sm tabular", !total && "text-muted-foreground")}>{total ? fmtMinutes(total) : "None yet"}</span>
      <span className="ml-auto"><TimerButton board={board} ticket={t} /></span>
    </div>
  );
}

function TimeSection({ board, ticket: t }: { board: Board; ticket: Ticket }) {
  return <Section id="time" icon={Clock} title="Time tracking"><TimeTracking board={board} ticket={t} /></Section>;
}

function TimeTracking({ board, ticket: t }: { board: Board; ticket: Ticket }) {
  const extras = useTicketExtras();
  const [h, setH] = useState("");
  const [m, setM] = useState("");
  const [note, setNote] = useState("");
  const minutes = (Number(h) || 0) * 60 + (Number(m) || 0);
  const { data: comments } = useComments(t);
  const entries = (comments ?? []).flatMap((c) => { const x = parseTime(c.body); return x ? [{ c, ...x }] : []; });
  const total = entries.reduce((s, x) => s + x.minutes, 0);
  const log = async () => {
    if (minutes <= 0) return;
    if ((await extras.logTime(board, t, minutes, note.trim())) !== null) { setH(""); setM(""); setNote(""); }
  };
  return (
    <div>
      <div className="space-y-2 rounded-xl border bg-card p-3 shadow-card">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="size-4 text-muted-foreground" aria-hidden />
          <span className="min-w-0">
            {total ? <><b className="tabular">{fmtMinutes(total)}</b> logged <span className="text-muted-foreground">· {entries.length} entr{entries.length === 1 ? "y" : "ies"}</span></> : <span className="text-muted-foreground">No time logged yet</span>}
          </span>
          <span className="ml-auto"><TimerButton board={board} ticket={t} withLabel /></span>
        </div>
        {entries.length > 0 && (
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {entries.slice().reverse().map((x) => (
              <li key={x.c.id} className="flex items-center gap-2 text-xs">
                {x.c.author ? <Avatar person={x.c.author} size={16} /> : <span className="size-4 rounded-full bg-muted" />}
                <b className="w-14 shrink-0 tabular">{fmtMinutes(x.minutes)}</b>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{x.note || "—"}</span>
                <span className="shrink-0 text-muted-foreground" title={format(parseISO(x.c.createdAt), "PPpp")}>{format(parseISO(x.c.createdAt), "d MMM")}</span>
              </li>
            ))}
          </ul>
        )}
        <form className="grid gap-2 border-t pt-3" onSubmit={(e) => { e.preventDefault(); void log(); }}>
          <div className="flex items-center gap-2">
            {[["Hours", "h", h, setH], ["Minutes", "m", m, setM]].map(([label, unit, v, set]) => (
              <label key={label as string} className="field-frame flex h-8 flex-1 items-center rounded-lg border bg-background pr-2.5">
                <input aria-label={label as string} inputMode="numeric" value={v as string} placeholder="0"
                  onChange={(e) => (set as (s: string) => void)(e.target.value.replace(/\D/g, ""))}
                  className="field-bare h-full w-full min-w-0 bg-transparent px-2.5 text-sm tabular outline-none" />
                <span className="text-xs text-muted-foreground">{unit as string}</span>
              </label>
            ))}
            {[15, 30, 60].map((q) => (
              <Button key={q} type="button" size="xs" variant="ghost" className="text-muted-foreground" onClick={() => { setH(String(Math.floor(q / 60) || "")); setM(String(q % 60 || "")); }}>
                {q < 60 ? `${q}m` : "1h"}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input aria-label="What did you do?" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you do? (optional)"
              className="h-8 min-w-0 flex-1 rounded-lg border bg-background px-2.5 text-sm outline-none focus:border-ring" />
            <Button type="submit" size="sm" disabled={minutes <= 0}>Log {minutes > 0 ? fmtMinutes(minutes) : "time"}</Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Edit or delete entries under Activity → Time log; the total updates with them.</p>
        </form>
      </div>
    </div>
  );
}

export function TimerButton({ board, ticket: t, withLabel }: { board: Board; ticket: Ticket; withLabel?: boolean }) {
  const running = useTimer();
  const extras = useTicketExtras();
  const mine = running?.ticket === t.number;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!mine) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [mine]);
  const stop = async () => {
    const minutes = Math.max(1, Math.round((Date.now() - (running?.startedAt ?? Date.now())) / 60000));
    stopTimer();
    await extras.logTime(board, t, minutes, "timer");
  };
  if (mine) {
    return (
      <Button size="sm" variant="secondary" onClick={() => void stop()} className="tabular text-primary" title={`Stop and log ${fmtMinutes(Math.max(1, Math.round((now - running!.startedAt) / 60000)))}`}>
        <Pause />{fmtElapsed(now - running!.startedAt)}
      </Button>
    );
  }
  return (
    <Button size="sm" variant={withLabel ? "outline" : "ghost"} onClick={() => { if (running) toast.info(`Stopped the timer on #${running.ticket} without logging.`); startTimer(t); }}
      title="Start a timer" aria-label="Start a timer">
      <Play />{withLabel && "Start timer"}
    </Button>
  );
}

