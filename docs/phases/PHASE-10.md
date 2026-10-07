# BeyondPM Phase 10: No-Code Automation Engine

## 1. Objective
Build an intuitive no-code automation builder based on a strict **WHEN $\to$ IF $\to$ THEN** pipeline, an event-driven runtime with sandboxed condition evaluation, a typed action dispatcher, and an immutable execution audit log.

## 2. Existing State
The repository uses static GitHub Actions workflows (`.github/workflows/no-code-*.yml`) for automated labeling and PR transitions. These require editing YAML files in Git, preventing non-technical PMs from creating or modifying automation rules.

## 3. Required Changes
- Implement persistence models for `automations`, `automation_actions`, and `automation_runs`.
- Build UI Automation Builder canvas:
  - **WHEN (Trigger):** Issue created, status changed, assignee changed, PR opened, PR merged, CI passed/failed, due date reached, schedule.
  - **IF (Conditions):** Status equals, priority equals, has linked PR, assignee is empty, label contains.
  - **THEN (Actions):** Move status, assign user, add/remove label, post comment, send notification, trigger webhook, create child task.
- Build runtime event bus: intercepts domain events and evaluates matching automation rules.
- Build Automation Execution Log view showing run timestamps, trigger sources, duration (ms), evaluated conditions, and success/failure status.

## 4. Database Changes
- Create `automations` and `automation_runs` tables per `docs/DATABASE-DESIGN.md`.
- Store `conditions` and `actions` as structured JSON arrays with strict schema validation.
- Index `automation_runs(automation_id, executed_at DESC)`.

## 5. Backend Changes
- Implement `AutomationEngine`:
  - Event Listener: subscribes to internal event bus (`ITEM_MOVED`, `PR_MERGED`, `DUE_DATE_PASSED`).
  - Condition Evaluator: runs in-process AST matching rules (`field`, `operator`, `value`) without `eval()`.
  - Action Dispatcher: executes actions via service calls with transaction boundaries and failure handling.
  - Logger: writes execution duration and status to `automation_runs`.

## 6. Frontend Changes
- Automation Studio View:
  - List of active project automations with toggle switches (`Enabled` / `Disabled`).
  - "+ Create Rule" visual modal:
    - Step 1: Select Trigger (e.g. "GitHub PR Merged").
    - Step 2: Add Conditions (e.g. "Status equals 'Code Review'").
    - Step 3: Add Actions (e.g. "Move to 'QA & Testing'", "Notify QA team").
  - Automation Run History tab showing live activity feed with execution badges (`Success (32ms)`, `Failed (Error: user not found)`).

## 7. API Changes
- `GET /api/v1/projects/:projectId/automations` - List project automation rules.
- `POST /api/v1/projects/:projectId/automations` - Create new automation rule.
- `PATCH /api/v1/automations/:id` - Update rule or toggle enabled state.
- `DELETE /api/v1/automations/:id` - Delete rule.
- `GET /api/v1/automations/:id/runs` - Fetch paginated execution log.
- `POST /api/v1/automations/:id/test` - Dry-run test rule against a specific work item.

## 8. Security Considerations
- Require `automation.modify` permission.
- Sandbox condition evaluator: prohibit arbitrary code execution; restrict operators to `EQUALS`, `NOT_EQUALS`, `CONTAINS`, `GREATER_THAN`, `LESS_THAN`, `IS_EMPTY`.
- Execution timeout budget: enforce 5,000ms max execution time per rule to prevent infinite loops.
- Prevent cascading automation loops: tag events with execution depth limit (maximum 5 nested triggers).

## 9. UX States
- **Loading State:** Shimmering cards in automation list.
- **Empty State:** "No automations created yet. Try a popular recipe: 'Auto-move to QA on PR Merge'."
- **Error State:** Red badge in run log with expandable error trace.
- **Retry State:** "Test Rule" button runs dry-run against sample ticket and displays preview output.
- **Permission-Denied State:** "Only Project Admins can create automation rules."

## 10. Edge Cases
- Two rules trigger on the same event and fight (Rule A moves to QA, Rule B moves to Backlog): detect cycle and abort after depth limit, logging warning in run history.
- Action targets a user who has been removed from workspace: action logs graceful warning and proceeds with remaining actions.
- Webhook trigger arrives with missing fields: condition evaluator treats missing fields as null rather than throwing runtime exception.

## 11. Tests
- Unit test: condition evaluator handles compound conditions (`AND` / `OR`).
- Unit test: cascading loop prevention terminates execution at depth 5.
- Integration test: simulate PR merge event and verify task moves to QA and notification is recorded.

## 12. Acceptance Criteria
- [ ] Non-technical PM can configure a WHEN/IF/THEN automation rule without writing code.
- [ ] Incoming events (status change, PR merged) trigger configured rules reliably.
- [ ] Every execution writes an entry to the Automation Run Log with execution duration.
- [ ] Infinite loops between competing rules are detected and prevented.

## 13. Dependencies
Phase 03 (Work Items), Phase 06 (Workflows), Phase 09 (GitHub Events).

## 14. Risks
- Cascading recursive execution loops crashing the server: mitigated by strict execution depth tracking and rule timeout limits.
