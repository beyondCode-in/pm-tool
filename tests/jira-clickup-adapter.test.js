import { JiraClickUpEngine } from '../lib/jira-clickup-adapter.js';

function runTests() {
  console.log('Running Jira & ClickUp Engine Unit Tests...\n');
  const engine = new JiraClickUpEngine();

  // Test 1: Valid transition Backlog -> Selected for Dev
  const res1 = engine.validateTransition('Backlog', 'Selected for Dev', 'DEV');
  console.assert(res1.allowed === true, 'Test 1 Failed: Valid transition rejected');
  console.log('✅ Test 1 Passed: Valid status transition accepted');

  // Test 2: Invalid transition Backlog -> QA
  const res2 = engine.validateTransition('Backlog', 'QA & Testing', 'DEV');
  console.assert(res2.allowed === false, 'Test 2 Failed: Invalid transition allowed');
  console.log('✅ Test 2 Passed: Invalid status transition blocked');

  // Test 3: Require PR for Code Review
  const res3 = engine.validateTransition('In Progress', 'Code Review', 'DEV', false);
  console.assert(res3.allowed === false, 'Test 3 Failed: Missing PR transition allowed');
  console.log('✅ Test 3 Passed: Transition without linked PR blocked');

  // Test 4: Require QA role for Done / Released
  const res4 = engine.validateTransition('QA & Testing', 'Done / Released', 'DEV', true);
  console.assert(res4.allowed === false, 'Test 4 Failed: Non-QA role allowed to close ticket');
  console.log('✅ Test 4 Passed: Non-QA role blocked from closing ticket');

  // Test 5: WIP Limit breach detection
  const wipRes = engine.checkWipLimit('In Progress', 5);
  console.assert(wipRes.breached === true, 'Test 5 Failed: WIP limit breach not detected');
  console.log('✅ Test 5 Passed: Column WIP limit breach detected correctly');

  // Test 6: SLA remaining calculation for Critical priority
  const pastDate = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(); // 3 hours ago
  const slaRes = engine.calculateSlaRemaining(pastDate, '🔴 Critical');
  console.assert(slaRes.isBreached === true, 'Test 6 Failed: SLA breach not detected');
  console.log('✅ Test 6 Passed: Critical P1 SLA breach calculated correctly');

  // Test 7: Parent-child subtask tree construction
  const rawIssues = [
    { number: 2, title: 'Parent Epic' },
    { number: 6, title: 'Subtask A', parentId: 2 },
    { number: 7, title: 'Subtask B', parentId: 2 }
  ];
  const tree = engine.buildIssueTree(rawIssues);
  console.assert(tree.length === 1 && tree[0].children.length === 2, 'Test 7 Failed: Tree build failed');
  console.log('✅ Test 7 Passed: Parent-child subtask tree built correctly');

  console.log('\nAll 7 Jira & ClickUp Engine tests passed successfully!');
}

runTests();
