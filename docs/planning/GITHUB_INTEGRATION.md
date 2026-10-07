# GitHub Integration

## Bidirectional GitHub Synchronizer

### Reference Parsing
Regex pattern matching ticket keys in branches, commits, PR titles and descriptions:
- `([A-Z]{2,10}-\d+)` (e.g., `PM-142`, `CORE-88`)
- Keywords: `fixes PM-142`, `closes PM-142`, `refs PM-142`.

### Webhook Event Flow
1. `pull_request.opened` -> Ticket status transitions to `Code Review`, links PR badge.
2. `pull_request_review.submitted` (Approved) -> Ticket status transitions to `Ready for QA`.
3. `pull_request.closed` (Merged) -> Ticket status transitions to `QA` or `Done`.
4. `workflow_run.completed` (CI Pass/Fail) -> Updates CI status badge on issue card.
5. `deployment_status` -> Updates Deployment stage (`Staging` / `Production`).
