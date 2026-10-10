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

module.exports = { PROJECT, OWNED, parseForm, labelsFromAnswers, boardValues, loadProject, addItem, setFields, linkedIssues };
