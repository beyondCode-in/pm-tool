import React, { useState } from 'react';
import { Issue, IssueTypeConfig, PriorityConfig, IssueStatus, User, Sprint, Release, AuditLog } from '../../types';
import { IconRenderer } from '../ui/IconRenderer';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue | null;
  types: IssueTypeConfig[];
  priorities: PriorityConfig[];
  statuses: IssueStatus[];
  users: User[];
  sprints: Sprint[];
  releases: Release[];
  auditLogs: AuditLog[];
  allIssues: Issue[];
  onSaveIssue: (issueData: Partial<Issue>) => void;
  onStatusTransition: (issueId: string, targetStatusId: string) => void;
}

export const IssueModal: React.FC<IssueModalProps> = ({
  isOpen,
  onClose,
  issue,
  types,
  priorities,
  statuses,
  users,
  sprints,
  releases,
  auditLogs,
  allIssues,
  onSaveIssue,
  onStatusTransition
}) => {
  const isEditing = !!issue;

  const [title, setTitle] = useState(issue?.title || '');
  const [type, setType] = useState(issue?.type || 'TASK');
  const [description, setDescription] = useState(issue?.description || '');
  const [priority, setPriority] = useState(issue?.priority || 'MEDIUM');
  const [statusId, setStatusId] = useState(issue?.statusId || 'status-backlog');
  const [assigneeId, setAssigneeId] = useState(issue?.assigneeId || '');
  const [sprintId, setSprintId] = useState(issue?.sprintId || '');
  const [releaseId, setReleaseId] = useState(issue?.releaseId || '');
  const [epicId, setEpicId] = useState(issue?.epicId || '');
  const [storyPoints, setStoryPoints] = useState(issue?.storyPoints || 3);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [subtasks, setSubtasks] = useState(issue?.subtasks || []);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedTypeConfig = types.find(t => t.id === type) || types[0];
  const allowedParentIssues = allIssues.filter(i => selectedTypeConfig.allowedParentTypes.includes(i.type as any));
  const issueAuditLogs = issue ? auditLogs.filter(a => a.issueKey === issue.key) : [];

  const handleStatusChange = (newStatus: string) => {
    setStatusId(newStatus);
    if (isEditing && issue) {
      onStatusTransition(issue.id, newStatus);
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([...subtasks, { id: `st-${Date.now()}`, title: newSubtaskTitle.trim(), completed: false }]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (stId: string) => {
    setSubtasks(subtasks.map(s => s.id === stId ? { ...s, completed: !s.completed } : s));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveIssue({
      id: issue?.id,
      title,
      type,
      description,
      priority,
      statusId,
      assigneeId: assigneeId || undefined,
      sprintId: sprintId || undefined,
      releaseId: releaseId || undefined,
      epicId: epicId || undefined,
      storyPoints: Number(storyPoints),
      subtasks
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <span
              className="flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: selectedTypeConfig.color }}
            >
              <IconRenderer name={selectedTypeConfig.icon} size={14} />
              <span>{selectedTypeConfig.name.toUpperCase()}</span>
            </span>
            <h2 className="font-heading font-black text-xl text-white">
              {isEditing ? `${issue?.key} — Edit Ticket` : 'Create New Ticket'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <IconRenderer name="Trash2" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Title Input */}
          <div className="space-y-1">
            <label className="block text-slate-300 font-semibold">Summary / Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Fix OAuth refresh token race condition"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Grid Layout: Hierarchy & Meta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Issue Type */}
            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold">Issue Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              >
                {types.map(t => (
                  <option key={t.id} value={t.id}>{t.name} (L{t.hierarchyLevel})</option>
                ))}
              </select>
            </div>

            {/* Status (Workflow Driven) */}
            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold">Workflow Status</label>
              <select
                value={statusId}
                onChange={e => handleStatusChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-bold"
              >
                {statuses.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-bold"
              >
                {priorities.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Parent-Child Hierarchy Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold">Parent Epic / Parent Issue (Hierarchy Rules)</label>
              <select
                value={epicId}
                onChange={e => setEpicId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              >
                <option value="">-- No Parent Epic --</option>
                {allowedParentIssues.map(p => (
                  <option key={p.id} value={p.id}>{p.key} — {p.title} ({p.type})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold">Assignee</label>
              <select
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              >
                <option value="">-- Unassigned --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sprint & Release */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold">Sprint Assignment</label>
              <select value={sprintId} onChange={e => setSprintId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200">
                <option value="">-- Backlog --</option>
                {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold">Release Version</label>
              <select value={releaseId} onChange={e => setReleaseId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200">
                <option value="">-- Unassigned Release --</option>
                {releases.map(r => <option key={r.id} value={r.id}>{r.version} — {r.title}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold">Story Points</label>
              <input type="number" value={storyPoints} onChange={e => setStoryPoints(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-slate-300 font-semibold">Description (Markdown Supported)</label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the issue context, steps to reproduce, or acceptance criteria..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-xs"
            />
          </div>

          {/* Subtasks Checklist */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="block text-slate-300 font-semibold">Subtasks Checklist</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                placeholder="Add new subtask item..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              />
              <button type="button" onClick={handleAddSubtask} className="px-3 py-2 bg-indigo-600 text-white font-semibold rounded-lg">
                Add Subtask
              </button>
            </div>
            <div className="space-y-1 pt-1">
              {subtasks.map(st => (
                <div key={st.id} className="flex items-center space-x-2 p-2 bg-slate-950 rounded border border-slate-800">
                  <input type="checkbox" checked={st.completed} onChange={() => handleToggleSubtask(st.id)} className="rounded text-indigo-600" />
                  <span className={`flex-1 text-slate-200 ${st.completed ? 'line-through text-slate-500' : ''}`}>{st.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Trail Log Timeline (If Editing Existing Issue) */}
          {isEditing && issueAuditLogs.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <h4 className="font-heading font-bold text-xs text-slate-400 uppercase tracking-wider">Activity & Audit Timeline</h4>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {issueAuditLogs.map(log => (
                  <div key={log.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center text-[11px] font-mono">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-indigo-400">{log.user}</span>
                      <span className="text-slate-300">{log.action}: {log.oldValue ? `${log.oldValue} ──► ` : ''}{log.newValue}</span>
                    </div>
                    <span className="text-slate-500">{log.timestamp} ({log.source})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30">
              {isEditing ? 'Save Changes' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
