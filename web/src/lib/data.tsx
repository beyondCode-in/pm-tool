"use client";

import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { toast } from "sonner";
import { getToken, isDemo } from "./auth";
import { createDemoSource } from "./demo";
import { createGitHubSource, GitHubError } from "./github";
import type { Board, DataSource, FieldName, FieldValue, NewTicket, Ticket } from "./types";

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
    queryFn: () => source!.load(),
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
    const patchTicket = (n: number, fn: (t: Ticket) => Ticket) =>
      qc.setQueryData<Board>(BOARD_KEY, (b) => (b ? { ...b, tickets: b.tickets.map((t) => (t.number === n ? fn(t) : t)) } : b));
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

    const setField = (t: Ticket, field: FieldName, value: FieldValue, opts: { silent?: boolean } = {}): Promise<boolean> => {
      const previous = t.fields[field] ?? null;
      if (previous === value) return Promise.resolve(true);
      const pretty = typeof value === "string" ? value : value ?? "none";
      return run(
        `#${t.number} → ${field}: ${pretty}`,
        () => patchTicket(t.number, (x) => ({ ...x, fields: { ...x.fields, [field]: value ?? undefined } })),
        () => source!.setField(board(), t, field, value),
        opts.silent ? undefined : () => void setField({ ...t, fields: { ...t.fields, [field]: value ?? undefined } }, field, previous, { silent: true }),
      );
    };

    const setState = (t: Ticket, state: "OPEN" | "CLOSED", reason?: "COMPLETED" | "NOT_PLANNED") =>
      run(
        state === "CLOSED" ? (reason === "NOT_PLANNED" ? `#${t.number} marked won't do` : `#${t.number} closed`) : `#${t.number} reopened`,
        () => patchTicket(t.number, (x) => ({ ...x, state, stateReason: reason ?? null, closedAt: state === "CLOSED" ? new Date().toISOString() : null })),
        () => source!.setState(t, state, reason),
        () => void source!.setState(t, t.state).then(() => qc.invalidateQueries({ queryKey: BOARD_KEY })),
      );

    return {
      setField,
      setState,
      // Moving a card to Done also closes the ticket, like Jira's resolution.
      async move(t: Ticket, status: string) {
        const ok = await setField(t, "Status", status);
        if (ok && /done/i.test(status) && t.state === "OPEN") await source!.setState(t, "CLOSED", "COMPLETED").catch(() => {});
        if (ok && !/done/i.test(status) && t.state === "CLOSED") await source!.setState(t, "OPEN").catch(() => {});
        return ok;
      },
      setAssignees: (t: Ticket, logins: string[]) =>
        run(`#${t.number} assignees updated`,
          () => patchTicket(t.number, (x) => ({ ...x, assignees: board().people.filter((p) => logins.includes(p.login)) })),
          () => source!.setAssignees(board(), t, logins)),
      setLabels: (t: Ticket, labels: string[]) =>
        run(`#${t.number} tags updated`,
          () => patchTicket(t.number, (x) => ({ ...x, labels: labels.map((name) => board().labels.find((l) => l.name === name) ?? { name, color: "c2e0c6" }) })),
          () => source!.setLabels(board(), t, labels)),
      updateText: (t: Ticket, patch: { title?: string; body?: string }) =>
        run(`#${t.number} saved`, () => patchTicket(t.number, (x) => ({ ...x, ...patch })), () => source!.updateText(t, patch)),
      async create(input: NewTicket) {
        try {
          const n = await source!.create(board(), input);
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
  return useQuery({ queryKey: ["comments", t?.number], enabled: !!source && !!t, queryFn: () => source!.comments(t!), refetchInterval: false });
}

export function useAddComment() {
  const source = useSource();
  const qc = useQueryClient();
  return async (t: Ticket, body: string) => {
    try {
      await source!.addComment(t, body);
      await qc.invalidateQueries({ queryKey: ["comments", t.number] });
      return true;
    } catch (e) {
      toast.error(`Couldn't post the comment: ${message(e)}`);
      return false;
    }
  };
}
