# Migration & Import/Export Plan

## Data Importers & Exporters
- **Import Sources**: Jira (JSON/XML export), GitHub Issues (REST API sync), Trello (JSON), CSV, custom JSON.
- **Export Targets**: CSV, JSON, Markdown summaries.
- **Admin Guardrails**: Status deletion prompts mandatory reassignment/migration of affected tickets prior to mutation.
