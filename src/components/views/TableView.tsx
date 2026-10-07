import React from 'react';
import { Issue, IssueTypeConfig, PriorityConfig, IssueStatus, User } from '../../types';
import { IconRenderer } from '../ui/IconRenderer';

interface TableViewProps {
  issues: Issue[];
  types: IssueTypeConfig[];
  priorities: PriorityConfig[];
  statuses: IssueStatus[];
  users: User[];
  onIssueClick: (issue: Issue) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  issues,
  types,
  priorities,
  statuses,
  users,
  onIssueClick
}) => {
  return (
    <div className="p-4">
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center text-xs font-mono text-slate-400">
          <span>Configurable Grid Columns: [ Key, Type, Title, Status, Priority, Assignee, SLA, Security Level, GitHub Link ]</span>
          <span className="text-indigo-400 font-bold">{issues.length} Rows</span>
        </div>
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
                <th className="py-3 px-4">SLA</th>
                <th className="py-3 px-4">Security Level</th>
                <th className="py-3 px-4">GitHub Link</th>
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
                    onClick={() => onIssueClick(issue)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-4 font-mono font-bold text-indigo-400">{issue.key}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: typeConfig.color }}>
                        {typeConfig.name}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-100 max-w-xs truncate group-hover:text-indigo-200">{issue.title}</td>
                    <td className="py-2.5 px-4 font-semibold" style={{ color: statusConfig?.color }}>{statusConfig?.name}</td>
                    <td className="py-2.5 px-4 font-semibold" style={{ color: priorityConfig.color }}>{priorityConfig.name}</td>
                    <td className="py-2.5 px-4">{assignee ? assignee.name : 'Unassigned'}</td>
                    <td className="py-2.5 px-4 font-mono">{issue.sla ? issue.sla.resolutionStatus : '-'}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">{issue.securityLevel}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px]">
                      {issue.github ? `#${issue.github.prNumber} (${issue.github.prStatus})` : '-'}
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
