"use client";
import { ViewPage } from "@/components/shell/view-page";
import { DashboardView } from "@/components/views/dashboard-view";

export default function Page() {
  return (
    <ViewPage title="Dashboard" description="How the work is going: sprint progress, workload and what needs attention." hideDoneToggle>
      {(board, tickets) => <DashboardView board={board} tickets={tickets} />}
    </ViewPage>
  );
}
