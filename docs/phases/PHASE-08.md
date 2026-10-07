# BeyondPM Phase 08: GitHub Integration Core

## 1. Objective
Establish first-class GitHub connectivity: GitHub App / OAuth authorization, repository linkage to projects, token encryption, bidirectional issue synchronization, and a repository import wizard with configurable label/milestone mapping.

## 2. Existing State
The repository has operational CLI automation scripts in `scripts/` using personal access tokens for Project #34 GraphQL queries. There is no automated GitHub App authentication, OAuth user flow, encrypted secret storage, or UI repository import wizard.

## 3. Required Changes
- Implement persistence models for `github_installations` and `github_repositories`.
- Build GitHub App authentication service with secure AES-256-GCM token encryption.
- Build UI GitHub Connect screen allowing organization admins to link GitHub repositories to projects.
- Build Repository Import Wizard:
  - Fetches GitHub issues, labels, milestones, and assignees.
  - Interactive mapping UI: maps labels to Work Item Types and Priorities; maps milestones to Sprints/Releases.
  - Idempotent import runner preventing duplicate issues.

## 4. Database Changes
- Create `github_installations` and `github_repositories` tables per `docs/DATABASE-DESIGN.md`.
- Add foreign key `projects.github_repo_id` linking projects to connected repositories.
- Add unique constraint: `UNIQUE(installation_id)` and `UNIQUE(github_repo_id)`.

## 5. Backend Changes
- Implement `GitHubAuthService`:
  - Handles GitHub App installation callback.
  - Encrypts installation tokens and secrets using AES-256-GCM before database write.
  - Refreshes expiring GitHub installation tokens dynamically.
- Implement `GitHubImportService`:
  - Fetches paginated issues via Octokit / GitHub REST API.
  - Transforms GitHub issues into `work_items` based on user-configured mapping rules.
  - Maintains mapping table preventing duplicate re-imports.

## 6. Frontend Changes
- Settings $\to$ GitHub Integration Screen:
  - "Connect GitHub Organization" button initiating GitHub App installation.
  - Connected Repositories list with status badges (`Active`, `Syncing`, `Error`).
- GitHub Import Wizard Modal:
  - Step 1: Select repository.
  - Step 2: Map Labels $\to$ Types (e.g. `bug` $\to$ `Bug`, `feature` $\to$ `Feature`).
  - Step 3: Map Labels $\to$ Priorities (e.g. `p0` $\to$ `Critical`, `p1` $\to$ `High`).
  - Step 4: Import preview summary and progress bar.

## 7. API Changes
- `GET /api/v1/github/installations` - List authorized installations.
- `GET /api/v1/github/installations/:id/repositories` - List accessible GitHub repos.
- `POST /api/v1/projects/:projectId/github/connect` - Link repo to project.
- `POST /api/v1/projects/:projectId/github/import` - Start background import job with mapping config.
- `GET /api/v1/projects/:projectId/github/import/status` - Poll import progress.

## 8. Security Considerations
- Master encryption keys (`PM_ENCRYPTION_SECRET`) loaded exclusively from secure server environment.
- Never expose raw GitHub private keys or installation tokens to the browser.
- Require `github.configure` permission to link or unlink repositories.

## 9. UX States
- **Loading State:** Spinning octocat icon during repository fetch.
- **Empty State:** "No GitHub repository connected yet. Connect your repository to sync PRs and issues."
- **Error State:** "GitHub authorization expired. Reconnect GitHub App."
- **Retry State:** "Retrying GitHub connection..."
- **Permission-Denied State:** "Only Project Admins can configure GitHub integrations."

## 10. Edge Cases
- Repository renamed or transferred on GitHub: handle GitHub webhook repository event to update `full_name`.
- GitHub rate limit reached during import of 5,000 issues: pause import, wait for rate-limit reset header, and resume automatically.
- Issue imported with an assignee not present in BeyondPM: assign to reporter and flag unmapped user.

## 11. Tests
- Unit test: AES-256-GCM encrypts and decrypts GitHub token cleanly with authentication tag check.
- Integration test: GitHub import transforms mock GitHub issues into valid work items without duplicates.
- UI test: complete the 4-step import wizard and verify imported items populate the project board.

## 12. Acceptance Criteria
- [ ] GitHub App installation flow completes and saves encrypted tokens.
- [ ] Organization repositories are discoverable and linkable to projects.
- [ ] Import wizard correctly maps labels, priorities, and milestones.
- [ ] Imported tickets appear on Kanban board and Backlog view with GitHub issue numbers.

## 13. Dependencies
Phase 02 (Projects), Phase 03 (Work Items).

## 14. Risks
- GitHub API rate limits during bulk repository imports: mitigated by using conditional requests (`If-None-Match` ETag) and rate-limit backoff.
