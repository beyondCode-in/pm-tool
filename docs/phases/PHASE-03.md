# BeyondPM Phase 03: Work Item Engine & Configurable Issue Types

## 1. Objective
Build a generic, extensible WorkItem engine supporting default types (Epic, Story, Feature, Task, Subtask, Bug, Incident, Spike) and user-defined custom types, hierarchical nesting, and cycle-free DAG relationship graphs (`blocks`, `blocked_by`, `relates_to`, `duplicates`).

## 2. Existing State
`app.js` holds fixed ticket objects in an in-memory array. `lib/jira-clickup-adapter.js` provides parent-child subtask tree construction and circular dependency detection, but without database persistence or dynamic type definitions.

## 3. Required Changes
- Implement persistence models for `work_item_types`, `work_items`, and `work_item_relations`.
- Build backend engine for creating work items with auto-incrementing keys (`PM-1`, `PM-2`).
- Integrate cycle-detection algorithm (Tarjan/DFS) to reject circular dependency links on creation.
- Build UI type manager allowing admins to configure icons, colors, allowed parents, and allowed children.
- Build fast inline issue creator and issue detail slide-out panel with live updates.

## 4. Database Changes
- Create tables: `work_item_types`, `work_items`, `work_item_relations` with foreign keys and unique constraints per `docs/DATABASE-DESIGN.md`.
- Add composite index: `INDEX(project_id, item_number)`, `INDEX(project_id, status_id)`.
- Enforce check constraint: `CHECK(source_item_id != target_item_id)` on relations.

## 5. Backend Changes
- Implement `WorkItemService`:
  - Atomic sequential key generator: calculates next `item_number` within project transaction.
  - Polymorphic type resolver: validates parent type according to type schema rules.
  - Relation validator: executes cycle check before saving `blocks` / `blocked_by` edges.
- Implement soft-delete cascade handling for child subtasks.

## 6. Frontend Changes
- Issue Detail Slide-Out Panel:
  - Header: Breadcrumbs (`Project > Epic > Parent > Ticket`), Key badge (`PM-142`), type switcher, status picker.
  - Body: Inline editable title, Markdown description editor with preview, checklist, activity stream.
  - Sidebar: Priority, Assignee avatar picker, Story points, Due date, Parent link, Subtasks tree.
  - Linked Relations widget: shows blocked-by dependencies with warning banners if blocker is open.
- Issue Type Configuration view in Project Settings.

## 7. API Changes
- `GET /api/v1/projects/:projectId/work-items` - Query items with filtering and cursor pagination.
- `POST /api/v1/projects/:projectId/work-items` - Create new work item.
- `GET /api/v1/work-items/:id` - Fetch item with types, relations, assignees, and comments.
- `PATCH /api/v1/work-items/:id` - Inline update work item fields.
- `POST /api/v1/work-items/:id/relations` - Add DAG relation (`blocks`, `relates_to`).
- `DELETE /api/v1/work-items/:id/relations/:relId` - Remove relation.

## 8. Security Considerations
- Enforce `issue.create` and `issue.edit_own` / `issue.edit_any` permissions.
- Validate markdown and plain text inputs against script injection.
- Restrict custom type creation to Project Admins.

## 9. UX States
- **Loading State:** Skeleton drawer with pulsing title and metadata fields.
- **Empty State:** "No work items found matching filters" with a "+ Create Task" button.
- **Error State:** Red toast notification on save failure with rollback to previous value.
- **Retry State:** "Saving..." badge turning to "Saved" checkmark.
- **Permission-Denied State:** Fields render as read-only with locked padlock badge.

## 10. Edge Cases
- Concurrent edits to the same ticket by two users: detect version conflict using `updated_at` timestamp or optimistic locking.
- Creating a relation that forms a circle (`A -> B -> C -> A`): rejected with error specifying the full dependency path.
- Deleting an Epic containing open subtasks: prompt user to re-parent or delete children.

## 11. Tests
- Unit test: Tarjan DFS cycle detection rejects circular `blocks` relation.
- Unit test: auto-incrementing sequential item keys under concurrent creation.
- API test: create custom issue type (`Security Review`) and instantiate a ticket with it.
- E2E test: open issue drawer, inline edit title, and assert persistence after reload.

## 12. Acceptance Criteria
- [ ] Users can create tickets with auto-generated project keys (`PM-1`, `PM-2`).
- [ ] Admins can create and customize issue types (icon, color, hierarchy level).
- [ ] Circular dependencies are strictly detected and prevented.
- [ ] Issue detail drawer provides fast, non-reloading inline editing for all standard fields.

## 13. Dependencies
Phase 02 (Tenancy & Projects).

## 14. Risks
- Race conditions during high-volume sequential key generation: mitigated by database-level transactions with row-level locks on project counter.
