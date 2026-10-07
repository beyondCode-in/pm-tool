# Permission Model

## Granular RBAC & Security Levels

### System Roles
- Organization Owner, Workspace Admin, Project Admin, Project Manager, Developer, QA, Designer, Viewer, Guest, Custom Role.

### Granular Permission Matrix
- `issue:create`, `issue:view`, `issue:update`, `issue:delete`, `issue:assign`, `issue:transition`
- `board:create`, `board:update`, `workflow:create`, `workflow:update`, `automation:create`, `sprint:manage`, `release:manage`.

### Field-Level Permissions
Restrict individual fields (e.g. `Priority`, `SLA`, `Estimate`, `Workflow State`) by role (View / Edit / Restricted).

### Security Levels
- Public, Workspace, Project, Team, Restricted, Private.
