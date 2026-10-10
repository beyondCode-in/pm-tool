# BeyondPM: Granular Role-Based Access Control (RBAC) & Permission Matrix

**Document Version:** 1.0.0  
**Architect:** Principal Security Architect & Staff Full-Stack Engineer  
**Status:** Canonical Security Reference  
**Target Repository:** `beyondCode-in/pm-tool`

---

## 1. Security Architecture & Role Taxonomy

BeyondPM enforces a multi-tier, hierarchical Role-Based Access Control (RBAC) system. Permissions are evaluated with organizational defaults and allow explicit project-level overrides.

```
ORGANIZATION LEVEL  ──►  WORKSPACE LEVEL  ──►  PROJECT LEVEL
(Owner, Admin, Member)   (Admin, Member)       (Project Admin, PM, Dev, QA, Designer, Viewer, Guest)
```

### The 9 Standard Roles
1. **Organization Owner (`org_owner`):** Full tenant sovereignty, billing, SSO, global security policies.
2. **Workspace Admin (`ws_admin`):** Workspace management, member invites, default project templates.
3. **Project Admin (`proj_admin`):** Full control over a specific project: workflows, automations, fields, GitHub connections.
4. **Project Manager (`project_manager`):** Sprints, roadmaps, backlog prioritization, assignments, releases.
5. **Developer (`developer`):** Core engineering: creates issues, writes code, links PRs, transitions through dev statuses.
6. **QA Engineer (`qa`):** Testing specialist: moves cards into QA, verifies releases, closes bug tickets to Done.
7. **Designer (`designer`):** Product design: uploads mockups, creates design tasks, manages user stories.
8. **Viewer (`viewer`):** Read-only stakeholder: views dashboards, roadmaps, and boards; comments on tickets.
9. **Guest (`guest`):** External client or contractor: restricted to assigned tickets only.

---

## 2. Granular Permission Keys (44 Keys)

| Category | Permission Key | Description |
| :--- | :--- | :--- |
| **Org & Workspace** | `org.manage` | Manage billing, global settings, and org deletion |
| | `org.security` | Configure SSO, SAML, and audit log exports |
| | `ws.create` | Create new workspaces within the organization |
| | `ws.manage` | Modify workspace settings and default templates |
| | `member.invite` | Invite new users to the organization/workspace |
| | `member.remove` | Deactivate or remove members |
| **Projects** | `project.create` | Create new projects |
| | `project.configure` | Change project key, settings, and integrations |
| | `project.delete` | Delete or archive projects |
| **Work Items** | `issue.view` | View work items in project |
| | `issue.create` | Create new work items |
| | `issue.edit_own` | Edit work items created by self |
| | `issue.edit_any` | Edit any work item |
| | `issue.delete` | Soft delete work items |
| | `issue.assign` | Assign items to team members |
| | `issue.transition_dev` | Transition items between Backlog and Code Review |
| | `issue.transition_qa` | Transition items to QA & Testing |
| | `issue.transition_release`| Transition items to Done / Released |
| **Scrum & Sprints**| `sprint.create` | Create sprint backlogs |
| | `sprint.start` | Start an active sprint |
| | `sprint.complete` | Complete active sprint and move carryover items |
| | `sprint.reorder` | Reorder items in sprint or backlog |
| **Releases** | `release.create` | Create a new release milestone |
| | `release.publish` | Mark release as published |
| **Workflows** | `workflow.view` | View project workflow DAG |
| | `workflow.modify` | Add/edit statuses, transitions, and transition guards |
| **Custom Fields** | `field.create` | Create new custom fields |
| | `field.modify` | Edit field definitions and layout placements |
| **Automations** | `automation.view` | View automation rules and execution logs |
| | `automation.modify` | Create, edit, or disable automation rules |
| | `automation.execute`| Manually trigger automation rules |
| **GitHub Native** | `github.view` | View linked repos, PRs, commits, CI runs |
| | `github.configure` | Connect GitHub App installations & repos |
| | `github.sync` | Trigger manual two-way synchronization |
| | `github.manage_webhooks`| Reconfigure webhook subscriptions |
| **Dashboards** | `dashboard.create` | Create custom personal or shared dashboards |
| | `dashboard.modify` | Edit dashboard widget configurations |
| | `report.view` | View velocity, cycle time, and burndown reports |
| | `report.export` | Export CSV/JSON analytics reports |
| **Comments & Attach**| `comment.create` | Post comments and reply to threads |
| | `comment.delete_own`| Delete own comments |
| | `comment.delete_any`| Delete any user's comment (moderation) |
| | `attachment.upload`| Upload files, logs, and screenshots |
| **Audit Logs** | `audit.view` | View project and workspace audit trails |

---

## 3. The Comprehensive RBAC Matrix

| Permission Key | Org Owner | WS Admin | Proj Admin | PM | Developer | QA | Designer | Viewer | Guest |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `org.manage` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `org.security` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `ws.create` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `ws.manage` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `member.invite` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `member.remove` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `project.create` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `project.configure`| ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `project.delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `issue.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒* |
| `issue.create` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | 🔒* |
| `issue.edit_own` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | 🔒* |
| `issue.edit_any` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `issue.delete` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `issue.assign` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `issue.transition_dev` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `issue.transition_qa` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `issue.transition_release`| ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `sprint.create` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `sprint.start` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `sprint.complete` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `sprint.reorder` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `release.create` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `release.publish` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `workflow.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `workflow.modify` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `field.create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `field.modify` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `automation.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `automation.modify`| ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `automation.execute`| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `github.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `github.configure` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `github.sync` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `github.manage_webhooks`| ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `dashboard.create` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `dashboard.modify` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `report.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `report.export` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `comment.create` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒* |
| `comment.delete_own`| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `comment.delete_any`| ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `attachment.upload`| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | 🔒* |
| `audit.view` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

*\*Guest is scoped strictly to work items where they are explicitly assigned or named as a watcher.*

---

## 4. Evaluation Algorithm & Middleware Architecture

Every incoming API mutation is evaluated through the `authorize(permissionKey)` middleware:

```javascript
export function authorize(permissionKey) {
  return async (req, res, next) => {
    const { user, currentOrgId, currentProjectId } = req;
    
    // 1. System super-admins or Org Owners bypass checks
    if (user.isOrgOwner(currentOrgId)) {
      return next();
    }
    
    // 2. Fetch effective role (project-level role overrides workspace-level role)
    const effectiveRole = await getEffectiveRole(user.id, currentOrgId, currentProjectId);
    if (!effectiveRole) {
      return res.status(403).json({ error: "Access Denied: No role assigned in this scope." });
    }
    
    // 3. Evaluate permission in role's grant set
    const hasPermission = await checkRoleHasPermission(effectiveRole.id, permissionKey);
    if (!hasPermission) {
      return res.status(403).json({
        error: `Access Denied: Role '${effectiveRole.name}' lacks permission '${permissionKey}'.`
      });
    }
    
    return next();
  };
}
```
