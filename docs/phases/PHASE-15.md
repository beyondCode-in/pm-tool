# BeyondPM Phase 15: Command Palette & Global Search

## 1. Objective
Implement a keyboard-first power-user Command Palette (`Ctrl/Cmd + K`) for instant navigation and action execution, alongside a fast Global Search engine supporting structured query syntax (`assignee:me status:"In Progress"`, `type:bug priority:critical`).

## 2. Existing State
The current application has a simple text input filter in the sidebar (`#sidebarSearchInput` in `app.js` and `index.html`) that performs basic substring filtering on ticket titles. There is no `Ctrl+K` command modal, action execution, or structured query grammar.

## 3. Required Changes
- Build Command Palette Modal (`Ctrl/Cmd + K`):
  - Category groups: Actions, Navigation, Recent Items, Workspaces.
  - Commands: Create Issue, Create Sprint, Open Project, Assign Issue, Change Status, Create Branch, Open GitHub PR, Switch Workspace, Toggle Dark Mode.
  - Fuzzy search filtering with keyboard arrow navigation (`↑` / `↓`) and `Enter` execution.
- Build Global Search Engine:
  - Query Syntax Lexer & Parser supporting token filters:
    - `assignee:me`, `assignee:@username`
    - `status:"In Progress"`, `status:open`
    - `type:bug`, `type:epic`
    - `priority:critical`
    - `sprint:"Sprint 12"`
    - `repo:pm-tool pr:open`
  - Saved Filters functionality: users can name and save complex queries and pin them to their sidebar.

## 4. Database Changes
- Add full-text search indexes on `work_items(title, description)` using PostgreSQL tsvector / SQLite FTS5.
- Create `saved_filters` table with `user_id`, `project_id`, `name`, `query_string`, and `is_pinned`.

## 5. Backend Changes
- Implement `SearchService`:
  - Query Lexer: tokenizes search strings into structured filter ASTs.
  - Search Query Builder: translates filter tokens into indexed SQL `WHERE` clauses.
  - Full-text search matcher with rank scoring.
- Implement `SavedFilterService`:
  - CRUD operations for user saved queries.

## 6. Frontend Changes
- Command Palette Component (`<div class="command-palette">`):
  - Global keyboard listener for `Ctrl+K` / `Cmd+K`.
  - Floating dialog with blurred backdrop, search input, and categorized results list.
  - Keyboard focus cycling and instant execution on `Enter`.
- Search Bar & Query Builder:
  - Autocomplete suggestion popover for search syntax tokens (e.g. typing `status:` suggests available statuses).
  - Search results dropdown and full-page results view with highlighted keyword matches.
  - "Save as Filter" button with custom naming modal.

## 7. API Changes
- `GET /api/v1/search` - Global query search endpoint with query syntax parser.
- `GET /api/v1/saved-filters` - List user saved filters.
- `POST /api/v1/saved-filters` - Save new filter query.
- `DELETE /api/v1/saved-filters/:id` - Delete saved filter.

## 8. Security Considerations
- Sanitize search input to prevent SQL injection or FTS parser injection.
- Enforce tenant and project permissions: search results strictly exclude items from projects where the user lacks `issue.view`.

## 9. UX States
- **Loading State:** Shimmering result rows inside the palette.
- **Empty State:** "No commands or tickets match your query. Press Esc to close."
- **Error State:** "Search syntax error: invalid token at column 14."
- **Retry State:** Instant re-query as user continues typing (debounced at 150ms).
- **Permission-Denied State:** Hidden items automatically filtered from search results.

## 10. Edge Cases
- User searches with multiple conflicting filters (e.g. `status:Done status:Backlog`): treat as `OR` union for same attribute.
- Special characters in ticket titles (e.g. search for `[BUG] (v2.4.0)`): escape regex and FTS reserved characters.
- Pressing `Ctrl+K` while an issue detail modal is already open: command palette mounts at higher z-index (z-index: 9999) without closing underlying drawer.

## 11. Tests
- Unit test: query lexer correctly tokenizes `assignee:me status:"In Progress" priority:critical`.
- Integration test: full-text search retrieves tickets by title and body matching query terms.
- UI test: press `Ctrl+K`, type "Create Issue", press `Enter`, and assert Create Issue modal opens.

## 12. Acceptance Criteria
- [ ] `Ctrl+K` opens command palette from any screen.
- [ ] Users can execute common actions (create ticket, switch project, change status) via keyboard.
- [ ] Global search supports structured tokens (`assignee:`, `status:`, `type:`, `priority:`).
- [ ] Saved filters can be created and accessed from the sidebar.

## 13. Dependencies
Phase 01 (Design System), Phase 03 (Work Items), Phase 04 (Board Engine).

## 14. Risks
- Slow search query latency on large text fields: mitigated by using database-native FTS5 / GIN indexes and debouncing client search inputs.
