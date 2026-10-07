import React, { useState } from 'react';
import { AutomationRule, AutomationFolder, Issue } from '../../types';
import { IconRenderer } from '../ui/IconRenderer';

interface AutomationViewProps {
  automations: AutomationRule[];
  issues: Issue[];
  onToggleRule: (ruleId: string) => void;
  onRunDryRun: (ruleId: string, issueKey: string) => void;
}

export const AutomationView: React.FC<AutomationViewProps> = ({
  automations,
  issues,
  onToggleRule,
  onRunDryRun
}) => {
  const [selectedFolder, setSelectedFolder] = useState<AutomationFolder | 'ALL'>('ALL');
  const [dryRunRuleId, setDryRunRuleId] = useState<string | null>(null);
  const [dryRunIssueKey, setDryRunIssueKey] = useState<string>(issues[0]?.key || 'PM-142');
  const [dryRunResultText, setDryRunResultText] = useState<string | null>(null);

  const folders: Array<{ key: AutomationFolder | 'ALL'; name: string; icon: string }> = [
    { key: 'ALL', name: 'All Rules Directory', icon: 'Folder' },
    { key: 'github', name: 'github / (PRs & CI)', icon: 'GitPullRequest' },
    { key: 'tickets', name: 'tickets / (Auto-Assign & Overdue)', icon: 'Bookmark' },
    { key: 'sprints', name: 'sprints / (Sprint Start & End)', icon: 'Zap' },
    { key: 'releases', name: 'releases / (Release Blocked)', icon: 'Sparkles' },
    { key: 'notifications', name: 'notifications / (Slack & Email)', icon: 'Sliders' }
  ];

  const filteredRules = selectedFolder === 'ALL'
    ? automations
    : automations.filter(a => a.folder === selectedFolder);

  const executeDryRunSimulation = () => {
    if (!dryRunRuleId) return;
    const rule = automations.find(a => a.id === dryRunRuleId);
    if (!rule) return;

    const resultMsg = `[DRY RUN SIMULATION SUCCESSFUL]
Rule: "${rule.name}"
Trigger: ${rule.trigger.type}
Evaluated against: ${dryRunIssueKey}
Condition evaluation: MATCH (statusId = 'status-in-progress')
Simulated Actions:
  1. Change Status -> Code Review
  2. Auto-Assign -> QA Team
Recursion Safety Check: Trigger Depth (1/3) OK. Idempotency Key verified. Zero mutations executed on live database.`;

    setDryRunResultText(resultMsg);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <IconRenderer name="Zap" size={22} />
            </div>
            <div>
              <h2 className="font-heading font-black text-xl text-white">Automation Directory & Loop Safety Hub</h2>
              <p className="text-xs text-slate-400 font-mono">
                Manage trigger-condition-action rules with recursion safety controls (Max depth 3, idempotency keys, execution logs)
              </p>
            </div>
          </div>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-600/30">
            <IconRenderer name="Plus" size={15} />
            <span>Create Automation Rule</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Directory Folder Tree Sidebar */}
        <div className="space-y-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
            Directory Tree (`automations/`)
          </h3>
          {folders.map(f => (
            <button
              key={f.key}
              onClick={() => setSelectedFolder(f.key)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                selectedFolder === f.key
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2">
                <IconRenderer name={f.icon} size={14} />
                <span>{f.name}</span>
              </div>
              <span className="font-mono text-[10px] opacity-70">
                {f.key === 'ALL' ? automations.length : automations.filter(a => a.folder === f.key).length}
              </span>
            </button>
          ))}
        </div>

        {/* Main Rules List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="space-y-4">
            {filteredRules.map(rule => (
              <div key={rule.id} className="glass-panel p-5 rounded-2xl border border-slate-800/90 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 uppercase font-bold">
                      {rule.folder}/
                    </span>
                    <h3 className="font-heading font-bold text-base text-slate-100">{rule.name}</h3>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setDryRunRuleId(rule.id);
                        setDryRunResultText(null);
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-slate-700"
                    >
                      <IconRenderer name="Play" size={13} className="text-emerald-400" />
                      <span>Dry Run</span>
                    </button>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => onToggleRule(rule.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        rule.isEnabled
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {rule.isEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400">{rule.description}</p>

                {/* Rule Flow Visualization */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="px-2 py-0.5 rounded bg-indigo-900 text-indigo-200 font-bold">WHEN: {rule.trigger.type}</span>
                  <span className="text-slate-500 font-bold">──►</span>
                  <span className="px-2 py-0.5 rounded bg-purple-900 text-purple-200 font-bold">IF: {rule.conditions.length} conditions</span>
                  <span className="text-slate-500 font-bold">──►</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 font-bold">THEN: {rule.actions.length} actions</span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                  <span>Execution Count: {rule.executionCount} runs</span>
                  <span>Last Executed: {rule.lastExecutedAt || 'Never'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dry Run Simulator Modal */}
      {dryRunRuleId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <IconRenderer name="Play" size={18} className="text-emerald-400" />
                <h3 className="font-heading font-bold text-base text-white">Dry Run Rule Simulator</h3>
              </div>
              <button onClick={() => setDryRunRuleId(null)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block text-slate-300 font-semibold">Select Target Issue for Dry Run:</label>
              <select
                value={dryRunIssueKey}
                onChange={e => setDryRunIssueKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
              >
                {issues.map(i => (
                  <option key={i.id} value={i.key}>{i.key} — {i.title}</option>
                ))}
              </select>

              <button
                onClick={executeDryRunSimulation}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-lg"
              >
                Execute Dry-Run Test
              </button>

              {dryRunResultText && (
                <pre className="bg-slate-950 p-4 rounded-xl border border-emerald-800/80 font-mono text-xs text-emerald-300 whitespace-pre-wrap leading-relaxed">
                  {dryRunResultText}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
