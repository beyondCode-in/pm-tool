# Build prompt: BeyondPM, a Jira/ClickUp-class work manager on top of GitHub

> Paste everything below the line into a coding agent as its brief.
> Research date: October 2026. Versions are pinned to what was current then; check for newer patch releases before starting.

---

## 0. Your role and the mission

You are a principal product engineer and product designer. You are building **BeyondPM**: a web app that gives a whole company (engineers, product managers, designers, support staff, sales, executives and clients) one place to raise, plan, track and report on work.

It must feel as capable as **Jira** and as friendly as **ClickUp**, with the speed and polish of **Linear**. It must be usable by someone who has never heard the words "issue", "repository" or "pull request".

**GitHub is the system of record.** Every ticket is a real GitHub issue, and every board is a GitHub Project (v2). BeyondPM is a fast, beautiful, plain-language layer on top, so engineers keep working in GitHub while everyone else works in BeyondPM, and neither side ever copies anything by hand.

This repository already contains the GitHub side: issue forms (`.github/ISSUE_TEMPLATE/`), a triage workflow that turns form answers into labels and board fields (`.github/workflows/no-code-auto-triage.yml`, `.github/scripts/project-sync.cjs`), PR-driven status moves, and SLA reminders. Read them first. Your app must produce issues those workflows understand: same field labels, same option text, same label names.

### What "done" looks like, in one paragraph

A support agent with no GitHub knowledge opens BeyondPM on their phone, taps **New**, picks "Something's broken", types one sentence, drags in a screenshot, and taps **Create**, all in under 30 seconds. The ticket appears instantly on the team's board with the right type, priority and area. An engineer sees it in GitHub with a correctly labelled issue. When their pull request merges, the card glides to Done in front of the support agent, who gets a notification saying, in plain words, that it's fixed.

---

## 1. Who you're building for

Design every screen for the least technical person who will use it, then add power for the most technical.

| Persona | What they do | What they must never see |
|---|---|---|
| **Requester** (support, sales, client, executive) | Create tickets, follow progress, answer questions | Git jargon, Markdown syntax, YAML, empty required fields with no explanation |
| **Team member** (designer, engineer, QA) | Work a board, update status, log progress | Slow screens, more than two clicks for common actions |
| **Lead / PM** | Triage, plan sprints, balance workload, report | Data they can't filter, charts they can't explain |
| **Admin** | Configure spaces, fields, forms, automations, permissions | Settings that need code or a terminal |

**Language rule.** The UI never says "issue", "repo", "PR", "label" or "GitHub Project" to Requesters. Use this glossary everywhere, including empty states, toasts and emails:

| GitHub term | BeyondPM term |
|---|---|
| Issue | Ticket |
| Issue form / template | Ticket type |
| Label | Tag |
| Project (v2) | Board / Space |
| Repository | (hidden; shown as "Code location" for admins only) |
| Pull request | "Fix in progress" / "Change" |
| Milestone | Release |
| Iteration field | Sprint |
| Sub-issue | Sub-task / Child ticket |
| Closed (completed) | Done |
| Closed (not planned) | Won't do |

---

## 2. Non-negotiable principles

1. **Instant.** Every interaction responds in under 100 ms (Interaction to Next Paint). Writes are optimistic: the UI updates first, then syncs. A spinner on a common action is a bug.
2. **Plain.** If a sentence needs a glossary, rewrite it. Reading level: about age 12. Every error says what happened and what to do next.
3. **Pick, don't type.** Prefer chips, cards, segmented controls, date pickers and people pickers over text boxes. Typing is for titles and descriptions only.
4. **Forgiving.** Everything can be undone (toast with **Undo** for 8 s), drafts autosave, nothing is lost on a refresh or a dropped connection.
5. **Keyboard-complete, touch-complete.** Every action works with a mouse, a keyboard alone, a touchscreen and a screen reader. Drag-and-drop always has a non-drag alternative.
6. **One source of truth.** GitHub owns ticket data. The app's own database owns only what GitHub can't store (see §5). Never let them disagree silently.
7. **Calm by default, powerful on demand.** Show 5 fields, not 25. Advanced options live behind "More options" and are remembered per user.

---

## 3. Stack (pinned, with reasons)

Use exactly this unless you write an ADR (`docs/adr/NNN-*.md`) explaining why not.

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 16.4**, App Router, TypeScript `strict` | Current stable (Oct 2026). Turn on **Cache Components** (`cacheComponents: true`, `partialPrefetching: true`), now the recommended model for new apps. |
| React | **React 19.3** | Ships with Next 16.4. Stable **View Transitions** for route changes, Actions and `useOptimistic` for writes. |
| Compiler | React Compiler on (`reactCompiler: true`) | Removes manual memoisation; keeps list and board renders cheap. |
| Styling | **Tailwind CSS v4** (CSS-first `@theme`) | Tokens live in CSS; no config file sprawl. |
| Components | **shadcn/ui** (Radix primitives, Tailwind v4 + React 19 variants, OKLCH colours, `data-slot` styling) | Accessible primitives you own and can restyle. Use **Sonner** for toasts (shadcn deprecated its toast). |
| Motion | **Motion for React** (`motion/react`, v14) + React View Transitions | Layout animations for cards moving between columns; springs for drawers; View Transitions for page changes. |
| Drag and drop | **Atlassian Pragmatic drag and drop** | Built for Jira/Trello-scale boards, small and fast. dnd-kit's docs repo was archived in Feb 2026. Follow Pragmatic's accessibility guidelines (§9). |
| Server state | **TanStack Query v5** for client caches + server actions for writes | Optimistic updates, background refetch, offline queue. |
| Tables | **TanStack Table** + **TanStack Virtual** | Spreadsheet-grade table views with 10,000+ rows. |
| URL state | **nuqs** | Filters, grouping and the open ticket live in the URL, so every view is shareable. |
| Forms | **react-hook-form** + **zod** | One schema shared by the client, server actions and the GitHub YAML generator. |
| Rich text | **Tiptap** (ProseMirror) with a Markdown serializer | Notion-style editing for non-technical users; stores Markdown so GitHub renders it. |
| Command palette | **cmdk** (via shadcn `Command`) | ⌘K everything. |
| Mobile sheets | **vaul** (via shadcn `Drawer`) | Native-feeling bottom sheets on phones. |
| Charts | **Recharts** via shadcn `Chart` | Burndown, velocity, cumulative flow, workload. |
| Dates | **date-fns** + `@internationalized/date` for pickers | Time zones and locales handled correctly. |
| Auth | **Better Auth** | Actively developed (Auth.js is in security-patch mode, maintained by the Better Auth team). Providers: GitHub OAuth (team members) and email magic link and passkeys (Requesters with no GitHub account). Built-in organisations and RBAC. |
| Database | **PostgreSQL** (Neon or Supabase) + **Drizzle ORM v1** | Type-safe, SQL-first, reviewable migrations. |
| GitHub | **GitHub App** + Octokit (`@octokit/app`, `@octokit/graphql`, `@octokit/webhooks`) | Installation tokens, fine-grained permissions, webhooks. Never use a personal token in production. |
| Background jobs | A Postgres-backed job queue (e.g. **pg-boss**) or Vercel Queues | Webhook fan-out, retries, rate-limit back-off. |
| Realtime | Server-Sent Events from a `/api/stream` route fed by webhook events | Cards move live for everyone on the board without polling. |
| File uploads | S3-compatible storage (R2 or S3) with signed upload URLs | GitHub's attachment API is not public; store files, link them in the issue body. |
| Email | **React Email** + Resend (or SES) | Plain-language notifications for Requesters. |
| Testing | **Vitest**, **Playwright**, **axe-core**, **MSW** for GitHub API mocks | See §12. |
| Quality | ESLint, Prettier, TypeScript `noUncheckedIndexedAccess`, Lighthouse CI, bundle analyser | Budgets enforced in CI. |

Package manager: **pnpm**. Node: **24 LTS**.

---

## 4. Architecture

```
 Browser (Next.js client)                Next.js server                       GitHub
 ┌──────────────────────┐   actions   ┌────────────────────────┐  GraphQL ┌──────────────────┐
 │ TanStack Query cache │───────────▶│ Server actions / RSC     │────────▶│ Issues, Projects │
 │ optimistic updates   │◀───────────│ (auth, RBAC, validation) │◀────────│ v2, sub-issues   │
 │ SSE subscription     │   SSE       └──────────┬─────────────┘  webhooks└────────┬─────────┘
 └──────────────────────┘                        │ Drizzle                         │
                                     ┌───────────▼──────────┐   job queue ┌───────▼────────┐
                                     │ Postgres             │◀────────────│ /api/github/   │
                                     │ mirror + app-only    │             │ webhooks       │
                                     └──────────────────────┘             └────────────────┘
```

**Write path.** The UI applies the change optimistically → a server action checks permission and validates with zod → it calls the GitHub GraphQL API with the installation token → it updates the Postgres mirror → it broadcasts over SSE. On failure: roll back the optimistic change, show a toast saying what failed and offering **Retry**, and log it.

**Read path.** Pages read from the Postgres mirror (fast, filterable, works when GitHub is rate-limiting). Webhooks (`issues`, `issue_comment`, `projects_v2_item`, `sub_issues`, `pull_request`, `label`, `milestone`) keep the mirror fresh within seconds. A nightly reconcile job re-reads every project and repairs drift. Show a quiet "Synced 3 s ago" indicator; never block on sync.

**Rate limits.** Batch GraphQL mutations, respect `x-ratelimit-*` headers, queue and back off. Show "Saving…" only if a write is still pending after 2 s.

---

## 5. Data model (Postgres)

GitHub owns: tickets (issues), comments, labels, milestones, assignees, project items and field values, sub-issue links, PR links.

The app owns (GitHub can't store these):

- `workspace` (maps to a GitHub organisation + App installation)
- `space` (maps to one GitHub Project v2; ClickUp "Space"), `folder` (grouping of spaces, app-only)
- `member` (Better Auth user ↔ optional GitHub login; role per space)
- `guest_requester` (email-only Requesters; tickets they create are opened by the App on their behalf with "Requested by Jane (jane@client.com)" in the body)
- `ticket_type` (form definition: fields, options, defaults, conditional rules, target labels and board fields; can be exported to GitHub issue-form YAML)
- `saved_view` (layout, filters, grouping, sort, visible columns, swimlanes, per-user or shared)
- `automation` (trigger → conditions → actions; see §7.9) and `automation_run` (audit log with `execution_id`, `depth`, `idempotency_key` to stop loops)
- `notification`, `notification_preference`
- `attachment` (storage key, ticket, uploader)
- `draft` (unsent ticket drafts per user)
- `time_entry` (start/stop or manual, per ticket and user)
- `sla_policy`, `sla_breach`
- `mirror_*` tables: denormalised copies of issues, project items, field values and sub-issue edges, keyed by GitHub node ID, with `github_updated_at` for conflict checks

Use UUIDv7 primary keys, `created_at` and `updated_at` on everything, row-level checks for workspace isolation, and soft delete only where undo needs it.

---

## 6. Information architecture and navigation

- **Left sidebar** (collapsible, resizable, remembers width): Home · My Work · Inbox · Spaces (tree: Folder → Space → saved views) · Dashboards · Settings. On mobile it becomes a bottom tab bar (Home, My Work, **New**, Inbox, More).
- **Top bar:** breadcrumb, view switcher (tabs), filter bar, "Share view", and the primary **New ticket** button (always visible, keyboard `C`).
- **Ticket detail** opens as a right-side drawer over the current view (URL updates via nuqs, so it can be shared and Back closes it). `⇧Enter` expands it to a full page.
- **⌘K command palette:** jump to any ticket, view, space or person; run any action ("Assign to me", "Move to Done", "Start timer"); create from anywhere.
- **Keyboard map** (shown with `?`): `C` create, `J/K` next/previous, `E` edit, `A` assign, `S` status, `P` priority, `L` tags, `D` due date, `X` select, `⌘↵` save, `Esc` close. Display them in tooltips.

---

## 7. Features (build all of these; §13 gives the order)

### 7.1 Ticket creation: the most important screen in the product

A **guided, delightful, three-step flow** in a dialog (desktop) or full-height sheet (mobile):

1. **"What do you need?"** Big illustrated cards, one per ticket type: ✨ New idea, 🎨 Change how something looks, 🐛 Something's broken, 🎧 A customer needs help, ❓ Question, plus team types such as 🧩 Task, 🗺️ Epic, 🚨 Incident and 🔬 Research for members. Cards can be clicked, chosen with arrow keys, or **dragged onto the ticket preview**. Recently used types appear first.
2. **"Tell us about it."** Title with live suggestions (similar existing tickets appear underneath: "Is it one of these?" to prevent duplicates). Rich description with type-specific **prompt chips** that insert a heading ("What did you expect?"). Drag, drop or paste screenshots and files, with thumbnails and upload progress. An optional **screen recording** button using `getDisplayMedia`.
3. **"How urgent, and where?"** Colour-plus-text urgency cards (never colour alone), multi-select area chips, people picker ("Who else should know?"), due date with natural-language input ("next Friday").

Throughout: a **live ticket card preview** on the right shows exactly what the team will see, plus a progress ring and autosaved drafts ("Draft saved"). The **Create** button reads "Create ticket" and is never disabled without saying why; missing fields scroll into view with a friendly message.

After creation: a confetti-free, calm success state ("Your ticket is on the board"), a link to it, **Create another** (keeps type and area), and **Undo** for 8 s.

Power users get **quick create**: `C`, type a title, `Tab` through inline chips (`@person`, `#area`, `!p1`, `^friday`), `Enter`. Board columns have an inline "+ Add" at the top and bottom.

Also support creation **from email** (forward to `new@<workspace>`), **from a public request form** (shareable link, no login, CAPTCHA via Turnstile, rate-limited), and **from Slack/Teams** (later phase).

### 7.2 Ticket types and the no-code form builder

Admins design ticket types in a **drag-and-drop form builder**:

- Field palette: short text, long text, number, single select (dropdown, cards or segmented), multi-select chips, checkbox list, date, date range, person, rating, URL, file, section heading, help text.
- Drag to reorder; per-field settings for label, help text, placeholder, required, default, options (with emoji and colour), and **show only if** conditions (e.g. "show 'Steps to reproduce' only if type = Bug").
- Mapping panel: which answers become tags, board fields (Priority, Size, Component), assignee or sprint.
- Live preview on desktop and phone frames.
- **Export to GitHub issue-form YAML** (writes or updates the file in `.github/ISSUE_TEMPLATE/` through the App, opening a PR for review), so the same form also works inside GitHub. Conditional fields are flattened in YAML with a note, because GitHub forms can't hide fields.
- Templates: Bug, Feature, Incident, Support, Epic, Task, Research, Change request, Access request, Content update.

### 7.3 Ticket detail

- Inline-editable title; Tiptap description with slash commands (`/checklist`, `/table`, `/image`, `/code`), `@mentions`, `#ticket` links, and embeds.
- Properties panel: status, priority, type, assignees, tags, sprint, release, due and start dates, estimate (points and hours), component, custom fields. Every property is a popover picker with search and keyboard support.
- **Sub-tasks** with progress, drag-to-reorder (GitHub sub-issues, reprioritised via the API), and quick-add.
- **Checklist** items inside the description (GitHub task lists).
- **Relationships:** blocks / blocked by / relates to / duplicates, with a dependency graph. Cycles are rejected with an explanation.
- **Activity timeline:** comments (rich text, reactions, edit history), status changes, field changes, linked code changes ("Fix in progress by Sam" → "Fix shipped"), and time logs, filterable.
- **Time tracking:** start/stop timer in the header, manual entry, totals against the estimate.
- **Watchers**, **Copy link**, **Duplicate**, **Move to another space**, **Convert to epic/sub-task**, **Archive**, and **Won't do** with a reason.
- **Requester view:** a simplified version for guests showing status in words ("We're working on it, expected by Friday"), comments and attachments, with no internal fields.

### 7.4 Views (every view is a saved, shareable, URL-addressable configuration)

All views share one **filter bar**: field chips, AND/OR groups, relative dates ("due this week"), "me" and "my team" tokens, and saved filters. All views support **group by**, **sort**, **visible fields**, **density** (comfortable/compact) and **colour by** any field.

| View | Must do |
|---|---|
| **Board (Kanban)** | Columns from any single-select field (Status by default); **swimlanes** by any field (assignee, priority, epic); WIP limits per column with a visible warning; collapsible columns; drag cards between columns and lanes (animated with Motion `layout`); multi-select drag; card fields configurable; quick-add per column; column totals (count, points). |
| **List** | Grouped, collapsible sections; inline edit of every property; drag to reorder and regroup; sub-tasks nested and expandable. |
| **Table (spreadsheet)** | Virtualised rows; resizable, reorderable, pinnable columns; inline cell editing with keyboard navigation; bulk edit; column calculations (sum, average, count, % complete); CSV export and import with a field-mapping wizard. |
| **Calendar** | Month, week and day; drag to reschedule; drag edges to change start/due; unscheduled tray. |
| **Timeline (Gantt)** | Bars from start to due; drag and resize; dependency arrows with auto-shift prompt; today line; zoom (day to quarter); milestones and releases as diamonds; critical path highlight. |
| **Roadmap** | Epics by quarter and swimlane, with progress bars from sub-tasks. |
| **Backlog & sprint planning** | Backlog list beside the upcoming sprints; drag tickets into sprints; capacity bar per sprint (points vs. team capacity); start and complete sprint (unfinished work moves to the next sprint with a summary). |
| **My Work** | Everything assigned to me, grouped Today / Overdue / This week / Later / No date; quick status changes. |
| **Inbox** | Notifications: mentions, assignments, status changes on watched tickets, approvals needed; mark read, snooze, filter. |
| **Workload** | Per person per week: points or hours scheduled vs. capacity, colour-coded; drag tickets between people. |
| **Mind map / hierarchy tree** | Epic → feature → task tree with expand/collapse and drag to re-parent. |
| **Gallery** | Cards with cover images (design and content teams). |

Default views for a new space: Board, List, Table, Calendar, Timeline, Backlog, plus "Bugs", "Customer requests" and "Triage inbox" (preset filters).

### 7.5 Dashboards and reports

Drag-and-drop dashboard grid with widgets: number tile, burndown, burn-up, velocity (last 6 sprints), cumulative flow, cycle and lead time (percentiles), created vs. resolved, tickets by status, priority, type or assignee (bar or donut), SLA compliance, workload, a saved-view table embed, and a text note. Each widget has a plain-language subtitle ("How much work is left in this sprint"). Export PNG, CSV and a weekly email digest.

### 7.6 Status workflows

Per-space workflow editor (a visual node graph): statuses grouped into categories (To do / In progress / Done), allowed transitions, transition rules (e.g. "Done requires a linked fix" or "only QA can move to Done") and required fields on transition (e.g. "Resolution"). Blocked drags snap back with a tooltip explaining why. Statuses map to the GitHub Project Status field; issue open/closed state follows the category.

### 7.7 Hierarchy

Workspace → Folder → Space → Epic → Ticket → Sub-task (GitHub sub-issues, up to 8 levels). Progress rolls up. Breadcrumbs everywhere.

### 7.8 Collaboration

Real-time presence avatars on boards and tickets, live cursors in descriptions (Tiptap collaboration through Yjs, optional phase), typing indicators in comments, `@team` mentions, emoji reactions, follow/unfollow, and a share link with guest access.

### 7.9 No-code automations

A sentence-style builder: **When** [trigger] **and** [conditions] **then** [actions].

- Triggers: ticket created, status changed, field changed, comment added, due date approaching or passed, fix opened/merged, SLA about to breach, on a schedule.
- Actions: set field, assign (specific, round-robin, least busy), add tag, move to space, create sub-tasks from a template, post a comment, notify person/team/Slack/email, start a timer, apply a template.
- A gallery of recipes ("When a bug is marked Critical, assign the on-call engineer and notify #incidents").
- Every run is logged with input, output and duration. Loops are prevented with execution depth (max 3) and idempotency keys. A **Test run** button previews on a sample ticket.

### 7.10 Notifications

In-app inbox, browser push, email (instant or digest) and Slack. Per-user preferences by event type. Plain-language templates ("Priya moved **Export button** to **Done**").

### 7.11 Search

Global search across titles, descriptions, comments and attachments' names (Postgres full-text + trigram); typo-tolerant; filters; recent searches.

### 7.12 Templates and onboarding

- Space templates: Software (Scrum), Kanban, Bug tracking, IT service desk, Marketing campaign, Product roadmap, Client requests. Each creates fields, views, ticket types and automations.
- First-run onboarding: connect GitHub (install App → pick org and project or create one), invite teammates, pick a template, a 60-second interactive tour with skippable coach marks, and sample data that can be removed with one click.
- **Import** from Jira (CSV/JSON), ClickUp (CSV), Trello (JSON) and Asana (CSV), with field mapping and a dry-run preview.

### 7.13 Permissions

Roles per space: Owner, Admin, Member, Commenter, Viewer, Guest Requester. Field-level hiding for guests. Private spaces. Audit log of permission and settings changes. Every check is enforced on the server in server actions and route handlers; the UI hides what's forbidden but never relies on that.

### 7.14 Settings

Workspace (name, logo, theme, members, billing placeholder), spaces (fields, statuses, ticket types, automations, views), integrations (GitHub App, Slack, email inbound), profile (avatar, theme, density, notification preferences, keyboard shortcuts, language, time zone).

---

## 8. Design system

Write the tokens first (`app/styles/tokens.css` with Tailwind v4 `@theme`), then build screens only from tokens.

- **Feel:** calm, confident, friendly. Neutrals do the work; one accent; semantic colours for status and priority.
- **Colour:** OKLCH. A 12-step neutral ramp, an accent ramp, and success, warning, danger and info ramps. Never pure `#000`/`#fff`. Contrast checked: 4.5:1 for text, 3:1 for UI boundaries. Priority and status always pair colour with an icon and text.
- **Themes:** Light, Dark (lifted surfaces, slightly desaturated) and System, plus **accent presets** (Indigo, Violet, Blue, Teal, Green, Orange, Rose) and **High contrast** mode. Themes switch with no flash (set `data-theme` before paint).
- **Density:** Comfortable (default for Requesters) and Compact (default for Members), switched per user.
- **Type:** Inter or Geist variable for UI, Geist Mono for IDs. Scale at ratio 1.2: 12 / 14 / 16 / 19 / 23 / 28 / 33. Body text 14–16 px; never below 12. Tabular numbers in tables and charts.
- **Space:** 4 px base; group gaps at least 2× in-group gaps.
- **Radius:** 6 (inputs), 10 (cards), 14 (dialogs), with nested radii = outer − padding.
- **Elevation:** 3 levels of layered, hue-tinted shadows; in dark mode use lighter surfaces instead of heavier shadows.
- **Iconography:** Lucide, 16/20 px, 1.5 stroke. Ticket types get a consistent emoji plus a coloured badge.
- **Empty states:** every view has an illustrated empty state that explains what goes here and offers the one action that fills it.
- **Loading:** skeletons shaped like the content; never a full-page spinner.

## 9. Motion spec

Motion explains change; it is never decoration.

| Interaction | Motion |
|---|---|
| Card dragged between columns | Lift (scale 1.02, shadow up) on pickup; drop indicator line; card settles with a spring (`stiffness 500, damping 35`); other cards move with `layout` |
| Drawer open/close | Slide from right, spring, 220 ms feel; backdrop fade 150 ms |
| Dialog / sheet | Scale 0.96 → 1 + fade, 180 ms ease-out; exit 120 ms ease-in |
| Route change | React View Transitions cross-fade; shared element for a ticket card opening into its detail |
| Status change | Badge colour cross-fade + a small check tick when moving to Done |
| Toasts | Slide up + fade; stack with layout animation |
| Lists | Stagger 20 ms per item on first load only, max 10 items |

Rules: 120–240 ms for UI feedback; ease-out to enter, ease-in to exit; animate `transform` and `opacity` only; respect `prefers-reduced-motion` by swapping movement for fades. Drag interactions must hold 60 fps on a mid-range Android phone.

## 10. Accessibility (WCAG 2.2 AA minimum)

- Semantic landmarks; one `h1` per page; visible 2 px focus ring everywhere.
- **Drag-and-drop alternatives:** every draggable has a **Move…** menu (column, position, lane, sprint, person) and keyboard pickup (`Space`), arrow keys to move and `Space` to drop, with live-region announcements ("Moved 'Export button' to Done, position 2 of 5"). Follow Pragmatic drag and drop's accessibility guidelines.
- All pickers are comboboxes with type-ahead. Dialogs trap focus and restore it on close.
- Targets ≥ 24×24 px (44 px on touch). Works at 320 px wide and 200 % zoom without horizontal scroll.
- Run axe in Playwright on every view, and do a manual screen-reader pass (NVDA + VoiceOver) for creating a ticket, using the board and editing a ticket.

## 11. Performance budgets (enforced in CI)

| Metric | Budget |
|---|---|
| LCP (board, mid-range phone, 4G) | < 2.0 s |
| INP | < 100 ms |
| CLS | < 0.05 |
| First-load JS per route | < 170 KB gzip (board), < 120 KB (others) |
| Board with 1,000 cards | Scroll and drag at 60 fps (virtualise columns > 100 cards) |
| Table with 10,000 rows | Smooth scroll; filter in < 150 ms |
| Optimistic write to visible UI | < 50 ms |

Techniques: Cache Components with `'use cache'` for space metadata and views; `<Link prefetch>` for the sidebar; Partial Prefetching; streaming with Suspense skeletons; dynamic import for heavy views (Timeline, Dashboards, editor); TanStack Virtual; images through `next/image`; no layout thrash during drag.

## 12. Security and quality

- GitHub App with the minimum permissions: Issues RW, Projects RW (org), Metadata R, Pull requests R, Contents RW only for writing form YAML (opens a PR, never pushes to main). Verify the webhook signature (`X-Hub-Signature-256`) on every delivery; dedupe by delivery ID.
- Encrypt stored tokens (AES-GCM, key in a secret manager). Sessions are httpOnly, secure, SameSite=Lax. CSRF protection comes from server actions; check origin for route handlers.
- Validate every input with zod on the server. Escape and sanitise rich text (Markdown → HTML through a sanitiser). Use signed, size- and type-limited upload URLs.
- Rate-limit public request forms and auth. Turnstile on public forms.
- Never write secrets, tokens or personal data to logs. Guest requesters' emails appear in issues only if they consent.
- **Tests:**
  - Unit tests (Vitest) for mapping logic (form ↔ YAML, answers ↔ fields, workflow rules, automation engine, loop guard).
  - Integration tests for server actions against MSW-mocked GitHub.
  - Playwright end-to-end for the five key journeys:
    1. A guest creates a ticket.
    2. A member works the board, using drag and the keyboard.
    3. A lead plans a sprint.
    4. An admin builds a form and exports YAML.
    5. An automation fires.
  - axe on every view; visual regression on key screens in light and dark.
- CI: typecheck, lint, test, build, Lighthouse CI against budgets, bundle-size check. Preview deployment per PR.

## 13. Delivery plan (ship in this order; each phase must be demo-able)

| Phase | Scope | Exit criteria |
|---|---|---|
| 0. Foundations | Repo, CI, tokens, theme switcher, shadcn setup, Better Auth (GitHub + magic link), GitHub App install flow, Drizzle schema, webhook receiver + mirror sync, SSE | Sign in, connect an org, see a project's tickets mirrored and updating live |
| 1. Create & view | Guided ticket creation (§7.1), ticket drawer (§7.3 core), List and Board views with filters, My Work | A Requester creates a ticket on a phone in < 30 s; it appears on the board and in GitHub with correct labels and fields |
| 2. Plan | Table, Backlog & sprints, Calendar, saved views, ⌘K, keyboard map, bulk edit | A lead plans and starts a sprint without leaving the app |
| 3. Track & report | Timeline, Roadmap, Workload, Dashboards, time tracking, notifications + Inbox + email | Weekly digest email and a burndown match GitHub data |
| 4. Configure | Form builder + YAML export, workflow editor, automations, templates, permissions, guest portal | An admin creates a new ticket type and automation with no code; a Guest sees only their tickets |
| 5. Scale & polish | Import from Jira/ClickUp/Trello, realtime presence, offline queue, performance pass, full a11y audit, docs | All budgets green; WCAG audit clean; 1,000-card board smooth |

## 14. Definition of done (every feature)

- Works for all four personas, on desktop and phone, mouse, keyboard, touch and screen reader.
- Light and dark mode both deliberately designed; all states designed (empty, loading, error, partial, overflow, no permission, offline).
- Copy reviewed against the glossary; no jargon for Requesters.
- Optimistic, undoable and synced to GitHub, with failures handled visibly.
- Tests at the right level; axe clean; within budgets.
- Docs updated (`docs/` user guide section + ADR if a decision was made).

## 15. Things not to do

- Don't build a second ticket database that drifts from GitHub. The mirror is a cache, not a source of truth.
- Don't ship a feature without its empty, error and loading states.
- Don't use colour alone to signal priority or status.
- Don't add a modal on top of a modal. Don't block the UI on network calls.
- Don't animate layout properties or animate for decoration.
- Don't ask Requesters for anything the system can infer (reporter, browser, page URL, time).
- Don't put secrets in the client bundle, and don't use a personal access token in production.

## 16. Start here

1. Read this repository: `.github/ISSUE_TEMPLATE/*`, `.github/scripts/project-sync.cjs`, `.github/workflows/*`, `docs/`.
2. Write `docs/adr/001-architecture.md` confirming §4 (or proposing changes) and `docs/adr/002-stack.md`.
3. Scaffold with `pnpm create next-app@latest` (TypeScript, Tailwind, App Router; Cache Components on by default in 16.4), then `pnpm dlx shadcn@latest init`.
4. Build Phase 0, open a PR, and stop for review before Phase 1.

---

### Research sources (October 2026)

- [Next.js 16.4 release notes](https://nextjs.org/blog/next-16-4): Cache Components recommended for all new apps, React 19.3, React Compiler
- [shadcn/ui, Tailwind v4 guide](https://ui.shadcn.com/docs/tailwind-v4): React 19, OKLCH, `data-slot`, Sonner replaces toast
- [Motion for React](https://motion.dev/docs/react) and [layout animations](https://motion.dev/docs/react-layout-animations)
- [Drag-and-drop library comparison, 2026](https://www.pkgpulse.com/guides/dnd-kit-vs-react-beautiful-dnd-vs-pragmatic-drag-drop-2026) and [Pragmatic drag and drop guide](https://blog.logrocket.com/implement-pragmatic-drag-drop-library-guide/)
- [Best auth for Next.js in 2026](https://blog.logrocket.com/best-auth-library-nextjs-2026/): Better Auth recommended for new projects
- [How Linear is so fast](https://performance.dev/how-is-linear-so-fast-a-technical-breakdown): local-first, optimistic writes, sync engine
- [GitHub sub-issues and issue types automation](https://josh-ops.com/posts/github-sub-issues-and-issue-types/)
