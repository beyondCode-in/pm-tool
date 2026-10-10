// Shared helpers for the issue workflows: read issue-form answers and keep the
// project board's fields in step with them. Field and option IDs are looked up
// by name at run time, so renaming an option on the board doesn't need a code change
// as long as the option text still contains the words matched below.

const PROJECT = { owner: 'beyondCode-in', number: 34 };

// Issue forms render each answer as "### <field label>\n\n<answer>".
function parseForm(body = '') {
  const answers = {};
  for (const part of body.split(/^### /m).slice(1)) {
    const [heading, ...rest] = part.split('\n');
    const value = rest.join('\n').trim();
    if (value && value !== '_No response_') answers[heading.trim()] = value;
  }
  return answers;
}

const slug = (s) => s.replace(/[^\p{L}\p{N}&/ -]/gu, '').trim()
  .split(/\s*[/&]\s*|\s+—/)[0].trim().toLowerCase().replace(/\s+/g, '-');

// Labels the workflow owns. Anything else on the issue is left alone.
const OWNED = /^(priority|area|size|severity): /;

function labelsFromAnswers(a) {
  const labels = new Set();
  const priority = (a['Priority'] || '').match(/P[0-3]/);
  if (priority) labels.add(`priority: ${priority[0].toLowerCase()}`);
  for (const area of (a['Areas affected'] || '').split(',').map(s => s.trim()).filter(Boolean)) {
    if (!/not sure/i.test(area)) labels.add(`area: ${slug(area)}`);
  }
  const size = (a['Size estimate'] || '').match(/^(XS|S|M|L|XL)\b/);
  if (size) labels.add(`size: ${size[1].toLowerCase()}`);
  const severity = (a['Severity'] || '').match(/^(SEV[1-3]|Blocker|Major|Minor|Cosmetic)/i);
  if (severity) labels.add(`severity: ${severity[1].toLowerCase()}`);
  const type = (a['What kind of request is this?'] || '').toLowerCase();
  const typeLabels = { 'new idea': 'enhancement', 'looks or reads': 'design', 'broken': 'bug', 'customer': 'support', 'question': 'question' };
  for (const [needle, label] of Object.entries(typeLabels)) if (type.includes(needle)) labels.add(label);
  return labels;
}

// Board field values, as words to look for inside the board's option names.
function boardValues(labels) {
  const has = (l) => labels.includes(l);
  const v = {};
  const p = labels.find(l => /^priority: p[0-3]$/.test(l));
  if (p) v['Priority'] = ['Critical', 'High', 'Medium', 'Low'][Number(p.at(-1))];
  if (has('epic')) v['Ticket Type'] = 'Epic';
  else if (has('bug') || has('incident')) v['Ticket Type'] = 'Bug';
  else if (has('support')) v['Ticket Type'] = 'Support';
  else if (has('question')) v['Ticket Type'] = 'Question';
  else if (has('feature') || has('enhancement') || has('design')) v['Ticket Type'] = 'Feature';
  else if (has('task') || has('spike')) v['Ticket Type'] = 'Task';
  const size = labels.find(l => l.startsWith('size: '));
  if (size) v['Size'] = size.slice(6).toUpperCase();
  const componentFor = { 'design-system': 'UI/UX', 'web-app': 'UI/UX', 'api': 'Backend', 'database': 'Database',
    'login': 'Security', 'docs': 'Documentation', 'infrastructure': 'Ops' };
  for (const l of labels) {
    const c = componentFor[l.replace('area: ', '')];
    if (l.startsWith('area: ') && c) { v['Component'] = c; break; }
  }
  return v;
}

async function loadProject(graphql) {
  const { organization } = await graphql(`query($owner: String!, $number: Int!) {
    organization(login: $owner) { projectV2(number: $number) { id
      fields(first: 50) { nodes { ... on ProjectV2FieldCommon { id name }
        ... on ProjectV2SingleSelectField { options { id name } } } } } } }`, PROJECT);
  return organization.projectV2;
}

async function addItem(graphql, projectId, contentId) {
  const r = await graphql(`mutation($p: ID!, $c: ID!) { addProjectV2ItemById(input: {projectId: $p, contentId: $c}) { item { id } } }`,
    { p: projectId, c: contentId });
  return r.addProjectV2ItemById.item.id;
}

// Sets single-select fields by finding `word` among the option name's words ("High" matches "🟠 High").
async function setFields(graphql, project, itemId, values, log = () => {}) {
  for (const [fieldName, word] of Object.entries(values)) {
    const field = project.fields.nodes.find(f => f.name === fieldName);
    // Whole-word match, so "S" doesn't match "XS".
    const option = field?.options?.find(o => o.name.toLowerCase().split(/[^\p{L}\p{N}/]+/u).includes(word.toLowerCase()));
    if (!option) { log(`skip ${fieldName}=${word} (no matching field or option on the board)`); continue; }
    await graphql(`mutation($p: ID!, $i: ID!, $f: ID!, $o: String!) {
      updateProjectV2ItemFieldValue(input: {projectId: $p, itemId: $i, fieldId: $f, value: {singleSelectOptionId: $o}}) { clientMutationId } }`,
      { p: project.id, i: itemId, f: field.id, o: option.id });
    log(`set ${fieldName} = ${option.name}`);
  }
}

// "Fixes #12", "closes #3", "refs #7" in a pull request body.
const linkedIssues = (body = '') =>
  [...new Set([...body.matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?|refs?)\s*:?\s+#(\d+)/gi)].map(m => Number(m[1])))];

// "#42" (or a full issue URL) in the form's parent field.
function parentFromAnswers(a) {
  const v = a['Parent issue'] || a['Parent epic (optional)'] || '';
  const m = v.match(/(?:^|\s|issues\/)#?(\d+)\b/);
  return m ? Number(m[1]) : null;
}

// Questions worth asking once, right after a ticket is opened, when an
// important answer is missing. Plain language: requesters read these.
function followUpQuestions(a, labels) {
  const q = [];
  const has = (l) => labels.includes(l);
  const urgent = has('priority: p0') || has('incident');
  if (urgent && !a['Tell us more (optional)'] && !a["What are you seeing?"] && !a['Steps to reproduce'])
    q.push('This is marked critical. What exactly is stopped, and roughly how many people are affected?');
  if (has('bug') && !a['Screenshots, recordings or logs'] && !a['Tell us more (optional)'])
    q.push('Could you add a screenshot or a short screen recording? Drag it into a comment.');
  if (a['Who is affected?'] && /customer/i.test(a['Who is affected?']) && !a['Is there a deadline? (optional)'])
    q.push('Customers are affected. Is there a date by which this needs to be fixed?');
  if (has('feature') && /^- \[ \]\s*$/m.test(a['Acceptance criteria'] || ''))
    q.push('The acceptance criteria are still empty. How will we know this is done?');
  return q;
}

// Rough title similarity for duplicate hints: shared meaningful words.
const STOP = new Set('a an the to of for in on and or is it be can cant not does do with when my our we i at by from this that add'.split(' '));
const words = (s) => new Set(s.toLowerCase().replace(/\[[^\]]*\]/g, ' ').match(/[\p{L}\p{N}]{3,}/gu)?.filter(w => !STOP.has(w)) || []);
function similarity(a, b) {
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return shared / Math.min(A.size, B.size);
}

// ── Board model ─────────────────────────────────────────────────────────
// Items as loaded by loadItems(): { id, number, title, url, state, assignees,
// status, priority, type, points, target, sprint: { id, title, startDate, duration } }

const DONE = (s) => /done/i.test(s || '');
const addDays = (iso, n) => new Date(Date.parse(iso) + n * 864e5).toISOString().slice(0, 10);

function currentSprint(iterations, today) {
  return iterations.find(it => it.startDate <= today && today < addDays(it.startDate, it.duration)) || null;
}

// What the board-health job should change or report. Pure, so it's testable.
function healthActions(items, { today, iterations = [], wipLimits = {} }) {
  const actions = [];
  const issues = items.filter(i => i.number);
  for (const i of issues) {
    if (i.state === 'CLOSED' && !DONE(i.status) && i.stateReason !== 'NOT_PLANNED')
      actions.push({ kind: 'set-status', item: i, value: 'Done', why: 'issue is closed' });
    if (i.state === 'OPEN' && DONE(i.status))
      actions.push({ kind: 'close', item: i, why: 'card is in Done' });
    if (i.state === 'OPEN' && /progress|review|qa/i.test(i.status || '') && !i.assignees.length)
      actions.push({ kind: 'flag', item: i, why: `in ${i.status} with nobody assigned` });
  }
  // Unfinished work in a finished sprint rolls into the current sprint.
  const now = currentSprint(iterations, today);
  if (now) for (const i of issues) {
    if (i.sprint && i.sprint.id !== now.id && addDays(i.sprint.startDate, i.sprint.duration) <= today
        && i.state === 'OPEN' && !DONE(i.status))
      actions.push({ kind: 'set-sprint', item: i, value: now, why: `carried over from ${i.sprint.title}` });
  }
  for (const [status, limit] of Object.entries(wipLimits)) {
    const n = issues.filter(i => i.state === 'OPEN' && (i.status || '').includes(status)).length;
    if (n > limit) actions.push({ kind: 'wip', status, count: n, limit, why: `${n} cards in ${status} (limit ${limit})` });
  }
  return actions;
}

function weeklyReport(items, { today, iterations = [] }) {
  const issues = items.filter(i => i.number);
  const open = issues.filter(i => i.state === 'OPEN');
  const weekAgo = addDays(today, -7);
  const doneThisWeek = issues.filter(i => i.closedAt && i.closedAt.slice(0, 10) > weekAgo && i.stateReason !== 'NOT_PLANNED');
  const overdue = open.filter(i => i.target && i.target < today);
  const sprint = currentSprint(iterations, today);
  const link = (i) => `[#${i.number}](${i.url}) ${i.title}`;
  const out = [`## Weekly report · ${today}`, ''];

  if (sprint) {
    const inSprint = issues.filter(i => i.sprint?.id === sprint.id);
    const pts = (xs) => xs.reduce((s, i) => s + (i.points || 0), 0);
    const done = inSprint.filter(i => DONE(i.status) || i.state === 'CLOSED');
    const end = addDays(sprint.startDate, sprint.duration - 1);
    const pct = inSprint.length ? Math.round(done.length / inSprint.length * 100) : 0;
    out.push(`### 🏃 ${sprint.title} (${sprint.startDate} → ${end})`,
      `**${done.length} of ${inSprint.length} tickets done (${pct}%)** · ${pts(done)} of ${pts(inSprint)} story points`, '');
  }

  out.push(`### ✅ Finished this week (${doneThisWeek.length})`, ...(doneThisWeek.length ? doneThisWeek.map(i => `- ${link(i)}`) : ['_Nothing closed this week._']), '');
  out.push(`### ⏰ Overdue (${overdue.length})`, ...(overdue.length ? overdue.map(i => `- ${link(i)} · due ${i.target}${i.assignees.length ? ` · @${i.assignees.join(', @')}` : ' · **unassigned**'}`) : ['_Nothing overdue._']), '');

  const byStatus = {};
  for (const i of open) byStatus[i.status || 'No status'] = (byStatus[i.status || 'No status'] || 0) + 1;
  out.push('### 📊 Open work by status', '| Status | Tickets |', '|---|---|', ...Object.entries(byStatus).map(([s, n]) => `| ${s} | ${n} |`), '');

  const load = {};
  for (const i of open) for (const a of (i.assignees.length ? i.assignees : ['(unassigned)'])) {
    load[a] ??= { n: 0, pts: 0 }; load[a].n++; load[a].pts += i.points || 0;
  }
  out.push('### 👥 Workload', '| Person | Open tickets | Story points |', '|---|---|---|',
    ...Object.entries(load).sort((x, y) => y[1].pts - x[1].pts).map(([a, v]) => `| ${a === '(unassigned)' ? a : '@' + a} | ${v.n} | ${v.pts} |`), '');

  const p0 = open.filter(i => /critical/i.test(i.priority || ''));
  if (p0.length) out.push(`### 🔴 Open critical tickets (${p0.length})`, ...p0.map(i => `- ${link(i)}`), '');
  return out.join('\n');
}

async function loadItems(graphql) {
  const items = [];
  let after = null, iterations = [];
  do {
    const { organization } = await graphql(`query($owner: String!, $number: Int!, $after: String) {
      organization(login: $owner) { projectV2(number: $number) {
        field(name: "Sprint") { ... on ProjectV2IterationField { id configuration {
          iterations { id title startDate duration } completedIterations { id title startDate duration } } } }
        items(first: 100, after: $after) { pageInfo { hasNextPage endCursor } nodes { id
          content { ... on Issue { number title url state stateReason closedAt assignees(first: 10) { nodes { login } } } }
          status: fieldValueByName(name: "Status") { ... on ProjectV2ItemFieldSingleSelectValue { name } }
          priority: fieldValueByName(name: "Priority") { ... on ProjectV2ItemFieldSingleSelectValue { name } }
          type: fieldValueByName(name: "Ticket Type") { ... on ProjectV2ItemFieldSingleSelectValue { name } }
          points: fieldValueByName(name: "Story Points") { ... on ProjectV2ItemFieldNumberValue { number } }
          target: fieldValueByName(name: "Target date") { ... on ProjectV2ItemFieldDateValue { date } }
          sprint: fieldValueByName(name: "Sprint") { ... on ProjectV2ItemFieldIterationValue { iterationId title startDate duration } }
        } } } } }`, { ...PROJECT, after });
    const p = organization.projectV2;
    const cfg = p.field?.configuration;
    if (cfg) iterations = [...cfg.completedIterations, ...cfg.iterations];
    for (const n of p.items.nodes) {
      const c = n.content || {};
      items.push({ id: n.id, number: c.number, title: c.title, url: c.url, state: c.state, stateReason: c.stateReason,
        closedAt: c.closedAt, assignees: (c.assignees?.nodes || []).map(a => a.login),
        status: n.status?.name, priority: n.priority?.name, type: n.type?.name, points: n.points?.number,
        target: n.target?.date, sprint: n.sprint && { id: n.sprint.iterationId, title: n.sprint.title, startDate: n.sprint.startDate, duration: n.sprint.duration },
        sprintFieldId: p.field?.id });
    }
    after = p.items.pageInfo.hasNextPage ? p.items.pageInfo.endCursor : null;
  } while (after);
  return { items, iterations };
}

module.exports = { PROJECT, OWNED, parseForm, labelsFromAnswers, boardValues, loadProject, addItem, setFields, linkedIssues,
  parentFromAnswers, followUpQuestions, similarity, currentSprint, healthActions, weeklyReport, loadItems };
