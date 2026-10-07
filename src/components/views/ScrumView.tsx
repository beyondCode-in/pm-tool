import React from 'react';
import { Issue, Sprint, IssueTypeConfig, PriorityConfig, IssueStatus, User } from '../../types';
import { IssueCard } from '../ui/IssueCard';
import { IconRenderer } from '../ui/IconRenderer';

interface ScrumViewProps {
  issues: Issue[];
  sprints: Sprint[];
  types: IssueTypeConfig[];
  priorities: PriorityConfig[];
  statuses: IssueStatus[];
  users: User[];
  onIssueClick: (issue: Issue) => void;
}

export const ScrumView: React.FC<ScrumViewProps> = ({
  issues,
  sprints,
  types,
  priorities,
  statuses,
  users,
  onIssueClick
}) => {
  const activeSprint = sprints.find(s => s.status === 'ACTIVE') || sprints[0];
  const activeSprintIssues = issues.filter(i => i.sprintId === activeSprint.id);
  const backlogIssues = issues.filter(i => !i.sprintId || i.sprintId !== activeSprint.id);

  const completedPoints = activeSprintIssues
    .filter(i => i.statusId === 'status-done')
    .reduce((acc, i) => acc + (i.storyPoints || 0), 0);
  const totalPoints = activeSprintIssues.reduce((acc, i) => acc + (i.storyPoints || 0), 0);
  const progressPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  return (
    <div className="p-4 space-y-6">
      {/* Active Sprint Header & Burndown Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold uppercase">
                Active Sprint
              </span>
              <h2 className="font-heading font-black text-xl text-white">{activeSprint.name}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Goal: {activeSprint.goal} | {activeSprint.startDate} to {activeSprint.endDate}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-xs text-slate-400 font-mono">Sprint Capacity</div>
              <div className="text-lg font-bold text-indigo-400 font-mono">{completedPoints} / {totalPoints} pts</div>
            </div>
            <div className="w-32 bg-slate-900 border border-slate-800 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Active Sprint vs Product Backlog */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Sprint Issues */}
        <div className="space-y-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <IconRenderer name="Zap" size={16} className="text-indigo-400" />
              <h3 className="font-heading font-bold text-base text-slate-100">Active Sprint Commitments</h3>
            </div>
            <span className="text-xs font-mono text-slate-400 font-semibold">{activeSprintIssues.length} tickets</span>
          </div>

          <div className="space-y-3">
            {activeSprintIssues.map(issue => (
              <IssueCard
                key={issue.id}
                issue={issue}
                density="STANDARD"
                fieldsConfig={{
                  showKey: true, showTitle: true, showType: true, showPriority: true, showStatus: true,
                  showAssignee: true, showSprint: true, showEpic: true, showLabels: false, showStoryPoints: true,
                  showDueDate: false, showSLA: true, showGitHubStatus: true, showSubtaskProgress: true
                }}
                types={types}
                priorities={priorities}
                statuses={statuses}
                users={users}
                onClick={onIssueClick}
              />
            ))}
          </div>
        </div>

        {/* Right: Product Backlog */}
        <div className="space-y-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <IconRenderer name="List" size={16} className="text-indigo-400" />
              <h3 className="font-heading font-bold text-base text-slate-100">Product Backlog (Unassigned to Sprint)</h3>
            </div>
            <span className="text-xs font-mono text-slate-400 font-semibold">{backlogIssues.length} tickets</span>
          </div>

          <div className="space-y-3">
            {backlogIssues.map(issue => (
              <IssueCard
                key={issue.id}
                issue={issue}
                density="STANDARD"
                fieldsConfig={{
                  showKey: true, showTitle: true, showType: true, showPriority: true, showStatus: true,
                  showAssignee: true, showSprint: false, showEpic: false, showLabels: true, showStoryPoints: true,
                  showDueDate: true, showSLA: false, showGitHubStatus: false, showSubtaskProgress: false
                }}
                types={types}
                priorities={priorities}
                statuses={statuses}
                users={users}
                onClick={onIssueClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
