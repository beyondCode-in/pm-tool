"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { plain } from "@/lib/board";
import type { Board, Ticket } from "@/lib/types";
import type { ReactElement } from "react";
import { AvatarStack, cleanTitle, OptionPill, TicketMeta, TypeIcon } from "./bits";

// Hover a ticket title (mouse only) to peek without opening it.
// Touch has no hover, so taps simply open the ticket as before.
export function TicketPreview({ board, ticket: t, children }: { board: Board; ticket: Ticket; children: ReactElement }) {
  const body = t.body.replace(/^###\s.*$/gm, "").replace(/_No response_/g, "").replace(/[*_`>#-]|\[ \]|\[x\]/g, "").replace(/\s+/g, " ").trim();
  return (
    <HoverCard>
      <HoverCardTrigger delay={450} closeDelay={80} render={children} />
      <HoverCardContent side="right" align="start" className="w-80 space-y-2.5 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TypeIcon ticket={t} size={18} /><span className="font-mono">#{t.number}</span>
          <span className="ml-auto"><OptionPill board={board} field="Status" value={t.fields.Status} /></span>
        </div>
        <p className="font-display text-base leading-snug">{cleanTitle(t.title)}</p>
        {body && <p className="line-clamp-3 text-sm text-muted-foreground">{body}</p>}
        <div className="flex flex-wrap items-center gap-1.5">
          {t.fields.Priority && <OptionPill board={board} field="Priority" value={t.fields.Priority} />}
          {t.fields.Size && <span className="tag">Size {plain(t.fields.Size)}</span>}
          {t.labels.filter((l) => l.name.startsWith("area:")).slice(0, 2).map((l) => <span key={l.name} className="tag">{l.name.slice(6)}</span>)}
        </div>
        <div className="flex items-center justify-between border-t pt-2.5">
          <TicketMeta ticket={t} />
          <AvatarStack people={t.assignees} size={20} />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
