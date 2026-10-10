"use client";

import { useSyncExternalStore } from "react";

// First-week checklist shown in the Guide. Each step is ticked the first time
// the person actually does it; progress lives in this browser only.
export const CHECKLIST = [
  { id: "tour", label: "Take the 30-second tour" },
  { id: "create", label: "Create your first ticket" },
  { id: "move", label: "Move a card to another stage" },
  { id: "filter", label: "Filter a view" },
  { id: "palette", label: "Jump somewhere with Ctrl K" },
  { id: "theme", label: "Pick your colour theme" },
] as const;
export type StepId = (typeof CHECKLIST)[number]["id"];

const KEY = "beyondpm.onboarding";
const listeners = new Set<() => void>();
let cache: string | null = null;

const read = () => {
  if (cache === null) { try { cache = localStorage.getItem(KEY) ?? "[]"; } catch { cache = "[]"; } }
  return cache;
};

export function markDone(id: StepId) {
  const done = new Set<string>(JSON.parse(read()));
  if (done.has(id)) return;
  done.add(id);
  cache = JSON.stringify([...done]);
  try { localStorage.setItem(KEY, cache); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function useOnboarding(): Set<string> {
  const raw = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, read, () => "[]");
  return new Set(JSON.parse(raw));
}
