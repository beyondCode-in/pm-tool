"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useBoard } from "@/lib/data";
import { useOpenTicket } from "@/lib/url-state";
import { SearchX } from "@/components/icons";
import { BrandLoader } from "../brand/logo";
import { EmptyState } from "../brand/states";
import { TicketView } from "./ticket-view";

// The ticket opens as a large centred modal over whatever view you're in
// (the URL gets ?ticket=N, so Back closes it and the link can be shared).
// "Open as a full page" in its top bar goes to /ticket/?n=N.
export function TicketDrawer() {
  const [number, setNumber] = useOpenTicket();
  const { data: board } = useBoard();
  const ticket = board?.tickets.find((t) => t.number === number) ?? null;
  const close = () => void setNumber(null);
  return (
    <Dialog open={number !== null} onOpenChange={(o: boolean) => { if (!o) close(); }}>
      <DialogContent showCloseButton={false}
        className="flex h-[min(92dvh,56rem)] w-[min(100vw-1.5rem,78rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:w-screen max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0">
        <DialogTitle className="sr-only">{ticket ? `#${ticket.number} ${ticket.title}` : "Ticket"}</DialogTitle>
        <DialogDescription className="sr-only">Ticket details, relationships, attachments and conversation</DialogDescription>
        {board && ticket ? <TicketView key={ticket.number} board={board} ticket={ticket} mode="modal" onClose={close} />
          : board ? <EmptyState icon={SearchX} title={`Ticket #${number} isn't on this board`} text="It may have been removed from the board, or the link is wrong." />
          : <BrandLoader label="Opening ticket…" />}
      </DialogContent>
    </Dialog>
  );
}
