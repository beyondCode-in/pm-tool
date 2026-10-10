# BeyondPM Phase 11: Interactive Roadmap & Releases

## 1. Objective
Build an interactive, multi-tier Roadmap Gantt engine supporting Initiatives, Epics, Features, Milestones, and Releases across Day, Week, Month, Quarter, and Year scales, with drag-to-reschedule, dependency curve visualization, and conflict warnings.

## 2. Existing State
The codebase lacks a native roadmap view in the web client. While GitHub Projects V2 has a basic roadmap view (View #4), there is no interactive timeline with dependency links, drag-rescheduling, or release risk indicators.

## 3. Required Changes
- Implement persistence models for `releases`, `release_items`, and milestones.
- Build interactive Roadmap Canvas:
  - Multi-scale header: Day, Week, Month, Quarter, Year.
  - Left pane: hierarchical item list (Initiatives $\to$ Epics $\to$ Features) with progress bars.
  - Right pane: Gantt timeline bars spanning `start_date` to `due_date`.
  - SVG dependency connectors between blocked and blocking bars.
  - Drag bar to reschedule; drag edge to extend duration.
- Highlight delivery risk: overdue items, blocked items, and dependency conflicts (e.g. dependency scheduled after consumer).
- Build Release Management view: create version releases, track completion percentage, and publish releases.

## 4. Database Changes
- Create `releases` table per `docs/DATABASE-DESIGN.md`.
- Ensure `work_items.start_date` and `work_items.due_date` are indexed for timeline range queries: `INDEX(project_id, start_date, due_date)`.

## 5. Backend Changes
- Implement `RoadmapService`:
  - `getTimelineData(projectId, scale, dateRange)`: fetches hierarchical items with date spans and dependencies.
  - `rescheduleItem(itemId, newStartDate, newDueDate)`: updates dates and checks for dependency conflict warnings.
  - `cascadeReschedule(itemId, deltaDays)`: optionally cascades date shift to downstream dependent items.
- Implement `ReleaseService`:
  - Aggregates release completion stats (% done, remaining points, open bugs).

## 6. Frontend Changes
- Roadmap View:
  - Timescale selector buttons: Day, Week, Month, Quarter, Year.
  - Virtualized Gantt canvas with sticky item column.
  - Draggable timeline bars with completion progress fill.
  - Dependency connector curves (green = healthy, red = conflict).
  - Risk Warning Badges: ⚠️ Overdue, 🚫 Blocked by unstarted dependency.
- Releases Hub:
  - List of releases (`v2.4.0`, `v2.5.0`) with progress meters.
  - "New Release" modal and "Publish Release" action.

## 7. API Changes
- `GET /api/v1/projects/:projectId/roadmap` - Query items within date window with dependencies.
- `PATCH /api/v1/work-items/:id/reschedule` - Update start and due dates.
- `GET /api/v1/projects/:projectId/releases` - List releases and health metrics.
- `POST /api/v1/projects/:projectId/releases` - Create release.
- `PATCH /api/v1/releases/:id/publish` - Publish release and record release date.

## 8. Security Considerations
- Require `project.configure` or `sprint.create` permissions to reschedule roadmap items.
- Prevent arbitrary date corruptions (validate `start_date <= due_date`).

## 9. UX States
- **Loading State:** Shimmering Gantt bars across timeline grid.
- **Empty State:** "No scheduled epics or releases found. Set start and due dates on your epics to see them on the roadmap."
- **Error State:** Red border on drag bar if rescheduled date creates a circular date dependency.
- **Retry State:** Optimistic date adjustment snaps back if server save fails.
- **Permission-Denied State:** Timeline bars are fixed; dragging is disabled.

## 10. Edge Cases
- Moving an item causes its due date to exceed a hard release milestone: render warning modal highlighting release risk.
- Items without `start_date` but having `due_date`: render as milestone diamond marker on due date.
- Massive date spans (e.g. 3-year initiative): virtualize horizontal scroll canvas to avoid SVG rendering lag.

## 11. Tests
- Unit test: dependency conflict detector identifies when blocker ends after consumer starts.
- Unit test: cascade rescheduling correctly shifts downstream dates by exact day delta.
- UI test: drag timeline bar forward 7 days and verify updated dates persist.

## 12. Acceptance Criteria
- [ ] Multi-scale roadmap renders Initiatives, Epics, and Features accurately.
- [ ] Drag-to-reschedule updates start and due dates with instant visual feedback.
- [ ] Dependency lines visualize relationships and highlight scheduling conflicts.
- [ ] Releases hub tracks milestone version progress and release publication.

## 13. Dependencies
Phase 03 (Work Items), Phase 04 (Multi-View Board).

## 14. Risks
- Horizontal canvas scrolling lag with thousands of timeline elements: mitigated by virtualizing the viewport grid and rendering only visible date blocks.
