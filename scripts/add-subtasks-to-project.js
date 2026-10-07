import { execSync } from 'child_process';
import fs from 'fs';

const PROJECT_ID = 'PVT_kwDODvuHPc4BmFl9';

async function addIssue(issueNumber, priorityOpt, typeOpt, compOpt, points) {
  const issueQuery = `
  query {
    repository(owner: "beyondCode-in", name: "pm-tool") {
      issue(number: ${issueNumber}) {
        id
        title
      }
    }
  }
  `;
  fs.writeFileSync('scratch/gql_temp.json', JSON.stringify({ query: issueQuery }));
  const resIssue = JSON.parse(execSync('gh api graphql --input scratch/gql_temp.json'));
  const issueId = resIssue.data.repository.issue.id;

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
  console.log(`Added Issue #${issueNumber} as Item ${itemId}`);

  const FIELD_PRIORITY = 'PVTSSF_lADODvuHPc4BmFl9zhkwEd0';
  const FIELD_TYPE = 'PVTSSF_lADODvuHPc4BmFl9zhkwEfo';
  const FIELD_COMPONENT = 'PVTSSF_lADODvuHPc4BmFl9zhkwEh0';
  const FIELD_STORY_POINTS = 'PVTF_lADODvuHPc4BmFl9zhkwEiU';

  const updateSingleSelect = (fieldId, optionId) => {
    const q = `
    mutation {
      updateProjectV2ItemFieldValue(input: {
        projectId: "${PROJECT_ID}"
        itemId: "${itemId}"
        fieldId: "${fieldId}"
        value: { singleSelectOptionId: "${optionId}" }
      }) { projectV2Item { id } }
    }`;
    fs.writeFileSync('scratch/gql_temp.json', JSON.stringify({ query: q }));
    execSync('gh api graphql --input scratch/gql_temp.json');
  };

  const updateNumber = (fieldId, num) => {
    const q = `
    mutation {
      updateProjectV2ItemFieldValue(input: {
        projectId: "${PROJECT_ID}"
        itemId: "${itemId}"
        fieldId: "${fieldId}"
        value: { number: ${num} }
      }) { projectV2Item { id } }
    }`;
    fs.writeFileSync('scratch/gql_temp.json', JSON.stringify({ query: q }));
    execSync('gh api graphql --input scratch/gql_temp.json');
  };

  updateSingleSelect(FIELD_PRIORITY, priorityOpt);
  updateSingleSelect(FIELD_TYPE, typeOpt);
  updateSingleSelect(FIELD_COMPONENT, compOpt);
  updateNumber(FIELD_STORY_POINTS, points);
}

const OPT_HIGH = '611b32ff';
const OPT_MEDIUM = '73bdc790';
const OPT_TASK = '19143b1a';
const OPT_DB = 'bb76961e';
const OPT_OPS = '0b1332de';

await addIssue(6, OPT_HIGH, OPT_TASK, OPT_DB, 2);
await addIssue(7, OPT_MEDIUM, OPT_TASK, OPT_OPS, 1);
console.log('Finished adding subtasks #6 and #7!');
