import React from 'react';
import { Issue, Sprint } from '../../types';
import { IconRenderer } from '../ui/IconRenderer';

interface DashboardViewProps {
  issues: Issue[];
  sprints: Sprint[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ issues, sprints }) => {
  const activeSprint = sprints[0];
  const criticalCount = issues.filter(i => i.priority === 'CRITICAL' || i.priority === 'HIGHEST').length;
  const bugCount = issues.filter(i => i.type === 'BUG' || i.type === 'INCIDENT').length;
  const slaHealthyCount = issues.filter(i => i.sla?.resolutionStatus === 'HEALTHY').length;

  return (
    <div className="p-6 space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
        <h2 className="font-heading font-black text-2xl text-white">Engineering Executive Dashboard</h2>
        <p className="text-xs text-slate-400 font-mono">Real-time metrics on team velocity, burndown, issue distribution, SLA health, and PR throughput</p>
      </div>

      {/* KPI Cards Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>Sprint Velocity</span>
            <IconRenderer name="TrendingUp" size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">21 / 34 pts</div>
          <div className="text-[10px] text-slate-500 font-mono">61% Sprint 12 Goal Completion</div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>Critical Blockers</span>
            <IconRenderer name="AlertTriangle" size={14} className="text-rose-400" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">{criticalCount}</div>
          <div className="text-[10px] text-slate-500 font-mono">High priority attention needed</div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>SLA Health Rate</span>
            <IconRenderer name="Clock" size={14} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-black font-mono text-indigo-400">100%</div>
          <div className="text-[10px] text-slate-500 font-mono">{slaHealthyCount} active SLA clocks healthy</div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>Bugs & Incidents</span>
            <IconRenderer name="Bug" size={14} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">{bugCount}</div>
          <div className="text-[10px] text-slate-500 font-mono">Production defect density</div>
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 1: Burndown Simulation */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h3 className="font-heading font-bold text-sm text-slate-100">Sprint 12 Burndown Chart</h3>
            <span className="font-mono text-xs text-indigo-400 font-bold">34 pts initial scope</span>
          </div>
          <div className="h-44 bg-slate-950 rounded-xl border border-slate-800 p-4 flex items-end justify-between space-x-2">
            {[34, 31, 28, 24, 21, 15, 12, 8, 4, 0].map((val, idx) => (
              <div key={idx} className="flex-1 bg-indigo-600/80 hover:bg-indigo-500 rounded-t transition-all" style={{ height: `${(val / 34) * 100}%` }}>
                <span className="text-[9px] font-mono text-indigo-200 block text-center mt-1">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 2: Priority Breakdown */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h3 className="font-heading font-bold text-sm text-slate-100">Issue Type Distribution</h3>
            <span className="font-mono text-xs text-slate-400">{issues.length} Total</span>
          </div>
          <div className="space-y-2.5 pt-2">
            {[
              { type: 'BUG', count: 2, color: 'bg-rose-500' },
              { type: 'EPIC', count: 1, color: 'bg-purple-500' },
              { type: 'FEATURE', count: 1, color: 'bg-indigo-500' },
              { type: 'STORY', count: 1, color: 'bg-blue-500' },
              { type: 'INCIDENT', count: 1, color: 'bg-red-700' }
            ].map(item => (
              <div key={item.type} className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>{item.type}</span>
                  <span>{item.count} tickets</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className={`${item.color} h-full`} style={{ width: `${(item.count / issues.length) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
