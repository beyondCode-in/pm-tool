"use client";

import { cn } from "@/lib/utils";
import { isOverdue, plain, tint } from "@/lib/board";
import { TypeGlyph, typeKey } from "./type-badge";
import type { Board, Person, Ticket } from "@/lib/types";
import { AlertTriangle, Calendar, MessageSquare, GitBranch } from "@/components/icons";
import { format, parseISO } from "date-fns";

export function Avatar({ person, size = 24, className }: { person: Person; size?: number; className?: string }) {
  const initials = ((person.name || person.login).match(/\p{L}+/gu) ?? ["?"]).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
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

// A board option as a tinted tag. The text is always shown, so colour is never the only signal.
// Names show without their emoji; the type is drawn by TypeGlyph instead.
export function Tag({ color, children, dot }: { color?: string; children: React.ReactNode; dot?: boolean }) {
  return <span className="tag" style={tint(color)}>{dot && <span className="tag-dot" aria-hidden />}{children}</span>;
}

export function OptionPill({ board, field, value }: { board: Board; field: string; value?: string; compact?: boolean }) {
  if (!value) return null;
  const f = board.fields.find((x) => x.name === field && x.kind === "single");
  const color = f && f.kind === "single" ? f.options.find((o) => o.name === value)?.color : undefined;
  return <Tag color={color} dot={field !== "Ticket Type"}>{plain(value)}</Tag>;
}

export function TypeIcon({ ticket, size = 18 }: { ticket: Ticket; size?: number }) {
  return <TypeGlyph kind={typeKey(ticket)} size={size} />;
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
