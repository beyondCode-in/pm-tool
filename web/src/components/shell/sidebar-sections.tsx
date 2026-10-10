"use client";

import { useBoard } from "@/lib/data";
import { toggleFavorite, useFavorites } from "@/lib/favorites";
import { deleteView, useSavedViews } from "@/lib/saved-views";
import type { Layout } from "@/lib/layout";
import { useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { ChevronRight, X } from "@/components/icons";
import * as P from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { cleanTitle, TypeIcon } from "../ticket/bits";
import { NAV } from "./nav";

// ClickUp-style sidebar body: Home (personal), Favorites (starred tickets) and
// Spaces (the project, opening into its views). Section open/closed state is
// remembered per browser.

type Item = (typeof NAV)[number];
const HOME = ["/my-work/", "/inbox/"];
const FOOT = ["/settings/"];

const OPEN_KEY = "beyondpm.sidebar-open";
const openListeners = new Set<() => void>();
let openRaw: string | null = null;
const readOpen = () => { if (openRaw === null) { try { openRaw = localStorage.getItem(OPEN_KEY) ?? "{}"; } catch { openRaw = "{}"; } } return openRaw; };
function useOpen(id: string, initial = true): [boolean, () => void] {
  const s = useSyncExternalStore((l) => { openListeners.add(l); return () => openListeners.delete(l); }, readOpen, () => "{}");
  const map = JSON.parse(s) as Record<string, boolean>;
  const open = map[id] ?? initial;
  return [open, () => {
    openRaw = JSON.stringify({ ...map, [id]: !open });
    try { localStorage.setItem(OPEN_KEY, openRaw); } catch { /* ignore */ }
    openListeners.forEach((l) => l());
  }];
}

function Heading({ id, label, action, children }: { id: string; label: string; action?: ReactNode; children: ReactNode }) {
  const [open, toggle] = useOpen(id);
  return (
    <section className="mt-3 first:mt-0">
      <div className="group/h flex items-center px-2.5 pb-1">
        <button onClick={toggle} aria-expanded={open} className="flex flex-1 items-center gap-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase hover:text-foreground">
          {label}
          <ChevronRight className={cn("size-3 opacity-0 transition-[transform,opacity] group-hover/h:opacity-100", open && "rotate-90")} />
        </button>
        {action}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <div className="space-y-0.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function NavLink({ n, active, count, indent, hue }: { n: Item; active: boolean; count?: number; indent?: boolean; hue?: number }) {
  return (
    <Link href={n.href} aria-current={active ? "page" : undefined} title={n.hint}
      className={cn("relative flex items-center gap-2.5 rounded-lg py-1.5 pr-2 text-sm transition-colors hover:bg-sidebar-accent",
        indent ? "pl-7" : "pl-2.5", active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground")}>
      {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-full bg-primary" aria-hidden />}
      {hue !== undefined
        ? <span className="view-tab-icon grid size-[18px] shrink-0 place-items-center rounded-[5px]" style={{ ["--vh" as string]: hue }}><n.icon size={12} /></span>
        : <n.icon className="size-4 shrink-0 opacity-80" aria-hidden />}
      <span className="truncate">{n.label}</span>
      {!!count && <span className="ml-auto rounded-full bg-primary/12 px-1.5 text-xs font-medium tabular-nums text-primary">{count}</span>}
    </Link>
  );
}

export function SidebarSections({ items, pathname, counts }: { items: Item[]; pathname: string | null; counts: Record<string, number>; nav?: Layout }) {
  const { data: board } = useBoard();
  const favorites = useFavorites();
  const savedViews = useSavedViews(board?.projectId);
  const [, open] = useOpenTicket();
  const [spaceOpen, toggleSpace] = useOpen("space");
  const [showAllFav, setShowAllFav] = useState(false);
  const is = (href: string) => !!pathname?.startsWith(href.slice(0, -1));
  const home = items.filter((n) => HOME.includes(n.href));
  const views = items.filter((n) => !HOME.includes(n.href) && !FOOT.includes(n.href));
  const foot = items.filter((n) => FOOT.includes(n.href));
  const starred = favorites.map((u) => board?.tickets.find((t) => t.url === u)).filter((t): t is NonNullable<typeof t> => !!t);
  const title = board?.projectTitle ?? "Project";
  const allViews = NAV.filter((n) => !HOME.includes(n.href) && !FOOT.includes(n.href));

  return (
    <>
      {home.length > 0 && (
        <Heading id="home" label="Home">
          {home.map((n) => <NavLink key={n.href} n={n} active={is(n.href)} count={counts[n.href]} />)}
        </Heading>
      )}

      <Heading id="favorites" label="Favorites">
        {savedViews.map((v) => {
          const href = `${v.path}${v.query ? `?${v.query}` : ""}`;
          return (
            <div key={v.id} className="group/fav flex items-center rounded-lg pr-1 hover:bg-sidebar-accent">
              <Link href={href} className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pl-2.5 text-sm" title={v.name}>
                <P.BookmarkSimple size={16} weight="duotone" className="ico shrink-0 text-primary" /><span className="truncate">{v.name}</span>
              </Link>
              <button onClick={() => board && deleteView(board.projectId, v.id)} aria-label={`Delete view ${v.name}`} className="grid size-6 place-items-center rounded text-muted-foreground opacity-0 group-hover/fav:opacity-100 hover:text-foreground focus-visible:opacity-100">
                <X className="size-3" />
              </button>
            </div>
          );
        })}
        {starred.length ? (showAllFav ? starred : starred.slice(0, 6)).map((t) => (
          <div key={t.url} className="group/fav flex items-center rounded-lg pr-1 hover:bg-sidebar-accent">
            <button onClick={() => void open(t.number)} className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pl-2.5 text-left text-sm" title={cleanTitle(t.title)}>
              <TypeIcon ticket={t} /><span className="truncate">{cleanTitle(t.title)}</span>
            </button>
            <button onClick={() => toggleFavorite(t.url)} aria-label={`Unstar #${t.number}`} className="grid size-6 place-items-center rounded text-muted-foreground opacity-0 group-hover/fav:opacity-100 hover:text-foreground focus-visible:opacity-100">
              <X className="size-3" />
            </button>
          </div>
        )) : (
          !savedViews.length && <p className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-muted-foreground"><P.Star size={13} weight="duotone" />Star a ticket or save a view to pin it here</p>
        )}
        {starred.length > 6 && <button onClick={() => setShowAllFav(!showAllFav)} className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground">{showAllFav ? "Show less" : `Show ${starred.length - 6} more`}</button>}
      </Heading>

      <Heading id="spaces" label="Spaces">
        <button onClick={toggleSpace} aria-expanded={spaceOpen}
          className="flex w-full items-center gap-2.5 rounded-lg py-1.5 pr-2 pl-2.5 text-left text-sm font-medium transition-colors hover:bg-sidebar-accent">
          <span className="grid size-[18px] shrink-0 place-items-center rounded-[5px] bg-primary text-[10px] font-bold text-primary-foreground uppercase" aria-hidden>{title.trim()[0] ?? "P"}</span>
          <span className="min-w-0 flex-1 truncate">{title}</span>
          <ChevronRight className={cn("size-3.5 text-muted-foreground transition-transform", spaceOpen && "rotate-90")} />
        </button>
        <AnimatePresence initial={false}>
          {spaceOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="relative overflow-hidden">
              <span className="absolute top-1 bottom-1 left-[19px] w-px bg-sidebar-border" aria-hidden />
              <div className="space-y-0.5 pt-0.5">
                {views.map((n) => <NavLink key={n.href} n={n} indent active={is(n.href)} count={counts[n.href]} hue={(260 + allViews.indexOf(n) * (360 / allViews.length)) % 360} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Heading>

      {foot.length > 0 && <div className="mt-3 border-t pt-2">{foot.map((n) => <NavLink key={n.href} n={n} active={is(n.href)} />)}</div>}
    </>
  );
}
