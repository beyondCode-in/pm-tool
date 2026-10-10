# BeyondPM Phase 13: Notifications & Activity Audit Log

## 1. Objective
Build an internal notification center with event filtering and delivery grouping, paired with an immutable append-only activity audit trail capturing every state change, assignment, priority edit, comment, and GitHub synchronization event.

## 2. Existing State
The codebase outputs activity messages to browser `console.log` in `app.js` and CLI test output in `tests/jira-clickup-adapter.test.js`. There is no persistent notification center, user preference matrix, or immutable audit table.

## 3. Required Changes
- Implement persistence models for `notifications` and `activities`.
- Build Notification Center UI:
  - Header bell icon with unread badge counter.
  - Dropdown & full view: All, Unread, Mentions, Assignments.
  - Mark as read, mark all read, clear notification.
  - Notification preference settings (in-app toggles for mentions, assignments, PR reviews, CI failures).
- Build Project & Ticket Activity Audit Stream:
  - Append-only timeline showing actor, action, old value, new value, timestamp, and metadata.
  - Filter audit events by actor, action type, and date range.

## 4. Database Changes
- Create `notifications` and `activities` tables per `docs/DATABASE-DESIGN.md`.
- Ensure `activities` table has no `DELETE` or `UPDATE` triggers (strictly immutable append-only).
- Index `notifications(user_id, is_read, created_at DESC)` and `activities(entity_id, timestamp DESC)`.

## 5. Backend Changes
- Implement `NotificationService`:
  - `dispatchNotification(recipientId, eventType, entityId, payload)`: checks user preferences and saves notification.
  - Aggregator: groups repetitive notifications (e.g. "Alex and 3 others commented on PM-142").
- Implement `AuditService`:
  - `recordActivity(actorId, action, entityType, entityId, oldVal, newVal, metadata)`: creates audit record in transaction with domain mutation.

## 6. Frontend Changes
- Top Navigation Bar:
  - Notification Bell with animated unread badge.
  - Flyout notification popover with tabbed filters (`All`, `Unread`, `@Mentions`).
- Ticket Detail Drawer:
  - **Activity & History** tab displaying chronological event diffs:
    - *Akshay changed status from Development to Code Review* (2 hours ago)
    - *GitHub Integration linked PR #341* (1 hour ago)
    - *Priya changed priority from Medium to Critical* (30 minutes ago)
- User Profile $\to$ Notification Preferences panel.

## 7. API Changes
- `GET /api/v1/notifications` - Fetch paginated user notifications.
- `PATCH /api/v1/notifications/:id/read` - Mark notification as read.
- `POST /api/v1/notifications/mark-all-read` - Bulk mark all as read.
- `GET /api/v1/work-items/:id/activities` - Fetch audit trail for work item.
- `GET /api/v1/projects/:projectId/activities` - Fetch project-wide audit log.

## 8. Security Considerations
- Ensure users can only read and mutate their own notifications (`WHERE user_id = :currentUserId`).
- Audit log records are cryptographically protected against tampering; deletion is prohibited by database policy.

## 9. UX States
- **Loading State:** Shimmering notification cards in drawer.
- **Empty State:** "You're all caught up! No unread notifications."
- **Error State:** "Failed to load notifications. Click to retry."
- **Retry State:** Live reload spinner on notification dropdown header.
- **Permission-Denied State:** Audit log tab viewable by team members; global audit export restricted to Admins.

## 10. Edge Cases
- Rapid duplicate notifications (e.g. user toggles assignment 5 times in 10 seconds): debounce and consolidate into single latest event.
- Mentioning a deleted user in a comment: skip notification dispatch without throwing exception.
- Long text diffs in audit trail (e.g. 5,000-character description edit): store character delta and render collapsible "View Diff" modal.

## 11. Tests
- Unit test: notification aggregator bundles 4 comments into a single grouped summary notification.
- Unit test: audit service records precise old and new values across status and priority changes.
- Integration test: updating ticket status creates an audit entry and delivers a notification to the assignee.

## 12. Acceptance Criteria
- [ ] Notification bell displays accurate unread badge count.
- [ ] Notifications can be filtered by mentions, assignments, and read status.
- [ ] Every important ticket operation creates an immutable audit record with diff.
- [ ] Activity stream on ticket detail renders real historical events with timestamps.

## 13. Dependencies
Phase 02 (Tenancy & Users), Phase 03 (Work Items).

## 14. Risks
- Rapid database growth in `activities` table over millions of operations: mitigated by table partitioning by month and archiving historical records older than 1 year.
