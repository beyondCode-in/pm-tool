"use client";

import { addDays, currentSprint, isDone, isOverdue, options, plain, sprintEnd, today } from "@/lib/board";
import type { Board, Ticket } from "@/lib/types";
import { useOpenTicket } from "@/lib/url-state";
import { format, parseISO } from "date-fns";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Avatar, cleanTitle, TypeIcon } from "../ticket/bits";
import { useLayout, type Layout } from "@/lib/layout";
import { createContext, Fragment, useContext } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useActions } from "@/lib/data";
import { MoreHorizontal, UserRoundPlus } from "@/components/icons";
import { CardMenu } from "./card-menu";
import { isUrgent, useWorkspace } from "@/lib/workspace";
import { DateInput } from "../ticket/pickers";
import { PriorityIcon } from "../ticket/status-icons";
import { CustomiseMenu, CustomSection, useSectionDrops } from "../layout/custom-section";

const pts = (ts: Ticket[]) => ts.reduce((s, t) => s + (t.fields["Story Points"] ?? 0), 0);

function Tile({ label, value, sub, tone, href }: { label: string; value: React.ReactNode; sub?: string; tone?: "danger" | "success"; href?: string }) {
  const router = useRouter();
  const Tag = href ? "button" : "div";
  return (
    <Tag {...(href ? { type: "button" as const, onClick: () => router.push(href) } : {})}
      className={`block w-full rounded-2xl border bg-card p-4 text-left ${href ? "cursor-pointer transition-[box-shadow,border-color,transform] hover:-translate-y-px hover:border-primary/40 hover:shadow-pop" : ""}`}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tracking-tight tabular-nums ${tone === "danger" ? "text-destructive" : tone === "success" ? "text-success" : ""}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </Tag>
  );
}

export const WIDGETS: Record<string, string> = {
  summary: "Summary", burndown: "Sprint burndown", stages: "Open work by stage", workload: "Workload", attention: "Needs attention",
  priority: "Open work by priority", dueSoon: "Due in the next 7 days", unassigned: "Unassigned work",
};
const LIST = "/backlog/";
const q = (p: Record<string, string>) => `${LIST}?${new URLSearchParams({ done: "false", ...p })}`;

// One ticket row inside a widget: opens on click, right-click or ⋯ for the full menu.
function Row({ board, ticket: t, children }: { board: Board; ticket: Ticket; children?: React.ReactNode }) {
  const [, open] = useOpenTicket();
  return (
    <CardMenu board={board} ticket={t}>
      <li className="group/row flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-sm transition-colors hover:bg-muted/60">
        <button onClick={() => void open(t.number)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <TypeIcon ticket={t} /><span className="font-mono text-[11px] text-muted-foreground">#{t.number}</span>
          <span className="truncate">{cleanTitle(t.title)}</span>
        </button>
        {children}
        <Button size="icon-xs" variant="ghost" aria-label={`Actions for #${t.number}`} className="opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
          onClick={(e) => { e.preventDefault(); e.currentTarget.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: e.clientX, clientY: e.clientY })); }}>
          <MoreHorizontal />
        </Button>
      </li>
    </CardMenu>
  );
}
const DashLayout = createContext<Layout | null>(null);

// Each widget can be collapsed, hidden, or dragged to a new place.
function Panel({ id, title, sub, children, wide }: { id: string; title: string; sub: string; children: React.ReactNode; wide?: boolean }) {
  const layout = useContext(DashLayout)!;
  return (
    <CustomSection id={id} scope="dashboard" layout={layout} title={title}
      className={`spotlight rounded-2xl border bg-card p-4 shadow-card ${wide ? "lg:col-span-2" : ""}`}>
      <p className="-mt-1 mb-3 text-xs text-muted-foreground">{sub}</p>
      {children}
    </CustomSection>
  );
}

const axis = { fontSize: 11, fill: "var(--muted-foreground)" };
const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12, color: "var(--popover-foreground)" };

export function DashboardView({ board, tickets }: { board: Board; tickets: Ticket[] }) {
  const router = useRouter();
  const actions = useActions();
  const layout = useLayout("dashboard", Object.keys(WIDGETS));
  useSectionDrops("dashboard", layout);
  const sprint = currentSprint(board);
  const open_ = tickets.filter((t) => !isDone(t));
  const weekAgo = addDays(today(), -7);
  const doneWeek = tickets.filter((t) => t.closedAt && t.closedAt.slice(0, 10) > weekAgo && t.stateReason !== "NOT_PLANNED");
  const overdue = open_.filter(isOverdue);
  const ws = useWorkspace();
  const critical = open_.filter((t) => isUrgent(t.fields.Priority));

  const inSprint = sprint ? tickets.filter((t) => t.fields.Sprint === sprint.id) : [];
  const sprintDone = inSprint.filter(isDone);

  // Remaining story points per day of the current sprint (points if set, else 1 per ticket).
  const burndown = !sprint ? [] : (() => {
    const weight = (t: Ticket) => t.fields["Story Points"] ?? 1;
    const total = inSprint.reduce((s, t) => s + weight(t), 0);
    return Array.from({ length: sprint.duration }, (_, i) => {
      const day = addDays(sprint.startDate, i);
      const burned = inSprint.filter((t) => isDone(t) && (t.closedAt?.slice(0, 10) ?? today()) <= day).reduce((s, t) => s + weight(t), 0);
      return {
        day: format(parseISO(day), "d MMM"),
        ideal: Math.round((total - (total * i) / (sprint.duration - 1)) * 10) / 10,
        remaining: day <= today() ? total - burned : null,
      };
    });
  })();

  const byStatus = options(board, "Status").map((o) => ({ name: plain(o.name), tickets: open_.filter((t) => t.fields.Status === o.name).length }));
  const load = board.people.map((p) => {
    const mine = open_.filter((t) => t.assignees.some((a) => a.login === p.login));
    return { p, n: mine.length, pts: pts(mine) };
  }).filter((x) => x.n).sort((a, b) => b.pts - a.pts || b.n - a.n);
  const maxPts = Math.max(1, ...load.map((l) => Math.max(l.pts, l.n)));
  const unassigned = open_.filter((t) => !t.assignees.length).length;

  const widgets: Record<string, React.ReactNode> = {
    summary: (
      <Panel id="summary" wide title="Summary" sub="The numbers that matter this week.">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Open tickets" value={open_.length} sub={`${unassigned} unassigned`} href={q({})} />
        <Tile label="Finished this week" value={doneWeek.length} tone="success" sub="closed in the last 7 days" href="/board/" />
        <Tile label="Overdue" value={overdue.length} tone={overdue.length ? "danger" : undefined} sub="past their due date" href="/calendar/" />
        <Tile label={sprint ? sprint.title : "No current sprint"} value={sprint ? `${inSprint.length ? Math.round((sprintDone.length / inSprint.length) * 100) : 0}%` : "–"}
          href="/sprint/" sub={sprint ? `${sprintDone.length} of ${inSprint.length} done · ${pts(sprintDone)}/${pts(inSprint)} pts · ends ${format(parseISO(sprintEnd(sprint)), "d MMM")}` : "Add a Sprint field to plan sprints"} />
      </div>
      </Panel>
    ),
    burndown: (
        <Panel id="burndown" title="Sprint burndown" sub="How much work is left in this sprint. The dashed line is the even pace.">
          {sprint && inSprint.length ? (
            <div className="h-56" role="img" aria-label={`Burndown for ${sprint.title}: ${burndown.filter((d) => d.remaining !== null).at(-1)?.remaining ?? 0} points left`}>
              <ResponsiveContainer>
                <LineChart data={burndown} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="day" tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: 3 }} />
                  <Line dataKey="ideal" name="Even pace" stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line dataKey="remaining" name="Remaining" stroke="var(--chart-1)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls={false} />
                  <ReferenceLine x={format(parseISO(today()), "d MMM")} stroke="var(--border)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="py-10 text-center text-sm text-muted-foreground">No tickets in the current sprint yet. Plan some in the Backlog.</p>}
          <p className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[var(--chart-1)]" />Remaining</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-muted-foreground" />Even pace</span>
          </p>
        </Panel>
    ),
    stages: (
        <Panel id="stages" title="Open work by stage" sub="Where tickets are sitting right now.">
          <div className="h-56" role="img" aria-label={byStatus.map((s) => `${s.name}: ${s.tickets}`).join(", ")}>
            <ResponsiveContainer>
              <BarChart data={byStatus} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} interval={0} />
                <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="tickets" name="Tickets" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={36} cursor="pointer" onClick={() => router.push("/board/")} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
    ),
    workload: (
        <Panel id="workload" title="Workload" sub="Open tickets and story points per person.">
          {load.length ? (
            <ul className="space-y-2.5">
              {load.map(({ p, n, pts: points }) => (
                <li key={p.login}>
                <button onClick={() => router.push(q({ assignee: p.login }))} title={`Open ${p.name || p.login}'s work`}
                  className="flex w-full items-center gap-3 rounded-lg px-1.5 py-1 text-left text-sm transition-colors hover:bg-muted/60">
                  <Avatar person={p} size={24} />
                  <span className="w-28 truncate">{p.name || p.login}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted" title={`${points} points`}>
                    <span className="block h-full rounded-full bg-[var(--chart-1)]" style={{ width: `${(Math.max(points, n) / maxPts) * 100}%` }} />
                  </span>
                  <span className="w-24 text-right text-xs tabular-nums text-muted-foreground">{n} tickets · {points} pts</span>
                </button>
                </li>
              ))}
            </ul>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">Nobody has open work assigned.</p>}
        </Panel>
    ),
    attention: (
        <Panel id="attention" title="Needs attention" sub={`${ws.urgent.map(plain).join(", ") || "Urgent"} and overdue tickets.`}>
          {[...new Set([...critical, ...overdue])].length ? (
            <ul className="-mx-1.5">
              {[...new Set([...critical, ...overdue])].slice(0, 8).map((t) => (
                <Row key={t.number} board={board} ticket={t}>
                  {isOverdue(t) && <span className="rounded bg-destructive/10 px-1.5 text-xs font-medium text-destructive">Overdue</span>}
                  {isUrgent(t.fields.Priority) && <span className="rounded bg-destructive/10 px-1.5 text-xs font-medium text-destructive">{plain(t.fields.Priority)}</span>}
                </Row>
              ))}
            </ul>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">Nothing critical or overdue. 🎉</p>}
        </Panel>
    ),
    priority: (
        <Panel id="priority" title="Open work by priority" sub="Click a priority to see those tickets.">
          <ul className="space-y-1">
            {[...options(board, "Priority").map((o) => ({ key: o.name, label: plain(o.name), n: open_.filter((t) => t.fields.Priority === o.name).length })),
              { key: "", label: "No priority", n: open_.filter((t) => !t.fields.Priority).length }].map((r) => (
              <li key={r.key || "none"}>
                <button disabled={!r.key} onClick={() => router.push(q({ priority: r.key }))}
                  className="flex w-full items-center gap-3 rounded-lg px-1.5 py-1.5 text-left text-sm transition-colors enabled:hover:bg-muted/60">
                  <span className="grid w-5 place-items-center">{r.key ? <PriorityIcon value={r.key} size={16} /> : <span className="size-2 rounded-full bg-muted-foreground/40" />}</span>
                  <span className="w-24 truncate">{r.label}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-[var(--chart-2)]" style={{ width: `${open_.length ? (r.n / open_.length) * 100 : 0}%` }} /></span>
                  <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{r.n}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
    ),
    dueSoon: (() => {
      const soon = open_.filter((t) => { const d = t.fields["Target date"]; return !!d && d >= today() && d <= addDays(today(), ws.dueSoonDays); })
        .sort((a, b) => (a.fields["Target date"] ?? "").localeCompare(b.fields["Target date"] ?? ""));
      return (
        <Panel id="dueSoon" title={`Due in the next ${ws.dueSoonDays} days`} sub="Change a date right here, or right-click a row for more.">
          {soon.length ? (
            <ul className="-mx-1.5">
              {soon.slice(0, 10).map((t) => (
                <Row key={t.number} board={board} ticket={t}>
                  <span className="w-44 shrink-0"><DateInput label={`Due date of #${t.number}`} value={t.fields["Target date"]} onChange={(v) => void actions.setField(t, "Target date", v)} /></span>
                </Row>
              ))}
            </ul>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">Nothing due this week.</p>}
        </Panel>
      );
    })(),
    unassigned: (() => {
      const free = open_.filter((t) => !t.assignees.length);
      return (
        <Panel id="unassigned" title="Unassigned work" sub="Pick something up with one click.">
          {free.length ? (
            <ul className="-mx-1.5">
              {free.slice(0, 8).map((t) => (
                <Row key={t.number} board={board} ticket={t}>
                  <Button size="xs" variant="outline" onClick={() => void actions.setAssignees(t, [board.viewer.login])}><UserRoundPlus />Take it</Button>
                </Row>
              ))}
            </ul>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">Everything open has an owner.</p>}
        </Panel>
      );
    })(),
  };

  return (
    <DashLayout.Provider value={layout}>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex justify-end"><CustomiseMenu layout={layout} labels={WIDGETS} label="Add or remove widgets" heading="Widgets" /></div>
        <div className="grid min-h-0 content-start gap-4 overflow-auto pb-8 lg:grid-cols-2">
          {layout.visible.map((id) => <Fragment key={id}>{widgets[id]}</Fragment>)}
          {!layout.visible.length && <p className="text-sm text-muted-foreground">All widgets are hidden. Use Customise to show them again.</p>}
        </div>
      </div>
    </DashLayout.Provider>
  );
}
