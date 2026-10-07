import assert from 'node:assert';
import test from 'node:test';

import { QueryEngine } from '../src/engine/QueryEngine.ts';
import { WorkflowEngine } from '../src/engine/WorkflowEngine.ts';
import { AutomationEngine } from '../src/engine/AutomationEngine.ts';
import { DependencyGraphEngine } from '../src/engine/DependencyGraphEngine.ts';
import { INITIAL_ISSUES } from '../src/constants/mockIssues.ts';
import { DEFAULT_WORKFLOW, DEFAULT_STATUSES, DEFAULT_USERS, DEFAULT_AUTOMATIONS } from '../src/constants/defaults.ts';

test('QueryEngine - Filter Issues by Type', () => {
  const bugIssues = QueryEngine.filterIssues(INITIAL_ISSUES, {
    operator: 'AND',
    conditions: [{ field: 'type', operator: '=', value: 'BUG' }]
  });
  assert.strictEqual(bugIssues.length, 1);
  assert.strictEqual(bugIssues[0].key, 'PM-142');
});

test('DependencyGraphEngine - Circular Dependency Cycle Detection', () => {
  const analysis = DependencyGraphEngine.analyzeDependencies(INITIAL_ISSUES);
  assert.strictEqual(analysis.hasCircularDependency, true);
  assert.ok(analysis.cycles.length > 0);
  console.log('✓ Circular dependency cycle detected:', analysis.cycles[0].description);
});

test('WorkflowEngine - Strict Transition Guardrails & Role Verification', () => {
  const backlogIssue = INITIAL_ISSUES[5]; // PM-160 in Backlog
  const developerUser = DEFAULT_USERS[2]; // David Miller (DEVELOPER)

  // DEVELOPER trying to select ticket for dev (t-1 requires PROJECT_MANAGER/PROJECT_ADMIN/ORG_OWNER)
  const result = WorkflowEngine.canTransition(
    backlogIssue,
    'status-selected',
    DEFAULT_WORKFLOW,
    developerUser,
    INITIAL_ISSUES,
    DEFAULT_STATUSES
  );

  assert.strictEqual(result.allowed, false);
  assert.ok(result.reason.includes('Transition restricted'));
  console.log('✓ Workflow role restriction passed:', result.reason);
});

test('AutomationEngine - Loop Recursion & Max Depth Protection', () => {
  const rule = DEFAULT_AUTOMATIONS[0];
  const issue = INITIAL_ISSUES[0];

  // Attempt trigger with depth 4 (Exceeds MAX_TRIGGER_DEPTH 3)
  const result = AutomationEngine.evaluateRule(
    rule,
    { type: 'PR_CREATED' },
    issue,
    4, // trigger depth 4
    false
  );

  assert.strictEqual(result.status, 'LOOP_PREVENTED');
  assert.ok(result.log.details.includes('Halted infinite automation cascade'));
  console.log('✓ Automation loop prevention passed:', result.log.details);
});
