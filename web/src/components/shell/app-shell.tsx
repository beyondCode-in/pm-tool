"use client";

import { Button } from "@/components/ui/button";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ACCENTS, setAccent, useAccent } from "@/lib/accent";
import { signOut } from "@/lib/auth";
import { markDone } from "@/lib/onboarding";
import { config } from "@/lib/config";
import { useBoard, useSource } from "@/lib/data";
import { TICKET_TYPES } from "@/lib/ticket-types";
import { useNewTicket, useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { HelpCircle, LogOut, Moon, Plus, RefreshCw, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "../brand/logo";
import { CreateTicketDialog } from "../create/create-ticket";
import { Guide } from "../guide/guide";
import { Avatar, cleanTitle } from "../ticket/bits";
import { TicketDrawer } from "../ticket/ticket-drawer";
import { NAV } from "./nav";

export function AppShell({ children }: { children: ReactNode }) {
  const source = useSource();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [, newTicket] = useNewTicket();

  useEffect(() => { if (source === null) router.replace("/login/"); }, [source, router]);

  // Keyboard: C new · / search · ⌘K palette · ? shortcuts · G then a letter to jump.
  useEffect(() => {
    let g = false;
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.closest("input, textarea, select, [contenteditable=true], [role=dialog]") !== null);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); markDone("palette"); setPaletteOpen((o) => !o); return; }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (g) { g = false; const item = NAV.find((n) => n.key === e.key.toLowerCase()); if (item) { e.preventDefault(); router.push(item.href); } return; }
      if (e.key === "g") { g = true; setTimeout(() => (g = false), 1200); }
      else if (e.key === "c") { e.preventDefault(); void newTicket("pick"); }
      else if (e.key === "/") { e.preventDefault(); (document.querySelector("[data-search]") as HTMLInputElement | null)?.focus(); }
      else if (e.key === "?") setHelpOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, newTicket]);

  if (!source) return null;
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar onSearch={() => { markDone("palette"); setPaletteOpen(true); }} onHelp={() => setHelpOpen(true)} />
      <main className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">{children}</main>
      <MobileNav />
      <TicketDrawer />
      <CreateTicketDialog />
      <Palette open={paletteOpen} setOpen={setPaletteOpen} />
      <Shortcuts open={helpOpen} setOpen={setHelpOpen} />
      <Guide />
    </div>
  );
}

function Sidebar({ onSearch, onHelp }: { onSearch: () => void; onHelp: () => void }) {
  const pathname = usePathname();
  const { data: board, dataUpdatedAt, isFetching, refetch } = useBoard();
  const source = useSource();
  const [, newTicket] = useNewTicket();
  const { theme, setTheme } = useTheme();
  const accent = useAccent();
  const inbox = board?.tickets.filter((t) => t.state === "OPEN" && t.labels.some((l) => l.name === "triage")).length ?? 0;
  const mine = board?.tickets.filter((t) => t.state === "OPEN" && t.assignees.some((a) => a.login === board.viewer.login)).length ?? 0;

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
      <div className="px-4 pt-4 pb-3"><Logo subtitle={board?.projectTitle ?? "Loading…"} /></div>
      <div className="space-y-1.5 px-3">
        <Button data-tour="new" className="glow-soft w-full justify-start" onClick={() => void newTicket("pick")}><Plus />New ticket<kbd className="ml-auto rounded bg-primary-foreground/20 px-1.5 text-[10px]">C</kbd></Button>
        <Button data-tour="search" variant="outline" className="w-full justify-start text-muted-foreground" onClick={onSearch}><Search />Search<kbd className="ml-auto text-[10px]">Ctrl K</kbd></Button>
      </div>
      <nav data-tour="nav" className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Views">
        {NAV.map((n) => {
          const active = pathname?.startsWith(n.href.slice(0, -1));
          const count = n.href === "/inbox/" ? inbox : n.href === "/my-work/" ? mine : 0;
          return (
            <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} title={n.hint}
              className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-sidebar-accent",
                active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground")}>
              <n.icon className="size-4 opacity-80" aria-hidden />{n.label}
              {count > 0 && <span className="ml-auto rounded-full bg-primary/12 px-1.5 text-xs font-medium tabular-nums text-primary">{count}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t p-3">
        <button onClick={() => void refetch()} className="flex w-full items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground" title="Refresh from GitHub">
          <RefreshCw className={cn("size-3", isFetching && "animate-spin")} aria-hidden />
          {source?.mode === "demo" ? "Demo data · changes aren't saved" : dataUpdatedAt ? `Synced ${formatDistanceToNow(dataUpdatedAt)} ago` : "Syncing…"}
        </button>
        <div className="flex items-center gap-1">
          {board && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" className="h-9 flex-1 justify-start gap-2 px-1.5" />}>
                <Avatar person={board.viewer} size={24} /><span className="truncate text-sm">{board.viewer.name || board.viewer.login}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="min-w-56">
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={(v: string) => { markDone("theme"); setTheme(v); }}>
                  <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">Match my device</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Accent colour</DropdownMenuLabel>
                <div className="flex flex-wrap gap-1.5 px-2 pb-2" role="radiogroup" aria-label="Accent colour">
                  {ACCENTS.map((a) => (
                    <button key={a.id} role="radio" aria-checked={accent === a.id} aria-label={a.label} title={a.label} onClick={() => { markDone("theme"); setAccent(a.id); }}
                      className="size-6 rounded-full ring-offset-2 ring-offset-popover transition-transform hover:scale-110 aria-checked:ring-2 aria-checked:ring-foreground"
                      style={{ background: a.swatch }} />
                  ))}
                </div>
                <DropdownMenuSeparator />
                {source?.mode === "github" && <DropdownMenuItem render={<a href={`https://github.com/orgs/${config.owner}/projects/${config.projectNumber}`} target="_blank" rel="noreferrer" />}>Open the board on GitHub</DropdownMenuItem>}
                <DropdownMenuItem onClick={onHelp}><HelpCircle />Keyboard shortcuts</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { signOut(); window.location.assign(`${config.basePath}/login/`); }}><LogOut />{source?.mode === "demo" ? "Leave demo" : "Sign out"}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="ghost" size="icon-sm" aria-label="Toggle dark mode" onClick={() => setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")}>
            <Sun className="hidden dark:block" /><Moon className="dark:hidden" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const [, newTicket] = useNewTicket();
  const items = [NAV[0], NAV[2], null, NAV[1], NAV[8]];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Views">
      {items.map((n, i) => n ? (
        <Link key={n.href} href={n.href} aria-current={pathname?.startsWith(n.href.slice(0, -1)) ? "page" : undefined}
          className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground aria-[current=page]:text-primary">
          <n.icon className="size-5" aria-hidden />{n.label}
        </Link>
      ) : (
        <button key={i} onClick={() => void newTicket("pick")} aria-label="New ticket" className="grid place-items-center">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg"><Plus className="size-5" /></span>
        </button>
      ))}
    </nav>
  );
}

function Palette({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  const router = useRouter();
  const { data: board } = useBoard();
  const [, openTicket] = useOpenTicket();
  const [, newTicket] = useNewTicket();
  const run = (fn: () => void) => { setOpen(false); fn(); };
  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Jump to a ticket or view, or create something">
      <Command>
      <CommandInput placeholder="Search tickets, views and actions…" />
      <CommandList>
        <CommandEmpty>Nothing found.</CommandEmpty>
        <CommandGroup heading="Create">
          {TICKET_TYPES.map((t) => (
            <CommandItem key={t.id} value={`new ${t.name}`} onSelect={() => run(() => void newTicket(t.id))}>
              <span aria-hidden>{t.emoji}</span>New {t.name.toLowerCase()}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Go to">
          {NAV.map((n) => (
            <CommandItem key={n.href} value={`go ${n.label}`} onSelect={() => run(() => router.push(n.href))}>
              <n.icon />{n.label}<CommandShortcut>G {n.key.toUpperCase()}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        {board && (
          <CommandGroup heading="Tickets">
            {board.tickets.slice(0, 300).map((t) => (
              <CommandItem key={t.number} value={`#${t.number} ${t.title}`} onSelect={() => run(() => void openTicket(t.number))}>
                <span className="font-mono text-xs text-muted-foreground">#{t.number}</span><span className="truncate">{cleanTitle(t.title)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
    </CommandDialog>
  );
}

function Shortcuts({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  const rows: [string, string][] = [["C", "New ticket"], ["/", "Search this view"], ["Ctrl K", "Jump to anything"], ["?", "This list"], ["Esc", "Close"],
    ...NAV.map((n) => [`G ${n.key.toUpperCase()}`, `Go to ${n.label}`] as [string, string])];
  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Keyboard shortcuts" description="Shortcuts work anywhere except while typing">
      <Command>
      <CommandInput placeholder="Find a shortcut…" />
      <CommandList>
        <CommandGroup heading="Keyboard shortcuts">
          {rows.map(([k, l]) => <CommandItem key={k} value={`${l} ${k}`}>{l}<CommandShortcut>{k}</CommandShortcut></CommandItem>)}
        </CommandGroup>
      </CommandList>
    </Command>
    </CommandDialog>
  );
}
