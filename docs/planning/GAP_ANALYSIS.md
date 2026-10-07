# Gap Analysis

## Functional Gaps to Fill

| Area | Basic PM Tools | Target Engine Capability |
| --- | --- | --- |
| **Workflow** | Static Todo/In Progress/Done | Fully configurable state machine with validators, conditions, role restrictions & actions |
| **Hierarchy** | Fixed Epic -> Task -> Subtask | Custom hierarchy graph (Initiative -> Epic -> Feature -> Story -> Task -> Subtask, Bug, Security, Spike, etc.) |
| **Views** | Kanban only | Multi-view query engine (Kanban, Scrum, List, Table, Timeline, Roadmap, Calendar, Dependency, Matrix, Release) |
| **Automations** | Simple triggers | Recursive safety engine with idempotency keys, max execution depth, dry runs, execution history |
| **GitHub** | Basic status sync | Deep integration (PR creation, CI check results, deployment hooks, commit parser `PM-142`, branch generation) |
| **Color System** | Random tags | Semantic color system (Type, Priority, Status, SLA, Risk) with WCAG AA contrast validation & dark-mode tokens |
| **Permissions** | Basic Admin/Member | Granular RBAC + Field-level permissions + Security levels (Public, Restricted, Team) |
| **SLA & WIP** | None | SLA Engine with countdowns & pause conditions; WIP limit warning & hard-blocking |
