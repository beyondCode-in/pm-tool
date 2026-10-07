# BeyondPM — GitHub Projects Template Repository (`beyondCode-in`)

> **Enterprise Project Management Engine & GitHub Projects V2 Template**
> Combining the finest architectural concepts from Jira, GitHub Projects V2, Linear, ClickUp, Trello, and Notion databases into a clean, customizable GitHub Template Repository.

---

## ⚡ Overview

`beyondCode-in/pm-tool` is an enterprise-grade GitHub Template Repository designed to bootstrap custom project management engines directly within GitHub Organizations.

It provides configurable issue hierarchies, semantic color tokens, workflow transition guardrails, WIP limit checks, automation safety recursion guards, circular dependency detection, and project views.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GITHUB PROJECTS V2 ENGINE                       │
└────────────────────────────────────────────────────────────────────────┘
  DATA  ──►  CONFIGURATION  ──►  POLICY  ──►  WORKFLOW  ──►  AUTOMATION  ──►  VIEW
```

---

## 🏗️ Repository Architecture

```
pm-tool/
├── .github/
│   ├── ISSUE_TEMPLATE/        # Structured YAML Issue Templates (Features, Bugs, Incidents, Security, Epics)
│   │   ├── 01_feature_request.yml
│   │   ├── 02_bug_report.yml
│   │   ├── 03_incident_report.yml
│   │   ├── 04_security_vulnerability.yml
│   │   ├── 05_epic_template.yml
│   │   └── config.yml
│   ├── workflows/             # GitHub Actions Automation Workflows
│   │   └── project-automation.yml
│   ├── PROJECT_TEMPLATES/     # GitHub Projects V2 Configuration Schemas
│   │   ├── engineering_kanban.json
│   │   ├── scrum_sprint_planning.json
│   │   ├── architecture_roadmap.json
│   │   └── bug_triage_matrix.json
│   └── PULL_REQUEST_TEMPLATE.md
│
├── docs/                      # Complete Master Architectural Blueprint
│   ├── planning/              # All 15 Required Planning Documents
│   │   ├── CURRENT_STATE.md
│   │   ├── GAP_ANALYSIS.md
│   │   ├── TARGET_ARCHITECTURE.md
│   │   ├── DATABASE_PLAN.md
│   │   ├── DIRECTORY_PLAN.md
│   │   ├── UI_UX_PLAN.md
│   │   ├── BOARD_ENGINE.md
│   │   ├── WORKFLOW_ENGINE.md
│   │   ├── AUTOMATION_ENGINE.md
│   │   ├── PERMISSION_MODEL.md
│   │   ├── GITHUB_INTEGRATION.md
│   │   ├── MIGRATION_PLAN.md
│   │   ├── SECURITY_REVIEW.md
│   │   ├── TESTING_STRATEGY.md
│   │   └── IMPLEMENTATION_ROADMAP.md
│   └── 00-overview/ to 10-deployment/
│
├── scripts/                   # Dependency & WIP Limit CI Linter Scripts
│   ├── validate-circular-dependencies.js
│   └── audit-wip-limits.js
│
├── package.json
└── README.md
```

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
