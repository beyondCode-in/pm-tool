"use client";

import { useSyncExternalStore } from "react";

// Starred tickets (ClickUp's Favorites), kept per browser and keyed by URL so
// tickets from different repositories never clash.
const KEY = "beyondpm.favorites";
const listeners = new Set<() => void>();
let raw: string | null = null;

const read = () => {
  if (raw === null) { try { raw = localStorage.getItem(KEY) ?? "[]"; } catch { raw = "[]"; } }
  return raw;
};
const list = (): string[] => { try { return JSON.parse(read()) as string[]; } catch { return []; } };

export function toggleFavorite(url: string) {
  const now = list();
  raw = JSON.stringify(now.includes(url) ? now.filter((u) => u !== url) : [url, ...now]);
  try { localStorage.setItem(KEY, raw); } catch { /* per-browser only */ }
  listeners.forEach((l) => l());
}

export function useFavorites(): string[] {
  const s = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, read, () => "[]");
  try { return JSON.parse(s) as string[]; } catch { return []; }
}
