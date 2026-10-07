import { execSync } from 'child_process';
import fs from 'fs';

const PROJECT_ID = 'PVT_kwDODvuHPc4BmFl9';

// Field IDs
const FIELD_PRIORITY = 'PVTSSF_lADODvuHPc4BmFl9zhkwEd0';
const FIELD_TYPE = 'PVTSSF_lADODvuHPc4BmFl9zhkwEfo';
const FIELD_COMPONENT = 'PVTSSF_lADODvuHPc4BmFl9zhkwEh0';
const FIELD_STORY_POINTS = 'PVTF_lADODvuHPc4BmFl9zhkwEiU';

// Option IDs
const OPT_CRITICAL = 'a5bf0d47';
const OPT_HIGH = '611b32ff';
const OPT_MEDIUM = '73bdc790';
const OPT_LOW = '8c5d9bd0';

const OPT_EPIC = 'e292c8df';
const OPT_FEATURE = '5b6143f8';
const OPT_TASK = '19143b1a';
const OPT_BUG = 'f5ee8ab1';

const OPT_DESIGN = 'fa6e603c';
const OPT_BACKEND = '57f6408c';
const OPT_DB = 'bb76961e';
const OPT_SECURITY = '45c3ee72';

const ITEMS = [
  {
    id: 'PVTI_lADODvuHPc4BmFl9zg_LsiY', // Issue 1 (PM-142 Bug)
    priority: OPT_CRITICAL,
    type: OPT_BUG,
    component: OPT_SECURITY,
    points: 5
  },
  {
    id: 'PVTI_lADODvuHPc4BmFl9zg_LskE', // Issue 2 (PM-145 Incident)
    priority: OPT_CRITICAL,
    type: OPT_EPIC,
    component: OPT_DB,
    points: 8
  },
  {
    id: 'PVTI_lADODvuHPc4BmFl9zg_LslM', // Issue 3 (PM-148 Feature)
    priority: OPT_HIGH,
    type: OPT_FEATURE,
    component: OPT_BACKEND,
    points: 13
  },
  {
    id: 'PVTI_lADODvuHPc4BmFl9zg_LsmU', // PR 4
    priority: OPT_CRITICAL,
    type: OPT_TASK,
    component: OPT_SECURITY,
    points: 3
  }
];

function updateSingleSelect(itemId, fieldId, optionId) {
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

function updateNumber(itemId, fieldId, num) {
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

console.log('Updating item custom field values on Project #34...');
for (const item of ITEMS) {
  console.log(`Updating item ${item.id}...`);
  if (item.priority) updateSingleSelect(item.id, FIELD_PRIORITY, item.priority);
  if (item.type) updateSingleSelect(item.id, FIELD_TYPE, item.type);
  if (item.component) updateSingleSelect(item.id, FIELD_COMPONENT, item.component);
  if (item.points) updateNumber(item.id, FIELD_STORY_POINTS, item.points);
}
console.log('Successfully updated custom field values on all items!');
