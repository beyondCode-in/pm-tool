# BeyondPM Phase 06: No-Code Visual Workflow Builder

## 1. Objective
Build an interactive, visual no-code workflow editor where non-technical Project Managers and Admins can design custom state machine lifecycles with statuses, transition arrows, categories, appearance colors, and conditional transition guards (e.g. require PR, require QA role, require checklist completion).

## 2. Existing State
Workflow transitions are hardcoded in `lib/jira-clickup-adapter.js` with static rules (`allowedTransitions` object). There is no UI for viewing or customizing workflows, adding statuses, or defining conditional transition rules.

## 3. Required Changes
- Implement persistence models for `workflows`, `statuses`, `workflow_transitions`, and `transition_guards`.
- Build visual DAG workflow builder canvas:
  - Drag-and-drop status nodes with customizable category, color, and name.
  - Interactive connection ports to draw transition arrows between statuses.
  - Delete connection or node with confirmation.
- Build transition rule inspector:
  - Configure guard conditions (e.g., Pull Request exists, QA checklist completed, deployment successful).
  - Configure transition post-actions (e.g., assign user, set resolution).
- Enforce custom workflow rules in real-time during board drag-and-drop and ticket detail status changes.

## 4. Database Changes
- Create tables: `workflows`, `statuses`, `workflow_transitions`, `transition_guards` per `docs/DATABASE-DESIGN.md`.
- Ensure cascade deletes clean up transitions when a status node is deleted.

## 5. Backend Changes
- Implement `WorkflowEngine`:
  - `validateTransition(workItem, toStatusId, context)`: evaluates whether transition exists and all guards evaluate to true.
  - `applyTransition(workItem, toStatusId, context)`: updates status, records activity, and triggers workflow post-actions.
  - Guard evaluators:
    - `REQUIRE_LINKED_PR`: checks `pull_requests` table for open or merged PR linked to work item.
    - `REQUIRE_ROLE`: checks actor's effective role.
    - `REQUIRE_FIELD`: checks custom field value presence.

## 6. Frontend Changes
- No-Code Workflow Studio View:
  - Interactive canvas with pan and zoom.
  - Status Palette: Add New Status modal (Name, Category: `Not Started`, `Active`, `Completed`, `Cancelled`, Color picker).
  - Status Nodes: draggable cards showing status name, category pill, and incoming/outgoing connectors.
  - Transition Arrows: SVG Bézier curves connecting source to target status.
  - Transition Config Drawer: opens when clicking an arrow to configure rules and guards.

## 7. API Changes
- `GET /api/v1/projects/:projectId/workflows/:id` - Fetch workflow graph (statuses, transitions, guards).
- `POST /api/v1/projects/:projectId/workflows/:id/statuses` - Create new status node.
- `DELETE /api/v1/statuses/:id` - Remove status (with prompt to re-map existing tickets).
- `POST /api/v1/workflows/:id/transitions` - Add transition connection.
- `POST /api/v1/transitions/:id/guards` - Add conditional guard rule.

## 8. Security Considerations
- Require `workflow.modify` permission.
- Prevent orphan states: ensure at least one initial status and at least one completed status exist in every active workflow.

## 9. UX States
- **Loading State:** Canvas grid background with pulsing node skeletons.
- **Empty State:** "Start by adding your first status or choose a template (Default, Simple, QA-Heavy)."
- **Error State:** Connection rejected if target creates an invalid self-loop or duplicate transition.
- **Retry State:** Save indicator with retry toast if network drops.
- **Permission-Denied State:** Canvas rendered in read-only mode with node drag disabled.

## 10. Edge Cases
- Deleting a status that currently contains 20 active work items: show modal requiring user to select a fallback status for migration before deletion.
- Cyclic workflows vs. terminal states: ensure terminal statuses (`Done`, `Cancelled`) cannot transition backwards unless explicitly configured.
- Guard condition evaluating against unavailable external service (e.g. GitHub API timeout): provide graceful fallback with manual admin bypass flag.

## 11. Tests
- Unit test: workflow engine validates transitions and enforces guard conditions.
- Unit test: guard fails when moving to Code Review without a linked PR.
- UI test: add a custom status "UAT" and connect "QA" $\to$ "UAT" $\to$ "Done", verifying new status appears on board.

## 12. Acceptance Criteria
- [ ] Admins can create and customize statuses visually without code.
- [ ] Users can drag transition connectors to establish valid paths.
- [ ] Transition guards (e.g., PR requirement, QA role requirement) are strictly enforced during ticket moves.
- [ ] Board columns and status pickers instantly reflect newly published workflow configurations.

## 13. Dependencies
Phase 02 (Projects), Phase 03 (Work Items).

## 14. Risks
- Broken board states if an active status is deleted without re-mapping: mitigated by database constraint preventing status deletion while `work_items.status_id` references it without re-mapping.
