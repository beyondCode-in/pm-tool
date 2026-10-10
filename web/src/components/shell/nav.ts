import { CalendarDays, ChartNoAxesColumn, Inbox, KanbanSquare, ListTodo, Map, Network, Rows3, Timer } from "lucide-react";

// The same seven views as the GitHub project, plus a calendar and a dashboard.
export const NAV = [
  { href: "/my-work/", label: "My work", icon: ListTodo, hint: "Everything assigned to you", key: "m" },
  { href: "/inbox/", label: "Inbox", icon: Inbox, hint: "New tickets waiting for triage", key: "i" },
  { href: "/board/", label: "Board", icon: KanbanSquare, hint: "All work by stage", key: "b" },
  { href: "/sprint/", label: "Sprint", icon: Timer, hint: "The current sprint", key: "s" },
  { href: "/backlog/", label: "Backlog", icon: Rows3, hint: "Plan sprints and priorities", key: "l" },
  { href: "/roadmap/", label: "Roadmap", icon: Map, hint: "Work on a timeline", key: "r" },
  { href: "/calendar/", label: "Calendar", icon: CalendarDays, hint: "Due dates by month", key: "c" },
  { href: "/epics/", label: "Epics", icon: Network, hint: "Epics and their tasks", key: "e" },
  { href: "/dashboard/", label: "Dashboard", icon: ChartNoAxesColumn, hint: "Progress, workload, risks", key: "d" },
] as const;
