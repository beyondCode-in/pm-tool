"use client";
import { ViewPage } from "@/components/shell/view-page";
import { ListView } from "@/components/views/table-view";
import { addDays, byPriorityThenNumber, isDone, today } from "@/lib/board";

export default function Page() {
  return (
    <ViewPage title="My work" description="Everything assigned to you, by when it's due." hideDoneToggle
      scope={(t, b) => t.assignees.some((a) => a.login === b.viewer.login)}>
      {(board, tickets) => {
        const open = tickets.filter((t) => !isDone(t)).sort(byPriorityThenNumber);
        const due = (t: (typeof open)[number]) => t.fields["Target date"];
        const now = today(), week = addDays(now, 7);
        return (
          <ListView board={board} empty={<div className="space-y-2"><p className="text-4xl">🌤️</p><p className="font-semibold">Nothing assigned to you</p><p className="text-sm text-muted-foreground">Pick something from the Board or Backlog, or ask your lead.</p></div>}
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
