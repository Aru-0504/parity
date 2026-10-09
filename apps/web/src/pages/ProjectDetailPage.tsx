import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { KanbanBoard } from '../components/KanbanBoard';
import { TimelineView } from '../components/TimelineView';
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
  LayoutGrid,
  List,
  CalendarDays,
} from 'lucide-react';
import { TaskDto, TaskPriorityType, TaskStatusType, ActivityLogDto } from '@ismo/shared';
import { useLiveSync } from '../context/LiveSyncContext';
import { useToast } from '../context/ToastContext';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { subscribe } = useLiveSync();
  const toast = useToast();

  const [project, setProject] = useState<any>(null);
  const [activities, setActivities] = useState<ActivityLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'timeline'>('list');

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
      const [res, actRes] = await Promise.all([
        apiClient.get(`/projects/${id}`),
        apiClient.get(`/activity?projectId=${id}&limit=10`),
      ]);
      if (res.data.success) {
        setProject(res.data.data);
      }
      if (actRes.data.success) {
        setActivities(actRes.data.data);
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

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      fetchProjectDetails();
    });
    return unsubscribe;
  }, [subscribe, id]);

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
      toast.success(
        newStatus === 'COMPLETED'
          ? `Completed "${task.name}"`
          : `Reopened "${task.name}"`
      );
      fetchProjectDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await apiClient.delete(`/tasks/${taskId}`);
      toast.info('Task deleted successfully');
      fetchProjectDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleMoveTask = async (taskId: string, newStatus: TaskStatusType) => {
    try {
      if (project && project.tasks) {
        setProject({
          ...project,
          tasks: project.tasks.map((t: any) =>
            t.id === taskId ? { ...t, status: newStatus } : t
          ),
        });
      }
      await apiClient.put(`/tasks/${taskId}`, { status: newStatus });
      toast.success(`Task moved to ${newStatus.replace('_', ' ')}`);
      fetchProjectDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to move task');
      fetchProjectDetails();
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
        toast.success(`Task "${taskName}" updated successfully`);
      } else {
        await apiClient.post('/tasks', payload);
        toast.success(`Task "${taskName}" created successfully`);
      }

      setIsTaskModalOpen(false);
      fetchProjectDetails();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save task';
      setTaskModalError(msg);
      toast.error(msg);
    } finally {
      setSubmittingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#2F4156] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center max-w-lg mx-auto border border-[#E8C6CA]">
        <AlertCircle className="w-10 h-10 text-[#B46A72] mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#2F4156] mb-2">Access Error</h2>
        <p className="text-[#567C8D] text-xs mb-6">{error}</p>
        <Link
          to="/projects"
          className="px-4 py-2 rounded-xl bg-[#2F4156] hover:bg-[#1E2C3A] text-white text-xs font-semibold"
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
          className="flex items-center space-x-2 text-xs font-semibold text-[#567C8D] hover:text-[#2F4156] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>
      </div>

      {/* Project Overview Banner */}
      <div className="glass-card rounded-2xl p-6 border border-[#E7DFD7]">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <h1 className="text-2xl font-black text-[#2F4156]">{project.name}</h1>
              {project.health && <Badge type="health" value={project.health} />}
              <Badge type="status" value={project.status} />
            </div>
            <p className="text-[#567C8D] text-sm max-w-2xl">
              {project.description || 'No description provided.'}
            </p>
          </div>

          <button
            onClick={openCreateTaskModal}
            className="px-4 py-2.5 rounded-xl bg-[#2F4156] hover:bg-[#1E2C3A] text-white font-semibold text-xs shadow-sm transition flex items-center space-x-2 flex-shrink-0"
          >
            <Plus className="w-4 h-4 text-[#C8D9E6]" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Progress & Meta */}
        <div className="mt-6 pt-6 border-t border-[#E7DFD7] grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-xs text-[#8A9BA8] block mb-1">Schedule</span>
            <div className="flex items-center space-x-1.5 text-xs text-[#567C8D]">
              <Calendar className="w-3.5 h-3.5 text-[#567C8D]" />
              <span>
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Start unset'} -{' '}
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
              </span>
            </div>
          </div>

          <div className="sm:col-span-2">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-[#567C8D]">
                Tasks Progress ({completedCount} of {totalCount} completed)
              </span>
              <span className="font-bold text-[#4E6738]">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-[#E7DFD7] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#567C8D] to-[#2F4156] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-[#2F4156] tracking-tight">Project Tasks</h2>
            <span className="text-xs text-[#567C8D] font-medium">({totalCount} total)</span>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#E7DFD7]/60 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                viewMode === 'list'
                  ? 'bg-white text-[#2F4156] shadow-sm'
                  : 'text-[#567C8D] hover:text-[#2F4156]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                viewMode === 'kanban'
                  ? 'bg-white text-[#2F4156] shadow-sm'
                  : 'text-[#567C8D] hover:text-[#2F4156]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                viewMode === 'timeline'
                  ? 'bg-white text-[#2F4156] shadow-sm'
                  : 'text-[#567C8D] hover:text-[#2F4156]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>
        </div>

        {viewMode === 'kanban' ? (
          <KanbanBoard
            tasks={project.tasks || []}
            onMoveTask={handleMoveTask}
            onEditTask={openEditTaskModal}
            onDeleteTask={handleDeleteTask}
            onToggleStatus={handleToggleTaskStatus}
          />
        ) : viewMode === 'timeline' ? (
          <TimelineView
            tasks={project.tasks || []}
            onEditTask={openEditTaskModal}
            onDeleteTask={handleDeleteTask}
            onToggleStatus={handleToggleTaskStatus}
          />
        ) : project.tasks?.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl border border-[#E7DFD7]">
            <Clock className="w-10 h-10 text-[#8A9BA8] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#2F4156]">No tasks yet</p>
            <p className="text-xs text-[#567C8D] mt-1">
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
                      ? 'border-[#CCD8BF] bg-[#F0F5EA]/60'
                      : 'border-[#E7DFD7] hover:border-[#C8D9E6]'
                  }`}
                >
                  <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleTaskStatus(task)}
                      title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                      className="text-[#8A9BA8] hover:text-[#4E6738] transition flex-shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-[#4E6738]" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#C8D9E6] hover:text-[#567C8D]" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isCompleted ? 'text-[#8A9BA8] line-through' : 'text-[#2F4156]'
                        }`}
                      >
                        {task.name}
                      </p>
                      {task.description && (
                        <p className="text-xs text-[#567C8D] truncate mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <Badge type="priority" value={task.priority} />
                    <Badge type="status" value={task.status} />

                    {task.dueDate && (
                      <span className="hidden sm:inline-flex items-center space-x-1 text-xs text-[#567C8D]">
                        <Calendar className="w-3 h-3 text-[#8A9BA8]" />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </span>
                    )}

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditTaskModal(task)}
                        className="p-1.5 rounded-lg text-[#567C8D] hover:text-[#2F4156] hover:bg-[#EBF2F5] transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 rounded-lg text-[#B46A72] hover:bg-[#F9ECEE] transition"
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

      {/* Activity Log */}
      <div className="glass-card rounded-2xl p-6 border border-[#E7DFD7]">
        <h2 className="text-base font-bold text-[#2F4156] mb-4">Project Activity Log</h2>
        {activities.length === 0 ? (
          <p className="text-xs text-[#8A9BA8] py-3 text-center">No activity logged for this project yet.</p>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start space-x-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-[#567C8D] mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[#2F4156] font-semibold">{act.message}</p>
                  <p className="text-[#8A9BA8] text-[10px] mt-0.5">
                    {new Date(act.createdAt).toLocaleTimeString()} &bull; {new Date(act.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
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
            <div className="p-3 rounded-xl bg-[#F9ECEE] border border-[#E8C6CA] flex items-center space-x-2 text-[#934E55] text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{taskModalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#2F4156] mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="e.g. Implement user login screen"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#E7DFD7] text-[#2F4156] text-sm focus:outline-none focus:border-[#567C8D]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2F4156] mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Detailed task criteria..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#E7DFD7] text-[#2F4156] text-sm focus:outline-none focus:border-[#567C8D]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#2F4156] mb-1">
                Priority
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriorityType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#E7DFD7] text-[#2F4156] text-xs focus:outline-none focus:border-[#567C8D]"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2F4156] mb-1">
                Status
              </label>
              <select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value as TaskStatusType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#E7DFD7] text-[#2F4156] text-xs focus:outline-none focus:border-[#567C8D]"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2F4156] mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#E7DFD7] text-[#2F4156] text-xs focus:outline-none focus:border-[#567C8D]"
            />
          </div>

          <div className="pt-3 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-[#FAF7F5] hover:bg-[#EBF2F5] text-[#567C8D] text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingTask}
              className="px-5 py-2.5 rounded-xl bg-[#2F4156] hover:bg-[#1E2C3A] text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
            >
              {submittingTask ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
