# Database Plan

## Relational Entity Model

```sql
organizations (id, name, slug, created_at)
workspaces (id, organization_id, name, slug)
projects (id, workspace_id, key, name, description)

issue_types (id, project_id, name, icon, color, hierarchy_level, allowed_parent_types)
issue_statuses (id, project_id, name, category, color, position, wip_limit)
issue_priorities (id, project_id, name, rank, color, icon)

issues (
  id, key, project_id, type_id, status_id, priority_id, title, description,
  assignee_id, reporter_id, parent_id, sprint_id, release_id,
  story_points, due_date, security_level, created_at, updated_at, version
)

issue_relations (id, source_id, target_id, relation_type) -- blocks, depends_on, relates_to, etc.
custom_fields (id, project_id, key, label, type, configuration_json)
custom_field_values (id, issue_id, field_id, value_json)

workflows (id, project_id, name, is_active)
workflow_states (id, workflow_id, status_id)
workflow_transitions (id, workflow_id, from_state_id, to_state_id, conditions_json, validators_json, allowed_roles_json)

automations (id, project_id, folder, name, trigger_json, condition_json, action_json, is_enabled)
automation_executions (id, automation_id, issue_id, status, trigger_depth, logs_json, executed_at)

boards (id, project_id, name, type)
saved_views (id, project_id, name, scope, query_json, config_json, owner_id)

github_installations (id, org_id, app_id, installation_id)
github_links (id, issue_id, repo, pr_number, branch_name, ci_status, pr_status)

audit_logs (id, project_id, user_id, action, target_type, target_id, old_values_json, new_values_json, source, created_at)
```
