"use client";

import { useSyncExternalStore } from "react";

// Reminders (ClickUp's "R"): a note to yourself at a time, optionally tied to
// a ticket. Kept in this browser; when one comes due the app shows it (and a
// system notification if allowed).

export type Reminder = { id: string; text: string; at: string; ticket?: number; ticketTitle?: string; done: boolean; fired: boolean; createdAt: string };

const KEY = "beyondpm.reminders";
const listeners = new Set<() => void>();
let raw: string | null = null;
const read = () => { if (raw === null) { try { raw = localStorage.getItem(KEY) ?? "[]"; } catch { raw = "[]"; } } return raw; };
const all = (): Reminder[] => { try { return JSON.parse(read()) as Reminder[]; } catch { return []; } };
const save = (list: Reminder[]) => {
  raw = JSON.stringify(list.slice(-200));
  try { localStorage.setItem(KEY, raw); } catch { /* per-browser only */ }
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

export function useReminders(): Reminder[] {
  const s = useSyncExternalStore(subscribe, read, () => "[]");
  try { return (JSON.parse(s) as Reminder[]).slice().sort((a, b) => a.at.localeCompare(b.at)); } catch { return []; }
}
export const allReminders = all;

export function addReminder(r: Omit<Reminder, "id" | "done" | "fired" | "createdAt">) {
  save([...all(), { ...r, id: crypto.randomUUID(), done: false, fired: false, createdAt: new Date().toISOString() }]);
}
export const completeReminder = (id: string) => save(all().map((r) => (r.id === id ? { ...r, done: true } : r)));
export const deleteReminder = (id: string) => save(all().filter((r) => r.id !== id));
export const markFired = (id: string) => save(all().map((r) => (r.id === id ? { ...r, fired: true } : r)));
export const snoozeReminder = (id: string, minutes: number) =>
  save(all().map((r) => (r.id === id ? { ...r, at: new Date(Date.now() + minutes * 60_000).toISOString(), fired: false } : r)));

// Quick times, ClickUp-style. Each returns an ISO timestamp.
const at = (d: Date, h: number, m = 0) => { const x = new Date(d); x.setHours(h, m, 0, 0); return x; };
export function quickTimes(now = new Date()): { label: string; at: Date }[] {
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const monday = new Date(now); monday.setDate(now.getDate() + (((8 - now.getDay()) % 7) || 7));
  const list = [
    { label: "In 20 minutes", at: new Date(now.getTime() + 20 * 60_000) },
    { label: "In 1 hour", at: new Date(now.getTime() + 60 * 60_000) },
    { label: "Later today · 5 pm", at: at(now, 17) },
    { label: "Tomorrow · 9 am", at: at(tomorrow, 9) },
    { label: "Next Monday · 9 am", at: at(monday, 9) },
  ];
  return list.filter((q) => q.at.getTime() > now.getTime() + 60_000);
}

// Which dialog is open, so R, the ticket menu and Home can all open it.
type Draft = { ticket?: number; ticketTitle?: string } | null;
const dlgListeners = new Set<() => void>();
let draft: Draft = null;
let draftKey = "null";
export function openReminder(d: { ticket?: number; ticketTitle?: string } = {}) { draft = d; draftKey = JSON.stringify(d); dlgListeners.forEach((l) => l()); }
export function closeReminder() { draft = null; draftKey = "null"; dlgListeners.forEach((l) => l()); }
export function useReminderDraft(): Draft {
  useSyncExternalStore((l) => { dlgListeners.add(l); return () => dlgListeners.delete(l); }, () => draftKey, () => "null");
  return draft;
}
