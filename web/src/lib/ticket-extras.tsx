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
    queryKey: ["deps", t?.number],
    enabled: !!source && !!t,
    queryFn: () => source!.dependencies(t!),
    refetchInterval: false,
  });
}

export function useTicketExtras() {
  const source = useSource();
  const qc = useQueryClient();
  const refreshBoard = () => qc.invalidateQueries({ queryKey: ["board"] });
  const refreshDeps = (n: number) => qc.invalidateQueries({ queryKey: ["deps", n] });
  const refreshComments = (n: number) => qc.invalidateQueries({ queryKey: ["comments", n] });

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
    addBlocker: (t: Ticket, blocker: number) =>
      attempt(() => source!.addBlocker(t, blocker), `#${t.number} is now blocked by #${blocker}`, () => Promise.all([refreshDeps(t.number), refreshDeps(blocker)])),
    removeBlocker: (t: Ticket, blocker: number) =>
      attempt(() => source!.removeBlocker(t, blocker), `#${blocker} no longer blocks #${t.number}`, () => Promise.all([refreshDeps(t.number), refreshDeps(blocker)])),
    // "t blocks other" is stored on the other ticket as "blocked by t".
    addBlocking: (t: Ticket, other: Ticket) =>
      attempt(() => source!.addBlocker(other, t.number), `#${t.number} now blocks #${other.number}`, () => Promise.all([refreshDeps(t.number), refreshDeps(other.number)])),
    setParent: (t: Ticket, parent: number | null) =>
      attempt(() => source!.setParent(t, parent), parent ? `#${t.number} moved under #${parent}` : `#${t.number} is no longer a sub-task`, refreshBoard),
    attach: (t: Ticket, file: File) =>
      attempt(() => source!.attach(t, file), `Attached ${file.name}`, () => Promise.all([refreshComments(t.number), refreshBoard()])),
    logTime: (b: Board, t: Ticket, minutes: number, note: string) =>
      attempt(() => source!.logTime(b, t, minutes, note), `Logged ${fmtMinutes(minutes)} on #${t.number}`, () => Promise.all([refreshComments(t.number), refreshBoard()])),
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
