"use client";
import { ViewPage } from "@/components/shell/view-page";
import { EpicsView } from "@/components/views/epics-view";

export default function Page() {
  return (
    <ViewPage title="Epics" description="Big goals and the tickets that make them up, with progress.">
      {(board, tickets) => <EpicsView board={board} tickets={tickets} />}
    </ViewPage>
  );
}
