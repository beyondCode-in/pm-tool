"use client";

import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { isDone, options, plain } from "@/lib/board";
import { useActions } from "@/lib/data";
import type { Board, Ticket } from "@/lib/types";
import { useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "@/components/icons";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CardMenu } from "./card-menu";
import { StatusIcon } from "../ticket/status-icons";
import { AvatarStack, cleanTitle, LabelChip, PriorityMark, TicketMeta, TypeIcon } from "../ticket/bits";

const SHOWN_LABELS = /^(area|severity): /;

// layoutScope keeps animation ids unique when a ticket appears in several swimlanes.
export function TicketCard({ board, ticket: t, layoutScope = "" }: { board: Board; ticket: Ticket; layoutScope?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [, open] = useOpenTicket();
  const actions = useActions();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return draggable({
      element: el,
      getInitialData: () => ({ ticket: t.number }),
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: pointerOutsideOfPreview({ x: "12px", y: "8px" }),
          render: ({ container }) => {
            const clone = el.cloneNode(true) as HTMLElement;
            clone.style.width = `${el.offsetWidth}px`;
            clone.classList.add("drag-preview");
            container.appendChild(clone);
          },
        });
      },
      onDragStart: () => setDragging(true),
      onDrop: () => setDragging(false),
    });
  }, [t.number]);

  return (
    <motion.div layout layoutId={`card-${layoutScope}-${t.number}`} transition={{ type: "spring", stiffness: 500, damping: 38 }}>
      <CardMenu board={board} ticket={t}>
      <div ref={ref} role="button" tabIndex={0} aria-label={`#${t.number} ${cleanTitle(t.title)}`}
        onClick={() => void open(t.number)} onKeyDown={(e) => { if (e.key === "Enter") void open(t.number); }}
        className={cn("spotlight group relative cursor-grab rounded-xl border bg-card p-3 shadow-card transition-[box-shadow,opacity,border-color,transform] hover:-translate-y-px hover:border-primary/30 hover:shadow-pop active:cursor-grabbing",
          dragging && "scale-[0.98] border-dashed border-primary/50 opacity-40", isDone(t) && "opacity-70")}>
        <div className="flex items-start gap-2">
          <TypeIcon ticket={t} />
          <p className={cn("min-w-0 flex-1 text-sm leading-snug font-medium", isDone(t) && "line-through decoration-muted-foreground/50")}>{cleanTitle(t.title)}</p>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" className="-mt-0.5 -mr-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100 [@media(hover:none)]:opacity-100" aria-label={`Move #${t.number}`} onClick={(e: React.MouseEvent) => e.stopPropagation()} />}>
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()} className="min-w-48">
              <DropdownMenuLabel>Move to</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={t.fields.Status ?? ""} onValueChange={(v: string) => void actions.move(t, v)}>
                {options(board, "Status").map((o) => <DropdownMenuRadioItem key={o.id} value={o.name}><StatusIcon name={o.name} size={15} />{plain(o.name)}</DropdownMenuRadioItem>)}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {t.labels.some((l) => SHOWN_LABELS.test(l.name)) && (
          <div className="mt-2 flex flex-wrap gap-1">{t.labels.filter((l) => SHOWN_LABELS.test(l.name)).slice(0, 3).map((l) => <LabelChip key={l.name} {...l} />)}</div>
        )}
        <div className="mt-2.5 flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">#{t.number}</span>
          <PriorityMark value={t.fields.Priority} />
          {t.fields.Size && <span className="rounded border px-1 text-[10px] font-semibold text-muted-foreground" title="Size">{t.fields.Size}</span>}
          <TicketMeta ticket={t} />
          <span className="ml-auto"><AvatarStack people={t.assignees} size={20} /></span>
        </div>
      </div>
      </CardMenu>
    </motion.div>
  );
}
