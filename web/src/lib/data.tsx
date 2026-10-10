"use client";

import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { toast } from "sonner";
import { getToken, isDemo } from "./auth";
import { markDone } from "./onboarding";
import { celebrate } from "./celebrate";
import { createDemoSource } from "./demo";
import { createGitHubSource, GitHubError } from "./github";
import { plain, today } from "./board";
import type { Board, DataSource, FieldName, FieldValue, NewTicket, Ticket } from "./types";
import { bindBoard, isDoneStatus, priorityIndex, workspace } from "./workspace";
import { nextOccurrence, repeatOf, REPEATS } from "./recurring";

const BOARD_KEY = ["board"] as const;
// undefined = not known yet (pre-render), null = signed out.
const SourceContext = createContext<DataSource | null | undefined>(undefined);

let cached: DataSource | null | undefined;
const noop = () => () => {};
function browserSource(): DataSource | null {
  if (cached === undefined) {
    const token = getToken();
    cached = token ? createGitHubSource(token) : isDemo() ? createDemoSource() : null;
  }
  return cached;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 20_000, refetchInterval: 45_000, refetchOnWindowFocus: true, retry: 1 } },
  }));
  // The pre-rendered HTML has no source (no browser storage on the server);
  // the browser value is swapped in right after hydration, without a mismatch.
  const source = useSyncExternalStore(noop, browserSource, () => undefined);
  return (
    <QueryClientProvider client={client}>
      <SourceContext.Provider value={source}>{children}</SourceContext.Provider>
    </QueryClientProvider>
  );
}

export const useSource = () => useContext(SourceContext);

export function useBoard() {
  const source = useSource();
  return useQuery({
    queryKey: BOARD_KEY,
    enabled: !!source,
    queryFn: async () => { const b = await source!.load(); bindBoard(b); return b; },
  });
}

const message = (e: unknown) => (e instanceof GitHubError || e instanceof Error ? e.message : "Something went wrong.");

// Every write: update the screen first, then GitHub. On failure, put the
// screen back and say what happened. Reversible changes offer Undo.
export function useActions() {
  const source = useSource();
  const qc = useQueryClient();

  return useMemo(() => {
    const board = () => qc.getQueryData<Board>(BOARD_KEY)!;
    // Keyed by board item id: unique even when several repositories share issue numbers.
    const patchTicket = (id: string, fn: (t: Ticket) => Ticket) =>
      qc.setQueryData<Board>(BOARD_KEY, (b) => (b ? { ...b, tickets: b.tickets.map((t) => (t.itemId === id ? fn(t) : t)) } : b));
    const refresh = () => setTimeout(() => qc.invalidateQueries({ queryKey: BOARD_KEY }), 1500);

    async function run(label: string, optimistic: () => void, write: () => Promise<unknown>, undo?: () => void) {
      const before = board();
      optimistic();
      try {
        await write();
        if (undo) toast.success(label, { action: { label: "Undo", onClick: undo }, duration: 8000 });
        refresh();
        return true;
      } catch (e) {
        qc.setQueryData(BOARD_KEY, before);
        toast.error(`Couldn't save: ${message(e)}`, { duration: 10000 });
        return false;
      }
    }

    // Priority and Size also live as tags ("priority: p1", "size: m") because the
    // GitHub forms and the triage workflow work from tags. Keep the two in step,
    // otherwise the workflow would later "correct" the board back to the old tag.
    const syncTag = async (id: string, field: FieldName, value: FieldValue) => {
      const tagName = workspace().tagSync[field];
      if (!tagName) return;
      const prefix = `${tagName}: `;
      const word = plain(typeof value === "string" ? value : "").toLowerCase();
      // Priority tags are p0, p1, … by the option's position on the board.
      const tag = !word ? null : field === "Priority" ? `p${priorityIndex(value as string)}` : word;
      const t = board().tickets.find((x) => x.itemId === id);
      if (!t) return;
      const names = t.labels.map((l) => l.name).filter((l) => !l.startsWith(prefix));
      const next = tag ? [...names, prefix + tag] : names;
      if (next.length === t.labels.length && next.every((l) => t.labels.some((x) => x.name === l))) return;
      patchTicket(id, (x) => ({ ...x, labels: next.map((name) => board().labels.find((l) => l.name === name) ?? { name, color: "c2e0c6" }) }));
      await source!.setLabels(board(), t, next).catch(() => toast.warning(`Saved ${field}, but couldn't update its tag on #${t.number}.`));
    };

    const setField = (t: Ticket, field: FieldName, value: FieldValue, opts: { silent?: boolean } = {}): Promise<boolean> => {
      const previous = t.fields[field] ?? null;
      if (previous === value) return Promise.resolve(true);
      const pretty = typeof value === "string" ? value : value ?? "none";
      return runThenSync(t.itemId, field, value, () => run(
        `#${t.number} → ${field}: ${pretty}`,
        () => patchTicket(t.itemId, (x) => ({ ...x, fields: { ...x.fields, [field]: value ?? undefined } })),
        () => source!.setField(board(), t, field, value),
        opts.silent ? undefined : () => void setField({ ...t, fields: { ...t.fields, [field]: value ?? undefined } }, field, previous, { silent: true }),
      ));
    };
    const runThenSync = async (id: string, field: FieldName, value: FieldValue, write: () => Promise<boolean>) => {
      const ok = await write();
      if (ok) await syncTag(id, field, value);
      return ok;
    };

    const setState = (t: Ticket, state: "OPEN" | "CLOSED", reason?: "COMPLETED" | "NOT_PLANNED", opts: { silent?: boolean } = {}) =>
      run(
        state === "CLOSED" ? (reason === "NOT_PLANNED" ? `#${t.number} marked won't do` : `#${t.number} closed`) : `#${t.number} reopened`,
        () => patchTicket(t.itemId, (x) => ({ ...x, state, stateReason: reason ?? null, closedAt: state === "CLOSED" ? new Date().toISOString() : null })),
        () => source!.setState(t, state, reason),
        opts.silent ? undefined : () => void source!.setState(t, t.state).then(() => qc.invalidateQueries({ queryKey: BOARD_KEY })),
      );

    return {
      setField,
      setState,
      // Moving a card to Done also closes the ticket, like Jira's resolution.
      async move(t: Ticket, status: string, opts: { silent?: boolean } = {}) {
        const ok = await setField(t, "Status", status, opts);
        if (ok) markDone("move");
        const toDone = isDoneStatus(status);
        if (ok && toDone && !isDoneStatus(t.fields.Status) && !opts.silent && workspace().celebrate) void celebrate();
        if (ok && toDone && t.state === "OPEN") await source!.setState(t, "CLOSED", "COMPLETED").catch(() => {});
        if (ok && !toDone && t.state === "CLOSED") await source!.setState(t, "OPEN").catch(() => {});
        // Recurring: finishing one creates the next, dates moved on (lib/recurring.ts).
        const repeat = repeatOf(t.body);
        if (ok && toDone && repeat && !isDoneStatus(t.fields.Status)) {
          try {
            const next = nextOccurrence(t, repeat, workspace().start, today());
            const n = await source!.create(board(), next);
            await qc.invalidateQueries({ queryKey: BOARD_KEY });
            toast.success(`Next one created: #${n}`, { description: next.fields["Target date"] ? `Due ${new Date(`${next.fields["Target date"]}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · repeats ${REPEATS.find((r) => r.id === repeat)?.label.toLowerCase()}` : undefined });
          } catch (e) { toast.error(`Couldn't create the next recurring ticket: ${e instanceof Error ? e.message : "unknown error"}`); }
        }
        return ok;
      },
      setAssignees: (t: Ticket, logins: string[]) =>
        run(`#${t.number} assignees updated`,
          () => patchTicket(t.itemId, (x) => ({ ...x, assignees: board().people.filter((p) => logins.includes(p.login)) })),
          () => source!.setAssignees(board(), t, logins)),
      setLabels: (t: Ticket, labels: string[]) =>
        run(`#${t.number} tags updated`,
          () => patchTicket(t.itemId, (x) => ({ ...x, labels: labels.map((name) => board().labels.find((l) => l.name === name) ?? { name, color: "c2e0c6" }) })),
          () => source!.setLabels(board(), t, labels)),
      updateText: (t: Ticket, patch: { title?: string; body?: string }) =>
        run(`#${t.number} saved`, () => patchTicket(t.itemId, (x) => ({ ...x, ...patch })), () => source!.updateText(t, patch)),
      async create(input: NewTicket) {
        try {
          const n = await source!.create(board(), input);
          markDone("create");
          await qc.invalidateQueries({ queryKey: BOARD_KEY });
          return n;
        } catch (e) {
          toast.error(`Couldn't create the ticket: ${message(e)}`, { duration: 12000 });
          return null;
        }
      },
    };
  }, [qc, source]);
}

export function useComments(t: Ticket | null) {
  const source = useSource();
  return useQuery({ queryKey: ["comments", t?.url], enabled: !!source && !!t, queryFn: () => source!.comments(t!), refetchInterval: false });
}

// The change history; refetched whenever the ticket itself changes.
export function useHistory(t: Ticket | null) {
  const source = useSource();
  return useQuery({ queryKey: ["history", t?.url, t?.updatedAt, t?.labels.length, t?.assignees.length], enabled: !!source && !!t, queryFn: () => source!.history(t!), refetchInterval: false, placeholderData: (prev) => prev });
}

export function useAddComment() {
  const source = useSource();
  const qc = useQueryClient();
  return async (t: Ticket, body: string) => {
    try {
      await source!.addComment(t, body);
      await qc.invalidateQueries({ queryKey: ["comments", t.url] });
      return true;
    } catch (e) {
      toast.error(`Couldn't post the comment: ${message(e)}`);
      return false;
    }
  };
}
