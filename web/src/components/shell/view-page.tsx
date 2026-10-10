"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { applyFilters } from "@/lib/board";
import { useBoard } from "@/lib/data";
import type { Board, Ticket } from "@/lib/types";
import { useFilters, useNewTicket } from "@/lib/url-state";
import { Plus } from "@/components/icons";
import { ErrorState } from "../brand/states";
import { Suspense, type ReactNode } from "react";
import { BrandLoader } from "../brand/logo";
import { FilterBar } from "../filters/filter-bar";
import { NotificationBell } from "../notifications/bell";
import { ViewTabs } from "./view-tabs";
import { RunningTimer } from "./running-timer";

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
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-4 sm:gap-4 md:p-6">
      <header className="flex flex-wrap items-end gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold sm:text-[1.75rem]">{title}</h1>
          <p className="hidden text-sm text-muted-foreground sm:block">{description}</p>
        </div>
        <div className="ml-auto flex items-center gap-1 md:hidden">
          <NotificationBell compact />
          <Button size="sm" onClick={() => void newTicket("pick")}><Plus />New</Button>
        </div>
      </header>
      <div className="md:hidden"><RunningTimer /></div>
      {error ? (
        <ErrorState title="We couldn't load the board" message={(error as Error).message} onRetry={() => void refetch()} />
      ) : isLoading || !board ? (
        <div className="flex flex-1 flex-col gap-4" aria-busy>
          <div className="flex gap-2">{[44, 16, 18, 16, 14].map((w, i) => <Skeleton key={i} className="h-8 rounded-lg" style={{ width: `${w * 4}px` }} />)}</div>
          <BrandLoader />
        </div>
      ) : (
        <>
          <Suspense fallback={null}><ViewTabs /></Suspense>
          <FilterBar board={board} hideDoneToggle={hideDoneToggle} />
          {children(board, tickets)}
        </>
      )}
    </div>
  );
}
