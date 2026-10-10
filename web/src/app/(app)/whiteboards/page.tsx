"use client";

import { BrandLoader } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useSource } from "@/lib/data";
import { currentTenant } from "@/lib/tenant";
import { ExternalLink, Plus, Trash2 } from "@/components/icons";
import * as P from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";

// Whiteboards (ClickUp Whiteboards, on the repository): Excalidraw scenes
// saved as .excalidraw files under whiteboards/. Every save is a commit, and
// the files open in excalidraw.com or the VS Code extension too.

const ROOT = "whiteboards";
const EXT = ".excalidraw";
const name = (path: string) => path.split("/").pop()!.replace(EXT, "");
const Canvas = dynamic(() => import("./canvas").then((m) => m.Canvas), { ssr: false, loading: () => <div className="grid flex-1 place-items-center"><BrandLoader label="Opening the canvas…" /></div> });

export default function WhiteboardsPage() {
  const source = useSource();
  const qc = useQueryClient();
  const [board, setBoard] = useQueryState("wb", parseAsString.withOptions({ history: "push" }));
  const list = useQuery({ queryKey: ["files", ROOT], enabled: !!source, queryFn: () => source!.listFiles(ROOT, EXT) });
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["files", ROOT] });

  const create = async () => {
    const clean = title.trim().replace(/[\\/:*?"<>|]/g, "-");
    if (!clean) return;
    const path = `${ROOT}/${clean}${EXT}`;
    if (list.data?.some((f) => f.path === path)) { toast.error("A whiteboard with that name already exists."); return; }
    try {
      await source!.writeFile(path, JSON.stringify({ type: "excalidraw", version: 2, source: "beyondpm", elements: [], appState: { viewBackgroundColor: "#ffffff" }, files: {} }, null, 2), null, `whiteboards: add ${clean}`);
      setTitle(""); setCreating(false); await refresh(); void setBoard(path);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't create the whiteboard."); }
  };

  if (board) return <Canvas key={board} path={board} title={name(board)} onBack={() => { void refresh(); void setBoard(null); }} />;
  if (list.isLoading) return <div className="grid flex-1 place-items-center"><BrandLoader /></div>;
  const files = [...(list.data ?? [])].sort((a, b) => a.path.localeCompare(b.path));
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-3 pb-8 md:px-6 md:pt-4">
      <header className="flex min-h-9 flex-wrap items-center gap-3">
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 className="shrink-0 text-xl leading-tight font-semibold">Whiteboards</h1>
          <p className="hidden truncate text-sm text-muted-foreground lg:block">Sketch flows, plans and ideas together. Saved as Excalidraw files in the repository.</p>
        </div>
        <Button size="sm" className="ml-auto" onClick={() => setCreating(true)}><Plus />New whiteboard</Button>
      </header>

      {creating && (
        <form onSubmit={(e) => { e.preventDefault(); void create(); }} className="field-frame flex max-w-lg items-center gap-2 rounded-xl border bg-card p-2 shadow-card">
          <P.Scribble size={18} weight="duotone" className="ml-1 text-primary" />
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Whiteboard name, e.g. Checkout flow" aria-label="Whiteboard name"
            onKeyDown={(e) => { if (e.key === "Escape") setCreating(false); }} className="field-bare h-8 min-w-0 flex-1 bg-transparent text-sm outline-none" />
          <Button type="button" size="sm" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
          <Button type="submit" size="sm" disabled={!title.trim()}>Create</Button>
        </form>
      )}

      {files.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((f) => <Card key={f.path} path={f.path} onOpen={() => void setBoard(f.path)} onDeleted={() => void refresh()} />)}
        </div>
      ) : !creating && (
        <div className="grid place-items-center gap-3 rounded-2xl border bg-card px-6 py-14 text-center shadow-card">
          <span className="grid size-14 place-items-center rounded-2xl bg-accent text-primary"><P.Scribble size={30} weight="duotone" /></span>
          <p className="text-lg font-semibold">Start a whiteboard</p>
          <p className="max-w-md text-sm text-muted-foreground">Map a flow, plan a sprint or brainstorm with sticky notes, shapes, arrows and freehand drawing.</p>
          <Button onClick={() => setCreating(true)}><Plus />New whiteboard</Button>
        </div>
      )}
    </div>
  );
}

function Card({ path, onOpen, onDeleted }: { path: string; onOpen: () => void; onDeleted: () => void }) {
  const source = useSource();
  const [confirm, setConfirm] = useState(false);
  const t = currentTenant();
  const remove = async () => {
    try {
      const f = await source!.readFile(path);
      await source!.deleteFile(path, f.sha, `whiteboards: delete ${name(path)}`);
      toast.success(`Deleted "${name(path)}"`); onDeleted();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't delete."); }
  };
  return (
    <div className="group/wb lift relative overflow-hidden rounded-2xl border bg-card shadow-card">
      <button onClick={onOpen} className="block w-full text-left" aria-label={`Open ${name(path)}`}>
        <div className="wb-thumb grid h-32 place-items-center"><P.Scribble size={40} weight="duotone" className="text-primary/70" /></div>
        <div className="flex items-center gap-2 border-t px-3 py-2.5">
          <P.Scribble size={16} weight="duotone" className="shrink-0 text-primary" />
          <span className="truncate text-sm font-medium">{name(path)}</span>
        </div>
      </button>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover/wb:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
        {t && <Button size="icon-xs" variant="secondary" aria-label="Open on GitHub" nativeButton={false} render={<a href={`https://github.com/${t.owner}/${t.repo}/blob/HEAD/${path}`} target="_blank" rel="noreferrer" />}><ExternalLink /></Button>}
        {confirm
          ? <><Button size="xs" variant="destructive" onClick={() => void remove()}>Delete</Button><Button size="xs" variant="secondary" onClick={() => setConfirm(false)}>Keep</Button></>
          : <Button size="icon-xs" variant="secondary" aria-label={`Delete ${name(path)}`} onClick={() => setConfirm(true)}><Trash2 /></Button>}
      </div>
    </div>
  );
}


