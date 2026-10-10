"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { deleteView, filterQuery, saveView, useSavedViews } from "@/lib/saved-views";
import type { Board } from "@/lib/types";
import { ChevronDown, Plus, Trash2 } from "@/components/icons";
import { BookmarkSimple } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { NAV } from "../shell/nav";

const viewLabel = (path: string) => NAV.find((n) => path.startsWith(n.href.slice(0, -1)))?.label ?? "View";

// "Views ▾": jump to a saved view, or save the current view + filters by name.
export function SavedViewsMenu({ board }: { board: Board }) {
  const views = useSavedViews(board.projectId);
  const path = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const query = filterQuery(params.toString());
  const current = views.find((v) => path.startsWith(v.path.slice(0, -1)) && v.query === query);

  const save = () => {
    const n = name.trim();
    if (!n) return;
    const v = saveView(board.projectId, { name: n, path, query });
    toast.success(`Saved view "${v.name}"`, { description: "Find it under Views and in the sidebar's Favorites." });
    setName(""); setSaving(false);
  };

  return (
    <div className="relative flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant={current ? "secondary" : "outline"} size="sm" className="h-8 gap-1.5" />}>
          <BookmarkSimple weight={current ? "fill" : "regular"} className="ico size-3.5" />
          <span className="max-w-32 truncate">{current?.name ?? "Views"}</span>
          {views.length > 0 && !current && <span className="rounded bg-muted px-1 text-[10px] font-semibold text-muted-foreground">{views.length}</span>}
          <ChevronDown className="size-3.5 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-64">
          <DropdownMenuLabel>Saved views</DropdownMenuLabel>
          {views.map((v) => (
            <DropdownMenuItem key={v.id} onClick={() => router.push(`${v.path}${v.query ? `?${v.query}` : ""}`)} className="group/sv">
              <BookmarkSimple weight={v.id === current?.id ? "fill" : "duotone"} className="ico size-4 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{v.name}</span>
                <span className="block text-[11px] text-muted-foreground">{viewLabel(v.path)}{v.query ? " · filtered" : ""}</span>
              </span>
              <button aria-label={`Delete view ${v.name}`} title="Delete view"
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); deleteView(board.projectId, v.id); toast(`Deleted view "${v.name}"`); }}
                className="grid size-6 place-items-center rounded text-muted-foreground opacity-0 group-hover/sv:opacity-100 group-data-[highlighted]/sv:opacity-100 hover:text-destructive">
                <Trash2 className="size-3.5" />
              </button>
            </DropdownMenuItem>
          ))}
          {!views.length && <p className="px-2 py-3 text-xs text-muted-foreground">No saved views yet. Set some filters, then save them here.</p>}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSaving(true)}><Plus />Save current view…</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Popover open={saving} onOpenChange={setSaving}>
        <PopoverTrigger nativeButton={false} render={<span aria-hidden tabIndex={-1} className="pointer-events-none absolute inset-y-0 right-0 w-0 outline-none" />} />
        <PopoverContent align="end" className="w-72 p-3">
          <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-2">
            <p className="text-sm font-semibold">Save this view</p>
            <p className="text-xs text-muted-foreground">{viewLabel(path)}{query ? " with the current filters" : " (no filters)"}. Saving with an existing name updates it.</p>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. My critical bugs" aria-label="View name"
              className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring" />
            <div className="flex justify-end gap-1">
              <Button type="button" size="sm" variant="ghost" onClick={() => setSaving(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={!name.trim()}>Save view</Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
}
