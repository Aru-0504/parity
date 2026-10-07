import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  ArrowLeft,
  Calendar,
  Plus,
  Trash2,
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Edit2,
} from 'lucide-react';
import { TaskDto, TaskPriorityType, TaskStatusType } from '@ismo/shared';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Task modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDto | null>(null);
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriorityType>('MEDIUM');
  const [taskStatus, setTaskStatus] = useState<TaskStatusType>('PENDING');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskModalError, setTaskModalError] = useState<string | null>(null);
  const [submittingTask, setSubmittingTask] = useState(false);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(`/projects/${id}`);
      if (res.data.success) {
        setProject(res.data.data);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Project not found or you do not have permission to access it.');
      } else {
        setError('Failed to load project details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProjectDetails();
  }, [id]);

  const openCreateTaskModal = () => {
    setEditingTask(null);
    setTaskName('');
    setTaskDesc('');
    setTaskPriority('MEDIUM');
    setTaskStatus('PENDING');
    setTaskDueDate('');
    setTaskModalError(null);
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: TaskDto) => {
    setEditingTask(task);
    setTaskName(task.name);
    setTaskDesc(task.description || '');
    setTaskPriority(task.priority);
    setTaskStatus(task.status);
    setTaskDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setTaskModalError(null);
    setIsTaskModalOpen(true);
  };

  const handleToggleTaskStatus = async (task: TaskDto) => {
    try {
      const newStatus: TaskStatusType =
        task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await apiClient.put(`/tasks/${task.id}`, { status: newStatus });
      fetchProjectDetails();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await apiClient.delete(`/tasks/${taskId}`);
      fetchProjectDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskModalError(null);
    setSubmittingTask(true);

    try {
      const payload = {
        projectId: id!,
        name: taskName,
        description: taskDesc || null,
        priority: taskPriority,
        status: taskStatus,
        dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : null,
      };

      if (editingTask) {
        await apiClient.put(`/tasks/${editingTask.id}`, payload);
      } else {
        await apiClient.post('/tasks', payload);
      }

      setIsTaskModalOpen(false);
      fetchProjectDetails();
    } catch (err: any) {
      setTaskModalError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSubmittingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center max-w-lg mx-auto border border-rose-500/30">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white mb-2">Access Error</h2>
        <p className="text-slate-400 text-xs mb-6">{error}</p>
        <Link
          to="/projects"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
        >
          Return to Projects
        </Link>
      </div>
    );
  }

  const completedCount = project.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
  const totalCount = project.tasks?.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>
      </div>

      {/* Project Overview Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-black text-white">{project.name}</h1>
              <Badge type="status" value={project.status} />
            </div>
            <p className="text-slate-400 text-sm max-w-2xl">
              {project.description || 'No description provided.'}
            </p>
          </div>

          <button
            onClick={openCreateTaskModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center space-x-2 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Progress & Meta */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-xs text-slate-500 block mb-1">Schedule</span>
            <div className="flex items-center space-x-1.5 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Start unset'} -{' '}
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
              </span>
            </div>
          </div>

          <div className="sm:col-span-2">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-400">
                Tasks Progress ({completedCount} of {totalCount} completed)
              </span>
              <span className="font-bold text-emerald-400">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">Project Tasks</h2>
          <span className="text-xs text-slate-400">{totalCount} tasks total</span>
        </div>

        {project.tasks?.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl border border-slate-800">
            <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No tasks yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Add your first task above to track progress.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {project.tasks.map((task: TaskDto) => {
              const isCompleted = task.status === 'COMPLETED';
              return (
                <div
                  key={task.id}
                  className={`glass-card rounded-xl p-4 border transition flex items-center justify-between gap-4 ${
                    isCompleted
                      ? 'border-emerald-500/20 bg-emerald-950/10'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleTaskStatus(task)}
                      title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                      className="text-slate-500 hover:text-emerald-400 transition flex-shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isCompleted ? 'text-slate-400 line-through' : 'text-white'
                        }`}
                      >
                        {task.name}
                      </p>
                      {task.description && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <Badge type="priority" value={task.priority} />
                    <Badge type="status" value={task.status} />

                    {task.dueDate && (
                      <span className="hidden sm:inline-flex items-center space-x-1 text-xs text-slate-400">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </span>
                    )}

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditTaskModal(task)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Add New Task'}
      >
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          {taskModalError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{taskModalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="e.g. Implement user login screen"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Detailed task criteria..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriorityType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Status
              </label>
              <select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value as TaskStatusType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingTask}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
            >
              {submittingTask ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
