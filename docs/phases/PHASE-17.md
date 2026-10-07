# BeyondPM Phase 17: Performance, Virtualization & Caching

## 1. Objective
Ensure the platform delivers sub-100ms response times and smooth 60 FPS interactions under enterprise scale: handling 100,000+ work items, virtualized board and table rendering, query caching, debounced search, and request deduplication.

## 2. Existing State
The current client-side prototype in `app.js` renders all tickets directly into the DOM as HTML nodes. With 50+ tickets this causes slight reflow delays; with 1,000+ tickets it would cause substantial DOM bloat and input lag.

## 3. Required Changes
- Frontend Virtualization:
  - Implement windowed list virtualization for Table and List views (rendering only visible rows in viewport + overscan buffer).
  - Implement column-level virtualization for dense Kanban boards.
- Backend Query Optimization:
  - Implement cursor-based keyset pagination for work item lists (`WHERE (created_at, id) < (:cursorCreatedAt, :cursorId)`).
  - Add query caching layer with TTL and tag-based invalidation for project boards and analytics.
- Client Data Layer Optimization:
  - Request deduplication: merge identical concurrent read queries into a single inflight promise.
  - Optimistic mutations with rollback on failure.
  - Image and avatar lazy loading with native `loading="lazy"`.

## 4. Database Changes
- Validate composite B-Tree indexes across all critical query paths:
  - `INDEX(project_id, status_id, position)`
  - `INDEX(project_id, created_at DESC, id DESC)`
  - `INDEX(assignee_id, status_id)`
- Perform `EXPLAIN ANALYZE` audits on board fetching queries to verify zero full table scans.

## 5. Backend Changes
- Implement `CacheService`:
  - In-memory / Redis cache adapter for board and project configurations.
  - Cache invalidation on mutation events (`ITEM_MOVED`, `STATUS_CHANGED`).
- Implement Keyset Pagination in `WorkItemRepository`.

## 6. Frontend Changes
- Virtualized Table Component:
  - Computes total scroll height and renders only visible items based on `scrollTop` offset.
  - Maintains steady 60 FPS scrolling even with 10,000+ records in memory.
- Search Input Debouncer:
  - 150ms debounce with cancellation of previous pending abort controllers.
- Optimistic Mutation Queue:
  - Applies local state changes immediately; queues network requests; rolls back with toast if request fails.

## 7. API Changes
- Update item query endpoints to accept cursor pagination parameters:
  - `GET /api/v1/projects/:projectId/work-items?cursor=eyJjcmVhdGVkQXQi...&limit=50`
  - Response includes `nextCursor` and `hasMore` flags.

## 8. Security Considerations
- Prevent cursor tampering: sign or validate cursor payloads to reject manipulated offset parameters.
- Protect against cache poisoning: include tenant ID in all cache key namespaces (`tenant:{orgId}:project:{projId}:board`).

## 9. UX States
- **Loading State:** Instant render of cached data with subtle background sync spinner ("Syncing...").
- **Empty State:** Clean empty view.
- **Error State:** Network offline banner; mutations queued for background retry.
- **Retry State:** "Offline mode: 3 changes pending sync".
- **Permission-Denied State:** Not applicable for performance layer.

## 10. Edge Cases
- Rapid scrolling through 10,000 items: placeholder skeleton rows render while cursor page is loaded.
- Cache invalidation storm during mass bulk updates (e.g. 500 items moved at once): debounce cache invalidation with a 250ms batching window.
- Unstable network connection: client saves mutation to IndexedDB queue and replays upon `navigator.onLine` event.

## 11. Tests
- Performance benchmark: render 5,000 table rows and measure DOM node count ($< 100$ nodes in DOM simultaneously).
- Backend benchmark: measure p95 latency for board items query ($< 50\text{ms}$ with 100,000 stored items).
- Keyset pagination test: verify pagination returns non-overlapping, strictly ordered records across pages.

## 12. Acceptance Criteria
- [ ] Virtualized table renders 10,000 items smoothly at 60 FPS without DOM slowdown.
- [ ] Keyset pagination eliminates offset-based performance degradation on deep pages.
- [ ] Board fetching p95 latency stays under 50ms.
- [ ] Search input debouncing cancels redundant pending queries.

## 13. Dependencies
Phase 03 (Work Items), Phase 04 (Multi-View Board).

## 14. Risks
- Out-of-sync cache returning stale data: mitigated by setting aggressive 60-second TTLs and strict event-based cache invalidation.
