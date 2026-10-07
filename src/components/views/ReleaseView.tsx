import React from 'react';
import { Release, Issue } from '../../types';
import { IconRenderer } from '../ui/IconRenderer';

interface ReleaseViewProps {
  releases: Release[];
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
}

export const ReleaseView: React.FC<ReleaseViewProps> = ({ releases, issues, onIssueClick }) => {
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="font-heading font-bold text-lg text-white">Release Management & Readiness</h2>
          <p className="text-xs text-slate-400 font-mono">Track feature completion, bug counts, and deployment stage readiness across software releases</p>
        </div>
        <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5">
          <IconRenderer name="Plus" size={14} />
          <span>Cut New Release</span>
        </button>
      </div>

      <div className="space-y-6">
        {releases.map(rel => {
          const relIssues = issues.filter(i => i.releaseId === rel.id);
          const completedCount = relIssues.filter(i => i.statusId === 'status-done').length;
          const bugCount = relIssues.filter(i => i.type === 'BUG' || i.type === 'INCIDENT').length;
          const percent = relIssues.length > 0 ? Math.round((completedCount / relIssues.length) * 100) : 0;

          return (
            <div key={rel.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <span className="font-heading font-black text-2xl text-indigo-400 font-mono">{rel.version}</span>
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-100">{rel.title}</h3>
                    <p className="text-xs text-slate-400 font-mono">Target Date: {rel.releaseDate}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Readiness</div>
                    <div className="text-lg font-bold text-emerald-400 font-mono">{percent}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Bugs / Incidents</div>
                    <div className="text-lg font-bold text-rose-400 font-mono">{bugCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Total Tickets</div>
                    <div className="text-lg font-bold text-slate-200 font-mono">{relIssues.length}</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 border border-slate-800 rounded-full h-3 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Release Tickets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {relIssues.map(issue => (
                  <div
                    key={issue.id}
                    onClick={() => onIssueClick(issue)}
                    className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 cursor-pointer flex items-center justify-between text-xs hover:border-indigo-500/50 transition-all"
                  >
                    <div className="truncate pr-2">
                      <span className="font-mono text-indigo-400 font-bold mr-2">{issue.key}</span>
                      <span className="text-slate-200 font-semibold">{issue.title}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] shrink-0">
                      {issue.statusId}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
