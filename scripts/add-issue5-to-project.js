import { execSync } from 'child_process';
import fs from 'fs';

const PROJECT_ID = 'PVT_kwDODvuHPc4BmFl9';

// 1. Get Issue 5 node ID
const issueQuery = `
query {
  repository(owner: "beyondCode-in", name: "pm-tool") {
    issue(number: 5) {
      id
      title
    }
  }
}
`;
fs.writeFileSync('scratch/gql_temp.json', JSON.stringify({ query: issueQuery }));
const resIssue = JSON.parse(execSync('gh api graphql --input scratch/gql_temp.json'));
const issueId = resIssue.data.repository.issue.id;
console.log('Issue #5 ID:', issueId);

// 2. Add Issue 5 to Project #34
const addQuery = `
mutation {
  addProjectV2ItemById(input: {
    projectId: "${PROJECT_ID}"
    contentId: "${issueId}"
  }) {
    item { id }
  }
}
`;
fs.writeFileSync('scratch/gql_temp.json', JSON.stringify({ query: addQuery }));
const resAdd = JSON.parse(execSync('gh api graphql --input scratch/gql_temp.json'));
const itemId = resAdd.data.addProjectV2ItemById.item.id;
console.log('Added Project Item ID:', itemId);

// 3. Set field values
const FIELD_PRIORITY = 'PVTSSF_lADODvuHPc4BmFl9zhkwEd0';
const FIELD_TYPE = 'PVTSSF_lADODvuHPc4BmFl9zhkwEfo';
const FIELD_COMPONENT = 'PVTSSF_lADODvuHPc4BmFl9zhkwEh0';
const FIELD_STORY_POINTS = 'PVTF_lADODvuHPc4BmFl9zhkwEiU';

const OPT_HIGH = '611b32ff';
const OPT_FEATURE = '5b6143f8';
const OPT_DESIGN = 'fa6e603c';

function updateSingleSelect(fieldId, optionId) {
  const query = `
  mutation {
    updateProjectV2ItemFieldValue(input: {
      projectId: "${PROJECT_ID}"
      itemId: "${itemId}"
      fieldId: "${fieldId}"
      value: { singleSelectOptionId: "${optionId}" }
    }) {
      projectV2Item { id }
    }
  }`;
  fs.writeFileSync('scratch/gql_temp.json', JSON.stringify({ query }));
  execSync('gh api graphql --input scratch/gql_temp.json');
}

function updateNumber(fieldId, num) {
  const query = `
  mutation {
    updateProjectV2ItemFieldValue(input: {
      projectId: "${PROJECT_ID}"
      itemId: "${itemId}"
      fieldId: "${fieldId}"
      value: { number: ${num} }
    }) {
      projectV2Item { id }
    }
  }`;
  fs.writeFileSync('scratch/gql_temp.json', JSON.stringify({ query }));
  execSync('gh api graphql --input scratch/gql_temp.json');
}

updateSingleSelect(FIELD_PRIORITY, OPT_HIGH);
updateSingleSelect(FIELD_TYPE, OPT_FEATURE);
updateSingleSelect(FIELD_COMPONENT, OPT_DESIGN);
updateNumber(FIELD_STORY_POINTS, 3);

console.log('Successfully added Issue #5 to Project #34 and updated Jira fields!');
