# BeyondPM Phase 05: Backlog & Scrum/Sprint Engine

## 1. Objective
Implement a full-featured Scrum planning and sprint execution system: Product Backlog, Sprint Backlog, capacity planning, sprint lifecycle management (Create, Start, Complete), carryover handling, and burndown/burnup velocity tracking.

## 2. Existing State
The codebase uses a static folder concept for "Active Sprint 12" and "Backlog" in `app.js`. There are no sprint dates, start/complete lifecycles, capacity meters, or velocity metrics.

## 3. Required Changes
- Implement persistence models for `sprints` and sprint assignment tracking.
- Build sprint planning view: Backlog list side-by-side with Sprint containers.
- Implement capacity planning: team capacity hours vs. committed story points.
- Implement pre-flight sprint launch validation (unassigned work, missing estimates, dependency warnings).
- Implement Sprint Completion modal with carryover workflow (move to Next Sprint or Backlog).

## 4. Database Changes
- Create `sprints` table with `status` (`PLANNED`, `ACTIVE`, `COMPLETED`), start/end timestamps, and capacity points per `docs/DATABASE-DESIGN.md`.
- Ensure `work_items.sprint_id` foreign key correctly links items to sprints.

## 5. Backend Changes
- Implement `SprintService`:
  - `startSprint`: transitions sprint to `ACTIVE`, validates only one active sprint exists per board/project, locks initial scope for burndown baseline.
  - `completeSprint`: marks sprint `COMPLETED`, calculates velocity, moves incomplete items to next sprint or backlog.
  - `getSprintMetrics`: aggregates daily committed vs. completed points for burndown chart generation.

## 6. Frontend Changes
- Backlog & Sprint Planning View:
  - Collapsible sprint cards showing sprint name, date range, total points, and status.
  - Drag-and-drop items between Backlog and Sprint containers.
  - Sprint Capacity bar: color-coded progress (Green = under capacity, Red = over capacity).
  - Pre-flight launch modal showing warnings:
    - ⚠️ 3 items have no story points assigned.
    - ⚠️ 1 item has unresolved blockers.
  - "Start Sprint" and "Complete Sprint" action buttons.
  - Burndown Chart drawer rendering ideal vs. actual remaining points.

## 7. API Changes
- `GET /api/v1/projects/:projectId/sprints` - List sprints (active, planned, past).
- `POST /api/v1/projects/:projectId/sprints` - Create new planned sprint.
- `PATCH /api/v1/sprints/:id/start` - Start sprint with duration and goal.
- `PATCH /api/v1/sprints/:id/complete` - Complete sprint with carryover target.
- `GET /api/v1/sprints/:id/burndown` - Fetch daily burndown data points.

## 8. Security Considerations
- Require `sprint.create`, `sprint.start`, `sprint.complete` permissions.
- Validate that regular developers cannot alter sprint dates without PM role.

## 9. UX States
- **Loading State:** Shimmering sprint container headers and task row skeletons.
- **Empty State:** "No active sprint. Drag tickets here from the Backlog to start planning."
- **Error State:** Warning dialog if user attempts to start a second active sprint.
- **Retry State:** Retry button on failed sprint completion.
- **Permission-Denied State:** "Start Sprint" button disabled with explanation tooltip.

## 10. Edge Cases
- Completing a sprint with all items still in progress: warn user and offer batch carryover.
- Changing sprint duration while active: recalculate end date and burndown slope.
- Moving an item out of an active sprint: record scope change event in sprint audit log.

## 11. Tests
- Unit test: verify only one active sprint permitted concurrently per project.
- Unit test: carryover workflow moves incomplete items and unassigns sprint ID if moved to backlog.
- Integration test: burndown metric generation returns correct daily point deltas.

## 12. Acceptance Criteria
- [ ] Users can drag tickets between Backlog and Sprint containers.
- [ ] Sprint launch displays pre-flight warning summary.
- [ ] Active sprint displays capacity and progress meter.
- [ ] Completing sprint properly handles incomplete items and archives sprint history.
- [ ] Real burndown chart plots ideal vs actual trajectory based on stored completion events.

## 13. Dependencies
Phase 03 (Work Item Engine), Phase 04 (Multi-View Board Engine).

## 14. Risks
- Data inaccuracy in burndown charts if completion timestamps are altered: mitigated by calculating metrics from immutable status transition audit events in `activities`.
