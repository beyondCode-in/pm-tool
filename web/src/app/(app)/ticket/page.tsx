"use client";

import { BrandLoader } from "@/components/brand/logo";
import { EmptyState } from "@/components/brand/states";
import { TicketView } from "@/components/ticket/ticket-view";
import { Button } from "@/components/ui/button";
import { useBoard } from "@/lib/data";
import { ArrowLeft, SearchX } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

// Full-page ticket at /ticket/?n=123 (a query string, because the site is static).
export default function TicketPage() {
  const n = Number(useSearchParams().get("n"));
  const router = useRouter();
  const { data: board } = useBoard();
  const ticket = board?.tickets.find((t) => t.number === n);
  if (!board) return <BrandLoader label="Opening ticket…" />;
  if (!ticket) {
    return (
      <EmptyState icon={SearchX} title={`Ticket #${n || "?"} isn't on this board`} text="It may have been removed from the board, or the link is wrong."
        action={<Button onClick={() => router.push("/board/")}>Go to the board</Button>} />
    );
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b px-4 py-2">
        <Button variant="ghost" size="sm" onClick={() => (history.length > 1 ? router.back() : router.push("/board/"))}><ArrowLeft />Back</Button>
      </div>
      <div className="min-h-0 flex-1"><TicketView key={ticket.number} board={board} ticket={ticket} mode="page" /></div>
    </div>
  );
}
