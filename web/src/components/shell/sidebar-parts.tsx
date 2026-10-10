"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { isDone, isOverdue, today } from "@/lib/board";
import { config } from "@/lib/config";
import { useBoard, useSource } from "@/lib/data";
import { currentTenant, shareLink } from "@/lib/tenant";
import { cn } from "@/lib/utils";
import { ArrowRightLeft, ExternalLink, Link2, Settings } from "@/components/icons";
import * as P from "@phosphor-icons/react";
import Link from "next/link";
import { toast } from "sonner";
import { LogoMark } from "../brand/logo";

// The expanded sidebar's own pieces: a workspace card at the top, a "today"
// strip, and a profile card at the bottom.

export function WorkspaceCard() {
  const { data: board } = useBoard();
  const source = useSource();
  const t = currentTenant();
  const title = board?.projectTitle ?? "Loading…";
  const where = source?.mode === "demo" ? "Demo workspace" : t ? `${t.owner} · #${t.project}` : "GitHub board";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<button className="ws-card group/ws flex w-full min-w-0 items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors" aria-label={`Workspace: ${title}. Open workspace menu`} />}>
        <span className="relative shrink-0"><LogoMark size={30} /></span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13.5px] font-semibold tracking-tight">{title}</span>
          <span className="block truncate text-[11px] text-muted-foreground">{where}</span>
        </span>
        <P.CaretUpDown size={14} weight="bold" className="shrink-0 text-muted-foreground transition-colors group-hover/ws:text-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-64">
        <DropdownMenuLabel>Workspace</DropdownMenuLabel>
        <div className="flex items-center gap-2.5 px-2.5 pb-2">
          <LogoMark size={34} />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="truncate text-xs text-muted-foreground">{where}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings/" />}><Settings />Settings</DropdownMenuItem>
        {source?.mode === "github" && t && (
          <DropdownMenuItem onClick={() => { void navigator.clipboard?.writeText(shareLink(window.location.origin, config.basePath, t)); toast.success("Board link copied", { description: "Teammates with access open straight into this board." }); }}>
            <Link2 />Copy board link
          </DropdownMenuItem>
        )}
        {source?.mode === "github" && t && <DropdownMenuItem render={<a href={`https://github.com/orgs/${t.owner}/projects/${t.project}`} target="_blank" rel="noreferrer" />}><ExternalLink />Open on GitHub</DropdownMenuItem>}
        {source?.mode === "github" && !config.pinned && <DropdownMenuItem onClick={() => window.location.assign(`${config.basePath}/connect/`)}><ArrowRightLeft />Switch board…</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// "Today" at a glance: your tickets due today and overdue.
export function TodayStrip() {
  const { data: board } = useBoard();
  if (!board) return null;
  const me = board.viewer.login;
  const mine = board.tickets.filter((t) => !isDone(t) && t.assignees.some((a) => a.login === me));
  const dueToday = mine.filter((t) => t.fields["Target date"] === today()).length;
  const overdue = mine.filter(isOverdue).length;
  return (
    <Link href="/home/" className="today-strip flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs transition-[transform,box-shadow] hover:-translate-y-px">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-background/70 text-primary shadow-xs"><P.SunHorizon size={16} weight="duotone" /></span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block font-semibold text-foreground">Today</span>
        <span className="block truncate text-muted-foreground">
          {dueToday || overdue ? <>{dueToday} due{overdue > 0 && <> · <span className="font-medium text-destructive">{overdue} overdue</span></>}</> : "You're clear"}
        </span>
      </span>
      <P.CaretRight size={12} weight="bold" className="text-muted-foreground" />
    </Link>
  );
}

export function SyncLine({ className }: { className?: string }) {
  const { dataUpdatedAt, isFetching, refetch } = useBoard();
  const source = useSource();
  const text = source?.mode === "demo" ? "Demo · not saved" : isFetching ? "Syncing…" : dataUpdatedAt ? "Synced with GitHub" : "Connecting…";
  return (
    <button onClick={() => void refetch()} title={dataUpdatedAt ? `Last synced ${new Date(dataUpdatedAt).toLocaleTimeString()} · click to refresh` : "Refresh"}
      className={cn("flex min-w-0 items-center gap-1 truncate text-[11px] text-muted-foreground hover:text-foreground", className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", source?.mode === "demo" ? "bg-amber-500" : "bg-emerald-500", isFetching && "animate-pulse")} aria-hidden />
      {text}
    </button>
  );
}

export { Button };
