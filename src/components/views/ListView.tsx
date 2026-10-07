import React from 'react';
import { Issue, IssueTypeConfig, PriorityConfig, IssueStatus, User } from '../../types';
import { IconRenderer } from '../ui/IconRenderer';

interface ListViewProps {
  issues: Issue[];
  types: IssueTypeConfig[];
  priorities: PriorityConfig[];
  statuses: IssueStatus[];
  users: User[];
  onIssueClick: (issue: Issue) => void;
  onStatusChange: (issueId: string, newStatusId: string) => void;
  onPriorityChange: (issueId: string, newPriority: any) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  issues,
  types,
  priorities,
  statuses,
  users,
  onIssueClick,
  onStatusChange,
  onPriorityChange
}) => {
  return (
    <div className="p-4">
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Key</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Story Pts</th>
                <th className="py-3 px-4">PR Link</th>
                <th className="py-3 px-4">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {issues.map(issue => {
                const typeConfig = types.find(t => t.id === issue.type) || types[0];
                const priorityConfig = priorities.find(p => p.id === issue.priority) || priorities[0];
                const statusConfig = statuses.find(s => s.id === issue.statusId);
                const assignee = users.find(u => u.id === issue.assigneeId);

                return (
                  <tr
                    key={issue.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    onClick={() => onIssueClick(issue)}
                  >
                    <td className="py-2.5 px-4 font-mono font-bold text-indigo-400">
                      {issue.key}
                    </td>

                    <td className="py-2.5 px-4">
                      <span
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: typeConfig.color }}
                      >
                        <IconRenderer name={typeConfig.icon} size={11} />
                        <span>{typeConfig.name}</span>
                      </span>
                    </td>

                    <td className="py-2.5 px-4 font-semibold text-slate-100 max-w-md truncate group-hover:text-indigo-200">
                      {issue.title}
                    </td>

                    <td className="py-2.5 px-4" onClick={e => e.stopPropagation()}>
                      <select
                        value={issue.statusId}
                        onChange={e => onStatusChange(issue.id, e.target.value)}
                        className="bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-xs text-slate-200 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                        style={{ borderLeftColor: statusConfig?.color, borderLeftWidth: '4px' }}
                      >
                        {statuses.map(s => (
                          <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-2.5 px-4" onClick={e => e.stopPropagation()}>
                      <select
                        value={issue.priority}
                        onChange={e => onPriorityChange(issue.id, e.target.value)}
                        className="bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                        style={{ color: priorityConfig.color }}
                      >
                        {priorities.map(p => (
                          <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-2.5 px-4">
                      {assignee ? (
                        <div className="flex items-center space-x-2">
                          <img src={assignee.avatar} alt={assignee.name} className="w-5 h-5 rounded-full border border-slate-700" />
                          <span className="text-slate-300 truncate">{assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 font-mono text-slate-300">
                      {issue.storyPoints !== undefined ? `${issue.storyPoints} pts` : '-'}
                    </td>

                    <td className="py-2.5 px-4 font-mono">
                      {issue.github ? (
                        <span className="text-indigo-400 bg-indigo-950/60 border border-indigo-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                          #{issue.github.prNumber} ({issue.github.prStatus})
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                      {new Date(issue.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
