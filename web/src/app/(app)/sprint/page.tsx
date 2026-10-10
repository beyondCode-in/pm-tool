"use client";
import { ViewPage } from "@/components/shell/view-page";
import { BoardView } from "@/components/views/board-view";
import { currentSprint, sprintEnd } from "@/lib/board";
import { format, parseISO } from "date-fns";

export default function Page() {
  return (
    <ViewPage title="Sprint" description="The current sprint. Switch swimlanes to People to see who's doing what."
      scope={(t, b) => { const s = currentSprint(b); return !!s && t.fields.Sprint === s.id; }}>
      {(board, tickets) => {
        const s = currentSprint(board);
        if (!s) return <p className="text-muted-foreground">There&apos;s no sprint running today. Add sprints to the board&apos;s Sprint field, then plan work in the Backlog.</p>;
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
