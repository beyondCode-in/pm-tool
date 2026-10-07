# Workflow Engine

## Dynamic State Machine & Transition Guardrails

```
[ BACKLOG ] ──► [ READY ] ──► [ IN PROGRESS ] ──► [ CODE REVIEW ] ──► [ QA ] ──► [ RELEASED / DONE ]
```

### Transition Rule Specification
Each workflow transition contains:
1. **Conditions**: e.g., `PR_EXISTS == true`, `SUBTASKS_UNRESOLVED == 0`, `NO_BLOCKING_ISSUES == true`.
2. **Validators**: e.g., `PR_APPROVED == true`, `SECURITY_APPROVAL == true`.
3. **Allowed Roles**: e.g., Only `QA` role can move from `QA` -> `Passed`; Only `Developer` role can move `Todo` -> `In Progress`.
4. **Actions**: e.g., Auto-assign QA team member, set label `ready-for-testing`.
