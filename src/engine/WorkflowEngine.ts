import { Issue, Workflow, IssueStatus, SystemRole, User } from '../types/index.ts';

export interface WorkflowTransitionResult {
  allowed: boolean;
  reason?: string;
  wipLimitWarning?: string;
  mutatedIssue?: Issue;
}

export class WorkflowEngine {
  static canTransition(
    issue: Issue,
    targetStatusId: string,
    workflow: Workflow,
    user: User,
    allIssues: Issue[],
    statuses: IssueStatus[]
  ): WorkflowTransitionResult {
    if (issue.statusId === targetStatusId) {
      return { allowed: true };
    }

    // 1. Find explicit transition rule
    const transition = workflow.transitions.find(
      t => t.fromStatusId === issue.statusId && t.toStatusId === targetStatusId
    );

    // If no explicit transition exists in workflow, default strict check
    if (!transition) {
      if (['ORG_OWNER', 'PROJECT_ADMIN'].includes(user.role)) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `No valid workflow transition defined from current state to target state for your role (${user.role}).`
      };
    }

    // 2. Check Role permissions
    if (transition.requiredRoles && transition.requiredRoles.length > 0) {
      if (!transition.requiredRoles.includes(user.role)) {
        return {
          allowed: false,
          reason: `Transition restricted! Required role: ${transition.requiredRoles.join(', ')}. Your role: ${user.role}`
        };
      }
    }

    // 3. Evaluate Conditions
    for (const cond of transition.conditions) {
      if (cond.type === 'PR_MUST_EXIST') {
        if (!issue.github?.prNumber) {
          return {
            allowed: false,
            reason: `Transition blocked: A linked GitHub Pull Request is required before moving to Code Review.`
          };
        }
      }
      if (cond.type === 'NO_UNRESOLVED_SUBTASKS') {
        const uncompletedSubtasks = issue.subtasks.filter(s => !s.completed);
        if (uncompletedSubtasks.length > 0) {
          return {
            allowed: false,
            reason: `Transition blocked: Issue has ${uncompletedSubtasks.length} uncompleted subtask(s).`
          };
        }
      }
      if (cond.type === 'HAS_ASSIGNEE') {
        if (!issue.assigneeId) {
          return {
            allowed: false,
            reason: `Transition blocked: Issue must be assigned to a team member before starting.`
          };
        }
      }
      if (cond.type === 'NO_BLOCKING_ISSUES') {
        const blockingRelations = issue.relations.filter(r => r.type === 'BLOCKED_BY');
        const unresolvedBlockers = allIssues.filter(
          other => blockingRelations.some(r => r.targetIssueId === other.id) && other.statusId !== 'status-done'
        );
        if (unresolvedBlockers.length > 0) {
          return {
            allowed: false,
            reason: `Transition blocked: Blocked by unresolved issue(s): ${unresolvedBlockers.map(i => i.key).join(', ')}.`
          };
        }
      }
    }

    // 4. Evaluate Validators
    for (const val of transition.validators) {
      if (val.type === 'PR_MUST_BE_APPROVED') {
        if (issue.github?.prStatus !== 'APPROVED' && issue.github?.prStatus !== 'MERGED') {
          return {
            allowed: false,
            reason: `Validation failed: Linked PR #${issue.github?.prNumber} must be Approved before QA handoff.`
          };
        }
      }
      if (val.type === 'SECURITY_APPROVAL') {
        if (issue.type === 'SECURITY' && !issue.customFields?.qa_signoff) {
          return {
            allowed: false,
            reason: `Validation failed: Security defect requires QA & Security signoff flag.`
          };
        }
      }
    }

    // 5. WIP Limits Check
    const targetStatus = statuses.find(s => s.id === targetStatusId);
    let wipLimitWarning: string | undefined = undefined;

    if (targetStatus?.wipLimit) {
      const currentCountInStatus = allIssues.filter(i => i.statusId === targetStatusId && i.id !== issue.id).length;
      if (currentCountInStatus >= targetStatus.wipLimit) {
        wipLimitWarning = `WIP Limit Exceeded! Column "${targetStatus.name}" has ${currentCountInStatus}/${targetStatus.wipLimit} cards.`;
      }
    }

    // 6. Execute Transition Actions (Mutate issue preview)
    const mutatedIssue: Issue = { ...issue, statusId: targetStatusId, updatedAt: new Date().toISOString() };
    for (const act of transition.actions) {
      if (act.type === 'AUTO_ASSIGN' && act.param) {
        mutatedIssue.assigneeId = act.param;
      }
      if (act.type === 'ADD_LABEL' && act.param) {
        if (!mutatedIssue.labels.includes(act.param)) {
          mutatedIssue.labels = [...mutatedIssue.labels, act.param];
        }
      }
    }

    return {
      allowed: true,
      wipLimitWarning,
      mutatedIssue
    };
  }
}
