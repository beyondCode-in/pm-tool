import React from 'react';
import { Issue, CardDensity, CardFieldConfig, IssueTypeConfig, PriorityConfig, IssueStatus, User } from '../../types';
import { IconRenderer } from './IconRenderer';

interface IssueCardProps {
  issue: Issue;
  density: CardDensity;
  fieldsConfig: CardFieldConfig;
  types: IssueTypeConfig[];
  priorities: PriorityConfig[];
  statuses: IssueStatus[];
  users: User[];
  onClick: (issue: Issue) => void;
  onQuickStatusChange?: (issueId: string, newStatusId: string) => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  density,
  fieldsConfig,
  types,
  priorities,
  statuses,
  users,
  onClick
}) => {
  const typeConfig = types.find(t => t.id === issue.type) || types[0];
  const priorityConfig = priorities.find(p => p.id === issue.priority) || priorities[0];
  const assignee = users.find(u => u.id === issue.assigneeId);
  const statusConfig = statuses.find(s => s.id === issue.statusId);

  const completedSubtasks = issue.subtasks.filter(s => s.completed).length;
  const totalSubtasks = issue.subtasks.length;

  if (density === 'COMPACT') {
    return (
      <div
        onClick={() => onClick(issue)}
        className="glass-card p-2.5 rounded-lg border cursor-pointer flex items-center justify-between text-xs space-x-2 select-none"
      >
        <div className="flex items-center space-x-2 min-w-0">
          <span className="font-mono text-indigo-400 font-semibold">{issue.key}</span>
          <span className="truncate text-slate-200 font-medium">{issue.title}</span>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: priorityConfig.color }} title={`Priority: ${priorityConfig.name}`} />
          {assignee && (
            <img src={assignee.avatar} alt={assignee.name} className="w-5 h-5 rounded-full border border-slate-700" title={`Assignee: ${assignee.name}`} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick(issue)}
      className="glass-card p-3.5 rounded-xl border border-slate-800/80 cursor-pointer space-y-3 select-none relative group"
    >
      {/* Header: Issue Key, Type Badge, Priority */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span
            className="flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-semibold text-white shadow-sm"
            style={{ backgroundColor: typeConfig.color }}
          >
            <IconRenderer name={typeConfig.icon} size={12} />
            <span>{typeConfig.name.toUpperCase()}</span>
          </span>
          <span className="font-mono text-xs text-indigo-300 font-bold">{issue.key}</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <span
            className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${priorityConfig.color}22`, color: priorityConfig.color, border: `1px solid ${priorityConfig.color}44` }}
          >
            <IconRenderer name={priorityConfig.icon} size={11} />
            <span>{priorityConfig.name}</span>
          </span>
          {issue.storyPoints !== undefined && fieldsConfig.showStoryPoints && (
            <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[11px] font-mono font-semibold border border-slate-700">
              {issue.storyPoints} pts
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug group-hover:text-indigo-200 transition-colors">
        {issue.title}
      </h4>

      {/* Detailed Description Preview (Only in DETAILED mode) */}
      {density === 'DETAILED' && issue.description && (
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed bg-slate-950/50 p-2 rounded border border-slate-800/50">
          {issue.description}
        </p>
      )}

      {/* Badges & Indicators Row */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        {/* GitHub Link Badge */}
        {issue.github && fieldsConfig.showGitHubStatus && (
          <span
            className={`flex items-center space-x-1 px-2 py-0.5 rounded border font-mono ${
              issue.github.prStatus === 'APPROVED' || issue.github.prStatus === 'MERGED'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/80'
            }`}
          >
            <IconRenderer name="GitPullRequest" size={11} />
            <span>#{issue.github.prNumber}</span>
            <span className="text-[9px] uppercase px-1 rounded bg-slate-900/80">{issue.github.prStatus}</span>
          </span>
        )}

        {/* SLA Status Indicator */}
        {issue.sla && fieldsConfig.showSLA && (
          <span
            className={`flex items-center space-x-1 px-2 py-0.5 rounded border ${
              issue.sla.resolutionStatus === 'HEALTHY'
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                : 'bg-rose-950/50 text-rose-300 border-rose-800/80 animate-pulse'
            }`}
          >
            <IconRenderer name="Clock" size={11} />
            <span>SLA: {issue.sla.resolutionStatus}</span>
          </span>
        )}

        {/* Risk Badge */}
        {issue.risk && density === 'DETAILED' && (
          <span className="px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/50 font-semibold">
            Risk: {issue.risk}
          </span>
        )}

        {/* Labels */}
        {fieldsConfig.showLabels && issue.labels.map(label => (
          <span key={label} className="px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60 text-[10px]">
            #{label}
          </span>
        ))}
      </div>

      {/* Footer: Subtasks progress & Assignee */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs text-slate-400">
        {totalSubtasks > 0 && fieldsConfig.showSubtaskProgress ? (
          <div className="flex items-center space-x-1.5 text-slate-300">
            <IconRenderer name="CheckSquare" size={12} className="text-indigo-400" />
            <span className="font-mono text-[11px]">{completedSubtasks}/{totalSubtasks} subtasks</span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-500 font-mono">{statusConfig?.name || issue.statusId}</span>
        )}

        <div className="flex items-center space-x-2">
          {issue.dueDate && fieldsConfig.showDueDate && (
            <span className="text-[10px] text-slate-400 font-mono">Due {new Date(issue.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          )}
          {assignee ? (
            <img
              src={assignee.avatar}
              alt={assignee.name}
              className="w-6 h-6 rounded-full border border-indigo-500/50 shadow"
              title={`Assignee: ${assignee.name}`}
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-500">
              ?
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
