"use client";

import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioGroup, ContextMenuRadioItem,
  ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { options, plain } from "@/lib/board";
import { config } from "@/lib/config";
import { useActions } from "@/lib/data";
import type { Board, Ticket } from "@/lib/types";
import { useOpenTicket } from "@/lib/url-state";
import { ArrowRightLeft, CheckCircle2, Flag, Link2, PanelRightOpen, RotateCcw, UserRoundPlus, XCircle } from "@/components/icons";
import type { ReactElement } from "react";
import { toast } from "sonner";
import { PriorityIcon, StatusIcon } from "../ticket/status-icons";

// Right-click (or long-press on touch) any ticket for the common actions,
// like Jira and ClickUp. Everything here is also reachable from the ticket itself.
export function CardMenu({ board, ticket: t, children }: { board: Board; ticket: Ticket; children: ReactElement }) {
  const actions = useActions();
  const [, open] = useOpenTicket();
  const mine = t.assignees.some((a) => a.login === board.viewer.login);
  return (
    <ContextMenu>
      <ContextMenuTrigger render={children} />
      <ContextMenuContent className="min-w-56">
        <ContextMenuLabel className="truncate">#{t.number} · {plain(t.title.replace(/^\[[^\]]+\]\s*/, ""))}</ContextMenuLabel>
        <ContextMenuItem onClick={() => void open(t.number)}><PanelRightOpen />Open<ContextMenuShortcut>↵</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger><ArrowRightLeft />Move to</ContextMenuSubTrigger>
          <ContextMenuSubContent className="min-w-48">
            <ContextMenuRadioGroup value={t.fields.Status ?? ""} onValueChange={(v: string) => void actions.move(t, v)}>
              {options(board, "Status").map((o) => <ContextMenuRadioItem key={o.id} value={o.name}><StatusIcon name={o.name} size={15} />{plain(o.name)}</ContextMenuRadioItem>)}
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger><Flag />Priority</ContextMenuSubTrigger>
          <ContextMenuSubContent className="min-w-44">
            <ContextMenuRadioGroup value={t.fields.Priority ?? ""} onValueChange={(v: string) => void actions.setField(t, "Priority", v)}>
              {options(board, "Priority").map((o) => <ContextMenuRadioItem key={o.id} value={o.name}><PriorityIcon value={o.name} size={15} />{plain(o.name)}</ContextMenuRadioItem>)}
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem disabled={mine} onClick={() => void actions.setAssignees(t, [...t.assignees.map((a) => a.login), board.viewer.login])}>
          <UserRoundPlus />{mine ? "Assigned to you" : "Assign to me"}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => { void navigator.clipboard?.writeText(`${window.location.origin}${config.basePath}/ticket/?n=${t.number}`); toast.success("Link copied"); }}>
          <Link2 />Copy link
        </ContextMenuItem>
        <ContextMenuSeparator />
        {t.state === "OPEN" ? (<>
          <ContextMenuItem onClick={() => void actions.setState(t, "CLOSED", "COMPLETED")}><CheckCircle2 />Mark complete</ContextMenuItem>
          <ContextMenuItem variant="destructive" onClick={() => void actions.setState(t, "CLOSED", "NOT_PLANNED")}><XCircle />Won&apos;t do</ContextMenuItem>
        </>) : <ContextMenuItem onClick={() => void actions.setState(t, "OPEN")}><RotateCcw />Reopen</ContextMenuItem>}
      </ContextMenuContent>
    </ContextMenu>
  );
}
