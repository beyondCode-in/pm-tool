import React from 'react';
import { Issue } from '../../types';

interface MatrixViewProps {
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
}

export const MatrixView: React.FC<MatrixViewProps> = ({ issues, onIssueClick }) => {
  const highImpactHighEffort = issues.filter(i => (i.storyPoints || 0) >= 8 && ['CRITICAL', 'HIGHEST', 'HIGH'].includes(i.priority));
  const highImpactLowEffort = issues.filter(i => (i.storyPoints || 0) < 8 && ['CRITICAL', 'HIGHEST', 'HIGH'].includes(i.priority));
  const lowImpactHighEffort = issues.filter(i => (i.storyPoints || 0) >= 8 && ['MEDIUM', 'LOW', 'LOWEST'].includes(i.priority));
  const lowImpactLowEffort = issues.filter(i => (i.storyPoints || 0) < 8 && ['MEDIUM', 'LOW', 'LOWEST'].includes(i.priority));

  const renderQuadrant = (title: string, badge: string, badgeColor: string, quadrantIssues: Issue[]) => (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-3 min-h-[200px]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="font-heading font-bold text-sm text-slate-100">{title}</h3>
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${badgeColor}`}>
          {badge}
        </span>
      </div>
      <div className="space-y-2">
        {quadrantIssues.map(issue => (
          <div
            key={issue.id}
            onClick={() => onIssueClick(issue)}
            className="glass-card p-2.5 rounded-lg border border-slate-800 cursor-pointer flex items-center justify-between text-xs"
          >
            <div className="truncate pr-2">
              <span className="font-mono text-indigo-400 font-bold mr-2">{issue.key}</span>
              <span className="text-slate-200 font-semibold">{issue.title}</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400 shrink-0">{issue.storyPoints || 0} pts</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <h2 className="font-heading font-bold text-lg text-white">2x2 Impact vs Effort Prioritization Matrix</h2>
        <p className="text-xs text-slate-400 font-mono">Evaluate return on investment to decide what to build now versus later</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderQuadrant('High Impact / High Effort', 'Evaluate Strategy', 'bg-purple-950 text-purple-300 border border-purple-800', highImpactHighEffort)}
        {renderQuadrant('High Impact / Low Effort', 'DO NOW (QUICK WINS)', 'bg-emerald-950 text-emerald-300 border border-emerald-800', highImpactLowEffort)}
        {renderQuadrant('Low Impact / High Effort', 'De-prioritize / Later', 'bg-rose-950 text-rose-300 border border-rose-800', lowImpactHighEffort)}
        {renderQuadrant('Low Impact / Low Effort', 'Fillers / Maybe', 'bg-slate-800 text-slate-300 border border-slate-700', lowImpactLowEffort)}
      </div>
    </div>
  );
};
