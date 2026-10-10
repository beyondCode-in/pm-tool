"use client";

import { draggable, dropTargetForElements, monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachClosestEdge, extractClosestEdge, type Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Layout } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ChevronDown, ChevronsDownUp, ChevronsUpDown, EyeOff, GripVertical, MoreHorizontal, RotateCcw, SlidersHorizontal } from "@/components/icons";
import { motion } from "motion/react";
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";

// A section you can collapse, hide and drag to a new place. `scope` keeps
// drags inside one area (you can't drop a dashboard widget into a ticket).
export function CustomSection({ id, scope, layout, title, icon: Icon, count, actions, children, className, bare }: {
  id: string; scope: string; layout: Layout; title: string; icon?: typeof ChevronDown; count?: ReactNode;
  actions?: ReactNode; children: ReactNode; className?: string; bare?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const handle = useRef<HTMLButtonElement>(null);
  const [edge, setEdge] = useState<Edge | null>(null);
  const [dragging, setDragging] = useState(false);
  const open = !layout.isCollapsed(id);
  const index = layout.order.indexOf(id);

  useEffect(() => {
    const el = ref.current, h = handle.current;
    if (!el || !h) return;
    const cleanups = [
      draggable({ element: el, dragHandle: h, getInitialData: () => ({ section: id, scope }), onDragStart: () => setDragging(true), onDrop: () => setDragging(false) }),
      dropTargetForElements({
        element: el,
        canDrop: ({ source }) => source.data.scope === scope && source.data.section !== id,
        getData: ({ input, element }) => attachClosestEdge({ section: id, scope }, { input, element, allowedEdges: ["top", "bottom"] }),
        onDrag: ({ self }) => setEdge(extractClosestEdge(self.data)),
        onDragLeave: () => setEdge(null),
        onDrop: () => setEdge(null),
      }),
    ];
    return () => cleanups.forEach((c) => c());
  }, [id, scope]);

  return (
    <motion.section layout="position" ref={ref as React.Ref<HTMLElement>} aria-label={title} data-section={id}
      className={cn("group/section relative", dragging && "opacity-40", className)}>
      {edge && <span aria-hidden className={cn("absolute right-0 left-0 z-10 h-0.5 rounded-full bg-primary", edge === "top" ? "-top-2" : "-bottom-2")} />}
      <div className={cn("flex items-center gap-1.5", open ? "mb-2.5" : "mb-0", bare && "px-0")}>
        <button ref={handle} aria-label={`Drag to move ${title}`} title="Drag to move"
          className="-ml-1.5 grid size-6 cursor-grab place-items-center rounded text-muted-foreground opacity-0 transition-opacity group-hover/section:opacity-100 focus-visible:opacity-100 active:cursor-grabbing [@media(hover:none)]:hidden">
          <GripVertical className="size-3.5" />
        </button>
        <button onClick={() => layout.toggleCollapsed(id)} aria-expanded={open} className="flex min-w-0 items-center gap-2 rounded-md py-0.5 text-left hover:text-foreground">
          {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
          <h3 className="truncate text-sm font-semibold">{title}</h3>
          {count !== undefined && count !== null && <span className="rounded-md bg-muted px-1.5 text-xs tabular text-muted-foreground">{count}</span>}
          <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", !open && "-rotate-90")} aria-hidden />
        </button>
        <div className="ml-auto flex items-center gap-1">
          {open && actions}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`${title} options`} className="opacity-0 group-hover/section:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100 [@media(hover:none)]:opacity-100" />}>
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem onClick={() => layout.toggleCollapsed(id)}>{open ? <><ChevronsDownUp />Collapse</> : <><ChevronsUpDown />Expand</>}</DropdownMenuItem>
              <DropdownMenuItem disabled={index <= 0} onClick={() => layout.moveBy(id, -1)}><ArrowUp />Move up</DropdownMenuItem>
              <DropdownMenuItem disabled={index >= layout.order.length - 1} onClick={() => layout.moveBy(id, 1)}><ArrowDown />Move down</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => layout.toggleHidden(id)}><EyeOff />Hide section</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {open && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }}>{children}</motion.div>}
    </motion.section>
  );
}

// Reorders sections when one is dropped on another inside `scope`.
export function useSectionDrops(scope: string, layout: Layout) {
  const onDrop = useEffectEvent((section: string, target: string, edge: Edge | null) => {
    const to = layout.order.indexOf(target) + (edge === "bottom" ? 1 : 0);
    const from = layout.order.indexOf(section);
    layout.move(section, from < to ? to - 1 : to);
  });
  useEffect(() => monitorForElements({
    canMonitor: ({ source }) => source.data.scope === scope,
    onDrop({ source, location }) {
      const t = location.current.dropTargets[0];
      if (t && typeof t.data.section === "string") onDrop(String(source.data.section), t.data.section, extractClosestEdge(t.data));
    },
  }), [scope]);
}

// "Customise" button: show/hide each section, expand/collapse all, reset.
export function CustomiseMenu({ layout, labels, label = "Customise", heading = "Show sections", align = "end" }: { layout: Layout; labels: Record<string, string>; label?: string; heading?: string; align?: "start" | "end" }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8" />}>
        <SlidersHorizontal />{label}{layout.customised && <span className="size-1.5 rounded-full bg-primary" aria-label="customised" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-56">
        <DropdownMenuLabel>{heading}</DropdownMenuLabel>
        {layout.order.map((id) => (
          <DropdownMenuCheckboxItem key={id} closeOnClick={false} checked={!layout.isHidden(id)} onCheckedChange={() => layout.toggleHidden(id)}>
            {labels[id] ?? id}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => layout.setCollapsedAll(false)}><ChevronsUpDown />Expand all</DropdownMenuItem>
        <DropdownMenuItem onClick={() => layout.setCollapsedAll(true)}><ChevronsDownUp />Collapse all</DropdownMenuItem>
        <DropdownMenuItem disabled={!layout.customised} onClick={layout.reset}><RotateCcw />Reset layout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
