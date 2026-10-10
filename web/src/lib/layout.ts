"use client";

import { useSyncExternalStore } from "react";

// Personal layout for any area made of sections: their order, which are
// hidden, and which are collapsed. Stored per browser under its own key, so
// the ticket view, dashboard, board columns, table columns and sidebar can
// each be arranged independently. New sections (not yet in a saved order)
// are appended, and sections that no longer exist are dropped.

type Saved = { order: string[]; hidden: string[]; collapsed: string[] };
const EMPTY: Saved = { order: [], hidden: [], collapsed: [] };
const PREFIX = "beyondpm.layout.";
const listeners = new Map<string, Set<() => void>>();
const cache = new Map<string, string>();

function readRaw(key: string): string {
  if (!cache.has(key)) {
    let v = "";
    try { v = localStorage.getItem(PREFIX + key) ?? ""; } catch { /* storage blocked: defaults */ }
    cache.set(key, v);
  }
  return cache.get(key)!;
}

function write(key: string, s: Saved) {
  const raw = JSON.stringify(s);
  cache.set(key, raw);
  try { localStorage.setItem(PREFIX + key, raw); } catch { /* preference only */ }
  listeners.get(key)?.forEach((l) => l());
}

export type Layout = {
  order: string[];             // every known id, in display order
  visible: string[];           // order minus hidden
  isHidden: (id: string) => boolean;
  isCollapsed: (id: string) => boolean;
  toggleHidden: (id: string) => void;
  toggleCollapsed: (id: string) => void;
  setCollapsedAll: (collapsed: boolean) => void;
  move: (id: string, to: number) => void;       // to = index in `order`
  moveBy: (id: string, delta: number) => void;
  reset: () => void;
  customised: boolean;
};

export function useLayout(key: string, ids: string[], defaults: { hidden?: string[]; collapsed?: string[] } = {}): Layout {
  const raw = useSyncExternalStore(
    (l) => { if (!listeners.has(key)) listeners.set(key, new Set()); listeners.get(key)!.add(l); return () => listeners.get(key)!.delete(l); },
    () => readRaw(key),
    () => "",
  );
  let saved: Saved = { ...EMPTY, hidden: defaults.hidden ?? [], collapsed: defaults.collapsed ?? [] };
  try { if (raw) saved = { ...EMPTY, ...JSON.parse(raw) }; } catch { /* corrupt: defaults */ }

  const order = [...saved.order.filter((id) => ids.includes(id)), ...ids.filter((id) => !saved.order.includes(id))];
  const hidden = new Set(saved.hidden.filter((id) => ids.includes(id)));
  const collapsed = new Set(saved.collapsed);
  const save = (patch: Partial<Saved>) => write(key, { order, hidden: [...hidden], collapsed: [...collapsed], ...patch });

  const move = (id: string, to: number) => {
    const next = order.filter((x) => x !== id);
    next.splice(Math.max(0, Math.min(to, next.length)), 0, id);
    save({ order: next });
  };

  return {
    order,
    visible: order.filter((id) => !hidden.has(id)),
    isHidden: (id) => hidden.has(id),
    isCollapsed: (id) => collapsed.has(id),
    toggleHidden: (id) => { if (hidden.has(id)) hidden.delete(id); else hidden.add(id); save({ hidden: [...hidden] }); },
    toggleCollapsed: (id) => { if (collapsed.has(id)) collapsed.delete(id); else collapsed.add(id); save({ collapsed: [...collapsed] }); },
    setCollapsedAll: (c) => save({ collapsed: c ? [...ids] : [] }),
    move,
    moveBy: (id, delta) => move(id, order.indexOf(id) + delta),
    reset: () => write(key, { ...EMPTY, hidden: defaults.hidden ?? [], collapsed: defaults.collapsed ?? [] }),
    customised: raw !== "",
  };
}
