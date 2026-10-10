"use client";

import { BrandLoader } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useBoard, useSource } from "@/lib/data";
import { currentTenant } from "@/lib/tenant";
import { useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { ChevronRight, ExternalLink, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "@/components/icons";
import * as P from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { markMentions, MentionTextarea } from "@/components/ui-plus/mention-textarea";

// Docs (ClickUp Docs, on the repository): Markdown files under docs/, in
// folders. Every save is a commit, so docs have history and show on GitHub.
// "#123" in a doc links to that ticket.

const ROOT = "docs";
const name = (path: string) => path.split("/").pop()!.replace(/\.md$/, "");
const folderOf = (path: string) => path.slice(ROOT.length + 1).split("/").slice(0, -1).join("/");

export default function DocsPage() {
  const { data: board } = useBoard();
  const source = useSource();
  const qc = useQueryClient();
  const [doc, setDoc] = useQueryState("doc", parseAsString.withOptions({ history: "push" }));
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const list = useQuery({ queryKey: ["files", ROOT], enabled: !!source, queryFn: () => source!.listFiles(ROOT, ".md") });
  const files = useMemo(() => (list.data ?? []).filter((f) => name(f.path).toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.path.localeCompare(b.path)), [list.data, q]);
  const folders = useMemo(() => {
    const m = new Map<string, typeof files>();
    for (const f of files) m.set(folderOf(f.path), [...(m.get(folderOf(f.path)) ?? []), f]);
    return [...m.entries()].sort(([a], [b]) => (a === "" ? -1 : b === "" ? 1 : a.localeCompare(b)));
  }, [files]);
  const refresh = () => qc.invalidateQueries({ queryKey: ["files", ROOT] });

  // Open the first doc when none is chosen.
  useEffect(() => { if (!doc && list.data?.length) void setDoc([...list.data].sort((a, b) => a.path.localeCompare(b.path))[0].path); }, [doc, list.data, setDoc]);

  if (!board || list.isLoading) return <div className="grid flex-1 place-items-center"><BrandLoader /></div>;
  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      <aside className="flex w-64 shrink-0 flex-col border-r bg-card/50" aria-label="Docs">
        <div className="flex items-center gap-2 px-3 pt-3.5 pb-2">
          <P.BookOpenText size={18} weight="duotone" className="text-primary" />
          <h1 className="text-base font-semibold">Docs</h1>
          <Button size="icon-sm" variant="ghost" className="ml-auto" aria-label="New doc" title="New doc" onClick={() => setCreating(true)}><Plus /></Button>
        </div>
        <label className="field-frame mx-3 mb-2 flex items-center gap-2 rounded-lg border bg-background px-2.5">
          <Search className="size-3.5 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a doc" aria-label="Find a doc" className="field-bare h-8 min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </label>
        {creating && <NewDoc existing={list.data?.map((f) => f.path) ?? []} folders={[...new Set((list.data ?? []).map((f) => folderOf(f.path)).filter(Boolean))]}
          onDone={(path) => { setCreating(false); if (path) { void refresh(); void setDoc(path); } }} />}
        <nav className="scroll-quiet min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {folders.map(([folder, fs]) => <Folder key={folder || "/"} folder={folder} files={fs} current={doc} onOpen={(p) => void setDoc(p)} />)}
          {!files.length && <p className="px-2 py-6 text-center text-xs text-muted-foreground">{q ? "No doc matches." : "No docs yet. Create the first one."}</p>}
        </nav>
        <p className="border-t px-3 py-2 text-[11px] leading-snug text-muted-foreground">Saved as Markdown in <code className="text-[10px]">{ROOT}/</code> of the repository. Every save is a commit.</p>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto">
        {doc && list.data?.some((f) => f.path === doc)
          ? <Doc key={doc} path={doc} onRenamed={(p) => { void refresh(); void setDoc(p); }} onDeleted={() => { void refresh(); void setDoc(null); }} onOpenDoc={(p) => void setDoc(p)} />
          : <Empty onNew={() => setCreating(true)} />}
      </main>
    </div>
  );
}

function Folder({ folder, files, current, onOpen }: { folder: string; files: { path: string }[]; current: string | null; onOpen: (p: string) => void }) {
  const [open, setOpen] = useState(true);
  const items = files.map((f) => (
    <button key={f.path} onClick={() => onOpen(f.path)} aria-current={current === f.path ? "page" : undefined}
      className={cn("nav-item flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[13.5px]", folder && "pl-6", current === f.path ? "nav-item-active font-medium" : "text-foreground/85")}>
      <P.FileText size={15} weight="duotone" className="shrink-0 text-primary/80" /><span className="truncate">{name(f.path)}</span>
    </button>
  ));
  if (!folder) return <div className="space-y-0.5">{items}</div>;
  return (
    <div className="mt-2">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex h-7 w-full items-center gap-1.5 rounded-md px-1.5 text-left text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} /><P.Folder size={14} weight="duotone" />{folder}
      </button>
      {open && <div className="space-y-0.5">{items}</div>}
    </div>
  );
}

function Empty({ onNew }: { onNew: () => void }) {
  return (
    <div className="grid h-full place-items-center p-8 text-center">
      <div className="max-w-sm">
        <span className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-accent text-primary"><P.BookOpenText size={30} weight="duotone" /></span>
        <p className="text-lg font-semibold">Write it down once</p>
        <p className="mt-1 text-sm text-muted-foreground">Specs, how-tos, meeting notes and decisions. Docs live next to your tickets, and mentioning #123 links straight to a ticket.</p>
        <Button className="mt-4" onClick={onNew}><Plus />New doc</Button>
      </div>
    </div>
  );
}

function NewDoc({ existing, folders, onDone }: { existing: string[]; folders: string[]; onDone: (path: string | null) => void }) {
  const source = useSource();
  const [title, setTitle] = useState("");
  const [folder, setFolder] = useState("");
  const [busy, setBusy] = useState(false);
  const clean = title.trim().replace(/[\\/:*?"<>|]/g, "-");
  const path = `${ROOT}/${folder ? `${folder.replace(/^\/+|\/+$/g, "")}/` : ""}${clean}.md`;
  const create = async () => {
    if (!clean) return;
    if (existing.includes(path)) { toast.error("A doc with that name is already in this folder."); return; }
    setBusy(true);
    try { await source!.writeFile(path, `# ${title.trim()}\n\n`, null, `docs: add ${clean}`); toast.success(`Created "${clean}"`); onDone(path); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't create the doc."); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); void create(); }} className="mx-3 mb-2 space-y-2 rounded-xl border bg-background p-2.5 shadow-card">
      <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Doc title" aria-label="Doc title"
        onKeyDown={(e) => { if (e.key === "Escape") onDone(null); }} className="h-8 w-full rounded-md border bg-card px-2 text-sm outline-none focus:border-ring" />
      <input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="Folder (optional)" aria-label="Folder" list="doc-folders"
        className="h-8 w-full rounded-md border bg-card px-2 text-sm outline-none focus:border-ring" />
      <datalist id="doc-folders">{folders.map((f) => <option key={f} value={f} />)}</datalist>
      <div className="flex justify-end gap-1">
        <Button type="button" size="xs" variant="ghost" onClick={() => onDone(null)}>Cancel</Button>
        <Button type="submit" size="xs" disabled={!clean || busy}>{busy ? "Creating…" : "Create"}</Button>
      </div>
    </form>
  );
}

// A link to another doc, relative to this one: "../Team handbook.md".
function resolveDoc(from: string, href: string) {
  const parts = from.split("/").slice(0, -1);
  for (const seg of decodeURIComponent(href).split("/")) { if (seg === "..") parts.pop(); else if (seg && seg !== ".") parts.push(seg); }
  return parts.join("/");
}

// #123 → a link that opens the ticket (only where it reads as a ticket number).
const linkTickets = (md: string) => md.replace(/(^|[\s(])#(\d+)\b/g, (_, pre, n) => `${pre}[#${n}](#ticket-${n})`);

function Doc({ path, onRenamed, onDeleted, onOpenDoc }: { path: string; onRenamed: (p: string) => void; onDeleted: () => void; onOpenDoc: (p: string) => void }) {
  const source = useSource();
  const qc = useQueryClient();
  const [, openTicket] = useOpenTicket();
  const { data: board } = useBoard();
  const file = useQuery({ queryKey: ["file", path], enabled: !!source, queryFn: () => source!.readFile(path), refetchInterval: false });
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [sha, setSha] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const dirty = editing && file.data && text !== file.data.text;
  const t = currentTenant();

  const startEdit = () => { if (!file.data) return; setText(file.data.text); setSha(file.data.sha); setEditing(true); };
  const save = async () => {
    if (!dirty) { setEditing(false); return; }
    setSaving(true);
    try {
      const next = await source!.writeFile(path, text, sha, `docs: update ${name(path)}`);
      qc.setQueryData(["file", path], { text, sha: next });
      setSha(next); setEditing(false);
      toast.success("Saved", { description: "Committed to the repository." });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't save.", { duration: 10000 }); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!file.data) return;
    try { await source!.deleteFile(path, file.data.sha, `docs: delete ${name(path)}`); toast.success(`Deleted "${name(path)}"`); onDeleted(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't delete."); }
  };
  const rename = async (to: string) => {
    if (!file.data) return;
    const clean = to.trim().replace(/[\\/:*?"<>|]/g, "-");
    const target = `${path.slice(0, path.lastIndexOf("/") + 1)}${clean}.md`;
    if (!clean || target === path) { setRenaming(false); return; }
    try {
      await source!.writeFile(target, file.data.text, null, `docs: rename ${name(path)} to ${clean}`);
      await source!.deleteFile(path, file.data.sha, `docs: rename ${name(path)} to ${clean}`);
      toast.success(`Renamed to "${clean}"`); onRenamed(target);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't rename."); }
    finally { setRenaming(false); }
  };
  const wrap = (before: string, after = before) => {
    const el = ref.current; if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    setText(text.slice(0, a) + before + text.slice(a, b) + after + text.slice(b));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + before.length, b + before.length); });
  };

  // Ctrl/Cmd+S saves; leaving with unsaved changes asks first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s" && editing) { e.preventDefault(); void save(); } };
    const onLeave = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("beforeunload", onLeave); };
  });

  const md = (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      a: ({ href, children }) => href?.startsWith("#mention-") ? <span className="mention">{children}</span> : href?.startsWith("#ticket-")
        ? <button className="ticket-ref" onClick={() => void openTicket(Number(href.slice(8)))}>{children}</button>
        : href && /.md$/i.test(href) && !/^[a-z]+:/i.test(href)
          ? <button className="doc-link" onClick={() => onOpenDoc(resolveDoc(path, href))}>{children}</button>
          : <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{children}</a>,
    }}>{markMentions(linkTickets(editing ? text : file.data?.text ?? ""), board?.people.map((x) => x.login) ?? [])}</ReactMarkdown>
  );

  return (
    <div className="mx-auto flex min-h-full max-w-4xl flex-col px-6 py-5 md:px-10">
      <header className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="truncate">{ROOT}{folderOf(path) ? ` / ${folderOf(path)}` : ""}</span>
        {renaming ? (
          <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); void rename(new FormData(e.currentTarget).get("n") as string); }}>
            <span>/</span><input autoFocus name="n" defaultValue={name(path)} aria-label="New name" className="h-7 rounded-md border bg-background px-2 text-sm text-foreground outline-none focus:border-ring" onKeyDown={(e) => { if (e.key === "Escape") setRenaming(false); }} />
            <Button size="xs" type="submit">Rename</Button>
          </form>
        ) : <span className="truncate font-medium text-foreground">/ {name(path)}</span>}
        {dirty && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">Unsaved</span>}
        <span className="ml-auto flex items-center gap-1">
          {editing ? (<>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>{dirty ? "Discard" : "Done"}</Button>
            <Button size="sm" disabled={!dirty || saving} onClick={() => void save()}>{saving ? "Saving…" : "Save"}<kbd className="ml-1 text-[10px] opacity-70">Ctrl S</kbd></Button>
          </>) : <Button size="sm" variant="outline" onClick={startEdit} disabled={!file.data}><Pencil />Edit</Button>}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button size="icon-sm" variant="ghost" aria-label="Doc actions" />}><MoreHorizontal /></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              <DropdownMenuItem onClick={() => setRenaming(true)}><Pencil />Rename</DropdownMenuItem>
              {t && <DropdownMenuItem render={<a href={`https://github.com/${t.owner}/${t.repo}/blob/HEAD/${path}`} target="_blank" rel="noreferrer" />}><ExternalLink />Open on GitHub</DropdownMenuItem>}
              {t && <DropdownMenuItem render={<a href={`https://github.com/${t.owner}/${t.repo}/commits/HEAD/${path}`} target="_blank" rel="noreferrer" />}><P.ClockCounterClockwise />History</DropdownMenuItem>}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}><Trash2 />Delete doc</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      </header>

      {confirmDelete && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <span className="flex-1">Delete &ldquo;{name(path)}&rdquo;? It stays in the repository&apos;s history.</span>
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Keep</Button>
          <Button size="sm" variant="destructive" onClick={() => void remove()}>Delete</Button>
        </div>
      )}

      {file.isLoading ? <BrandLoader /> : file.error ? <p className="text-sm text-destructive">{(file.error as Error).message}</p> : editing ? (
        <div className="grid min-h-[60vh] flex-1 gap-4 lg:grid-cols-2">
          <div className="field-frame flex flex-col overflow-hidden rounded-xl border bg-card">
            <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-2 py-1" role="toolbar" aria-label="Formatting">
              {([["Bold", "**", "**", <b key="b">B</b>], ["Italic", "_", "_", <i key="i">I</i>], ["Heading", "\n## ", "", "H"], ["Bullet list", "\n- ", "", "•"], ["Checklist", "\n- [ ] ", "", "☑"],
                ["Link", "[", "](https://)", "🔗"], ["Code", "`", "`", "</>"], ["Table", "\n| Column | Column |\n| --- | --- |\n| | |\n", "", "▦"]] as const).map(([label, a, b, icon]) => (
                <Button key={label} type="button" size="xs" variant="ghost" aria-label={label} title={label} onClick={() => wrap(a, b)}>{icon}</Button>
              ))}
              <span className="ml-auto pr-1 text-[11px] text-muted-foreground">Markdown · #123 links a ticket</span>
            </div>
            <MentionTextarea wrapperClassName="flex min-h-0 flex-1 flex-col" ref={ref} value={text} onValueChange={setText} aria-label="Doc text" spellCheck
              className="field-bare min-h-0 flex-1 resize-none bg-transparent p-4 font-mono text-[13.5px] leading-relaxed outline-none" />
          </div>
          <div className="prose-ticket doc-prose hidden overflow-y-auto rounded-xl border border-dashed p-5 lg:block">{md}</div>
        </div>
      ) : (
        <article className="prose-ticket doc-prose cursor-text" onDoubleClick={startEdit}>{md}</article>
      )}
    </div>
  );
}


