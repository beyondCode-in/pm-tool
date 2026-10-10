# BeyondPM Phase 14: Granular RBAC & Permissions Engine

## 1. Objective
Build an enterprise Role-Based Access Control (RBAC) authorization engine enforcing 9 default roles and 44 granular permission keys across Organization, Workspace, and Project scopes, with project-level role overrides and administrative permission configuration.

## 2. Existing State
The repository has basic role assertion logic in `lib/jira-clickup-adapter.js` (checking if `userRole === 'QA'` for the `Done` status transition). There is no database-backed role model, permission table, permission middleware, or role management UI.

## 3. Required Changes
- Implement persistence models for `roles`, `permissions`, `role_permissions`, and `memberships` as defined in `docs/PERMISSION-MATRIX.md`.
- Build backend authorization middleware `authorize(permissionKey)`:
  - Resolves effective role: Project role overrides Workspace role, which overrides Org default role.
  - Verifies presence of requested permission key in role's grant set.
- Build Admin Studio: Roles & Permissions Manager:
  - Interactive grid displaying 9 roles vs. 44 permission keys with checkboxes.
  - Custom role creator: allow admins to create new roles (e.g. `Contractor`, `Security Auditor`) with bespoke permission grants.
  - Project Member Manager: assign specific roles to users at workspace and project levels.

## 4. Database Changes
- Create tables: `roles`, `permissions`, `role_permissions`, `memberships` per `docs/DATABASE-DESIGN.md`.
- Seed 44 canonical permission keys and default grants for the 9 standard roles.
- Add unique constraints: `UNIQUE(role_id, permission_id)`.

## 5. Backend Changes
- Implement `RBACService`:
  - `getEffectivePermissions(userId, orgId, projectId)`: calculates composite permission set with inheritance and overrides.
  - `hasPermission(userId, orgId, projectId, permissionKey)`: cached check returning boolean.
- Implement Express/Fastify authorization middleware:
  - Intercepts protected routes and returns `HTTP 403 Forbidden` if user lacks required permission.

## 6. Frontend Changes
- Admin Settings $\to$ Roles & Permissions:
  - Permissions Matrix Table: categories as expandable rows, roles as columns, interactive toggle checkboxes.
  - "+ New Custom Role" modal.
- Client-Side Permission Directive:
  - UI elements automatically hide or disable if current user lacks permission (e.g. "Start Sprint" button hidden if user lacks `sprint.start`).

## 7. API Changes
- `GET /api/v1/projects/:projectId/permissions` - Get active user's permissions for project.
- `GET /api/v1/roles` - List available roles and assigned permission keys.
- `POST /api/v1/roles` - Create custom role.
- `PATCH /api/v1/roles/:id/permissions` - Update role permission grants.
- `POST /api/v1/projects/:projectId/members` - Assign user role within project.

## 8. Security Considerations
- Prohibit privilege escalation: users cannot assign a role with greater permissions than their own.
- Organization Owner role permissions are immutable system defaults and cannot be modified or locked out.
- Enforce permission checks strictly on the server; client-side hiding is purely for user experience.

## 9. UX States
- **Loading State:** Shimmering matrix grid in settings.
- **Empty State:** Not applicable (seed roles always present).
- **Error State:** "Failed to update role permission. Rollback applied."
- **Retry State:** Live saving indicator on matrix checkbox toggle.
- **Permission-Denied State:** HTTP 403 response renders clean "Access Denied" screen with role details.

## 10. Edge Cases
- Revoking a user's role while they have an active session: cache invalidation forces immediate permission re-evaluation on next request.
- Project override removing a permission that workspace grants: project-level explicit deny takes precedence.
- Deleting a custom role currently assigned to 5 members: prompt admin to re-assign members to a fallback role before deletion.

## 11. Tests
- Unit test: effective permission resolution confirms project-level role overrides workspace role.
- API test: developer user attempting to delete a project returns `HTTP 403 Forbidden`.
- API test: QA user successfully transitions ticket to Done, while developer user is blocked.

## 12. Acceptance Criteria
- [ ] 9 standard roles and 44 permission keys are fully seeded and functional.
- [ ] Server middleware rejects unauthorized requests with descriptive HTTP 403 payload.
- [ ] Admins can adjust permission matrix checkboxes and create custom roles.
- [ ] Project-level role assignments correctly override workspace-level defaults.

## 13. Dependencies
Phase 02 (Tenancy & Users).

## 14. Risks
- Permission check overhead adding database latency to every API request: mitigated by in-memory caching of user permission sets with cache-busting on membership mutations.
