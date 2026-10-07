# Target Architecture

## Architectural Principles
1. **Separation of Data and View**: Issues are stored in normalized relational schemas. Views (Kanban, List, Timeline, Matrix, etc.) are projections resulting from composable queries (`Query Engine`).
2. **Configuration Over Hardcoding**: Issue types, workflow states, transitions, custom fields, permissions, automations, and card density are entirely driven by system configuration JSON/relational rows.
3. **Domain-Driven Modular Structure**:
   - Backend modules: `issues`, `workflows`, `automations`, `boards`, `sprints`, `releases`, `github`, `permissions`, `custom-fields`, `audit`, `views`.
   - Frontend feature modules: `features/issues`, `features/boards`, `features/workflows`, `features/automations`, `features/roadmaps`, `features/dashboards`, `features/github`.
4. **Event-Driven Execution & Reliability**:
   - Mutation -> Database Outbox -> Domain Event -> Automation Worker / GitHub Sync / Notification Dispatch.
   - Automation Recursion Guard: Tracking `execution_id`, `trigger_depth` (max depth 3), `idempotency_key`, and cooldown loops.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PROJECT MANAGEMENT ENGINE                     │
└────────────────────────────────────────────────────────────────────────┘
  DATA  ──►  CONFIGURATION  ──►  POLICY  ──►  WORKFLOW  ──►  AUTOMATION  ──►  VIEW
```
