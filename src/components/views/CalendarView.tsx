import React from 'react';
import { Issue } from '../../types';

interface CalendarViewProps {
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ issues, onIssueClick }) => {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <h2 className="font-heading font-bold text-lg text-white">October 2026 Delivery Calendar</h2>
        <span className="text-xs text-slate-400 font-mono">Mapped by due date & release milestones</span>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono text-slate-400 font-bold mb-2">
        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const dayString = `2026-10-${day < 10 ? '0' + day : day}`;
          const dayIssues = issues.filter(i => i.dueDate === dayString);

          return (
            <div key={day} className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-2 min-h-[100px] space-y-1">
              <div className="text-right text-[11px] font-mono text-slate-500 font-bold">{day}</div>
              {dayIssues.map(issue => (
                <div
                  key={issue.id}
                  onClick={() => onIssueClick(issue)}
                  className="bg-indigo-950/80 border border-indigo-800/80 p-1.5 rounded text-[10px] text-indigo-200 font-semibold cursor-pointer truncate hover:bg-indigo-900 transition-colors"
                >
                  <span className="font-mono font-bold mr-1">{issue.key}</span>
                  <span>{issue.title}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
