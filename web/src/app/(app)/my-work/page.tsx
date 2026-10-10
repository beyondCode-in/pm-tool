"use client";
import { ViewPage } from "@/components/shell/view-page";
import { ListView } from "@/components/views/table-view";
import { addDays, byPriorityThenNumber, isDone, today } from "@/lib/board";
import { EmptyState } from "@/components/brand/states";
import { Button } from "@/components/ui/button";
import { Sun } from "@/components/icons";
import Link from "next/link";

export default function Page() {
  return (
    <ViewPage title="My work" description="Everything assigned to you, by when it's due." hideDoneToggle
      scope={(t, b) => t.assignees.some((a) => a.login === b.viewer.login)}>
      {(board, tickets) => {
        const open = tickets.filter((t) => !isDone(t)).sort(byPriorityThenNumber);
        const due = (t: (typeof open)[number]) => t.fields["Target date"];
        const now = today(), week = addDays(now, 7);
        return (
          <ListView board={board} empty={<EmptyState icon={Sun} title="Nothing assigned to you" text="Enjoy the calm, or pick something up from the Board or Backlog." action={<Button nativeButton={false} render={<Link href="/board/" />}>Open the board</Button>} />}
            groups={[
              { name: "Overdue", tickets: open.filter((t) => due(t) && due(t)! < now) },
              { name: "Due today", tickets: open.filter((t) => due(t) === now) },
              { name: "This week", tickets: open.filter((t) => due(t) && due(t)! > now && due(t)! <= week) },
              { name: "Later", tickets: open.filter((t) => due(t) && due(t)! > week) },
              { name: "No due date", tickets: open.filter((t) => !due(t)) },
              { name: "Recently done", hint: "last 14 days", tickets: tickets.filter((t) => isDone(t) && (t.closedAt ?? "") > addDays(now, -14)) },
            ]} />
        );
      }}
    </ViewPage>
  );
}
