# Directory Plan

## Unified Monorepo / Domain-Centric Structure

```
pm-tool/
├── docs/                      # Architectural & design documentation
│   ├── planning/              # Initial phase planning documents
│   ├── 00-overview/
│   ├── 01-product/
│   ├── 02-architecture/
│   ├── 03-project-management/
│   ├── 04-automation/
│   ├── 05-integrations/
│   ├── 06-security/
│   ├── 07-design-system/
│   ├── 08-api/
│   ├── 09-testing/
│   └── 10-deployment/
│
├── src/
│   ├── server/                # Express / Node backend API & Domain Engine
│   │   ├── modules/
│   │   │   ├── organizations/
│   │   │   ├── workspaces/
│   │   │   ├── projects/
│   │   │   ├── issues/
│   │   │   ├── issue-types/
│   │   │   ├── workflows/
│   │   │   ├── automations/
│   │   │   ├── boards/
│   │   │   ├── views/
│   │   │   ├── sprints/
│   │   │   ├── releases/
│   │   │   ├── permissions/
│   │   │   ├── custom-fields/
│   │   │   ├── github/
│   │   │   ├── analytics/
│   │   │   └── audit/
│   │   ├── db/                # Persistence & seed engine
│   │   └── index.ts           # Express server entry point
│   │
│   ├── client/                # React + Vite Frontend
│   │   ├── components/
│   │   │   ├── ui/            # Design System primitives (Buttons, Modals, Badges, Cards)
│   │   │   ├── shared/        # Multi-purpose UI components (Header, Command Palette)
│   │   │   └── layout/        # App Layout, Sidebar, View Switcher
│   │   ├── features/
│   │   │   ├── issues/        # Issue Detail, Compact/Standard/Detailed Cards, Hierarchy Tree
│   │   │   ├── boards/        # Kanban, Scrum, List, Table, Timeline, Roadmap, Calendar, Graph, Matrix
│   │   │   ├── workflows/     # Visual Workflow Builder & Restrictions
│   │   │   ├── automations/   # Automation Directory, Rule Builder & Safety Logs
│   │   │   ├── sprints/       # Sprint Planning & Burndown
│   │   │   ├── releases/      # Release Tracker & Health
│   │   │   ├── roadmaps/      # Q1-Q4 Strategic Roadmap
│   │   │   ├── dashboards/    # Customizable Widgets & Metrics
│   │   │   ├── search/        # Global Command Palette & Filter Engine
│   │   │   ├── github/        # Linked PRs, Commits, CI Status
│   │   │   └── settings/      # Project & Workspace Configuration
│   │   ├── stores/            # Client state management
│   │   ├── styles/            # CSS tokens, glassmorphic theme, dark mode
│   │   └── App.tsx            # React Root Component
│   └── shared/                # Common TypeScript types, schemas & DTOs
└── tests/                     # Automated Test Suites
```
