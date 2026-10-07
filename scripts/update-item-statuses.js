import { execSync } from 'child_process';
import fs from 'fs';

const PROJECT_ID = 'PVT_kwDODvuHPc4BmFl9';
const STATUS_FIELD_ID = 'PVTSSF_lADODvuHPc4BmFl9zhkv9Rc';

// Option IDs
const OPT_BACKLOG = 'e3adb82b';
const OPT_TODO = '6835b991';
const OPT_IN_PROGRESS = '7411033e';
const OPT_CODE_REVIEW = 'd1225887';
const OPT_QA = '8c4d9fc5';
const OPT_DONE = '0d2c7b66';

// Item IDs
const ITEMS = [
  { id: 'PVTI_lADODvuHPc4BmFl9zg_MXDU', status: OPT_IN_PROGRESS }, // Issue 8 (Root Epic)
  { id: 'PVTI_lADODvuHPc4BmFl9zg_LskE', status: OPT_IN_PROGRESS }, // Issue 2 (Incident)
  { id: 'PVTI_lADODvuHPc4BmFl9zg_MCZ4', status: OPT_IN_PROGRESS }, // Issue 6 (Subtask A)
  { id: 'PVTI_lADODvuHPc4BmFl9zg_MCeY', status: OPT_DONE },        // Issue 7 (Subtask B)
  { id: 'PVTI_lADODvuHPc4BmFl9zg_LsiY', status: OPT_CODE_REVIEW }, // Issue 1 (Bug)
  { id: 'PVTI_lADODvuHPc4BmFl9zg_LsmU', status: OPT_CODE_REVIEW }, // PR 4
  { id: 'PVTI_lADODvuHPc4BmFl9zg_LslM', status: OPT_TODO },        // Issue 3 (Feature)
  { id: 'PVTI_lADODvuHPc4BmFl9zg_L7Ec', status: OPT_BACKLOG }      // Issue 5 (Request)
];

function updateStatus(itemId, optionId) {
  const query = `
  mutation {
    updateProjectV2ItemFieldValue(input: {
      projectId: "${PROJECT_ID}"
      itemId: "${itemId}"
      fieldId: "${STATUS_FIELD_ID}"
      value: { singleSelectOptionId: "${optionId}" }
    }) {
      projectV2Item { id }
    }
  }
  `;
  fs.writeFileSync('scratch/gql_temp.json', JSON.stringify({ query }));
  execSync('gh api graphql --input scratch/gql_temp.json');
}

console.log('Distributing tickets across Jira Kanban columns on Project #34...');
for (const item of ITEMS) {
  updateStatus(item.id, item.status);
}
console.log('Finished updating statuses on Project #34!');
