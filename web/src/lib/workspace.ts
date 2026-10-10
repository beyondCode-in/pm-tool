"use client";

import { useSyncExternalStore } from "react";
import type { Board } from "./types";

// Workflow rules for a board. Nothing here is fixed: every default is worked
// out from the board's own fields and options, and anything can be changed in
// Settings → Workflow. Overrides are stored per board, in this browser.

export type Workspace = {
  /** Status options that count as finished (moving there closes the ticket). */
  done: string[];
  /** Status a new ticket starts in. */
  start: string | null;
  /** Work-in-progress limit per status; missing = no limit. */
  wip: Record<string, number>;
  /** Ticket type used by quick add (board columns, calendar). */
  quickType: string | null;
  /** Priority options treated as urgent (dashboard, highlights). */
  urgent: string[];
  /** Tag prefixes shown on cards, e.g. "area" shows "area: billing". */
  cardTags: string[];
  /** Board fields mirrored as tags so GitHub forms and automation agree. */
  tagSync: Record<string, string>;
  /** Number field that holds total hours logged, if the board has one. */
  timeField: string | null;
  /** How far ahead "due soon" looks, in days. */
  dueSoonDays: number;
  /** Confetti when something reaches a done status. */
  celebrate: boolean;
};

const DONE = /done|closed|complete|shipped|released|resolved/i;
const START = /backlog|todo|to do|new|open|inbox/i;
const TASK = /task|chore/i;
const TIME = /time|hours|spent/i;

let board: Board | null = null;
const listeners = new Set<() => void>();
const key = () => `beyondpm.workspace.${board?.projectId ?? "none"}`;
const cache = new Map<string, string>();

const opts = (b: Board, name: string) => {
  const f = b.fields.find((x) => x.name === name && x.kind === "single");
  return f && f.kind === "single" ? f.options.map((o) => o.name) : [];
};

/** The defaults for a board, read from its fields. */
export function defaults(b: Board | null): Workspace {
  if (!b) return { done: [], start: null, wip: {}, quickType: null, urgent: [], cardTags: [], tagSync: {}, timeField: null, dueSoonDays: 7, celebrate: true };
  const statuses = opts(b, "Status");
  const types = opts(b, "Ticket Type");
  const priorities = opts(b, "Priority");
  const done = statuses.filter((s) => DONE.test(s));
  const prefixes = [...new Set(b.labels.map((l) => /^([\w-]+):\s/.exec(l.name)?.[1]).filter((x): x is string => !!x))];
  const tagSync: Record<string, string> = {};
  for (const f of b.fields) if (f.kind === "single" && prefixes.includes(f.name.toLowerCase())) tagSync[f.name] = f.name.toLowerCase();
  return {
    done: done.length ? done : statuses.slice(-1),
    start: statuses.find((s) => START.test(s)) ?? statuses[0] ?? null,
    wip: {},
    quickType: types.find((t) => TASK.test(t)) ?? types[0] ?? null,
    urgent: priorities.slice(0, 1),
    cardTags: prefixes.filter((p) => !Object.values(tagSync).includes(p)),
    tagSync,
    timeField: b.fields.find((f) => f.kind === "number" && TIME.test(f.name))?.name ?? null,
    dueSoonDays: 7,
    celebrate: true,
  };
}

function overrides(): Partial<Workspace> {
  const k = key();
  if (!cache.has(k)) { try { cache.set(k, localStorage.getItem(k) ?? "{}"); } catch { cache.set(k, "{}"); } }
  try { return JSON.parse(cache.get(k)!) as Partial<Workspace>; } catch { return {}; }
}

/** Current rules for the loaded board (defaults + your changes). */
export function workspace(): Workspace {
  return { ...defaults(board), ...overrides() };
}

/** Called whenever the board loads, so the rules follow its fields. */
export function bindBoard(b: Board) {
  if (board === b) return;
  board = b;
  listeners.forEach((l) => l());
}

export function setWorkspace(patch: Partial<Workspace>) {
  const next = JSON.stringify({ ...overrides(), ...patch });
  cache.set(key(), next);
  try { localStorage.setItem(key(), next); } catch { /* per-browser only */ }
  listeners.forEach((l) => l());
}

export function resetWorkspace() {
  cache.set(key(), "{}");
  try { localStorage.removeItem(key()); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function useWorkspace(): Workspace & { customised: boolean } {
  const snap = useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => { overrides(); return `${key()}|${board?.fields.length}|${board?.labels.length}|${cache.get(key())}`; },
    () => "",
  );
  void snap;
  return { ...workspace(), customised: Object.keys(overrides()).length > 0 };
}

// ── Helpers the rest of the app uses ───────────────────────────────────

export const isDoneStatus = (s?: string | null) => {
  if (!s) return false;
  const w = workspace();
  return board ? w.done.includes(s) : DONE.test(s);
};

/** Position of a priority in the board's own option order (first = highest). */
export const priorityIndex = (p?: string | null) => {
  if (!p || !board) return 99;
  const i = opts(board, "Priority").indexOf(p);
  return i < 0 ? 99 : i;
};

export const isUrgent = (p?: string | null) => !!p && workspace().urgent.includes(p);
export const wipLimit = (status?: string | null) => (status ? workspace().wip[status] : undefined);

/** How many priority options the board has (for ranking icons by position). */
export const priorityCount = () => (board ? opts(board, "Priority").length : 0);
