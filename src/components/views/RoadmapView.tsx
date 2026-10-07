import React from 'react';
import { Issue } from '../../types';
import { IconRenderer } from '../ui/IconRenderer';

interface RoadmapViewProps {
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({ issues, onIssueClick }) => {
  const quarters = [
    { key: 'Q1', title: 'Q1 2026 — Core Architecture & Security', color: 'indigo' },
    { key: 'Q2', title: 'Q2 2026 — GitHub Automations & Webhooks', color: 'purple' },
    { key: 'Q3', title: 'Q3 2026 — AI Assistant & Custom Views', color: 'pink' },
    { key: 'Q4', title: 'Q4 2026 — Enterprise Multi-Tenant Scale', color: 'emerald' }
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="font-heading font-bold text-lg text-white">Strategic Product Roadmap</h2>
          <p className="text-xs text-slate-400 font-mono">Quarterly strategic initiatives, epic alignment, and release targets</p>
        </div>
        <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5">
          <IconRenderer name="Plus" size={14} />
          <span>New Initiative</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quarters.map((q, idx) => {
          const qIssues = issues.slice(idx * 2, idx * 2 + 2);

          return (
            <div key={q.key} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-heading font-black text-lg text-indigo-400">{q.key}</span>
                <span className="text-[11px] font-mono font-semibold text-slate-400">{qIssues.length} Epics</span>
              </div>
              <h3 className="font-heading font-bold text-sm text-slate-200">{q.title}</h3>

              <div className="space-y-3">
                {qIssues.map(issue => (
                  <div
                    key={issue.id}
                    onClick={() => onIssueClick(issue)}
                    className="glass-card p-3 rounded-xl border border-slate-800/80 cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-indigo-400 font-bold">{issue.key}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{issue.statusId}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-100 line-clamp-2">{issue.title}</h4>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full w-2/3" />
                    </div>
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
