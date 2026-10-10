import { addDays, today } from "./board";
import type { Board, Comment, DataSource, Field, FieldValues, Person, Ticket } from "./types";

// A realistic, self-contained board so anyone can try every screen without
// signing in. Changes live in memory until the page is reloaded.

const people: Person[] = [
  { login: "maya", name: "Maya Rao", avatarUrl: "" },
  { login: "sam", name: "Sam Okafor", avatarUrl: "" },
  { login: "lee", name: "Lee Chen", avatarUrl: "" },
  { login: "priya", name: "Priya Shah", avatarUrl: "" },
];
const you: Person = { login: "you", name: "You (demo)", avatarUrl: "" };

const opt = (id: string, name: string, color: string) => ({ id, name, color });
function fields(): Field[] {
  const start = addDays(today(), -((new Date().getDay() + 6) % 7) - 14); // Monday two weeks ago
  return [
    { id: "f-status", name: "Status", kind: "single", options: [
      opt("s1", "📥 Backlog", "GRAY"), opt("s2", "📋 Todo", "BLUE"), opt("s3", "⚡ In Progress", "PURPLE"),
      opt("s4", "🔍 Code Review", "ORANGE"), opt("s5", "🧪 QA & Testing", "YELLOW"), opt("s6", "✅ Done", "GREEN")] },
    { id: "f-priority", name: "Priority", kind: "single", options: [
      opt("p0", "🔴 Critical", "RED"), opt("p1", "🟠 High", "ORANGE"), opt("p2", "🟡 Medium", "YELLOW"), opt("p3", "🔵 Low", "BLUE")] },
    { id: "f-type", name: "Ticket Type", kind: "single", options: [
      opt("t1", "⚡ Epic", "PURPLE"), opt("t2", "✨ Feature", "GREEN"), opt("t3", "📝 Task", "BLUE"),
      opt("t4", "🐛 Bug", "RED"), opt("t5", "🎧 Support", "ORANGE"), opt("t6", "❓ Question", "GRAY")] },
    { id: "f-component", name: "Component", kind: "single", options: [
      opt("c1", "🎨 UI/UX Design", "PINK"), opt("c2", "⚙️ Backend API", "BLUE"), opt("c3", "🗄️ Database", "GREEN"),
      opt("c4", "🔒 Security", "RED"), opt("c5", "📚 Documentation", "GRAY"), opt("c6", "🚀 Ops / Infrastructure", "PURPLE")] },
    { id: "f-size", name: "Size", kind: "single", options: [
      opt("z1", "XS", "GRAY"), opt("z2", "S", "BLUE"), opt("z3", "M", "GREEN"), opt("z4", "L", "YELLOW"), opt("z5", "XL", "RED")] },
    { id: "f-points", name: "Story Points", kind: "number" },
    { id: "f-start", name: "Start date", kind: "date" },
    { id: "f-target", name: "Target date", kind: "date" },
    { id: "f-sprint", name: "Sprint", kind: "iteration", iterations: [0, 1, 2, 3].map((i) => ({
      id: `it${i + 1}`, title: `Sprint ${i + 1}`, startDate: addDays(start, 14 * i), duration: 14 })) },
  ];
}

type Seed = [number, string, string, Partial<FieldValues>, string[], string[], Partial<Ticket>?];
function seed(): Ticket[] {
  const d = (n: number) => addDays(today(), n);
  const rows: Seed[] = [
    [101, "[Epic] Self-serve reporting for customers", "Let customers build and export their own reports.",
      { Status: "⚡ In Progress", Priority: "🟠 High", "Ticket Type": "⚡ Epic", Component: "🎨 UI/UX Design", "Start date": d(-14), "Target date": d(28) }, ["maya"], ["epic", "priority: p1", "area: reports"]],
    [102, "[Feature] Export the monthly report as CSV", "### User story\n\nAs a sales manager I want to export the monthly report as CSV so that I can share it with finance.\n\n### Acceptance criteria\n\n- [x] Button on the report page\n- [ ] File opens in Excel\n- [ ] Works for 10k rows",
      { Status: "🔍 Code Review", Priority: "🟠 High", "Ticket Type": "✨ Feature", Component: "🎨 UI/UX Design", Size: "M", "Story Points": 5, Sprint: "it2", "Start date": d(-6), "Target date": d(3) }, ["sam"], ["feature", "priority: p1", "size: m", "area: reports"], { parent: 101 }],
    [103, "[Feature] Schedule reports by email every Monday", "Customers want the report in their inbox.",
      { Status: "📋 Todo", Priority: "🟡 Medium", "Ticket Type": "✨ Feature", Component: "⚙️ Backend API", Size: "L", "Story Points": 8, Sprint: "it2", "Start date": d(2), "Target date": d(12) }, ["you"], ["feature", "priority: p2", "size: l", "area: emails"], { parent: 101 }],
    [104, "[Bug] Report download does nothing in Safari", "### Steps to reproduce\n\n1. Open Reports in Safari\n2. Click Download\n3. Nothing happens\n\n### What should happen instead?\n\nA CSV file downloads.",
      { Status: "⚡ In Progress", Priority: "🔴 Critical", "Ticket Type": "🐛 Bug", Component: "🎨 UI/UX Design", Size: "S", "Story Points": 2, Sprint: "it2", "Start date": d(-2), "Target date": d(-1) }, ["priya"], ["bug", "priority: p0", "severity: blocker", "area: web-app"], { parent: 101 }],
    [105, "[Request] Make the invoice PDF show our VAT number", "### What kind of request is this?\n\n🎨 Change how something looks or reads",
      { Status: "📥 Backlog", Priority: "🟡 Medium", "Ticket Type": "✨ Feature" }, [], ["request", "triage", "design", "priority: p2", "area: billing"]],
    [106, "[Support] Acme Ltd can't invite new teammates", "### Customer or account\n\nAcme Ltd · account #10293",
      { Status: "📥 Backlog", Priority: "🟠 High", "Ticket Type": "🎧 Support" }, [], ["support", "triage", "priority: p1"]],
    [107, "[Task] Add rate limiting to the export endpoint", "Protect the API from very large exports.",
      { Status: "📋 Todo", Priority: "🟡 Medium", "Ticket Type": "📝 Task", Component: "⚙️ Backend API", Size: "S", "Story Points": 3, Sprint: "it2", "Target date": d(6) }, ["lee"], ["task", "priority: p2", "size: s", "area: api"], { parent: 102 }],
    [108, "[Task] Write help-centre article for CSV export", "",
      { Status: "🧪 QA & Testing", Priority: "🔵 Low", "Ticket Type": "📝 Task", Component: "📚 Documentation", Size: "XS", "Story Points": 1, Sprint: "it2", "Target date": d(4) }, ["you", "maya"], ["task", "priority: p3", "size: xs", "area: docs"], { parent: 102 }],
    [109, "[Bug] Password reset email arrives twice", "",
      { Status: "✅ Done", Priority: "🟡 Medium", "Ticket Type": "🐛 Bug", Component: "⚙️ Backend API", Size: "S", "Story Points": 2, Sprint: "it1", "Target date": d(-9) }, ["sam"], ["bug", "priority: p2", "area: emails"], { state: "CLOSED", closedAt: new Date(Date.now() - 3 * 864e5).toISOString() }],
    [110, "[Epic] Single sign-on for enterprise customers", "SAML and OIDC sign-in.",
      { Status: "📥 Backlog", Priority: "🟡 Medium", "Ticket Type": "⚡ Epic", Component: "🔒 Security", "Start date": d(14), "Target date": d(56) }, [], ["epic", "priority: p2", "area: login"]],
    [111, "[Spike] Compare SAML libraries", "",
      { Status: "📋 Todo", Priority: "🟡 Medium", "Ticket Type": "📝 Task", Component: "🔒 Security", Size: "S", "Story Points": 2, Sprint: "it3", "Start date": d(14), "Target date": d(16) }, ["priya"], ["spike", "priority: p2"], { parent: 110 }],
    [112, "[Feature] Dark mode for the dashboard", "",
      { Status: "✅ Done", Priority: "🔵 Low", "Ticket Type": "✨ Feature", Component: "🎨 UI/UX Design", Size: "M", "Story Points": 5, Sprint: "it1", "Target date": d(-12) }, ["maya"], ["feature", "priority: p3", "size: m"], { state: "CLOSED", closedAt: new Date(Date.now() - 10 * 864e5).toISOString() }],
    [113, "[Incident] Checkout slow for EU customers", "### Severity\n\nSEV2 — major feature down for many users",
      { Status: "⚡ In Progress", Priority: "🔴 Critical", "Ticket Type": "🐛 Bug", Component: "🚀 Ops / Infrastructure", Sprint: "it2", "Target date": d(0) }, ["sam", "you"], ["incident", "priority: p0", "area: infrastructure"]],
    [114, "[Request] Can we add Hindi to the language list?", "", { Status: "📥 Backlog", Priority: "🔵 Low", "Ticket Type": "❓ Question" }, [], ["request", "triage", "question", "priority: p3"]],
  ];
  const color: Record<string, string> = { bug: "d73a4a", feature: "a855f7", epic: "8b5cf6", incident: "991b1b", request: "3b82f6", support: "0e8a16", task: "1d76db", triage: "fbca04" };
  return rows.map(([number, title, body, f, assignees, labels, extra]) => ({
    itemId: `item-${number}`, issueId: `issue-${number}`, number, title, body,
    url: `https://github.com/demo/board/issues/${number}`, repo: "demo/board", state: "OPEN", createdAt: new Date(Date.now() - (120 - number) * 36e5 * 10).toISOString(),
    updatedAt: new Date().toISOString(), author: people[0], assignees: [you, ...people].filter((p) => assignees.includes(p.login)),
    labels: labels.map((name) => ({ name, color: color[name] ?? (name.startsWith("priority") ? "d93f0b" : "c2e0c6") })),
    commentCount: number % 3, parent: null, subIssues: { total: 0, completed: 0 }, fields: f as FieldValues, ...extra,
  })).map((t): Ticket => ({ ...t, state: t.state as Ticket["state"], parentUrl: t.parent ? `https://github.com/demo/board/issues/${t.parent}` : null }));
}

function withRollups(tickets: Ticket[]): Ticket[] {
  return tickets.map((t) => {
    const kids = tickets.filter((k) => k.parentUrl === t.url);
    return { ...t, subIssues: { total: kids.length, completed: kids.filter((k) => k.state === "CLOSED").length } };
  });
}

export function createDemoSource(): DataSource {
  let board: Board = {
    projectId: "demo", projectTitle: "Demo board", repoId: "demo", fields: fields(),
    labels: ["bug", "feature", "epic", "task", "incident", "request", "support", "spike", "triage", "design", "question"].map((name) => ({ name, color: "c2e0c6" })),
    people: [you, ...people], viewer: you, tickets: withRollups(seed()),
  };
  const comments = new Map<number, Comment[]>([
    [102, [{ id: "c1", author: people[1], body: "PR is up, could someone review? 🙏", createdAt: new Date(Date.now() - 864e5).toISOString() }]],
    [104, [{ id: "c2", author: people[3], body: "Reproduced on Safari 18. Looking at the blob download.", createdAt: new Date(Date.now() - 36e5 * 5).toISOString() }]],
  ]);
  const blockers = new Map<number, number[]>([[104, [107]], [103, [102]]]); // ticket → tickets blocking it
  const wait = () => new Promise((r) => setTimeout(r, 120));
  const patch = (n: number, p: (t: Ticket) => Ticket) => {
    board = { ...board, tickets: withRollups(board.tickets.map((t) => (t.number === n ? { ...p(t), updatedAt: new Date().toISOString() } : t))) };
  };

  return {
    mode: "demo",
    async load() { await wait(); return structuredClone(board); },
    async setField(_b, t, field, value) { await wait(); patch(t.number, (x) => ({ ...x, fields: { ...x.fields, [field]: value ?? undefined } })); },
    async setAssignees(_b, t, logins) { await wait(); patch(t.number, (x) => ({ ...x, assignees: board.people.filter((p) => logins.includes(p.login)) })); },
    async setLabels(_b, t, labels) { await wait(); patch(t.number, (x) => ({ ...x, labels: labels.map((name) => ({ name, color: "c2e0c6" })) })); },
    async setState(t, state) {
      await wait();
      patch(t.number, (x) => ({ ...x, state, closedAt: state === "CLOSED" ? new Date().toISOString() : null }));
    },
    async updateText(t, p) { await wait(); patch(t.number, (x) => ({ ...x, ...p })); },
    async comments(t) { await wait(); return comments.get(t.number) ?? []; },
    async addComment(t, body) {
      await wait();
      const c = { id: crypto.randomUUID(), author: you, body, createdAt: new Date().toISOString() };
      comments.set(t.number, [...(comments.get(t.number) ?? []), c]);
      patch(t.number, (x) => ({ ...x, commentCount: x.commentCount + 1 }));
      return c;
    },
    async updateComment(t, c, body) {
      await wait();
      comments.set(t.number, (comments.get(t.number) ?? []).map((x) => (x.id === c.id ? { ...x, body, editedAt: new Date().toISOString() } : x)));
    },
    async deleteComment(t, c) {
      await wait();
      comments.set(t.number, (comments.get(t.number) ?? []).filter((x) => x.id !== c.id));
      patch(t.number, (x) => ({ ...x, commentCount: Math.max(0, x.commentCount - 1) }));
    },
    async dependencies(t) {
      await wait();
      const url = (n: number) => `https://github.com/demo/board/issues/${n}`;
      return { blockedBy: (blockers.get(t.number) ?? []).map(url), blocking: [...blockers].filter(([, b]) => b.includes(t.number)).map(([n]) => url(n)) };
    },
    async addBlocker(t, b) {
      await wait();
      if (b.number === t.number) throw new Error("A ticket can't block itself.");
      if ((blockers.get(b.number) ?? []).includes(t.number)) throw new Error(`#${b.number} is already blocked by #${t.number}; that would be a loop.`);
      blockers.set(t.number, [...new Set([...(blockers.get(t.number) ?? []), b.number])]);
    },
    async removeBlocker(t, b) { await wait(); blockers.set(t.number, (blockers.get(t.number) ?? []).filter((n) => n !== b.number)); },
    async setParent(t, parent) {
      await wait();
      if (parent?.number === t.number) throw new Error("A ticket can't be its own parent.");
      patch(t.number, (x) => ({ ...x, parent: parent?.number ?? null, parentUrl: parent?.url ?? null }));
    },
    async attach(t, file) {
      await wait();
      const url = URL.createObjectURL(file);
      const isImage = file.type.startsWith("image/");
      const c = { id: crypto.randomUUID(), author: you, body: `📎 Attached **${file.name}**\n\n${isImage ? `![${file.name}](${url})` : `[${file.name}](${url})`}`, createdAt: new Date().toISOString() };
      comments.set(t.number, [...(comments.get(t.number) ?? []), c]);
      patch(t.number, (x) => ({ ...x, commentCount: x.commentCount + 1 }));
      return { name: file.name, url, isImage };
    },
    async logTime(_b, t, minutes, note) {
      await wait();
      const h = Math.floor(minutes / 60), m = minutes % 60;
      const c = { id: crypto.randomUUID(), author: you, body: `⏱️ Logged **${h ? `${h}h ` : ""}${m}m**${note ? ` — ${note}` : ""}`, createdAt: new Date().toISOString() };
      comments.set(t.number, [...(comments.get(t.number) ?? []), c]);
      patch(t.number, (x) => ({ ...x, commentCount: x.commentCount + 1 }));
    },
    async createLabel(l) {
      await wait();
      if (board.labels.some((x) => x.name.toLowerCase() === l.name.toLowerCase())) throw new Error(`A tag called "${l.name}" already exists.`);
      board = { ...board, labels: [...board.labels, { ...l, color: l.color.replace("#", "") }] };
    },
    async updateLabel(name, p) {
      await wait();
      const next = { name: p.name ?? name, color: (p.color ?? "").replace("#", ""), description: p.description };
      board = {
        ...board,
        labels: board.labels.map((l) => (l.name === name ? { ...l, ...next, color: next.color || l.color } : l)),
        tickets: board.tickets.map((t) => ({ ...t, labels: t.labels.map((l) => (l.name === name ? { ...l, name: next.name, color: next.color || l.color } : l)) })),
      };
    },
    async deleteLabel(name) {
      await wait();
      board = { ...board, labels: board.labels.filter((l) => l.name !== name), tickets: board.tickets.map((t) => ({ ...t, labels: t.labels.filter((l) => l.name !== name) })) };
    },
    async create(_b, input) {
      await wait();
      const number = Math.max(...board.tickets.map((t) => t.number)) + 1;
      const t: Ticket = {
        itemId: `item-${number}`, issueId: `issue-${number}`, number, title: input.title, body: input.body, url: `https://github.com/demo/board/issues/${number}`, repo: "demo/board",
        state: "OPEN", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), author: you,
        assignees: board.people.filter((p) => input.assignees.includes(p.login)), labels: input.labels.map((name) => ({ name, color: "c2e0c6" })),
        commentCount: 0, parent: input.parent ?? null, parentUrl: input.parent ? `https://github.com/demo/board/issues/${input.parent}` : null, subIssues: { total: 0, completed: 0 }, fields: input.fields,
      };
      board = { ...board, tickets: withRollups([t, ...board.tickets]) };
      return number;
    },
  };
}
