import assert from 'assert';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseForm, labelsFromAnswers, boardValues, linkedIssues, setFields } = require('../.github/scripts/project-sync.cjs');

// A body exactly as GitHub renders the "Ask for something" form.
const requestBody = `### What kind of request is this?

🐛 Something is broken

### In one sentence, what do you need?

Report download does nothing

### Priority

🟠 P1 — High: needed this sprint

### Areas affected

🌐 Web app,🔐 Login & accounts, 🤷 Not sure

### Tell us more (optional)

_No response_`;

const answers = parseForm(requestBody);
assert.equal(answers['Priority'], '🟠 P1 — High: needed this sprint');
assert.equal(answers['Tell us more (optional)'], undefined, 'empty answers are dropped');

assert.deepEqual([...labelsFromAnswers(answers)].sort(),
  ['area: login', 'area: web-app', 'bug', 'priority: p1']);

const featureLabels = labelsFromAnswers(parseForm(`### Priority\n\n🔴 P0 — Critical\n\n### Areas affected\n\n⚙️ API / backend, 🎨 Design system / UI\n\n### Size estimate\n\nXL — more than a week (should be split)`));
assert.deepEqual([...featureLabels].sort(), ['area: api', 'area: design-system', 'priority: p0', 'size: xl']);

const sev = labelsFromAnswers(parseForm('### Severity\n\nSEV2 — major feature down for many users'));
assert.ok(sev.has('severity: sev2'));
assert.equal(labelsFromAnswers(parseForm('just some text, not a form')).size, 0, 'non-form issues get no labels');
console.log('✅ form answers → labels');

assert.deepEqual(boardValues(['bug', 'priority: p1', 'area: api', 'size: s']),
  { Priority: 'High', 'Ticket Type': 'Bug', Size: 'S', Component: 'Backend' });
assert.equal(boardValues(['epic', 'feature'])['Ticket Type'], 'Epic', 'epic wins over other types');
assert.equal(boardValues(['incident'])['Ticket Type'], 'Bug');
assert.deepEqual(boardValues(['triage']), {}, 'unknown labels set nothing');
console.log('✅ labels → board values');

assert.deepEqual(linkedIssues('Fixes #12, closes #3 and refs: #7. Mentions #99 only.'), [12, 3, 7]);
assert.deepEqual(linkedIssues(''), []);
console.log('✅ PR description → linked issues');

// Option matching uses whole words, so "S" must not pick "XS".
const calls = [];
const graphql = async (_q, vars) => { calls.push(vars); return {}; };
const project = { id: 'P', fields: { nodes: [
  { id: 'F_SIZE', name: 'Size', options: [{ id: 'xs', name: 'XS' }, { id: 's', name: 'S' }, { id: 'm', name: 'M' }] },
  { id: 'F_STATUS', name: 'Status', options: [{ id: 'cr', name: '🔍 Code Review' }, { id: 'qa', name: '🧪 QA & Testing' }, { id: 'done', name: '✅ Done' }] },
] } };
await setFields(graphql, project, 'ITEM', { Size: 'S', Status: 'QA' });
assert.deepEqual(calls.map(c => c.o), ['s', 'qa']);
calls.length = 0;
await setFields(graphql, project, 'ITEM', { Status: 'Code', Priority: 'High' });
assert.deepEqual(calls.map(c => c.o), ['cr'], 'missing fields are skipped, not errors');
console.log('✅ board option matching');

// ── Parent links, follow-ups, duplicates ─────────────────────────────────
const { parentFromAnswers, followUpQuestions, similarity, currentSprint, healthActions, weeklyReport } =
  require('../.github/scripts/project-sync.cjs');

assert.equal(parentFromAnswers({ 'Parent issue': '#42' }), 42);
assert.equal(parentFromAnswers({ 'Parent epic (optional)': 'https://github.com/o/r/issues/7' }), 7);
assert.equal(parentFromAnswers({ 'Parent issue': 'the login epic' }), null);
assert.equal(parentFromAnswers({}), null);
console.log('✅ parent issue parsing');

assert.equal(followUpQuestions({}, ['priority: p0']).length, 1, 'critical without details asks what is stopped');
assert.equal(followUpQuestions({ 'Tell us more (optional)': 'All logins fail' }, ['priority: p0']).length, 0);
assert.ok(followUpQuestions({}, ['bug']).some(q => /screenshot/.test(q)));
assert.ok(followUpQuestions({ 'Who is affected?': 'Many customers' }, []).some(q => /date/.test(q)));
assert.ok(followUpQuestions({ 'Acceptance criteria': '- [ ] \n- [ ] ' }, ['feature']).some(q => /acceptance/.test(q)));
assert.equal(followUpQuestions({ 'Acceptance criteria': '- [ ] Export works' }, ['feature']).length, 0);
console.log('✅ follow-up questions');

assert.ok(similarity('[Bug] Report download does nothing', 'Monthly report download broken') >= 0.5);
assert.ok(similarity('[Bug] Report download does nothing', 'Add dark mode to settings') < 0.5);
assert.equal(similarity('[Bug]', 'anything'), 0);
console.log('✅ duplicate similarity');

// ── Board health and weekly report ───────────────────────────────────────
const iterations = [
  { id: 's1', title: 'Sprint 1', startDate: '2026-10-12', duration: 14 },
  { id: 's2', title: 'Sprint 2', startDate: '2026-10-26', duration: 14 },
];
assert.equal(currentSprint(iterations, '2026-10-25').id, 's1');
assert.equal(currentSprint(iterations, '2026-10-26').id, 's2');
assert.equal(currentSprint(iterations, '2026-12-01'), null);

const item = (o) => ({ number: 1, title: 't', url: 'u', state: 'OPEN', assignees: [], status: '📋 Todo', ...o });
const kinds = (items, opts) => healthActions(items, { today: '2026-10-27', iterations, ...opts }).map(a => a.kind);
assert.deepEqual(kinds([item({ state: 'CLOSED', status: '⚡ In Progress' })]), ['set-status']);
assert.deepEqual(kinds([item({ state: 'CLOSED', stateReason: 'NOT_PLANNED', status: '📋 Todo' })]), [], "won't-do tickets are left alone");
assert.deepEqual(kinds([item({ status: '✅ Done' })]), ['close']);
assert.deepEqual(kinds([item({ status: '⚡ In Progress' })]), ['flag']);
assert.deepEqual(kinds([item({ status: '⚡ In Progress', assignees: ['sam'] })]), []);
assert.deepEqual(kinds([item({ sprint: iterations[0] })]), ['set-sprint'], 'unfinished work rolls over');
assert.deepEqual(kinds([item({ sprint: iterations[0], status: '✅ Done', state: 'CLOSED' })]), []);
assert.deepEqual(kinds([item({ assignees: ['a'], status: 'Code Review' }), item({ number: 2, assignees: ['b'], status: 'Code Review' })], { wipLimits: { 'Code Review': 1 } }), ['wip']);
assert.deepEqual(kinds([{ id: 'draft', title: 'draft', assignees: [], status: '⚡ In Progress' }]), [], 'draft items are ignored');
console.log('✅ board health rules');

const report = weeklyReport([
  item({ number: 5, title: 'Export', sprint: iterations[1], points: 3, target: '2026-10-20', assignees: ['sam'], priority: '🔴 Critical' }),
  item({ number: 6, title: 'Login', sprint: iterations[1], points: 5, state: 'CLOSED', status: '✅ Done', closedAt: '2026-10-26T10:00:00Z' }),
], { today: '2026-10-27', iterations });
assert.match(report, /Sprint 2/);
assert.match(report, /1 of 2 tickets done \(50%\)/);
assert.match(report, /5 of 8 story points/);
assert.match(report, /Overdue \(1\)[\s\S]*#5/);
assert.match(report, /Finished this week \(1\)[\s\S]*#6/);
assert.match(report, /\| @sam \| 1 \| 3 \|/);
assert.match(report, /Open critical tickets \(1\)/);
console.log('✅ weekly report');
