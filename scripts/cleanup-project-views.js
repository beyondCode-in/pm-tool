import { execSync } from 'child_process';
import fs from 'fs';

const VIEW_1_ID = 'PVTV_lADODvuHPc4BmFl9zgL9Sio';

// 1. Delete default "View 1"
const deleteQuery = `
mutation {
  deleteProjectV2View(input: {
    viewId: "${VIEW_1_ID}"
  }) {
    projectV2View {
      id
    }
  }
}
`;

fs.writeFileSync('scratch/gql_temp.json', JSON.stringify({ query: deleteQuery }));
try {
  const res = JSON.parse(execSync('gh api graphql --input scratch/gql_temp.json'));
  console.log('Successfully deleted default View 1:', JSON.stringify(res, null, 2));
} catch (err) {
  console.log('Notice deleting View 1:', err.stdout ? err.stdout.toString() : err.message);
}
