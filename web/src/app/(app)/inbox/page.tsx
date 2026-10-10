"use client";
import { ViewPage } from "@/components/shell/view-page";
import { ListView } from "@/components/views/table-view";

export default function Page() {
  return (
    <ViewPage title="Inbox" description="New tickets waiting for someone to triage them: set an owner and priority, then remove the triage tag." hideDoneToggle
      scope={(t) => t.state === "OPEN" && t.labels.some((l) => l.name === "triage")}>
      {(board, tickets) => (
        <ListView board={board}
          empty={<div className="space-y-2"><p className="text-4xl">📭</p><p className="font-semibold">Inbox zero</p><p className="text-sm text-muted-foreground">Every new ticket has been triaged.</p></div>}
          groups={[
            { name: "Customer requests", tickets: tickets.filter((t) => t.labels.some((l) => ["request", "support"].includes(l.name))) },
            { name: "Bugs", tickets: tickets.filter((t) => t.labels.some((l) => ["bug", "incident"].includes(l.name))) },
            { name: "Everything else", tickets: tickets.filter((t) => !t.labels.some((l) => ["request", "support", "bug", "incident"].includes(l.name))) },
          ]} />
      )}
    </ViewPage>
  );
}
