"use client";

// Status and priority icons, Linear-style: each stage has its own shape and
// hue so a glance tells you where work is, and the name is always shown
// next to it (colour is never the only signal). Built on Phosphor's duotone
// and fill weights for depth.
import * as P from "@phosphor-icons/react";
import { plain } from "@/lib/board";
import { cn } from "@/lib/utils";

type Meta = { icon: P.Icon; hue: number; chroma: number; weight: P.IconWeight; label: string };

const STATUS: [RegExp, Meta][] = [
  [/backlog|icebox|later/i, { icon: P.Tray, hue: 70, chroma: 0.03, weight: "duotone", label: "Backlog" }],
  [/todo|to do|ready|planned|selected/i, { icon: P.CircleDashed, hue: 245, chroma: 0.15, weight: "bold", label: "To do" }],
  [/progress|doing|develop|active/i, { icon: P.CircleHalfTilt, hue: 290, chroma: 0.19, weight: "duotone", label: "In progress" }],
  [/review|pr\b|approval/i, { icon: P.GitPullRequest, hue: 50, chroma: 0.17, weight: "duotone", label: "In review" }],
  [/qa|test|verify|staging/i, { icon: P.TestTube, hue: 85, chroma: 0.16, weight: "duotone", label: "Testing" }],
  [/block|hold|wait/i, { icon: P.Prohibit, hue: 25, chroma: 0.19, weight: "duotone", label: "Blocked" }],
  [/done|closed|complete|shipped|released/i, { icon: P.CheckCircle, hue: 150, chroma: 0.16, weight: "fill", label: "Done" }],
  [/won.?t|cancel|duplicate/i, { icon: P.XCircle, hue: 70, chroma: 0.02, weight: "fill", label: "Won't do" }],
];
const FALLBACK: Meta = { icon: P.Circle, hue: 70, chroma: 0.03, weight: "bold", label: "Status" };

export const statusMeta = (name?: string | null): Meta => STATUS.find(([re]) => re.test(name ?? ""))?.[1] ?? FALLBACK;

export function StatusIcon({ name, size = 16, className }: { name?: string | null; size?: number; className?: string }) {
  const m = statusMeta(name);
  const Icon = m.icon;
  return (
    <span className={cn("ico inline-grid shrink-0 place-items-center", className)} role="img" aria-label={plain(name) || m.label}
      style={{ color: `oklch(var(--icon-l, 0.58) ${m.chroma} ${m.hue})`, width: size, height: size }}>
      <Icon size={size} weight={m.weight} aria-hidden />
    </span>
  );
}

const PRIORITY: Record<string, Meta> = {
  critical: { icon: P.Fire, hue: 30, chroma: 0.21, weight: "fill", label: "Critical" },
  high: { icon: P.ArrowFatLinesUp, hue: 55, chroma: 0.18, weight: "fill", label: "High" },
  medium: { icon: P.Equals, hue: 85, chroma: 0.15, weight: "bold", label: "Medium" },
  low: { icon: P.ArrowFatLinesDown, hue: 240, chroma: 0.12, weight: "duotone", label: "Low" },
};

export function PriorityIcon({ value, size = 15, className }: { value?: string | null; size?: number; className?: string }) {
  const key = plain(value).toLowerCase();
  const m = PRIORITY[key];
  if (!m) return null;
  const Icon = m.icon;
  return (
    <span className={cn("ico inline-grid shrink-0 place-items-center", key === "critical" && "ico-hot", className)} role="img" aria-label={`Priority ${m.label}`} title={`Priority: ${m.label}`}
      style={{ color: `oklch(var(--icon-l, 0.6) ${m.chroma} ${m.hue})`, width: size, height: size }}>
      <Icon size={size} weight={m.weight} aria-hidden />
    </span>
  );
}
