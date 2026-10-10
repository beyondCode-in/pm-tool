"use client";

import { parseAsArrayOf, parseAsBoolean, parseAsInteger, parseAsString, useQueryState, useQueryStates } from "nuqs";
import type { Filters } from "./board";
import { markDone } from "./onboarding";

// Filters, the open ticket and the "new ticket" dialog all live in the URL,
// so any view can be bookmarked or shared and Back closes what's open.
const list = parseAsArrayOf(parseAsString).withDefault([]);
export function useFilters() {
  const [f, set] = useQueryStates({
    q: parseAsString.withDefault(""),
    type: list, priority: list, assignee: list, label: list,
    done: parseAsBoolean.withDefault(true),
  }, { history: "replace" });
  const filters: Filters = { q: f.q, type: f.type, priority: f.priority, assignee: f.assignee, label: f.label, showDone: f.done };
  const update = (p: Partial<Filters>) => {
    markDone("filter");
    const { showDone, ...rest } = p;
    void set({ ...rest, ...(showDone !== undefined ? { done: showDone } : {}) });
  };
  const clear = () => void set({ q: "", type: [], priority: [], assignee: [], label: [], done: true });
  const active = !!(f.q || f.type.length || f.priority.length || f.assignee.length || f.label.length || !f.done);
  return { filters, update, clear, active };
}

export const useOpenTicket = () => useQueryState("ticket", parseAsInteger.withOptions({ history: "push" }));
export const useNewTicket = () => useQueryState("new", parseAsString.withOptions({ history: "push" }));
export const useGroupBy = (fallback: string) => useQueryState("group", parseAsString.withDefault(fallback).withOptions({ history: "replace" }));
