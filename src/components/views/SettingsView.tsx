import React, { useState } from 'react';
import { IconRenderer } from '../ui/IconRenderer';

export const SettingsView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('General');

  const sections = [
    'General', 'Issue Types', 'Statuses', 'Workflows', 'Fields', 'Priorities', 'Labels',
    'Boards', 'Sprints', 'Releases', 'Automations', 'Integrations', 'Members', 'Teams',
    'Roles', 'Permissions', 'Notifications', 'Templates', 'Security', 'Audit Logs', 'Import / Export', 'Advanced'
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
        <h2 className="font-heading font-black text-2xl text-white">Project & Workspace Settings</h2>
        <p className="text-xs text-slate-400 font-mono">Configure custom issue hierarchies, ticket color schemes, custom fields, granular RBAC, and integrations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Categories Sidebar */}
        <div className="space-y-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-3 max-h-[600px] overflow-y-auto">
          {sections.map((sec, idx) => (
            <button
              key={sec}
              onClick={() => setActiveSection(sec)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activeSection === sec
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <span>{sec}</span>
              <span className="font-mono text-[10px] opacity-60">#{idx + 1}</span>
            </button>
          ))}
        </div>

        {/* Section Content Panel */}
        <div className="lg:col-span-3 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-heading font-bold text-lg text-white">{activeSection} Configuration</h3>
            <p className="text-xs text-slate-400 font-mono">Manage workspace level rules and guardrails for {activeSection}</p>
          </div>

          {activeSection === 'General' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Project Name</label>
                <input type="text" defaultValue="BeyondPM Core Engine" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200" />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Project Key Prefix</label>
                <input type="text" defaultValue="PM" className="w-28 bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono uppercase font-bold" />
              </div>
            </div>
          )}

          {activeSection === 'Issue Types' && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-400">Configure hierarchy levels, colors, and icons for each issue type:</p>
              <div className="space-y-2">
                {['Initiative', 'Epic', 'Feature', 'User Story', 'Task', 'Subtask', 'Bug', 'Incident', 'Security Defect'].map(t => (
                  <div key={t} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="font-semibold text-slate-200">{t}</span>
                    <span className="text-indigo-400 font-mono text-[11px]">Parent-Child Hierarchy Verified</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection !== 'General' && activeSection !== 'Issue Types' && (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-xs font-mono text-slate-400 space-y-2">
              <IconRenderer name="Settings" size={24} className="mx-auto text-indigo-400" />
              <div>{activeSection} configurations loaded from workspace policy defaults.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
