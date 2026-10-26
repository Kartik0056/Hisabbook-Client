import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';
import {
  CheckSquare,
  Plus,
  Flag,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Loader2,
  Layers,
  Settings2,
} from 'lucide-react';

export const TasksPage = () => {
  const { activeProject, updateActiveProject } = useAuth();
  const { t } = useLanguage();

  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);

  // Task Form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('Structure');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskWeight, setTaskWeight] = useState(1);
  const [assignedContact, setAssignedContact] = useState('');
  const [taskMilestone, setTaskMilestone] = useState('');
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');

  // Milestone Form
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');
  const [milestoneWeight, setMilestoneWeight] = useState(25);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const [taskRes, msRes, conRes] = await Promise.all([
        api.getTasks(),
        api.getMilestones(),
        api.getContacts(),
      ]);

      if (taskRes.success) setTasks(taskRes.data);
      if (msRes.success) setMilestones(msRes.data);
      if (conRes.success) setContacts(conRes.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject?._id]);

  const handleSwitchProgressMethod = async (method) => {
    try {
      const res = await api.updateProject(activeProject._id, {
        progressMethod: method,
      });
      if (res.success) {
        updateActiveProject(res.data);
      }
    } catch (err) {
      alert(err.message || 'Error updating progress tracking mode.');
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setError('Task title is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.createTask({
        title: taskTitle.trim(),
        category: taskCategory,
        priority: taskPriority,
        weight: Number(taskWeight) || 1,
        assignedContact: assignedContact || null,
        milestone: taskMilestone || null,
        plannedStartDate: plannedStartDate || null,
        plannedEndDate: plannedEndDate || null,
      });

      if (res.success) {
        setTaskModalOpen(false);
        setTaskTitle('');
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to create task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMilestoneSubmit = async (e) => {
    e.preventDefault();
    if (!milestoneTitle.trim()) {
      setError('Milestone title is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.createMilestone({
        title: milestoneTitle.trim(),
        targetDate: milestoneDate || null,
        weight: Number(milestoneWeight) || 10,
      });

      if (res.success) {
        setMilestoneModalOpen(false);
        setMilestoneTitle('');
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to create milestone.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateTaskCompletion = async (taskId, percent) => {
    try {
      const status = percent === 100 ? 'completed' : percent > 0 ? 'in_progress' : 'todo';
      await api.updateTask(taskId, {
        completionPercent: percent,
        status,
      });
      await loadData();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const toggleMilestoneStatus = async (ms) => {
    try {
      const nextStatus = ms.status === 'achieved' ? 'pending' : 'achieved';
      await api.updateMilestone(ms._id, { status: nextStatus });
      await loadData();
    } catch (err) {
      console.error('Failed to update milestone:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-purple-600" />
            <span>Project Tasks & Milestones (कार्य व प्रगति)</span>
          </h1>
          <p className="text-xs text-slate-500">
            Physical progress tracking decoupled from financial spending percentages
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMilestoneModalOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Flag className="h-4 w-4 text-purple-600" />
            <span>Add Milestone</span>
          </button>
          <button
            onClick={() => setTaskModalOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Progress Method Settings Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Settings2 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Progress Calculation Mode</div>
            <div className="text-[11px] text-slate-500">
              Active mode: <span className="font-semibold text-purple-700 capitalize">{activeProject?.progressMethod?.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {[
            { id: 'manual', label: 'Manual %' },
            { id: 'task_weighted', label: 'Task-Weighted' },
            { id: 'milestone', label: 'Milestones' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => handleSwitchProgressMethod(m.id)}
              className={`rounded-xl px-3 py-1.5 font-bold transition ${
                activeProject?.progressMethod === m.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Milestones Overview Track */}
      {milestones.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Project Phase Milestones ({milestones.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {milestones.map((ms) => {
              const isAchieved = ms.status === 'achieved';
              return (
                <div
                  key={ms._id}
                  onClick={() => toggleMilestoneStatus(ms)}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    isAchieved
                      ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Flag className={`h-4 w-4 ${isAchieved ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold capitalize ${
                        isAchieved ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {ms.status}
                    </span>
                  </div>
                  <div className="mt-2 font-bold text-xs">{ms.title}</div>
                  {ms.targetDate && (
                    <div className="text-[10px] text-slate-400 mt-1">
                      Target: {formatDate(ms.targetDate)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Tasks & Execution Checklist</h3>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : tasks.length > 0 ? (
            tasks.map((task) => {
              const isCompleted = task.status === 'completed';
              return (
                <div
                  key={task._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateTaskCompletion(task._id, isCompleted ? 0 : 100)}
                        className={`h-5 w-5 rounded-lg border flex items-center justify-center transition ${
                          isCompleted
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'border-slate-300 text-transparent hover:border-purple-500'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                      <span className={`text-xs font-bold text-slate-900 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                        {task.title}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-600">
                        {task.category}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase ${
                          task.priority === 'critical'
                            ? 'bg-rose-100 text-rose-700'
                            : task.priority === 'high'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 pl-7 flex items-center gap-3">
                      {task.assignedContact && (
                        <span>Assigned: {task.assignedContact.name}</span>
                      )}
                      <span>Weight: {task.weight}</span>
                      {task.plannedEndDate && <span>Due: {formatDate(task.plannedEndDate)}</span>}
                    </div>
                  </div>

                  {/* Progress Slider */}
                  <div className="flex items-center gap-3 pl-7 sm:pl-0">
                    <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all"
                        style={{ width: `${task.completionPercent || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-9 text-right">
                      {task.completionPercent || 0}%
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No tasks added yet. Click "Add Task" to create your first milestone checklist.
            </div>
          )}
        </div>
      </div>

      {/* ADD TASK MODAL */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setTaskModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl z-10 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Project Task</h3>
              <button onClick={() => setTaskModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleTaskSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ground floor column shuttering..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="Structure, Electrical..."
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none capitalize"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Person</label>
                  <select
                    value={assignedContact}
                    onChange={(e) => setAssignedContact(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none"
                  >
                    <option value="">Unassigned</option>
                    {contacts.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Weight Factor</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={taskWeight}
                    onChange={(e) => setTaskWeight(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Planned Start</label>
                  <input
                    type="date"
                    value={plannedStartDate}
                    onChange={(e) => setPlannedStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Planned Completion</label>
                  <input
                    type="date"
                    value={plannedEndDate}
                    onChange={(e) => setPlannedEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-6 py-2 font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MILESTONE MODAL */}
      {milestoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMilestoneModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl z-10 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Milestone Phase</h3>
              <button onClick={() => setMilestoneModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleMilestoneSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Milestone Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ground Floor Slab Casting"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Completion Date</label>
                <input
                  type="date"
                  value={milestoneDate}
                  onChange={(e) => setMilestoneDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMilestoneModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-purple-600 px-6 py-2 font-bold text-white shadow-md hover:bg-purple-700"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
