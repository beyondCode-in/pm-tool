"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { hasField, isDone, options } from "@/lib/board";
import { useActions, useAddComment, useBoard, useComments, useSource } from "@/lib/data";
import type { Board, Ticket } from "@/lib/types";
import { useOpenTicket } from "@/lib/url-state";
import { formatDistanceToNow, parseISO } from "date-fns";
import { CheckCircle2, ExternalLink, Link2, MoreHorizontal, RotateCcw, XCircle } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Avatar, cleanTitle, LabelChip, OptionPill, TypeIcon } from "./bits";
import { DateInput, NumberInput, OptionPicker, PeoplePicker, SprintPicker } from "./pickers";

export function TicketDrawer() {
  const [number, setNumber] = useOpenTicket();
  const { data: board } = useBoard();
  const ticket = board?.tickets.find((t) => t.number === number) ?? null;
  return (
    <Sheet open={number !== null} onOpenChange={(o: boolean) => { if (!o) void setNumber(null); }}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl" aria-describedby={undefined}>
        {board && ticket ? <TicketDetail key={ticket.number} board={board} ticket={ticket} /> : (
          <div className="space-y-3 p-6">
            <SheetTitle className="sr-only">Loading ticket</SheetTitle>
            {number !== null && board ? <p className="text-sm text-muted-foreground">Ticket #{number} isn&apos;t on this board.</p> : <><Skeleton className="h-7 w-2/3" /><Skeleton className="h-40 w-full" /></>}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] items-center gap-2 py-0.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function TicketDetail({ board, ticket: t }: { board: Board; ticket: Ticket }) {
  const actions = useActions();
  const source = useSource();
  const [, open] = useOpenTicket();
  const [title, setTitle] = useState(t.title);
  const [editingBody, setEditingBody] = useState(false);
  const [body, setBody] = useState(t.body);

  const children = board.tickets.filter((c) => c.parent === t.number);
  const parent = t.parent ? board.tickets.find((p) => p.number === t.parent) : null;
  const statuses = options(board, "Status");

  const saveTitle = () => { const v = title.trim(); if (v && v !== t.title) void actions.updateText(t, { title: v }); else setTitle(t.title); };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b px-5 py-3 pr-12">
        <TypeIcon ticket={t} />
        <span className="font-mono text-xs text-muted-foreground">#{t.number}</span>
        {parent && (
          <button className="truncate text-xs text-muted-foreground hover:text-foreground hover:underline" onClick={() => void open(parent.number)}>
            in {cleanTitle(parent.title)}
          </button>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Copy link" onClick={() => { void navigator.clipboard?.writeText(window.location.href); toast.success("Link copied"); }}>
            <Link2 />
          </Button>
          {source?.mode === "github" && (
            <Button variant="ghost" size="icon-sm" aria-label="Open on GitHub" render={<a href={t.url} target="_blank" rel="noreferrer" />}><ExternalLink /></Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More actions" />}><MoreHorizontal /></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              {t.state === "OPEN" ? (<>
                <DropdownMenuItem onClick={() => void actions.setState(t, "CLOSED", "COMPLETED")}><CheckCircle2 />Mark complete</DropdownMenuItem>
                <DropdownMenuItem onClick={() => void actions.setState(t, "CLOSED", "NOT_PLANNED")}><XCircle />Won&apos;t do</DropdownMenuItem>
              </>) : <DropdownMenuItem onClick={() => void actions.setState(t, "OPEN")}><RotateCcw />Reopen</DropdownMenuItem>}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void actions.setAssignees(t, [board.viewer.login])}>Assign to me</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pt-4">
          <SheetTitle className="sr-only">{t.title}</SheetTitle>
          <SheetDescription className="sr-only">Ticket details and properties</SheetDescription>
          <textarea value={title} onChange={(e) => setTitle(e.target.value)} onBlur={saveTitle} rows={1} aria-label="Title"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); } if (e.key === "Escape") setTitle(t.title); }}
            className="field-sizing-content w-full resize-none rounded-md bg-transparent text-xl font-semibold tracking-tight outline-none hover:bg-muted/50 focus:bg-muted/50" />

          {/* Status as one-click steps: the most common action in the whole app. */}
          <div className="mt-3 flex flex-wrap gap-1" role="radiogroup" aria-label="Status">
            {statuses.map((s) => {
              const on = t.fields.Status === s.name;
              return (
                <button key={s.id} role="radio" aria-checked={on} onClick={() => void actions.move(t, s.name)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                  {s.name}
                </button>
              );
            })}
          </div>
          {t.state === "CLOSED" && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t.stateReason === "NOT_PLANNED" ? "Closed as won't do" : "Closed as complete"}{t.closedAt ? ` · ${formatDistanceToNow(parseISO(t.closedAt))} ago` : ""}
            </p>
          )}
        </div>

        <section className="mx-5 mt-4 rounded-xl border bg-card p-3" aria-label="Properties">
          <Row label="Assignees"><PeoplePicker people={board.people} value={t.assignees} onChange={(l) => void actions.setAssignees(t, l)} /></Row>
          {(["Priority", "Ticket Type", "Size", "Component"] as const).filter((f) => hasField(board, f)).map((f) => (
            <Row key={f} label={f === "Ticket Type" ? "Type" : f}>
              <OptionPicker board={board} field={f} label={f} value={t.fields[f]} onChange={(v) => void actions.setField(t, f, v)} />
            </Row>
          ))}
          {hasField(board, "Sprint") && <Row label="Sprint"><SprintPicker board={board} value={t.fields.Sprint} onChange={(v) => void actions.setField(t, "Sprint", v)} /></Row>}
          {hasField(board, "Story Points") && <Row label="Story points"><NumberInput label="Story points" value={t.fields["Story Points"]} onChange={(v) => void actions.setField(t, "Story Points", v)} /></Row>}
          {hasField(board, "Start date") && <Row label="Start"><DateInput label="Start date" value={t.fields["Start date"]} onChange={(v) => void actions.setField(t, "Start date", v)} /></Row>}
          {hasField(board, "Target date") && <Row label="Due"><DateInput label="Due date" value={t.fields["Target date"]} onChange={(v) => void actions.setField(t, "Target date", v)} /></Row>}
          <Row label="Tags">
            <div className="flex flex-wrap gap-1 px-2 py-1">{t.labels.length ? t.labels.map((l) => <LabelChip key={l.name} {...l} />) : <span className="text-sm text-muted-foreground">None</span>}</div>
          </Row>
        </section>

        <section className="px-5 pt-5" aria-label="Description">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Description</h3>
            {!editingBody && <Button variant="ghost" size="xs" onClick={() => setEditingBody(true)}>Edit</Button>}
          </div>
          {editingBody ? (
            <div className="space-y-2">
              <textarea value={body} onChange={(e) => setBody(e.target.value)} autoFocus rows={10} aria-label="Description"
                className="w-full rounded-lg border bg-background p-3 font-mono text-sm outline-none focus:border-ring" />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { void actions.updateText(t, { body }); setEditingBody(false); }}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => { setBody(t.body); setEditingBody(false); }}>Cancel</Button>
              </div>
            </div>
          ) : t.body.trim() ? (
            <div className="prose-ticket text-sm"><ReactMarkdown remarkPlugins={[remarkGfm]}>{t.body}</ReactMarkdown></div>
          ) : (
            <button onClick={() => setEditingBody(true)} className="w-full rounded-lg border border-dashed p-4 text-left text-sm text-muted-foreground hover:bg-muted/50">
              Add a description so the team knows what&apos;s needed…
            </button>
          )}
        </section>

        {children.length > 0 && (
          <section className="px-5 pt-6" aria-label="Sub-tasks">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              Sub-tasks <span className="text-xs font-normal text-muted-foreground">{children.filter(isDone).length} of {children.length} done</span>
            </h3>
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-success transition-[width] duration-500" style={{ width: `${(children.filter(isDone).length / children.length) * 100}%` }} />
            </div>
            <ul className="divide-y rounded-lg border">
              {children.map((c) => (
                <li key={c.number}>
                  <button onClick={() => void open(c.number)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50">
                    <TypeIcon ticket={c} />
                    <span className={`flex-1 truncate ${isDone(c) ? "text-muted-foreground line-through" : ""}`}>{cleanTitle(c.title)}</span>
                    <OptionPill board={board} field="Status" value={c.fields.Status} compact />
                    {c.assignees[0] && <Avatar person={c.assignees[0]} size={20} />}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Comments ticket={t} />
      </div>
    </div>
  );
}

function Comments({ ticket }: { ticket: Ticket }) {
  const { data: comments, isLoading } = useComments(ticket);
  const add = useAddComment();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!text.trim()) return;
    setBusy(true);
    if (await add(ticket, text.trim())) setText("");
    setBusy(false);
  };
  return (
    <section className="px-5 pt-6 pb-8" aria-label="Comments">
      <h3 className="mb-3 text-sm font-semibold">Activity</h3>
      {isLoading ? <Skeleton className="h-16 w-full" /> : (
        <ol className="space-y-4">
          {(comments ?? []).map((c) => (
            <li key={c.id} className="flex gap-3">
              {c.author && <Avatar person={c.author} size={28} />}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">{c.author?.name || c.author?.login}</span> · {formatDistanceToNow(parseISO(c.createdAt))} ago</p>
                <div className="prose-ticket mt-1 text-sm"><ReactMarkdown remarkPlugins={[remarkGfm]}>{c.body}</ReactMarkdown></div>
              </div>
            </li>
          ))}
          {comments?.length === 0 && <li className="text-sm text-muted-foreground">No comments yet.</li>}
        </ol>
      )}
      <div className="mt-4 rounded-xl border bg-card p-2 focus-within:border-ring">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Write a comment… (Ctrl+Enter to send)" aria-label="New comment"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit(); }}
          className="w-full resize-none bg-transparent p-1 text-sm outline-none" />
        <div className="flex justify-end"><Button size="sm" disabled={!text.trim() || busy} onClick={() => void submit()}>{busy ? "Sending…" : "Comment"}</Button></div>
      </div>
    </section>
  );
}
