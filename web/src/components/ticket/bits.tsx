"use client";

import { cn } from "@/lib/utils";
import { isOverdue, plain, tint } from "@/lib/board";
import { TypeGlyph, typeKey } from "./type-badge";
import { PriorityIcon, StatusIcon } from "./status-icons";
import type { Board, Person, Ticket } from "@/lib/types";
import { Calendar, MessageSquare, GitBranch } from "@/components/icons";
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

// The icon that goes with an option: status shape, priority mark or type tile.
export function OptionGlyph({ field, name, size = 13 }: { field: string; name?: string | null; size?: number }) {
  if (field === "Status") return <StatusIcon name={name} size={size} />;
  if (field === "Priority") return <PriorityIcon value={name} size={size} />;
  if (field === "Ticket Type") return <TypeGlyph kind={plain(name).toLowerCase()} size={size + 1} />;
  return null;
}
const hasGlyph = (field: string) => field === "Status" || field === "Priority" || field === "Ticket Type";

// A board option as a tinted tag with its icon (or a colour dot for other fields).
export function OptionLabel({ field, name, color }: { field: string; name: string; color?: string }) {
  return <Tag color={color} dot={!hasGlyph(field)}><OptionGlyph field={field} name={name} />{plain(name)}</Tag>;
}

export function OptionPill({ board, field, value }: { board: Board; field: string; value?: string; compact?: boolean }) {
  if (!value) return null;
  const f = board.fields.find((x) => x.name === field && x.kind === "single");
  const color = f && f.kind === "single" ? f.options.find((o) => o.name === value)?.color : undefined;
  return <OptionLabel field={field} name={value} color={color} />;
}

export function TypeIcon({ ticket, size = 18 }: { ticket: Ticket; size?: number }) {
  return <TypeGlyph kind={typeKey(ticket)} size={size} />;
}

export function PriorityMark({ value }: { value?: string }) {
  return <PriorityIcon value={value} size={15} />;
}

export function LabelChip({ name, color, onRemove }: { name: string; color?: string; onRemove?: () => void }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground whitespace-nowrap", onRemove && "pr-0.5")}
      style={{ background: `color-mix(in oklch, #${color ?? "999"} 12%, transparent)`, borderColor: `color-mix(in oklch, #${color ?? "999"} 35%, transparent)` }}>
      <span className="size-1.5 rounded-full" style={{ background: `#${color ?? "999"}` }} aria-hidden />
      {name}
      {onRemove && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} aria-label={`Remove tag ${name}`}
          className="grid size-4 place-items-center rounded-full text-muted-foreground hover:bg-destructive/15 hover:text-destructive">
          <svg viewBox="0 0 10 10" className="size-2" aria-hidden><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
      )}
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

// ClickUp-style priority chip: icon + name in a soft bordered pill.
export function PriorityChip({ value }: { value?: string }) {
  if (!value) return null;
  return (
    <span className="inline-flex h-[20px] items-center gap-1 rounded-md border bg-background/60 px-1.5 text-[11px] font-medium text-muted-foreground" title={`Priority: ${plain(value)}`}>
      <PriorityIcon value={value} size={12} />{plain(value)}
    </span>
  );
}
