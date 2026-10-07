import React from 'react';
import { ViewType, CardDensity, SavedView } from '../../types/index.ts';
import { IconRenderer } from '../ui/IconRenderer';

interface NavbarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  density: CardDensity;
  onDensityChange: (density: CardDensity) => void;
  savedViews: SavedView[];
  activeSavedViewId?: string;
  onSelectSavedView: (view: SavedView) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCreateModal: () => void;
  onOpenCommandPalette: () => void;
  activeTab: 'BOARD' | 'AUTOMATIONS' | 'WORKFLOWS' | 'DASHBOARD' | 'SETTINGS';
  onTabChange: (tab: 'BOARD' | 'AUTOMATIONS' | 'WORKFLOWS' | 'DASHBOARD' | 'SETTINGS') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  density,
  onDensityChange,
  savedViews,
  activeSavedViewId,
  onSelectSavedView,
  searchQuery,
  onSearchChange,
  onOpenCreateModal,
  onOpenCommandPalette,
  activeTab,
  onTabChange
}) => {
  const views: Array<{ type: ViewType; label: string; icon: string }> = [
    { type: 'KANBAN', label: 'Kanban Board', icon: 'Kanban' },
    { type: 'SCRUM', label: 'Scrum Sprint', icon: 'Box' },
    { type: 'LIST', label: 'List View', icon: 'List' },
    { type: 'TABLE', label: 'Table Grid', icon: 'Table' },
    { type: 'TIMELINE', label: 'Timeline Gantt', icon: 'GitMerge' },
    { type: 'ROADMAP', label: 'Roadmap Q1-Q4', icon: 'BarChart3' },
    { type: 'CALENDAR', label: 'Calendar', icon: 'Calendar' },
    { type: 'DEPENDENCY', label: 'Dependency Graph', icon: 'Sliders' },
    { type: 'MATRIX', label: '2x2 Matrix', icon: 'Grid' },
    { type: 'RELEASE', label: 'Release Readiness', icon: 'Sparkles' }
  ];

  return (
    <header className="bg-[#010409] border-b border-[#30363d] sticky top-0 z-40">
      {/* 1. GitHub Top Navigation Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#21262d]">
        <div className="flex items-center space-x-3">
          {/* GitHub Octocat Icon */}
          <div className="text-white hover:text-slate-300 cursor-pointer">
            <svg height="28" viewBox="0 0 16 16" width="28" fill="currentColor">
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
            </svg>
          </div>

          <span className="font-semibold text-sm text-[#f0f6fc] cursor-pointer hover:underline">
            beyondCode-in
          </span>
          <span className="text-xs text-[#8b949e]">/</span>
          <span className="font-semibold text-sm text-[#f0f6fc] cursor-pointer hover:underline flex items-center space-x-1">
            <span>Projects Template Engine</span>
            <span className="github-badge ml-1">Private template</span>
          </span>
        </div>

        {/* Global Search & User Navigation */}
        <div className="flex items-center space-x-3">
          {/* GitHub Style Search Bar */}
          <div
            onClick={onOpenCommandPalette}
            className="w-64 bg-[#0d1117] border border-[#30363d] rounded-md px-2.5 py-1 text-xs text-[#8b949e] flex items-center justify-between cursor-pointer hover:border-[#8b949e] transition-colors"
          >
            <div className="flex items-center space-x-2">
              <IconRenderer name="Search" size={13} className="text-[#8b949e]" />
              <span>Type <kbd className="px-1 py-0.2 bg-[#21262d] border border-[#30363d] rounded text-[10px] text-[#c9d1d9]">Cmd+K</kbd> to search</span>
            </div>
          </div>

          {/* New Issue / New Project Green Button */}
          <button
            onClick={onOpenCreateModal}
            className="github-btn-green px-3 py-1 rounded-md text-xs flex items-center space-x-1.5 shadow-sm active:scale-95"
          >
            <IconRenderer name="Plus" size={14} />
            <span>New item</span>
          </button>

          {/* User Profile Avatar */}
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
            alt="beyondCode-in"
            className="w-6 h-6 rounded-full border border-[#30363d] cursor-pointer"
            title="beyondCode-in (Owner)"
          />
        </div>
      </div>

      {/* 2. GitHub Organization Nav Tabs */}
      <div className="px-4 flex items-center space-x-6 text-xs font-semibold text-[#8b949e] border-b border-[#21262d]">
        <button className="py-2.5 hover:text-[#c9d1d9] flex items-center space-x-1.5">
          <IconRenderer name="Folder" size={14} />
          <span>Overview</span>
        </button>

        <button className="py-2.5 hover:text-[#c9d1d9] flex items-center space-x-1.5">
          <IconRenderer name="GitBranch" size={14} />
          <span>Repositories</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#21262d] text-[#8b949e] text-[10px] font-mono">15</span>
        </button>

        <button
          onClick={() => onTabChange('BOARD')}
          className={`py-2.5 flex items-center space-x-1.5 border-b-2 font-semibold transition-all ${
            activeTab === 'BOARD'
              ? 'border-[#f0883e] text-[#f0f6fc]'
              : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          <IconRenderer name="Kanban" size={14} />
          <span>Projects</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#21262d] text-[#c9d1d9] text-[10px] font-mono">16</span>
        </button>

        <button
          onClick={() => onTabChange('AUTOMATIONS')}
          className={`py-2.5 flex items-center space-x-1.5 border-b-2 font-semibold transition-all ${
            activeTab === 'AUTOMATIONS'
              ? 'border-[#f0883e] text-[#f0f6fc]'
              : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          <IconRenderer name="Zap" size={14} />
          <span>Automations</span>
        </button>

        <button
          onClick={() => onTabChange('WORKFLOWS')}
          className={`py-2.5 flex items-center space-x-1.5 border-b-2 font-semibold transition-all ${
            activeTab === 'WORKFLOWS'
              ? 'border-[#f0883e] text-[#f0f6fc]'
              : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          <IconRenderer name="Workflow" size={14} />
          <span>Workflows</span>
        </button>

        <button
          onClick={() => onTabChange('DASHBOARD')}
          className={`py-2.5 flex items-center space-x-1.5 border-b-2 font-semibold transition-all ${
            activeTab === 'DASHBOARD'
              ? 'border-[#f0883e] text-[#f0f6fc]'
              : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          <IconRenderer name="BarChart3" size={14} />
          <span>Insights</span>
        </button>

        <button
          onClick={() => onTabChange('SETTINGS')}
          className={`py-2.5 flex items-center space-x-1.5 border-b-2 font-semibold transition-all ${
            activeTab === 'SETTINGS'
              ? 'border-[#f0883e] text-[#f0f6fc]'
              : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          <IconRenderer name="Settings" size={14} />
          <span>Settings</span>
        </button>
      </div>

      {/* 3. GitHub Projects Views & Filter Toolbar (Only when activeTab === 'BOARD') */}
      {activeTab === 'BOARD' && (
        <div className="px-4 py-2 bg-[#161b22] flex items-center justify-between border-b border-[#30363d]">
          {/* GitHub Project View Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
            {views.map(v => (
              <button
                key={v.type}
                onClick={() => onViewChange(v.type)}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
                  currentView === v.type
                    ? 'bg-[#21262d] text-[#58a6ff] border border-[#30363d]'
                    : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]/50'
                }`}
              >
                <IconRenderer name={v.icon} size={13} />
                <span>{v.label}</span>
              </button>
            ))}
          </div>

          {/* GitHub Filter Input & Density Picker */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Filter Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="is:open label:backend..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="w-48 bg-[#0d1117] border border-[#30363d] rounded-md px-2.5 py-1 text-xs text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
              />
            </div>

            {/* Density Picker */}
            <div className="flex items-center bg-[#0d1117] border border-[#30363d] rounded-md p-0.5 text-xs text-[#8b949e]">
              <button
                onClick={() => onDensityChange('COMPACT')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                  density === 'COMPACT' ? 'bg-[#21262d] text-[#58a6ff]' : 'hover:text-[#c9d1d9]'
                }`}
              >
                Compact
              </button>
              <button
                onClick={() => onDensityChange('STANDARD')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                  density === 'STANDARD' ? 'bg-[#21262d] text-[#58a6ff]' : 'hover:text-[#c9d1d9]'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => onDensityChange('DETAILED')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                  density === 'DETAILED' ? 'bg-[#21262d] text-[#58a6ff]' : 'hover:text-[#c9d1d9]'
                }`}
              >
                Detailed
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
