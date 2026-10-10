# BeyondPM Phase 01: Design System & Application Shell

## 1. Objective
Build a reusable, accessible, and high-performance design system with design tokens, layout primitives, accessible navigation shell, collapsible sidebar, fast slide-out drawer, and core UI components.

## 2. Existing State
The repository has `style.css` (800+ lines) and `index.html` featuring a cosmic aurora background, basic layout, and a hardcoded sidebar. Some interactive primitives are tightly coupled to `app.js` and lack modular component abstractions.

## 3. Required Changes
- Modularize design tokens into a cohesive CSS variable system (`tokens.css`).
- Implement 32 reusable design system primitives (Button, Input, Select, Badge, Avatar, Modal, Drawer, etc.).
- Build an application shell with collapsible multi-tier sidebar, persistent workspace header, and view container.
- Implement responsive drawer component with focus-trapping, backdrop blur, and escape key handling.

## 4. Database Changes
None (Client-side design system and UI shell).

## 5. Backend Changes
Serve design system assets and test harness via static/dev server.

## 6. Frontend Changes
- Create `src/ui/tokens.css` with dark mode palettes, typography, spacing, and glassmorphic elevations.
- Create `src/ui/components/`:
  - `button.js`, `badge.js`, `avatar.js`, `modal.js`, `drawer.js`, `tabs.js`, `tooltip.js`.
- Refactor `index.html` to leverage the modular UI shell.
- Add accessible keyboard navigation handlers (`Tab`, `Escape`, `Enter`).

## 7. API Changes
None.

## 8. Security Considerations
- Sanitize HTML in any rendered user input within UI components to prevent XSS.
- Enforce strict Content Security Policy (CSP) compatible inline styles and Google Fonts origins.

## 9. UX States
- **Loading State:** Skeleton loaders for sidebar items, header avatars, and drawer content.
- **Empty State:** Clean empty view containers with contextual call-to-actions.
- **Error State:** Visual error banner / toast with retry button.
- **Retry State:** Active spinner during retry attempt.
- **Permission-Denied State:** Subtle locked state with tooltip indicating required role.

## 10. Edge Cases
- Extremely long workspace or project names: truncated with CSS ellipsis and full title in hover tooltip.
- Narrow tablet viewports (768px-1024px): sidebar automatically collapses to icon-rail without overlapping content.
- Screen reader focus traps inside modals: focus stays bounded within active dialog until closed.

## 11. Tests
- Visual regression checks across desktop (1440px), tablet (768px), and mobile (375px).
- Keyboard accessibility tests: verify drawer closes on `Escape` and traps focus when open.
- Color contrast verification: ensure minimum 4.5:1 ratio across all text tokens.

## 12. Acceptance Criteria
- [ ] CSS token system fully documented and implemented without hardcoded values.
- [ ] Sidebar collapses smoothly and remembers user preference (collapsed vs expanded).
- [ ] Drawer slides out smoothly from right in <200ms with backdrop blur.
- [ ] Responsive navigation works across desktop, tablet, and mobile breakpoints.
- [ ] Zero accessibility contrast violations under WCAG AA guidelines.

## 13. Dependencies
Phase 00 (Architecture Blueprints & Audit).

## 14. Risks
- Performance overhead from excessive backdrop-filter blurs on low-end hardware: mitigated by applying `backdrop-filter` only to floating overlays and drawers.
