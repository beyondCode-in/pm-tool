# BeyondPM Phase 02: Organizations, Workspaces & Projects Hierarchy

## 1. Objective
Implement the multi-tenant structural hierarchy: Organization $\to$ Workspace $\to$ Project, providing tenant data isolation, workspace switching, project template initialization, and membership management.

## 2. Existing State
The application uses hardcoded mock `state.spaces` in `app.js` with static folder groupings. There is no true multi-tenant organization context, database persistence, or dynamic project creation.

## 3. Required Changes
- Implement persistence models for `organizations`, `workspaces`, `projects`, `teams`, `users`, and `memberships`.
- Build backend CRUD controllers for organization, workspace, and project endpoints.
- Create UI workspace switcher, project creation wizard with template choices (Software, Scrum, Kanban, Bug Tracking, Roadmap, Blank), and team membership manager.

## 4. Database Changes
- Create tables: `organizations`, `workspaces`, `projects`, `teams`, `users`, `memberships`, `roles`, `permissions`, `role_permissions` as defined in `docs/DATABASE-DESIGN.md`.
- Establish composite unique keys: `UNIQUE(organization_id, slug)` on workspaces, `UNIQUE(workspace_id, key)` on projects.

## 5. Backend Changes
- Implement data access repository with tenant scoping: all queries automatically inject `organization_id` filter.
- Implement project template seeder: initializes default statuses, workflows, and issue types based on chosen template.
- Implement session context middleware: extracts `tenant_id` and `workspace_id` from JWT/session.

## 6. Frontend Changes
- Build Workspace Switcher dropdown in the top-left sidebar.
- Build Project Creation Modal with template preview cards and customizable project key (`PM`, `CORE`, `AUTH`).
- Implement project settings view for renaming, icon update, and team member management.

## 7. API Changes
- `POST /api/v1/organizations` - Create organization.
- `GET /api/v1/workspaces` - List workspaces in tenant.
- `POST /api/v1/workspaces` - Create workspace.
- `GET /api/v1/workspaces/:wsId/projects` - List projects.
- `POST /api/v1/workspaces/:wsId/projects` - Create project from template.
- `PATCH /api/v1/projects/:id` - Update project metadata.

## 8. Security Considerations
- Prevent cross-tenant data leakage: reject queries without explicit tenant context.
- Validate project key format: uppercase alphanumeric only (`[A-Z0-9]{2,10}`).
- Restrict project creation to users with `project.create` permission.

## 9. UX States
- **Loading State:** Shimmering placeholder cards during workspace loading.
- **Empty State:** "No projects in this workspace yet. Create your first project" with template picker.
- **Error State:** Alert notification if project key is already taken within workspace.
- **Retry State:** "Retry loading workspace" button with exponential backoff.
- **Permission-Denied State:** "You do not have permission to create projects in this workspace."

## 10. Edge Cases
- Duplicate project keys within same workspace: rejected with descriptive conflict error.
- Switching workspace while editing an unsaved ticket: alert dialog prompting user to save or discard changes.
- Soft-deleted projects: excluded from default lists; restorable via project settings by admins.

## 11. Tests
- Unit test: verify project key uniqueness constraint within workspace.
- Integration test: tenant isolation test asserting User A cannot query Organization B projects.
- UI test: create project from "Scrum" template and verify default boards and workflows initialize.

## 12. Acceptance Criteria
- [ ] Users can create organizations, workspaces, and projects with custom keys.
- [ ] Switching workspaces instantly updates sidebar projects and resets active board context.
- [ ] Selected project template properly seeds initial statuses and issue types.
- [ ] Multi-tenant isolation verified: zero leakage across organization boundaries.

## 13. Dependencies
Phase 00 (Architecture), Phase 01 (Design System & App Shell).

## 14. Risks
- Inadvertent data leakage between tenants if queries omit `organization_id`: mitigated by enforcing tenant scoping at the ORM/repository layer.
