import React, { useState, useEffect } from 'react';
import { ViewType, CardDensity, SavedView, Issue, IssueStatus, IssueTypeConfig, PriorityConfig, User, Sprint, Release, AuditLog, AutomationRule, Workflow } from './types/index.ts';
import { DEFAULT_ISSUE_TYPES, DEFAULT_PRIORITIES, DEFAULT_STATUSES, DEFAULT_USERS, DEFAULT_CUSTOM_FIELDS, DEFAULT_WORKFLOW, DEFAULT_AUTOMATIONS, DEFAULT_SAVED_VIEWS } from './constants/defaults.ts';
import { INITIAL_ISSUES, INITIAL_SPRINTS, INITIAL_RELEASES, INITIAL_AUDIT_LOGS } from './constants/mockIssues.ts';
import { Navbar } from './components/layout/Navbar';
import { KanbanView } from './components/views/KanbanView';
import { ScrumView } from './components/views/ScrumView';
import { ListView } from './components/views/ListView';
import { TableView } from './components/views/TableView';
import { TimelineView } from './components/views/TimelineView';
import { RoadmapView } from './components/views/RoadmapView';
import { CalendarView } from './components/views/CalendarView';
import { DependencyGraphView } from './components/views/DependencyGraphView';
import { MatrixView } from './components/views/MatrixView';
import { ReleaseView } from './components/views/ReleaseView';
import { AutomationView } from './components/views/AutomationView';
import { WorkflowView } from './components/views/WorkflowView';
import { DashboardView } from './components/views/DashboardView';
import { SettingsView } from './components/views/SettingsView';
import { CommandPalette } from './components/shared/CommandPalette';
import { IssueModal } from './components/shared/IssueModal';
import { WorkflowEngine } from './engine/WorkflowEngine';
import { IconRenderer } from './components/ui/IconRenderer';

export const App: React.FC = () => {
  // App Domain State
  const [issues, setIssues] = useState<Issue[]>(INITIAL_ISSUES);
  const [sprints] = useState<Sprint[]>(INITIAL_SPRINTS);
  const [releases] = useState<Release[]>(INITIAL_RELEASES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [automations, setAutomations] = useState<AutomationRule[]>(DEFAULT_AUTOMATIONS);
  const [savedViews] = useState<SavedView[]>(DEFAULT_SAVED_VIEWS);
  const [workflow] = useState<Workflow>(DEFAULT_WORKFLOW);
  const [statuses] = useState<IssueStatus[]>(DEFAULT_STATUSES);
  const [types] = useState<IssueTypeConfig[]>(DEFAULT_ISSUE_TYPES);
  const [priorities] = useState<PriorityConfig[]>(DEFAULT_PRIORITIES);
  const [users] = useState<User[]>(DEFAULT_USERS);

  // GitHub Sidebar State
  const [sidebarFilter, setSidebarFilter] = useState<'RECENT' | 'CREATED_BY_ME' | 'PROJECTS' | 'TEMPLATES'>('RECENT');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('BeyondPM Core Engine');

  // UI View & Density State
  const [currentView, setCurrentView] = useState<ViewType>('KANBAN');
  const [density, setDensity] = useState<CardDensity>('STANDARD');
  const [activeTab, setActiveTab] = useState<'BOARD' | 'AUTOMATIONS' | 'WORKFLOWS' | 'DASHBOARD' | 'SETTINGS'>('BOARD');
  const [activeSavedViewId, setActiveSavedViewId] = useState<string>('view-kanban-all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals State
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [wipWarning, setWipWarning] = useState<string | null>(null);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setSelectedIssue(null);
        setIsIssueModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredIssues = searchQuery
    ? issues.filter(i => 
        i.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.labels.some(l => l.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : issues;

  const handleSaveIssue = (issueData: Partial<Issue>) => {
    if (issueData.id) {
      setIssues(issues.map(i => i.id === issueData.id ? { ...i, ...issueData, updatedAt: new Date().toISOString() } : i));
    } else {
      const newKey = `PM-${150 + issues.length + 1}`;
      const newIssue: Issue = {
        id: `iss-${Date.now()}`,
        key: newKey,
        projectId: 'proj-1',
        type: issueData.type || 'TASK',
        title: issueData.title || 'Untitled Ticket',
        description: issueData.description || '',
        statusId: issueData.statusId || 'status-backlog',
        priority: issueData.priority || 'MEDIUM',
        assigneeId: issueData.assigneeId,
        reporterId: 'u-1',
        teamId: 'Backend',
        sprintId: issueData.sprintId,
        releaseId: issueData.releaseId,
        epicId: issueData.epicId,
        labels: [],
        storyPoints: issueData.storyPoints || 3,
        securityLevel: 'PROJECT',
        relations: [],
        subtasks: issueData.subtasks || [],
        customFields: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };
      setIssues([newIssue, ...issues]);

      const audit: AuditLog = {
        id: `al-${Date.now()}`,
        issueKey: newKey,
        user: 'Akshay',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        action: 'Issue Created',
        newValue: `${newIssue.type} created`,
        source: 'USER',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setAuditLogs([audit, ...auditLogs]);
    }
  };

  const handleStatusTransition = (issueId: string, targetStatusId: string) => {
    const targetIssue = issues.find(i => i.id === issueId);
    if (!targetIssue) return;

    const check = WorkflowEngine.canTransition(
      targetIssue,
      targetStatusId,
      workflow,
      users[0],
      issues,
      statuses
    );

    if (!check.allowed) {
      alert(`Workflow Restriction Error: ${check.reason}`);
      return;
    }

    if (check.wipLimitWarning) {
      setWipWarning(check.wipLimitWarning);
      setTimeout(() => setWipWarning(null), 5000);
    }

    setIssues(issues.map(i => i.id === issueId ? { ...i, statusId: targetStatusId, updatedAt: new Date().toISOString() } : i));

    const oldStatusName = statuses.find(s => s.id === targetIssue.statusId)?.name;
    const newStatusName = statuses.find(s => s.id === targetStatusId)?.name;

    const audit: AuditLog = {
      id: `al-${Date.now()}`,
      issueKey: targetIssue.key,
      user: 'Akshay',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      action: 'Status Transition',
      oldValue: oldStatusName,
      newValue: newStatusName,
      source: 'USER',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAuditLogs([audit, ...auditLogs]);
  };

  const githubTemplatesList = [
    { id: 't-1', name: 'BeyondPM Core Engine', badge: 'Private template', updated: '#14 updated 2 hours ago' },
    { id: 't-2', name: 'mockat-v2', badge: 'Private template', updated: '#14 updated on May 13' },
    { id: 't-3', name: 'NKE-nkrf', badge: 'Private template', updated: '#28 updated on Aug 14' },
    { id: 't-4', name: 'synergy', badge: 'Private template', updated: '#25 updated on Mar 13' },
    { id: 't-5', name: 'Admin-Management-Dashboard - H', badge: 'Private', updated: '#26 updated on Aug 14' },
    { id: 't-6', name: 'EmployeeManagementSystem-Q4-T1-2025 - H', badge: 'Private', updated: '#20 updated on Apr 9' },
    { id: 't-7', name: 'GigMatchAI - M', badge: 'Private', updated: '#10 updated on Apr 9' },
    { id: 't-8', name: 'SyncChat - H', badge: 'Private', updated: '#21 updated on Aug 14' }
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col font-sans">
      {/* GitHub Navigation Header */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        density={density}
        onDensityChange={setDensity}
        savedViews={savedViews}
        activeSavedViewId={activeSavedViewId}
        onSelectSavedView={sv => {
          setActiveSavedViewId(sv.id);
          setCurrentView(sv.type);
          setDensity(sv.density);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCreateModal={() => {
          setSelectedIssue(null);
          setIsIssueModalOpen(true);
        }}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* WIP Limit Alert Banner */}
      {wipWarning && (
        <div className="bg-[#4c2889]/90 border-b border-[#a371f7]/80 px-4 py-2 text-xs font-mono text-[#f0f6fc] flex items-center justify-between z-30">
          <span>⚠️ {wipWarning}</span>
          <button onClick={() => setWipWarning(null)} className="text-[#a371f7] font-bold">Dismiss</button>
        </div>
      )}

      {/* Main GitHub Organization Layout with Left Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left GitHub Projects Sidebar */}
        <aside className="w-64 bg-[#0d1117] border-r border-[#30363d] p-4 hidden md:block space-y-4 shrink-0">
          <div className="space-y-1">
            <button
              onClick={() => setSidebarFilter('RECENT')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs font-semibold flex items-center space-x-2 transition-all ${
                sidebarFilter === 'RECENT' ? 'bg-[#21262d] text-[#58a6ff]' : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]'
              }`}
            >
              <IconRenderer name="Clock" size={14} />
              <span>Recently viewed</span>
            </button>

            <button
              onClick={() => setSidebarFilter('CREATED_BY_ME')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs font-semibold flex items-center space-x-2 transition-all ${
                sidebarFilter === 'CREATED_BY_ME' ? 'bg-[#21262d] text-[#58a6ff]' : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]'
              }`}
            >
              <IconRenderer name="User" size={14} />
              <span>Created by me</span>
            </button>

            <button
              onClick={() => setSidebarFilter('PROJECTS')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs font-semibold flex items-center space-x-2 transition-all ${
                sidebarFilter === 'PROJECTS' ? 'bg-[#21262d] text-[#58a6ff]' : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]'
              }`}
            >
              <IconRenderer name="Kanban" size={14} />
              <span>Projects</span>
            </button>

            <button
              onClick={() => setSidebarFilter('TEMPLATES')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs font-semibold flex items-center space-x-2 transition-all ${
                sidebarFilter === 'TEMPLATES' ? 'bg-[#21262d] text-[#58a6ff]' : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]'
              }`}
            >
              <IconRenderer name="Sparkles" size={14} />
              <span>Templates</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#30363d] space-y-2">
            <div className="text-[11px] font-mono font-bold text-[#8b949e] uppercase tracking-wider px-2">
              GitHub Templates ({githubTemplatesList.length})
            </div>
            <div className="space-y-1">
              {githubTemplatesList.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTemplateName(t.name)}
                  className={`p-2 rounded-md text-xs cursor-pointer transition-all ${
                    selectedTemplateName === t.name
                      ? 'bg-[#161b22] border border-[#30363d] text-[#f0f6fc]'
                      : 'text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9]'
                  }`}
                >
                  <div className="font-semibold truncate flex items-center justify-between">
                    <span className="truncate">{t.name}</span>
                  </div>
                  <div className="text-[10px] text-[#8b949e] font-mono mt-0.5">{t.updated}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Content View Switcher */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'BOARD' && (
            <>
              {currentView === 'KANBAN' && (
                <KanbanView
                  issues={filteredIssues}
                  statuses={statuses}
                  types={types}
                  priorities={priorities}
                  users={users}
                  density={density}
                  cardFields={savedViews[0].cardFields}
                  onIssueClick={issue => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}
                  onStatusChange={handleStatusTransition}
                  onOpenCreateModal={() => { setSelectedIssue(null); setIsIssueModalOpen(true); }}
                />
              )}
              {currentView === 'SCRUM' && (
                <ScrumView
                  issues={filteredIssues}
                  sprints={sprints}
                  types={types}
                  priorities={priorities}
                  statuses={statuses}
                  users={users}
                  onIssueClick={issue => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}
                />
              )}
              {currentView === 'LIST' && (
                <ListView
                  issues={filteredIssues}
                  types={types}
                  priorities={priorities}
                  statuses={statuses}
                  users={users}
                  onIssueClick={issue => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}
                  onStatusChange={handleStatusTransition}
                  onPriorityChange={() => {}}
                />
              )}
              {currentView === 'TABLE' && (
                <TableView
                  issues={filteredIssues}
                  types={types}
                  priorities={priorities}
                  statuses={statuses}
                  users={users}
                  onIssueClick={issue => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}
                />
              )}
              {currentView === 'TIMELINE' && (
                <TimelineView
                  issues={filteredIssues}
                  types={types}
                  priorities={priorities}
                  onIssueClick={issue => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}
                />
              )}
              {currentView === 'ROADMAP' && (
                <RoadmapView
                  issues={filteredIssues}
                  onIssueClick={issue => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}
                />
              )}
              {currentView === 'CALENDAR' && (
                <CalendarView
                  issues={filteredIssues}
                  onIssueClick={issue => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}
                />
              )}
              {currentView === 'DEPENDENCY' && (
                <DependencyGraphView
                  issues={filteredIssues}
                  onIssueClick={issue => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}
                />
              )}
              {currentView === 'MATRIX' && (
                <MatrixView
                  issues={filteredIssues}
                  onIssueClick={issue => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}
                />
              )}
              {currentView === 'RELEASE' && (
                <ReleaseView
                  releases={releases}
                  issues={filteredIssues}
                  onIssueClick={issue => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}
                />
              )}
            </>
          )}

          {activeTab === 'AUTOMATIONS' && (
            <AutomationView
              automations={automations}
              issues={issues}
              onToggleRule={id => setAutomations(automations.map(a => a.id === id ? { ...a, isEnabled: !a.isEnabled } : a))}
              onRunDryRun={() => {}}
            />
          )}

          {activeTab === 'WORKFLOWS' && (
            <WorkflowView workflow={workflow} statuses={statuses} />
          )}

          {activeTab === 'DASHBOARD' && (
            <DashboardView issues={issues} sprints={sprints} />
          )}

          {activeTab === 'SETTINGS' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        issues={issues}
        onSelectIssue={issue => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}
        onSelectView={setCurrentView}
        onOpenCreateModal={() => { setSelectedIssue(null); setIsIssueModalOpen(true); }}
        onOpenAutomations={() => setActiveTab('AUTOMATIONS')}
      />

      <IssueModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        issue={selectedIssue}
        types={types}
        priorities={priorities}
        statuses={statuses}
        users={users}
        sprints={sprints}
        releases={releases}
        auditLogs={auditLogs}
        allIssues={issues}
        onSaveIssue={handleSaveIssue}
        onStatusTransition={handleStatusTransition}
      />
    </div>
  );
};
