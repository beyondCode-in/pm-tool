import React from 'react';
import { Issue } from '../../types';
import { DependencyGraphEngine } from '../../engine/DependencyGraphEngine';
import { IconRenderer } from '../ui/IconRenderer';

interface DependencyGraphViewProps {
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
}

export const DependencyGraphView: React.FC<DependencyGraphViewProps> = ({ issues, onIssueClick }) => {
  const analysis = DependencyGraphEngine.analyzeDependencies(issues);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="font-heading font-bold text-lg text-white">Dependency Graph & Cycle Detector</h2>
          <p className="text-xs text-slate-400 font-mono">Analyzing {analysis.nodesCount} nodes and {analysis.edgesCount} dependency relationships</p>
        </div>
        <div className="flex items-center space-x-2">
          {analysis.hasCircularDependency ? (
            <span className="px-3 py-1 bg-rose-950 text-rose-300 border border-rose-800 rounded-lg text-xs font-bold flex items-center space-x-1.5 animate-pulse">
              <IconRenderer name="AlertTriangle" size={14} />
              <span>CIRCULAR DEPENDENCY DETECTED</span>
            </span>
          ) : (
            <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg text-xs font-bold flex items-center space-x-1.5">
              <IconRenderer name="CheckCircle2" size={14} />
              <span>GRAPH VALIDATED (NO LOOPS)</span>
            </span>
          )}
        </div>
      </div>

      {/* Circular Dependency Warning Alert Banner */}
      {analysis.hasCircularDependency && (
        <div className="bg-rose-950/40 border-2 border-rose-700/80 rounded-2xl p-5 space-y-3 shadow-2xl">
          <div className="flex items-center space-x-3 text-rose-200">
            <IconRenderer name="AlertOctagon" size={24} className="text-rose-400 shrink-0" />
            <div>
              <h3 className="font-heading font-bold text-base text-rose-100">Critical Architecture Warning</h3>
              <p className="text-xs text-rose-300">Circular dependency detected! Tickets block each other in a closed loop, halting automated releases.</p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-rose-800/60">
            {analysis.cycles.map((cycle, idx) => (
              <div key={idx} className="bg-slate-950/80 p-3 rounded-xl border border-rose-800/80 font-mono text-xs text-rose-300 flex items-center space-x-2">
                <IconRenderer name="GitMerge" size={14} className="text-rose-400 shrink-0" />
                <span>{cycle.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dependency Map Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {issues.map(issue => {
          const blocksRelations = issue.relations.filter(r => r.type === 'BLOCKS');
          const blockedByRelations = issue.relations.filter(r => r.type === 'BLOCKED_BY');

          return (
            <div
              key={issue.id}
              onClick={() => onIssueClick(issue)}
              className="glass-card p-4 rounded-xl border border-slate-800 space-y-3 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-400">{issue.key}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {issue.statusId}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-slate-100">{issue.title}</h4>

              {/* Relations Breakdown */}
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs font-mono">
                {blocksRelations.length > 0 && (
                  <div className="bg-amber-950/40 border border-amber-800/50 p-2 rounded text-amber-300 space-y-1">
                    <span className="font-bold flex items-center space-x-1">
                      <IconRenderer name="ArrowRight" size={12} />
                      <span>BLOCKS ({blocksRelations.length}):</span>
                    </span>
                    {blocksRelations.map(r => (
                      <div key={r.id} className="pl-3 text-[11px] text-amber-200">
                        ──► <span className="font-bold">{r.targetIssueKey}</span>: {r.targetTitle}
                      </div>
                    ))}
                  </div>
                )}

                {blockedByRelations.length > 0 && (
                  <div className="bg-rose-950/40 border border-rose-800/50 p-2 rounded text-rose-300 space-y-1">
                    <span className="font-bold flex items-center space-x-1">
                      <IconRenderer name="ShieldAlert" size={12} />
                      <span>BLOCKED BY ({blockedByRelations.length}):</span>
                    </span>
                    {blockedByRelations.map(r => (
                      <div key={r.id} className="pl-3 text-[11px] text-rose-200">
                        ◄── <span className="font-bold">{r.targetIssueKey}</span>: {r.targetTitle}
                      </div>
                    ))}
                  </div>
                )}

                {blocksRelations.length === 0 && blockedByRelations.length === 0 && (
                  <div className="text-slate-500 italic text-[11px]">No active blockages</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
