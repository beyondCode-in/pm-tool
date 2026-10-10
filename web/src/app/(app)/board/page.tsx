"use client";
import { ViewPage } from "@/components/shell/view-page";
import { BoardView } from "@/components/views/board-view";

export default function Page() {
  return (
    <ViewPage title="Board" description="All work by stage. Drag a card to move it, or use its ⋯ menu.">
      {(board, tickets) => <BoardView board={board} tickets={tickets} />}
    </ViewPage>
  );
}
