"use client";
import { ViewPage } from "@/components/shell/view-page";
import { ListView } from "@/components/views/table-view";
import { EmptyState } from "@/components/brand/states";
import { PartyPopper } from "lucide-react";

export default function Page() {
  return (
    <ViewPage title="Inbox" description="New tickets waiting for someone to triage them: set an owner and priority, then remove the triage tag." hideDoneToggle
      scope={(t) => t.state === "OPEN" && t.labels.some((l) => l.name === "triage")}>
      {(board, tickets) => (
        <ListView board={board}
          empty={<EmptyState icon={PartyPopper} title="Inbox zero" text="Every new ticket has an owner and a priority. Nice work." />}
          groups={[
            { name: "Customer requests", tickets: tickets.filter((t) => t.labels.some((l) => ["request", "support"].includes(l.name))) },
            { name: "Bugs", tickets: tickets.filter((t) => t.labels.some((l) => ["bug", "incident"].includes(l.name))) },
            { name: "Everything else", tickets: tickets.filter((t) => !t.labels.some((l) => ["request", "support", "bug", "incident"].includes(l.name))) },
          ]} />
      )}
    </ViewPage>
  );
}
