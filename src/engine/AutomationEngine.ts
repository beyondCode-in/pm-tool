import { Issue, AutomationRule, AutomationExecutionLog } from '../types/index.ts';

export interface AutomationExecutionResult {
  ruleId: string;
  ruleName: string;
  status: 'SUCCESS' | 'FAILED' | 'LOOP_PREVENTED' | 'DRY_RUN';
  mutatedIssue?: Issue;
  log: AutomationExecutionLog;
}

export class AutomationEngine {
  private static MAX_TRIGGER_DEPTH = 3;
  private static recentExecutionKeys = new Set<string>();

  static evaluateRule(
    rule: AutomationRule,
    event: { type: string; payload?: any },
    issue: Issue,
    currentDepth: number = 1,
    isDryRun: boolean = false
  ): AutomationExecutionResult | null {
    if (!rule.isEnabled && !isDryRun) return null;

    if (rule.trigger.type !== event.type) return null;

    const idempotencyKey = `${rule.id}:${issue.id}:${event.type}:${Math.floor(Date.now() / 30000)}`;

    if (currentDepth > this.MAX_TRIGGER_DEPTH) {
      const log: AutomationExecutionLog = {
        id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        automationId: rule.id,
        automationName: rule.name,
        issueKey: issue.key,
        executedAt: new Date().toISOString(),
        status: 'LOOP_PREVENTED',
        triggerDepth: currentDepth,
        idempotencyKey,
        details: `Halted infinite automation cascade! Current trigger depth (${currentDepth}) exceeds maximum depth limit (${this.MAX_TRIGGER_DEPTH}).`
      };
      return { ruleId: rule.id, ruleName: rule.name, status: 'LOOP_PREVENTED', log };
    }

    if (this.recentExecutionKeys.has(idempotencyKey) && !isDryRun) {
      const log: AutomationExecutionLog = {
        id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        automationId: rule.id,
        automationName: rule.name,
        issueKey: issue.key,
        executedAt: new Date().toISOString(),
        status: 'LOOP_PREVENTED',
        triggerDepth: currentDepth,
        idempotencyKey,
        details: `Duplicate event suppressed by Idempotency Key (${idempotencyKey}).`
      };
      return { ruleId: rule.id, ruleName: rule.name, status: 'LOOP_PREVENTED', log };
    }

    const conditionMatches = rule.conditions.every(cond => {
      const issueValue = (issue as any)[cond.field] ?? issue.customFields?.[cond.field];
      if (cond.operator === '=') return issueValue === cond.value;
      if (cond.operator === '!=') return issueValue !== cond.value;
      if (cond.operator === 'IN') return Array.isArray(cond.value) && cond.value.includes(issueValue);
      return false;
    });

    if (!conditionMatches) return null;

    if (!isDryRun) {
      this.recentExecutionKeys.add(idempotencyKey);
      setTimeout(() => this.recentExecutionKeys.delete(idempotencyKey), 60000);
    }

    let mutatedIssue: Issue = { ...issue, updatedAt: new Date().toISOString() };
    const actionSummaries: string[] = [];

    for (const action of rule.actions) {
      if (action.type === 'CHANGE_STATUS') {
        mutatedIssue.statusId = action.value;
        actionSummaries.push(`Changed status to ${action.value}`);
      } else if (action.type === 'ASSIGN_USER') {
        mutatedIssue.assigneeId = action.value;
        actionSummaries.push(`Assigned user to ${action.value}`);
      } else if (action.type === 'ADD_LABEL') {
        if (!mutatedIssue.labels.includes(action.value)) {
          mutatedIssue.labels = [...mutatedIssue.labels, action.value];
        }
        actionSummaries.push(`Added label "${action.value}"`);
      } else if (action.type === 'CREATE_SUBTASK') {
        mutatedIssue.subtasks = [
          ...mutatedIssue.subtasks,
          { id: `st-auto-${Date.now()}`, title: action.value, completed: false }
        ];
        actionSummaries.push(`Created subtask "${action.value}"`);
      }
    }

    const executionStatus = isDryRun ? 'DRY_RUN' : 'SUCCESS';
    const log: AutomationExecutionLog = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      automationId: rule.id,
      automationName: rule.name,
      issueKey: issue.key,
      executedAt: new Date().toISOString(),
      status: executionStatus,
      triggerDepth: currentDepth,
      idempotencyKey,
      details: `${isDryRun ? '[DRY RUN SIMULATION] ' : ''}Executed ${actionSummaries.length} actions: ${actionSummaries.join('; ')}`
    };

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      status: executionStatus,
      mutatedIssue: isDryRun ? undefined : mutatedIssue,
      log
    };
  }
}
