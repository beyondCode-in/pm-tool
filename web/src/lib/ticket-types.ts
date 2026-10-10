// Ticket types offered in the app. They mirror .github/ISSUE_TEMPLATE/*.yml:
// same headings, same option text, same base labels. The issue body is
// written in the issue-form layout ("### Heading\n\nanswer"), so the triage
// workflow reads app-created tickets exactly like form-created ones.

export type Choice = { value: string; label: string; hint?: string };

export type Question =
  | { id: string; heading: string; kind: "text" | "longtext"; label: string; placeholder?: string; required?: boolean; prompts?: string[]; template?: string }
  | { id: string; heading: string; kind: "choice" | "multi"; label: string; choices: Choice[]; required?: boolean; default?: string | string[] };

export type TicketType = {
  id: string;
  emoji: string;
  name: string;
  blurb: string;
  titlePrefix: string;
  labels: string[];
  boardType: string; // word in the board's "Ticket Type" option
  forEveryone: boolean;
  titleIdeas: string[];
  questions: Question[];
};

export const PRIORITY: Choice[] = [
  { value: "🔴 P0 — Critical: something important is stopped", label: "Critical", hint: "Something important is stopped" },
  { value: "🟠 P1 — High: needed this sprint", label: "High", hint: "Needed this sprint" },
  { value: "🟡 P2 — Medium: in the next few weeks", label: "Medium", hint: "In the next few weeks" },
  { value: "🟢 P3 — Low: whenever there's time", label: "Low", hint: "Whenever there's time" },
];
const P2 = PRIORITY[2].value;

const AREAS: Choice[] = [
  "🌐 Web app", "📱 Mobile app", "⚙️ API / backend", "🗄️ Database / data", "🔐 Login & accounts", "💳 Billing & payments",
  "📊 Reports & analytics", "📧 Emails & notifications", "🎨 Design system / UI", "🏗️ Infrastructure / DevOps", "📄 Docs",
].map((a) => ({ value: a, label: a }));
const SIMPLE_AREAS: Choice[] = [
  "🌐 Web app", "📱 Mobile app", "🔐 Login & accounts", "💳 Billing & payments", "📊 Reports & analytics",
  "📧 Emails & notifications", "📄 Help pages & docs", "🤷 Not sure",
].map((a) => ({ value: a, label: a }));
const SIZE: Choice[] = [
  { value: "XS — a few hours", label: "XS", hint: "A few hours" },
  { value: "S — about a day", label: "S", hint: "About a day" },
  { value: "M — 2 to 3 days", label: "M", hint: "2–3 days" },
  { value: "L — about a week", label: "L", hint: "About a week" },
  { value: "XL — more than a week (should be split)", label: "XL", hint: "Should be split" },
];

const priorityQ: Question = { id: "priority", heading: "Priority", kind: "choice", label: "How urgent is it?", choices: PRIORITY, default: P2, required: true };
const areasQ = (choices = AREAS): Question => ({ id: "areas", heading: "Areas affected", kind: "multi", label: "Which areas does it touch?", choices, required: true });
const sizeQ: Question = { id: "size", heading: "Size estimate", kind: "choice", label: "How big is it?", choices: SIZE };

export const TICKET_TYPES: TicketType[] = [
  {
    id: "request", emoji: "💡", name: "Ask for something", blurb: "Ideas, changes, problems or questions, in your own words",
    titlePrefix: "[Request] ", labels: ["request", "triage"], boardType: "Feature", forEveryone: true,
    titleIdeas: ["Add a way to…", "Change the wording on…", "I can't…"],
    questions: [
      { id: "kind", heading: "What kind of request is this?", kind: "choice", label: "What kind of request is it?", required: true, default: "✨ A new idea or feature",
        choices: [
          { value: "✨ A new idea or feature", label: "✨ New idea" },
          { value: "🎨 Change how something looks or reads", label: "🎨 Look & feel" },
          { value: "🐛 Something is broken", label: "🐛 Something's broken" },
          { value: "🎧 A customer needs help", label: "🎧 Customer help" },
          { value: "❓ I have a question", label: "❓ Question" },
        ] },
      { id: "summary", heading: "In one sentence, what do you need?", kind: "text", label: "", required: true },
      priorityQ,
      areasQ(SIMPLE_AREAS),
      { id: "who", heading: "Who is affected?", kind: "choice", label: "Who is affected?", default: "Just me",
        choices: ["Just me", "My team", "One customer", "Many customers", "Everyone"].map((v) => ({ value: v, label: v })) },
      { id: "details", heading: "Tell us more (optional)", kind: "longtext", label: "Anything else we should know?",
        placeholder: "What happens today, and why would this help?", prompts: ["What did you try?", "What should happen instead?", "Why does it matter?"] },
      { id: "deadline", heading: "Is there a deadline? (optional)", kind: "text", label: "Is there a deadline?", placeholder: "e.g. Before the client demo on 15 November" },
    ],
  },
  {
    id: "bug", emoji: "🐛", name: "Something's broken", blurb: "It worked before, or should work, and doesn't",
    titlePrefix: "[Bug] ", labels: ["bug", "triage"], boardType: "Bug", forEveryone: true,
    titleIdeas: ["… doesn't load", "Can't save…", "Error when I click…"],
    questions: [
      { id: "summary", heading: "What's broken?", kind: "text", label: "", required: true },
      { id: "steps", heading: "Steps to reproduce", kind: "longtext", label: "What did you do?", required: true, template: "1. Go to …\n2. Click …\n3. See …" },
      { id: "expected", heading: "What should happen instead?", kind: "longtext", label: "What should happen instead?", required: true },
      priorityQ,
      { id: "severity", heading: "Severity", kind: "choice", label: "How bad is it?", required: true, default: "Minor — annoying but easy to live with",
        choices: [
          { value: "Blocker — no workaround, people can't do their job", label: "Blocker", hint: "No workaround" },
          { value: "Major — there's a painful workaround", label: "Major", hint: "Painful workaround" },
          { value: "Minor — annoying but easy to live with", label: "Minor", hint: "Easy to live with" },
          { value: "Cosmetic — looks wrong, works fine", label: "Cosmetic", hint: "Looks wrong, works" },
        ] },
      { id: "frequency", heading: "How often does it happen?", kind: "choice", label: "How often?", default: "Every time",
        choices: ["Every time", "Often", "Sometimes", "Happened once"].map((v) => ({ value: v, label: v })) },
      areasQ(),
      { id: "environment", heading: "Where did you see it?", kind: "multi", label: "Where did you see it?", default: ["Production"],
        choices: ["Production", "Staging", "Local / development"].map((v) => ({ value: v, label: v })) },
      { id: "evidence", heading: "Screenshots, recordings or logs", kind: "longtext", label: "Screenshots or error text", placeholder: "Paste error text, or add screenshots on GitHub after creating." },
    ],
  },
  {
    id: "feature", emoji: "✨", name: "Feature / user story", blurb: "Something new to build, with acceptance criteria",
    titlePrefix: "[Feature] ", labels: ["feature", "triage"], boardType: "Feature", forEveryone: false,
    titleIdeas: ["Export … as CSV", "Let people …", "Show …"],
    questions: [
      { id: "story", heading: "User story", kind: "text", label: "", required: true, placeholder: "As a … I want … so that …" },
      { id: "problem", heading: "Problem", kind: "longtext", label: "What's painful or impossible today?", required: true },
      { id: "solution", heading: "Proposed solution", kind: "longtext", label: "What should it do?" },
      { id: "acceptance", heading: "Acceptance criteria", kind: "longtext", label: "How will we know it's done?", required: true, template: "- [ ] \n- [ ] \n- [ ] " },
      priorityQ, areasQ(), sizeQ,
      { id: "timeframe", heading: "Target timeframe", kind: "choice", label: "When is it needed?", default: "Later / backlog",
        choices: ["This sprint", "Next sprint", "This quarter", "Later / backlog"].map((v) => ({ value: v, label: v })) },
      { id: "parent", heading: "Parent epic (optional)", kind: "text", label: "Parent epic", placeholder: "#42" },
    ],
  },
  {
    id: "task", emoji: "🧩", name: "Task", blurb: "A concrete piece of work under a feature or epic",
    titlePrefix: "[Task] ", labels: ["task"], boardType: "Task", forEveryone: false,
    titleIdeas: ["Write tests for …", "Update …", "Set up …"],
    questions: [
      { id: "summary", heading: "What needs doing?", kind: "longtext", label: "", required: true },
      { id: "done", heading: "Done when", kind: "longtext", label: "Done when…", template: "- [ ] \n- [ ] " },
      { id: "parent", heading: "Parent issue", kind: "text", label: "Parent issue", placeholder: "#42" },
      priorityQ, sizeQ, areasQ(),
    ],
  },
  {
    id: "epic", emoji: "🗺️", name: "Epic", blurb: "A large piece of work split into many tickets",
    titlePrefix: "[Epic] ", labels: ["epic"], boardType: "Epic", forEveryone: false,
    titleIdeas: ["Launch …", "Redesign …", "Migrate …"],
    questions: [
      { id: "goal", heading: "Goal", kind: "longtext", label: "What outcome does it deliver, and for whom?", required: true },
      { id: "metrics", heading: "How we'll measure success", kind: "longtext", label: "How will we measure success?" },
      { id: "breakdown", heading: "Breakdown", kind: "longtext", label: "Child tickets", template: "- [ ] \n- [ ] \n- [ ] " },
      priorityQ, areasQ(),
      { id: "out", heading: "Out of scope", kind: "longtext", label: "What won't it do?" },
    ],
  },
  {
    id: "incident", emoji: "🚨", name: "Incident", blurb: "Production is down or degraded right now",
    titlePrefix: "[Incident] ", labels: ["incident", "priority: p0"], boardType: "Bug", forEveryone: true,
    titleIdeas: ["Checkout is down", "Logins failing", "Site very slow"],
    questions: [
      { id: "summary", heading: "What's happening?", kind: "text", label: "", required: true },
      { id: "sev", heading: "Severity", kind: "choice", label: "How bad?", required: true, default: "SEV2 — major feature down for many users",
        choices: [
          { value: "SEV1 — full outage or data loss", label: "SEV1", hint: "Full outage or data loss" },
          { value: "SEV2 — major feature down for many users", label: "SEV2", hint: "Major feature down" },
          { value: "SEV3 — degraded, a workaround exists", label: "SEV3", hint: "Degraded, workaround" },
        ] },
      areasQ(),
      { id: "impact", heading: "Customer impact", kind: "choice", label: "Who's affected?", required: true, default: "Unknown yet",
        choices: ["All customers", "Some customers", "Internal only", "Unknown yet"].map((v) => ({ value: v, label: v })) },
      { id: "started", heading: "Started at (with time zone)", kind: "text", label: "When did it start?", required: true, placeholder: "2026-10-10 14:05 IST" },
      { id: "signals", heading: "What are you seeing?", kind: "longtext", label: "Errors, alerts, recent deploys" },
    ],
  },
  {
    id: "support", emoji: "🎧", name: "Customer support", blurb: "A customer or client needs help",
    titlePrefix: "[Support] ", labels: ["support", "triage"], boardType: "Support", forEveryone: true,
    titleIdeas: ["Customer can't log in", "Refund for …", "Change account …"],
    questions: [
      { id: "customer", heading: "Customer or account", kind: "text", label: "Which customer or account?", required: true, placeholder: "Acme Ltd · account #10293" },
      { id: "summary", heading: "What do they need?", kind: "text", label: "", required: true },
      { id: "category", heading: "Category", kind: "choice", label: "Category", required: true, default: "How do I…?",
        choices: ["Can't log in / access", "Billing or invoice", "Data looks wrong", "How do I…?", "Feature request from customer", "Something is broken", "Other"].map((v) => ({ value: v, label: v })) },
      { id: "tier", heading: "Customer tier", kind: "choice", label: "Customer tier", default: "Standard",
        choices: ["Enterprise", "Business", "Standard", "Free / trial"].map((v) => ({ value: v, label: v })) },
      priorityQ,
      { id: "details", heading: "Details", kind: "longtext", label: "What did they say? What have you tried?", placeholder: "Don't paste passwords, card numbers or personal data." },
    ],
  },
  {
    id: "spike", emoji: "🔬", name: "Research", blurb: "A time-boxed investigation before building",
    titlePrefix: "[Spike] ", labels: ["spike"], boardType: "Task", forEveryone: false,
    titleIdeas: ["Can we …?", "Compare … and …", "Is … feasible?"],
    questions: [
      { id: "question", heading: "The question to answer", kind: "text", label: "", required: true },
      { id: "timebox", heading: "Time box", kind: "choice", label: "Time box", required: true, default: "1 day",
        choices: ["Half a day", "1 day", "2 days", "1 week"].map((v) => ({ value: v, label: v })) },
      { id: "options", heading: "Options to compare", kind: "longtext", label: "Options to compare", template: "1. \n2. " },
      { id: "deliverable", heading: "Deliverable", kind: "multi", label: "What will you deliver?", required: true, default: ["Written recommendation"],
        choices: ["Written recommendation", "Architecture decision record (ADR)", "Prototype / proof of concept", "Follow-up issues created"].map((v) => ({ value: v, label: v })) },
      priorityQ,
    ],
  },
];

export type Answers = Record<string, string | string[]>;

export function defaultAnswers(t: TicketType): Answers {
  const a: Answers = {};
  for (const q of t.questions) {
    if ("default" in q && q.default !== undefined) a[q.id] = q.default;
    else if ("template" in q && q.template) a[q.id] = q.template;
    else a[q.id] = q.kind === "multi" ? [] : "";
  }
  return a;
}

// The first question with an empty label is the ticket's title.
export const titleQuestion = (t: TicketType) => t.questions.find((q) => q.kind !== "choice" && q.kind !== "multi" && q.label === "")!;

export function missingAnswers(t: TicketType, a: Answers): Question[] {
  return t.questions.filter((q) => {
    if (!q.required) return false;
    const v = a[q.id];
    if (Array.isArray(v)) return v.length === 0;
    const s = (v ?? "").trim();
    return !s || ("template" in q && q.template && s === q.template.trim());
  });
}

export function issueBody(t: TicketType, a: Answers, requestedBy?: string): string {
  const parts = t.questions.map((q) => {
    const v = a[q.id];
    const text = Array.isArray(v) ? v.join(", ") : (v ?? "").trim();
    const empty = !text || ("template" in q && q.template && text === q.template.trim());
    return `### ${q.heading}\n\n${empty ? "_No response_" : text}`;
  });
  if (requestedBy) parts.push(`---\n_Created in BeyondPM by @${requestedBy}_`);
  return parts.join("\n\n");
}

const slug = (s: string) => s.replace(/[^\p{L}\p{N}&/ -]/gu, "").trim().split(/\s*[/&]\s*|\s+—/)[0].trim().toLowerCase().replace(/\s+/g, "-");

// Same rules as .github/scripts/project-sync.cjs, so labels are right immediately.
export function labelsFor(t: TicketType, a: Answers): string[] {
  const labels = new Set(t.labels);
  const p = String(a.priority ?? "").match(/P[0-3]/);
  if (p) labels.add(`priority: ${p[0].toLowerCase()}`);
  for (const area of (a.areas as string[] | undefined) ?? []) if (!/not sure/i.test(area)) labels.add(`area: ${slug(area)}`);
  const size = String(a.size ?? "").match(/^(XS|S|M|L|XL)\b/);
  if (size) labels.add(`size: ${size[1].toLowerCase()}`);
  const sev = String(a.severity ?? a.sev ?? "").match(/^(SEV[1-3]|Blocker|Major|Minor|Cosmetic)/i);
  if (sev) labels.add(`severity: ${sev[1].toLowerCase()}`);
  const kind = String(a.kind ?? "").toLowerCase();
  const kindLabels: Record<string, string> = { "new idea": "enhancement", "looks or reads": "design", broken: "bug", customer: "support", question: "question" };
  for (const [needle, label] of Object.entries(kindLabels)) if (kind.includes(needle)) labels.add(label);
  return [...labels];
}

export const priorityWord = (a: Answers) => ["Critical", "High", "Medium", "Low"][Number(String(a.priority ?? "").match(/P([0-3])/)?.[1] ?? 2)];
export const sizeWord = (a: Answers) => String(a.size ?? "").match(/^(XS|S|M|L|XL)\b/)?.[1];
export const parentNumber = (a: Answers) => {
  const m = String(a.parent ?? "").match(/#?(\d+)/);
  return m ? Number(m[1]) : null;
};
