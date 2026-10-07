# Board Engine

## Generic View Architecture

```
Project Issues Dataset
        │
        ▼
   Query Engine (Filters + Sort + Grouping)
        │
        ▼
   View Renderers:
   ├─ 1. Kanban Board (Columns, WIP limits, Swimlanes)
   ├─ 2. Scrum Board (Backlog, Active Sprint, Capacity, Burndown)
   ├─ 3. List View (Inline editing, high-density spreadsheet)
   ├─ 4. Table View (Custom column configurations)
   ├─ 5. Timeline View (Gantt chart with epic/task bars)
   ├─ 6. Roadmap View (Quarterly strategic alignment Q1-Q4)
   ├─ 7. Calendar View (Due dates, releases, milestones)
   ├─ 8. Dependency Graph View (Node graph, circular dependency check)
   ├─ 9. Matrix View (2x2 Impact vs Effort grid)
   └─ 10. Release View (Version release readiness & feature breakdown)
```
