"use client";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Label, Ticket } from "@/lib/types";
import { Check, Plus } from "@/components/icons";
import { useState, type ReactElement } from "react";
import { cleanTitle, TypeIcon } from "./bits";

// Search any ticket by number or words, e.g. to set a parent or a blocker.
export function TicketSearch({ tickets, exclude = [], onPick, trigger, placeholder = "Search tickets…" }: {
  tickets: Ticket[]; exclude?: number[]; onPick: (t: Ticket) => void; trigger: ReactElement; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const shown = tickets.filter((t) => !exclude.includes(t.number));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent align="start" className="w-96 p-0">
        <Command>
          <CommandInput placeholder={placeholder} autoFocus />
          <CommandList className="max-h-72">
            <CommandEmpty>No matching tickets.</CommandEmpty>
            <CommandGroup>
              {shown.map((t) => (
                <CommandItem key={t.number} value={`#${t.number} ${t.title}`} onSelect={() => { onPick(t); setOpen(false); }}>
                  <TypeIcon ticket={t} />
                  <span className="font-mono text-xs text-muted-foreground">#{t.number}</span>
                  <span className="truncate">{cleanTitle(t.title)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Multi-select tags with search; typing a new name offers to create it.
export function LabelPicker({ all, value, onChange, trigger }: {
  all: Label[]; value: string[]; onChange: (labels: string[]) => void; trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const name = q.trim().toLowerCase();
  const exists = all.some((l) => l.name.toLowerCase() === name) || value.includes(name);
  const toggle = (n: string) => onChange(value.includes(n) ? value.filter((v) => v !== n) : [...value, n]);
  const extra = value.filter((v) => !all.some((l) => l.name === v)).map((n) => ({ name: n, color: "c2e0c6" }));
  return (
    <Popover open={open} onOpenChange={(o: boolean) => { setOpen(o); if (!o) setQ(""); }}>
      <PopoverTrigger render={trigger} />
      <PopoverContent align="start" className="w-80 p-0">
        <Command>
          <CommandInput placeholder="Find or create a tag…" value={q} onValueChange={setQ} />
          <CommandList className="max-h-72">
            <CommandEmpty>{name ? "No tag with that name yet." : "No tags."}</CommandEmpty>
            {name && !exists && (
              <CommandGroup>
                <CommandItem value={`__create ${name}`} onSelect={() => { toggle(name); setQ(""); }}>
                  <Plus className="size-4" />Create tag <b className="truncate">“{name}”</b>
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading="Tags">
              {[...extra, ...all].map((l) => {
                const on = value.includes(l.name);
                return (
                  <CommandItem key={l.name} value={l.name} onSelect={() => toggle(l.name)}>
                    <span className="grid size-4 place-items-center rounded border" aria-hidden>{on && <Check className="size-3" />}</span>
                    <span className="size-2 shrink-0 rounded-full" style={{ background: `#${l.color}` }} aria-hidden />
                    <span className="truncate">{l.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
