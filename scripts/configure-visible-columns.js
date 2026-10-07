import { execSync } from 'child_process';
import fs from 'fs';

const ALL_VISIBLE_FIELDS = [
  "PVTF_lADODvuHPc4BmFl9zhkv9RU",  // Title
  "PVTSSF_lADODvuHPc4BmFl9zhkwEfo", // Ticket Type
  "PVTSSF_lADODvuHPc4BmFl9zhkv9Rc", // Status
  "PVTSSF_lADODvuHPc4BmFl9zhkwEd0", // Priority
  "PVTF_lADODvuHPc4BmFl9zhkwEiU",  // Story Points
  "PVTSSF_lADODvuHPc4BmFl9zhkwEh0", // Component
  "PVTF_lADODvuHPc4BmFl9zhkv9R4",  // Parent issue
  "PVTF_lADODvuHPc4BmFl9zhkv9R8",  // Sub-issues progress
  "PVTF_lADODvuHPc4BmFl9zhkv9Rk",  // Linked pull requests
  "PVTF_lADODvuHPc4BmFl9zhkv9RY"   // Assignees
];

const VIEWS = [
  { id: 'PVTV_lADODvuHPc4BmFl9zgL9VpE', name: '🌳 Tree & Hierarchy Directory' },
  { id: 'PVTV_lADODvuHPc4BmFl9zgL9UAk', name: '📊 Backlog & Triage Table' },
  { id: 'PVTV_lADODvuHPc4BmFl9zgL9UA4', name: '🧩 Component Breakdown' },
  { id: 'PVTV_lADODvuHPc4BmFl9zgL9UAg', name: '📋 Kanban Board' },
  { id: 'PVTV_lADODvuHPc4BmFl9zgL9UAw', name: '🔥 Priority Matrix' }
];

function updateView(viewId, name) {
  const query = `
  mutation {
    updateProjectV2View(input: {
      viewId: "${viewId}"
      configuration: {
        visibleFieldIds: ${JSON.stringify(ALL_VISIBLE_FIELDS)}
      }
    }) {
      projectV2View {
        id
        name
      }
    }
  }
  `;
  fs.writeFileSync('scratch/gql_temp.json', JSON.stringify({ query }));
  try {
    const res = JSON.parse(execSync('gh api graphql --input scratch/gql_temp.json'));
    console.log(`Updated visible fields for '${name}':`, JSON.stringify(res, null, 2));
  } catch (err) {
    console.error(`Error updating '${name}':`, err.stdout ? err.stdout.toString() : err.message);
  }
}

for (const v of VIEWS) {
  updateView(v.id, v.name);
}
console.log('Finished updating visible fields across all views!');
