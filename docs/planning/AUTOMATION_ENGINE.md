# Automation Engine

## Rule Structure & Safety Controls

```
TRIGGER ──► CONDITIONS ──► ACTIONS
```

### Folder Architecture
Organized into directories:
- `automations/github/` (PR created, PR merged, build failed)
- `automations/tickets/` (auto-assign, stale ticket, overdue)
- `automations/sprints/` (sprint start, sprint finish)
- `automations/releases/` (release ready, release blocked)
- `automations/notifications/` (slack, email, in-app)

### Recursion & Loop Prevention Safety System
1. `execution_id` (UUIDv4) tracked per event propagation chain.
2. `trigger_depth`: Incrementing integer (Hard limit: depth > 3 halts execution).
3. `idempotency_key`: `hash(automation_id + issue_id + trigger_timestamp_minute)`. Prevents duplicate triggers within 60 seconds.
4. **Dry Run Mode**: Executes conditions against live data and returns simulated actions without mutating state.
