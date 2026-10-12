import { GuideIcon } from "@/components/brand/guide-icon";
import { BookOpen, CalendarDays, Chats, Scribble, Clock, House, Target, Users, ChartNoAxesColumn, Inbox, KanbanSquare, ListTodo, Map, Network, Rows3, Settings, Timer } from "@/components/icons";

// The same seven views as the GitHub project, plus a calendar and a dashboard.
export const NAV = [
  { href: "/home/", label: "Home", icon: House, hint: "Your LineUp, to-dos and week", key: "h" },
  { href: "/my-work/", label: "My work", icon: ListTodo, hint: "Everything assigned to you", key: "m" },
  { href: "/inbox/", label: "Inbox", icon: Inbox, hint: "New tickets waiting for triage", key: "i" },
  { href: "/board/", label: "Board", icon: KanbanSquare, hint: "All work by stage", key: "b" },
  { href: "/sprint/", label: "Sprint", icon: Timer, hint: "The current sprint", key: "s" },
  { href: "/backlog/", label: "Backlog", icon: Rows3, hint: "Plan sprints and priorities", key: "l" },
  { href: "/roadmap/", label: "Roadmap", icon: Map, hint: "Work on a timeline", key: "r" },
  { href: "/calendar/", label: "Calendar", icon: CalendarDays, hint: "Due dates by month", key: "c" },
  { href: "/goals/", label: "Goals", icon: Target, hint: "Targets with a date and progress", key: "o" },
  { href: "/epics/", label: "Epics", icon: Network, hint: "Epics and their tasks", key: "e" },
  { href: "/workload/", label: "Workload", icon: Users, hint: "Who has how much, day by day", key: "w" },
  { href: "/timesheet/", label: "Timesheet", icon: Clock, hint: "Time logged this week, by day", key: "t" },
  { href: "/chat/", label: "Chat", icon: Chats, hint: "Channels and threads with your team", key: "a" },
  { href: "/docs/", label: "Docs", icon: BookOpen, hint: "Specs, how-tos and decisions", key: "k" },
  { href: "/whiteboards/", label: "Whiteboards", icon: Scribble, hint: "Sketch flows and ideas together", key: "x" },
  { href: "/dashboard/", label: "Dashboard", icon: ChartNoAxesColumn, hint: "Progress, workload, risks", key: "d" },
  { href: "/help/", label: "Guide", icon: GuideIcon, hint: "How everything works, in detail", key: "u" },
  { href: "/settings/", label: "Settings", icon: Settings, hint: "Tags, sidebar, appearance", key: "p" },
] as const;
