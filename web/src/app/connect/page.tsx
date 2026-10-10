"use client";

import { Aurora } from "@/components/brand/aurora";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getToken, isDemo, signOut } from "@/lib/auth";
import { FIELDS } from "@/lib/blueprint";
import { config } from "@/lib/config";
import { createProject, inspectBoard, listOwners, listRepos, setupBoard, type Owner, type SetupStep } from "@/lib/github-setup";
import { currentTenant, encodeTenant, saveTenant, shareLink, type Tenant } from "@/lib/tenant";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, KanbanSquare, Link2, Loader2, Plus, Search, Wrench, XCircle } from "@/components/icons";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, parseISO } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

// Connect a board: pick the organisation, its project board, and the
// repository where new tickets and tags live. Then check the board against
// what the app expects and fill any gaps with one click.

const go = (path: string) => window.location.assign(`${config.basePath}${path}`);
const STEPS = ["Organisation", "Board", "Repository", "Ready"] as const;

const noop = () => () => {};
export default function ConnectPage() {
  // Client-only: whether this person may pick a board here.
  const allowed = useSyncExternalStore(noop, () => !config.pinned && !isDemo() && !!getToken(), () => false);
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  useEffect(() => {
    if (!mounted || allowed) return;
    go(config.pinned ? "/my-work/" : "/login/");
  }, [mounted, allowed]);
  return allowed ? <Connect /> : null;
}

function Connect() {
  const start = currentTenant();
  const [step, setStep] = useState(0);
  const [picked, setOwner] = useState<Owner | null>(null);
  const [project, setProject] = useState<number | null>(null);
  const [repo, setRepo] = useState<string | null>(null);
  const owners = useQuery({ queryKey: ["connect-owners"], queryFn: listOwners, retry: false });

  // Returning to change boards: start on the current owner.
  const owner = picked ?? owners.data?.find((x) => x.login.toLowerCase() === start?.owner.toLowerCase()) ?? null;

  const tenant: Tenant | null = owner && project && repo ? { owner: owner.login, repo, project } : null;

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden p-4 sm:p-8">
      <Aurora />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="surface-glass relative w-full max-w-2xl rounded-3xl border p-5 shadow-pop sm:p-8">
        <header className="mb-6 flex items-center gap-3">
          <LogoMark size={36} />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">Connect your board</h1>
            <p className="text-sm text-muted-foreground">Pick where your team&apos;s work lives on GitHub. You only see what your GitHub access allows.</p>
          </div>
        </header>

        <ol className="mb-6 flex items-center gap-1.5" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-1.5">
              <button disabled={i > step} onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined}
                className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-accent text-accent-foreground hover:bg-accent/70" : "text-muted-foreground")}>
                <span className="grid size-4 place-items-center rounded-full bg-background/30 text-[10px] tabular">{i < step ? <Check className="size-2.5" /> : i + 1}</span>
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < STEPS.length - 1 && <span className={cn("h-px flex-1", i < step ? "bg-primary/50" : "bg-border")} aria-hidden />}
            </li>
          ))}
        </ol>

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.section key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
            {step === 0 && <PickOwner query={owners} value={owner} onPick={(o) => { setOwner(o); setProject(null); setRepo(null); setStep(1); }} />}
            {step === 1 && owner && <PickProject owner={owner} value={project} onPick={(n) => { setProject(n); setStep(2); }} onCreated={() => void owners.refetch()} />}
            {step === 2 && owner && <PickRepo owner={owner} value={repo} preferred={start?.owner === owner.login ? start.repo : undefined} onPick={(r) => { setRepo(r); setStep(3); }} />}
            {step === 3 && tenant && <Ready tenant={tenant} />}
          </motion.section>
        </AnimatePresence>

        <footer className="mt-6 flex items-center gap-2 border-t pt-4 text-sm">
          {step > 0 && <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}><ArrowLeft />Back</Button>}
          <span className="ml-auto flex items-center gap-2">
            {start && <Button variant="ghost" size="sm" onClick={() => go("/my-work/")}>Keep {start.owner}/{start.repo} #{start.project}</Button>}
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { signOut(); go("/login/"); }}>Sign out</Button>
          </span>
        </footer>
      </motion.div>
    </main>
  );
}

function Choice({ on, onClick, children, className }: { on?: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button onClick={onClick} aria-pressed={on}
      className={cn("lift flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-[border-color,box-shadow]",
        on ? "border-primary/60 ring-2 ring-primary/20" : "hover:border-primary/40", className)}>
      {children}
    </button>
  );
}

function ListSkeleton() {
  return <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>;
}

function Problem({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
      <p className="font-medium text-destructive">{message}</p>
      {retry && <Button size="sm" variant="outline" className="mt-2" onClick={retry}>Try again</Button>}
    </div>
  );
}

function PickOwner({ query, value, onPick }: { query: ReturnType<typeof useQuery<Owner[]>>; value: Owner | null; onPick: (o: Owner) => void }) {
  if (query.isLoading) return <ListSkeleton />;
  if (query.error) return <Problem message={(query.error as Error).message} retry={() => void query.refetch()} />;
  const list = query.data ?? [];
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold">Which organisation is the board in?</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {list.map((o) => (
          <Choice key={o.login} on={value?.login === o.login} onClick={() => onPick(o)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={o.avatarUrl} alt="" width={36} height={36} className={cn("size-9 shrink-0 object-cover", o.kind === "org" ? "rounded-lg" : "rounded-full")} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{o.name || o.login}</span>
              <span className="block text-xs text-muted-foreground">{o.kind === "user" ? "Your account" : `@${o.login}`} · {o.projects.filter((p) => !p.closed).length} boards</span>
            </span>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Choice>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Organisation missing? Its owners may need to approve this app under the organisation&apos;s third-party access settings.</p>
    </div>
  );
}

function PickProject({ owner, value, onPick, onCreated }: { owner: Owner; value: number | null; onPick: (n: number) => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const open = owner.projects.filter((p) => !p.closed);
  const create = async () => {
    setBusy(true);
    try { const n = await createProject(owner.login, title.trim()); toast.success(`Board "${title.trim()}" created`); onCreated(); onPick(n); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold">Which board in {owner.name || owner.login}?</h2>
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {open.map((p) => (
          <Choice key={p.number} on={value === p.number} onClick={() => onPick(p.number)}>
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary"><KanbanSquare className="size-4" /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{p.title}</span>
              <span className="block text-xs text-muted-foreground">#{p.number} · updated {formatDistanceToNow(parseISO(p.updatedAt))} ago</span>
            </span>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Choice>
        ))}
        {!open.length && <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">No boards here yet. Create one below.</p>}
      </div>
      <form className="field-frame mt-3 flex items-center gap-2 rounded-xl border bg-card p-1.5 pl-3" onSubmit={(e) => { e.preventDefault(); if (title.trim()) void create(); }}>
        <Plus className="size-4 text-muted-foreground" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New board name, e.g. Product team" aria-label="New board name" className="field-bare h-8 min-w-0 flex-1 bg-transparent text-sm outline-none" />
        <Button type="submit" size="sm" disabled={!title.trim() || busy}>{busy ? <Loader2 className="animate-spin" /> : null}Create board</Button>
      </form>
    </div>
  );
}

function PickRepo({ owner, value, preferred, onPick }: { owner: Owner; value: string | null; preferred?: string; onPick: (r: string) => void }) {
  const repos = useQuery({ queryKey: ["connect-repos", owner.login], queryFn: () => listRepos(owner), retry: false });
  const [q, setQ] = useState("");
  if (repos.isLoading) return <ListSkeleton />;
  if (repos.error) return <Problem message={(repos.error as Error).message} retry={() => void repos.refetch()} />;
  const list = (repos.data ?? []).filter((r) => r.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => Number(b.name === preferred) - Number(a.name === preferred));
  return (
    <div>
      <h2 className="text-sm font-semibold">Which repository holds the tickets?</h2>
      <p className="mb-3 text-xs text-muted-foreground">New tickets are created here and its labels become your tags. The board can still show issues from other repositories.</p>
      <label className="field-frame mb-2 flex items-center gap-2 rounded-xl border bg-card px-3">
        <Search className="size-4 text-muted-foreground" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter repositories" aria-label="Filter repositories" className="field-bare h-9 min-w-0 flex-1 bg-transparent text-sm outline-none" />
      </label>
      <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
        {list.map((r) => (
          <Choice key={r.name} on={value === r.name} onClick={() => onPick(r.name)} className="py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{r.name}{r.name === preferred && <span className="ml-2 rounded bg-accent px-1.5 text-[10px] font-semibold text-accent-foreground">current</span>}</span>
              <span className="block text-xs text-muted-foreground">{r.private ? "Private" : "Public"} · updated {formatDistanceToNow(parseISO(r.pushedAt))} ago</span>
            </span>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Choice>
        ))}
        {!list.length && <p className="p-4 text-center text-sm text-muted-foreground">No repositories you can write to{q ? " match" : ""}.</p>}
      </div>
    </div>
  );
}

function Ready({ tenant }: { tenant: Tenant }) {
  const check = useQuery({ queryKey: ["connect-inspect", encodeTenant(tenant)], queryFn: () => inspectBoard(tenant), retry: false });
  const [log, setLog] = useState<SetupStep[]>([]);
  const [running, setRunning] = useState(false);
  const link = shareLink(window.location.origin, config.basePath, tenant);
  const run = async () => {
    setRunning(true); setLog([]);
    try { await setupBoard(tenant, (s) => setLog((l) => [...l, s])); await check.refetch(); toast.success("Board set up"); }
    catch (e) { toast.error((e as Error).message); }
    finally { setRunning(false); }
  };
  const open = () => { saveTenant(tenant); go("/my-work/"); };

  if (check.isLoading) return <ListSkeleton />;
  if (check.error) return <Problem message={(check.error as Error).message} retry={() => void check.refetch()} />;
  const info = check.data!;
  const gaps = info.missingFields.length + info.missingLabels.length + (info.statusIsDefault ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground">Board</p>
        <p className="font-semibold">{info.project.title}</p>
        <p className="text-sm text-muted-foreground">{tenant.owner} · #{tenant.project} · tickets in {tenant.owner}/{tenant.repo} · {info.project.items.totalCount} items</p>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <Wrench className="size-4 text-primary" />
          <p className="font-medium">{gaps ? "A few things are missing" : "Everything the app needs is here"}</p>
          {gaps > 0 && <Button size="sm" className="ml-auto" disabled={running} onClick={() => void run()}>{running ? <Loader2 className="animate-spin" /> : <Wrench />}Set up board</Button>}
        </div>
        {gaps > 0 && !log.length && (
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {info.missingFields.length > 0 && <li>Fields: {info.missingFields.map((f) => f.name).join(", ")}</li>}
            {info.statusIsDefault && <li>Stages: Backlog, Todo, In Progress, Code Review, QA &amp; Testing, Done</li>}
            {info.missingLabels.length > 0 && <li>Tags: {info.missingLabels.map((l) => l.name).join(", ")}</li>}
            <li className="text-xs">Nothing that already exists is renamed or removed. Without these, the matching features simply stay hidden.</li>
          </ul>
        )}
        {log.length > 0 && (
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
            {log.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                {s.state === "failed" ? <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />}
                <span>{s.label}{s.state === "skipped" && <span className="text-muted-foreground"> · already there</span>}{s.detail && s.state === "failed" && <span className="block text-xs text-destructive">{s.detail}</span>}</span>
              </li>
            ))}
          </ul>
        )}
        {!gaps && <p className="mt-1 text-sm text-muted-foreground">{FIELDS.length} fields and all tags are in place.</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="lg" className="glow" onClick={open}>Open board<ArrowRight /></Button>
        <Button size="lg" variant="outline" onClick={() => { void navigator.clipboard?.writeText(link); toast.success("Link copied", { description: "Anyone with access to this board can open it." }); }}><Link2 />Copy link for your team</Button>
      </div>
    </div>
  );
}
