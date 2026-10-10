# BeyondPM — Jira/ClickUp-style project management on GitHub

Anyone can raise a ticket, and nobody needs to know Git to do it.

## ✨ Create a ticket (for everyone)

Go to **[Issues → New issue](https://github.com/beyondCode-in/pm-tool/issues/new/choose)** and pick a form. Most fields are pick-lists, so there's very little typing.

| Form | Use it for |
|---|---|
| 💡 Ask for something | Anyone who isn't technical: ideas, changes, problems, questions |
| ✨ Feature / user story | New work, with acceptance criteria and a size estimate |
| 🐛 Bug report | Something broken: severity, frequency, environment, browser or device |
| 🚨 Incident | Production down right now |
| 🗺️ Epic | A large piece of work split into features |
| 🧩 Task | A concrete piece of work under a feature or epic |
| 🔬 Spike / research | A time-boxed investigation |
| 🎧 Customer support | A customer needs help |

Security problems are reported privately through the **Report a security vulnerability** link on the same page.

Every form adds the issue to the [project board](https://github.com/orgs/beyondCode-in/projects/34). Your answers become labels automatically: `priority: p0`–`p3`, `area: …`, `size: xs`–`xl` and `severity: …`. That makes the board easy to filter and group.

## 🗂️ What's in the repository

| Path | What it is |
|---|---|
| `.github/ISSUE_TEMPLATE/` | The issue forms above |
| `.github/workflows/` | Form-to-label triage, PR-to-board moves, SLA reminders, CI checks |
| `app/` | Prototype board dashboard |
| `.github/PROJECT_TEMPLATES/`, `templates/` | Board and hierarchy presets (Kanban, Scrum, ClickUp spaces) |
| `lib/` | Jira/ClickUp field adapter |
| `scripts/` | Project field and view setup, dependency and WIP linters, local server |
| `docs/` | Architecture, planning and the phased roadmap |
| `tests/` | Run with `npm test` |

## 🛠️ For maintainers

```bash
npm run serve   # dashboard prototype at http://localhost:3333
npm test
```

To add issues to the board for people who don't have access to the project, add a `PROJECT_TOKEN` repository secret: a token with the `project` scope. To change the pick-list options, edit the YAML in `.github/ISSUE_TEMPLATE/`. Keep the **Priority**, **Areas affected**, **Size estimate** and **Severity** field labels as they are, because the triage workflow reads them.

---

## 🎯 Key Capabilities & Configuration Engine

### 1. Configurable Issue Hierarchy
Default hierarchy with parent-child relationship validation rules:

```
Initiative (Level 0)
   ↓
Epic (Level 1)
   ↓
Feature (Level 2)
   ↓
Story (Level 3)
   ↓
Task (Level 4)
   ↓
Subtask (Level 5)
```

Also includes non-standard issue types: `Bug`, `Incident`, `Security Defect`, `Technical Debt`, `Research / Spike`, `Improvement`, `Support`, `Change Request`.

### 2. Semantic Ticket Color System
Semantic palette mapping colors + icons + badges + text for high accessibility:

| Issue Type / State | Color Token | Visual Indicator |
| --- | --- | --- |
| **BUG** | Red (`#ef4444`) | `Bug` Icon + Red Pill |
| **FEATURE** | Purple (`#a855f7`) | `Layers` Icon + Purple Pill |
| **STORY** | Blue (`#3b82f6`) | `Bookmark` Icon + Blue Pill |
| **TASK** | Cyan (`#06b6d4`) | `CheckSquare` Icon + Cyan Pill |
| **INCIDENT** | Deep Red (`#991b1b`) | `AlertOctagon` Icon + Urgent Pill |
| **SECURITY** | Crimson (`#e11d48`) | `ShieldAlert` Icon + Restricted Pill |
| **TECH DEBT** | Orange (`#f97316`) | `Wrench` Icon + Debt Pill |
| **RESEARCH** | Indigo (`#6366f1`) | `Compass` Icon + Spike Pill |

### 3. Workflow Transition Engine & Restrictions
State transitions with role restrictions and WIP limits:

```
[ BACKLOG ] ──► [ SELECTED ] ──► [ IN PROGRESS ] ──► [ CODE REVIEW ] ──► [ QA ] ──► [ RELEASED / DONE ]
```

- **Role Restrictions**: Only `DEVELOPER` can move `Selected` -> `In Progress`. Only `QA` role can move `QA` -> `Done`.
- **Conditions & Validators**: Linked GitHub PR required for `Code Review`. Approved PR required for `QA` handoff. Unresolved subtasks block closing tickets.
- **WIP Limits**: Column maximum card limits trigger visual warnings and transition blocks when exceeded.

### 4. Automation Safety & Loop Recursion Guard
Directory hierarchy for rule organization:
- `automations/github/` (PR created, PR merged, build failed)
- `automations/tickets/` (auto-assign, stale ticket, overdue)
- `automations/sprints/` (sprint start, sprint finish)
- `automations/releases/` (release ready, release blocked)

**Safety Controls**:
- Tracking `execution_id` and `idempotency_key`
- Maximum trigger depth limit (`trigger_depth` $\le 3$) to halt infinite automation cascades.

### 5. Multi-View Engine
Projects map to 10 customizable views:
1. **Kanban Board** (Columns, WIP limits, Swimlane grouping)
2. **Scrum Sprint View** (Active sprint capacity, story points, burndown)
3. **List View** (Spreadsheet inline editing)
4. **Table Grid View** (Configurable column picker)
5. **Timeline / Gantt View** (Date range scheduling bars)
6. **Strategic Roadmap View** (Quarterly Q1-Q4 epic alignment)
7. **Delivery Calendar View** (Due dates & release targets)
8. **Dependency Graph View** (Circular dependency cycle detection)
9. **2x2 Prioritization Matrix View** (Impact vs Effort grid)
10. **Release Readiness View** (Release versions, bug density, readiness %)

---

## 🚀 How to Use as a GitHub Template

1. Click **Use this template** at the top of the repository on GitHub.
2. Select your Organization (`beyondCode-in`) and repository name.
3. Import GitHub Projects JSON configurations from `.github/PROJECT_TEMPLATES/`.
4. Run CI dependency validation:
   ```bash
   npm test
   ```

---

## 📄 License

Distributed under the MIT License. Created for **beyondCode-in**.
