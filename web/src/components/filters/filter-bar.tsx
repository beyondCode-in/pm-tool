"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dotClass, options } from "@/lib/board";
import type { Board } from "@/lib/types";
import { useFilters } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { ChevronDown, Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "../ticket/bits";

function Multi({ label, values, selected, onChange }: {
  label: string; values: { value: string; label: ReactNode }[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant={selected.length ? "secondary" : "outline"} size="sm" className="h-8 gap-1" />}>
        {label}{selected.length > 0 && <span className="rounded bg-primary px-1 text-[10px] font-bold text-primary-foreground">{selected.length}</span>}
        <ChevronDown className="size-3.5 opacity-60" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-80 min-w-52 overflow-y-auto">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {values.map((v) => (
          <DropdownMenuCheckboxItem key={v.value} closeOnClick={false} checked={selected.includes(v.value)}
            onCheckedChange={(c: boolean) => onChange(c ? [...selected, v.value] : selected.filter((s) => s !== v.value))}>
            {v.label}
          </DropdownMenuCheckboxItem>
        ))}
        {selected.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuCheckboxItem checked={false} onCheckedChange={() => onChange([])}>Clear</DropdownMenuCheckboxItem></>)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FilterBar({ board, children, hideDoneToggle }: { board: Board; children?: ReactNode; hideDoneToggle?: boolean }) {
  const { filters, update, clear, active } = useFilters();
  const opt = (field: string) => options(board, field).map((o) => ({
    value: o.name, label: <span className="inline-flex items-center gap-2"><span className={cn("size-2 rounded-full", dotClass(o.color))} />{o.name}</span>,
  }));
  return (
    <div className="flex flex-wrap items-center gap-2" role="search">
      <label className="relative">
        <span className="sr-only">Search tickets</span>
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input value={filters.q} onChange={(e) => update({ q: e.target.value })} placeholder="Search…  (/)" data-search
          className="h-8 w-44 rounded-lg border bg-background pr-2 pl-8 text-sm outline-none focus:w-60 focus:border-ring transition-[width] sm:w-52" />
      </label>
      <Multi label="Type" values={opt("Ticket Type")} selected={filters.type} onChange={(type) => update({ type })} />
      <Multi label="Priority" values={opt("Priority")} selected={filters.priority} onChange={(priority) => update({ priority })} />
      <Multi label="People" selected={filters.assignee} onChange={(assignee) => update({ assignee })}
        values={[{ value: "__none", label: <span className="text-muted-foreground">Unassigned</span> },
          ...board.people.map((p) => ({ value: p.login, label: <span className="inline-flex items-center gap-2"><Avatar person={p} size={18} />{p.name || p.login}</span> }))]} />
      <Multi label="Tags" selected={filters.label} onChange={(label) => update({ label })}
        values={board.labels.map((l) => ({ value: l.name, label: <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: `#${l.color}` }} />{l.name}</span> }))} />
      {!hideDoneToggle && (
        <Button variant={filters.showDone ? "outline" : "secondary"} size="sm" className="h-8" aria-pressed={!filters.showDone}
          onClick={() => update({ showDone: !filters.showDone })}>
          {filters.showDone ? "Hide done" : "Showing open only"}
        </Button>
      )}
      {active && <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={clear}><X className="size-3.5" />Clear</Button>}
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  );
}
