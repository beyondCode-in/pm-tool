# BeyondPM Phase 07: Custom Fields & Layout Builder

## 1. Objective
Build a flexible no-code custom field engine supporting 20 field types, validation rules, type-specific permissions, and an interactive drag-and-drop form layout designer to organize fields into logical sections (General, Ownership, Engineering, Tracking, Custom).

## 2. Existing State
The application only supports fixed hardcoded fields (title, priority, status, story points) in the client state and fixed custom fields in GitHub Projects V2. There is no UI for defining new custom fields or altering issue form layouts.

## 3. Required Changes
- Implement persistence models for `custom_fields` and `custom_field_values`.
- Build custom field engine supporting 20 types: Text, Textarea, Number, Currency, Percentage, Dropdown, Multi-select, Checkbox, Radio, Date, Datetime, User, Multi-user, URL, Email, Repository, Branch, PR, Formula, Relationship.
- Build no-code Field Builder UI with type picker, validation rules, default values, and required toggles.
- Build Form Layout Designer: drag-and-drop section manager allowing admins to order fields across General, Ownership, Engineering, Tracking, and Custom sections.
- Dynamically render configured fields inside the Issue Detail slide-out panel and creation modal.

## 4. Database Changes
- Create `custom_fields` and `custom_field_values` tables per `docs/DATABASE-DESIGN.md`.
- Add unique constraint: `UNIQUE(organization_id, project_id, field_key)`.
- Index typed value columns: `INDEX(work_item_id, custom_field_id)`.

## 5. Backend Changes
- Implement `CustomFieldService`:
  - Validator: validates input values against field type constraints (e.g. valid regex for email/url, numeric bounds for percentage/currency, allowed options for dropdown).
  - Bulk value updater: efficiently persists changed field values in a single transaction.
  - Formula evaluator: evaluates dynamic calculated fields (e.g., `Story Points * Hourly Rate`).

## 6. Frontend Changes
- Admin Studio: Custom Fields & Layout Designer:
  - "+ Add Field" modal with field type cards and configuration form.
  - Drag-and-drop Layout Builder canvas: organize fields into customizable sections.
- Dynamic Form Renderer:
  - Generates appropriate input control based on `field_type`.
  - Inline blur-save on ticket detail drawer.
  - Real-time client-side validation with red highlight and error tooltip.

## 7. API Changes
- `GET /api/v1/projects/:projectId/custom-fields` - List project custom fields and layout order.
- `POST /api/v1/projects/:projectId/custom-fields` - Create new custom field.
- `PATCH /api/v1/custom-fields/:id` - Update field config or layout position.
- `DELETE /api/v1/custom-fields/:id` - Soft-delete custom field.
- `PUT /api/v1/work-items/:id/custom-fields` - Batch update custom field values.

## 8. Security Considerations
- Require `field.create` and `field.modify` permissions.
- Validate custom formula syntax to prevent formula injection or arbitrary code execution.
- Sanitize rendered text and HTML in custom field values to prevent XSS.

## 9. UX States
- **Loading State:** Shimmering form fields in drawer.
- **Empty State:** "No custom fields configured for this project. Add your first field in Project Settings."
- **Error State:** Field outline flashes red with inline error message ("Value must be a valid email").
- **Retry State:** Autosave badge: "Saving..." $\to$ "Saved".
- **Permission-Denied State:** Field renders as read-only text without edit affordance.

## 10. Edge Cases
- Changing a dropdown field type to plain text: prompt confirmation to convert existing option values.
- Deleting a custom field with 1,000 existing values: soft-delete field definition and retain historical values in archive.
- Formula referencing a missing or null field: gracefully display `#N/A` or fallback value without crashing UI.

## 11. Tests
- Unit test: field type validation rejects invalid number, email, and unlisted dropdown values.
- Integration test: batch update custom field values persists and re-reads correctly.
- UI test: add a "Customer Impact" dropdown field, drag it into "Tracking" section, and verify it renders in the issue detail drawer.

## 12. Acceptance Criteria
- [ ] Admins can create custom fields of various types without writing code.
- [ ] Field layout designer allows drag-and-drop section reorganization.
- [ ] Issue detail drawer dynamically renders custom fields according to configured layout.
- [ ] Inline editing persists custom field values with validation feedback.

## 13. Dependencies
Phase 02 (Projects), Phase 03 (Work Items).

## 14. Risks
- Large volume of custom field values impacting query performance: mitigated by storing typed columns with index lookups rather than giant unstructured JSON blobs.
