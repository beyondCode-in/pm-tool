# 📁 beyondCode-in PM Tool — Directory & Folder Hierarchy

> This directory tree mirrors the folderization in Jira and ClickUp Spaces. Each folder contains the scoped tickets, subtasks, and dependency references.

```text
directory/
├── 01-core-infrastructure/
│   ├── README.md
│   ├── epics/
│   │   └── PM-100-core-platform-overhaul.md  (ROOT EPIC #8)
│   ├── sprint-12/
│   │   ├── PM-142-oauth-token-race-condition.md  (BUG #1)
│   │   ├── PM-145-database-pool-starvation/      (INCIDENT #2)
│   │   │   ├── README.md
│   │   │   ├── PM-145-A-redis-rate-limiter.md    (SUBTASK #6)
│   │   │   └── PM-145-B-postgres-pool-limit.md   (SUBTASK #7)
│   └── backlog/
│       └── PM-148-outbox-delivery-worker.md      (FEATURE #3)
└── 02-customer-requests/
    ├── README.md
    └── PM-152-csv-export-button.md               (REQUEST #5)
```

---

## 🔗 Root-to-Leaf Dependency Graph

```mermaid
graph TD
    EPIC["[PM-100] Core Platform Overhaul (Epic #8)"] --> INC["[PM-145] DB Pool Starvation (#2)"]
    EPIC --> BUG["[PM-142] OAuth Race Condition (#1)"]
    EPIC --> FEAT["[PM-148] Outbox Delivery Worker (#3)"]
    
    INC --> SUB1["[PM-145-A] Redis Rate Limiter (#6)"]
    INC --> SUB2["[PM-145-B] Postgres Pool Limit (#7)"]

    SUB1 -. blocks .-> INC
    SUB2 -. blocks .-> INC
    INC -. blocks .-> FEAT
    BUG -. resolved by .-> PR4["Pull Request #4"]
```
