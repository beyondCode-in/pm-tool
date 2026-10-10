# BeyondPM Phase 09: GitHub Events, Webhooks & Development Panel

## 1. Objective
Build an asynchronous, cryptographically secure GitHub webhook ingestion pipeline, extract work item keys from branch names, commits, PR titles, and PR descriptions, and render a live Development Panel inside each work item showing branches, commits, PR review state, CI check statuses, and deployment environments.

## 2. Existing State
The repository has GitHub Action workflows (`no-code-pr-auto-move.yml`, `project-automation.yml`) running in GitHub's cloud, but lacks an internal webhook receiver, event correlation engine, or issue development panel in the web UI.

## 3. Required Changes
- Implement persistence models for `github_events`, `pull_requests`, `commits`, `branches`, and `deployments`.
- Build webhook receiver endpoint `/api/v1/github/webhooks` with HMAC-SHA256 signature verification and delivery deduplication.
- Implement regex entity correlator extracting project keys (`PROJ-142`, `PM-100`) from:
  - Branch names (`feature/PM-142-auth`)
  - Commit messages (`PM-142: add oauth callback`)
  - Pull request titles (`#341 [PM-142] Implement Authentication`)
  - Pull request bodies (`Fixes PM-142`)
- Build the **Development Panel** inside the Work Item detail drawer:
  - Displays linked branch, active commits, PR status, reviews (Approved/Pending), CI check results (Pass/Fail), and deployment environments (Staging/Production).

## 4. Database Changes
- Create tables: `github_events`, `pull_requests`, `commits`, `branches`, `deployments` per `docs/DATABASE-DESIGN.md`.
- Add foreign key `pull_requests.work_item_id` and indexes on `delivery_id` and `work_item_id`.

## 5. Backend Changes
- Implement `WebhookIngestionService`:
  - Validates `X-Hub-Signature-256` header against repository webhook secret.
  - Checks `X-GitHub-Delivery` in `github_events` for deduplication.
  - Enqueues event for asynchronous processing.
- Implement `CorrelationDispatcher`:
  - Runs regex `/\b([A-Z]{2,10}-\d+)\b/g` across branch names, commit messages, and PR titles.
  - Creates or updates `pull_requests` and links to matching `work_items`.
  - Dispatches internal event for Phase 10 automation engine (`PR_OPENED`, `PR_MERGED`, `CI_PASSED`).

## 6. Frontend Changes
- Work Item Detail Drawer:
  - Add **Development** collapsible section.
  - Linked Branch badge with branch name, commits ahead, and GitHub link.
  - Linked PR card with PR #, title, author avatar, and status badge (`Open`, `Merged`, `Closed`).
  - Review status indicator: `🟢 2 Approved | 🟡 1 Pending`.
  - CI / CD status checks list: Build, Tests, Lint, Security, E2E with status icons (`✓`, `✗`, `⟳`).
  - Deployments badge: Staging (`✓ Deployed`), Production (`— Pending`).

## 7. API Changes
- `POST /api/v1/github/webhooks` - Webhook ingestion endpoint.
- `GET /api/v1/work-items/:id/development` - Fetch real-time development payload for item.
- `POST /api/v1/work-items/:id/pull-requests/manual-link` - Manually attach PR URL.

## 8. Security Considerations
- Mandatory HMAC-SHA256 timing-safe comparison on every incoming webhook.
- Guard against webhook replay attacks: deliveries older than 5 minutes or with duplicated IDs are rejected.
- Prevent spoofed commits: verify commit author against GitHub API or signed GPG tags when required.

## 9. UX States
- **Loading State:** Shimmering skeleton in Development panel.
- **Empty State:** "No branches, commits, or pull requests linked yet. Use branch name `feature/PM-142-...` to link automatically."
- **Error State:** Warning badge if webhook processing failed for a linked PR with retry option.
- **Retry State:** Live spinner next to CI checks while workflow runs.
- **Permission-Denied State:** Development metadata viewable by all members; manual linking restricted to Developers.

## 10. Edge Cases
- Commit message contains multiple ticket keys (`git commit -m "fix PM-142 and PM-145"`): both tickets linked to the commit.
- Webhook arrives out of order (e.g. `pull_request.closed` arrives before `pull_request.opened`): upsert logic reconciles state using GitHub event timestamps.
- CI check suite runs 50 parallel matrix jobs: aggregate results into a concise summary (`48/50 Passed`) with details popup.

## 11. Tests
- Unit test: HMAC signature validation accepts genuine payload and rejects tampered bytes.
- Unit test: regex extraction correctly parses ticket keys from branches, commits, and PR bodies.
- Integration test: simulate incoming `pull_request` webhook and assert development panel renders linked PR.

## 12. Acceptance Criteria
- [ ] Webhook endpoint cryptographically validates incoming payloads.
- [ ] Ticket IDs in branches, commits, and PRs automatically link to corresponding work items.
- [ ] Issue detail drawer displays real-time Development section with PR status, reviews, CI checks, and deployments.
- [ ] Echo webhooks from internal mutations do not trigger infinite loops.

## 13. Dependencies
Phase 03 (Work Items), Phase 08 (GitHub Integration Core).

## 14. Risks
- Webhook delivery spikes during large release merges: mitigated by acknowledging webhooks with HTTP 200 immediately and processing payloads asynchronously.
