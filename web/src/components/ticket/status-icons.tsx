"use client";

// Status and priority icons, Linear-style: each stage has its own shape and
// hue so a glance tells you where work is, and the name is always shown
// next to it (colour is never the only signal). Built on Phosphor's duotone
// and fill weights for depth.
import * as P from "@phosphor-icons/react";
import { plain } from "@/lib/board";
import { cn } from "@/lib/utils";
import { priorityCount, priorityIndex } from "@/lib/workspace";

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

// Priority icons follow the option's position on the board (first = most
// urgent), so any naming works: Critical/High/…, P0–P3, Urgent/Normal, etc.
const LEVELS: Meta[] = [
  { icon: P.Fire, hue: 30, chroma: 0.21, weight: "fill", label: "Top" },
  { icon: P.ArrowFatLinesUp, hue: 55, chroma: 0.18, weight: "fill", label: "High" },
  { icon: P.Equals, hue: 85, chroma: 0.15, weight: "bold", label: "Middle" },
  { icon: P.ArrowFatLinesDown, hue: 240, chroma: 0.12, weight: "duotone", label: "Low" },
];
function priorityLevel(value?: string | null): { m: Meta; top: boolean } | null {
  if (!value) return null;
  const i = priorityIndex(value), n = priorityCount();
  if (i === 99 || !n) return null;
  // Spread the board's options over the four looks: first and last are fixed.
  const level = n === 1 ? 0 : i === 0 ? 0 : i === n - 1 ? 3 : Math.min(2, Math.max(1, Math.round((i / (n - 1)) * 3)));
  return { m: LEVELS[level], top: level === 0 };
}

export function PriorityIcon({ value, size = 15, className }: { value?: string | null; size?: number; className?: string }) {
  const lv = priorityLevel(value);
  if (!lv) return null;
  const Icon = lv.m.icon;
  const name = plain(value);
  return (
    <span className={cn("ico inline-grid shrink-0 place-items-center", lv.top && "ico-hot", className)} role="img" aria-label={`Priority ${name}`} title={`Priority: ${name}`}
      style={{ color: `oklch(var(--icon-l, 0.6) ${lv.m.chroma} ${lv.m.hue})`, width: size, height: size }}>
      <Icon size={size} weight={lv.m.weight} aria-hidden />
    </span>
  );
}

// ClickUp-style filled status pill: the stage's colour, its icon and name.
export function StatusPill({ name, count, className }: { name?: string | null; count?: number; className?: string }) {
  const m = statusMeta(name);
  const Icon = m.icon;
  const c = Math.max(m.chroma, 0.06);
  return (
    <span className={cn("status-pill inline-flex min-w-0 items-center gap-1.5 rounded-md px-2 py-[3px] text-[11px] font-semibold tracking-wide uppercase", className)}
      style={{ ["--pill-h" as string]: m.hue, ["--pill-c" as string]: c }}>
      <Icon size={13} weight={m.weight === "fill" ? "fill" : "bold"} aria-hidden className="shrink-0" />
      <span className="truncate">{plain(name) || "No status"}</span>
      {count !== undefined && <span className="tabular opacity-80">{count}</span>}
    </span>
  );
}
