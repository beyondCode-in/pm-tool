import { IssueTypeConfig, PriorityConfig, IssueStatus, User, CustomFieldDefinition, Workflow, AutomationRule, SavedView } from '../types/index.ts';

export const DEFAULT_ISSUE_TYPES: IssueTypeConfig[] = [
  {
    id: 'INITIATIVE',
    name: 'Initiative',
    category: 'INITIATIVE',
    description: 'High-level strategic goal spanning multiple epics',
    icon: 'Target',
    color: '#3b82f6',
    hierarchyLevel: 0,
    allowedParentTypes: [],
    allowedChildTypes: ['EPIC'],
    requiredFields: ['title', 'description']
  },
  {
    id: 'EPIC',
    name: 'Epic',
    category: 'EPIC',
    description: 'Large body of work that can be broken into features & stories',
    icon: 'Zap',
    color: '#8b5cf6',
    hierarchyLevel: 1,
    allowedParentTypes: ['INITIATIVE'],
    allowedChildTypes: ['FEATURE', 'STORY', 'TASK', 'BUG', 'RESEARCH'],
    requiredFields: ['title', 'description']
  },
  {
    id: 'FEATURE',
    name: 'Feature',
    category: 'FEATURE',
    description: 'Distinct capability or functional unit delivering user value',
    icon: 'Layers',
    color: '#a855f7',
    hierarchyLevel: 2,
    allowedParentTypes: ['EPIC'],
    allowedChildTypes: ['STORY', 'TASK', 'BUG'],
    requiredFields: ['title']
  },
  {
    id: 'STORY',
    name: 'User Story',
    category: 'STORY',
    description: 'User requirement expressed from end-user perspective',
    icon: 'Bookmark',
    color: '#3b82f6',
    hierarchyLevel: 3,
    allowedParentTypes: ['EPIC', 'FEATURE'],
    allowedChildTypes: ['TASK', 'SUBTASK', 'BUG'],
    requiredFields: ['title']
  },
  {
    id: 'TASK',
    name: 'Task',
    category: 'TASK',
    description: 'Actionable piece of work to complete',
    icon: 'CheckSquare',
    color: '#06b6d4',
    hierarchyLevel: 4,
    allowedParentTypes: ['EPIC', 'FEATURE', 'STORY'],
    allowedChildTypes: ['SUBTASK'],
    requiredFields: ['title']
  },
  {
    id: 'SUBTASK',
    name: 'Subtask',
    category: 'SUBTASK',
    description: 'Sub-component of a parent story or task',
    icon: 'GitCommit',
    color: '#64748b',
    hierarchyLevel: 5,
    allowedParentTypes: ['STORY', 'TASK', 'BUG'],
    allowedChildTypes: [],
    requiredFields: ['title']
  },
  {
    id: 'BUG',
    name: 'Bug',
    category: 'BUG',
    description: 'Defect or unintended behavior requiring fix',
    icon: 'Bug',
    color: '#ef4444',
    hierarchyLevel: 4,
    allowedParentTypes: ['EPIC', 'FEATURE', 'STORY'],
    allowedChildTypes: ['SUBTASK'],
    requiredFields: ['title', 'description']
  },
  {
    id: 'INCIDENT',
    name: 'Production Incident',
    category: 'INCIDENT',
    description: 'Critical operational disruption needing immediate response',
    icon: 'AlertOctagon',
    color: '#991b1b',
    hierarchyLevel: 3,
    allowedParentTypes: ['EPIC'],
    allowedChildTypes: ['TASK', 'BUG'],
    requiredFields: ['title', 'description', 'risk']
  },
  {
    id: 'SECURITY',
    name: 'Security Defect',
    category: 'SECURITY',
    description: 'Security vulnerability or compliance audit finding',
    icon: 'ShieldAlert',
    color: '#e11d48',
    hierarchyLevel: 3,
    allowedParentTypes: ['EPIC', 'FEATURE'],
    allowedChildTypes: ['TASK'],
    requiredFields: ['title', 'securityLevel']
  },
  {
    id: 'TECH_DEBT',
    name: 'Technical Debt',
    category: 'TECH_DEBT',
    description: 'Refactoring or code quality improvement task',
    icon: 'Wrench',
    color: '#f97316',
    hierarchyLevel: 4,
    allowedParentTypes: ['EPIC', 'FEATURE'],
    allowedChildTypes: ['SUBTASK'],
    requiredFields: ['title']
  },
  {
    id: 'RESEARCH',
    name: 'Research / Spike',
    category: 'RESEARCH',
    description: 'Exploratory task or prototype investigation',
    icon: 'Compass',
    color: '#6366f1',
    hierarchyLevel: 3,
    allowedParentTypes: ['EPIC'],
    allowedChildTypes: ['TASK'],
    requiredFields: ['title']
  },
  {
    id: 'IMPROVEMENT',
    name: 'Improvement',
    category: 'IMPROVEMENT',
    description: 'Enhancement to existing functionality',
    icon: 'TrendingUp',
    color: '#14b8a6',
    hierarchyLevel: 4,
    allowedParentTypes: ['EPIC', 'FEATURE'],
    allowedChildTypes: ['SUBTASK'],
    requiredFields: ['title']
  }
];

export const DEFAULT_PRIORITIES: PriorityConfig[] = [
  { id: 'CRITICAL', name: 'Critical', rank: 1, color: '#991b1b', icon: 'ChevronsUp' },
  { id: 'HIGHEST', name: 'Highest', rank: 2, color: '#ef4444', icon: 'ChevronUp' },
  { id: 'HIGH', name: 'High', rank: 3, color: '#f97316', icon: 'ArrowUp' },
  { id: 'MEDIUM', name: 'Medium', rank: 4, color: '#f59e0b', icon: 'Minus' },
  { id: 'LOW', name: 'Low', rank: 5, color: '#3b82f6', icon: 'ArrowDown' },
  { id: 'LOWEST', name: 'Lowest', rank: 6, color: '#64748b', icon: 'ChevronDown' }
];

export const DEFAULT_STATUSES: IssueStatus[] = [
  { id: 'status-backlog', name: 'Backlog', category: 'BACKLOG', color: '#64748b', position: 0 },
  { id: 'status-selected', name: 'Selected for Dev', category: 'UNSTARTED', color: '#475569', position: 1 },
  { id: 'status-in-progress', name: 'In Progress', category: 'IN_PROGRESS', color: '#6366f1', position: 2, wipLimit: 5 },
  { id: 'status-code-review', name: 'Code Review', category: 'REVIEW', color: '#a855f7', position: 3, wipLimit: 3 },
  { id: 'status-qa', name: 'QA & Testing', category: 'QA', color: '#06b6d4', position: 4, wipLimit: 4 },
  { id: 'status-done', name: 'Released / Done', category: 'COMPLETED', color: '#22c55e', position: 5 }
];

export const DEFAULT_USERS: User[] = [
  { id: 'u-1', name: 'Akshay (You)', email: 'akshay@beyond.dev', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', role: 'ORG_OWNER', teams: ['Backend', 'Core Engine'] },
  { id: 'u-2', name: 'Sarah Connor', email: 'sarah@beyond.dev', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80', role: 'PROJECT_ADMIN', teams: ['Frontend', 'Design System'] },
  { id: 'u-3', name: 'David Miller', email: 'david@beyond.dev', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80', role: 'DEVELOPER', teams: ['Backend'] },
  { id: 'u-4', name: 'Elena Rostova', email: 'elena@beyond.dev', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80', role: 'QA', teams: ['QA & Security'] }
];

export const DEFAULT_CUSTOM_FIELDS: CustomFieldDefinition[] = [
  { id: 'cf-1', key: 'affected_version', label: 'Affected Version', type: 'TEXT', required: false },
  { id: 'cf-2', key: 'customer_impact', label: 'Customer Impact Rating', type: 'RATING', required: false },
  { id: 'cf-3', key: 'qa_signoff', label: 'QA Sign-off Received', type: 'BOOLEAN', required: false },
  { id: 'cf-4', key: 'cvss_score', label: 'CVSS Vulnerability Score', type: 'NUMBER', required: false }
];

export const DEFAULT_WORKFLOW: Workflow = {
  id: 'wf-default',
  projectId: 'proj-1',
  name: 'Standard Software Workflow',
  transitions: [
    {
      id: 't-1',
      fromStatusId: 'status-backlog',
      toStatusId: 'status-selected',
      name: 'Select for Development',
      requiredRoles: ['PROJECT_MANAGER', 'PROJECT_ADMIN', 'ORG_OWNER'],
      conditions: [{ type: 'HAS_ASSIGNEE' }],
      validators: [],
      actions: []
    },
    {
      id: 't-2',
      fromStatusId: 'status-selected',
      toStatusId: 'status-in-progress',
      name: 'Start Work',
      requiredRoles: ['DEVELOPER', 'PROJECT_MANAGER', 'PROJECT_ADMIN', 'ORG_OWNER'],
      conditions: [{ type: 'HAS_ASSIGNEE' }],
      validators: [],
      actions: []
    },
    {
      id: 't-3',
      fromStatusId: 'status-in-progress',
      toStatusId: 'status-code-review',
      name: 'Submit for Review',
      requiredRoles: ['DEVELOPER', 'PROJECT_ADMIN', 'ORG_OWNER'],
      conditions: [{ type: 'PR_MUST_EXIST' }],
      validators: [],
      actions: [{ type: 'ADD_LABEL', param: 'ready-for-review' }]
    },
    {
      id: 't-4',
      fromStatusId: 'status-code-review',
      toStatusId: 'status-qa',
      name: 'Pass Code Review -> QA',
      requiredRoles: ['DEVELOPER', 'PROJECT_ADMIN', 'ORG_OWNER'],
      conditions: [{ type: 'PR_MUST_EXIST' }],
      validators: [{ type: 'PR_MUST_BE_APPROVED' }],
      actions: [{ type: 'AUTO_ASSIGN', param: 'u-4' }]
    },
    {
      id: 't-5',
      fromStatusId: 'status-qa',
      toStatusId: 'status-done',
      name: 'Verify & Release',
      requiredRoles: ['QA', 'PROJECT_ADMIN', 'ORG_OWNER'],
      conditions: [{ type: 'NO_UNRESOLVED_SUBTASKS' }],
      validators: [],
      actions: []
    }
  ]
};

export const DEFAULT_AUTOMATIONS: AutomationRule[] = [
  {
    id: 'auto-1',
    projectId: 'proj-1',
    folder: 'github',
    name: 'Move to Code Review when PR Created',
    description: 'Automatically transitions issue to Code Review when a GitHub PR is opened.',
    trigger: { type: 'PR_CREATED' },
    conditions: [{ field: 'statusId', operator: '=', value: 'status-in-progress' }],
    actions: [{ type: 'CHANGE_STATUS', value: 'status-code-review' }],
    isEnabled: true,
    executionCount: 14,
    lastExecutedAt: '2026-10-07T10:45:00Z'
  },
  {
    id: 'auto-2',
    projectId: 'proj-1',
    folder: 'github',
    name: 'Move to QA on PR Approval',
    description: 'Transitions ticket to QA and assigns QA engineer when PR receives approving review.',
    trigger: { type: 'PR_MERGED' },
    conditions: [{ field: 'statusId', operator: '=', value: 'status-code-review' }],
    actions: [
      { type: 'CHANGE_STATUS', value: 'status-qa' },
      { type: 'ASSIGN_USER', value: 'u-4' }
    ],
    isEnabled: true,
    executionCount: 29,
    lastExecutedAt: '2026-10-07T09:12:00Z'
  },
  {
    id: 'auto-3',
    projectId: 'proj-1',
    folder: 'tickets',
    name: 'Auto-Assign Critical Incidents',
    description: 'Assigns Critical Incidents to Org Owner immediately upon creation.',
    trigger: { type: 'ISSUE_CREATED' },
    conditions: [
      { field: 'type', operator: '=', value: 'INCIDENT' },
      { field: 'priority', operator: '=', value: 'CRITICAL' }
    ],
    actions: [
      { type: 'ASSIGN_USER', value: 'u-1' },
      { type: 'ADD_LABEL', value: 'urgent-response' }
    ],
    isEnabled: true,
    executionCount: 5,
    lastExecutedAt: '2026-10-06T18:30:00Z'
  }
];

export const DEFAULT_SAVED_VIEWS: SavedView[] = [
  {
    id: 'view-kanban-all',
    name: 'Engineering Kanban',
    type: 'KANBAN',
    scope: 'PROJECT',
    projectId: 'proj-1',
    ownerId: 'u-1',
    density: 'STANDARD',
    cardFields: {
      showKey: true,
      showTitle: true,
      showType: true,
      showPriority: true,
      showStatus: true,
      showAssignee: true,
      showSprint: true,
      showEpic: false,
      showLabels: true,
      showStoryPoints: true,
      showDueDate: true,
      showSLA: true,
      showGitHubStatus: true,
      showSubtaskProgress: true
    }
  },
  {
    id: 'view-scrum-sprint',
    name: 'Active Sprint 12',
    type: 'SCRUM',
    scope: 'PROJECT',
    projectId: 'proj-1',
    ownerId: 'u-1',
    density: 'STANDARD',
    cardFields: {
      showKey: true,
      showTitle: true,
      showType: true,
      showPriority: true,
      showStatus: true,
      showAssignee: true,
      showSprint: true,
      showEpic: true,
      showLabels: false,
      showStoryPoints: true,
      showDueDate: false,
      showSLA: false,
      showGitHubStatus: true,
      showSubtaskProgress: true
    }
  },
  {
    id: 'view-list-bugs',
    name: 'All Bugs & Incidents',
    type: 'LIST',
    scope: 'PUBLIC',
    projectId: 'proj-1',
    ownerId: 'u-1',
    density: 'COMPACT',
    filterGroup: {
      operator: 'OR',
      conditions: [
        { field: 'type', operator: '=', value: 'BUG' },
        { field: 'type', operator: '=', value: 'INCIDENT' },
        { field: 'type', operator: '=', value: 'SECURITY' }
      ]
    },
    cardFields: {
      showKey: true,
      showTitle: true,
      showType: true,
      showPriority: true,
      showStatus: true,
      showAssignee: true,
      showSprint: false,
      showEpic: false,
      showLabels: true,
      showStoryPoints: false,
      showDueDate: true,
      showSLA: true,
      showGitHubStatus: false,
      showSubtaskProgress: false
    }
  }
];
