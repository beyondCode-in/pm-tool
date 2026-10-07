import { Issue, Sprint, Release, AuditLog } from '../types/index.ts';

export const INITIAL_SPRINTS: Sprint[] = [
  {
    id: 'sprint-12',
    projectId: 'proj-1',
    name: 'Sprint 12 — Core Engine & Security',
    goal: 'Deliver OAuth race condition fix, custom workflows, and WIP limits',
    startDate: '2026-10-01',
    endDate: '2026-10-14',
    status: 'ACTIVE',
    capacityPoints: 34,
    completedPoints: 21
  },
  {
    id: 'sprint-13',
    projectId: 'proj-1',
    name: 'Sprint 13 — GitHub Webhook Automations',
    goal: 'Ship bidirectional GitHub integration and timeline Gantt engine',
    startDate: '2026-10-15',
    endDate: '2026-10-28',
    status: 'PLANNED',
    capacityPoints: 40,
    completedPoints: 0
  }
];

export const INITIAL_RELEASES: Release[] = [
  {
    id: 'rel-2.4',
    projectId: 'proj-1',
    version: 'v2.4',
    title: 'Enterprise Workflow & GitHub Engine Release',
    releaseDate: '2026-10-20',
    status: 'UNRELEASED',
    description: 'Major release containing workflow engine, circular dependency detector, and automation recursion safety.'
  },
  {
    id: 'rel-2.5',
    projectId: 'proj-1',
    version: 'v2.5',
    title: 'AI Automation & Custom Views',
    releaseDate: '2026-11-15',
    status: 'UNRELEASED',
    description: 'Introducing custom field formula calculations and AI-assisted automation rule generator.'
  }
];

export const INITIAL_ISSUES: Issue[] = [
  {
    id: 'iss-1',
    key: 'PM-100',
    projectId: 'proj-1',
    type: 'EPIC',
    title: 'OAuth 2.0 Security & Enterprise Auth Refresh Engine',
    description: 'Complete overhaul of authentication token refresh logic, session revocation, and multi-tenant security architecture.',
    statusId: 'status-in-progress',
    priority: 'CRITICAL',
    assigneeId: 'u-1',
    reporterId: 'u-1',
    teamId: 'Backend',
    sprintId: 'sprint-12',
    releaseId: 'rel-2.4',
    labels: ['security', 'auth', 'architecture'],
    storyPoints: 13,
    dueDate: '2026-10-12',
    risk: 'HIGH',
    securityLevel: 'RESTRICTED',
    relations: [],
    subtasks: [
      { id: 'st-1', title: 'Audit JWT refresh token expiration window', completed: true, assigneeId: 'u-1' },
      { id: 'st-2', title: 'Implement Redis token blacklisting cluster', completed: true, assigneeId: 'u-3' },
      { id: 'st-3', title: 'Penetration test OAuth refresh race condition', completed: false, assigneeId: 'u-4' }
    ],
    customFields: {
      affected_version: 'v2.3.1',
      customer_impact: 5,
      qa_signoff: false
    },
    estimateHours: 40,
    loggedHours: 28,
    createdAt: '2026-10-02T08:00:00Z',
    updatedAt: '2026-10-07T10:00:00Z',
    version: 14
  },
  {
    id: 'iss-2',
    key: 'PM-142',
    projectId: 'proj-1',
    type: 'BUG',
    title: 'Fix OAuth refresh token race condition on parallel API requests',
    description: 'When multiple simultaneous client requests receive 401 Unauthorized, multiple token refreshes trigger concurrently, revoking valid refresh tokens prematurely.',
    statusId: 'status-code-review',
    priority: 'HIGHEST',
    assigneeId: 'u-1',
    reporterId: 'u-2',
    teamId: 'Backend',
    sprintId: 'sprint-12',
    releaseId: 'rel-2.4',
    epicId: 'iss-1',
    labels: ['backend', 'bug', 'high-priority'],
    storyPoints: 5,
    dueDate: '2026-10-08',
    risk: 'CRITICAL',
    sla: {
      configId: 'sla-1',
      responseDeadline: '2026-10-07T09:00:00Z',
      resolutionDeadline: '2026-10-07T16:00:00Z',
      responseStatus: 'COMPLETED',
      resolutionStatus: 'HEALTHY',
      isPaused: false,
      elapsedMinutes: 140
    },
    securityLevel: 'PROJECT',
    relations: [
      { id: 'r-1', sourceIssueId: 'iss-2', targetIssueId: 'iss-3', targetIssueKey: 'PM-145', targetTitle: 'Database Connection Pool Starvation', type: 'BLOCKS' }
    ],
    github: {
      repoName: 'beyond/pm-backend',
      branchName: 'feature/PM-142-oauth-fix',
      prNumber: 304,
      prTitle: 'fix(auth): mutex lock on concurrent token refresh calls',
      prStatus: 'APPROVED',
      ciStatus: 'SUCCESS',
      deploymentStage: 'STAGING'
    },
    subtasks: [
      { id: 'st-4', title: 'Write concurrency unit test with 50 parallel requests', completed: true, assigneeId: 'u-1' },
      { id: 'st-5', title: 'Add distributed mutex locking around token exchange', completed: true, assigneeId: 'u-1' }
    ],
    customFields: {
      affected_version: 'v2.3.4',
      cvss_score: 7.8
    },
    estimateHours: 12,
    loggedHours: 10,
    createdAt: '2026-10-06T09:30:00Z',
    updatedAt: '2026-10-07T10:45:00Z',
    version: 8
  },
  {
    id: 'iss-3',
    key: 'PM-145',
    projectId: 'proj-1',
    type: 'INCIDENT',
    title: 'Database connection pool starvation during spike load',
    description: 'Connection pool max capacity reached causing HTTP 500 error cascade on high traffic routes.',
    statusId: 'status-in-progress',
    priority: 'CRITICAL',
    assigneeId: 'u-3',
    reporterId: 'u-1',
    teamId: 'Backend',
    sprintId: 'sprint-12',
    releaseId: 'rel-2.4',
    epicId: 'iss-1',
    labels: ['incident', 'database', 'performance'],
    storyPoints: 8,
    dueDate: '2026-10-09',
    risk: 'CRITICAL',
    sla: {
      configId: 'sla-2',
      responseDeadline: '2026-10-07T11:00:00Z',
      resolutionDeadline: '2026-10-07T18:00:00Z',
      responseStatus: 'HEALTHY',
      resolutionStatus: 'HEALTHY',
      isPaused: false,
      elapsedMinutes: 45
    },
    securityLevel: 'PROJECT',
    relations: [
      { id: 'r-2', sourceIssueId: 'iss-3', targetIssueId: 'iss-4', targetIssueKey: 'PM-148', targetTitle: 'Implement Outbox Event Delivery Worker', type: 'BLOCKS' }
    ],
    github: {
      repoName: 'beyond/pm-backend',
      branchName: 'fix/PM-145-db-pool-tuning',
      prNumber: 308,
      prTitle: 'fix(db): expand connection pool size and add idle connection reaper',
      prStatus: 'OPEN',
      ciStatus: 'SUCCESS',
      deploymentStage: 'NOT_DEPLOYED'
    },
    subtasks: [
      { id: 'st-6', title: 'Tune PgBouncer pool max connections to 200', completed: true },
      { id: 'st-7', title: 'Add connection leak monitoring alert', completed: false }
    ],
    customFields: {},
    estimateHours: 16,
    loggedHours: 8,
    createdAt: '2026-10-07T08:00:00Z',
    updatedAt: '2026-10-07T10:30:00Z',
    version: 4
  },
  {
    id: 'iss-4',
    key: 'PM-148',
    projectId: 'proj-1',
    type: 'FEATURE',
    title: 'Implement Outbox Event Delivery Worker & Recursion Safety',
    description: 'Guaranteed event delivery outbox pattern to prevent automation loop cascades across microservices.',
    statusId: 'status-selected',
    priority: 'HIGH',
    assigneeId: 'u-3',
    reporterId: 'u-2',
    teamId: 'Core Engine',
    sprintId: 'sprint-12',
    releaseId: 'rel-2.4',
    labels: ['feature', 'automation', 'architecture'],
    storyPoints: 5,
    dueDate: '2026-10-14',
    risk: 'MEDIUM',
    securityLevel: 'PUBLIC',
    relations: [
      { id: 'r-3', sourceIssueId: 'iss-4', targetIssueId: 'iss-2', targetIssueKey: 'PM-142', targetTitle: 'Fix OAuth refresh token race condition', type: 'BLOCKS' }
    ],
    subtasks: [],
    customFields: {},
    estimateHours: 20,
    loggedHours: 0,
    createdAt: '2026-10-05T14:00:00Z',
    updatedAt: '2026-10-07T09:00:00Z',
    version: 2
  },
  {
    id: 'iss-5',
    key: 'PM-150',
    projectId: 'proj-1',
    type: 'STORY',
    title: 'Developer Keyboard Shortcuts & Command Palette (Cmd+K)',
    description: 'Keyboard navigation system enabling super-fast issue creation, search, status shifts, and project actions.',
    statusId: 'status-qa',
    priority: 'HIGH',
    assigneeId: 'u-2',
    reporterId: 'u-1',
    teamId: 'Frontend',
    sprintId: 'sprint-12',
    releaseId: 'rel-2.4',
    labels: ['ux', 'keyboard', 'frontend'],
    storyPoints: 3,
    dueDate: '2026-10-10',
    risk: 'LOW',
    securityLevel: 'PUBLIC',
    relations: [],
    github: {
      repoName: 'beyond/pm-frontend',
      branchName: 'feature/PM-150-command-k',
      prNumber: 112,
      prTitle: 'feat(ui): command palette modal and quick hotkey listeners',
      prStatus: 'APPROVED',
      ciStatus: 'SUCCESS',
      deploymentStage: 'STAGING'
    },
    subtasks: [
      { id: 'st-8', title: 'Cmd+K Modal component with fuzzy search', completed: true, assigneeId: 'u-2' },
      { id: 'st-9', title: 'Global keypress handler for C, E, A, P, S hotkeys', completed: true, assigneeId: 'u-2' }
    ],
    customFields: {
      qa_signoff: true
    },
    estimateHours: 8,
    loggedHours: 8,
    createdAt: '2026-10-04T11:20:00Z',
    updatedAt: '2026-10-07T10:15:00Z',
    version: 6
  },
  {
    id: 'iss-6',
    key: 'PM-160',
    projectId: 'proj-1',
    type: 'SECURITY',
    title: 'Audit field-level permission bypass vectors in REST API',
    description: 'Ensure non-admin roles cannot mutate protected fields like SLA configs or Security Level during partial updates.',
    statusId: 'status-backlog',
    priority: 'HIGHEST',
    assigneeId: 'u-4',
    reporterId: 'u-1',
    teamId: 'QA & Security',
    sprintId: 'sprint-13',
    releaseId: 'rel-2.5',
    labels: ['security', 'rbac', 'audit'],
    storyPoints: 5,
    dueDate: '2026-10-22',
    risk: 'HIGH',
    securityLevel: 'RESTRICTED',
    relations: [],
    subtasks: [],
    customFields: {
      cvss_score: 8.1
    },
    estimateHours: 16,
    loggedHours: 0,
    createdAt: '2026-10-07T09:00:00Z',
    updatedAt: '2026-10-07T09:00:00Z',
    version: 1
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'al-1',
    issueKey: 'PM-142',
    user: 'Akshay',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    action: 'Priority Changed',
    oldValue: 'High',
    newValue: 'Highest',
    source: 'USER',
    timestamp: '10:42 AM'
  },
  {
    id: 'al-2',
    issueKey: 'PM-142',
    user: 'GitHub Automation',
    action: 'Status Changed',
    oldValue: 'In Progress',
    newValue: 'Code Review',
    source: 'GITHUB',
    timestamp: '10:45 AM'
  },
  {
    id: 'al-3',
    issueKey: 'PM-142',
    user: 'Sarah Connor',
    action: 'PR Linked',
    newValue: 'beyond/pm-backend#304 (Approved)',
    source: 'GITHUB',
    timestamp: '10:48 AM'
  },
  {
    id: 'al-4',
    issueKey: 'PM-145',
    user: 'Automation Engine',
    action: 'Auto-Assigned',
    oldValue: 'Unassigned',
    newValue: 'David Miller',
    source: 'AUTOMATION',
    timestamp: '08:01 AM'
  }
];
