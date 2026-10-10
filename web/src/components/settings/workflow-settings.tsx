"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { options, plain } from "@/lib/board";
import type { Board } from "@/lib/types";
import { cn } from "@/lib/utils";
import { defaults, resetWorkspace, setWorkspace, useWorkspace } from "@/lib/workspace";
import { RotateCcw } from "@/components/icons";
import type { ReactNode } from "react";
import { OptionLabel } from "../ticket/bits";
import { PriorityIcon, StatusIcon } from "../ticket/status-icons";

// Settings → Workflow: every rule the app follows, read from the board's own
// fields and editable here. Nothing about statuses, types or priorities is
// assumed by name.

function Row({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 border-t py-4 first:border-t-0 first:pt-0 sm:grid-cols-[14rem_1fr] sm:gap-6">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// A row of toggle chips: pick one (single) or many.
function Chips({ items, value, onChange, single, render }: {
  items: string[]; value: string[]; onChange: (v: string[]) => void; single?: boolean; render?: (s: string) => ReactNode;
}) {
  if (!items.length) return <p className="text-xs text-muted-foreground">This board has no options for this yet.</p>;
  return (
    <div className="flex flex-wrap gap-1.5" role={single ? "radiogroup" : "group"}>
      {items.map((s) => {
        const on = value.includes(s);
        return (
          <button key={s} type="button" role={single ? "radio" : "checkbox"} aria-checked={on}
            onClick={() => onChange(single ? [s] : on ? value.filter((v) => v !== s) : [...value, s])}
            className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-sm transition-[background-color,border-color,box-shadow]",
              on ? "border-primary/50 bg-accent font-medium shadow-card ring-2 ring-primary/15" : "bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground")}>
            {render ? render(s) : plain(s)}
          </button>
        );
      })}
    </div>
  );
}

export function WorkflowSettings({ board }: { board: Board }) {
  const ws = useWorkspace();
  const base = defaults(board);
  const statuses = options(board, "Status").map((o) => o.name);
  const types = options(board, "Ticket Type");
  const priorities = options(board, "Priority").map((o) => o.name);
  const prefixes = [...new Set(board.labels.map((l) => /^([\w-]+):\s/.exec(l.name)?.[1]).filter((x): x is string => !!x))];
  const numberFields = board.fields.filter((f) => f.kind === "number").map((f) => f.name);
  const singleFields = board.fields.filter((f) => f.kind === "single").map((f) => f.name);
  const status = (s: string) => <><StatusIcon name={s} size={14} />{plain(s)}</>;

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        How the app treats your board. Each rule starts from your board&apos;s own fields; change any of them here.
        {ws.customised && <Button size="xs" variant="ghost" className="ml-2" onClick={resetWorkspace}><RotateCcw />Back to defaults</Button>}
      </p>

      <Row title="Done stages" hint="Moving a ticket here closes it and counts it as finished. Moving it out reopens it.">
        <Chips items={statuses} value={ws.done} onChange={(done) => setWorkspace({ done })} render={status} />
      </Row>

      <Row title="New tickets start in" hint="The stage for tickets made from the form, quick add and calendar.">
        <Chips single items={statuses} value={ws.start ? [ws.start] : []} onChange={([start]) => setWorkspace({ start })} render={status} />
      </Row>

      <Row title="Work-in-progress limits" hint="A column over its limit turns red and warns when a card is dropped in. Leave empty for no limit.">
        <div className="grid gap-1.5 sm:grid-cols-2">
          {statuses.filter((s) => !ws.done.includes(s)).map((s) => (
            <label key={s} className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-sm">
              <StatusIcon name={s} size={14} /><span className="min-w-0 flex-1 truncate">{plain(s)}</span>
              <input inputMode="numeric" aria-label={`Limit for ${plain(s)}`} placeholder="–" value={ws.wip[s] ?? ""}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/\D/g, ""));
                  const wip = { ...ws.wip };
                  if (n > 0) wip[s] = n; else delete wip[s];
                  setWorkspace({ wip });
                }}
                className="h-7 w-14 rounded-md border bg-background px-2 text-right text-sm tabular outline-none focus:border-ring" />
            </label>
          ))}
        </div>
      </Row>

      <Row title="Quick-add type" hint="The type given to tickets made from just a title.">
        <Chips single items={types.map((o) => o.name)} value={ws.quickType ? [ws.quickType] : []} onChange={([quickType]) => setWorkspace({ quickType })}
          render={(s) => <OptionLabel field="Ticket Type" name={s} color={types.find((o) => o.name === s)?.color} />} />
      </Row>

      <Row title="Urgent priorities" hint={`Shown under "Needs attention" on the dashboard. Priority order follows the board (first = highest).`}>
        <Chips items={priorities} value={ws.urgent} onChange={(urgent) => setWorkspace({ urgent })} render={(s) => <><PriorityIcon value={s} size={14} />{plain(s)}</>} />
      </Row>

      <Row title="Tags shown on cards" hint='Tags named "prefix: value" whose prefix is picked here appear on board cards.'>
        <Chips items={prefixes} value={ws.cardTags} onChange={(cardTags) => setWorkspace({ cardTags })} render={(s) => <span className="font-mono text-xs">{s}:</span>} />
      </Row>

      <Row title="Fields kept as tags" hint='When one of these fields changes, its "name: value" tag is updated too, so GitHub forms and automation agree with the board.'>
        <Chips items={singleFields} value={Object.keys(ws.tagSync)} render={(s) => <>{s}{ws.tagSync[s] && <span className="font-mono text-[11px] text-muted-foreground">→ {ws.tagSync[s]}:</span>}</>}
          onChange={(names) => setWorkspace({ tagSync: Object.fromEntries(names.map((n) => [n, ws.tagSync[n] ?? base.tagSync[n] ?? n.toLowerCase()])) })} />
      </Row>

      <Row title="Hours field" hint="A number field that gets the total of logged time. Optional; entries are always kept on the ticket.">
        <Chips single items={["(none)", ...numberFields]} value={[ws.timeField ?? "(none)"]} onChange={([f]) => setWorkspace({ timeField: f === "(none)" ? null : f })} />
      </Row>

      <Row title={`"Due soon" window`} hint="How many days ahead the dashboard and reminders look.">
        <Chips single items={["3", "7", "14", "30"]} value={[String(ws.dueSoonDays)]} onChange={([d]) => setWorkspace({ dueSoonDays: Number(d) })} render={(s) => `${s} days`} />
      </Row>

      <Row title="Workload capacity" hint="How much one person can carry per working day. The Workload view turns amber near it and red above it.">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {(["tickets", "points"] as const).map((k) => (
            <label key={k} className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5">
              <input inputMode="numeric" aria-label={`Capacity in ${k} per day`} value={ws.capacity[k]}
                onChange={(e) => { const n = Number(e.target.value.replace(/\D/g, "")); if (n > 0) setWorkspace({ capacity: { ...ws.capacity, [k]: n } }); }}
                className="h-7 w-12 rounded-md border bg-background px-2 text-right text-sm tabular outline-none focus:border-ring" />
              {k} per day
            </label>
          ))}
        </div>
      </Row>

      <Row title="Celebrate finished work" hint="A burst of confetti when a ticket reaches a done stage.">
        <Switch checked={ws.celebrate} onCheckedChange={(celebrate: boolean) => setWorkspace({ celebrate })} aria-label="Celebrate finished work" />
      </Row>
    </div>
  );
}
