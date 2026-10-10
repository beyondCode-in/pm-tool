"use client";

import { cn } from "@/lib/utils";
import { dotClass, emojiOf, isOverdue, plain } from "@/lib/board";
import type { Board, Person, Ticket } from "@/lib/types";
import { AlertTriangle, Calendar, MessageSquare, GitBranch } from "lucide-react";
import { format, parseISO } from "date-fns";

export function Avatar({ person, size = 24, className }: { person: Person; size?: number; className?: string }) {
  const initials = (person.name || person.login).split(/[\s-_]+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const hue = [...person.login].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
  return person.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={person.avatarUrl} alt="" width={size} height={size} title={person.name || person.login}
      className={cn("rounded-full ring-2 ring-background object-cover", className)} style={{ width: size, height: size }} />
  ) : (
    <span title={person.name || person.login} aria-hidden
      className={cn("inline-grid place-items-center rounded-full ring-2 ring-background font-semibold text-white", className)}
      style={{ width: size, height: size, fontSize: size * 0.4, background: `oklch(0.6 0.13 ${hue})` }}>
      {initials}
    </span>
  );
}

export function AvatarStack({ people, max = 3, size = 22 }: { people: Person[]; max?: number; size?: number }) {
  if (!people.length) return null;
  return (
    <span className="flex -space-x-1.5" aria-label={`Assigned to ${people.map((p) => p.name || p.login).join(", ")}`}>
      {people.slice(0, max).map((p) => <Avatar key={p.login} person={p} size={size} />)}
      {people.length > max && <span className="grid place-items-center rounded-full bg-muted text-[10px] font-semibold ring-2 ring-background" style={{ width: size, height: size }}>+{people.length - max}</span>}
    </span>
  );
}

// Option with its board colour. Colour is never the only signal: the name is always shown.
export function OptionPill({ board, field, value, compact }: { board: Board; field: string; value?: string; compact?: boolean }) {
  if (!value) return null;
  const color = board.fields.find((f) => f.name === field && f.kind === "single");
  const c = color && color.kind === "single" ? color.options.find((o) => o.name === value)?.color : undefined;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border bg-background/60 px-1.5 py-0.5 text-xs font-medium whitespace-nowrap">
      <span className={cn("size-1.5 rounded-full", dotClass(c))} aria-hidden />
      {compact ? plain(value) : value}
    </span>
  );
}

export function TypeIcon({ ticket }: { ticket: Ticket }) {
  const e = emojiOf(ticket.fields["Ticket Type"]) || "📄";
  return <span aria-label={plain(ticket.fields["Ticket Type"]) || "Ticket"} className="text-[13px] leading-none">{e}</span>;
}

export function PriorityMark({ value }: { value?: string }) {
  const p = plain(value).toLowerCase();
  const bars = { critical: 4, high: 3, medium: 2, low: 1 }[p] ?? 0;
  if (!bars) return null;
  return (
    <span title={`Priority: ${plain(value)}`} className="inline-flex items-end gap-px" aria-label={`Priority ${plain(value)}`}>
      {p === "critical" ? <AlertTriangle className="size-3.5 text-destructive" /> : [1, 2, 3].map((i) => (
        <span key={i} className={cn("w-[3px] rounded-sm", i <= bars ? "bg-foreground/70" : "bg-foreground/15")} style={{ height: 4 + i * 3 }} />
      ))}
    </span>
  );
}

export function LabelChip({ name, color }: { name: string; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
      <span className="size-1.5 rounded-full" style={{ background: `#${color ?? "999"}` }} aria-hidden />
      {name}
    </span>
  );
}

export const shortDate = (iso?: string | null) => (iso ? format(parseISO(iso), "d MMM") : "");

export function TicketMeta({ ticket }: { ticket: Ticket }) {
  const due = ticket.fields["Target date"];
  return (
    <span className="flex items-center gap-2.5 text-xs text-muted-foreground">
      {due && (
        <span className={cn("inline-flex items-center gap-1", isOverdue(ticket) && "font-semibold text-destructive")}>
          <Calendar className="size-3" aria-hidden />
          <span>{isOverdue(ticket) ? "Overdue · " : ""}{shortDate(due)}</span>
        </span>
      )}
      {ticket.subIssues.total > 0 && (
        <span className="inline-flex items-center gap-1" title="Sub-tasks done">
          <GitBranch className="size-3" aria-hidden />{ticket.subIssues.completed}/{ticket.subIssues.total}
        </span>
      )}
      {ticket.commentCount > 0 && (
        <span className="inline-flex items-center gap-1" title="Comments"><MessageSquare className="size-3" aria-hidden />{ticket.commentCount}</span>
      )}
    </span>
  );
}

// Title without the "[Bug] " prefix the forms add; the type icon says it already.
export const cleanTitle = (title: string) => title.replace(/^\[[^\]]+\]:?\s*/, "");
