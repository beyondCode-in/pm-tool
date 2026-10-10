import type React from "react";
import type { Board, Field, FieldName, Iteration, Option, Ticket } from "./types";

export const singleField = (b: Board, name: string) => b.fields.find((f): f is Extract<Field, { kind: "single" }> => f.name === name && f.kind === "single");
export const iterationField = (b: Board, name = "Sprint") => b.fields.find((f): f is Extract<Field, { kind: "iteration" }> => f.name === name && f.kind === "iteration");
export const options = (b: Board, name: string): Option[] => singleField(b, name)?.options ?? [];
export const hasField = (b: Board, name: FieldName) => b.fields.some((f) => f.name === name);

// Parent/child links compare URLs when known, so same-numbered issues from
// different repositories on one board are never confused.
export const isChildOf = (c: Ticket, p: Ticket) => (c.parentUrl ? c.parentUrl === p.url : c.parent === p.number && c.repo === p.repo);
export const parentOf = (b: Board, t: Ticket) => b.tickets.find((p) => isChildOf(t, p)) ?? null;
export const childrenOf = (b: Board, t: Ticket) => b.tickets.filter((c) => isChildOf(c, t));
export const byUrl = (b: Board, url: string) => b.tickets.find((x) => x.url === url) ?? null;

export const isDone = (t: Ticket) => t.state === "CLOSED" || /done/i.test(t.fields.Status ?? "");
export const isDoneStatus = (s?: string) => /done/i.test(s ?? "");

// Strip a leading emoji: "🟠 High" → "High".
export const plain = (s?: string | null) => (s ?? "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
export const emojiOf = (s?: string | null) => (s ?? "").match(/^[^\p{L}\p{N}\s]+/u)?.[0] ?? "";

const PRIORITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
export const priorityRank = (t: Ticket) => PRIORITY_RANK[plain(t.fields.Priority).toLowerCase()] ?? 4;

// GitHub project option colours → token classes (dot + soft background).
const COLOR: Record<string, string> = {
  GRAY: "bg-zinc-400", BLUE: "bg-blue-500", GREEN: "bg-emerald-500", YELLOW: "bg-amber-400",
  ORANGE: "bg-orange-500", RED: "bg-red-500", PINK: "bg-pink-500", PURPLE: "bg-violet-500",
};
export const dotClass = (color?: string) => COLOR[color ?? "GRAY"] ?? COLOR.GRAY;

// Tag tint for a GitHub option colour: [hue, chroma] in OKLCH.
const TINT: Record<string, [number, number]> = {
  GRAY: [70, 0.02], BLUE: [255, 0.16], GREEN: [155, 0.15], YELLOW: [85, 0.15],
  ORANGE: [55, 0.17], RED: [25, 0.2], PINK: [350, 0.18], PURPLE: [300, 0.18],
};
export const tint = (color?: string) => {
  const [h, c] = TINT[color ?? "GRAY"] ?? TINT.GRAY;
  return { "--h": h, "--c": c } as React.CSSProperties;
};
export const optionColor = (b: Board, field: string, name?: string) => options(b, field).find((o) => o.name === name)?.color;

export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * 864e5).toISOString().slice(0, 10);
export const sprintEnd = (it: Iteration) => addDays(it.startDate, it.duration - 1);

export function currentSprint(b: Board, on = today()): Iteration | null {
  return iterationField(b)?.iterations.find((it) => it.startDate <= on && on <= sprintEnd(it)) ?? null;
}
export const sprintById = (b: Board, id?: string) => iterationField(b)?.iterations.find((it) => it.id === id) ?? null;

export const typeOf = (t: Ticket) => plain(t.fields["Ticket Type"]) || (t.labels.some((l) => l.name === "epic") ? "Epic" : "");
export const isEpic = (t: Ticket) => typeOf(t) === "Epic";
export const isOverdue = (t: Ticket) => !isDone(t) && !!t.fields["Target date"] && t.fields["Target date"]! < today();

// ── Filtering (shared by every view, stored in the URL) ────────────────────
export type Filters = { q: string; type: string[]; priority: string[]; assignee: string[]; label: string[]; showDone: boolean };
export const emptyFilters: Filters = { q: "", type: [], priority: [], assignee: [], label: [], showDone: true };

export function applyFilters(tickets: Ticket[], f: Filters): Ticket[] {
  const q = f.q.trim().toLowerCase();
  return tickets.filter((t) => {
    if (!f.showDone && isDone(t)) return false;
    if (q && !(`#${t.number} ${t.title}`.toLowerCase().includes(q) || t.labels.some((l) => l.name.includes(q)))) return false;
    if (f.type.length && !f.type.includes(t.fields["Ticket Type"] ?? "")) return false;
    if (f.priority.length && !f.priority.includes(t.fields.Priority ?? "")) return false;
    if (f.assignee.length && !f.assignee.some((a) => (a === "__none" ? t.assignees.length === 0 : t.assignees.some((p) => p.login === a)))) return false;
    if (f.label.length && !f.label.every((l) => t.labels.some((x) => x.name === l))) return false;
    return true;
  });
}

export const byPriorityThenNumber = (a: Ticket, b: Ticket) => priorityRank(a) - priorityRank(b) || b.number - a.number;
