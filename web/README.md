# BeyondPM web app

A Jira/ClickUp-style front end for the GitHub project board. Everyone works in friendly views. Every ticket is still a real GitHub issue on project #34, so engineers keep working in GitHub and nothing is copied by hand.

It's a static site on **GitHub Pages**. The browser talks to the GitHub API with the signed-in person's own token, so there's no server and no database. One tiny Cloudflare Worker handles the GitHub sign-in step.

## What's in it

| Area | What people can do |
|---|---|
| **Create** | Three-step wizard: pick a ticket type card (or drag it onto the preview), describe it with title ideas and prompt chips, choose priority, areas and owner. The draft autosaves. Tickets use the same layout as the GitHub issue forms, so the triage workflow labels them the same way. |
| **My work** | Your tickets grouped by overdue, today, this week, later and no date. |
| **Inbox** | New tickets with the `triage` tag, grouped into customer requests, bugs and everything else. |
| **Board** | Kanban by stage. Drag between columns. Swimlanes by priority, person or type. Work-in-progress limits. While dragging, a dock lets you drop on a person (assign), a priority, or *Won't do*. Every card also has a keyboard-friendly **Move to…** menu. |
| **Sprint** | The current sprint's board. |
| **Backlog** | Spreadsheet table: sort, group (sprint, status, type, priority, person, component) and edit any cell in place. |
| **Roadmap** | Timeline of epics and their tickets, from start and due dates or the sprint, with sprint bands, a today line and zoom. |
| **Calendar** | Month view of due dates. Drag a ticket to a day, or to *No due date*. |
| **Epics** | Epic → ticket → sub-task tree with progress. |
| **Dashboard** | Open, finished this week, overdue, sprint progress, burndown, work by stage, workload, and what needs attention. |
| **Ticket drawer** | Title, one-click status, assignees, priority, type, size, component, sprint, points, dates, tags, Markdown description, sub-tasks and comments. Close as complete or *won't do*, reopen, copy a link. |
| **Everywhere** | Search and filters saved in the URL, so any view is shareable. ⌘/Ctrl K palette, keyboard shortcuts (`?` lists them), undo on every change, light, dark and device themes with seven accent colours, a guide with a first-week checklist and spotlight tour. Works on phones. |

Changes appear instantly and are saved to GitHub in the background. If GitHub refuses a change, the screen goes back and says why. The board refreshes every 45 seconds and whenever you return to the tab.

## Run it locally

```bash
cd web
npm install
npm run dev          # http://localhost:3000
```

Choose **Explore the demo board** to try everything with sample data, no account needed. To use the real board, sign in with a GitHub token that has the `repo`, `read:org` and `project` scopes.

Checks: `npx tsc --noEmit`, `npx eslint src`, `npx next build` (writes the static site to `out/`).

## Deploy to GitHub Pages

1. **Turn on Pages:** go to **Settings → Pages → Source: GitHub Actions**.
2. **Merge to `main`:** `.github/workflows/web-pages.yml` builds `web/` and publishes it at `https://<owner>.github.io/<repo>/`.
3. That's enough for the demo and token sign-in. For one-click **Continue with GitHub**, also set up sign-in (below).

### One-click GitHub sign-in

1. **Create an OAuth app.** Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
   - Homepage URL: `https://beyondcode-in.github.io/pm-tool/`
   - Authorization callback URL: `https://beyondcode-in.github.io/pm-tool/auth/callback/`

   Copy the **Client ID** and generate a **Client secret**.
2. **Deploy the Worker** in `worker/` (Cloudflare's free plan is enough):
   ```bash
   cd web/worker
   npx wrangler login
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   npx wrangler deploy        # prints the Worker URL
   ```
   `ALLOWED_ORIGIN` in `wrangler.toml` must be your Pages origin, for example `https://beyondcode-in.github.io`.
3. **Add two repository variables.** Go to **Settings → Secrets and variables → Actions → Variables** and add:
   - `OAUTH_CLIENT_ID`: the client ID.
   - `AUTH_WORKER_URL`: the Worker URL.

   Then re-run **Publish web app**.

## Configuration

| Variable (build time) | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_GITHUB_OWNER` | `beyondCode-in` | Organisation that owns the board and repository |
| `NEXT_PUBLIC_GITHUB_REPO` | `pm-tool` | Repository where new tickets are created |
| `NEXT_PUBLIC_PROJECT_NUMBER` | `34` | Project (v2) board number |
| `NEXT_PUBLIC_OAUTH_CLIENT_ID` | — | Enables *Continue with GitHub* |
| `NEXT_PUBLIC_AUTH_WORKER_URL` | — | The sign-in Worker |
| `NEXT_PUBLIC_BASE_PATH` | — | `/<repo>` on Pages, set by the workflow |

The app reads the board's field names: **Status, Priority, Ticket Type, Component, Size, Story Points, Start date, Target date, Sprint**. Missing fields are simply hidden. Options are read from the board, so renaming or adding an option needs no code change.

## How it's built

```
src/
  app/            routes: login, auth callback, and one page per view under (app)/
  components/
    brand/        logo, loader, aurora background, empty and error states
    create/       the create-ticket wizard
    guide/        floating guide and spotlight tour
    shell/        sidebar, mobile bar, command palette, view page wrapper
    ticket/       drawer, pickers, small badges
    views/        board, table and list, roadmap, calendar, epics, dashboard, drag dock
    ui/           shadcn/ui components (Base UI)
  lib/
    github.ts     GitHub GraphQL and REST data source
    demo.ts       in-memory sample data source (same interface)
    data.tsx      React Query cache, optimistic writes, undo, rollback
    ticket-types  the ticket types, mirroring .github/ISSUE_TEMPLATE
    board.ts      shared board helpers and filters
worker/           Cloudflare Worker for the OAuth code exchange
```

Stack: Next.js 16 (static export), React 19, TypeScript, Tailwind CSS v4, shadcn/ui on Base UI, Motion, Atlassian Pragmatic drag and drop, TanStack Query, nuqs, Recharts, date-fns and react-markdown.

## Security notes

- The GitHub token is kept in the browser's local storage and is sent only to `api.github.com`. Signing out removes it.
- The Worker only answers requests from `ALLOWED_ORIGIN`, only returns tokens for callback URLs on that origin, and stores nothing.
- The OAuth sign-in checks a one-time `state` value to block forged callbacks.
- People can only see and change what their own GitHub account can.
