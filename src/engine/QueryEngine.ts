import { Issue, SavedView, ViewFilterGroup } from '../types/index.ts';

export class QueryEngine {
  static filterIssues(issues: Issue[], filterGroup?: ViewFilterGroup): Issue[] {
    if (!filterGroup || filterGroup.conditions.length === 0) return issues;

    return issues.filter(issue => {
      const matchResults = filterGroup.conditions.map(cond => {
        const issueValue = (issue as any)[cond.field] ?? issue.customFields?.[cond.field];

        switch (cond.operator) {
          case '=':
            return issueValue === cond.value;
          case '!=':
            return issueValue !== cond.value;
          case '>':
            return Number(issueValue) > Number(cond.value);
          case '<':
            return Number(issueValue) < Number(cond.value);
          case '>=':
            return Number(issueValue) >= Number(cond.value);
          case '<=':
            return Number(issueValue) <= Number(cond.value);
          case 'IN':
            return Array.isArray(cond.value) && cond.value.includes(issueValue);
          case 'NOT_IN':
            return Array.isArray(cond.value) && !cond.value.includes(issueValue);
          case 'CONTAINS':
            if (Array.isArray(issueValue)) return issueValue.includes(cond.value);
            return String(issueValue || '').toLowerCase().includes(String(cond.value).toLowerCase());
          case 'NOT_CONTAINS':
            if (Array.isArray(issueValue)) return !issueValue.includes(cond.value);
            return !String(issueValue || '').toLowerCase().includes(String(cond.value).toLowerCase());
          case 'IS_EMPTY':
            return issueValue === undefined || issueValue === null || issueValue === '' || (Array.isArray(issueValue) && issueValue.length === 0);
          case 'IS_NOT_EMPTY':
            return issueValue !== undefined && issueValue !== null && issueValue !== '' && (!Array.isArray(issueValue) || issueValue.length > 0);
          default:
            return true;
        }
      });

      if (filterGroup.operator === 'AND') {
        return matchResults.every(Boolean);
      } else {
        return matchResults.some(Boolean);
      }
    });
  }

  static sortIssues(issues: Issue[], sortBy?: { field: string; direction: 'asc' | 'desc' }): Issue[] {
    if (!sortBy) return issues;

    return [...issues].sort((a, b) => {
      const valA = (a as any)[sortBy.field] ?? a.customFields?.[sortBy.field] ?? '';
      const valB = (b as any)[sortBy.field] ?? b.customFields?.[sortBy.field] ?? '';

      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }

      return sortBy.direction === 'asc' ? comparison : -comparison;
    });
  }

  static groupIssues(issues: Issue[], groupBy?: string): Record<string, Issue[]> {
    if (!groupBy) {
      return { 'All Issues': issues };
    }

    const groups: Record<string, Issue[]> = {};

    issues.forEach(issue => {
      const key = String((issue as any)[groupBy] ?? issue.customFields?.[groupBy] ?? 'Unassigned');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(issue);
    });

    return groups;
  }

  static processSavedView(issues: Issue[], savedView: SavedView): Issue[] {
    const filtered = this.filterIssues(issues, savedView.filterGroup);
    return this.sortIssues(filtered, savedView.sortBy);
  }
}
