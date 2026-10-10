"use client";

import { CustomiseMenu, CustomSection, useSectionDrops } from "@/components/layout/custom-section";
import { NAV } from "@/components/shell/nav";
import { BrandLoader } from "@/components/brand/logo";
import { Tag as TagView } from "@/components/ticket/bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ACCENTS, PALETTES, setAccent, setPalette, useAccent, usePalette } from "@/lib/accent";
import { plain } from "@/lib/board";
import { config } from "@/lib/config";
import { useBoard, useSource } from "@/lib/data";
import { useLayout } from "@/lib/layout";
import { useLabelActions } from "@/lib/ticket-extras";
import type { Board, Label } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, LayoutGrid, Monitor, Moon, Palette, Plus, RotateCcw, Search, Sun, Tags, Trash2, Wrench } from "@/components/icons";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";

const SECTIONS: Record<string, string> = { tags: "Tags", sidebar: "Sidebar", fields: "Board fields", appearance: "Appearance", layouts: "Layouts" };
const SWATCHES = ["d73a4a", "e99695", "f9d0c4", "fbca04", "fef2c0", "0e8a16", "c2e0c6", "1d76db", "bfdadc", "5319e7", "d4c5f9", "8b5cf6", "c8613d", "6b4f3f", "0075ca", "cfd3d7"];

export default function SettingsPage() {
  const { data: board } = useBoard();
  const layout = useLayout("settings", Object.keys(SECTIONS));
  useSectionDrops("settings", layout);
  if (!board) return <BrandLoader label="Loading settings…" />;
  const blocks: Record<string, React.ReactNode> = {
    tags: <TagManager board={board} />,
    sidebar: <SidebarEditor />,
    fields: <BoardFields board={board} />,
    appearance: <Appearance />,
    layouts: <Layouts />,
  };
  const icons: Record<string, typeof Tags> = { tags: Tags, sidebar: LayoutGrid, fields: Wrench, appearance: Palette, layouts: RotateCcw };
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
      <header className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-[1.75rem]">Settings</h1>
          <p className="hidden text-sm text-muted-foreground sm:block">Tags, sidebar, appearance and layouts. Board fields are shown for reference.</p>
        </div>
        <span className="ml-auto"><CustomiseMenu layout={layout} labels={SECTIONS} /></span>
      </header>
      <div className="mx-auto w-full max-w-4xl space-y-5 pb-20">
        {layout.visible.map((id) => (
          <CustomSection key={id} id={id} scope="settings" layout={layout} title={SECTIONS[id]} icon={icons[id]} className="spotlight rounded-2xl border bg-card p-4 shadow-card sm:p-5">
            {blocks[id]}
          </CustomSection>
        ))}
      </div>
    </div>
  );
}

// ── Tags: create, rename, recolour, describe, delete ────────────────────

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [hex, setHex] = useState(value);
  return (
    <Popover>
      <PopoverTrigger aria-label={`Colour #${value}`} className="size-6 shrink-0 rounded-md ring-1 ring-border transition-transform hover:scale-110" style={{ background: `#${value}` }} />
      <PopoverContent className="w-56 space-y-2 p-3">
        <div className="grid grid-cols-8 gap-1.5">
          {SWATCHES.map((c) => (
            <button key={c} aria-label={`#${c}`} onClick={() => { setHex(c); onChange(c); }}
              className={cn("size-5 rounded ring-offset-1 ring-offset-popover hover:scale-110", c === value && "ring-2 ring-foreground")} style={{ background: `#${c}` }} />
          ))}
        </div>
        <form className="flex gap-1.5" onSubmit={(e) => { e.preventDefault(); const c = hex.replace("#", ""); if (/^[0-9a-f]{6}$/i.test(c)) onChange(c.toLowerCase()); else toast.error("Use a 6-digit colour like c8613d."); }}>
          <input value={hex} onChange={(e) => setHex(e.target.value)} aria-label="Hex colour" className="h-8 min-w-0 flex-1 rounded-md border bg-background px-2 font-mono text-xs outline-none focus:border-ring" />
          <Button size="sm" type="submit" variant="secondary">Set</Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function TagRow({ label, uses }: { label: Label; uses: number }) {
  const act = useLabelActions();
  const [name, setName] = useState(label.name);
  const [desc, setDesc] = useState(label.description ?? "");
  const [confirm, setConfirm] = useState(false);
  const saveName = () => { const v = name.trim(); if (v && v !== label.name) void act.update(label.name, { name: v }); else setName(label.name); };
  const saveDesc = () => { if (desc !== (label.description ?? "")) void act.update(label.name, { description: desc }); };
  return (
    <li className="group flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5 sm:flex-nowrap">
      <ColorPicker value={label.color} onChange={(c) => void act.update(label.name, { color: c })} />
      <input value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setName(label.name); }}
        aria-label={`Name of tag ${label.name}`} className="h-8 w-44 rounded-md bg-transparent px-2 text-sm font-medium outline-none hover:bg-muted focus:bg-muted" />
      <input value={desc} onChange={(e) => setDesc(e.target.value)} onBlur={saveDesc} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        placeholder="Add a description" aria-label={`Description of tag ${label.name}`} className="h-8 min-w-0 flex-1 basis-40 rounded-md bg-transparent px-2 text-sm text-muted-foreground outline-none hover:bg-muted focus:bg-muted" />
      <span className="w-20 text-right text-xs tabular text-muted-foreground">{uses} ticket{uses === 1 ? "" : "s"}</span>
      <Button size="icon-sm" variant="ghost" aria-label={`Delete tag ${label.name}`} className="text-muted-foreground hover:text-destructive" onClick={() => setConfirm(true)}><Trash2 /></Button>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete the “{label.name}” tag?</DialogTitle>
            <DialogDescription>It will be removed from {uses} ticket{uses === 1 ? "" : "s"} on GitHub. The tickets themselves stay. This can&apos;t be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirm(false)}>Keep it</Button>
            <Button variant="destructive" onClick={() => { setConfirm(false); void act.remove(label.name); }}><Trash2 />Delete tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}

function TagManager({ board }: { board: Board }) {
  const act = useLabelActions();
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState("c8613d");
  const uses = (n: string) => board.tickets.filter((t) => t.labels.some((l) => l.name === n)).length;
  const shown = board.labels.filter((l) => l.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));
  const add = async () => { const v = name.trim(); if (v && (await act.create({ name: v, color }))) setName(""); };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Tags are GitHub labels on <b>{config.owner}/{config.repo}</b>. Changes here apply to every ticket that uses them. Tags starting with <code>priority:</code>, <code>area:</code>, <code>size:</code> or <code>severity:</code> are managed by the forms and automation.</p>
      <div className="flex flex-wrap gap-2">
        <form className="field-frame flex min-w-0 flex-1 items-center gap-2 rounded-xl border bg-background p-1.5 pl-2" onSubmit={(e) => { e.preventDefault(); void add(); }}>
          <ColorPicker value={color} onChange={setColor} />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New tag name" aria-label="New tag name" className="field-bare h-8 min-w-0 flex-1 bg-transparent text-sm outline-none" />
          <Button size="sm" type="submit" disabled={!name.trim()}><Plus />Add tag</Button>
        </form>
        <label className="relative">
          <span className="sr-only">Search tags</span>
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tags" className="h-11 w-44 rounded-xl border bg-background pr-2 pl-8 text-sm outline-none focus:border-ring" />
        </label>
      </div>
      <ul className="divide-y">{shown.map((l) => <TagRow key={l.name} label={l} uses={uses(l.name)} />)}</ul>
      {!shown.length && <p className="py-4 text-center text-sm text-muted-foreground">No tags match.</p>}
    </div>
  );
}

// ── Sidebar: which views show, in what order ─────────────────────────────

function SidebarEditor() {
  const nav = useLayout("sidebar-nav", NAV.map((n) => n.href));
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Choose which views appear in the sidebar and their order. Hidden views are still reachable with Ctrl K.</p>
      <ul className="divide-y rounded-xl border">
        {nav.order.map((href, i) => {
          const n = NAV.find((x) => x.href === href)!;
          const hidden = nav.isHidden(href);
          return (
            <li key={href} className={cn("flex items-center gap-3 px-3 py-2", hidden && "opacity-55")}>
              <n.icon className="size-4 text-muted-foreground" aria-hidden />
              <span className="flex-1 text-sm font-medium">{n.label}<span className="ml-2 text-xs font-normal text-muted-foreground">{n.hint}</span></span>
              <Button size="icon-xs" variant="ghost" aria-label={`Move ${n.label} up`} disabled={i === 0} onClick={() => nav.moveBy(href, -1)}><ArrowUp /></Button>
              <Button size="icon-xs" variant="ghost" aria-label={`Move ${n.label} down`} disabled={i === nav.order.length - 1} onClick={() => nav.moveBy(href, 1)}><ArrowDown /></Button>
              <Button size="xs" variant="outline" onClick={() => nav.toggleHidden(href)} aria-pressed={!hidden}>{hidden ? <><EyeOff />Hidden</> : <><Eye />Shown</>}</Button>
            </li>
          );
        })}
      </ul>
      <Button size="sm" variant="ghost" disabled={!nav.customised} onClick={nav.reset}><RotateCcw />Reset sidebar</Button>
    </div>
  );
}

// ── Board fields: reference only ─────────────────────────────────────────

function BoardFields({ board }: { board: Board }) {
  const source = useSource();
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        These come from the GitHub board and are read live. To add or rename a status, priority or other option, edit the field on GitHub:
        GitHub&apos;s API replaces a field&apos;s whole option list, which would clear that field on every ticket, so the app deliberately doesn&apos;t do it.
      </p>
      {source?.mode === "github" && (
        <Button size="sm" variant="outline" nativeButton={false} render={<a href={`https://github.com/orgs/${config.owner}/projects/${config.projectNumber}/settings`} target="_blank" rel="noreferrer" />}>
          <ExternalLink />Edit fields on GitHub
        </Button>
      )}
      <dl className="grid gap-3 sm:grid-cols-2">
        {board.fields.map((f) => (
          <div key={f.id} className="rounded-xl border p-3">
            <dt className="text-sm font-semibold">{f.name} <span className="text-xs font-normal text-muted-foreground">· {f.kind === "single" ? "pick one" : f.kind}</span></dt>
            <dd className="mt-2 flex flex-wrap gap-1">
              {f.kind === "single" ? f.options.map((o) => <TagView key={o.id} color={o.color} dot>{plain(o.name)}</TagView>)
                : f.kind === "iteration" ? f.iterations.map((i) => <span key={i.id} className="tag">{i.title}</span>)
                : <span className="text-xs text-muted-foreground">Free {f.kind} value</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ── Appearance and layouts ───────────────────────────────────────────────

function Appearance() {
  const { theme, setTheme } = useTheme();
  const accent = useAccent();
  const palette = usePalette();
  const modes: [string, string, typeof Sun][] = [["light", "Light", Sun], ["dark", "Dark", Moon], ["system", "Match device", Monitor]];
  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2 sm:max-w-md">
        {modes.map(([v, l, Icon]) => (
          <button key={v} role="radio" aria-checked={theme === v} onClick={() => setTheme(v)}
            className="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm transition-colors hover:bg-muted aria-checked:border-primary aria-checked:bg-accent">
            <Icon className="size-5" />{l}
          </button>
        ))}
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Palette</p>
        <div role="radiogroup" aria-label="Palette" className="grid gap-2 sm:max-w-md sm:grid-cols-2">
          {PALETTES.map((p) => (
            <button key={p.id} role="radio" aria-checked={palette === p.id} onClick={() => setPalette(p.id)}
              className="spotlight lift flex items-center gap-3 rounded-xl border p-3 text-left aria-checked:border-primary aria-checked:bg-accent">
              <span className="size-9 shrink-0 rounded-lg ring-1 ring-border" style={{ background: p.swatch }} />
              <span><span className="block text-sm font-semibold">{p.label}</span><span className="text-xs text-muted-foreground">{p.hint}</span></span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Accent colour</p>
        <div role="radiogroup" aria-label="Accent colour" className="flex flex-wrap gap-2">
          {ACCENTS.map((a) => (
            <button key={a.id} role="radio" aria-checked={accent === a.id} onClick={() => setAccent(a.id)}
              className="flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm hover:bg-muted aria-checked:border-foreground">
              <span className="size-5 rounded-full" style={{ background: a.swatch }} />{a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Layouts() {
  const reset = () => {
    try { Object.keys(localStorage).filter((k) => k.startsWith("beyondpm.layout.") || k === "beyondpm.sidebar-collapsed").forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
    toast.success("All layouts reset");
    setTimeout(() => window.location.reload(), 600);
  };
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Every area you&apos;ve arranged (ticket sections, dashboard widgets, board and table columns, sidebar) is saved in this browser. Reset puts them all back to normal.</p>
      <Button variant="outline" onClick={reset}><RotateCcw />Reset all layouts</Button>
    </div>
  );
}
