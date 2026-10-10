"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { applyFilters } from "@/lib/board";
import { useBoard } from "@/lib/data";
import type { Board, Ticket } from "@/lib/types";
import { useFilters, useNewTicket } from "@/lib/url-state";
import { AlertCircle, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { FilterBar } from "../filters/filter-bar";

// Every view: a header, the shared filter bar, and loading / error states.
export function ViewPage({ title, description, scope, children, hideDoneToggle }: {
  title: string;
  description: string;
  scope?: (t: Ticket, b: Board) => boolean; // which tickets this view is about
  hideDoneToggle?: boolean;
  children: (board: Board, tickets: Ticket[]) => ReactNode;
}) {
  const { data: board, error, isLoading, refetch } = useBoard();
  const { filters } = useFilters();
  const [, newTicket] = useNewTicket();
  const tickets = board ? applyFilters(scope ? board.tickets.filter((t) => scope(t, board)) : board.tickets, filters) : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <header className="flex flex-wrap items-end gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button className="ml-auto md:hidden" size="sm" onClick={() => void newTicket("pick")}><Plus />New</Button>
      </header>
      {error ? (
        <div role="alert" className="flex max-w-xl items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="space-y-2">
            <p className="font-medium">We couldn&apos;t load the board.</p>
            <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>Try again</Button>
          </div>
        </div>
      ) : isLoading || !board ? (
        <div className="space-y-3"><Skeleton className="h-8 w-full max-w-2xl" /><div className="flex gap-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72 w-72" />)}</div></div>
      ) : (
        <>
          <FilterBar board={board} hideDoneToggle={hideDoneToggle} />
          {children(board, tickets)}
        </>
      )}
    </div>
  );
}
