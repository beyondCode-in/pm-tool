# BeyondPM

**Jira- and ClickUp-style project management that runs on GitHub.** Anyone can raise a ticket from GitHub's **New issue** page by picking from lists, with no technical knowledge needed. Every ticket lands on one project board, and automation keeps its labels and board fields up to date.

- ✅ **Today:** structured ticket forms, automatic labelling, board sync, ticket moves driven by pull requests, SLA reminders.
- 🛠️ **Next:** a full web app (Next.js + shadcn/ui) with boards, timelines, sprints and dashboards on top of the same GitHub data. Its complete build brief is in [`docs/BUILD-PROMPT.md`](docs/BUILD-PROMPT.md).
- ⚠️ **Not here yet:** see [What GitHub can and can't do](#what-github-can-and-cant-do) before you promise Jira parity to anyone.

---

## Contents

1. [Create a ticket (everyone)](#1-create-a-ticket-everyone)
2. [Which form should I use?](#2-which-form-should-i-use)
3. [What happens after you submit](#3-what-happens-after-you-submit)
4. [The project board](#4-the-project-board)
5. [Automation reference](#5-automation-reference)
6. [Labels reference](#6-labels-reference)
7. [Set it up in your own organisation](#7-set-it-up-in-your-own-organisation)
8. [Customise the forms](#8-customise-the-forms)
9. [What GitHub can and can't do](#what-github-can-and-cant-do)
10. [Repository layout](#10-repository-layout)
11. [Development](#11-development)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Create a ticket (everyone)

1. Open **[New issue](https://github.com/beyondCode-in/pm-tool/issues/new/choose)**.
2. Click **Get started** next to the form that fits. Not sure? Use **💡 Ask for something**.
3. Choose from the drop-down lists. Most have a sensible answer already selected.
4. Write a short title and, if you like, a few sentences. **Drag screenshots straight into any text box.**
5. Click **Create**.

That's it. Your ticket is on the [project board](https://github.com/orgs/beyondCode-in/projects/34), and you'll get an email whenever someone comments or the work moves along.

> **Tip.** You can edit your answers later: open the ticket, click **⋯ → Edit**. Labels and board fields update automatically.

## 2. Which form should I use?

| Form | Use it when… | You'll pick |
|---|---|---|
| 💡 **Ask for something** | You're not technical, or you're not sure which form fits | Request type · priority · areas · who's affected · optional deadline |
| ✨ **Feature / user story** | You want something new built | User story · acceptance-criteria checklist · priority · areas · size · timeframe · parent epic · readiness checklist |
| 🐛 **Bug report** | Something is broken | Steps · expected result · priority · severity · how often · areas · environment · browser or device · evidence |
| 🚨 **Incident** | Production is down **right now** | Severity (SEV1–3) · areas · customer impact · start time · actions already taken |
| 🗺️ **Epic** | A big piece of work that splits into many tickets | Goal · success measure · breakdown checklist · priority · areas · timeframe · out of scope |
| 🧩 **Task** | A concrete piece of work under a feature or epic | Parent · "done when" checklist · priority · size · areas · kind of work |
| 🔬 **Spike / research** | You need to answer a question before building | Question · time box · options · deliverables · priority |
| 🎧 **Customer support** | A customer needs help | Customer · category · tier · priority · contact channel · details |

**Security problems** don't go in a public ticket. Use **🔒 Report a security vulnerability** on the same page. It opens a private GitHub security advisory.

### Priority scale (same on every form)

| Answer | Meaning | Board value |
|---|---|---|
| 🔴 P0 — Critical | Something important is stopped | 🔴 Critical |
| 🟠 P1 — High | Needed this sprint | 🟠 High |
| 🟡 P2 — Medium | In the next few weeks (default) | 🟡 Medium |
| 🟢 P3 — Low | Whenever there's time | 🔵 Low |

## 3. What happens after you submit

```
 You click Create
        │
        ▼
 GitHub creates the issue with the form's base labels (e.g. bug, triage)
 and adds it to project #34 (if you have access to the project)
        │
        ▼
 "Issue triage" workflow (seconds later)
   ├─ reads your answers → adds priority / area / size / severity labels
   ├─ with PROJECT_TOKEN: adds it to the board and sets Status = Backlog,
   │  Priority, Ticket Type, Size, Component
   └─ for 💡 requests: posts a short "thanks, nothing else to do" comment
        │
        ▼
 Team triages → assigns → works on it
        │
        ▼
 Pull request says "Fixes #123"
   ├─ PR opened / ready      → Status: 🔍 Code Review
   ├─ PR approved            → Status: 🧪 QA & Testing
   └─ PR merged              → Status: ✅ Done (GitHub closes the issue)
```

## 4. The project board

Board: **[beyondCode-in / Project 34](https://github.com/orgs/beyondCode-in/projects/34)**

**Fields**

| Field | Type | Set by |
|---|---|---|
| Status | 📥 Backlog → 📋 Todo → ⚡ In Progress → 🔍 Code Review → 🧪 QA & Testing → ✅ Done | Triage (Backlog), pull request workflow, people |
| Priority | 🔴 Critical · 🟠 High · 🟡 Medium · 🔵 Low | Triage, from the form |
| Ticket Type | ⚡ Epic · ✨ Feature · 📝 Task · 🐛 Bug · 🎧 Support · ❓ Question | Triage, from the form's labels |
| Component | UI/UX · Backend API · Database · Security · Documentation · Ops | Triage, from the first matching area |
| Size | XS · S · M · L · XL | Triage, from the form (if the field exists) |
| Story Points | Number | People, during planning |
| Sprint, Start date, Target date | Iteration / date | People, during planning |
| Parent issue, Sub-issues progress | Built in | GitHub sub-issues |

**Views:** the board has Kanban, table, roadmap and filtered views, such as triage inbox, bugs and current sprint. GitHub's API can create a view and set its filter, but **grouping and sorting must be set by hand** in the view's menu. See [§7 step 5](#7-set-it-up-in-your-own-organisation).

## 5. Automation reference

| Workflow | Runs when | What it does | Needs |
|---|---|---|---|
| **Issue triage**<br>`no-code-auto-triage.yml` | Issue opened, edited, labelled or unlabelled | Turns form answers into labels; adds the issue to the board and sets Status, Priority, Ticket Type, Size and Component; welcomes 💡 requesters | `PROJECT_TOKEN` for the board part (labels work without it) |
| **Move tickets with pull requests**<br>`no-code-pr-auto-move.yml` | PR opened, reopened, ready for review, approved or merged | Moves linked issues to Code Review → QA & Testing → Done. Link with `Fixes #12`, `Closes #12` or `Refs #12` in the PR description. Draft PRs are ignored. | `PROJECT_TOKEN` |
| **SLA reminders**<br>`no-code-sla-reminder.yml` | Weekdays 09:00 UTC, or manually | One reminder on P0s and incidents open more than 4 h, and one on issues unassigned for more than 48 h. Never repeats the same reminder on the same issue. | — |
| **Project sync and guardrails**<br>`project-automation.yml` | Issues and PRs | Runs the dependency-cycle and WIP-limit checks | — |

Shared logic is in [`.github/scripts/project-sync.cjs`](.github/scripts/project-sync.cjs) and tested by `tests/project-sync.test.js`. Board fields and options are looked up **by name** at run time, so you can rename "🟠 High" to "🟠 High priority" without changing code. The word "High" just has to stay in the name.

## 6. Labels reference

| Label | Added by | Meaning |
|---|---|---|
| `request`, `feature`, `bug`, `incident`, `epic`, `task`, `spike`, `support` | The form | Which form was used |
| `triage` | The form | Not reviewed yet. Remove it once triaged. |
| `enhancement`, `design`, `question` | Triage, from 💡 request type | What kind of request |
| `priority: p0` … `priority: p3` | Triage | Priority answer |
| `area: web-app`, `area: api`, `area: login`, … | Triage | Each area picked |
| `size: xs` … `size: xl` | Triage | Size estimate |
| `severity: sev1`…`sev3`, `severity: blocker`/`major`/`minor`/`cosmetic` | Triage | Severity answer |

The workflow **owns** the `priority:`, `area:`, `size:` and `severity:` labels. If you edit the answers it swaps them, and if you change one by hand it will be reset on the next edit. Other labels are never touched. Missing labels are created automatically.

## 7. Set it up in your own organisation

1. **Use this template:** click **Use this template → Create a new repository**.
2. **Point it at your board.** Replace `beyondCode-in` and `34` with your organisation and project number in:
   - `.github/ISSUE_TEMPLATE/*.yml` (the `projects:` line)
   - `.github/ISSUE_TEMPLATE/config.yml`
   - `.github/scripts/project-sync.cjs` (`PROJECT`)
   - `.github/workflows/no-code-auto-triage.yml` (welcome comment link)
3. **Create the board fields** your board doesn't have yet (Status, Priority, Ticket Type, Component, Size, Story Points, Sprint). Either add them by hand or run `npm run setup:fields`. That script uses the GitHub CLI and has its project ID hard-coded in `scripts/setup-jira-project-fields.js`, so edit that first.
4. **Add the `PROJECT_TOKEN` secret.**
   - Create a [fine-grained token](https://github.com/settings/personal-access-tokens/new) owned by the organisation, with **Projects: read and write** (organisation) and **Issues: read and write** (this repository).
   - Add it under **Settings → Secrets and variables → Actions → New repository secret**, named `PROJECT_TOKEN`.
   - Without it, labels still work, but nothing writes to the board.
5. **Set grouping and sorting on each view** (the API can't). Open each view and use the view menu ▾:

   | View | Layout · filter (set by API) | Set by hand: group / columns | Sort |
   |---|---|---|---|
   | 📋 Kanban | Board · `is:issue` | Columns: Status | Priority |
   | 🏃 Current sprint | Board · `sprint:@current` | Columns: Status; swimlanes: Assignees | Priority |
   | 👤 My work | Board · `assignee:@me is:open` | Columns: Status | Target date |
   | 🔥 Priority matrix | Board · `is:open` | Columns: Priority | Updated |
   | 📚 Backlog | Table · Backlog + Todo | Group: Ticket Type | Priority, then Created |
   | 📥 Triage inbox | Table · `label:triage` | — | Created (oldest first) |
   | 🐛 Bugs & incidents | Table · `label:bug,incident` | Group: Priority | Created |
   | 🎧 Customer requests | Table · `label:request,support` | Group: Status | Created |
   | 🗓️ Sprint planning | Table · not Done | Group: Sprint; sum Story Points | Priority |
   | 🧩 By component | Table · `is:open` | Group: Component | Status |
   | 🌳 Hierarchy | Table | Group: Parent issue | — |
   | ✅ Recently done | Table · Done in last 14 days | Group: Ticket Type | Updated |
   | 🗺️ Roadmap | Roadmap · epics and tasks | Dates: Start date → Target date; group: Ticket Type | — |
   | 📆 Timeline | Roadmap · all issues | Dates: Start date → Target date; zoom: Month | — |

6. **Check it:** create a test ticket with each form and confirm the labels, board fields and welcome comment appear. Then delete the test tickets.

## 8. Customise the forms

The forms are YAML files in `.github/ISSUE_TEMPLATE/`. Edit them in the browser: GitHub shows a **Preview** tab for issue forms.

Add an option to a pick-list:

```yaml
  - type: dropdown
    id: areas
    attributes:
      label: "Areas affected"       # keep this label: the triage workflow reads it
      multiple: true
      options:
        - "🌐 Web app"
        - "🛒 Checkout"              # new → becomes the label "area: checkout"
```

**Rules**

- Keep the field labels **Priority**, **Areas affected**, **Size estimate**, **Severity** and **What kind of request is this?** exactly as they are. The triage workflow finds answers by these headings.
- Priority options must contain `P0`–`P3`. Size options must start with `XS`, `S`, `M`, `L` or `XL`.
- Area labels come from the option's first words, before ` / ` or ` & `. Emoji are dropped. `"⚙️ API / backend"` becomes `area: api`.
- Don't put commas in options of multi-select fields. Answers are comma-separated.
- `default:` is a zero-based index into `options`.
- After changing the parsing rules, run `npm test`.

## What GitHub can and can't do

| Jira / ClickUp feature | Here |
|---|---|
| Ticket types with structured forms, pick-lists, checklists, required fields | ✅ |
| Kanban, table and roadmap views; custom fields; sprints (iterations) | ✅ GitHub Projects |
| Epics → stories → sub-tasks with progress | ✅ Sub-issues |
| Automation (labels, status moves, reminders) | ✅ GitHub Actions in this repo |
| Fields that show or hide based on earlier answers | ❌ Not in GitHub forms; planned in the web app |
| Blocking a card from skipping a status | ❌ Not in GitHub; planned in the web app |
| Time tracking, workload view, built-in burndown | ❌ Partly via Insights charts; planned in the web app |
| Drag-and-drop form builder, users without GitHub accounts | ❌ Planned in the web app ([`docs/BUILD-PROMPT.md`](docs/BUILD-PROMPT.md)) |
| Per-field permissions | ❌ Use team roles (read, triage, write) |

## 10. Repository layout

```
.github/
  ISSUE_TEMPLATE/        8 issue forms + config.yml (chooser links)
  workflows/             triage, PR → status, SLA reminders, guardrails
  scripts/               project-sync.cjs (shared by the workflows)
  PROJECT_TEMPLATES/     board presets (Kanban, Scrum) as JSON
  PULL_REQUEST_TEMPLATE.md
app/                     static prototype dashboard (npm run serve)
docs/
  BUILD-PROMPT.md        build brief for the Next.js web app
  phases/, planning/     roadmap and design notes
lib/                     Jira/ClickUp workflow rules (transitions, WIP, SLA, tree)
scripts/                 board setup scripts (GitHub CLI) and CI linters
templates/               space and hierarchy presets
tests/                   npm test
```

## 11. Development

Requirements: Node.js 20+; GitHub CLI (`gh`) logged in, for the setup scripts only.

```bash
npm test          # workflow logic, rules engine, linters, prototype checks
npm run serve     # prototype dashboard at http://localhost:3333
```

`scripts/validate-circular-dependencies.js` and `scripts/audit-wip-limits.js` currently check **built-in sample data**, not your live board.

## 12. Troubleshooting

| Problem | Cause and fix |
|---|---|
| A form doesn't appear on **New issue** | Forms are read from the **default branch** only. Merge to `main`. Then check the YAML in the file's Preview tab. |
| Labels appear but nothing reaches the board | `PROJECT_TOKEN` is missing or lacks **Projects: read and write**. Check the workflow log: the "Sync to project board" step is skipped without it. |
| A board field isn't set | The field or option doesn't exist on the board, or its name lost the matching word. The log says `skip <Field>=<value>`. |
| A ticket didn't move when the PR opened | The PR description must say `Fixes #N` (or `Closes` or `Refs`). Draft PRs are ignored until they're marked ready. |
| `area:` labels look odd | Change the option text in the form; the label comes from its first words. See [§8](#8-customise-the-forms). |

---

MIT licensed.
