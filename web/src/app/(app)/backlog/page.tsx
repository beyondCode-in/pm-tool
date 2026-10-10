"use client";
import { ViewPage } from "@/components/shell/view-page";
import { TableView } from "@/components/views/table-view";
import { isDone } from "@/lib/board";

export default function Page() {
  return (
    <ViewPage title="Backlog" description="Everything not done. Group by sprint to plan, and edit any cell in place." hideDoneToggle scope={(t) => !isDone(t)}>
      {(board, tickets) => <TableView board={board} tickets={tickets} defaultGroup="sprint" />}
    </ViewPage>
  );
}
