"use client";
import { ViewPage } from "@/components/shell/view-page";
import { RoadmapView } from "@/components/views/roadmap-view";

export default function Page() {
  return (
    <ViewPage title="Roadmap" description="Epics and tickets on a timeline, with sprints across the top.">
      {(board, tickets) => <RoadmapView board={board} tickets={tickets} />}
    </ViewPage>
  );
}
