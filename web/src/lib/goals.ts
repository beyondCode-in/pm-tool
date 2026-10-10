"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSource } from "./data";
import type { Milestone, MilestoneInput, Ticket } from "./types";

// Goals are the repository's GitHub milestones: a name, a target date and
// the tickets that get you there. Progress = closed / all attached tickets.

export function useMilestones() {
  const source = useSource();
  return useQuery({ queryKey: ["milestones"], enabled: !!source, queryFn: () => source!.milestones(), refetchInterval: false });
}

export function useGoalActions() {
  const source = useSource();
  const qc = useQueryClient();
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["milestones"] }), qc.invalidateQueries({ queryKey: ["board"] })]);
  const run = async (work: () => Promise<void>, done: string) => {
    try { await work(); toast.success(done); await refresh(); return true; }
    catch (e) { toast.error(e instanceof Error ? e.message : "Something went wrong.", { duration: 10000 }); return false; }
  };
  return {
    save: (m: MilestoneInput) => run(() => source!.saveMilestone(m), m.number ? `Saved "${m.title}"` : `Goal "${m.title}" created`),
    close: (m: Milestone) => run(() => source!.saveMilestone({ ...m, state: "CLOSED" }), `"${m.title}" closed`),
    reopen: (m: Milestone) => run(() => source!.saveMilestone({ ...m, state: "OPEN" }), `"${m.title}" reopened`),
    attach: (t: Ticket, m: Milestone | null) => run(() => source!.setMilestone(t, m?.number ?? null), m ? `#${t.number} added to "${m.title}"` : `#${t.number} removed from its goal`),
  };
}

export type Health = "done" | "overdue" | "at-risk" | "on-track" | "no-date";

/** How a goal is doing: finished, overdue, at risk (due within a week and under 70% done), or on track. */
export function health(m: Milestone, today: string): Health {
  const total = m.open + m.closed;
  if (m.state === "CLOSED" || (total > 0 && m.open === 0)) return "done";
  if (!m.dueOn) return "no-date";
  if (m.dueOn < today) return "overdue";
  const days = Math.round((Date.parse(m.dueOn) - Date.parse(today)) / 864e5);
  const pct = total ? m.closed / total : 0;
  return days <= 7 && pct < 0.7 ? "at-risk" : "on-track";
}
