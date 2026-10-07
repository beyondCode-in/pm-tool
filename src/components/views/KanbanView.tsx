import React, { useState } from 'react';
import { Issue, IssueStatus, CardDensity, CardFieldConfig, IssueTypeConfig, PriorityConfig, User } from '../../types';
import { IssueCard } from '../ui/IssueCard';
import { IconRenderer } from '../ui/IconRenderer';

interface KanbanViewProps {
  issues: Issue[];
  statuses: IssueStatus[];
  types: IssueTypeConfig[];
  priorities: PriorityConfig[];
  users: User[];
  density: CardDensity;
  cardFields: CardFieldConfig;
  onIssueClick: (issue: Issue) => void;
  onStatusChange: (issueId: string, newStatusId: string) => void;
  onOpenCreateModal: (defaultStatusId?: string) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  issues,
  statuses,
  types,
  priorities,
  users,
  density,
  cardFields,
  onIssueClick,
  onStatusChange,
  onOpenCreateModal
}) => {
  const [swimlane, setSwimlane] = useState<'NONE' | 'PRIORITY' | 'ASSIGNEE'>('NONE');

  const renderColumnCards = (columnIssues: Issue[]) => (
    <div className="space-y-3 min-h-[150px]">
      {columnIssues.map(issue => (
        <IssueCard
          key={issue.id}
          issue={issue}
          density={density}
          fieldsConfig={cardFields}
          types={types}
          priorities={priorities}
          statuses={statuses}
          users={users}
          onClick={onIssueClick}
        />
      ))}
      {columnIssues.length === 0 && (
        <div className="border border-dashed border-slate-800/80 rounded-xl p-6 text-center text-xs text-slate-500 font-mono">
          Drop tickets here
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 p-4">
      {/* Swimlane Control Bar */}
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <IconRenderer name="Sliders" size={14} className="text-indigo-400" />
          <span className="font-semibold text-slate-200">Group Swimlanes By:</span>
          <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => setSwimlane('NONE')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${
                swimlane === 'NONE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              None (Columns Only)
            </button>
            <button
              onClick={() => setSwimlane('PRIORITY')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${
                swimlane === 'PRIORITY' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Priority
            </button>
            <button
              onClick={() => setSwimlane('ASSIGNEE')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${
                swimlane === 'ASSIGNEE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Assignee
            </button>
          </div>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          Showing {issues.length} active issues across {statuses.length} columns
        </div>
      </div>

      {/* Main Kanban Board Layout */}
      {swimlane === 'NONE' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-start">
          {statuses.map(status => {
            const columnIssues = issues.filter(i => i.statusId === status.id);
            const isWipExceeded = status.wipLimit ? columnIssues.length > status.wipLimit : false;

            return (
              <div
                key={status.id}
                className={`bg-slate-900/40 rounded-xl p-3 border transition-all ${
                  isWipExceeded ? 'wip-exceeded bg-rose-950/20' : 'border-slate-800/80'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                    <h3 className="font-heading font-bold text-sm text-slate-200">{status.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-xs font-semibold">
                      {columnIssues.length}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {status.wipLimit && (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          isWipExceeded
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                        title={`Work In Progress Limit: ${status.wipLimit}`}
                      >
                        WIP: {columnIssues.length}/{status.wipLimit}
                      </span>
                    )}
                    <button
                      onClick={() => onOpenCreateModal(status.id)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded transition-all"
                      title={`Quick create issue in ${status.name}`}
                    >
                      <IconRenderer name="Plus" size={14} />
                    </button>
                  </div>
                </div>

                {/* Cards Container */}
                {renderColumnCards(columnIssues)}
              </div>
            );
          })}
        </div>
      ) : (
        /* Swimlanes Layout */
        <div className="space-y-6">
          {(swimlane === 'PRIORITY' ? priorities : users).map(group => {
            const groupKey = swimlane === 'PRIORITY' ? group.id : (group as User).id;
            const groupName = swimlane === 'PRIORITY' ? (group as any).name : (group as User).name;

            return (
              <div key={groupKey} className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                  <IconRenderer name={swimlane === 'PRIORITY' ? 'ChevronUp' : 'User'} size={15} className="text-indigo-400" />
                  <h3 className="font-heading font-bold text-sm text-slate-100">{groupName.toUpperCase()}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {statuses.map(status => {
                    const columnIssues = issues.filter(i => 
                      i.statusId === status.id &&
                      (swimlane === 'PRIORITY' ? i.priority === groupKey : i.assigneeId === groupKey)
                    );

                    return (
                      <div key={status.id} className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/60">
                        <div className="text-[11px] font-semibold text-slate-400 mb-2 flex justify-between">
                          <span>{status.name}</span>
                          <span className="font-mono text-slate-500">{columnIssues.length}</span>
                        </div>
                        {renderColumnCards(columnIssues)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
