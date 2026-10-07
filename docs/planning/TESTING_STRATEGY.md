# Testing Strategy

## Quality Assurance Pipeline
1. **Unit Tests**: Test issue hierarchy rules, workflow state transitions, permission evaluation, WIP limit validation, automation condition evaluation.
2. **Integration & API Tests**: API endpoints, workflow guardrails, custom field parsing, search query parsing, GitHub webhook handling.
3. **Concurrency & Automation Recursion Tests**: Verify idempotency key enforcement and depth limits under high-volume automated events.
4. **Manual & Subagent Browser Verification**: Visual verification of dark-mode styling, drag & drop views, command palette, and interactive views.
