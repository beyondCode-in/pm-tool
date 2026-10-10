"use client";
import { ViewPage } from "@/components/shell/view-page";
import { BoardView } from "@/components/views/board-view";
import { currentSprint, sprintEnd } from "@/lib/board";
import { format, parseISO } from "date-fns";
import { EmptyState } from "@/components/brand/states";
import { Timer } from "@/components/icons";

export default function Page() {
  return (
    <ViewPage title="Sprint" description="The current sprint. Switch swimlanes to People to see who's doing what."
      scope={(t, b) => { const s = currentSprint(b); return !!s && t.fields.Sprint === s.id; }}>
      {(board, tickets) => {
        const s = currentSprint(board);
        if (!s) return <EmptyState icon={Timer} title="No sprint running today" text="Add sprints to the board’s Sprint field, then plan work for them in the Backlog." />;
        return (
          <>
            <p className="-mt-2 text-sm"><b>{s.title}</b> · {format(parseISO(s.startDate), "d MMM")} – {format(parseISO(sprintEnd(s)), "d MMM")}</p>
            <BoardView board={board} tickets={tickets} />
          </>
        );
      }}
    </ViewPage>
  );
}
