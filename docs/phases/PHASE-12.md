# BeyondPM Phase 12: Dashboards & Real PM Analytics

## 1. Objective
Build a configurable dashboard builder with resizable drag-and-drop widgets and an enterprise analytics engine computing real engineering metrics (Velocity, Cycle Time, Lead Time, Throughput, Sprint Completion, Bug Rate, PR Review Time, Blocked Time) derived from stored activity events.

## 2. Existing State
The application has no dashboards or metrics engine. The current UI has a static status breakdown in `app.js` with zero historical trend reporting, lead/cycle time calculations, or custom widget builders.

## 3. Required Changes
- Implement persistence models for `dashboards` and `dashboard_widgets`.
- Build an analytics calculation engine computing real metrics from stored `activities` and `work_items` data:
  - **Velocity:** Story points completed per sprint over rolling sprints.
  - **Cycle Time:** Time elapsed from `In Progress` status to `Done / Released`.
  - **Lead Time:** Time elapsed from ticket creation to `Done / Released`.
  - **Throughput:** Count of closed items per week/month.
  - **PR Review Time:** Hours between PR opened and first approving review.
  - **Blocked Time:** Cumulative hours tickets remain in `Blocked` status.
- Build Dashboard Builder:
  - Drag-and-drop 12-column grid layout.
  - Widget Catalog: My Tasks, Sprint Progress, Velocity Chart, Burndown, Issue Distribution, Workload by Assignee, CI Health, Recent Activity.
  - Widget config modal (filter by project, assignee, date range, issue type).

## 4. Database Changes
- Create `dashboards` and `dashboard_widgets` tables per `docs/DATABASE-DESIGN.md`.
- Add performance indexes on `activities(action, timestamp)` and `work_items(project_id, status_id, updated_at)`.

## 5. Backend Changes
- Implement `AnalyticsService`:
  - `calculateCycleTime(projectId, dateRange)`: computes mean, median (P50), and 85th percentile (P85) cycle time in days.
  - `calculateVelocity(projectId, sprintCount)`: aggregates completed points across recent closed sprints.
  - `calculateThroughput(projectId, interval)`: groups closed items by calendar week/month.
  - `calculateBlockedTime(projectId)`: aggregates hours spent in blocked state from transition history.
- Implement `DashboardService`:
  - CRUD operations for user dashboards and widget layouts.

## 6. Frontend Changes
- Dashboard Hub View:
  - Dashboard Switcher dropdown (Personal Dashboards, Team Dashboards).
  - "+ Add Widget" drawer with preview cards.
  - Grid layout with draggable and resizable cards.
- Chart Components (Canvas / SVG):
  - Cycle Time Scatterplot with P50/P85 percentile lines.
  - Sprint Velocity Bar Chart.
  - Issue Distribution Donut Chart.
  - Workload Stacked Bar by team member.
- Filter toolbar: date range picker (Last 7d, 14d, 30d, 90d, Custom), project selector.

## 7. API Changes
- `GET /api/v1/projects/:projectId/dashboards` - List dashboards.
- `POST /api/v1/projects/:projectId/dashboards` - Create dashboard.
- `PATCH /api/v1/dashboards/:id/layout` - Update widget coordinates.
- `GET /api/v1/projects/:projectId/analytics/cycle-time` - Fetch cycle time metrics.
- `GET /api/v1/projects/:projectId/analytics/velocity` - Fetch velocity history.
- `GET /api/v1/projects/:projectId/analytics/throughput` - Fetch weekly throughput.

## 8. Security Considerations
- Require `report.view` and `dashboard.modify` permissions.
- Validate date range parameters to prevent resource-exhaustion queries on large historical datasets.

## 9. UX States
- **Loading State:** Shimmering chart skeletons with pulsing metric numbers.
- **Empty State:** "No data available for the selected date range. Try expanding the date filter."
- **Error State:** Widget error card with "Failed to compute metric. Click to retry."
- **Retry State:** Live reload icon on chart card header.
- **Permission-Denied State:** "You do not have permission to view project analytics."

## 10. Edge Cases
- Insufficient historical data (brand new project with zero closed items): render placeholder explanation with guidance rather than division-by-zero NaN.
- Extremely long outlier tickets (e.g. ticket open for 2 years): P85 percentile line protects aggregate metrics from distortion.
- User resizing widget to 1x1: collapse chart to a compact numeric summary badge.

## 11. Tests
- Unit test: Cycle Time calculation correctly computes P50 and P85 percentiles from transition events.
- Unit test: Velocity calculation excludes incomplete sprint items.
- UI test: add a "Velocity Chart" widget, resize to 6 columns, and assert position saves to database.

## 12. Acceptance Criteria
- [ ] Dashboards render real metrics calculated strictly from stored database events.
- [ ] Zero fake or hardcoded charts; all data points link to real work items.
- [ ] Users can drag, drop, resize, and configure dashboard widgets.
- [ ] Cycle time, Lead time, and Velocity charts reflect live sprint and issue transitions.

## 13. Dependencies
Phase 03 (Work Items), Phase 05 (Sprints), Phase 09 (GitHub Events).

## 14. Risks
- Expensive analytical aggregation queries over 100,000+ historical rows: mitigated by pre-aggregating daily metrics in background worker or caching query responses with 5-minute TTL.
