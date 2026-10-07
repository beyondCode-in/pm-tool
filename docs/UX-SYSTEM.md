# BeyondPM: User Experience & Design System Specification

**Document Version:** 1.0.0  
**Lead:** Senior UX Designer & Staff Frontend Engineer  
**Status:** Approved Design System Blueprint  
**Target Repository:** `beyondCode-in/pm-tool`

---

## 1. Visual Direction & Design Philosophy

BeyondPM adopts an original, high-performance aesthetic: **Dense, Developer-Friendly, and Minimalist Cosmic Aurora Glassmorphism**.

### Guiding UX Principles
1. **Minimal Clicks:** Direct inline editing on every field; no nested confirmation dialogues for reversible actions.
2. **Keyboard First:** Global command palette (`Ctrl+K`), quick search (`/`), single-key shortcuts (`c` for create, `m` for assign to me).
3. **High Information Density with Visual Breathing Room:** Tight typography paired with subtle 1px borders, gentle frosted glass, and clear visual hierarchy.
4. **Optimistic Updates:** Immediate visual feedback on card moves, edits, and status changes with graceful background reconciliation.
5. **No Decorative Bloat:** Animations are constrained to micro-interactions under 200ms with cubic-bezier easing (`cubic-bezier(0.16, 1, 0.3, 1)`).

---

## 2. Design Tokens & Visual Hierarchy

### 2.1 Color Tokens (Dark & Light Foundations)

```css
:root {
  /* Surfaces & Backgrounds */
  --bg-app: #060911;
  --bg-sidebar: #0a0f1d;
  --bg-surface: #10172a;
  --bg-surface-elevated: #162038;
  --bg-glass: rgba(16, 23, 42, 0.75);
  --bg-glass-card: rgba(22, 32, 56, 0.65);
  
  /* Borders & Dividers */
  --border-subtle: rgba(255, 255, 255, 0.07);
  --border-focus: rgba(99, 102, 241, 0.6);
  --border-active: rgba(6, 182, 212, 0.8);
  
  /* Typography Colors */
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --text-inverse: #0f172a;

  /* Primary Brand & Aurora Accents */
  --accent-indigo: #6366f1;
  --accent-purple: #a855f7;
  --accent-cyan: #06b6d4;
  --accent-emerald: #10b981;
  --accent-amber: #f59e0b;
  --accent-rose: #f43f5e;

  /* Semantic State Colors */
  --status-not-started: #64748b;
  --status-active: #3b82f6;
  --status-review: #a855f7;
  --status-qa: #f59e0b;
  --status-completed: #10b981;
  --status-cancelled: #ef4444;

  /* Priority Hex Tokens */
  --priority-critical: #f43f5e;
  --priority-high: #f97316;
  --priority-medium: #eab308;
  --priority-low: #38bdf8;
}
```

### 2.2 Typography Scale
- **Display & UI Font:** `Plus Jakarta Sans`, sans-serif (weights: 400, 500, 600, 700, 800).
- **Code & Keys Font:** `JetBrains Mono`, monospace (weights: 400, 500, 700).

| Token | Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `font-xs` | 11px (0.6875rem) | 14px | 500 | Badges, tags, timestamps |
| `font-sm` | 13px (0.8125rem) | 18px | 400/500 | Table cells, card labels, metadata |
| `font-base` | 14px (0.875rem) | 20px | 400/500 | Body text, input fields, button text |
| `font-md` | 16px (1.000rem) | 24px | 600 | Card titles, section headers |
| `font-lg` | 18px (1.125rem) | 26px | 600 | Panel titles, modal headers |
| `font-xl` | 22px (1.375rem) | 28px | 700 | Page titles, board names |
| `font-mono`| 12px (0.750rem) | 16px | 600 | Issue keys (`PM-142`), branches, commit SHA |

---

## 3. Core Component Library Specification

The design system implements 32 reusable UI primitives:

1. **Button & IconButton:** Variants: `primary`, `secondary`, `ghost`, `danger`, `glass`. Sizes: `sm`, `md`, `lg`. Supports loading spinner and icon slots.
2. **Input & Textarea:** Inline auto-growing textarea, instant blur-save triggers, validation error states.
3. **Select, MultiSelect & Combobox:** Filterable dropdowns with custom option renderers (e.g. user avatar + name).
4. **Checkbox, Radio & Switch:** Accessible toggle controls with keyboard focus indicators.
5. **Badge & Pill:** Semantic color badges for status, priority, and story points.
6. **Avatar & AvatarGroup:** User profile photo with fallback initials and active presence indicator.
7. **Tooltip & Popover:** Lightweight floating overlays positioned via CSS anchor or floating logic.
8. **Modal & Drawer:** Focus-trapping accessible containers with animated slide-in transitions.
9. **CommandMenu (`Ctrl+K`):** Multi-category searchable command palette.
10. **Tabs & Breadcrumbs:** Clear spatial orientation controls.
11. **Table:** Virtualized dense data grid with resizable columns, sticky headers, and sorting.
12. **KanbanCard:** High-density card displaying ticket key, title, priority icon, assignee avatar, SLA indicator, and PR badges.
13. **DatePicker:** Fast calendar popup with quick presets (Today, Tomorrow, End of Sprint).
14. **UserPicker:** Searchable autocomplete for workspace members.
15. **StatusPicker:** Dropdown displaying allowed workflow transition targets.
16. **PriorityPicker:** Visual priority selector (Critical, High, Medium, Low).
17. **WorkflowNode & AutomationNode:** Visual canvas nodes for DAG builders.
18. **FilterBuilder:** Dynamic structured filter bar (`field`, `operator`, `value`).

---

## 4. Application Layout & Responsive Behavior

### 4.1 Desktop Layout (> 1024px)
- **App Sidebar (260px):** Workspace switcher, search bar, My Work, Project Spaces, Planning, Development, Insights, Automations, Settings.
- **Main Viewport (Flex 1):** Context header, view tabs (Board, Backlog, List, Timeline, Roadmap), dynamic filter bar, and primary view canvas.
- **Issue Detail Panel (540px Drawer or Full Page):** Slides out from right; does not cause page reload or lose scroll position.

### 4.2 Tablet Layout (768px – 1024px)
- Sidebar collapses into an icon-rail (64px) with popover menus.
- Issue detail drawer expands to 80% screen width.
- Multi-column boards retain horizontal touch scroll with snap alignment.

### 4.3 Mobile Layout (< 768px)
- **Bottom Navigation Bar (56px):** 4 primary tabs: My Tasks, Board, Search, Projects.
- **Top Bar:** Workspace logo, quick search, and `+ New` button.
- **Drawer Panels:** Slide up as full-height bottom sheets with swipe-down dismissal.
- **Kanban on Mobile:** Column swipe view with indicator dots; tap to move or reorder cards.

---

## 5. Accessibility & Interaction Standards

1. **WCAG AA Compliance:** Contrast ratio $\ge 4.5:1$ on all UI text and interactive icons against dark surfaces.
2. **Keyboard Navigation:** Every action reachable via keyboard:
   - `Tab` / `Shift+Tab`: Logical tab ring.
   - `Escape`: Closes modals, drawers, and popovers.
   - `Ctrl+K`: Opens command palette.
   - `Enter` / `Space`: Activates buttons and selects rows.
3. **Screen Readers:** ARIA attributes (`aria-expanded`, `aria-haspopup`, `aria-controls`, `role="dialog"`, `role="region"`).
4. **Reduced Motion:** Honors `prefers-reduced-motion: reduce` by disabling canvas animations and transitions.
