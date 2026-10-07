# BeyondPM Phase 00: Repository Audit & Architecture Decisions

## 1. Objective
Establish the architectural foundation, perform a comprehensive repository and dependency audit, formulate target architecture and ADRs, and create detailed execution specifications for all subsequent implementation phases.

## 2. Existing State
The repository contains a client-side prototype (`index.html`, `portal.html`, `app.js`, `style.css`), a Jira-ClickUp adapter class (`lib/jira-clickup-adapter.js`) with passing unit tests (`tests/jira-clickup-adapter.test.js`), GitHub Actions automation YAMLs (`.github/workflows/`), and operational GraphQL automation scripts (`scripts/`) connected to live GitHub Projects V2 Project #34. However, it lacks a normalized database persistence layer, backend API server, visual DAG workflow/automation builders, and formal RBAC enforcement.

## 3. Required Changes
- Formulate complete architectural master documents: `PROJECT-AUDIT.md`, `TARGET-ARCHITECTURE.md`, `IMPLEMENTATION-PLAN.md`, `DATABASE-DESIGN.md`, `GITHUB-INTEGRATION.md`, `UX-SYSTEM.md`, and `PERMISSION-MATRIX.md`.
- Create detailed implementation plans for Phases 0 through 20 in `docs/phases/`.
- Establish Git branch discipline (`feat/architecture-and-phases`).

## 4. Database Changes
No runtime database modifications in Phase 0. Deliver the canonical relational schema specification (`docs/DATABASE-DESIGN.md`) covering all 30+ tables, composite indexes, and foreign keys.

## 5. Backend Changes
Define API specifications, service layer boundaries, and ADRs (ADR-001 through ADR-005).

## 6. Frontend Changes
Define the design token system, typography pairings (Plus Jakarta Sans + JetBrains Mono), responsive breakpoints, and component contracts in `docs/UX-SYSTEM.md`.

## 7. API Changes
Document endpoint taxonomy for REST API v1 (`/api/v1/auth`, `/api/v1/tenancy`, `/api/v1/work-items`, `/api/v1/workflows`, `/api/v1/automations`, `/api/v1/github`).

## 8. Security Considerations
Define token encryption scheme (AES-256-GCM), HMAC-SHA256 webhook signature verification algorithm, and the 9-role/44-permission RBAC evaluation pipeline.

## 9. UX States
Not applicable for Phase 0 documentation deliverable.

## 10. Edge Cases
- Discrepancies between local file structure and GitHub Projects V2 GraphQL schema: resolved by aligning entity fields with GitHub Projects V2 field mappings.
- Backward compatibility with existing Jira-ClickUp adapter: adapter logic preserved and slated for integration into the backend state machine.

## 11. Tests
- Validate all existing tests pass: `npm test` executes and passes (7 adapter tests, circular dependency detection, WIP audit).
- Verify documentation files exist and conform to required structure.

## 12. Acceptance Criteria
- [x] `docs/PROJECT-AUDIT.md` created with comprehensive repository inventory and gap analysis.
- [x] `docs/TARGET-ARCHITECTURE.md` created with system topology and ADRs.
- [x] `docs/IMPLEMENTATION-PLAN.md` created with master 20-phase roadmap and exit gates.
- [x] `docs/DATABASE-DESIGN.md` created with normalized 3NF relational schema.
- [x] `docs/GITHUB-INTEGRATION.md` created with webhook ingestion, correlation regex, and dev panel specs.
- [x] `docs/UX-SYSTEM.md` created with design tokens, typography, and component library specs.
- [x] `docs/PERMISSION-MATRIX.md` created with 9 roles, 44 permission keys, and middleware logic.
- [x] `docs/phases/` directory populated with `PHASE-00.md` through `PHASE-20.md`.

## 13. Dependencies
None. Phase 0 is the prerequisite for all subsequent phases.

## 14. Risks
- Scope creep during architecture planning: mitigated by strictly bounding each phase with defined exit criteria.
