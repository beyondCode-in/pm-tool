# BeyondPM: Normalized Relational Database Schema Design

**Document Version:** 1.0.0  
**Architect:** Principal Data Architect & Staff Full-Stack Engineer  
**Status:** Canonical Reference Schema  
**Target Persistence Engines:** PostgreSQL (Production) / SQLite (Development & Embedded)

---

## 1. Schema Architecture Principles

1. **Strict Normalization:** First to Third Normal Form (3NF) adherence across all core entities.
2. **Explicit Foreign Keys & Cascades:** Referential integrity enforced via foreign keys with cascade deletes or `ON DELETE SET NULL` as appropriate.
3. **Multi-Tenant Isolation:** All tenant-scoped entities include `organization_id` (and `workspace_id` / `project_id` where appropriate) with composite indexes for rapid filtering.
4. **Controlled Semi-Structured Data:** Restrict `JSON`/`JSONB` columns strictly to dynamic field configurations, raw incoming webhook payloads, and notification metadata.
5. **Soft Deletion:** Business-critical entities (`projects`, `work_items`, `sprints`, `workflows`) utilize `deleted_at TIMESTAMP NULL` to preserve historical integrity.
6. **Immutable Audit Trails:** All operations produce append-only audit records in `activities`.

---

## 2. Entity Relationship Overview

```
organizations (1) ────< (N) workspaces (1) ────< (N) projects (1) ────< (N) work_items
      │                         │                      │                      │
      ├──< teams                └──< members           ├──< boards            ├──< comments
      └──< roles & permissions                         ├──< workflows         ├──< relations (DAG)
                                                       ├──< sprints           ├──< custom_values
                                                       ├──< releases          └──< github_links
                                                       └──< automations
```

---

## 3. Comprehensive Entity Definitions

### 3.1 Tenancy & Identity Subsystem

#### `organizations`
- `id` (VARCHAR(36) PRIMARY KEY): UUID v4 identifier.
- `slug` (VARCHAR(64) UNIQUE NOT NULL): URL-safe organization slug (e.g. `beyondcode-in`).
- `name` (VARCHAR(255) NOT NULL): Display name.
- `logo_url` (VARCHAR(512) NULL): Organization avatar/logo.
- `plan` (VARCHAR(32) NOT NULL DEFAULT 'enterprise'): Subscription tier (`starter`, `growth`, `enterprise`).
- `created_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).
- `updated_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).
- `deleted_at` (TIMESTAMP NULL).

#### `workspaces`
- `id` (VARCHAR(36) PRIMARY KEY): UUID v4 identifier.
- `organization_id` (VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE).
- `slug` (VARCHAR(64) NOT NULL): URL-safe workspace slug (e.g. `core-platform`).
- `name` (VARCHAR(255) NOT NULL): Workspace name.
- `description` (TEXT NULL).
- `icon` (VARCHAR(64) DEFAULT '🚀'): Display emoji or icon.
- `created_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).
- `updated_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).
- `deleted_at` (TIMESTAMP NULL).
- *Constraint:* `UNIQUE(organization_id, slug)`.

#### `users`
- `id` (VARCHAR(36) PRIMARY KEY): UUID v4 identifier.
- `email` (VARCHAR(255) UNIQUE NOT NULL): Work email address.
- `full_name` (VARCHAR(255) NOT NULL): User display name.
- `avatar_url` (VARCHAR(512) NULL): User profile photo.
- `github_user_id` (BIGINT UNIQUE NULL): Linked GitHub identity ID.
- `github_username` (VARCHAR(128) NULL): Linked GitHub username.
- `is_active` (BOOLEAN NOT NULL DEFAULT TRUE).
- `created_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).
- `updated_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).

#### `roles`
- `id` (VARCHAR(36) PRIMARY KEY).
- `organization_id` (VARCHAR(36) NULL REFERENCES organizations(id) ON DELETE CASCADE): NULL indicates global system default role.
- `name` (VARCHAR(64) NOT NULL): `Org Owner`, `Workspace Admin`, `Project Admin`, `Project Manager`, `Developer`, `QA`, `Designer`, `Viewer`, `Guest`.
- `description` (VARCHAR(255) NULL).
- `is_system` (BOOLEAN NOT NULL DEFAULT FALSE).

#### `permissions`
- `id` (VARCHAR(64) PRIMARY KEY): Key name (e.g. `issue.create`, `issue.transition`, `workflow.modify`, `github.configure`).
- `category` (VARCHAR(64) NOT NULL): `project`, `issue`, `sprint`, `workflow`, `automation`, `github`, `admin`.
- `description` (VARCHAR(255) NOT NULL).

#### `role_permissions`
- `role_id` (VARCHAR(36) NOT NULL REFERENCES roles(id) ON DELETE CASCADE).
- `permission_id` (VARCHAR(64) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE).
- *PrimaryKey:* `PRIMARY KEY (role_id, permission_id)`.

#### `memberships`
- `id` (VARCHAR(36) PRIMARY KEY).
- `user_id` (VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE).
- `organization_id` (VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE).
- `workspace_id` (VARCHAR(36) NULL REFERENCES workspaces(id) ON DELETE CASCADE).
- `project_id` (VARCHAR(36) NULL REFERENCES projects(id) ON DELETE CASCADE).
- `role_id` (VARCHAR(36) NOT NULL REFERENCES roles(id) ON DELETE RESTRICT).
- `created_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).
- *Constraint:* `UNIQUE(user_id, organization_id, workspace_id, project_id)`.

---

### 3.2 Projects & WorkItem Subsystem

#### `projects`
- `id` (VARCHAR(36) PRIMARY KEY).
- `workspace_id` (VARCHAR(36) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE).
- `organization_id` (VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE).
- `key` (VARCHAR(16) NOT NULL): Prefix for work items (e.g., `PM`, `CORE`, `AUTH`).
- `name` (VARCHAR(255) NOT NULL): Project name.
- `description` (TEXT NULL).
- `project_type` (VARCHAR(32) NOT NULL DEFAULT 'software'): `software`, `scrum`, `kanban`, `bug_tracking`, `roadmap`, `blank`.
- `lead_user_id` (VARCHAR(36) NULL REFERENCES users(id) ON DELETE SET NULL).
- `github_repo_id` (VARCHAR(36) NULL REFERENCES github_repositories(id) ON DELETE SET NULL).
- `created_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).
- `updated_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).
- `deleted_at` (TIMESTAMP NULL).
- *Constraint:* `UNIQUE(workspace_id, key)`.

#### `work_item_types`
- `id` (VARCHAR(36) PRIMARY KEY).
- `project_id` (VARCHAR(36) NULL REFERENCES projects(id) ON DELETE CASCADE): NULL indicates workspace/org default type.
- `organization_id` (VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE).
- `name` (VARCHAR(64) NOT NULL): `Epic`, `Story`, `Feature`, `Task`, `Subtask`, `Bug`, `Incident`, `Spike`.
- `icon` (VARCHAR(32) NOT NULL DEFAULT 'task'): Icon identifier or emoji.
- `color_hex` (VARCHAR(16) NOT NULL DEFAULT '#6366f1'): Accent badge color.
- `is_subtask` (BOOLEAN NOT NULL DEFAULT FALSE).
- `is_epic` (BOOLEAN NOT NULL DEFAULT FALSE).
- `hierarchy_level` (INTEGER NOT NULL DEFAULT 1): `0` = Subtask, `1` = Task/Story/Bug, `2` = Epic, `3` = Initiative.
- *Constraint:* `UNIQUE(organization_id, project_id, name)`.

#### `work_items`
- `id` (VARCHAR(36) PRIMARY KEY): UUID v4 identifier.
- `project_id` (VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE).
- `organization_id` (VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE).
- `key` (VARCHAR(32) NOT NULL): Unique human-readable key (e.g. `PM-142`).
- `item_number` (INTEGER NOT NULL): Sequential number within project.
- `title` (VARCHAR(512) NOT NULL): Work item title.
- `description` (TEXT NULL): Markdown formatted body.
- `type_id` (VARCHAR(36) NOT NULL REFERENCES work_item_types(id) ON DELETE RESTRICT).
- `status_id` (VARCHAR(36) NOT NULL REFERENCES statuses(id) ON DELETE RESTRICT).
- `priority` (VARCHAR(32) NOT NULL DEFAULT 'Medium'): `Critical`, `High`, `Medium`, `Low`.
- `assignee_id` (VARCHAR(36) NULL REFERENCES users(id) ON DELETE SET NULL).
- `reporter_id` (VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT).
- `sprint_id` (VARCHAR(36) NULL REFERENCES sprints(id) ON DELETE SET NULL).
- `epic_id` (VARCHAR(36) NULL REFERENCES work_items(id) ON DELETE SET NULL).
- `parent_id` (VARCHAR(36) NULL REFERENCES work_items(id) ON DELETE SET NULL).
- `story_points` (NUMERIC(5, 2) NULL): Estimated points (e.g., 1, 2, 3, 5, 8, 13).
- `due_date` (DATE NULL): Deadline.
- `start_date` (DATE NULL): Scheduled start date.
- `github_issue_number` (INTEGER NULL): Linked GitHub issue number.
- `position` (DOUBLE PRECISION NOT NULL DEFAULT 65536.0): Lexicographical board rank.
- `created_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).
- `updated_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).
- `deleted_at` (TIMESTAMP NULL).
- *Constraint:* `UNIQUE(project_id, item_number)`, `UNIQUE(project_id, key)`.
- *Indexes:* `INDEX(project_id, status_id)`, `INDEX(project_id, sprint_id)`, `INDEX(assignee_id)`.

#### `work_item_relations`
- `id` (VARCHAR(36) PRIMARY KEY).
- `source_item_id` (VARCHAR(36) NOT NULL REFERENCES work_items(id) ON DELETE CASCADE).
- `target_item_id` (VARCHAR(36) NOT NULL REFERENCES work_items(id) ON DELETE CASCADE).
- `relation_type` (VARCHAR(32) NOT NULL): `blocks`, `blocked_by`, `relates_to`, `duplicates`, `parent_of`, `subtask_of`.
- `created_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).
- *Constraint:* `UNIQUE(source_item_id, target_item_id, relation_type)`.
- *Constraint:* `CHECK(source_item_id != target_item_id)`.

---

### 3.3 Workflows & Statuses Subsystem

#### `workflows`
- `id` (VARCHAR(36) PRIMARY KEY).
- `project_id` (VARCHAR(36) NULL REFERENCES projects(id) ON DELETE CASCADE).
- `organization_id` (VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE).
- `name` (VARCHAR(128) NOT NULL): e.g. `Default Software Workflow`, `Strict QA Workflow`.
- `description` (TEXT NULL).
- `is_default` (BOOLEAN NOT NULL DEFAULT FALSE).
- `created_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).
- `updated_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).

#### `statuses`
- `id` (VARCHAR(36) PRIMARY KEY).
- `workflow_id` (VARCHAR(36) NOT NULL REFERENCES workflows(id) ON DELETE CASCADE).
- `name` (VARCHAR(64) NOT NULL): e.g. `Backlog`, `In Progress`, `Code Review`, `QA`, `Done`.
- `category` (VARCHAR(32) NOT NULL): `NOT_STARTED`, `ACTIVE`, `COMPLETED`, `CANCELLED`.
- `color_hex` (VARCHAR(16) NOT NULL DEFAULT '#3b82f6').
- `position` (INTEGER NOT NULL DEFAULT 0): Display ordering in board columns.
- `wip_limit` (INTEGER NULL): Optional Work In Progress cap.

#### `workflow_transitions`
- `id` (VARCHAR(36) PRIMARY KEY).
- `workflow_id` (VARCHAR(36) NOT NULL REFERENCES workflows(id) ON DELETE CASCADE).
- `from_status_id` (VARCHAR(36) NOT NULL REFERENCES statuses(id) ON DELETE CASCADE).
- `to_status_id` (VARCHAR(36) NOT NULL REFERENCES statuses(id) ON DELETE CASCADE).
- `name` (VARCHAR(128) NULL): e.g. `Submit for Code Review`, `Approve Release`.
- *Constraint:* `UNIQUE(workflow_id, from_status_id, to_status_id)`.

#### `transition_guards`
- `id` (VARCHAR(36) PRIMARY KEY).
- `transition_id` (VARCHAR(36) NOT NULL REFERENCES workflow_transitions(id) ON DELETE CASCADE).
- `guard_type` (VARCHAR(64) NOT NULL): `REQUIRE_LINKED_PR`, `REQUIRE_ROLE`, `REQUIRE_FIELD`, `REQUIRE_CI_PASS`, `REQUIRE_SUBTASKS_DONE`.
- `guard_config` (JSON NOT NULL DEFAULT '{}'): Configuration parameters (e.g. `{"allowedRoles": ["QA", "ADMIN"]}`).

---

### 3.4 Custom Fields Subsystem

#### `custom_fields`
- `id` (VARCHAR(36) PRIMARY KEY).
- `organization_id` (VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE).
- `project_id` (VARCHAR(36) NULL REFERENCES projects(id) ON DELETE CASCADE).
- `name` (VARCHAR(128) NOT NULL): e.g. `Customer Impact`, `Security Risk`, `Release Environment`.
- `field_key` (VARCHAR(64) NOT NULL): e.g. `customer_impact`, `security_risk`.
- `field_type` (VARCHAR(32) NOT NULL): `TEXT`, `TEXTAREA`, `NUMBER`, `CURRENCY`, `PERCENTAGE`, `DROPDOWN`, `MULTI_SELECT`, `CHECKBOX`, `DATE`, `DATETIME`, `USER`, `URL`, `BRANCH`, `PR`, `FORMULA`.
- `is_required` (BOOLEAN NOT NULL DEFAULT FALSE).
- `default_value` (TEXT NULL).
- `options` (JSON NULL): Selectable choices for dropdowns/multi-select.
- `section` (VARCHAR(64) NOT NULL DEFAULT 'CUSTOM'): Layout section placement (`GENERAL`, `ENGINEERING`, `TRACKING`, `CUSTOM`).
- `position` (INTEGER NOT NULL DEFAULT 0).
- *Constraint:* `UNIQUE(organization_id, project_id, field_key)`.

#### `custom_field_values`
- `id` (VARCHAR(36) PRIMARY KEY).
- `work_item_id` (VARCHAR(36) NOT NULL REFERENCES work_items(id) ON DELETE CASCADE).
- `custom_field_id` (VARCHAR(36) NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE).
- `text_value` (TEXT NULL).
- `number_value` (NUMERIC(14, 4) NULL).
- `date_value` (TIMESTAMP NULL).
- `json_value` (JSON NULL): Arrays, multi-users, formula metadata.
- `updated_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).
- *Constraint:* `UNIQUE(work_item_id, custom_field_id)`.
- *Indexes:* `INDEX(work_item_id)`, `INDEX(custom_field_id)`.

---

### 3.5 Scrum & Delivery Subsystem

#### `sprints`
- `id` (VARCHAR(36) PRIMARY KEY).
- `project_id` (VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE).
- `name` (VARCHAR(128) NOT NULL): e.g. `Sprint 12 - Core Scalability`.
- `goal` (TEXT NULL): Sprint objective.
- `status` (VARCHAR(32) NOT NULL DEFAULT 'PLANNED'): `PLANNED`, `ACTIVE`, `COMPLETED`.
- `start_date` (TIMESTAMP NULL).
- `end_date` (TIMESTAMP NULL).
- `completed_at` (TIMESTAMP NULL).
- `capacity_points` (NUMERIC(6, 2) NOT NULL DEFAULT 0).
- `created_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).
- `updated_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).

#### `releases`
- `id` (VARCHAR(36) PRIMARY KEY).
- `project_id` (VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE).
- `name` (VARCHAR(128) NOT NULL): e.g. `v2.4.0 Release`.
- `version_tag` (VARCHAR(64) NOT NULL): `v2.4.0`.
- `description` (TEXT NULL).
- `status` (VARCHAR(32) NOT NULL DEFAULT 'UNRELEASED'): `UNRELEASED`, `RELEASED`, `ARCHIVED`.
- `target_date` (DATE NULL).
- `released_at` (TIMESTAMP NULL).
- `created_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).

---

### 3.6 GitHub Native Subsystem

#### `github_installations`
- `id` (VARCHAR(36) PRIMARY KEY).
- `organization_id` (VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE).
- `installation_id` (BIGINT UNIQUE NOT NULL): GitHub App installation identifier.
- `account_login` (VARCHAR(255) NOT NULL): GitHub user or org account name (e.g. `beyondCode-in`).
- `account_type` (VARCHAR(32) NOT NULL): `User` or `Organization`.
- `target_type` (VARCHAR(32) NOT NULL DEFAULT 'all'): `all` or `selected`.
- `permissions_payload` (JSON NOT NULL).
- `created_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).
- `updated_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).

#### `github_repositories`
- `id` (VARCHAR(36) PRIMARY KEY).
- `installation_id` (VARCHAR(36) NOT NULL REFERENCES github_installations(id) ON DELETE CASCADE).
- `github_repo_id` (BIGINT UNIQUE NOT NULL).
- `owner` (VARCHAR(128) NOT NULL): e.g. `beyondCode-in`.
- `name` (VARCHAR(128) NOT NULL): e.g. `pm-tool`.
- `full_name` (VARCHAR(255) NOT NULL): `beyondCode-in/pm-tool`.
- `default_branch` (VARCHAR(64) NOT NULL DEFAULT 'main').
- `is_private` (BOOLEAN NOT NULL DEFAULT TRUE).
- `webhook_active` (BOOLEAN NOT NULL DEFAULT TRUE).

#### `github_events`
- `id` (VARCHAR(36) PRIMARY KEY).
- `repository_id` (VARCHAR(36) NOT NULL REFERENCES github_repositories(id) ON DELETE CASCADE).
- `delivery_id` (VARCHAR(64) UNIQUE NOT NULL): `X-GitHub-Delivery` header.
- `event_type` (VARCHAR(64) NOT NULL): `issues`, `pull_request`, `push`, `check_run`, `deployment_status`.
- `action` (VARCHAR(64) NULL): e.g. `opened`, `closed`, `synchronize`.
- `payload` (JSON NOT NULL): Raw incoming webhook JSON.
- `processed_at` (TIMESTAMP NULL).
- `status` (VARCHAR(32) NOT NULL DEFAULT 'PENDING'): `PENDING`, `PROCESSED`, `FAILED`.
- `created_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).

#### `pull_requests`
- `id` (VARCHAR(36) PRIMARY KEY).
- `repository_id` (VARCHAR(36) NOT NULL REFERENCES github_repositories(id) ON DELETE CASCADE).
- `work_item_id` (VARCHAR(36) NULL REFERENCES work_items(id) ON DELETE SET NULL).
- `github_pr_number` (INTEGER NOT NULL).
- `title` (VARCHAR(512) NOT NULL).
- `branch_head` (VARCHAR(255) NOT NULL).
- `branch_base` (VARCHAR(255) NOT NULL).
- `state` (VARCHAR(32) NOT NULL): `OPEN`, `MERGED`, `CLOSED`.
- `author_username` (VARCHAR(128) NOT NULL).
- `reviews_summary` (VARCHAR(64) NOT NULL DEFAULT 'PENDING'): `APPROVED`, `CHANGES_REQUESTED`, `PENDING`.
- `ci_status` (VARCHAR(32) NOT NULL DEFAULT 'PENDING'): `SUCCESS`, `FAILURE`, `PENDING`.
- `created_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).
- `updated_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).
- *Constraint:* `UNIQUE(repository_id, github_pr_number)`.

---

### 3.7 Automations & Execution Subsystem

#### `automations`
- `id` (VARCHAR(36) PRIMARY KEY).
- `project_id` (VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE).
- `name` (VARCHAR(255) NOT NULL): e.g. `Auto-move to QA on PR Merge`.
- `description` (TEXT NULL).
- `trigger_event` (VARCHAR(64) NOT NULL): `ITEM_MOVED`, `PR_MERGED`, `DUE_DATE_PASSED`, `CI_FAILED`.
- `conditions` (JSON NOT NULL DEFAULT '[]'): Array of conditional statements (`field`, `operator`, `value`).
- `actions` (JSON NOT NULL DEFAULT '[]'): Array of actions (`type`, `params`).
- `is_enabled` (BOOLEAN NOT NULL DEFAULT TRUE).
- `created_by` (VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT).
- `created_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).
- `updated_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).

#### `automation_runs`
- `id` (VARCHAR(36) PRIMARY KEY).
- `automation_id` (VARCHAR(36) NOT NULL REFERENCES automations(id) ON DELETE CASCADE).
- `trigger_source` (VARCHAR(64) NOT NULL): e.g. `github_webhook`, `user_mutation`.
- `entity_type` (VARCHAR(32) NOT NULL): `work_item`, `pull_request`, `sprint`.
- `entity_id` (VARCHAR(36) NOT NULL).
- `status` (VARCHAR(32) NOT NULL): `SUCCESS`, `FAILED`, `SKIPPED`.
- `execution_ms` (INTEGER NOT NULL): Runtime latency in milliseconds.
- `error_message` (TEXT NULL).
- `executed_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).

---

### 3.8 Collaboration, Audit & Dashboards Subsystem

#### `comments`
- `id` (VARCHAR(36) PRIMARY KEY).
- `work_item_id` (VARCHAR(36) NOT NULL REFERENCES work_items(id) ON DELETE CASCADE).
- `user_id` (VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT).
- `parent_comment_id` (VARCHAR(36) NULL REFERENCES comments(id) ON DELETE CASCADE): Supports threaded discussion.
- `content` (TEXT NOT NULL): Markdown body with user mentions (`@user`).
- `reactions` (JSON NOT NULL DEFAULT '{}'): Emoji reaction counts.
- `created_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).
- `updated_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).

#### `activities`
- `id` (VARCHAR(36) PRIMARY KEY).
- `organization_id` (VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE).
- `project_id` (VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE).
- `actor_id` (VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT).
- `action` (VARCHAR(64) NOT NULL): `STATUS_CHANGED`, `PRIORITY_CHANGED`, `PR_LINKED`, `COMMENT_ADDED`.
- `entity_type` (VARCHAR(32) NOT NULL): `work_item`, `sprint`, `workflow`.
- `entity_id` (VARCHAR(36) NOT NULL).
- `old_value` (TEXT NULL).
- `new_value` (TEXT NULL).
- `metadata` (JSON NULL).
- `timestamp` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).

#### `dashboards`
- `id` (VARCHAR(36) PRIMARY KEY).
- `project_id` (VARCHAR(36) NULL REFERENCES projects(id) ON DELETE CASCADE).
- `user_id` (VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE).
- `title` (VARCHAR(255) NOT NULL).
- `is_default` (BOOLEAN NOT NULL DEFAULT FALSE).
- `layout` (JSON NOT NULL DEFAULT '[]'): Grid positioning coordinate definitions.
- `created_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP).

#### `dashboard_widgets`
- `id` (VARCHAR(36) PRIMARY KEY).
- `dashboard_id` (VARCHAR(36) NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE).
- `widget_type` (VARCHAR(64) NOT NULL): `MY_TASKS`, `SPRINT_PROGRESS`, `VELOCITY_CHART`, `BURNDOWN`, `CI_HEALTH`, `WORKLOAD`.
- `config` (JSON NOT NULL DEFAULT '{}'): Filter and chart display parameters.
- `grid_x` (INTEGER NOT NULL DEFAULT 0).
- `grid_y` (INTEGER NOT NULL DEFAULT 0).
- `grid_w` (INTEGER NOT NULL DEFAULT 4).
- `grid_h` (INTEGER NOT NULL DEFAULT 4).

---

## 4. Indexing & Optimization Strategy

1. **Composite Indexes for Active Board Queries:**
   - `CREATE INDEX idx_work_items_board ON work_items(project_id, status_id, position) WHERE deleted_at IS NULL;`
   - `CREATE INDEX idx_work_items_sprint ON work_items(project_id, sprint_id) WHERE deleted_at IS NULL;`
   - `CREATE INDEX idx_work_items_assignee ON work_items(assignee_id, status_id) WHERE deleted_at IS NULL;`
2. **GitHub Correlator Fast Lookups:**
   - `CREATE INDEX idx_github_events_delivery ON github_events(delivery_id);`
   - `CREATE INDEX idx_pull_requests_work_item ON pull_requests(work_item_id);`
3. **Audit & Activity Timeline Pagination:**
   - `CREATE INDEX idx_activities_timeline ON activities(project_id, timestamp DESC);`
   - `CREATE INDEX idx_automation_runs_timeline ON automation_runs(automation_id, executed_at DESC);`
