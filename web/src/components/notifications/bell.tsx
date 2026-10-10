"use client";

import * as P from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBoard } from "@/lib/data";
import { clearAll, digest, markAllRead, markRead, useNotifications, type Notice, type NoticeKind } from "@/lib/notifications";
import { useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, parseISO } from "date-fns";
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

// Bell with a pulsing badge while anything is unread. Watches board refreshes
// and turns differences into notices (see lib/notifications.ts).
export function NotificationBell({ compact }: { compact?: boolean }) {
  const { data: board, dataUpdatedAt } = useBoard();
  const list = useNotifications();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"unread" | "all">("unread");
  const [, openTicket] = useOpenTicket();
  const unread = list.filter((n) => !n.read).length;

  useEffect(() => {
    if (!board) return;
    const added = digest(board);
    if (added.length === 1) toast(added[0].title, { description: added[0].text });
    else if (added.length > 1) toast(`${added.length} new notifications`);
  }, [board, dataUpdatedAt]);

  const shown = tab === "unread" ? list.filter((n) => !n.read) : list;
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
          <span className="ml-auto"><Segmented size="xs" label="Show" value={tab} onChange={setTab} options={[["unread", `Unread${unread ? ` · ${unread}` : ""}`], ["all", "All"]] as const} /></span>
        </div>
        <ul className="max-h-[60vh] divide-y overflow-y-auto">
          <AnimatePresence initial={false}>
            {shown.map((n) => {
              const k = KIND[n.kind];
              const Icon = k.icon;
              return (
                <motion.li key={n.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <button onClick={() => go(n)} className={cn("group flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60", !n.read && "bg-accent/40")}>
                    <span className="ico grid size-8 shrink-0 place-items-center rounded-lg" style={{ background: `oklch(0.94 ${k.chroma * 0.4} ${k.hue})`, color: `oklch(0.5 ${k.chroma} ${k.hue})` }}>
                      <Icon size={17} weight="duotone" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{n.title}</span>
                      <span className="block text-xs text-muted-foreground">{n.text} · {formatDistanceToNow(parseISO(n.at))} ago</span>
                    </span>
                    {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="unread" />}
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
          {!shown.length && (
            <li className="grid place-items-center gap-2 px-6 py-10 text-center">
              <P.BellSimpleZ size={34} weight="duotone" className="text-muted-foreground" />
              <span className="text-sm font-medium">{tab === "unread" ? "You're all caught up" : "No notifications yet"}</span>
              <span className="text-xs text-muted-foreground">Assignments, moves, comments and due dates on your tickets show up here.</span>
            </li>
          )}
        </ul>
        {list.length > 0 && (
          <div className="flex justify-between border-t px-2 py-1.5">
            <Button size="xs" variant="ghost" disabled={!unread} onClick={markAllRead}><P.Checks />Mark all read</Button>
            <Button size="xs" variant="ghost" className="text-muted-foreground" onClick={clearAll}><P.Trash />Clear</Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
