# BeyondPM: Target System Architecture

**Document Version:** 1.0.0  
**Architect:** Principal System Architect & Staff Full-Stack Engineer  
**Status:** Approved for Implementation  
**Target Repository:** `beyondCode-in/pm-tool`

---

## 1. Architectural Vision & Core Philosophy

The fundamental philosophy of BeyondPM is:
> **GitHub = Engineering Source of Truth**  
> **BeyondPM = Planning, Workflow, Collaboration, Automation, Analytics, and Management Layer**

BeyondPM delivers the deep workflow customization and enterprise controls of Jira and the flexible multi-view hierarchy of ClickUp, combined with an original high-performance UI and a low-code/no-code configuration model accessible to non-technical Project Managers.

```
+-----------------------------------------------------------------------------------------+
|                                    CLIENT TIER (SPA)                                    |
|   +-------------------+  +--------------------+  +------------------+  +-------------+  |
|   |  App Shell & Nav  |  | Board / List / Cal |  | Workflow Builder |  |  Command    |  |
|   |  & Workspaces     |  | Roadmap & Timeline |  | Automation Canvas|  | Palette KBD |  |
|   +-------------------+  +--------------------+  +------------------+  +-------------+  |
|               |                     |                     |                   |         |
|               +---------------------+---------------------+-------------------+         |
|                                     | HTTP / WS                                         |
+-------------------------------------v---------------------------------------------------+
                                      |
+-------------------------------------v---------------------------------------------------+
|                                 APPLICATION TIER                                        |
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   |                         API Gateway / Fastify & Express                         |   |
|   |       (Auth Middleware, RBAC Guard, Tenant Context, Rate Limiting, CORS)        |   |
|   +---------------------------------------------------------------------------------+   |
|            |                        |                        |               |          |
|            v                        v                        v               v          |
|   +-----------------+      +-----------------+      +-------------+   +--------------+  |
|   | WorkItem Engine |      | Workflow State  |      | Automation  |   | Realtime     |  |
|   | & Custom Fields |      | Machine Runtime |      | Rule Engine |   | Event Hub    |  |
|   +-----------------+      +-----------------+      +-------------+   +--------------+  |
|            |                        |                        |               |          |
|            v                        v                        v               v          |
|   +---------------------------------------------------------------------------------+   |
|   |                    GitHub Integration & Bi-Directional Sync                     |   |
|   |    (Webhook Parser, HMAC Auth, Branch/PR/Commit Correlator, GraphQL Dispatcher) |   |
|   +---------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------------+
                                      |
+-------------------------------------v---------------------------------------------------+
|                                 DATA & PERSISTENCE TIER                                 |
|   +---------------------------------------------------------------------------------+   |
|   |                Relational Persistence Layer (SQLite / PostgreSQL)                |   |
|   |   30+ Normalized Tables: Tenancy, Items, Types, Workflows, Automations, GitHub  |   |
|   |                 Indexes, Foreign Keys, JSONB Flexibility Attributes              |   |
|   +---------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Core Subsystems & Component Topology

### 2.1 Multi-Tenant Organization & Workspace Hierarchy
The system models a strict hierarchical scope:
$$\text{Organization} \longrightarrow \text{Workspace} \longrightarrow \text{Project} \longrightarrow \text{WorkItem}$$
- **Organization:** Highest administrative boundary, tenant billing, global SSO/OAuth, high-level policies.
- **Workspace:** Collaboration boundary (e.g., "Engineering", "Marketing", "Customer Ops"), team rosters, default workflows.
- **Project:** The active planning unit containing boards, backlogs, sprints, releases, documentation, and linked GitHub repositories.
- **Permissions:** Inherited down the tree with explicit project-level overrides.

### 2.2 Generic WorkItem Engine
Instead of rigid hardcoded ticket tables, all actionable units inherit from a single polymorphic `work_items` entity:
- **Default Types:** Epic, Story, Feature, Task, Subtask, Bug, Improvement, Research, Spike, Incident.
- **Custom Types:** Dynamically defined by PMs with customizable icons, hex badges, allowed parent types, allowed child types, and default workflows.
- **DAG Relationships:** Items support directed acyclic graph (DAG) relationships: `parent_of`, `subtask_of`, `blocks`, `blocked_by`, `relates_to`, `duplicates`. Cycle detection runs on every link creation.

### 2.3 Board & Multi-View Engine
Views are query projections over work items:
- **Kanban Board:** Multi-column view with user-configurable grouping (Status, Assignee, Priority, Epic, Sprint) and horizontal swimlanes.
- **Scrum Backlog:** Product backlog with drag-to-sprint capacity meters, story point rollups, and velocity forecasting.
- **Table / List View:** Dense data grid with column reordering, multi-column sorting, and inline cell editing.
- **Calendar & Timeline:** Date-driven schedule rendering by start and due dates.
- **Interactive Roadmap:** Multi-tier Gantt view (Day, Week, Month, Quarter) with dependency line rendering and drag rescheduling.

### 2.4 Workflow State Machine
Workflows are directed graphs $(S, T)$ where:
- $S$ is the set of statuses (`category`: `NOT_STARTED`, `ACTIVE`, `COMPLETED`, `CANCELLED`).
- $T$ is the set of allowed transitions $(s_i \to s_j)$ with conditional guards:
  - Guard: Pull Request required (`has_linked_pr == true`).
  - Guard: Role requirement (`user_role in ['QA', 'ADMIN']`).
  - Guard: Required custom fields populated (`fields.severity != null`).
  - Guard: CI checks passed (`ci_status == 'SUCCESS'`).

### 2.5 No-Code Automation Engine
A deterministic event-driven pipeline operating on:
$$\mathbf{WHEN} \; (\text{Trigger}) \implies \mathbf{IF} \; (\text{Conditions}) \implies \mathbf{THEN} \; (\text{Actions})$$
- **Triggers:** Item created/updated, status changed, assignee modified, PR opened/merged, CI check completed, due date reached (cron schedule), webhook received.
- **Conditions:** Field value matches, status in list, priority equals, has linked PR, role equals.
- **Actions:** Update status, assign user, add/remove label, post comment, send notification, trigger webhook, create child task.
- **Audit Execution Log:** Every automation run writes an immutable log record with execution duration, payload snapshot, evaluated conditions, and status (`SUCCESS` / `FAILED`).

### 2.6 Custom Fields & Dynamic Layout Designer
- **Supported Field Types (20):** Text, Textarea, Number, Currency, Percentage, Dropdown, Multi-select, Checkbox, Radio, Date, Datetime, User, Multi-user, URL, Email, Repository, Branch, PR, Formula, Relationship.
- **Storage Strategy:** Normalized definitions in `custom_fields`; instance values in `custom_field_values` (with indexed typed columns: `text_val`, `num_val`, `date_val`, `json_val`).
- **Dynamic Layout:** Drag-and-drop form section editor defining section groupings (General, Engineering, Tracking, Custom) and field display order.

### 2.7 GitHub Native Integration & Event Correlation
- **Authentication:** GitHub OAuth App & GitHub App installation tokens encrypted via AES-256-GCM.
- **Webhook Ingestion:** Fast cryptographic signature verification (`X-Hub-Signature-256`), delivery deduplication (`X-GitHub-Delivery`), and asynchronous processing.
- **Entity Correlation Engine:**
  - Branch names: `feature/PROJ-142-auth` $\to$ extracts `PROJ-142`.
  - Commits: `PROJ-142: add oauth callback` $\to$ extracts `PROJ-142`.
  - Pull Requests: `#341 [PROJ-142] Implement Authentication` $\to$ extracts `PROJ-142`.
- **Live Development Panel:** Aggregates real-time GitHub status for any issue: linked branches, active commits, PR review state (approved/pending), CI/CD Actions status (passed/failed), and deployment environments (staging/production).

### 2.8 Real-Time Broadcast & Event Hub
- **Mechanism:** WebSocket hub with topic-based pub/sub channels (`workspace:{id}`, `project:{id}`, `board:{id}`).
- **Optimistic UI Reconciliation:** Client updates state locally immediately, sends mutation with sequence nonce, and reconciles upon server broadcast or rolls back with an error toast on rejection.

### 2.9 Command Palette (`Ctrl+K`) & Global Query Engine
- **Command Palette:** Keyboard-first modal for instant navigation, ticket creation, sprint switching, and workspace changes.
- **Structured Search Syntax:** Evaluates queries such as:
  - `assignee:me status:"In Progress"`
  - `type:bug priority:critical`
  - `sprint:"Sprint 12" repo:pm-tool`

---

## 3. Architectural Decision Records (ADRs)

### ADR-001: Authentication, Identity & Multi-Tenant Isolation
- **Context:** The system must support organization accounts, team workspaces, and GitHub OAuth without leaking cross-tenant data.
- **Decision:** Use session JWTs signed with HMAC-SHA256 containing `userId`, `orgId`, and active `workspaceId`. Enforce tenant filtering on every database query using a scoped repository wrapper: `WHERE organization_id = :orgId AND workspace_id = :workspaceId`.
- **Consequences:** Eliminates cross-tenant data leakage risks. Switching workspaces issues an updated token payload.

### ADR-002: Persistence Engine & Relational Schema
- **Context:** We need a robust, scalable relational engine capable of handling 100,000+ items, complex joins, and transactional integrity.
- **Decision:** Implement a dual SQLite (development/embedded) and PostgreSQL (production) compatible schema using an abstraction layer with standardized SQL. Avoid storing core relational data in opaque JSON columns; restrict JSON usage to dynamic custom field configurations and raw webhook payloads.
- **Consequences:** Ensures full referential integrity with foreign key cascading, index performance, and smooth local developer onboarding.

### ADR-003: Real-Time Synchronization Strategy
- **Context:** Multiple users editing boards and tickets simultaneously require instant synchronization without manual reloads.
- **Decision:** Implement a WebSocket event hub with Server-Sent Events (SSE) fallback. Mutations emit granular change events (`ITEM_MOVED`, `COMMENT_ADDED`, `PR_LINKED`). Clients maintain versioned local caches with optimistic reconciliation.
- **Consequences:** Sub-50ms visual updates across team members. Fallback to HTTP polling if WebSocket connectivity is blocked.

### ADR-004: GitHub Bi-Directional Synchronization Architecture
- **Context:** GitHub is the engineering source of truth, while BeyondPM is the planning layer. Both systems must remain in sync without infinite update loops.
- **Decision:** Use an idempotent event pipeline with an origin attribution tag (`origin: "beyondpm"` vs `origin: "github"`). When BeyondPM mutates an issue, it marks the change with a sync lock so incoming echo webhooks from GitHub are acknowledged without re-triggering BeyondPM automations.
- **Consequences:** Zero circular sync loops, reliable conflict resolution, and deterministic state.

### ADR-005: Automation Engine Rule Execution Model
- **Context:** Non-technical PMs need to create complex triggers without writing code or introducing server vulnerabilities.
- **Decision:** Build an in-process, sandboxed AST-based rule evaluator for conditions and a typed action dispatcher. Restrict actions to an allowlist of internal API calls. Run automated tasks asynchronously with strict timeout budgets (5000ms max execution time per rule) and write full execution telemetry to an `automation_runs` table.
- **Consequences:** Safe, performant, and fully auditable no-code automation without security risks from arbitrary code execution.
