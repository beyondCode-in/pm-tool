"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { options, plain } from "@/lib/board";
import { workspace } from "@/lib/workspace";
import { deleteTemplate, fromTemplate, useTemplates, type Template } from "@/lib/templates";
import { Copy as CopyIcon } from "@phosphor-icons/react";
import { useActions, useBoard } from "@/lib/data";
import {
  defaultAnswers, issueBody, labelsFor, missingAnswers, parentNumber, priorityWord, sizeWord, titleQuestion,
  TICKET_TYPES, type Answers, type Question, type TicketType,
} from "@/lib/ticket-types";
import type { Board, FieldValues } from "@/lib/types";
import { useNewTicket, useOpenTicket } from "@/lib/url-state";
import { celebrate } from "@/lib/celebrate";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "@/components/icons";
import { useEffect, useMemo, useState } from "react";
import { Avatar, LabelChip } from "../ticket/bits";
import { TypeGlyph } from "../ticket/type-badge";
import { DateInput, PeoplePicker } from "../ticket/pickers";

const DRAFT_KEY = "beyondpm.draft";
const STEPS = ["Type", "Describe", "Details"] as const;

const optionByWord = (b: Board, field: string, word?: string) =>
  word ? options(b, field).find((o) => plain(o.name).toLowerCase().split(/[^\p{L}\p{N}/]+/u).includes(word.toLowerCase()))?.name : undefined;

type Draft = { typeId: string | null; answers: Answers; assignees: string[]; due: string | null; step: number };
const emptyDraft: Draft = { typeId: null, answers: {}, assignees: [], due: null, step: 0 };

export function CreateTicketDialog() {
  const [param, setParam] = useNewTicket();
  const open = param !== null;
  const close = () => void setParam(null);

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => { if (!o) close(); }}>
      <DialogContent className="max-h-[92dvh] w-[min(100vw-1rem,64rem)] max-w-none gap-0 overflow-hidden p-0 sm:max-w-none" showCloseButton>
        <DialogTitle className="sr-only">Create a ticket</DialogTitle>
        <DialogDescription className="sr-only">Three short steps: choose a type, describe it, add details.</DialogDescription>
        {open && <DraftedWizard preset={param} onClose={close} />}
      </DialogContent>
    </Dialog>
  );
}

// Mounted each time the dialog opens: restores the unsent draft (or the type
// asked for in the URL) and keeps saving it while the person types.
function loadDraft(preset: string | null): Draft {
  const t = preset ? TICKET_TYPES.find((x) => x.id === preset) : undefined;
  if (t) return { ...emptyDraft, typeId: t.id, answers: defaultAnswers(t), step: 1 };
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null") as Draft | null;
    if (saved?.typeId) return saved;
  } catch { /* no storage: start fresh */ }
  return emptyDraft;
}

function DraftedWizard({ preset, onClose }: { preset: string | null; onClose: () => void }) {
  const { data: board } = useBoard();
  const [draft, setDraft] = useState<Draft>(() => loadDraft(preset));
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* ignore */ }
  }, [draft]);
  const done = () => { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } onClose(); };
  if (!board) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  return <Wizard board={board} draft={draft} setDraft={setDraft} onDone={done} />;
}

function Wizard({ board, draft, setDraft, onDone }: { board: Board; draft: Draft; setDraft: (d: Draft) => void; onDone: () => void }) {
  const actions = useActions();
  const [, openTicket] = useOpenTicket();
  const [busy, setBusy] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [created, setCreated] = useState<number | null>(null);
  const type = TICKET_TYPES.find((t) => t.id === draft.typeId) ?? null;
  const tq = type ? titleQuestion(type) : null;
  const title = tq ? String(draft.answers[tq.id] ?? "") : "";

  const textQs = type?.questions.filter((q): q is Extract<Question, { kind: "text" | "longtext" }> => q.kind === "text" || q.kind === "longtext") ?? [];
  const pickQs = type?.questions.filter((q): q is Extract<Question, { kind: "choice" | "multi" }> => q.kind === "choice" || q.kind === "multi") ?? [];
  const missing = type ? missingAnswers(type, draft.answers) : [];
  const missingHere = (step: number) => missing.filter((q) => (step === 1 ? (textQs as Question[]) : (pickQs as Question[])).includes(q));

  const pickType = (t: TicketType) => setDraft({ ...draft, typeId: t.id, answers: { ...defaultAnswers(t), ...(tq ? { [titleQuestion(t).id]: title } : {}) }, step: 1 });
  const set = (id: string, v: string | string[]) => setDraft({ ...draft, answers: { ...draft.answers, [id]: v } });
  const go = (step: number) => {
    if (step > draft.step && missingHere(draft.step).length) { setShowErrors(true); focusFirstMissing(); return; }
    setShowErrors(false);
    setDraft({ ...draft, step });
  };

  // Start from a saved template: created straight away, then opened to edit.
  async function fromTpl(tpl: Template) {
    setBusy(true);
    const n = await actions.create(fromTemplate(tpl, workspace().start));
    setBusy(false);
    if (n) { onDone(); void openTicket(n); }
  }

  async function submit() {
    if (!type || !tq) return;
    if (missing.length) { setShowErrors(true); setDraft({ ...draft, step: missingHere(1).length ? 1 : 2 }); return; }
    setBusy(true);
    const a = draft.answers;
    const fields: FieldValues = {
      Status: workspace().start ?? options(board, "Status")[0]?.name,
      Priority: optionByWord(board, "Priority", priorityWord(a)),
      "Ticket Type": optionByWord(board, "Ticket Type", type.boardType),
      Size: optionByWord(board, "Size", sizeWord(a)),
      "Target date": draft.due ?? undefined,
    };
    const n = await actions.create({
      title: `${type.titlePrefix}${title.trim()}`,
      body: issueBody(type, a, board.viewer.login),
      labels: labelsFor(type, a),
      assignees: draft.assignees,
      fields,
      parent: parentNumber(a),
    });
    setBusy(false);
    if (n) { setCreated(n); void celebrate({ x: 0.5, y: 0.4 }); }
  }

  if (created) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="grid place-items-center gap-4 p-10 text-center sm:p-16">
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.05 }}
          className="grid size-16 place-items-center rounded-full bg-success text-white"><Check className="size-8" /></motion.span>
        <h2 className="text-2xl font-semibold tracking-tight">Ticket #{created} is on the board</h2>
        <p className="max-w-md text-muted-foreground">The team will pick it up from here. You&apos;ll see updates on the ticket, and GitHub will email you when someone comments.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => { onDone(); void openTicket(created); }}>Open ticket</Button>
          <Button variant="outline" onClick={() => { setCreated(null); setDraft({ ...emptyDraft, typeId: type?.id ?? null, answers: type ? defaultAnswers(type) : {}, step: type ? 1 : 0 }); }}>Create another</Button>
          <Button variant="ghost" onClick={onDone}>Done</Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid max-h-[92dvh] grid-rows-[auto_1fr_auto] md:grid-cols-[1fr_20rem]">
      <header className="flex items-center gap-4 border-b px-5 py-4 md:col-span-2">
        <h2 className="text-lg font-semibold tracking-tight">New ticket</h2>
        <ol className="flex items-center gap-1.5 text-xs" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-1.5">
              <button disabled={i > 0 && !type} onClick={() => go(i)} aria-current={draft.step === i ? "step" : undefined}
                className={cn("flex items-center gap-1.5 rounded-full px-2 py-1 font-medium transition-colors disabled:opacity-40",
                  draft.step === i ? "bg-primary text-primary-foreground" : i < draft.step ? "text-foreground hover:bg-muted" : "text-muted-foreground hover:bg-muted")}>
                <span className={cn("grid size-4 place-items-center rounded-full text-[10px]", draft.step === i ? "bg-primary-foreground/20" : "bg-muted")}>{i < draft.step ? "✓" : i + 1}</span>
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < STEPS.length - 1 && <span className="h-px w-3 bg-border" aria-hidden />}
            </li>
          ))}
        </ol>
      </header>

      <div className="min-h-0 overflow-y-auto p-5">
        {/* Enter-only animation: the next step is usable immediately, never blocked by an exit transition. */}
        <motion.div key={draft.step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18, ease: "easeOut" }}>
            {draft.step === 0 && <><Templates board={board} onUse={fromTpl} busy={busy} /><TypeStep onPick={pickType} selected={draft.typeId} /></>}
            {draft.step === 1 && type && tq && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="q-title" className="mb-1.5 block text-base font-semibold">In one sentence, what&apos;s it about?</label>
                  <input id="q-title" autoFocus value={title} onChange={(e) => set(tq.id, e.target.value)} maxLength={140} data-q={tq.id}
                    placeholder={"placeholder" in tq && tq.placeholder ? tq.placeholder : "Short and plain is perfect"} aria-invalid={showErrors && missing.includes(tq)}
                    className="h-12 w-full rounded-xl border bg-background px-4 text-base outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 aria-invalid:border-destructive" />
                  {!title && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {type.titleIdeas.map((idea) => (
                        <button key={idea} onClick={() => { set(tq.id, idea); setTimeout(() => document.getElementById("q-title")?.focus()); }}
                          className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">{idea}</button>
                      ))}
                    </div>
                  )}
                  {showErrors && missing.includes(tq) && <p className="mt-1.5 text-sm font-medium text-destructive">Add a short title so the team knows what this is.</p>}
                </div>
                {textQs.filter((q) => q !== tq).map((q) => <TextQuestion key={q.id} q={q} value={String(draft.answers[q.id] ?? "")} onChange={(v) => set(q.id, v)} error={showErrors && missing.includes(q)} />)}
              </div>
            )}
            {draft.step === 2 && type && (
              <div className="space-y-6">
                {pickQs.map((q) => <PickQuestion key={q.id} q={q} value={draft.answers[q.id]} onChange={(v) => set(q.id, v)} error={showErrors && missing.includes(q)} />)}
                <fieldset className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                  <legend className="px-1 text-sm font-semibold">Optional</legend>
                  <div><span className="mb-1 block text-xs font-medium text-muted-foreground">Who should work on it?</span>
                    <PeoplePicker people={board.people} value={board.people.filter((p) => draft.assignees.includes(p.login))} onChange={(assignees) => setDraft({ ...draft, assignees })} /></div>
                  <div><span className="mb-1 block text-xs font-medium text-muted-foreground">Needed by</span>
                    <DateInput label="Needed by" value={draft.due ?? undefined} onChange={(due) => setDraft({ ...draft, due })} /></div>
                </fieldset>
              </div>
            )}
        </motion.div>
      </div>

      <Preview board={board} type={type} title={title} answers={draft.answers} assignees={draft.assignees} due={draft.due}
        onDropType={(id) => { const t = TICKET_TYPES.find((x) => x.id === id); if (t) pickType(t); }} />

      <footer className="flex items-center gap-2 border-t px-5 py-3 md:col-span-2">
        {draft.step > 0 && <Button variant="ghost" onClick={() => go(draft.step - 1)}><ArrowLeft />Back</Button>}
        <span className="text-xs text-muted-foreground" aria-live="polite">{type ? "Draft saved" : ""}</span>
        <div className="ml-auto flex gap-2">
          {draft.step === 1 && <Button onClick={() => go(2)}>Next<ArrowRight /></Button>}
          {draft.step === 2 && (
            <Button onClick={() => void submit()} disabled={busy} className="min-w-36">
              {busy ? <><Loader2 className="animate-spin" />Creating…</> : <>Create ticket<ArrowRight /></>}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

function focusFirstMissing() {
  setTimeout(() => (document.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus());
}

function Templates({ board, onUse, busy }: { board: Board; onUse: (t: Template) => void; busy: boolean }) {
  const list = useTemplates(board.projectId);
  if (!list.length) return null;
  return (
    <div className="mb-6">
      <p className="mb-2 text-sm font-semibold">Templates</p>
      <div className="flex flex-wrap gap-2">
        {list.map((t) => (
          <div key={t.id} className="group/tpl relative">
            <button disabled={busy} onClick={() => onUse(t)} title={`New ticket from "${t.name}"`}
              className="lift flex max-w-64 items-center gap-2 rounded-xl border bg-card py-2 pr-8 pl-3 text-left text-sm transition-[border-color,box-shadow] hover:border-primary/40 disabled:opacity-50">
              <CopyIcon weight="duotone" className="size-4 shrink-0 text-primary" /><span className="truncate font-medium">{t.name}</span>
            </button>
            <button aria-label={`Delete template ${t.name}`} title="Delete template" onClick={() => deleteTemplate(board.projectId, t.id)}
              className="absolute top-1/2 right-1.5 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground opacity-0 group-hover/tpl:opacity-100 hover:text-destructive focus-visible:opacity-100 [@media(hover:none)]:opacity-100">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypeStep({ onPick, selected }: { onPick: (t: TicketType) => void; selected: string | null }) {
  const [more, setMore] = useState(false);
  const shown = TICKET_TYPES.filter((t) => t.forEveryone || more);
  return (
    <div>
      <p className="mb-4 text-base font-semibold">What do you need?</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Ticket type">
        {shown.map((t, i) => (
          <button key={t.id} role="radio" aria-checked={selected === t.id} draggable
            onDragStart={(e) => e.dataTransfer.setData("text/x-ticket-type", t.id)} onClick={() => onPick(t)}
            style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}
            className={cn("spotlight lift animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both flex h-full flex-col transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 active:scale-[0.98] items-start gap-2 rounded-2xl border bg-card p-4 text-left shadow-xs transition-colors hover:border-foreground/20 hover:shadow-md",
              selected === t.id && "border-primary bg-accent")}>
            <TypeGlyph kind={t.id} size={40} />
            <span className="font-semibold">{t.name}</span>
            <span className="text-sm leading-snug text-muted-foreground">{t.blurb}</span>
          </button>
        ))}
      </div>
      {!more && <Button variant="link" className="mt-3 px-0" onClick={() => setMore(true)}>More types for the team (feature, task, epic, research)</Button>}
    </div>
  );
}

function TextQuestion({ q, value, onChange, error }: { q: Extract<Question, { kind: "text" | "longtext" }>; value: string; onChange: (v: string) => void; error: boolean }) {
  const id = `q-${q.id}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">{q.label}{!q.required && <span className="font-normal text-muted-foreground"> (optional)</span>}</label>
      {q.kind === "text" ? (
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={q.placeholder} aria-invalid={error}
          className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring aria-invalid:border-destructive" />
      ) : (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={q.placeholder} rows={4} aria-invalid={error}
          className="w-full rounded-lg border bg-background p-3 text-sm leading-relaxed outline-none focus:border-ring aria-invalid:border-destructive" />
      )}
      {q.prompts && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {q.prompts.map((p) => (
            <button key={p} onClick={() => onChange(`${value.trim() ? `${value.trimEnd()}\n\n` : ""}**${p}**\n`)}
              className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">+ {p}</button>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-sm font-medium text-destructive">This one&apos;s needed.</p>}
    </div>
  );
}

function PickQuestion({ q, value, onChange, error }: { q: Extract<Question, { kind: "choice" | "multi" }>; value: string | string[] | undefined; onChange: (v: string | string[]) => void; error: boolean }) {
  const multi = q.kind === "multi";
  const selected = multi ? ((value as string[]) ?? []) : [String(value ?? "")];
  const isPriority = q.id === "priority";
  const tone = (v: string) => (/P0/.test(v) ? "data-[on=true]:border-destructive data-[on=true]:bg-destructive/10" : /P1/.test(v) ? "data-[on=true]:border-orange-500 data-[on=true]:bg-orange-500/10"
    : /P2/.test(v) ? "data-[on=true]:border-amber-500 data-[on=true]:bg-amber-500/10" : "data-[on=true]:border-emerald-500 data-[on=true]:bg-emerald-500/10");
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{q.label}{multi && <span className="font-normal text-muted-foreground"> · pick any</span>}</legend>
      <div className={cn("flex flex-wrap gap-2", isPriority && "grid grid-cols-2 sm:grid-cols-4")} role={multi ? "group" : "radiogroup"} aria-invalid={error}>
        {q.choices.map((c) => {
          const on = selected.includes(c.value);
          return (
            <button key={c.value} role={multi ? "checkbox" : "radio"} aria-checked={on} data-on={on}
              onClick={() => onChange(multi ? (on ? selected.filter((s) => s !== c.value) : [...selected, c.value]) : c.value)}
              className={cn("rounded-xl border px-3 py-2 text-left text-sm transition-colors hover:bg-muted data-[on=true]:border-primary data-[on=true]:bg-accent",
                isPriority && tone(c.value))}>
              <span className="font-medium">{c.label}</span>
              {c.hint && <span className="block text-xs text-muted-foreground">{c.hint}</span>}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1 text-sm font-medium text-destructive">Pick at least one.</p>}
    </fieldset>
  );
}

function Preview({ board, type, title, answers, assignees, due, onDropType }: {
  board: Board; type: TicketType | null; title: string; answers: Answers; assignees: string[]; due: string | null; onDropType: (id: string) => void;
}) {
  const [over, setOver] = useState(false);
  const labels = useMemo(() => (type ? labelsFor(type, answers) : []), [type, answers]);
  const people = board.people.filter((p) => assignees.includes(p.login));
  const total = type ? type.questions.filter((q) => q.required).length + 1 : 1;
  const done = type ? total - missingAnswers(type, answers).length : 0;
  return (
    <aside className="hidden border-l bg-muted/30 p-5 md:block" aria-label="Preview">
      <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Preview</p>
      <motion.div layout onDragOver={(e) => { if (e.dataTransfer.types.includes("text/x-ticket-type")) { e.preventDefault(); setOver(true); } }}
        onDragLeave={() => setOver(false)} onDrop={(e) => { setOver(false); const id = e.dataTransfer.getData("text/x-ticket-type"); if (id) onDropType(id); }}
        animate={{ scale: over ? 1.03 : 1 }}
        className={cn("rounded-2xl border bg-card p-4 shadow-sm transition-colors", over && "border-primary ring-3 ring-primary/20")}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TypeGlyph kind={type?.id ?? "ticket"} size={20} />{type?.name ?? "Drop a type here"}
        </div>
        <p className={cn("mt-2 font-semibold leading-snug", !title && "text-muted-foreground")}>{title || "Your title appears here"}</p>
        {labels.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{labels.map((l) => <LabelChip key={l} name={l} color={board.labels.find((x) => x.name === l)?.color} />)}</div>}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{due ? `Due ${due}` : "No due date"}</span>
          <span className="flex -space-x-1">{people.map((p) => <Avatar key={p.login} person={p} size={20} />)}</span>
        </div>
      </motion.div>
      {type && (
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-xs font-medium"><span>{done === total ? "Ready to create" : "Required answers"}</span><span className="tabular-nums">{done}/{total}</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted"><motion.div className="h-full rounded-full bg-primary" animate={{ width: `${(done / total) * 100}%` }} /></div>
        </div>
      )}
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">It becomes a GitHub issue on <b>{board.projectTitle}</b>, with tags and board fields filled in for you.</p>
    </aside>
  );
}
