"use client";

import { useSyncExternalStore } from "react";
import { isDone, isOverdue, plain, today } from "./board";
import type { Activity, Board, Person } from "./types";

// Notifications are derived on the device: each time the board refreshes we
// compare it with the last snapshot we saw and record what changed for this
// person. Stored per browser (capped), so they survive reloads. A shared,
// cross-device inbox needs the server version (see docs/BUILD-PROMPT.md).

export type NoticeKind = "assigned" | "status" | "comment" | "triage" | "due" | "overdue";
export type Notice = { id: string; kind: NoticeKind; ticket: number; title: string; text: string; at: string; read: boolean; later?: string; cleared?: boolean; actor?: Person | null };

type Snap = Record<string, { status?: string; assignees: string[]; comments: number; triage: boolean; state: string }>;
const KEY = "beyondpm.notifications";
const SNAP = "beyondpm.notify-snapshot";
const MAX = 80;
const listeners = new Set<() => void>();
let raw: string | null = null;

const load = (): Notice[] => {
  if (raw === null) { try { raw = localStorage.getItem(KEY) ?? "[]"; } catch { raw = "[]"; } }
  try { return JSON.parse(raw) as Notice[]; } catch { return []; }
};
const save = (list: Notice[]) => {
  raw = JSON.stringify(list.slice(0, MAX));
  try { localStorage.setItem(KEY, raw); } catch { /* per-browser only */ }
  listeners.forEach((l) => l());
};

export const markRead = (id: string) => save(load().map((n) => (n.id === id ? { ...n, read: true } : n)));
export const markAllRead = () => save(load().map((n) => ({ ...n, read: true })));
/** Clear moves notices to the Cleared tab (ClickUp); they can be brought back. */
export const clearAll = () => save(load().map((n) => ({ ...n, read: true, cleared: true, later: undefined })));
export const clearNotice = (id: string) => save(load().map((n) => (n.id === id ? { ...n, read: true, cleared: true, later: undefined } : n)));
export const restoreNotice = (id: string) => save(load().map((n) => (n.id === id ? { ...n, cleared: false } : n)));
/** Later: hide until 9 am tomorrow, then it comes back unread. */
export function laterNotice(id: string) {
  const t = new Date(); t.setDate(t.getDate() + 1); t.setHours(9, 0, 0, 0);
  save(load().map((n) => (n.id === id ? { ...n, read: true, later: t.toISOString() } : n)));
}
/** Bring back notices whose Later time has passed. */
export function wakeLater(now = Date.now()) {
  const list = load();
  if (!list.some((n) => n.later && Date.parse(n.later) <= now)) return;
  save(list.map((n) => (n.later && Date.parse(n.later) <= now ? { ...n, later: undefined, read: false } : n)));
}
export const isWaiting = (n: Notice, now: number) => !!n.later && Date.parse(n.later) > now;

export function useNotifications(): Notice[] {
  const s = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => { load(); return raw!; }, () => "[]");
  try { return JSON.parse(s) as Notice[]; } catch { return []; }
}

// "Watch everything": notify about every ticket, not only yours. Per browser.
const WATCH = "beyondpm.watch-all";
const CURSOR = "beyondpm.activity-since";
export const getWatchAll = () => { try { return localStorage.getItem(WATCH) === "1"; } catch { return false; } };
export const setWatchAll = (on: boolean) => { try { localStorage.setItem(WATCH, on ? "1" : "0"); } catch { /* ignore */ } listeners.forEach((l) => l()); };
export function useWatchAll() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, getWatchAll, () => false);
}

/** Where to read activity from: the last time we looked (first run: now, so there is no flood). */
export function activityCursor(): string {
  try { const c = localStorage.getItem(CURSOR); if (c) return c; const now = new Date().toISOString(); localStorage.setItem(CURSOR, now); return now; } catch { return new Date().toISOString(); }
}

// Turn what other people did into notices: on tickets you're assigned to or
// opened, when you're @mentioned or assigned, or on everything if you watch it all.
export function ingestActivity(board: Board, events: Activity[]) {
  const me = board.viewer.login;
  const all = getWatchAll();
  const existing = new Set(load().map((n) => n.id));
  const add: Notice[] = [];
  let newest = "";
  for (const e of events) {
    if (e.at > newest) newest = e.at;
    if (!e.actor || e.actor.login === me || existing.has(`act:${e.id}`)) continue;
    const t = board.tickets.find((x) => x.number === e.ticket);
    if (!t) continue;
    const mentioned = e.mentions?.some((m) => m.toLowerCase() === me.toLowerCase());
    const assignedMe = e.kind === "assigned" && e.assignee === me;
    const mine = t.assignees.some((a) => a.login === me) || t.author?.login === me;
    if (!(all || mine || mentioned || assignedMe)) continue;
    const kind: NoticeKind = assignedMe ? "assigned" : e.kind === "comment" ? "comment" : "status";
    const text = assignedMe ? "assigned it to you" : mentioned ? e.text.replace(/^commented/, "mentioned you") : e.text;
    add.push({ id: `act:${e.id}`, kind, ticket: t.number, title: `#${t.number} ${clean(t.title)}`, text, at: e.at, read: false, actor: e.actor });
  }
  if (newest) { try { localStorage.setItem(CURSOR, newest); } catch { /* ignore */ } }
  if (add.length) save([...add, ...load()].sort((a, b) => b.at.localeCompare(a.at)));
  return add;
}

const clean = (t: string) => t.replace(/^\[[^\]]+\]:?\s*/, "");

// Compare the board with the last snapshot and add notices for this person.
// With live activity (GitHub) assignments, moves and comments come from
// ingestActivity, with the person who did them; the diff only adds reminders.
export function digest(board: Board, live = false) {
  const me = board.viewer.login;
  let prev: Snap | null = null;
  try { prev = JSON.parse(localStorage.getItem(SNAP) || "null"); } catch { prev = null; }
  const next: Snap = {};
  const add: Notice[] = [];
  const now = new Date().toISOString();
  const existing = new Set(load().map((n) => n.id));
  const push = (n: Omit<Notice, "at" | "read">) => { if (!existing.has(n.id)) { add.push({ ...n, at: now, read: false }); existing.add(n.id); } };

  for (const t of board.tickets) {
    const assignees = t.assignees.map((a) => a.login);
    const triage = t.labels.some((l) => l.name === "triage");
    next[t.url] = { status: t.fields.Status, assignees, comments: t.commentCount, triage, state: t.state };
    const mine = assignees.includes(me) || t.author?.login === me;
    const was = prev?.[t.url];
    const title = `#${t.number} ${clean(t.title)}`;
    if (prev && was && !live) {
      if (assignees.includes(me) && !was.assignees.includes(me))
        push({ id: `assigned:${t.url}:${now.slice(0, 16)}`, kind: "assigned", ticket: t.number, title, text: "was assigned to you" });
      if (mine && was.status !== t.fields.Status && t.fields.Status)
        push({ id: `status:${t.url}:${t.fields.Status}`, kind: "status", ticket: t.number, title, text: `moved to ${plain(t.fields.Status)}` });
      if (mine && t.commentCount > was.comments)
        push({ id: `comment:${t.url}:${t.commentCount}`, kind: "comment", ticket: t.number, title, text: `has ${t.commentCount - was.comments} new comment${t.commentCount - was.comments === 1 ? "" : "s"}` });
    }
    if (prev && !was && triage && t.state === "OPEN")
      push({ id: `triage:${t.url}`, kind: "triage", ticket: t.number, title, text: "is new in the inbox" });
    // Daily reminders for your own open work.
    if (assignees.includes(me) && !isDone(t)) {
      if (isOverdue(t)) push({ id: `overdue:${t.url}:${today()}`, kind: "overdue", ticket: t.number, title, text: `is overdue (was due ${t.fields["Target date"]})` });
      else if (t.fields["Target date"] === today()) push({ id: `due:${t.url}:${today()}`, kind: "due", ticket: t.number, title, text: "is due today" });
    }
  }
  try { localStorage.setItem(SNAP, JSON.stringify(next)); } catch { /* ignore */ }
  if (add.length) save([...add, ...load()]);
  return add;
}
