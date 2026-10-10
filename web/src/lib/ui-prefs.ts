"use client";

import { useSyncExternalStore } from "react";

// Per-browser layout preferences (sidebar collapsed or not).
const KEY = "beyondpm.sidebar-collapsed";
const listeners = new Set<() => void>();
const read = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } };

export function toggleSidebar() {
  try { localStorage.setItem(KEY, read() ? "0" : "1"); } catch { /* preference only */ }
  listeners.forEach((l) => l());
}

export const useSidebarCollapsed = () =>
  useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, read, () => false);
