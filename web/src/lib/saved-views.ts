"use client";

import { useSyncExternalStore } from "react";

// Saved views (ClickUp's saved filters): a name for a view plus its filters,
// e.g. "My critical bugs" = Board + Me + Priority Critical + Type Bug.
// Kept per board in this browser.

export type SavedView = { id: string; name: string; path: string; query: string; createdAt: string };

const listeners = new Set<() => void>();
const cache = new Map<string, string>();
const key = (board: string) => `beyondpm.saved-views.${board}`;

function read(board: string): string {
  const k = key(board);
  if (!cache.has(k)) { try { cache.set(k, localStorage.getItem(k) ?? "[]"); } catch { cache.set(k, "[]"); } }
  return cache.get(k)!;
}
const parse = (raw: string): SavedView[] => { try { return JSON.parse(raw) as SavedView[]; } catch { return []; } };
function write(board: string, list: SavedView[]) {
  const raw = JSON.stringify(list);
  cache.set(key(board), raw);
  try { localStorage.setItem(key(board), raw); } catch { /* per-browser only */ }
  listeners.forEach((l) => l());
}

export function useSavedViews(board: string | undefined): SavedView[] {
  const raw = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => (board ? read(board) : "[]"), () => "[]");
  return parse(raw);
}

export function saveView(board: string, v: Omit<SavedView, "id" | "createdAt">) {
  const list = parse(read(board));
  const same = list.find((x) => x.name.toLowerCase() === v.name.toLowerCase());
  const next: SavedView = { ...v, id: same?.id ?? crypto.randomUUID(), createdAt: new Date().toISOString() };
  write(board, same ? list.map((x) => (x.id === same.id ? next : x)) : [...list, next]);
  return next;
}

export const deleteView = (board: string, id: string) => write(board, parse(read(board)).filter((x) => x.id !== id));
export const renameView = (board: string, id: string, name: string) => write(board, parse(read(board)).map((x) => (x.id === id ? { ...x, name } : x)));

/** The filter part of the current address (search, type, priority, people, tags, done, grouping). */
export const FILTER_KEYS = ["q", "type", "priority", "assignee", "label", "done", "group"];
export function filterQuery(search: string): string {
  const p = new URLSearchParams(search);
  return new URLSearchParams([...p].filter(([k]) => FILTER_KEYS.includes(k))).toString();
}
