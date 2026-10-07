import { execSync } from 'child_process';
import fs from 'fs';

const PARENT_ID = 'I_kwDOU_H2gM8AAAABViyAng'; // Issue #2
const CHILD_6 = 'I_kwDOU_H2gM8AAAABVp7vSw'; // Issue #6
const CHILD_7 = 'I_kwDOU_H2gM8AAAABVp74QQ'; // Issue #7

function addSubIssue(parentId, subIssueId) {
  const query = `
  mutation {
    addSubIssue(input: {
      issueId: "${parentId}"
      subIssueId: "${subIssueId}"
    }) {
      issue {
        id
        title
      }
      subIssue {
        id
        title
      }
    }
  }
  `;
  fs.writeFileSync('scratch/gql_temp.json', JSON.stringify({ query }));
  try {
    const res = JSON.parse(execSync('gh api graphql --input scratch/gql_temp.json'));
    console.log('Sub-issue linked:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Error linking sub-issue:', err.stdout ? err.stdout.toString() : err.message);
  }
}

console.log('Linking Issue #6 to Issue #2...');
addSubIssue(PARENT_ID, CHILD_6);

console.log('Linking Issue #7 to Issue #2...');
addSubIssue(PARENT_ID, CHILD_7);

console.log('Finished linking sub-issues!');
