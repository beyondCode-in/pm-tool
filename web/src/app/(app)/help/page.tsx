"use client";
/* eslint-disable react/no-unescaped-entities -- the guide is prose; apostrophes and quotes are intended. */

import { LogoMark } from "@/components/brand/logo";
import { SHORTCUTS } from "@/lib/keys";
import { cn } from "@/lib/utils";
import * as P from "@phosphor-icons/react";
import { useMemo, useState, type ReactNode } from "react";

// The complete guide: how every part of BeyondPM works, where each thing is
// stored, who can see it, and what it can't do yet. Plain words, no jargon
// that isn't explained. Keep it in step with the code when features change.

type Section = { id: string; title: string; icon: P.Icon; body: ReactNode; words: string };

const K = ({ children }: { children: ReactNode }) => <kbd className="rounded border bg-background px-1.5 py-px font-mono text-[11px] text-foreground">{children}</kbd>;
const Note = ({ tone = "info", children }: { tone?: "info" | "warn"; children: ReactNode }) => (
  <div className={cn("my-3 flex gap-2.5 rounded-xl border p-3 text-sm", tone === "warn" ? "border-amber-500/30 bg-amber-500/10" : "bg-accent/50")}>
    {tone === "warn" ? <P.Warning size={18} weight="duotone" className="mt-0.5 shrink-0 text-amber-600" /> : <P.Info size={18} weight="duotone" className="mt-0.5 shrink-0 text-primary" />}
    <div>{children}</div>
  </div>
);
const Table = ({ rows, head }: { head: [string, string, string?]; rows: [ReactNode, ReactNode, ReactNode?][] }) => (
  <div className="my-3 overflow-x-auto rounded-xl border">
    <table className="w-full text-left text-sm">
      <thead className="bg-muted/60 text-xs text-muted-foreground"><tr>{head.filter(Boolean).map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
      <tbody className="divide-y">{rows.map((r, i) => <tr key={i}>{r.slice(0, head.filter(Boolean).length).map((c, j) => <td key={j} className="px-3 py-2 align-top">{c}</td>)}</tr>)}</tbody>
    </table>
  </div>
);

const SECTIONS: Section[] = [
  {
    id: "what", title: "What BeyondPM is", icon: P.Compass,
    words: "overview github projects issues no server",
    body: <>
      <p>BeyondPM is a project-management app (boards, sprints, roadmaps, docs, chat, whiteboards) that runs entirely on <b>GitHub</b>. There is no BeyondPM server and no BeyondPM database.</p>
      <ul>
        <li><b>Tickets</b> are GitHub issues.</li>
        <li><b>Board fields</b> (Status, Priority, Points, Sprint, dates) are fields on a GitHub Project.</li>
        <li><b>Docs and whiteboards</b> are files in the repository; every save is a commit.</li>
        <li><b>Chat</b> is GitHub Discussions. <b>Goals</b> are GitHub milestones.</li>
      </ul>
      <p>The app is a website that talks to GitHub directly from your browser, signed in as you. Anything you do here you could also see, and undo, on GitHub.</p>
    </>,
  },
  {
    id: "signin", title: "Signing in", icon: P.SignIn,
    words: "login oauth token demo sign out",
    body: <>
      <p>Press <b>Continue with GitHub</b>. GitHub asks you to approve BeyondPM once; after that you land back in the app, signed in as yourself. Your GitHub password never touches the app.</p>
      <ul>
        <li>The sign-in key GitHub gives back is kept <b>only in this browser</b>. Signing out deletes it.</li>
        <li>A small sign-in helper (a Cloudflare Worker) swaps GitHub's one-time code for that key. It stores nothing.</li>
        <li><b>Use a token instead</b> is there for admins and testing; most people never need it.</li>
        <li><b>Try the demo</b> opens a made-up board that lives in memory. Changes vanish when you reload.</li>
      </ul>
    </>,
  },
  {
    id: "access", title: "Organisations, access and privacy", icon: P.ShieldCheck,
    words: "organisation org tenant access permission private public who can see segregation team",
    body: <>
      <p><b>GitHub decides who sees what.</b> The app can only show what your own GitHub account is allowed to see. Someone in organisation B cannot open organisation A's board here, for the same reason they cannot open it on github.com.</p>
      <Table head={["Your GitHub access to the repository", "What you can do in BeyondPM"]} rows={[
        ["None", "Nothing. The board doesn't load."],
        ["Read", "See tickets, docs, chat and history. Edits fail."],
        ["Triage", "Also change tags, assignees, and close or reopen."],
        ["Write or higher", "Everything: edit fields, create tickets, write docs and whiteboards."],
      ]} />
      <p>To give someone access, add them to the organisation or the repository on GitHub, and to the GitHub Project. To remove access, remove them there; it applies immediately.</p>
      <Note tone="warn"><b>Private repository = private board.</b> If the repository is public, its issues, docs, whiteboards and discussions are readable by anyone on the internet, whatever this app shows. Keep company work in a <b>private</b> repository with a <b>private</b> project.</Note>
      <p><b>Members-only sign-in:</b> an admin can limit the whole app to members of chosen GitHub organisations. Anyone else is turned away at sign-in, and the key GitHub issued them is withdrawn on the spot. Removing someone from the organisation on GitHub locks them out of a private board immediately.</p>
      <p><b>Two ways to run it:</b></p>
      <ul>
        <li><b>Shared site:</b> after signing in, each person picks a board on the <b>Connect</b> page. Links carry the board (<code>?board=owner/repo/number</code>), so they can be shared.</li>
        <li><b>Company copy:</b> a company deploys its own copy with its board pinned. Nobody can switch it to another board.</li>
      </ul>
    </>,
  },
  {
    id: "setup", title: "Setting up a board", icon: P.Wrench,
    words: "connect set up board project fields create blueprint",
    body: <>
      <p>On <b>Connect</b>, pick an organisation, a project and a repository. If the project is new, press <b>Set up board</b>. It adds what the app needs, and never removes anything:</p>
      <ul>
        <li>Fields: <b>Status</b>, <b>Priority</b>, <b>Points</b>, <b>Sprint</b> (iterations), <b>Start date</b>, <b>Target date</b>.</li>
        <li>Default tags (bug, feature, triage and so on) in the repository.</li>
      </ul>
      <p>Stages (Status options) are edited on the GitHub Project; tags and workflow rules in <b>Settings</b>. Fields added on GitHub show up in the app automatically.</p>
    </>,
  },
  {
    id: "views", title: "The views", icon: P.SquaresFour,
    words: "home my work inbox board sprint backlog roadmap calendar epics dashboard workload timesheet",
    body: <>
      <Table head={["View", "What it's for"]} rows={[
        ["Home", "Your LineUp (pinned priorities), to-dos, reminders and the week ahead."],
        ["My work", "Everything assigned to you, overdue first."],
        ["Inbox", "New tickets tagged triage. Give them an owner and priority, then remove the tag."],
        ["Board", "All work by stage. Drag cards between columns; swimlanes by person or priority."],
        ["Sprint", "Only the current sprint, with its points."],
        ["Backlog", "A table for planning. Click any cell to edit; group by sprint to see totals."],
        ["Roadmap", "Work on a timeline from start and target dates (or the sprint)."],
        ["Calendar", "Due dates by month. Drag a ticket to a day to change its date."],
        ["Goals", "Targets with a date; progress is the share of their tickets that are closed."],
        ["Epics", "Big pieces of work and the tickets under them."],
        ["Workload", "How much each person has, day by day, against their capacity."],
        ["Timesheet", "Time logged this week, by day and person."],
        ["Dashboard", "Burndown, throughput, workload and risks."],
      ]} />
      <p>Every view has <b>search</b> (<K>/</K>), <b>filters</b>, and can be saved as a <b>saved view</b> or added to <b>favourites</b> from the sidebar.</p>
    </>,
  },
  {
    id: "tickets", title: "Tickets, in detail", icon: P.Ticket,
    words: "ticket issue status priority points sprint dates tags labels assignees parent epic checklist recurring template dependency blocked",
    body: <>
      <ul>
        <li><b>Create:</b> press <K>C</K> or the <b>+</b> button. Pick a type (task, bug, feature…) or a template.</li>
        <li><b>Status</b> moves it across the board. Moving to a stage marked as done (Settings → Workflow) closes the issue; moving it back reopens it.</li>
        <li><b>Priority, Points, Sprint, Start and Target date</b> are the project fields. Change them in the ticket's side panel or inline in tables.</li>
        <li><b>Tags</b> are GitHub labels. <b>Assignees</b> are GitHub assignees (only people with access can be assigned).</li>
        <li><b>Parent</b> nests a ticket under an epic; the epic's progress follows its children.</li>
        <li><b>Blocked by / Blocking</b> use GitHub's issue dependencies.</li>
        <li><b>Checklist</b> is a task list in the description under "Checklist"; it ticks on GitHub too.</li>
        <li><b>Repeat</b> (daily, weekly…): when the ticket is finished, the next one is created with dates moved on. The setting is a hidden note in the description.</li>
        <li><b>Templates:</b> save any ticket's shape and start new ones from it. Templates are kept in this browser.</li>
        <li><b>Log time:</b> adds a comment like "Logged 1h 30m — review"; it counts in Timesheet and Workload.</li>
        <li><b>Undo:</b> most changes show an Undo button for a few seconds.</li>
      </ul>
    </>,
  },
  {
    id: "history", title: "History: who changed what, and when", icon: P.ClockCounterClockwise,
    words: "history audit trail changes who when activity log",
    body: <>
      <p>Open a ticket and choose <b>History</b> under Activity. Every entry shows the person, the change and the time.</p>
      <ul>
        <li><b>Recorded by GitHub itself:</b> created, renamed, tags added or removed, assigned or unassigned, closed, reopened, linked, and status changes.</li>
        <li><b>Recorded by BeyondPM:</b> GitHub doesn't keep history for other project fields, so when you change Priority, Points, Sprint, dates or Status in the app, it adds a short note to the issue, for example <i>"↪ Changed Priority from High to Critical"</i>.</li>
      </ul>
      <p>That note is posted from <b>your</b> GitHub account and GitHub stamps the time, so it can't be faked in the app. The app shows these notes in History, not in the conversation; on GitHub they appear as small comments.</p>
      <Note>Docs and whiteboards have their own history: every save is a commit. Use <b>Open on GitHub</b> and then <b>History</b> to see each version, its author and time.</Note>
      <Note tone="warn">Field changes made <b>directly on GitHub Projects</b> (not through this app) don't leave a note, except Status, which GitHub records.</Note>
    </>,
  },
  {
    id: "notifications", title: "Notifications", icon: P.Bell,
    words: "notifications bell inbox later cleared watch mentions email alert",
    body: <>
      <p>The bell shows what other people did, with their name and picture:</p>
      <ul>
        <li>Field and status changes, comments, closes and reopens on tickets <b>assigned to you or opened by you</b>.</li>
        <li>Any comment that <b>@mentions</b> you, and any time you're <b>assigned</b>.</li>
        <li>Reminders for your tickets that are <b>due today</b> or <b>overdue</b>.</li>
        <li>Tick <b>Watch everything</b> at the bottom of the bell to hear about every ticket.</li>
      </ul>
      <p>Your own actions never notify you. <b>Later</b> hides a notice until 9 am tomorrow; <b>Clear</b> moves it to Cleared, where it can be brought back.</p>
      <p>The app checks for news each time the board refreshes (about every minute while it's open).</p>
      <Note><b>Email or phone alerts:</b> GitHub sends these itself. On the repository on GitHub press <b>Watch</b> (All activity or Participating) and set up email or the GitHub mobile app in your GitHub notification settings. Because every change here is real GitHub activity, those alerts include it.</Note>
      <Note tone="warn">Read and cleared status, and Watch everything, are remembered per browser. Another device starts fresh.</Note>
    </>,
  },
  {
    id: "mentions", title: "@mentions", icon: P.At,
    words: "mention at tag people",
    body: <p>Type <K>@</K> in any comment, doc or chat message and pick a person. The list is everyone who can be assigned in the repository. A mention is a real GitHub mention, so the person is notified here and by GitHub.</p>,
  },
  {
    id: "docs", title: "Docs", icon: P.BookOpenText,
    words: "docs documents markdown wiki pages",
    body: <p>Docs are Markdown files in the repository's <code>docs/</code> folder. Every save is a commit with your name, so their full history is on GitHub. If someone else saved first, you're told instead of overwriting their work.</p>,
  },
  {
    id: "chat", title: "Chat", icon: P.ChatsCircle,
    words: "chat discussions channels threads messages",
    body: <p>Chat uses the repository's <b>GitHub Discussions</b>: each discussion category is a channel, each message starts a thread, and replies are comments. Discussions must be switched on in the repository's settings (the app links you there if they're off). Who can read chat follows repository access.</p>,
  },
  {
    id: "whiteboards", title: "Whiteboards", icon: P.Scribble,
    words: "whiteboards excalidraw drawing sketch canvas",
    body: <p>Whiteboards are Excalidraw drawings saved as <code>.excalidraw</code> files under <code>whiteboards/</code>. Press <b>Save</b> or <K>Ctrl S</K>; each save is a commit. The files also open in excalidraw.com. Two people drawing at the same time don't see each other live: whoever saves second is told to reload first. The first whiteboard you open takes a few seconds to load.</p>,
  },
  {
    id: "goals", title: "Goals, time and workload", icon: P.Target,
    words: "goals milestones timesheet workload capacity time tracking timer",
    body: <ul>
      <li><b>Goals</b> are GitHub milestones: a name, a date and attached tickets.</li>
      <li><b>Time</b> is logged from a ticket (or the running timer) as a comment, so it's visible and auditable on GitHub.</li>
      <li><b>Workload</b> spreads each person's open points over their dates. Capacity is set in Settings → Workflow and kept in this browser.</li>
    </ul>,
  },
  {
    id: "settings", title: "Settings", icon: P.GearSix,
    words: "settings workflow tags sidebar appearance theme layout dark mode",
    body: <ul>
      <li><b>Workflow:</b> which stages count as done, where new tickets start, column limits, which priorities are urgent, how far ahead "due soon" looks, and capacity per person.</li>
      <li><b>Tags:</b> create and manage labels (saved to the repository on GitHub).</li>
      <li><b>Sidebar:</b> show, hide and reorder views.</li>
      <li><b>Appearance:</b> light or dark, and accent colour.</li>
      <li><b>Layouts:</b> reset the arrangement of pages you've customised.</li>
    </ul>,
  },
  {
    id: "storage", title: "What is stored where", icon: P.Database,
    words: "storage where data browser localstorage github shared device",
    body: <>
      <Table head={["Stored on GitHub (shared with the team, permanent)", "Stored in this browser only"]} rows={[
        ["Tickets, comments, tags, assignees", "Your sign-in key"],
        ["Board fields and their history notes", "Favourites, saved views, sidebar order, theme"],
        ["Docs, whiteboards (as commits)", "Reminders, templates, the running timer"],
        ["Chat (Discussions), goals (milestones)", "Notification read/cleared state, Watch everything"],
        ["Time logs, checklists, repeat settings", "Workflow rules and workload capacity"],
      ]} />
      <p>Clearing your browser data removes only the right-hand column; nothing your team relies on.</p>
    </>,
  },
  {
    id: "shortcuts", title: "Keyboard shortcuts", icon: P.Keyboard,
    words: "keyboard shortcuts keys hotkeys",
    body: <>
      <p>Shortcuts work anywhere except while you're typing in a box. For "G" shortcuts press <K>G</K>, let go, then the letter.</p>
      <Table head={["Keys", "Does", "Where"]} rows={SHORTCUTS.map((s) => [<K key="k">{s.keys}</K>, s.label, s.where])} />
    </>,
  },
  {
    id: "limits", title: "Known limits", icon: P.Warning,
    words: "limits limitations loopholes known issues rate limit",
    body: <ul>
      <li>A <b>public</b> repository makes its board public. Use a private one for company work.</li>
      <li>Field changes made outside the app have no history note (except Status).</li>
      <li>Ticket comment counts include the small history notes.</li>
      <li>Personal settings (see "What is stored where") don't follow you between devices.</li>
      <li>GitHub allows about 5,000 requests per hour per person; very large boards refreshed constantly can reach it. The app tells you when it does.</li>
      <li>Whiteboards and docs aren't edited live together; saves are checked for conflicts instead.</li>
    </ul>,
  },
  {
    id: "trouble", title: "Troubleshooting", icon: P.Lifebuoy,
    words: "troubleshooting errors problems not loading permission denied",
    body: <Table head={["You see", "Do this"]} rows={[
      ["\"Not found\" or an empty board", "You don't have access to that repository or project on GitHub. Ask an admin to add you."],
      ["Edits fail with a permission error", "You have read-only access. Ask for Write."],
      ["Chat says Discussions are off", "An admin turns on Discussions in the repository's settings."],
      ["Sign-in loops back to the login page", "Allow cookies and site data for this site, then try again."],
      ["Something looks stale", "Reload, or wait a minute for the next refresh."],
    ]} />,
  },
];

export default function HelpPage() {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? SECTIONS.filter((x) => `${x.title} ${x.words}`.toLowerCase().includes(s)) : SECTIONS;
  }, [q]);
  return (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl gap-8 px-4 pt-4 pb-16 md:px-6">
        <nav aria-label="Guide sections" className="sticky top-4 hidden h-fit w-52 shrink-0 lg:block">
          <ul className="space-y-0.5 text-sm">
            {SECTIONS.map((s) => (
              <li key={s.id}><a href={`#${s.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><s.icon size={16} weight="duotone" />{s.title}</a></li>
            ))}
          </ul>
        </nav>
        <article className="min-w-0 flex-1">
          <header className="mb-6 flex flex-wrap items-center gap-4">
            <LogoMark size={44} />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl leading-tight font-semibold">The BeyondPM guide</h1>
              <p className="text-sm text-muted-foreground">How every part works, who can see what, and where it's stored.</p>
            </div>
            <label className="field-frame flex h-9 w-full items-center gap-2 rounded-lg border bg-card px-3 sm:w-64">
              <P.MagnifyingGlass size={16} className="text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the guide" aria-label="Search the guide" className="field-bare min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </label>
          </header>
          <div className="space-y-4">
            {shown.map((s) => (
              <section key={s.id} id={s.id} className="guide-prose scroll-mt-4 rounded-2xl border bg-card p-5 shadow-card">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><span className="grid size-8 place-items-center rounded-lg bg-accent text-primary"><s.icon size={18} weight="duotone" /></span>{s.title}</h2>
                {s.body}
              </section>
            ))}
            {!shown.length && <p className="py-10 text-center text-sm text-muted-foreground">Nothing in the guide matches "{q}".</p>}
          </div>
        </article>
      </div>
    </div>
  );
}
