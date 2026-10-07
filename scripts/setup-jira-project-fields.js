import { execSync } from 'child_process';
import fs from 'fs';

const PROJECT_ID = 'PVT_kwDODvuHPc4BmFl9';

function runGraphQL(query, variables = {}) {
  const payload = JSON.stringify({ query, variables });
  const tmpFile = 'scratch/gql_temp.json';
  fs.writeFileSync(tmpFile, payload);
  try {
    const res = execSync(`gh api graphql --input ${tmpFile}`, { encoding: 'utf-8' });
    return JSON.parse(res);
  } catch (err) {
    console.error('GraphQL Error:', err.stdout || err.message);
    throw err;
  }
}

// 1. Create Priority SingleSelect field
const createPriorityQuery = `
mutation {
  createProjectV2Field(input: {
    projectId: "${PROJECT_ID}"
    dataType: SINGLE_SELECT
    name: "Priority"
    singleSelectOptions: [
      { name: "🔴 Critical", color: RED, description: "System down or urgent blocker" }
      { name: "🟠 High", color: ORANGE, description: "Major impact, high priority" }
      { name: "🟡 Medium", color: YELLOW, description: "Standard feature or issue" }
      { name: "🔵 Low", color: BLUE, description: "Nice to have, low impact" }
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

// 2. Create Issue Type SingleSelect field
const createTypeQuery = `
mutation {
  createProjectV2Field(input: {
    projectId: "${PROJECT_ID}"
    dataType: SINGLE_SELECT
    name: "Ticket Type"
    singleSelectOptions: [
      { name: "⚡ Epic", color: PURPLE, description: "Large theme or multi-sprint goal" }
      { name: "✨ Feature", color: GREEN, description: "New functionality or capability" }
      { name: "📝 Task", color: BLUE, description: "Standard work item" }
      { name: "🐛 Bug", color: RED, description: "Defect or unexpected behavior" }
      { name: "🎧 Support", color: ORANGE, description: "User assistance or request" }
      { name: "❓ Question", color: GRAY, description: "Inquiry or investigation" }
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

// 3. Create Component SingleSelect field
const createComponentQuery = `
mutation {
  createProjectV2Field(input: {
    projectId: "${PROJECT_ID}"
    dataType: SINGLE_SELECT
    name: "Component"
    singleSelectOptions: [
      { name: "🎨 UI/UX Design", color: PINK, description: "Interface & user experience" }
      { name: "⚙️ Backend API", color: BLUE, description: "Server logic & APIs" }
      { name: "🗄️ Database", color: PURPLE, description: "Schemas & queries" }
      { name: "🔒 Security", color: RED, description: "Auth & permissions" }
      { name: "📚 Documentation", color: GREEN, description: "Guides & docs" }
      { name: "🚀 Ops / Infrastructure", color: ORANGE, description: "Deployment & CI/CD" }
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

// 4. Create Story Points Number field
const createEstimateQuery = `
mutation {
  createProjectV2Field(input: {
    projectId: "${PROJECT_ID}"
    dataType: NUMBER
    name: "Story Points"
  }) {
    projectV2Field {
      ... on ProjectV2Field {
        id
        name
      }
    }
  }
}
`;

async function main() {
  console.log('Creating Custom Fields on Project #34 (pm-tool)...');
  
  try {
    const resPriority = runGraphQL(createPriorityQuery);
    console.log('Created Priority field:', JSON.stringify(resPriority, null, 2));
  } catch(e) { console.log('Priority field error/exists'); }

  try {
    const resType = runGraphQL(createTypeQuery);
    console.log('Created Ticket Type field:', JSON.stringify(resType, null, 2));
  } catch(e) { console.log('Type field error/exists'); }

  try {
    const resComp = runGraphQL(createComponentQuery);
    console.log('Created Component field:', JSON.stringify(resComp, null, 2));
  } catch(e) { console.log('Component field error/exists'); }

  try {
    const resEst = runGraphQL(createEstimateQuery);
    console.log('Created Story Points field:', JSON.stringify(resEst, null, 2));
  } catch(e) { console.log('Story Points field error/exists'); }

  console.log('Finished setting up custom fields!');
}

main();
