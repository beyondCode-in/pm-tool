/**
 * Jira & ClickUp Engine Adapter for GitHub Projects V2
 * Provides state machine transition rules, WIP limit validation, SLA calculations, and subtask parent-child trees.
 */

export class JiraClickUpEngine {
  constructor(config = {}) {
    this.wipLimits = config.wipLimits || {
      'In Progress': 5,
      'Code Review': 3,
      'QA & Testing': 4
    };
    this.allowedTransitions = {
      'Backlog': ['Selected for Dev'],
      'Selected for Dev': ['In Progress', 'Backlog'],
      'In Progress': ['Code Review', 'Selected for Dev'],
      'Code Review': ['QA & Testing', 'In Progress'],
      'QA & Testing': ['Done / Released', 'In Progress'],
      'Done / Released': ['In Progress']
    };
  }

  /**
   * Validate if a status transition is permitted under Jira workflow rules
   */
  validateTransition(fromStatus, toStatus, userRole, hasLinkedPR = false) {
    const validTargetStatuses = this.allowedTransitions[fromStatus] || [];
    if (!validTargetStatuses.includes(toStatus)) {
      return {
        allowed: false,
        reason: `Invalid transition from '${fromStatus}' to '${toStatus}'. Permitted transitions: ${validTargetStatuses.join(', ')}`
      };
    }

    // Require linked PR for moving to Code Review
    if (toStatus === 'Code Review' && !hasLinkedPR) {
      return {
        allowed: false,
        reason: "Transition to 'Code Review' requires a linked GitHub Pull Request."
      };
    }

    // Require QA role for moving to Done
    if (toStatus === 'Done / Released' && userRole !== 'QA' && userRole !== 'ADMIN') {
      return {
        allowed: false,
        reason: "Only QA team members or Project Admins can transition tickets to 'Done / Released'."
      };
    }

    return { allowed: true };
  }

  /**
   * Check if adding an item violates column WIP limits
   */
  checkWipLimit(status, currentCount) {
    const limit = this.wipLimits[status];
    if (!limit) return { breached: false };

    if (currentCount >= limit) {
      return {
        breached: true,
        limit,
        currentCount,
        warning: `WIP Limit Breach Warning! Column '${status}' has reached maximum capacity (${currentCount}/${limit}).`
      };
    }

    return { breached: false, limit, currentCount };
  }

  /**
   * Calculate SLA target remaining time in hours
   */
  calculateSlaRemaining(createdAtIso, priority) {
    const createdTime = new Date(createdAtIso).getTime();
    const now = Date.now();
    const elapsedHours = (now - createdTime) / (1000 * 60 * 60);

    const slaTargetHours = {
      '🔴 Critical': 2,
      '🟠 High': 8,
      '🟡 Medium': 48,
      '🔵 Low': 120
    }[priority] || 48;

    const remainingHours = Math.max(0, slaTargetHours - elapsedHours);
    const isBreached = elapsedHours > slaTargetHours;

    return {
      slaTargetHours,
      elapsedHours: Math.round(elapsedHours * 10) / 10,
      remainingHours: Math.round(remainingHours * 10) / 10,
      isBreached,
      statusLabel: isBreached ? '⚠️ SLA BREACHED' : `⏱️ ${Math.round(remainingHours)}h remaining`
    };
  }

  /**
   * Build a hierarchical parent-child tree from flat issues
   */
  buildIssueTree(issues) {
    const tree = [];
    const issueMap = new Map();

    issues.forEach(issue => {
      issueMap.set(issue.id || issue.number, { ...issue, children: [] });
    });

    issues.forEach(issue => {
      const node = issueMap.get(issue.id || issue.number);
      if (issue.parentId && issueMap.has(issue.parentId)) {
        issueMap.get(issue.parentId).children.push(node);
      } else {
        tree.push(node);
      }
    });

    return tree;
  }
}
