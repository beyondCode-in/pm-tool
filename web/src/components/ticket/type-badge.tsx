import { plain } from "@/lib/board";
import type { Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Bug, CircleHelp, FileText, FlaskConical, Headset, Layers, Lightbulb, type LucideIcon, Siren, Sparkles, SquareCheckBig,
} from "@/components/icons";

// One icon language for ticket types: a tinted tile (hue per type) with a
// line icon. Same shapes everywhere — cards, tables, drawer, wizard, palette.
export const TYPE_META: Record<string, { label: string; icon: LucideIcon; hue: number; chroma: number }> = {
  epic: { label: "Epic", icon: Layers, hue: 300, chroma: 0.16 },
  feature: { label: "Feature", icon: Sparkles, hue: 150, chroma: 0.14 },
  task: { label: "Task", icon: SquareCheckBig, hue: 245, chroma: 0.14 },
  bug: { label: "Bug", icon: Bug, hue: 25, chroma: 0.18 },
  incident: { label: "Incident", icon: Siren, hue: 15, chroma: 0.2 },
  support: { label: "Support", icon: Headset, hue: 55, chroma: 0.15 },
  question: { label: "Question", icon: CircleHelp, hue: 70, chroma: 0.05 },
  spike: { label: "Research", icon: FlaskConical, hue: 195, chroma: 0.12 },
  request: { label: "Request", icon: Lightbulb, hue: 80, chroma: 0.15 },
  ticket: { label: "Ticket", icon: FileText, hue: 70, chroma: 0.03 },
};

// A ticket's kind: specific tags win (incident, spike), then the board's type field.
export function typeKey(t: Ticket): string {
  const tags = new Set(t.labels.map((l) => l.name));
  if (tags.has("incident")) return "incident";
  if (tags.has("spike")) return "spike";
  const field = plain(t.fields["Ticket Type"]).toLowerCase();
  if (TYPE_META[field]) return field;
  for (const k of ["epic", "bug", "feature", "task", "support", "question", "request"]) if (tags.has(k)) return k;
  return "ticket";
}

export function TypeGlyph({ kind, size = 18, className }: { kind: string; size?: number; className?: string }) {
  const m = TYPE_META[kind] ?? TYPE_META.ticket;
  const Icon = m.icon;
  return (
    <span role="img" aria-label={m.label} title={m.label}
      className={cn("type-glyph inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), ["--h" as string]: m.hue, ["--c" as string]: m.chroma }}>
      <Icon style={{ width: size * 0.62, height: size * 0.62 }} strokeWidth={2.2} aria-hidden />
    </span>
  );
}
