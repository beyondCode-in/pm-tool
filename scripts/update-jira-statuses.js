import { execSync } from 'child_process';
import fs from 'fs';

const STATUS_FIELD_ID = 'PVTSSF_lADODvuHPc4BmFl9zhkv9Rc';

const updateStatusQuery = `
mutation {
  updateProjectV2Field(input: {
    fieldId: "${STATUS_FIELD_ID}"
    singleSelectOptions: [
      { name: "📥 Backlog", color: GRAY, description: "Unscheduled items in product backlog" }
      { name: "📋 Todo", color: BLUE, description: "Selected for current sprint" }
      { name: "⚡ In Progress", color: PURPLE, description: "Actively being worked on" }
      { name: "🔍 Code Review", color: YELLOW, description: "Pull request submitted for review" }
      { name: "🧪 QA & Testing", color: ORANGE, description: "Verification & testing in progress" }
      { name: "✅ Done", color: GREEN, description: "Completed & released to production" }
    ]
  }) {
    projectV2Field {
      ... on ProjectV2SingleSelectField {
        id
        name
        options {
          id
          name
        }
      }
    }
  }
}
`;

fs.writeFileSync('scratch/gql_temp.json', JSON.stringify({ query: updateStatusQuery }));
try {
  const res = JSON.parse(execSync('gh api graphql --input scratch/gql_temp.json'));
  console.log('Successfully updated Status field options on Project #34:', JSON.stringify(res, null, 2));
} catch (err) {
  console.error('Error updating Status field:', err.stdout ? err.stdout.toString() : err.message);
}
