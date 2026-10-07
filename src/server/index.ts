import express, { Request, Response } from 'express';
import cors from 'cors';
import { INITIAL_ISSUES, INITIAL_SPRINTS, INITIAL_RELEASES, INITIAL_AUDIT_LOGS } from '../constants/mockIssues.ts';
import { DEFAULT_WORKFLOW, DEFAULT_AUTOMATIONS, DEFAULT_SAVED_VIEWS, DEFAULT_STATUSES, DEFAULT_USERS } from '../constants/defaults.ts';
import { WorkflowEngine } from '../engine/WorkflowEngine.ts';
import { AutomationEngine } from '../engine/AutomationEngine.ts';
import { DependencyGraphEngine } from '../engine/DependencyGraphEngine.ts';
import { Issue, AuditLog } from '../types/index.ts';

const app = express();
app.use(cors());
app.use(express.json());

let issues: Issue[] = [...INITIAL_ISSUES];
let auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
const automations = [...DEFAULT_AUTOMATIONS];
const savedViews = [...DEFAULT_SAVED_VIEWS];
const workflow = { ...DEFAULT_WORKFLOW };
const statuses = [...DEFAULT_STATUSES];

// GET /api/health
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', engine: 'BeyondPM Core Engine', issuesCount: issues.length });
});

// GET /api/issues
app.get('/api/issues', (req: Request, res: Response) => {
  const { search, status, type, priority } = req.query;

  let result = [...issues];

  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(i => 
      i.key.toLowerCase().includes(q) || 
      i.title.toLowerCase().includes(q) || 
      i.description.toLowerCase().includes(q) ||
      i.labels.some(l => l.toLowerCase().includes(q))
    );
  }

  if (status) result = result.filter(i => i.statusId === status);
  if (type) result = result.filter(i => i.type === type);
  if (priority) result = result.filter(i => i.priority === priority);

  res.json({ issues: result, total: result.length });
});

// POST /api/issues
app.post('/api/issues', (req: Request, res: Response) => {
  const newIssueData: Partial<Issue> = req.body;
  const key = `PM-${150 + issues.length + 1}`;

  const newIssue: Issue = {
    id: `iss-${Date.now()}`,
    key,
    projectId: 'proj-1',
    type: newIssueData.type || 'TASK',
    title: newIssueData.title || 'Untitled Issue',
    description: newIssueData.description || '',
    statusId: newIssueData.statusId || 'status-backlog',
    priority: newIssueData.priority || 'MEDIUM',
    assigneeId: newIssueData.assigneeId,
    reporterId: newIssueData.reporterId || 'u-1',
    teamId: newIssueData.teamId || 'Backend',
    sprintId: newIssueData.sprintId,
    releaseId: newIssueData.releaseId,
    epicId: newIssueData.epicId,
    parentId: newIssueData.parentId,
    labels: newIssueData.labels || [],
    storyPoints: newIssueData.storyPoints || 3,
    dueDate: newIssueData.dueDate,
    risk: newIssueData.risk || 'LOW',
    securityLevel: newIssueData.securityLevel || 'PROJECT',
    relations: newIssueData.relations || [],
    subtasks: newIssueData.subtasks || [],
    customFields: newIssueData.customFields || {},
    estimateHours: newIssueData.estimateHours || 8,
    loggedHours: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  };

  issues.push(newIssue);

  const audit: AuditLog = {
    id: `al-${Date.now()}`,
    issueKey: key,
    user: 'Akshay',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    action: 'Issue Created',
    newValue: `${newIssue.type} created`,
    source: 'USER',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  auditLogs.unshift(audit);

  res.status(201).json({ issue: newIssue, audit });
});

// PATCH /api/issues/:id
app.patch('/api/issues/:id', (req: Request, res: Response): any => {
  const { id } = req.params;
  const updates: Partial<Issue> = req.body;
  const issueIndex = issues.findIndex(i => i.id === id || i.key === id);

  if (issueIndex === -1) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  const currentIssue = issues[issueIndex];
  const currentUser = DEFAULT_USERS[0];

  let wipLimitWarning: string | undefined = undefined;
  if (updates.statusId && updates.statusId !== currentIssue.statusId) {
    const transitionCheck = WorkflowEngine.canTransition(
      currentIssue,
      updates.statusId,
      workflow,
      currentUser,
      issues,
      statuses
    );

    if (!transitionCheck.allowed) {
      return res.status(400).json({ error: transitionCheck.reason });
    }
    wipLimitWarning = transitionCheck.wipLimitWarning;
  }

  const auditEntries: AuditLog[] = [];
  if (updates.statusId && updates.statusId !== currentIssue.statusId) {
    const oldStatusName = statuses.find(s => s.id === currentIssue.statusId)?.name || currentIssue.statusId;
    const newStatusName = statuses.find(s => s.id === updates.statusId)?.name || updates.statusId;
    auditEntries.push({
      id: `al-${Date.now()}-1`,
      issueKey: currentIssue.key,
      user: currentUser.name,
      userAvatar: currentUser.avatar,
      action: 'Status Transition',
      oldValue: oldStatusName,
      newValue: newStatusName,
      source: 'USER',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  if (updates.priority && updates.priority !== currentIssue.priority) {
    auditEntries.push({
      id: `al-${Date.now()}-2`,
      issueKey: currentIssue.key,
      user: currentUser.name,
      userAvatar: currentUser.avatar,
      action: 'Priority Changed',
      oldValue: currentIssue.priority,
      newValue: updates.priority,
      source: 'USER',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  const updatedIssue: Issue = {
    ...currentIssue,
    ...updates,
    updatedAt: new Date().toISOString(),
    version: currentIssue.version + 1
  };
  issues[issueIndex] = updatedIssue;
  auditLogs = [...auditEntries, ...auditLogs];

  let automationLogs: any[] = [];
  if (updates.statusId && updates.statusId !== currentIssue.statusId) {
    automations.forEach(rule => {
      const exec = AutomationEngine.evaluateRule(
        rule,
        { type: 'STATUS_CHANGED' },
        updatedIssue,
        1,
        false
      );
      if (exec && exec.mutatedIssue) {
        issues[issueIndex] = exec.mutatedIssue;
        automationLogs.push(exec.log);
      }
    });
  }

  return res.json({
    issue: issues[issueIndex],
    wipLimitWarning,
    auditLogs: auditEntries,
    automationLogs
  });
});

// POST /api/github/webhook
app.post('/api/github/webhook', (req: Request, res: Response): any => {
  const { eventType, issueKey, prNumber, prStatus, branchName, ciStatus } = req.body;
  const issueIndex = issues.findIndex(i => i.key === issueKey);

  if (issueIndex === -1) {
    return res.status(404).json({ error: `Issue ${issueKey} not found` });
  }

  const targetIssue = issues[issueIndex];

  targetIssue.github = {
    repoName: 'beyond/pm-backend',
    branchName: branchName || targetIssue.github?.branchName || `feature/${issueKey}`,
    prNumber: prNumber || targetIssue.github?.prNumber || 309,
    prTitle: `feat: GitHub webhook automated sync for ${issueKey}`,
    prStatus: prStatus || 'APPROVED',
    ciStatus: ciStatus || 'SUCCESS',
    deploymentStage: eventType === 'DEPLOYMENT_SUCCESS' ? 'PRODUCTION' : 'STAGING'
  };

  const logs: any[] = [];
  automations.forEach(rule => {
    const exec = AutomationEngine.evaluateRule(rule, { type: eventType }, targetIssue, 1, false);
    if (exec && exec.mutatedIssue) {
      issues[issueIndex] = exec.mutatedIssue;
      logs.push(exec.log);
    }
  });

  const audit: AuditLog = {
    id: `al-gh-${Date.now()}`,
    issueKey,
    user: 'GitHub Webhook Engine',
    action: `GitHub Event: ${eventType}`,
    newValue: `PR #${targetIssue.github.prNumber} (${targetIssue.github.prStatus})`,
    source: 'GITHUB',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  auditLogs.unshift(audit);

  return res.json({
    message: `GitHub webhook processed for ${issueKey}`,
    issue: issues[issueIndex],
    automationLogs: logs
  });
});

// GET /api/dependencies/analysis
app.get('/api/dependencies/analysis', (req: Request, res: Response) => {
  const analysis = DependencyGraphEngine.analyzeDependencies(issues);
  res.json(analysis);
});

// GET /api/automations
app.get('/api/automations', (req: Request, res: Response) => {
  res.json({ automations });
});

// POST /api/automations/dry-run
app.post('/api/automations/dry-run', (req: Request, res: Response): any => {
  const { ruleId, issueKey } = req.body;
  const rule = automations.find(a => a.id === ruleId);
  const issue = issues.find(i => i.key === issueKey);

  if (!rule || !issue) {
    return res.status(404).json({ error: 'Rule or Issue not found for dry-run simulation' });
  }

  const dryRunResult = AutomationEngine.evaluateRule(rule, { type: rule.trigger.type }, issue, 1, true);

  return res.json({ dryRunResult });
});

// GET /api/audit-logs
app.get('/api/audit-logs', (req: Request, res: Response) => {
  res.json({ auditLogs });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`BeyondPM Server Engine running on http://localhost:${PORT}`);
});
