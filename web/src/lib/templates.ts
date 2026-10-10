"use client";

import { useSyncExternalStore } from "react";
import { withRepeat } from "./recurring";
import type { FieldValues, NewTicket, Ticket } from "./types";

// Ticket templates (ClickUp's task templates): save any ticket's shape — title,
// description, checklist, tags, people and fields — and start new tickets
// from it. Kept per board in this browser. Dates and sprint aren't copied.

export type Template = { id: string; name: string; title: string; body: string; labels: string[]; assignees: string[]; fields: FieldValues; createdAt: string };

const KEEP: (keyof FieldValues)[] = ["Priority", "Ticket Type", "Size", "Component", "Story Points"];
const listeners = new Set<() => void>();
const cache = new Map<string, string>();
const key = (board: string) => `beyondpm.templates.${board}`;
const read = (board: string) => { const k = key(board); if (!cache.has(k)) { try { cache.set(k, localStorage.getItem(k) ?? "[]"); } catch { cache.set(k, "[]"); } } return cache.get(k)!; };
const parse = (raw: string): Template[] => { try { return JSON.parse(raw) as Template[]; } catch { return []; } };
const write = (board: string, list: Template[]) => {
  const raw = JSON.stringify(list);
  cache.set(key(board), raw);
  try { localStorage.setItem(key(board), raw); } catch { /* per-browser only */ }
  listeners.forEach((l) => l());
};

export function useTemplates(board: string | undefined): Template[] {
  const raw = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => (board ? read(board) : "[]"), () => "[]");
  return parse(raw);
}

export function saveTemplate(board: string, name: string, t: Ticket, withPeople: boolean): Template {
  const fields: FieldValues = {};
  for (const k of KEEP) if (t.fields[k] !== undefined) (fields as Record<string, unknown>)[k] = t.fields[k];
  const tpl: Template = {
    id: crypto.randomUUID(), name, title: t.title, body: withRepeat(t.body, null),
    labels: t.labels.map((l) => l.name).filter((l) => l !== "triage"),
    assignees: withPeople ? t.assignees.map((a) => a.login) : [], fields, createdAt: new Date().toISOString(),
  };
  const list = parse(read(board)).filter((x) => x.name.toLowerCase() !== name.toLowerCase());
  write(board, [...list, tpl]);
  return tpl;
}

export const deleteTemplate = (board: string, id: string) => write(board, parse(read(board)).filter((x) => x.id !== id));

/** A new ticket from a template, starting in the board's first stage. */
export const fromTemplate = (tpl: Template, startStatus: string | null): NewTicket => ({
  title: tpl.title, body: tpl.body, labels: tpl.labels, assignees: tpl.assignees,
  fields: { ...tpl.fields, Status: startStatus ?? undefined },
});

// Which ticket the "Save as template" dialog is for.
const dlg = new Set<() => void>();
let target: Ticket | null = null;
let targetKey = "";
export const openSaveTemplate = (t: Ticket) => { target = t; targetKey = t.url; dlg.forEach((l) => l()); };
export const closeSaveTemplate = () => { target = null; targetKey = ""; dlg.forEach((l) => l()); };
export function useSaveTemplateTarget(): Ticket | null {
  useSyncExternalStore((l) => { dlg.add(l); return () => dlg.delete(l); }, () => targetKey, () => "");
  return target;
}
