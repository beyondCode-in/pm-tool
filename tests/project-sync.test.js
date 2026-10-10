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
