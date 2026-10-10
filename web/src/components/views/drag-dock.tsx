"use client";

import { dropTargetForElements, monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { dotClass, options, plain } from "@/lib/board";
import type { Board } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Ban, UserRound } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Avatar } from "../ticket/bits";

export type DockAction =
  | { action: "assign"; login: string }
  | { action: "priority"; value: string }
  | { action: "wontdo" };

// Appears while a card is being dragged. Dropping on a target here changes
// something other than the stage: who owns it, how urgent it is, or closes it.
export function DragDock({ board }: { board: Board }) {
  const [dragging, setDragging] = useState(false);
  useEffect(() => monitorForElements({
    canMonitor: ({ source }) => typeof source.data.ticket === "number",
    onDragStart: () => setDragging(true),
    onDrop: () => setDragging(false),
  }), []);
  const people = [board.viewer, ...board.people.filter((p) => p.login !== board.viewer.login)].slice(0, 6);

  return (
    <AnimatePresence>
      {dragging && (
        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="surface-glass glow-soft fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-2xl border p-2"
          role="region" aria-label="Drop to change the ticket">
          <span className="px-2 text-xs font-medium text-muted-foreground">Assign</span>
          {people.map((p) => (
            <Target key={p.login} data={{ action: "assign", login: p.login }} label={`Assign to ${p.name || p.login}`}>
              {p.login === board.viewer.login && !p.avatarUrl ? <UserRound className="size-4" /> : <Avatar person={p} size={28} />}
            </Target>
          ))}
          <span className="mx-1 h-8 w-px bg-border" aria-hidden />
          <span className="px-1 text-xs font-medium text-muted-foreground">Priority</span>
          {options(board, "Priority").map((o) => (
            <Target key={o.id} data={{ action: "priority", value: o.name }} label={`Set priority ${plain(o.name)}`}>
              <span className={cn("size-3 rounded-full", dotClass(o.color))} />
            </Target>
          ))}
          <span className="mx-1 h-8 w-px bg-border" aria-hidden />
          <Target data={{ action: "wontdo" }} label="Close as won't do" danger><Ban className="size-4" /></Target>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Target({ data, label, children, danger }: { data: DockAction; label: string; children: ReactNode; danger?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    return dropTargetForElements({ element: ref.current, getData: () => data, onDragEnter: () => setOver(true), onDragLeave: () => setOver(false), onDrop: () => setOver(false) });
  }, [data]);
  return (
    <div ref={ref} title={label} aria-label={label}
      className={cn("relative grid size-11 place-items-center rounded-xl border border-transparent transition-all duration-150",
        over ? (danger ? "scale-125 border-destructive bg-destructive/15 text-destructive" : "glow scale-125 border-primary bg-accent") : "hover:bg-muted")}>
      {children}
      {over && <span className="pointer-events-none absolute -top-8 rounded-md bg-foreground px-2 py-0.5 text-[11px] whitespace-nowrap text-background">{label}</span>}
    </div>
  );
}
