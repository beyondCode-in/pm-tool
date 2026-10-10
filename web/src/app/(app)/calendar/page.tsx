"use client";
import { ViewPage } from "@/components/shell/view-page";
import { CalendarView } from "@/components/views/calendar-view";

export default function Page() {
  return (
    <ViewPage title="Calendar" description="Due dates by month.">
      {(_board, tickets) => <CalendarView tickets={tickets} />}
    </ViewPage>
  );
}
