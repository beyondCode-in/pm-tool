import React from 'react';
import { Issue, IssueTypeConfig, PriorityConfig } from '../../types';
import { IconRenderer } from '../ui/IconRenderer';

interface TimelineViewProps {
  issues: Issue[];
  types: IssueTypeConfig[];
  priorities: PriorityConfig[];
  onIssueClick: (issue: Issue) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  issues,
  types,
  priorities,
  onIssueClick
}) => {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="font-heading font-bold text-lg text-white">Gantt & Timeline Schedule</h2>
          <p className="text-xs text-slate-400 font-mono">Visualizing delivery milestones, sprint targets, and epic timelines across October 2026</p>
        </div>
        <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
          <span className="flex items-center space-x-1"><span className="w-3 h-3 rounded bg-purple-500 inline-block"/><span>Epics</span></span>
          <span className="flex items-center space-x-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block"/><span>Stories</span></span>
          <span className="flex items-center space-x-1"><span className="w-3 h-3 rounded bg-cyan-500 inline-block"/><span>Tasks</span></span>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-x-auto p-4 space-y-3">
        {/* Days Header */}
        <div className="grid grid-cols-12 gap-2 text-center text-xs font-mono text-slate-500 border-b border-slate-800 pb-2">
          <span>Oct 1</span><span>Oct 3</span><span>Oct 5</span><span>Oct 7</span>
          <span>Oct 9</span><span>Oct 11</span><span>Oct 13</span><span>Oct 15</span>
          <span>Oct 17</span><span>Oct 19</span><span>Oct 21</span><span>Oct 23</span>
        </div>

        {/* Timeline Bars per Issue */}
        <div className="space-y-2.5">
          {issues.map((issue, index) => {
            const typeConfig = types.find(t => t.id === issue.type) || types[0];
            const startCol = (index * 2) % 6 + 1;
            const spanCol = (index % 4) + 3;

            return (
              <div
                key={issue.id}
                onClick={() => onIssueClick(issue)}
                className="grid grid-cols-12 gap-2 items-center hover:bg-slate-800/30 p-2 rounded-lg transition-colors cursor-pointer group"
              >
                {/* Title & Key */}
                <div className="col-span-3 flex items-center space-x-2 truncate">
                  <span className="font-mono text-xs font-bold text-indigo-400 shrink-0">{issue.key}</span>
                  <span className="text-xs text-slate-200 font-semibold truncate group-hover:text-indigo-300">{issue.title}</span>
                </div>

                {/* Timeline Bar */}
                <div className="col-span-9 relative h-7 bg-slate-950/60 rounded border border-slate-800/80 p-0.5 flex items-center">
                  <div
                    className="absolute h-6 rounded-md shadow-md flex items-center px-2 text-[11px] font-semibold text-white truncate transition-all"
                    style={{
                      left: `${(startCol / 12) * 100}%`,
                      width: `${(spanCol / 12) * 100}%`,
                      backgroundColor: typeConfig.color
                    }}
                  >
                    <IconRenderer name={typeConfig.icon} size={12} className="mr-1 shrink-0" />
                    <span className="truncate">{issue.title}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
