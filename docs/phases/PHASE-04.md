# BeyondPM Phase 04: Multi-View Board Engine

## 1. Objective
Build an ultra-responsive, configurable multi-view board engine supporting Kanban, List, Table, and Calendar views with drag-and-drop, grouping (Status, Assignee, Priority, Epic, Sprint), swimlanes, and column WIP limit enforcement.

## 2. Existing State
The current frontend has a static Kanban board rendered via `app.js` using HTML drag events on hardcoded items. Grouping options and swimlanes are not configurable, and changes do not persist to a server.

## 3. Required Changes
- Implement persistence models for `boards`, `board_views`, and `saved_filters`.
- Build backend endpoints for retrieving and persisting board column configurations, groupings, and card rankings.
- Build interactive multi-view UI:
  - Kanban Board with drag-and-drop, optimistic reordering, column WIP meters, and swimlanes.
  - Table / List View with multi-column sorting, resizable columns, and inline spreadsheet-style cell editing.
  - Calendar View mapping items to start and due dates.
- Add user-configurable card display settings (toggle priority, assignee, story points, PR badge, due date).

## 4. Database Changes
- Create tables: `boards`, `board_views`, `saved_filters` per `docs/DATABASE-DESIGN.md`.
- Ensure `work_items.position` (DOUBLE PRECISION) uses fractional ranking (lexorank) for $O(1)$ reordering without re-indexing the entire column.

## 5. Backend Changes
- Implement `BoardService`:
  - Position calculator: generates intermediate position between adjacent items (`(pos_prev + pos_next) / 2`).
  - View query generator: dynamically constructs SQL queries with arbitrary groupings (`GROUP BY status_id`, `GROUP BY assignee_id`).
  - WIP limit checker: integrates with `lib/jira-clickup-adapter.js` to reject moves that breach column limits unless overridden by admin.

## 6. Frontend Changes
- View Toolbar:
  - View Switcher tabs: Kanban, Table, List, Calendar.
  - Group By dropdown: Status, Assignee, Priority, Epic, Sprint.
  - Swimlane toggle: None, Assignee, Epic, Priority.
  - Card Customizer modal: toggles visible card badges.
- Kanban Board Component:
  - Drag-and-drop handler with ghost drag element and drop zone indicators.
  - Column header with card count, story point sum, and WIP badge (`3/5`).
  - Swimlane headers with collapse/expand toggles.
- Table / List Component:
  - Dense row layout with sticky header, checkbox selection, and inline editing.

## 7. API Changes
- `GET /api/v1/projects/:projectId/boards/:boardId` - Fetch board configuration and columns.
- `GET /api/v1/projects/:projectId/boards/:boardId/items` - Fetch grouped cards for active view.
- `PATCH /api/v1/work-items/:id/move` - Move card to target column/swimlane and rank position.
- `POST /api/v1/projects/:projectId/boards/:boardId/views` - Save custom view configuration.

## 8. Security Considerations
- Validate user permissions: moving an item requires `issue.transition_dev` or `issue.edit_any`.
- Prevent race condition card displacement during simultaneous moves.

## 9. UX States
- **Loading State:** Ghost card outlines shimmering in each column.
- **Empty State:** "No cards in this column" with drop zone dashed outline.
- **Error State:** Dragged card snaps back to original position with error toast explaining failure.
- **Retry State:** Optimistic update rolls back if server returns error.
- **Permission-Denied State:** Cards are not draggable; cursor displays `not-allowed`.

## 10. Edge Cases
- Fractional rank precision exhaustion: rebalance positions when difference between adjacent cards $< 0.000001$.
- Dragging a card to a column that exceeds WIP limits: show confirmation modal if user has override permissions, or block move.
- Dropping card on touch devices: handle touch drag events or provide explicit "Move to..." context menu.

## 11. Tests
- Unit test: fractional position calculation produces valid midpoint ordering.
- Integration test: moving card to new status persists position and triggers audit log.
- a11y test: keyboard card movement using arrow keys and `Enter`/`Space`.

## 12. Acceptance Criteria
- [ ] Drag-and-drop moves cards between columns with immediate optimistic feedback.
- [ ] Users can group board by Status, Assignee, Priority, Epic, or Sprint.
- [ ] Swimlanes render accurately across all columns.
- [ ] Table/List view supports inline editing and column sorting.
- [ ] WIP limit breaches are visually highlighted.

## 13. Dependencies
Phase 03 (Work Item Engine).

## 14. Risks
- Drag-and-drop performance degradation with >500 cards in a column: mitigated by virtualizing column cards and implementing pagination for Backlog columns.
