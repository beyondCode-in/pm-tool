"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { iterationField, options, plain, sprintEnd } from "@/lib/board";
import type { Board, Person } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDays, format, parseISO } from "date-fns";
import { CalendarDays, ChevronDown } from "@/components/icons";
import { useState, type ReactNode } from "react";
import { Avatar, shortDate, Tag } from "./bits";
import { TypeGlyph } from "./type-badge";

const NONE = "__none";

function Trigger({ children, empty, className }: { children: ReactNode; empty?: boolean; className?: string }) {
  return (
    <span className={cn("flex w-full items-center gap-2 text-left", empty && "text-muted-foreground", className)}>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <ChevronDown className="size-3.5 opacity-50" aria-hidden />
    </span>
  );
}

const triggerButton = <Button variant="ghost" size="sm" className="h-8 w-full justify-start px-2 font-normal" />;

export function OptionPicker({ board, field, value, onChange, label }: {
  board: Board; field: string; value?: string; onChange: (v: string | null) => void; label: string;
}) {
  const opts = options(board, field);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={triggerButton} aria-label={`${label}: ${value ?? "not set"}`}>
        <Trigger empty={!value}>
          {value ? <Tag color={opts.find((o) => o.name === value)?.color} dot={field !== "Ticket Type"}>{field === "Ticket Type" && <TypeGlyph kind={plain(value).toLowerCase()} size={14} />}{plain(value)}</Tag> : "Not set"}
        </Trigger>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value ?? NONE} onValueChange={(v: string) => onChange(v === NONE ? null : v)}>
          {opts.map((o) => (
            <DropdownMenuRadioItem key={o.id} value={o.name}>
              <Tag color={o.color} dot={field !== "Ticket Type"}>{field === "Ticket Type" && <TypeGlyph kind={plain(o.name).toLowerCase()} size={14} />}{plain(o.name)}</Tag>
              {o.description && <span className="ml-auto max-w-40 truncate pl-3 text-xs text-muted-foreground">{o.description}</span>}
            </DropdownMenuRadioItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuRadioItem value={NONE}><span className="text-muted-foreground">Clear</span></DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PeoplePicker({ people, value, onChange }: { people: Person[]; value: Person[]; onChange: (logins: string[]) => void }) {
  const selected = value.map((p) => p.login);
  const toggle = (login: string) => onChange(selected.includes(login) ? selected.filter((l) => l !== login) : [...selected, login]);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={triggerButton} aria-label={`Assignees: ${value.map((p) => p.login).join(", ") || "nobody"}`}>
        <Trigger empty={!value.length}>
          {value.length ? (
            <span className="inline-flex items-center gap-2">
              <span className="flex -space-x-1">{value.slice(0, 3).map((p) => <Avatar key={p.login} person={p} size={18} />)}</span>
              {value.length === 1 ? value[0].name || value[0].login : `${value.length} people`}
            </span>
          ) : "Nobody yet"}
        </Trigger>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-80 min-w-60 overflow-y-auto">
        <DropdownMenuLabel>Assign to</DropdownMenuLabel>
        {people.map((p) => (
          <DropdownMenuCheckboxItem key={p.login} checked={selected.includes(p.login)} onCheckedChange={() => toggle(p.login)} closeOnClick={false}>
            <Avatar person={p} size={20} />
            <span className="flex-1 truncate">{p.name || p.login}</span>
            {p.name && <span className="text-xs text-muted-foreground">@{p.login}</span>}
          </DropdownMenuCheckboxItem>
        ))}
        {selected.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => onChange([])}>Unassign everyone</DropdownMenuItem></>)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SprintPicker({ board, value, onChange }: { board: Board; value?: string; onChange: (id: string | null) => void }) {
  const its = iterationField(board)?.iterations ?? [];
  const current = its.find((i) => i.id === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={triggerButton} aria-label={`Sprint: ${current?.title ?? "none"}`}>
        <Trigger empty={!current}>{current ? `${current.title} · ${shortDate(current.startDate)}–${shortDate(sprintEnd(current))}` : "No sprint"}</Trigger>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-64">
        <DropdownMenuLabel>Sprint</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value ?? NONE} onValueChange={(v: string) => onChange(v === NONE ? null : v)}>
          {its.map((i) => (
            <DropdownMenuRadioItem key={i.id} value={i.id}>
              <span className="flex-1">{i.title}</span>
              <span className="text-xs text-muted-foreground">{shortDate(i.startDate)}–{shortDate(sprintEnd(i))}</span>
            </DropdownMenuRadioItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuRadioItem value={NONE}><span className="text-muted-foreground">No sprint</span></DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Calendar popover with quick picks; replaces the browser's date input, which
// looks different in every browser and is fiddly on phones.
export function DateInput({ value, onChange, label, warnPast }: { value?: string; onChange: (v: string | null) => void; label: string; warnPast?: boolean }) {
  const [open, setOpen] = useState(false);
  const pick = (d: string | null) => { onChange(d); setOpen(false); };
  const today = format(new Date(), "yyyy-MM-dd");
  const quick: [string, string][] = [["Today", today], ["Tomorrow", format(addDays(new Date(), 1), "yyyy-MM-dd")],
    ["Next week", format(addDays(new Date(), 7), "yyyy-MM-dd")], ["In 2 weeks", format(addDays(new Date(), 14), "yyyy-MM-dd")]];
  const overdue = warnPast && value && value < today;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={triggerButton} aria-label={`${label}: ${value ?? "not set"}`}>
        <Trigger empty={!value}>
          <span className={cn("inline-flex items-center gap-2", overdue && "font-medium text-destructive")}>
            <CalendarDays className="size-3.5 opacity-70" aria-hidden />
            {value ? format(parseISO(value), "EEE d MMM yyyy") : "Pick a date"}
          </span>
        </Trigger>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex flex-wrap gap-1 border-b p-2">
          {quick.map(([l, d]) => <Button key={l} size="xs" variant={value === d ? "secondary" : "ghost"} onClick={() => pick(d)}>{l}</Button>)}
        </div>
        <Calendar mode="single" weekStartsOn={1} selected={value ? parseISO(value) : undefined}
          defaultMonth={value ? parseISO(value) : undefined} onSelect={(d) => pick(d ? format(d, "yyyy-MM-dd") : null)} />
        {value && <div className="border-t p-2"><Button size="xs" variant="ghost" className="w-full text-muted-foreground" onClick={() => pick(null)}>Clear date</Button></div>}
      </PopoverContent>
    </Popover>
  );
}

export function NumberInput({ value, onChange, label }: { value?: number; onChange: (v: number | null) => void; label: string }) {
  return (
    <input type="number" min={0} step={1} aria-label={label} defaultValue={value ?? ""} placeholder="–"
      onBlur={(e) => { const v = e.target.value === "" ? null : Number(e.target.value); if (v !== (value ?? null)) onChange(v); }}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      className="h-8 w-full rounded-md bg-transparent px-2 text-sm tabular-nums hover:bg-muted focus-visible:bg-muted" />
  );
}
