export type IssueTypeCategory = 
  | 'INITIATIVE' 
  | 'EPIC' 
  | 'FEATURE' 
  | 'STORY' 
  | 'TASK' 
  | 'SUBTASK' 
  | 'BUG' 
  | 'INCIDENT' 
  | 'SPIKE' 
  | 'IMPROVEMENT' 
  | 'RESEARCH' 
  | 'SUPPORT' 
  | 'SECURITY' 
  | 'TECH_DEBT' 
  | 'CHANGE_REQUEST';

export interface IssueTypeConfig {
  id: string;
  name: string;
  category: IssueTypeCategory;
  description: string;
  icon: string; // Lucide icon name
  color: string; // HEX / Token
  hierarchyLevel: number; // 0 = Initiative, 1 = Epic, 2 = Feature, 3 = Story, 4 = Task, 5 = Subtask
  allowedParentTypes: IssueTypeCategory[];
  allowedChildTypes: IssueTypeCategory[];
  requiredFields: string[];
  isDisabled?: boolean;
}

export type PriorityLevel = 'CRITICAL' | 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW' | 'LOWEST';

export interface PriorityConfig {
  id: PriorityLevel;
  name: string;
  rank: number;
  color: string;
  icon: string;
}

export type StatusCategory = 'BACKLOG' | 'UNSTARTED' | 'IN_PROGRESS' | 'REVIEW' | 'QA' | 'COMPLETED' | 'CANCELLED';

export interface IssueStatus {
  id: string;
  name: string;
  category: StatusCategory;
  color: string;
  position: number;
  wipLimit?: number;
  description?: string;
}

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type SLAStatus = 'HEALTHY' | 'AT_RISK' | 'BREACHED' | 'PAUSED' | 'COMPLETED';

export interface SLAConfig {
  id: string;
  name: string;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  pauseOnStatuses: string[]; // Status IDs that pause SLA clock
}

export interface IssueSLA {
  configId: string;
  responseDeadline: string;
  resolutionDeadline: string;
  responseStatus: SLAStatus;
  resolutionStatus: SLAStatus;
  isPaused: boolean;
  elapsedMinutes: number;
}

export type RelationType = 
  | 'BLOCKS' 
  | 'BLOCKED_BY' 
  | 'DEPENDS_ON' 
  | 'REQUIRED_BY' 
  | 'DUPLICATES' 
  | 'RELATES_TO' 
  | 'PARENT' 
  | 'CHILD' 
  | 'CAUSED_BY' 
  | 'CLONED_FROM';

export interface IssueRelation {
  id: string;
  sourceIssueId: string;
  targetIssueId: string;
  targetIssueKey: string;
  targetTitle: string;
  type: RelationType;
}

export type CustomFieldType = 
  | 'TEXT' 
  | 'LONG_TEXT' 
  | 'NUMBER' 
  | 'BOOLEAN' 
  | 'SELECT' 
  | 'MULTI_SELECT' 
  | 'USER' 
  | 'TEAM' 
  | 'DATE' 
  | 'DATETIME' 
  | 'URL' 
  | 'EMAIL' 
  | 'PROGRESS' 
  | 'CURRENCY' 
  | 'DURATION' 
  | 'RATING' 
  | 'FORMULA' 
  | 'RELATION';

export interface CustomFieldDefinition {
  id: string;
  key: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  options?: string[]; // for SELECT & MULTI_SELECT
  defaultValue?: any;
  formula?: string; // for FORMULA
  description?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: SystemRole;
  teams: string[];
}

export type SystemRole = 
  | 'ORG_OWNER' 
  | 'WORKSPACE_ADMIN' 
  | 'PROJECT_ADMIN' 
  | 'PROJECT_MANAGER' 
  | 'DEVELOPER' 
  | 'QA' 
  | 'DESIGNER' 
  | 'VIEWER' 
  | 'GUEST' 
  | 'CUSTOM_ROLE';

export type Permission = 
  | 'issue:create' 
  | 'issue:view' 
  | 'issue:update' 
  | 'issue:delete' 
  | 'issue:assign' 
  | 'issue:transition' 
  | 'board:create' 
  | 'board:update' 
  | 'workflow:create' 
  | 'workflow:update' 
  | 'automation:create' 
  | 'automation:enable' 
  | 'sprint:manage' 
  | 'release:manage' 
  | 'project:configure' 
  | 'member:invite';

export type SecurityLevel = 'PUBLIC' | 'WORKSPACE' | 'PROJECT' | 'TEAM' | 'RESTRICTED' | 'PRIVATE';

export interface GitHubLink {
  repoName: string;
  branchName?: string;
  prNumber?: number;
  prTitle?: string;
  prStatus?: 'OPEN' | 'APPROVED' | 'CHANGES_REQUESTED' | 'MERGED' | 'CLOSED';
  ciStatus?: 'SUCCESS' | 'FAILURE' | 'PENDING';
  deploymentStage?: 'STAGING' | 'PRODUCTION' | 'NOT_DEPLOYED';
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assigneeId?: string;
}

export interface Issue {
  id: string;
  key: string; // e.g. PM-142
  projectId: string;
  type: IssueTypeCategory;
  title: string;
  description: string;
  statusId: string;
  priority: PriorityLevel;
  assigneeId?: string;
  reporterId: string;
  teamId?: string;
  sprintId?: string;
  releaseId?: string;
  epicId?: string;
  parentId?: string;
  labels: string[];
  storyPoints?: number;
  dueDate?: string;
  risk?: RiskLevel;
  sla?: IssueSLA;
  securityLevel: SecurityLevel;
  relations: IssueRelation[];
  github?: GitHubLink;
  subtasks: Subtask[];
  customFields: Record<string, any>; // fieldKey -> value
  estimateHours?: number;
  loggedHours?: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export type ViewType = 
  | 'KANBAN' 
  | 'SCRUM' 
  | 'LIST' 
  | 'TABLE' 
  | 'TIMELINE' 
  | 'ROADMAP' 
  | 'CALENDAR' 
  | 'DEPENDENCY' 
  | 'MATRIX' 
  | 'RELEASE';

export type CardDensity = 'COMPACT' | 'STANDARD' | 'DETAILED';

export interface CardFieldConfig {
  showKey: boolean;
  showTitle: boolean;
  showType: boolean;
  showPriority: boolean;
  showStatus: boolean;
  showAssignee: boolean;
  showSprint: boolean;
  showEpic: boolean;
  showLabels: boolean;
  showStoryPoints: boolean;
  showDueDate: boolean;
  showSLA: boolean;
  showGitHubStatus: boolean;
  showSubtaskProgress: boolean;
}

export type ViewScope = 'PRIVATE' | 'TEAM' | 'PROJECT' | 'WORKSPACE' | 'PUBLIC';

export interface ViewFilterGroup {
  operator: 'AND' | 'OR';
  conditions: Array<{
    field: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'NOT_IN' | 'CONTAINS' | 'NOT_CONTAINS' | 'IS_EMPTY' | 'IS_NOT_EMPTY';
    value: any;
  }>;
}

export interface SavedView {
  id: string;
  name: string;
  type: ViewType;
  scope: ViewScope;
  projectId: string;
  ownerId: string;
  groupBy?: 'statusId' | 'priority' | 'assigneeId' | 'teamId' | 'releaseId' | 'type';
  sortBy?: { field: string; direction: 'asc' | 'desc' };
  filterGroup?: ViewFilterGroup;
  density: CardDensity;
  cardFields: CardFieldConfig;
  swimlaneBy?: 'epicId' | 'priority' | 'assigneeId' | 'type';
}

export interface WorkflowTransition {
  id: string;
  fromStatusId: string;
  toStatusId: string;
  name: string;
  requiredRoles: SystemRole[];
  conditions: Array<{ type: 'PR_MUST_EXIST' | 'NO_UNRESOLVED_SUBTASKS' | 'HAS_ASSIGNEE' | 'NO_BLOCKING_ISSUES' }>;
  validators: Array<{ type: 'PR_MUST_BE_APPROVED' | 'SECURITY_APPROVAL' }>;
  actions: Array<{ type: 'AUTO_ASSIGN' | 'ADD_LABEL'; param?: string }>;
}

export interface Workflow {
  id: string;
  projectId: string;
  name: string;
  transitions: WorkflowTransition[];
}

export type AutomationFolder = 'github' | 'tickets' | 'sprints' | 'releases' | 'notifications';

export interface AutomationRule {
  id: string;
  projectId: string;
  folder: AutomationFolder;
  name: string;
  description: string;
  trigger: {
    type: 'PR_MERGED' | 'PR_CREATED' | 'BUILD_FAILED' | 'STATUS_CHANGED' | 'DUE_DATE_REACHED' | 'ISSUE_CREATED';
    config?: Record<string, any>;
  };
  conditions: Array<{
    field: string;
    operator: '=' | '!=' | 'IN';
    value: any;
  }>;
  actions: Array<{
    type: 'CHANGE_STATUS' | 'ASSIGN_USER' | 'ADD_LABEL' | 'SEND_NOTIFICATION' | 'CREATE_SUBTASK';
    value: any;
  }>;
  isEnabled: boolean;
  executionCount: number;
  lastExecutedAt?: string;
}

export interface AutomationExecutionLog {
  id: string;
  automationId: string;
  automationName: string;
  issueKey: string;
  executedAt: string;
  status: 'SUCCESS' | 'FAILED' | 'LOOP_PREVENTED' | 'DRY_RUN';
  triggerDepth: number;
  idempotencyKey: string;
  details: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  capacityPoints: number;
  completedPoints?: number;
}

export interface Release {
  id: string;
  projectId: string;
  version: string;
  title: string;
  releaseDate: string;
  status: 'UNRELEASED' | 'RELEASED' | 'ARCHIVED';
  description: string;
}

export interface AuditLog {
  id: string;
  issueKey: string;
  user: string;
  userAvatar?: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  source: 'USER' | 'AUTOMATION' | 'GITHUB' | 'API' | 'SYSTEM';
  timestamp: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'BURNDOWN' | 'VELOCITY' | 'ISSUE_DISTRIBUTION' | 'PRIORITY_BREAKDOWN' | 'SLA_BREACHES' | 'PR_STATUS' | 'CYCLE_TIME' | 'WORKLOAD';
  w: number;
  h: number;
}
