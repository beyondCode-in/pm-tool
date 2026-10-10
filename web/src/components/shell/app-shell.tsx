"use client";

import { Button } from "@/components/ui/button";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ACCENTS, PALETTES, setAccent, setPalette, useAccent, usePalette, type PaletteId } from "@/lib/accent";
import { signOut } from "@/lib/auth";
import { markDone } from "@/lib/onboarding";
import { toggleSidebar, useSidebarCollapsed } from "@/lib/ui-prefs";
import { useLayout } from "@/lib/layout";
import { config , hasBoard } from "@/lib/config";
import { useBoard, useSource } from "@/lib/data";
import { TICKET_TYPES } from "@/lib/ticket-types";
import { useNewTicket, useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { HelpCircle, LogOut, Moon, PanelLeftClose, PanelLeftOpen, Plus, RefreshCw, Search, Sun, Link2, ArrowRightLeft } from "@/components/icons";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BrandLoader, Logo, LogoMark } from "../brand/logo";
import { Tip } from "./tip";
import { CreateTicketDialog } from "../create/create-ticket";
import { Guide } from "../guide/guide";
import { NotificationBell } from "../notifications/bell";
import { TypeGlyph } from "../ticket/type-badge";
import { Avatar, cleanTitle } from "../ticket/bits";
import { TicketDrawer } from "../ticket/ticket-drawer";
import { NAV } from "./nav";
import { openReminder } from "@/lib/reminders";
import { ReminderDialog, ReminderRunner } from "../reminders/reminders";
import { RunningTimer } from "./running-timer";
import { toast } from "sonner";
import { currentTenant, shareLink } from "@/lib/tenant";
import { SidebarSections } from "./sidebar-sections";

export function AppShell({ children }: { children: ReactNode }) {
  const source = useSource();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [, newTicket] = useNewTicket();

  useEffect(() => {
    if (source === null) router.replace("/login/");
    // Signed in to GitHub but no board picked yet (shared site): choose one.
    else if (source?.mode === "github" && !hasBoard()) router.replace("/connect/");
  }, [source, router]);

  // Keyboard: C new · / search · ⌘K palette · ? shortcuts · G then a letter to jump.
  useEffect(() => {
    let g = false;
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.closest("input, textarea, select, [contenteditable=true], [role=dialog]") !== null);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); markDone("palette"); setPaletteOpen((o) => !o); return; }
      // R: a reminder, from anywhere (inside an open ticket it links to that ticket).
      const inField = e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable=true]") !== null;
      if (e.key === "r" && !inField && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const n = Number(new URLSearchParams(window.location.search).get("ticket") || new URLSearchParams(window.location.search).get("n"));
        openReminder(n ? { ticket: n } : {});
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (g) { g = false; const item = NAV.find((n) => n.key === e.key.toLowerCase()); if (item) { e.preventDefault(); router.push(item.href); } return; }
      if (e.key === "g") { g = true; setTimeout(() => (g = false), 1200); }
      else if (e.key === "c") { e.preventDefault(); void newTicket("pick"); }
      else if (e.key === "/") { e.preventDefault(); (document.querySelector("[data-search]") as HTMLInputElement | null)?.focus(); }
      else if (e.key === "?") setHelpOpen(true);
      else if (e.key === "[") toggleSidebar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, newTicket]);

  // Pre-rendered HTML and the first paint: show the brand loader, not a blank page.
  if (source === undefined) return <div className="flex h-dvh"><BrandLoader label="Opening BeyondPM…" /></div>;
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
      <ReminderDialog />
      <ReminderRunner />
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
  const palette = usePalette();
  const collapsed = useSidebarCollapsed();
  const nav = useLayout("sidebar-nav", NAV.map((n) => n.href));
  const navItems = nav.visible.map((h) => NAV.find((n) => n.href === h)!).filter(Boolean);
  const inbox = board?.tickets.filter((t) => t.state === "OPEN" && t.labels.some((l) => l.name === "triage")).length ?? 0;
  const mine = board?.tickets.filter((t) => t.state === "OPEN" && t.assignees.some((a) => a.login === board.viewer.login)).length ?? 0;

  return (
    <aside data-collapsed={collapsed || undefined}
      className={cn("group/side hidden shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out md:flex", collapsed ? "w-16" : "w-60")}>
      <div className={cn("flex items-center gap-1 pt-4 pb-3", collapsed ? "flex-col justify-center px-2" : "px-4")}>
        {collapsed ? <LogoMark size={30} /> : <span className="min-w-0 flex-1"><Logo subtitle={board?.projectTitle ?? "Loading…"} /></span>}
        <NotificationBell />
      </div>
      <div className={cn("space-y-1.5", collapsed ? "px-2" : "px-3")}>
        <Tip label="New ticket" kbd="C" show={collapsed}>
          <Button data-tour="new" size={collapsed ? "icon" : "default"} className={cn("glow-pulse", collapsed ? "mx-auto flex size-10" : "w-full justify-start")} onClick={() => void newTicket("pick")} aria-label="New ticket">
            <Plus />{!collapsed && <>New ticket<kbd className="ml-auto rounded bg-primary-foreground/20 px-1.5 text-[10px]">C</kbd></>}
          </Button>
        </Tip>
        <RunningTimer compact={collapsed} />
        <Tip label="Search" kbd="Ctrl K" show={collapsed}>
          <Button data-tour="search" variant="outline" size={collapsed ? "icon" : "default"} className={cn("text-muted-foreground", collapsed ? "mx-auto flex size-10" : "w-full justify-start")} onClick={onSearch} aria-label="Search">
            <Search />{!collapsed && <>Search<kbd className="ml-auto text-[10px]">Ctrl K</kbd></>}
          </Button>
        </Tip>
      </div>
      <nav data-tour="nav" className={cn("scroll-quiet flex-1 overflow-x-hidden overflow-y-auto", collapsed ? "no-scrollbar mt-2 space-y-0 px-2" : "mt-4 space-y-0.5 px-3")} aria-label="Views">
        {!collapsed ? <SidebarSections items={navItems} pathname={pathname} counts={{ "/inbox/": inbox, "/my-work/": mine }} /> : railItems(navItems).map((n, i) => n === "divider" ? <div key={`divider-${i}`} className="mx-auto my-1.5 h-px w-6 bg-sidebar-border" aria-hidden /> : (() => {
          const active = pathname?.startsWith(n.href.slice(0, -1));
          const count = n.href === "/inbox/" ? inbox : n.href === "/my-work/" ? mine : 0;
          return (
            <Tip key={n.href} label={n.label} kbd={`G ${n.key.toUpperCase()}`} show={collapsed}>
              <Link href={n.href} aria-current={active ? "page" : undefined} aria-label={collapsed ? n.label : undefined} title={collapsed ? undefined : n.hint}
                className={cn("relative flex items-center gap-2.5 rounded-lg py-1.5 text-sm transition-colors hover:bg-sidebar-accent",
                  collapsed ? "mx-auto size-9 justify-center px-0" : "px-2.5",
                  active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground")}>
                {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-full bg-primary" aria-hidden />}
                <n.icon className="size-4 shrink-0 opacity-80" aria-hidden />{!collapsed && n.label}
                {count > 0 && (collapsed
                  ? <span className="absolute top-1 right-1 size-2 rounded-full bg-primary ring-2 ring-sidebar" aria-label={`${count} items`} />
                  : <span className="ml-auto rounded-full bg-primary/12 px-1.5 text-xs font-medium tabular-nums text-primary">{count}</span>)}
              </Link>
            </Tip>
          );
        })())}
      </nav>
      <div className={cn("space-y-2 border-t", collapsed ? "p-2" : "p-3")}>
        {!collapsed && (
          <button onClick={() => void refetch()} className="flex w-full items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground" title="Refresh from GitHub">
            <RefreshCw className={cn("size-3", isFetching && "animate-spin")} aria-hidden />
            {source?.mode === "demo" ? "Demo data · changes aren't saved" : dataUpdatedAt ? `Synced ${formatDistanceToNow(dataUpdatedAt)} ago` : "Syncing…"}
          </button>
        )}
        <Tip label={collapsed ? "Expand sidebar" : "Collapse sidebar"} kbd="[" show>
          <Button variant="ghost" size="sm" onClick={toggleSidebar} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn("text-muted-foreground", collapsed ? "mx-auto flex size-10 p-0" : "w-full justify-start")}>
            {collapsed ? <PanelLeftOpen /> : <><PanelLeftClose />Collapse</>}
          </Button>
        </Tip>
        <div className={cn("flex items-center gap-1", collapsed && "flex-col")}>
          {board && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" aria-label="Account and theme" className={cn("h-9 gap-2 px-1.5", collapsed ? "size-10 justify-center" : "flex-1 justify-start")} />}>
                <Avatar person={board.viewer} size={24} />{!collapsed && <span className="truncate text-sm">{board.viewer.name || board.viewer.login}</span>}
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="min-w-56">
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={(v: string) => { markDone("theme"); setTheme(v); }}>
                  <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">Match my device</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Palette</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={palette} onValueChange={(v: string) => { markDone("theme"); setPalette(v as PaletteId); }}>
                  {PALETTES.map((p) => <DropdownMenuRadioItem key={p.id} value={p.id}><span className="size-3.5 rounded ring-1 ring-border" style={{ background: p.swatch }} />{p.label}</DropdownMenuRadioItem>)}
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
                {source?.mode === "github" && (() => { const t = currentTenant(); return t && (
                  <DropdownMenuItem onClick={() => { void navigator.clipboard?.writeText(shareLink(window.location.origin, config.basePath, t)); toast.success("Board link copied", { description: "Teammates with access open straight into this board." }); }}>
                    <Link2 />Copy board link
                  </DropdownMenuItem>); })()}
                {source?.mode === "github" && !config.pinned && <DropdownMenuItem onClick={() => window.location.assign(`${config.basePath}/connect/`)}><ArrowRightLeft />Switch board…</DropdownMenuItem>}
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
              <TypeGlyph kind={t.id} size={18} />New {t.name.toLowerCase()}
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
  const rows: [string, string][] = [["C", "New ticket"], ["/", "Search this view"], ["Ctrl K", "Jump to anything"], ["?", "This list"], ["[", "Collapse or expand the sidebar"], ["Esc", "Close"],
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

// The collapsed rail groups icons like the expanded sidebar: personal, views, settings.
const RAIL_HOME = ["/home/", "/my-work/", "/inbox/"];
function railItems<T extends { href: string }>(items: T[]): (T | "divider")[] {
  const home = items.filter((n) => RAIL_HOME.includes(n.href));
  const foot = items.filter((n) => n.href === "/settings/");
  const views = items.filter((n) => !RAIL_HOME.includes(n.href) && n.href !== "/settings/");
  return [...home, ...(home.length && views.length ? ["divider" as const] : []), ...views, ...(foot.length ? ["divider" as const] : []), ...foot];
}
