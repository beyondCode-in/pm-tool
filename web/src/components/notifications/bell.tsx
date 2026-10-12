"use client";

import * as P from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBoard, useSource } from "@/lib/data";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "../ticket/bits";
import { activityCursor, ingestActivity, setWatchAll, useWatchAll } from "@/lib/notifications";
import { clearAll, clearNotice, digest, isWaiting, laterNotice, markAllRead, markRead, restoreNotice, useNotifications, wakeLater, type Notice, type NoticeKind } from "@/lib/notifications";
import { useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Segmented } from "../ui-plus/segmented";

const KIND: Record<NoticeKind, { icon: P.Icon; hue: number; chroma: number; label: string }> = {
  assigned: { icon: P.UserCirclePlus, hue: 290, chroma: 0.18, label: "Assigned" },
  status: { icon: P.ArrowsLeftRight, hue: 245, chroma: 0.15, label: "Moved" },
  comment: { icon: P.ChatCircleDots, hue: 200, chroma: 0.13, label: "Comment" },
  triage: { icon: P.Tray, hue: 70, chroma: 0.1, label: "New" },
  due: { icon: P.CalendarCheck, hue: 85, chroma: 0.15, label: "Due today" },
  overdue: { icon: P.Alarm, hue: 25, chroma: 0.19, label: "Overdue" },
};

const nowMs = () => Date.now();

// Bell with a pulsing badge while anything is unread. Watches board refreshes
// and turns differences into notices (see lib/notifications.ts).
export function NotificationBell({ compact }: { compact?: boolean }) {
  const { data: board, dataUpdatedAt } = useBoard();
  const list = useNotifications();
  const source = useSource();
  const watchAll = useWatchAll();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"inbox" | "later" | "cleared">("inbox");
  const [, openTicket] = useOpenTicket();
  const now = nowMs();
  const inbox = list.filter((n) => !n.cleared && !isWaiting(n, now));
  const later = list.filter((n) => !n.cleared && isWaiting(n, now));
  const cleared = list.filter((n) => n.cleared);
  const unread = inbox.filter((n) => !n.read).length;

  useEffect(() => {
    if (!board) return;
    wakeLater();
    const live = !!source?.activity;
    const announce = (added: Notice[]) => {
      if (added.length === 1) toast(added[0].title, { description: `${added[0].actor ? added[0].actor.login + " " : ""}${added[0].text}`, icon: <span className="toast-tile" aria-hidden><P.BellRinging size={18} weight="fill" /></span> });
      else if (added.length > 1) toast(`${added.length} new notifications`, { icon: <span className="toast-tile" aria-hidden><P.BellRinging size={18} weight="fill" /></span> });
    };
    announce(digest(board, live));
  }, [board, dataUpdatedAt, source]);

  // Other people's changes: polled on their own every 15 s, not only with the board.
  const activity = useQuery({ queryKey: ["activity"], enabled: !!source?.activity && !!board, refetchInterval: 15_000, staleTime: 5_000, queryFn: () => source!.activity!(activityCursor()) });
  useEffect(() => {
    if (!board || !activity.data) return;
    const added = ingestActivity(board, activity.data);
    if (added.length === 1) toast(added[0].title, { description: `${added[0].actor ? added[0].actor.login + " " : ""}${added[0].text}`, icon: <span className="toast-tile" aria-hidden><P.BellRinging size={18} weight="fill" /></span> });
    else if (added.length > 1) toast(`${added.length} new notifications`, { icon: <span className="toast-tile" aria-hidden><P.BellRinging size={18} weight="fill" /></span> });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.data, activity.dataUpdatedAt]);

  const shown = tab === "inbox" ? inbox : tab === "later" ? later : cleared;
  const go = (n: Notice) => { markRead(n.id); setOpen(false); void openTicket(n.ticket); };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="ghost" size={compact ? "icon" : "icon-sm"} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative" />}>
        <motion.span animate={unread ? { rotate: [0, -14, 12, -8, 6, 0] } : { rotate: 0 }} transition={{ duration: 0.9, repeat: unread ? Infinity : 0, repeatDelay: 6 }} className="inline-grid">
          <P.Bell className="ico size-[18px]" weight={unread ? "duotone" : "regular"} />
        </motion.span>
        <AnimatePresence>
          {unread > 0 && (
            <motion.span key="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 600, damping: 22 }}
              className="pointer-events-none absolute -top-0.5 -right-0.5 grid min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] leading-[18px] font-bold text-white ring-2 ring-sidebar">
              <span className="notify-ping" aria-hidden />
              {unread > 99 ? "99+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </PopoverTrigger>
      <PopoverContent side={compact ? "bottom" : "right"} align="start" sideOffset={10} className="w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <p className="font-display text-base">Notifications</p>
          <span className="ml-auto"><Segmented size="xs" label="Show" value={tab} onChange={setTab} options={[["inbox", `Inbox${unread ? ` · ${unread}` : ""}`], ["later", `Later${later.length ? ` · ${later.length}` : ""}`], ["cleared", "Cleared"]] as const} /></span>
        </div>
        <ul className="max-h-[60vh] divide-y overflow-y-auto">
          <AnimatePresence initial={false}>
            {shown.map((n) => {
              const k = KIND[n.kind];
              const Icon = k.icon;
              return (
                <motion.li key={n.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} className="group/n relative">
                  <button onClick={() => go(n)} className={cn("flex w-full gap-3 px-4 py-3 pr-20 text-left transition-colors hover:bg-muted/60", !n.read && "bg-accent/40")}>
                    <span className="relative shrink-0">
                      {n.actor ? <Avatar person={n.actor} size={32} /> : (
                        <span className="ico grid size-8 place-items-center rounded-lg" style={{ background: `oklch(0.94 ${k.chroma * 0.4} ${k.hue})`, color: `oklch(0.5 ${k.chroma} ${k.hue})` }}><Icon size={17} weight="duotone" /></span>
                      )}
                      {n.actor && <span className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full ring-2 ring-popover" style={{ background: `oklch(0.94 ${k.chroma * 0.4} ${k.hue})`, color: `oklch(0.5 ${k.chroma} ${k.hue})` }}><Icon size={10} weight="bold" /></span>}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{n.title}</span>
                      <span className="block text-xs text-muted-foreground">{n.actor && <span className="font-medium text-foreground">{n.actor.login} </span>}{n.text} · {formatDistanceToNow(parseISO(n.at))} ago</span>
                    </span>
                    {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="unread" />}
                  </button>
                  {/* ClickUp-style row actions: Later and Clear (or back to Inbox). */}
                  <span className="absolute top-2.5 right-3 flex gap-0.5 rounded-lg bg-popover/90 opacity-0 shadow-card backdrop-blur transition-opacity group-hover/n:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
                    {tab === "cleared" ? (
                      <Button size="icon-xs" variant="ghost" aria-label="Move back to Inbox" title="Back to Inbox" onClick={() => restoreNotice(n.id)}><P.ArrowUUpLeft /></Button>
                    ) : (<>
                      {tab === "inbox" && <Button size="icon-xs" variant="ghost" aria-label="Later (tomorrow 9 am)" title="Later · tomorrow 9 am" onClick={() => laterNotice(n.id)}><P.Clock /></Button>}
                      <Button size="icon-xs" variant="ghost" aria-label="Clear" title="Clear" onClick={() => clearNotice(n.id)}><P.Check /></Button>
                    </>)}
                  </span>
                  {tab === "later" && n.later && <p className="-mt-2 px-4 pb-2 pl-[3.75rem] text-[11px] text-muted-foreground">Back {format(parseISO(n.later), "EEE h:mm a")}</p>}
                </motion.li>
              );
            })}
          </AnimatePresence>
          {!shown.length && (
            <li className="grid place-items-center gap-2 px-6 py-10 text-center">
              <P.BellSimpleZ size={34} weight="duotone" className="text-muted-foreground" />
              <span className="text-sm font-medium">{tab === "inbox" ? "You're all caught up" : tab === "later" ? "Nothing saved for later" : "Nothing cleared yet"}</span>
              <span className="text-xs text-muted-foreground">Assignments, moves, comments and due dates on your tickets show up here.</span>
            </li>
          )}
        </ul>
        {source?.activity && (
          <label className="flex cursor-pointer items-center gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
            <input type="checkbox" className="accent-[var(--primary)]" checked={watchAll} onChange={(e) => setWatchAll(e.target.checked)} />
            Watch everything (every ticket, not only yours)
          </label>
        )}
        {list.length > 0 && (
          <div className="flex justify-between border-t px-2 py-1.5">
            <Button size="xs" variant="ghost" disabled={!unread} onClick={markAllRead}><P.Checks />Mark all read</Button>
            <Button size="xs" variant="ghost" className="text-muted-foreground" disabled={!inbox.length} onClick={clearAll}><P.Checks />Clear all</Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
