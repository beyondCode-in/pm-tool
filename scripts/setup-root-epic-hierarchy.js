import { execSync } from 'child_process';
import fs from 'fs';

const PROJECT_ID = 'PVT_kwDODvuHPc4BmFl9';

// 1. Get GraphQL IDs for issues 8, 1, 2, 3
const queryIssues = `
query {
  repository(owner: "beyondCode-in", name: "pm-tool") {
    issue8: issue(number: 8) { id title }
    issue1: issue(number: 1) { id title }
    issue2: issue(number: 2) { id title }
    issue3: issue(number: 3) { id title }
  }
}
`;
fs.writeFileSync('scratch/gql_temp.json', JSON.stringify({ query: queryIssues }));
const resIssues = JSON.parse(execSync('gh api graphql --input scratch/gql_temp.json'));
const ids = resIssues.data.repository;

console.log('Issue #8 ID:', ids.issue8.id);

// 2. Add sub-issues 1, 2, 3 to Epic 8
function addSubIssue(parentId, childId) {
  const query = `
  mutation {
    addSubIssue(input: {
      issueId: "${parentId}"
      subIssueId: "${childId}"
    }) {
      issue { id }
      subIssue { id }
    }
  }
  `;
  fs.writeFileSync('scratch/gql_temp.json', JSON.stringify({ query }));
  try {
    execSync('gh api graphql --input scratch/gql_temp.json');
    console.log(`Linked sub-issue ${childId} to parent ${parentId}`);
  } catch (e) {
    console.log(`Notice linking ${childId}:`, e.stdout ? e.stdout.toString() : e.message);
  }
}

addSubIssue(ids.issue8.id, ids.issue1.id);
addSubIssue(ids.issue8.id, ids.issue2.id);
addSubIssue(ids.issue8.id, ids.issue3.id);

// 3. Add Epic 8 to Project #34
const addProjectQuery = `
mutation {
  addProjectV2ItemById(input: {
    projectId: "${PROJECT_ID}"
    contentId: "${ids.issue8.id}"
  }) {
    item { id }
  }
}
`;
fs.writeFileSync('scratch/gql_temp.json', JSON.stringify({ query: addProjectQuery }));
const resAdd = JSON.parse(execSync('gh api graphql --input scratch/gql_temp.json'));
const projectItemId = resAdd.data.addProjectV2ItemById.item.id;
console.log('Added Epic #8 to Project #34 with item ID:', projectItemId);

// 4. Update custom fields on Epic #8
const FIELD_PRIORITY = 'PVTSSF_lADODvuHPc4BmFl9zhkwEd0';
const FIELD_TYPE = 'PVTSSF_lADODvuHPc4BmFl9zhkwEfo';
const FIELD_COMPONENT = 'PVTSSF_lADODvuHPc4BmFl9zhkwEh0';
const FIELD_STORY_POINTS = 'PVTF_lADODvuHPc4BmFl9zhkwEiU';

const OPT_CRITICAL = 'a5bf0d47';
const OPT_EPIC = 'e292c8df';
const OPT_OPS = '0b1332de';

function updateSingleSelect(fieldId, optionId) {
  const q = `
  mutation {
    updateProjectV2ItemFieldValue(input: {
      projectId: "${PROJECT_ID}"
      itemId: "${projectItemId}"
      fieldId: "${fieldId}"
      value: { singleSelectOptionId: "${optionId}" }
    }) { projectV2Item { id } }
  }`;
  fs.writeFileSync('scratch/gql_temp.json', JSON.stringify({ query: q }));
  execSync('gh api graphql --input scratch/gql_temp.json');
}

function updateNumber(fieldId, num) {
  const q = `
  mutation {
    updateProjectV2ItemFieldValue(input: {
      projectId: "${PROJECT_ID}"
      itemId: "${projectItemId}"
      fieldId: "${fieldId}"
      value: { number: ${num} }
    }) { projectV2Item { id } }
  }`;
  fs.writeFileSync('scratch/gql_temp.json', JSON.stringify({ query: q }));
  execSync('gh api graphql --input scratch/gql_temp.json');
}

updateSingleSelect(FIELD_PRIORITY, OPT_CRITICAL);
updateSingleSelect(FIELD_TYPE, OPT_EPIC);
updateSingleSelect(FIELD_COMPONENT, OPT_OPS);
updateNumber(FIELD_STORY_POINTS, 21);

console.log('Successfully configured Root Epic #8 hierarchy and custom fields!');
