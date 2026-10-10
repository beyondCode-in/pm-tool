"use client";

import { isChildOf, isDone, isEpic } from "@/lib/board";
import type { Board, Ticket } from "@/lib/types";
import { useNewTicket, useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { ChevronRight, Network } from "@/components/icons";
import { EmptyState } from "../brand/states";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AvatarStack, cleanTitle, OptionPill, TicketMeta, TypeIcon } from "../ticket/bits";

// Epic → feature → task hierarchy with progress, like Jira's issue hierarchy.
export function EpicsView({ board, tickets }: { board: Board; tickets: Ticket[] }) {
  const [, newTicket] = useNewTicket();
  const hasParentHere = (t: Ticket) => tickets.some((p) => isChildOf(t, p));
  const roots = tickets.filter((t) => isEpic(t) || (!hasParentHere(t) && tickets.some((c) => isChildOf(c, t))));
  const loose = tickets.filter((t) => !roots.includes(t) && !hasParentHere(t));
  if (!roots.length) {
    return (
      <EmptyState icon={Network} title="No epics yet" text="An epic groups many tickets under one goal, and its progress fills in as they’re done."
        action={<Button onClick={() => void newTicket("epic")}>Create an epic</Button>} />
    );
  }
  return (
    <div className="space-y-3 overflow-auto pb-6">
      {roots.map((r) => <Node key={r.number} board={board} t={r} all={tickets} depth={0} />)}
      {loose.length > 0 && (
        <details className="rounded-xl border bg-card">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Not in an epic <span className="font-normal text-muted-foreground">{loose.length}</span></summary>
          <div className="border-t">{loose.map((t) => <Node key={t.number} board={board} t={t} all={tickets} depth={0} flat />)}</div>
        </details>
      )}
    </div>
  );
}

function Node({ board, t, all, depth, flat }: { board: Board; t: Ticket; all: Ticket[]; depth: number; flat?: boolean }) {
  const [openRow, setOpenRow] = useState(depth < 1);
  const [, open] = useOpenTicket();
  const kids = all.filter((c) => isChildOf(c, t));
  const done = kids.filter(isDone).length;
  const pct = kids.length ? Math.round((done / kids.length) * 100) : isDone(t) ? 100 : 0;
  const top = depth === 0 && !flat;
  return (
    <div className={cn(top && "overflow-hidden rounded-xl border bg-card")}>
      <div className={cn("flex items-center gap-2 px-3 py-2 hover:bg-muted/40", !top && "border-t")} style={{ paddingLeft: 12 + depth * 22 }}>
        {kids.length ? (
          <button onClick={() => setOpenRow(!openRow)} aria-expanded={openRow} aria-label={openRow ? "Collapse" : "Expand"} className="rounded p-0.5 hover:bg-muted">
            <ChevronRight className={cn("size-4 transition-transform", openRow && "rotate-90")} />
          </button>
        ) : <span className="w-5" />}
        <TypeIcon ticket={t} />
        <button onClick={() => void open(t.number)} className={cn("min-w-0 flex-1 truncate text-left text-sm hover:underline", (isEpic(t) || top) && "font-semibold", isDone(t) && "text-muted-foreground line-through")}>
          {cleanTitle(t.title)}
        </button>
        <span className="hidden md:inline"><TicketMeta ticket={t} /></span>
        {kids.length > 0 && (
          <span className="flex w-36 items-center gap-2" title={`${done} of ${kids.length} done`}>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-success transition-[width] duration-500" style={{ width: `${pct}%` }} /></span>
            <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{pct}%</span>
          </span>
        )}
        <OptionPill board={board} field="Status" value={t.fields.Status} compact />
        <AvatarStack people={t.assignees} size={20} max={2} />
      </div>
      {openRow && kids.map((k) => <Node key={k.number} board={board} t={k} all={all} depth={depth + 1} />)}
    </div>
  );
}
