"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { byUrl, childrenOf, hasField, isDone, options, parentOf, plain } from "@/lib/board";
import { config } from "@/lib/config";
import { useActions, useAddComment, useComments, useSource } from "@/lib/data";
import { fmtElapsed, fmtMinutes, startTimer, stopTimer, useDependencies, useTicketExtras, useTimer } from "@/lib/ticket-extras";
import type { Board, Comment, Ticket } from "@/lib/types";
import { useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  Ban, CheckCircle2, ChevronRight, Clock, ExternalLink, FileText, GitBranch, Link2, Maximize2, MessageSquare, MoreHorizontal,
  Paperclip, Pause, Pencil, Play, Plus, RotateCcw, ShieldAlert, Tag as TagIcon, Upload, X, XCircle,
} from "@/components/icons";
import Link from "next/link";
import { createContext, Fragment, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLayout, type Layout } from "@/lib/layout";
import { CustomiseMenu, CustomSection, useSectionDrops } from "../layout/custom-section";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Avatar, cleanTitle, LabelChip, OptionPill, TypeIcon } from "./bits";
import { DateInput, NumberInput, OptionPicker, PeoplePicker, SprintPicker } from "./pickers";
import { LabelPicker, TicketSearch } from "./search-pickers";
import { Segmented } from "../ui-plus/segmented";
import { StatusIcon } from "./status-icons";

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
    activity: <Activity ticket={t} />,
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Top bar: where it lives and what you can do with it. */}
      <header className="flex items-center gap-2 border-b px-3 py-2.5 sm:px-5 sm:py-3">
        <nav className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <span className="hidden truncate sm:inline">{board.projectTitle}</span>
          {parent && (<><ChevronRight className="hidden size-3.5 shrink-0 sm:block" /><button onClick={() => void open(parent.number)} className="flex min-w-0 items-center gap-1 hover:text-foreground hover:underline"><TypeIcon ticket={parent} /><span className="truncate">{cleanTitle(parent.title)}</span></button></>)}
          <ChevronRight className="size-3.5 shrink-0" />
          <span className="flex items-center gap-1 font-medium text-foreground"><TypeIcon ticket={t} /><span className="font-mono">#{t.number}</span></span>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <span className="hidden sm:inline"><CustomiseMenu layout={layout} labels={MAIN_SECTIONS} label="Layout" /></span>
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
            </DropdownMenuContent>
          </DropdownMenu>
          {onClose && <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}><X /></Button>}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-x-hidden overflow-y-auto lg:grid-cols-[minmax(0,1fr)_21rem] lg:overflow-hidden">
        <main className="min-w-0 space-y-7 px-4 py-5 sm:px-6 sm:py-6 lg:overflow-y-auto">
          <TitleAndStatus board={board} ticket={t} />
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
        <aside className="min-w-0 border-t bg-muted/25 px-4 py-4 sm:px-5 sm:py-5 lg:overflow-y-auto lg:border-t-0 lg:border-l" aria-label="Details">
          <Details board={board} ticket={t} />
        </aside>
      </div>
    </div>
  );
}

// ── Left column ─────────────────────────────────────────────────────────

const MAIN_SECTIONS: Record<string, string> = { description: "Description", subtasks: "Sub-tasks", dependencies: "Dependencies", attachments: "Attachments", activity: "Activity" };
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
      <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Status">
        {options(board, "Status").map((s) => {
          const on = t.fields.Status === s.name;
          return (
            <button key={s.id} role="radio" aria-checked={on} onClick={() => void actions.move(t, s.name)}
              className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                on ? "border-primary/50 bg-accent text-foreground shadow-card ring-2 ring-primary/20" : "bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground")}>
              <StatusIcon name={s.name} size={14} />{plain(s.name)}
            </button>
          );
        })}
      </div>
      {t.state === "CLOSED" && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
          {t.stateReason === "NOT_PLANNED" ? <Ban className="size-3.5" /> : <CheckCircle2 className="size-3.5 text-success" />}
          {t.stateReason === "NOT_PLANNED" ? "Closed as won't do" : "Closed as complete"}{t.closedAt ? ` · ${formatDistanceToNow(parseISO(t.closedAt))} ago` : ""}
        </p>
      )}
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
  const [body, setBody] = useState(t.body);
  const ref = useRef<HTMLTextAreaElement>(null);
  const wrap = (before: string, after = before) => {
    const el = ref.current; if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const next = body.slice(0, a) + before + body.slice(a, b) + after + body.slice(b);
    setBody(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + before.length, b + before.length); });
  };
  const save = () => { void actions.updateText(t, { body }); setEditing(false); };
  return (
    <Section id="description" icon={FileText} title="Description" action={!editing && <Button size="xs" variant="ghost" onClick={() => setEditing(true)}><Pencil />Edit</Button>}>
      {editing ? (
        <div className="overflow-hidden rounded-xl border bg-card focus-within:border-ring">
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
            <textarea ref={ref} value={body} onChange={(e) => setBody(e.target.value)} autoFocus rows={12} aria-label="Description"
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save(); if (e.key === "Escape") { setBody(t.body); setEditing(false); } }}
              className="block w-full resize-y bg-transparent p-3 font-mono text-sm leading-relaxed outline-none" placeholder="Describe the work. Markdown works: **bold**, - [ ] checklists, ### headings." />
          ) : (
            <div className="prose-ticket min-h-40 p-4 text-sm"><ReactMarkdown remarkPlugins={[remarkGfm]}>{body || "_Nothing to preview._"}</ReactMarkdown></div>
          )}
          <div className="flex items-center gap-2 border-t px-3 py-2">
            <span className="text-xs text-muted-foreground">Ctrl+Enter to save · Esc to cancel</span>
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { setBody(t.body); setEditing(false); }}>Cancel</Button>
            <Button size="sm" onClick={save}>Save</Button>
          </div>
        </div>
      ) : t.body.trim() ? (
        <div className="prose-ticket cursor-text rounded-xl p-1 text-[15px] hover:bg-muted/40" onDoubleClick={() => setEditing(true)}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{t.body}</ReactMarkdown>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="w-full rounded-xl border border-dashed p-5 text-left text-sm text-muted-foreground hover:bg-muted/40">
          Add a description so the team knows what&apos;s needed…
        </button>
      )}
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
    const status = options(board, "Status").find((o) => /todo|backlog/i.test(o.name))?.name;
    const type = options(board, "Ticket Type").find((o) => /task/i.test(o.name))?.name;
    const n = await actions.create({ title: `[Task] ${title.trim()}`, body: `### Parent issue\n\n#${t.number}`, labels: ["task"], assignees: [], fields: { Status: status, "Ticket Type": type }, parent: t.number });
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
  const [filter, setFilter] = useState<"all" | "comments" | "time">("all");
  const endRef = useRef<HTMLDivElement>(null);
  const shown = (comments ?? []).filter((c) => filter === "all" || (filter === "time" ? c.body.startsWith("⏱️") : !c.body.startsWith("⏱️") && !ATTACHMENT.test(c.body)));
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
    <Section id="activity" icon={MessageSquare} title="Activity" count={comments?.length}
      action={
        <Segmented size="xs" label="Show" value={filter} onChange={setFilter} options={[["all", "All"], ["comments", "Comments"], ["time", "Time log"]] as const} />
      }>
      {isLoading ? <Skeleton className="h-20 w-full" /> : (
        <ol className="space-y-4">
          {shown.map((c) => <Message key={c.id} c={c} />)}
          {!shown.length && <li className="rounded-xl bg-muted/40 p-4 text-center text-sm text-muted-foreground">No messages yet. Start the conversation below.</li>}
        </ol>
      )}
      <div ref={endRef} />
      <div className="sticky bottom-0 mt-4 rounded-xl border bg-card p-2 shadow-pop focus-within:border-ring">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Write a message… Use @name to mention someone. Ctrl+Enter sends." aria-label="New message"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void send(); }}
          className="block w-full resize-none bg-transparent p-1.5 text-sm outline-none" />
        <div className="flex items-center justify-end gap-2">
          <span className="mr-auto pl-1 text-[11px] text-muted-foreground">Markdown supported</span>
          <Button size="sm" disabled={!text.trim() || busy} onClick={() => void send()}>{busy ? "Sending…" : "Send"}</Button>
        </div>
      </div>
    </Section>
  );
}

function Message({ c }: { c: Comment }) {
  const system = c.body.startsWith("⏱️") || c.body.startsWith("📎");
  return (
    <li className="flex gap-3">
      {c.author ? <Avatar person={c.author} size={30} /> : <span className="size-[30px] rounded-full bg-muted" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{c.author?.name || c.author?.login || "Someone"}</span>
          <span title={format(parseISO(c.createdAt), "PPpp")}> · {formatDistanceToNow(parseISO(c.createdAt))} ago</span>
        </p>
        <div className={cn("prose-ticket mt-1 w-fit max-w-full rounded-2xl rounded-tl-sm px-3.5 py-2 text-sm", system ? "bg-transparent px-0 py-0 text-muted-foreground" : "bg-muted/60")}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{c.body}</ReactMarkdown>
        </div>
      </div>
    </li>
  );
}

// ── Right column ────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-center gap-2 py-0.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Details({ board, ticket: t }: { board: Board; ticket: Ticket }) {
  const actions = useActions();
  const extras = useTicketExtras();
  const [, open] = useOpenTicket();
  const parent = parentOf(board, t);
  const descendants = (p: Ticket): number[] => childrenOf(board, p).flatMap((c) => [c.number, ...descendants(c)]);
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Details</p>
        <div className="rounded-xl border bg-card p-2 shadow-card">
          <Field label="Assignees"><PeoplePicker people={board.people} value={t.assignees} onChange={(l) => void actions.setAssignees(t, l)} /></Field>
          {(["Priority", "Ticket Type", "Size", "Component"] as const).filter((f) => hasField(board, f)).map((f) => (
            <Field key={f} label={f === "Ticket Type" ? "Type" : f}>
              <OptionPicker board={board} field={f} label={f} value={t.fields[f]} onChange={(v) => void actions.setField(t, f, v)} />
            </Field>
          ))}
          <Field label="Tags">
            <LabelPicker all={board.labels} value={t.labels.map((l) => l.name)} onChange={(ls) => void actions.setLabels(t, ls)}
              trigger={
                <button className="flex min-h-8 w-full flex-wrap items-center gap-1 rounded-md px-2 py-1 text-left hover:bg-muted" aria-label="Edit tags">
                  {t.labels.length ? t.labels.map((l) => <LabelChip key={l.name} {...l} />) : <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><TagIcon className="size-3.5" />Add tags</span>}
                </button>
              } />
          </Field>
          <Field label="Parent">
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
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Planning</p>
        <div className="rounded-xl border bg-card p-2 shadow-card">
          {hasField(board, "Sprint") && <Field label="Sprint"><SprintPicker board={board} value={t.fields.Sprint} onChange={(v) => void actions.setField(t, "Sprint", v)} /></Field>}
          {hasField(board, "Story Points") && <Field label="Points"><NumberInput key={t.fields["Story Points"] ?? "x"} label="Story points" value={t.fields["Story Points"]} onChange={(v) => void actions.setField(t, "Story Points", v)} /></Field>}
          {hasField(board, "Start date") && <Field label="Start"><DateInput label="Start date" value={t.fields["Start date"]} onChange={(v) => void actions.setField(t, "Start date", v)} /></Field>}
          {hasField(board, "Target date") && <Field label="Due"><DateInput warnPast={!isDone(t)} label="Due date" value={t.fields["Target date"]} onChange={(v) => void actions.setField(t, "Target date", v)} /></Field>}
        </div>
      </div>

      <TimeTracking board={board} ticket={t} />

      <dl className="space-y-1.5 px-1 text-xs text-muted-foreground">
        {t.author && <div className="flex items-center gap-2"><dt className="w-[6.5rem]">Reported by</dt><dd className="flex items-center gap-1.5 text-foreground"><Avatar person={t.author} size={18} />{t.author.name || t.author.login}</dd></div>}
        <div className="flex gap-2"><dt className="w-[6.5rem]">Created</dt><dd title={format(parseISO(t.createdAt), "PPpp")}>{formatDistanceToNow(parseISO(t.createdAt))} ago</dd></div>
        <div className="flex gap-2"><dt className="w-[6.5rem]">Updated</dt><dd title={format(parseISO(t.updatedAt), "PPpp")}>{formatDistanceToNow(parseISO(t.updatedAt))} ago</dd></div>
      </dl>
    </div>
  );
}

function TimeTracking({ board, ticket: t }: { board: Board; ticket: Ticket }) {
  const extras = useTicketExtras();
  const [h, setH] = useState("");
  const [m, setM] = useState("");
  const [note, setNote] = useState("");
  const minutes = (Number(h) || 0) * 60 + (Number(m) || 0);
  const spent = (t.fields as Record<string, unknown>)["Time spent (h)"] as number | undefined;
  const log = async () => {
    if (minutes <= 0) return;
    if (await extras.logTime(board, t, minutes, note.trim())) { setH(""); setM(""); setNote(""); }
  };
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Time tracking</p>
      <div className="space-y-2 rounded-xl border bg-card p-3 shadow-card">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="size-4 text-muted-foreground" aria-hidden />
          <span>{spent ? `${spent}h logged` : "No time logged on the board yet"}</span>
          <span className="ml-auto"><TimerButton board={board} ticket={t} withLabel /></span>
        </div>
        <form className="flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); void log(); }}>
          <input aria-label="Hours" inputMode="numeric" value={h} onChange={(e) => setH(e.target.value.replace(/\D/g, ""))} placeholder="h" className="h-8 w-11 rounded-md border bg-background px-2 text-sm tabular outline-none focus:border-ring" />
          <input aria-label="Minutes" inputMode="numeric" value={m} onChange={(e) => setM(e.target.value.replace(/\D/g, ""))} placeholder="m" className="h-8 w-11 rounded-md border bg-background px-2 text-sm tabular outline-none focus:border-ring" />
          <input aria-label="What did you do?" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you do?" className="h-8 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm outline-none focus:border-ring" />
          <Button type="submit" size="sm" variant="secondary" disabled={minutes <= 0}>Log</Button>
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

