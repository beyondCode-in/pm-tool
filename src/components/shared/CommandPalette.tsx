import React, { useState, useEffect } from 'react';
import { Issue, ViewType } from '../../types';
import { IconRenderer } from '../ui/IconRenderer';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onSelectView: (view: ViewType) => void;
  onOpenCreateModal: () => void;
  onOpenAutomations: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  issues,
  onSelectIssue,
  onSelectView,
  onOpenCreateModal,
  onOpenAutomations
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent listener
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredIssues = query
    ? issues.filter(i => i.key.toLowerCase().includes(query.toLowerCase()) || i.title.toLowerCase().includes(query.toLowerCase()))
    : issues.slice(0, 5);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-start justify-center pt-20 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl space-y-0">
        {/* Search Header */}
        <div className="flex items-center px-4 border-b border-slate-800 bg-slate-950">
          <IconRenderer name="Command" size={16} className="text-indigo-400 mr-3" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search issues (e.g. PM-142, assign, kanban)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent py-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">ESC to exit</span>
        </div>

        <div className="p-3 max-h-[400px] overflow-y-auto space-y-4 text-xs">
          {/* Quick Action Commands */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase px-2 mb-1">Quick Actions</div>
            <div
              onClick={() => { onOpenCreateModal(); onClose(); }}
              className="p-2.5 rounded-xl hover:bg-indigo-600/20 hover:text-indigo-200 text-slate-300 font-semibold cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <IconRenderer name="Plus" size={14} className="text-indigo-400" />
                <span>Create New Issue</span>
              </div>
              <span className="font-mono text-[10px] opacity-60">Hotkey: C</span>
            </div>

            <div
              onClick={() => { onSelectView('KANBAN'); onClose(); }}
              className="p-2.5 rounded-xl hover:bg-indigo-600/20 hover:text-indigo-200 text-slate-300 font-semibold cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <IconRenderer name="Kanban" size={14} className="text-indigo-400" />
                <span>Switch to Kanban Board</span>
              </div>
            </div>

            <div
              onClick={() => { onOpenAutomations(); onClose(); }}
              className="p-2.5 rounded-xl hover:bg-indigo-600/20 hover:text-indigo-200 text-slate-300 font-semibold cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <IconRenderer name="Zap" size={14} className="text-indigo-400" />
                <span>Open Automation Directory</span>
              </div>
            </div>
          </div>

          {/* Issue Results */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase px-2 mb-1">Recent Issues</div>
            {filteredIssues.map(issue => (
              <div
                key={issue.id}
                onClick={() => { onSelectIssue(issue); onClose(); }}
                className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-2 min-w-0 pr-2">
                  <span className="font-mono text-indigo-400 font-bold">{issue.key}</span>
                  <span className="truncate text-slate-200 font-medium">{issue.title}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 shrink-0">
                  {issue.statusId}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
