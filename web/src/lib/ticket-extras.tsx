"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useSource } from "./data";
import type { Board, Ticket } from "./types";

const message = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");

// ── Relationships, attachments and time ─────────────────────────────────

export function useDependencies(t: Ticket | null) {
  const source = useSource();
  return useQuery({
    queryKey: ["deps", t?.url],
    enabled: !!source && !!t,
    queryFn: () => source!.dependencies(t!),
    refetchInterval: false,
  });
}

export function useTicketExtras() {
  const source = useSource();
  const qc = useQueryClient();
  const refreshBoard = () => qc.invalidateQueries({ queryKey: ["board"] });
  const refreshDeps = (t: Ticket) => qc.invalidateQueries({ queryKey: ["deps", t.url] });
  const refreshComments = (t: Ticket) => qc.invalidateQueries({ queryKey: ["comments", t.url] });

  async function attempt<T>(work: () => Promise<T>, done: string, after: () => unknown): Promise<T | null> {
    try {
      const r = await work();
      toast.success(done);
      await after();
      return r;
    } catch (e) {
      toast.error(message(e), { duration: 10000 });
      return null;
    }
  }

  return {
    addBlocker: (t: Ticket, blocker: Ticket) =>
      attempt(() => source!.addBlocker(t, blocker), `#${t.number} is now blocked by #${blocker.number}`, () => Promise.all([refreshDeps(t), refreshDeps(blocker)])),
    removeBlocker: (t: Ticket, blocker: Ticket) =>
      attempt(() => source!.removeBlocker(t, blocker), `#${blocker.number} no longer blocks #${t.number}`, () => Promise.all([refreshDeps(t), refreshDeps(blocker)])),
    // "t blocks other" is stored on the other ticket as "blocked by t".
    addBlocking: (t: Ticket, other: Ticket) =>
      attempt(() => source!.addBlocker(other, t), `#${t.number} now blocks #${other.number}`, () => Promise.all([refreshDeps(t), refreshDeps(other)])),
    setParent: (t: Ticket, parent: Ticket | null, current: Ticket | null) =>
      attempt(() => source!.setParent(t, parent, current), parent ? `#${t.number} moved under #${parent.number}` : `#${t.number} is no longer a sub-task`, refreshBoard),
    attach: (t: Ticket, file: File) =>
      attempt(() => source!.attach(t, file), `Attached ${file.name}`, () => Promise.all([refreshComments(t), refreshBoard()])),
    logTime: (b: Board, t: Ticket, minutes: number, note: string) =>
      attempt(() => source!.logTime(b, t, minutes, note), `Logged ${fmtMinutes(minutes)} on #${t.number}`, () => Promise.all([refreshComments(t), refreshBoard()])),
  };
}

// ── One running timer per browser ───────────────────────────────────────

type Running = { ticket: number; title: string; startedAt: number } | null;
const KEY = "beyondpm.timer";
const listeners = new Set<() => void>();
let raw: string | null = null;
const read = () => {
  if (raw === null) { try { raw = localStorage.getItem(KEY) ?? "null"; } catch { raw = "null"; } }
  return raw;
};
const write = (v: Running) => {
  raw = JSON.stringify(v);
  try { localStorage.setItem(KEY, raw); } catch { /* per-browser only */ }
  listeners.forEach((l) => l());
};

export const startTimer = (t: Ticket) => write({ ticket: t.number, title: t.title, startedAt: Date.now() });
export const stopTimer = () => write(null);
export function useTimer(): Running {
  const s = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, read, () => "null");
  return JSON.parse(s) as Running;
}

export const fmtMinutes = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);
export const fmtElapsed = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${h ? `${h}:` : ""}${String(m).padStart(h ? 2 : 1, "0")}:${String(sec).padStart(2, "0")}`;
};

// ── Tags (labels) ───────────────────────────────────────────────────────
export function useLabelActions() {
  const source = useSource();
  const qc = useQueryClient();
  const run = async (work: () => Promise<void>, done: string) => {
    try { await work(); toast.success(done); await qc.invalidateQueries({ queryKey: ["board"] }); return true; }
    catch (e) { toast.error(message(e), { duration: 10000 }); return false; }
  };
  return {
    create: (l: { name: string; color: string; description?: string }) => run(() => source!.createLabel(l), `Created tag "${l.name}"`),
    update: (name: string, p: { name?: string; color?: string; description?: string }) => run(() => source!.updateLabel(name, p), `Saved tag "${p.name ?? name}"`),
    remove: (name: string) => run(() => source!.deleteLabel(name), `Deleted tag "${name}"`),
  };
}
