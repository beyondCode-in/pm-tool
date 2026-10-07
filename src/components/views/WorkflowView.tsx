import React from 'react';
import { Workflow, IssueStatus, SystemRole } from '../../types';
import { IconRenderer } from '../ui/IconRenderer';

interface WorkflowViewProps {
  workflow: Workflow;
  statuses: IssueStatus[];
}

export const WorkflowView: React.FC<WorkflowViewProps> = ({ workflow, statuses }) => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <IconRenderer name="Workflow" size={22} />
            </div>
            <div>
              <h2 className="font-heading font-black text-xl text-white">{workflow.name}</h2>
              <p className="text-xs text-slate-400 font-mono">
                Dynamic state machine configuration: transition rules, role permissions, conditions & validators
              </p>
            </div>
          </div>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-2">
            <IconRenderer name="Plus" size={15} />
            <span>Add Transition Rule</span>
          </button>
        </div>
      </div>

      {/* State Graph Visual Pipeline */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 overflow-x-auto space-y-4">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Workflow State Pipeline</h3>
        <div className="flex items-center space-x-3 py-2 min-w-[700px]">
          {statuses.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center space-y-1 min-w-[120px]">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                <div className="font-heading font-bold text-xs text-slate-200">{s.name}</div>
                {s.wipLimit && (
                  <div className="text-[10px] font-mono text-indigo-400">WIP Max: {s.wipLimit}</div>
                )}
              </div>
              {idx < statuses.length - 1 && (
                <div className="text-slate-600 font-bold font-mono text-sm">──►</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Transition Rules Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 font-mono text-xs text-slate-300 font-bold">
          Configured Transition Guardrails ({workflow.transitions.length} Rules)
        </div>
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Transition Name</th>
              <th className="py-3 px-4">From State</th>
              <th className="py-3 px-4">To State</th>
              <th className="py-3 px-4">Required Roles</th>
              <th className="py-3 px-4">Conditions</th>
              <th className="py-3 px-4">Validators</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {workflow.transitions.map(t => {
              const fromStatus = statuses.find(s => s.id === t.fromStatusId)?.name;
              const toStatus = statuses.find(s => s.id === t.toStatusId)?.name;

              return (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-100">{t.name}</td>
                  <td className="py-3 px-4 font-mono text-indigo-300">{fromStatus}</td>
                  <td className="py-3 px-4 font-mono text-emerald-300">{toStatus}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {t.requiredRoles.map(r => (
                        <span key={r} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {t.conditions.length > 0 ? t.conditions.map(c => c.type).join(', ') : 'None'}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {t.validators.length > 0 ? t.validators.map(v => v.type).join(', ') : 'None'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
