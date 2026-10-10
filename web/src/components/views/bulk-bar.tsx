"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { iterationField, options, plain } from "@/lib/board";
import { useActions } from "@/lib/data";
import type { Board, Ticket } from "@/lib/types";
import { CheckCircle2, ChevronDown, UserRoundPlus, X } from "@/components/icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Tag } from "../ticket/bits";

// Change many tickets at once, like Jira's bulk edit. Appears while any rows
// are selected; each change runs per ticket and reports once at the end.
export function BulkBar({ board, selected, onClear }: { board: Board; selected: Ticket[]; onClear: () => void }) {
  const actions = useActions();
  const [busy, setBusy] = useState(false);
  const n = selected.length;

  const apply = async (label: string, fn: (t: Ticket) => Promise<boolean>) => {
    setBusy(true);
    const results = await Promise.all(selected.map(fn));
    const ok = results.filter(Boolean).length;
    setBusy(false);
    if (ok === n) toast.success(`${label} on ${ok} ticket${ok === 1 ? "" : "s"}`);
    else toast.warning(`${label}: ${ok} of ${n} saved. The others are shown as they were.`);
    onClear();
  };

  const menu = (label: string, items: { key: string; node: React.ReactNode; run: (t: Ticket) => Promise<boolean> }[]) => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="sm" variant="ghost" disabled={busy} className="text-background hover:bg-background/15 hover:text-background" />}>
        {label}<ChevronDown className="opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" className="min-w-48">
        <DropdownMenuLabel>{label} for {n} tickets</DropdownMenuLabel>
        {items.map((i) => <DropdownMenuItem key={i.key} onClick={() => void apply(`${label} set`, i.run)}>{i.node}</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <AnimatePresence>
      {n > 0 && (
        <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 34 }}
          role="toolbar" aria-label={`Bulk actions for ${n} selected tickets`}
          className="fixed bottom-20 left-1/2 z-40 flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-2xl bg-foreground p-1.5 pl-3 text-background shadow-pop md:bottom-6">
          <span className="shrink-0 pr-2 text-sm font-semibold tabular">{n} selected</span>
          {menu("Status", options(board, "Status").map((o) => ({ key: o.id, node: o.name, run: (t) => actions.move(t, o.name, { silent: true }) })))}
          {menu("Priority", options(board, "Priority").map((o) => ({ key: o.id, node: <Tag color={o.color} dot>{plain(o.name)}</Tag>, run: (t) => actions.setField(t, "Priority", o.name, { silent: true }) })))}
          {iterationField(board) && menu("Sprint", [
            ...(iterationField(board)?.iterations ?? []).map((i) => ({ key: i.id, node: i.title, run: (t: Ticket) => actions.setField(t, "Sprint", i.id, { silent: true }) })),
            { key: "none", node: <span className="text-muted-foreground">No sprint</span>, run: (t: Ticket) => actions.setField(t, "Sprint", null, { silent: true }) },
          ])}
          {menu("Assignee", board.people.map((p) => ({ key: p.login, node: p.name || p.login,
            run: (t: Ticket) => (t.assignees.some((a) => a.login === p.login) ? Promise.resolve(true) : actions.setAssignees(t, [...t.assignees.map((a) => a.login), p.login])) })))}
          <Button size="sm" variant="ghost" disabled={busy} className="text-background hover:bg-background/15 hover:text-background"
            onClick={() => void apply("Assigned to you", (t) => (t.assignees.some((a) => a.login === board.viewer.login) ? Promise.resolve(true) : actions.setAssignees(t, [...t.assignees.map((a) => a.login), board.viewer.login])))}>
            <UserRoundPlus />Me
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} className="text-background hover:bg-background/15 hover:text-background"
            onClick={() => void apply("Closed", (t) => actions.setState(t, "CLOSED", "COMPLETED"))}>
            <CheckCircle2 />Close
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Clear selection" className="text-background hover:bg-background/15 hover:text-background" onClick={onClear}><X /></Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
