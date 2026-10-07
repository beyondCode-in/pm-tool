import { execSync } from 'child_process';
import fs from 'fs';

const PROJECT_ID = 'PVT_kwDODvuHPc4BmFl9';

function createView(name, layout) {
  const query = `
  mutation {
    createProjectV2View(input: {
      projectId: "${PROJECT_ID}"
      name: "${name}"
      layout: ${layout}
    }) {
      projectV2View {
        id
        name
        layout
      }
    }
  }
  `;
  fs.writeFileSync('scratch/gql_temp.json', JSON.stringify({ query }));
  try {
    const res = JSON.parse(execSync('gh api graphql --input scratch/gql_temp.json'));
    console.log(`Successfully created view '${name}':`, JSON.stringify(res.data.createProjectV2View.projectV2View));
  } catch (err) {
    console.error(`Failed to create view '${name}':`, err.stdout ? err.stdout.toString() : err.message);
  }
}

console.log('Creating Custom Project Views on Project #34 (pm-tool)...');
createView('📋 Kanban Board', 'BOARD_LAYOUT');
createView('📊 Backlog & Triage Table', 'TABLE_LAYOUT');
createView('🗺️ Strategic Roadmap', 'ROADMAP_LAYOUT');
createView('🔥 Priority Matrix', 'BOARD_LAYOUT');
createView('🧩 Component Breakdown', 'TABLE_LAYOUT');
