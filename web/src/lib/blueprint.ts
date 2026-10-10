// The board layout BeyondPM works best with. "Set up this board" adds whatever
// is missing from a team's GitHub project and repository; nothing that already
// exists is renamed or removed, so it is safe to run on a board in use.

export type Color = "GRAY" | "BLUE" | "GREEN" | "YELLOW" | "ORANGE" | "RED" | "PINK" | "PURPLE";
type Opt = { name: string; color: Color; description?: string };
export type FieldPlan =
  | { name: string; kind: "single"; options: Opt[] }
  | { name: string; kind: "number" | "date" }
  | { name: string; kind: "iteration"; weeks: number; count: number };

export const FIELDS: FieldPlan[] = [
  { name: "Priority", kind: "single", options: [
    { name: "🔴 Critical", color: "RED", description: "Drop everything" }, { name: "🟠 High", color: "ORANGE" },
    { name: "🟡 Medium", color: "YELLOW" }, { name: "🔵 Low", color: "BLUE" }] },
  { name: "Ticket Type", kind: "single", options: [
    { name: "⚡ Epic", color: "PURPLE" }, { name: "✨ Feature", color: "GREEN" }, { name: "📝 Task", color: "BLUE" },
    { name: "🐛 Bug", color: "RED" }, { name: "🎧 Support", color: "ORANGE" }, { name: "❓ Question", color: "GRAY" }] },
  { name: "Size", kind: "single", options: [
    { name: "XS", color: "GRAY" }, { name: "S", color: "BLUE" }, { name: "M", color: "GREEN" }, { name: "L", color: "YELLOW" }, { name: "XL", color: "RED" }] },
  { name: "Component", kind: "single", options: [
    { name: "🎨 UI/UX Design", color: "PINK" }, { name: "⚙️ Backend API", color: "BLUE" }, { name: "🗄️ Database", color: "GREEN" },
    { name: "🔒 Security", color: "RED" }, { name: "📚 Documentation", color: "GRAY" }, { name: "🚀 Ops / Infrastructure", color: "PURPLE" }] },
  { name: "Story Points", kind: "number" },
  { name: "Start date", kind: "date" },
  { name: "Target date", kind: "date" },
  { name: "Sprint", kind: "iteration", weeks: 2, count: 6 },
];

/** Stages for the built-in Status field (GitHub creates it with Todo / In Progress / Done). */
export const STATUSES: Opt[] = [
  { name: "📥 Backlog", color: "GRAY" }, { name: "📋 Todo", color: "BLUE" }, { name: "⚡ In Progress", color: "PURPLE" },
  { name: "🔍 Code Review", color: "ORANGE" }, { name: "🧪 QA & Testing", color: "YELLOW" }, { name: "✅ Done", color: "GREEN" },
];

export const LABELS: { name: string; color: string; description: string }[] = [
  { name: "bug", color: "d73a4a", description: "Something isn't working" },
  { name: "feature", color: "a855f7", description: "A new capability" },
  { name: "task", color: "1d76db", description: "A piece of work" },
  { name: "epic", color: "8b5cf6", description: "A large body of work with sub-tasks" },
  { name: "incident", color: "991b1b", description: "Something is down" },
  { name: "request", color: "3b82f6", description: "A request from someone" },
  { name: "support", color: "0e8a16", description: "A customer needs help" },
  { name: "spike", color: "c5def5", description: "Time-boxed research" },
  { name: "question", color: "d4c5f9", description: "A question to answer" },
  { name: "triage", color: "fbca04", description: "New, waiting to be sorted" },
  { name: "priority: p0", color: "b60205", description: "Critical" },
  { name: "priority: p1", color: "d93f0b", description: "High" },
  { name: "priority: p2", color: "fbca04", description: "Medium" },
  { name: "priority: p3", color: "0e8a16", description: "Low" },
];
