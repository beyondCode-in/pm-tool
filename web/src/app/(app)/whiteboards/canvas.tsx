"use client";

import "@excalidraw/excalidraw/index.css";
import { Excalidraw, serializeAsJSON } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { BrandLoader } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useSource } from "@/lib/data";
import { ArrowLeft } from "@/components/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// The drawing surface. Loaded only on the Whiteboards page (Excalidraw is big).
// Saving writes the scene back to its file as a commit; a newer save by
// someone else is reported instead of overwritten.

export function Canvas({ path, title, onBack }: { path: string; title: string; onBack: () => void }) {
  const source = useSource();
  const qc = useQueryClient();
  const { resolvedTheme } = useTheme();
  const file = useQuery({ queryKey: ["file", path], enabled: !!source, queryFn: () => source!.readFile(path), refetchInterval: false });
  const api = useRef<ExcalidrawImperativeAPI | null>(null);
  const sha = useRef<string | null>(null);
  const saved = useRef<string>("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const scene = () => {
    const a = api.current;
    return a ? serializeAsJSON(a.getSceneElements(), a.getAppState(), a.getFiles(), "local") : "";
  };
  const save = async () => {
    const json = scene();
    if (!json || json === saved.current) return;
    setSaving(true);
    try {
      const next = await source!.writeFile(path, json, sha.current, `whiteboards: update ${title}`);
      sha.current = next; saved.current = json; setDirty(false);
      qc.setQueryData(["file", path], { text: json, sha: next });
      toast.success("Whiteboard saved", { description: "Committed to the repository." });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't save.", { duration: 10000 }); }
    finally { setSaving(false); }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); void save(); } };
    const onLeave = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("beforeunload", onLeave); };
  });

  if (file.isLoading) return <div className="grid flex-1 place-items-center"><BrandLoader label="Opening the whiteboard…" /></div>;
  if (file.error) return <div className="p-6 text-sm text-destructive">{(file.error as Error).message} <Button size="sm" variant="ghost" onClick={onBack}>Back</Button></div>;

  let initial: { elements?: unknown[]; appState?: Record<string, unknown>; files?: Record<string, unknown> } = {};
  try { initial = JSON.parse(file.data!.text); } catch { /* an empty or broken file opens blank */ }
  if (sha.current === null) { sha.current = file.data!.sha; }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-2 border-b px-3 py-2">
        <Button size="sm" variant="ghost" onClick={() => { if (!dirty || confirm("Leave without saving your changes?")) onBack(); }}><ArrowLeft />Whiteboards</Button>
        <h1 className="truncate text-base font-semibold">{title}</h1>
        {dirty && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">Unsaved</span>}
        <Button size="sm" className="ml-auto" disabled={!dirty || saving} onClick={() => void save()}>{saving ? "Saving…" : "Save"}<kbd className="ml-1 text-[10px] opacity-70">Ctrl S</kbd></Button>
      </header>
      <div className="relative min-h-0 flex-1" data-testid="whiteboard">
        <Excalidraw
          // Excalidraw can call this more than once; take the "saved" snapshot only the first time.
          excalidrawAPI={(a) => { if (api.current) return; api.current = a; requestAnimationFrame(() => { saved.current = scene(); }); }}
          initialData={{ elements: (initial.elements ?? []) as never, appState: { ...(initial.appState ?? {}), collaborators: undefined } as never, files: (initial.files ?? {}) as never, scrollToContent: true }}
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          name={title}
          onChange={() => { if (saved.current) setDirty(scene() !== saved.current); }}
          UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false, export: { saveFileToDisk: true } } }}
        />
      </div>
    </div>
  );
}
