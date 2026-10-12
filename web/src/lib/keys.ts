import { NAV } from "@/components/shell/nav";

// Shared keyboard state. "G then a letter" is a two-key chord, so other
// single-letter shortcuts (J/K in a ticket, R) must stand aside while it waits.
export const chord = { gAt: 0 };
export const chordPending = () => Date.now() - chord.gAt < 1200;

/** Every shortcut, for the ? list, the guide popover and the Guide page. */
export const SHORTCUTS: { keys: string; label: string; where: string }[] = [
  { keys: "C", label: "New ticket", where: "Anywhere" },
  { keys: "/", label: "Search this view", where: "Anywhere" },
  { keys: "Ctrl K", label: "Jump to anything (tickets, views, actions)", where: "Anywhere" },
  { keys: "R", label: "New reminder (linked to the open ticket, if any)", where: "Anywhere" },
  { keys: "?", label: "List every shortcut", where: "Anywhere" },
  { keys: "[", label: "Collapse or expand the sidebar", where: "Anywhere" },
  { keys: "Esc", label: "Close a panel, dialog or edit", where: "Anywhere" },
  { keys: "J / K", label: "Next / previous ticket in the same column", where: "Open ticket" },
  { keys: "Ctrl Enter", label: "Send a comment or save an edit", where: "Text boxes" },
  { keys: "Ctrl S", label: "Save the whiteboard", where: "Whiteboard" },
  ...NAV.map((n) => ({ keys: `G ${n.key.toUpperCase()}`, label: `Go to ${n.label}`, where: "Anywhere" })),
];
