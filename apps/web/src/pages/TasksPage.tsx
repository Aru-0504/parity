import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { KanbanBoard } from '../components/KanbanBoard';
import { TimelineView } from '../components/TimelineView';
import {
  CheckSquare,
  Search,
  Filter,
  Calendar,
  Trash2,
  Edit2,
  CheckCircle,
  Circle,
  AlertCircle,
  FolderKanban,
  LayoutGrid,
  List,
  CalendarDays,
} from 'lucide-react';
import { TaskDto, TaskPriorityType, TaskStatusType, ProjectDto } from '@ismo/shared';
import { useLiveSync } from '../context/LiveSyncContext';
import { useToast } from '../context/ToastContext';

export const TasksPage: React.FC = () => {
  const toast = useToast();
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'timeline'>('list');
  const { subscribe } = useLiveSync();

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDto | null>(null);
  const [projectId, setProjectId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriorityType>('MEDIUM');
  const [taskStatus, setTaskStatus] = useState<TaskStatusType>('PENDING');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchTasksAndProjects = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const [tasksRes, projectsRes] = await Promise.all([
        apiClient.get('/tasks', { params }),
        apiClient.get('/projects'),
      ]);

      if (tasksRes.data.success) {
        setTasks(tasksRes.data.data);
      }
      if (projectsRes.data.success) {
        setProjects(projectsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndProjects();
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      fetchTasksAndProjects();
    });
    return unsubscribe;
  }, [subscribe]);

  const openCreateModal = () => {
    setEditingTask(null);
    setProjectId(projects[0]?.id || '');
    setTaskName('');
    setTaskDesc('');
    setTaskPriority('MEDIUM');
    setTaskStatus('PENDING');
    setTaskDueDate('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: TaskDto) => {
    setEditingTask(task);
    setProjectId(task.projectId);
    setTaskName(task.name);
    setTaskDesc(task.description || '');
    setTaskPriority(task.priority);
    setTaskStatus(task.status);
    setTaskDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (task: TaskDto) => {
    try {
      const newStatus: TaskStatusType =
        task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await apiClient.put(`/tasks/${task.id}`, { status: newStatus });
      toast.success(
        newStatus === 'COMPLETED'
          ? `Completed "${task.name}"`
          : `Reopened "${task.name}"`
      );
      fetchTasksAndProjects();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleMoveTask = async (taskId: string, newStatus: TaskStatusType) => {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      await apiClient.put(`/tasks/${taskId}`, { status: newStatus });
      toast.success(`Task moved to ${newStatus.replace('_', ' ')}`);
      fetchTasksAndProjects();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to move task');
      fetchTasksAndProjects();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await apiClient.delete(`/tasks/${id}`);
      toast.info('Task deleted successfully');
      fetchTasksAndProjects();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!projectId) {
      setFormError('Please select a project');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        projectId,
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
      setIsModalOpen(false);
      fetchTasksAndProjects();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save task';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2F4156] tracking-tight">
            All Tasks
          </h1>
          <p className="text-[#567C8D] text-sm mt-1">
            Global search, filtering, and priority tracking across all initiatives
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#E7DFD7]/60 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                viewMode === 'list'
                  ? 'bg-white text-[#2F4156] shadow-sm'
                  : 'text-[#567C8D] hover:text-[#2F4156]'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                viewMode === 'kanban'
                  ? 'bg-white text-[#2F4156] shadow-sm'
                  : 'text-[#567C8D] hover:text-[#2F4156]'
              }`}
              title="Kanban Board"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                viewMode === 'timeline'
                  ? 'bg-white text-[#2F4156] shadow-sm'
                  : 'text-[#567C8D] hover:text-[#2F4156]'
              }`}
              title="Timeline & Calendar"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Timeline</span>
            </button>
          </div>

          <button
            onClick={openCreateModal}
            disabled={projects.length === 0}
            className="px-4 py-2.5 rounded-xl bg-[#2F4156] hover:bg-[#1E2C3A] text-white font-semibold text-xs shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <CheckSquare className="w-4 h-4 text-[#C8D9E6]" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#8A9BA8]" />
          <input
            type="text"
            placeholder="Search tasks by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E7DFD7] text-[#2F4156] placeholder-[#8A9BA8] text-sm focus:outline-none focus:border-[#567C8D] shadow-sm"
          />
        </div>

        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3.5 top-3 text-[#8A9BA8] pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white border border-[#E7DFD7] text-[#2F4156] text-sm focus:outline-none focus:border-[#567C8D] appearance-none shadow-sm"
          >
            <option value="">Filter by Status (All)</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3.5 top-3 text-[#8A9BA8] pointer-events-none" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white border border-[#E7DFD7] text-[#2F4156] text-sm focus:outline-none focus:border-[#567C8D] appearance-none shadow-sm"
          >
            <option value="">Filter by Priority (All)</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Main Content Area: List, Kanban, or Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#2F4156] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={tasks}
          projects={projects}
          onMoveTask={handleMoveTask}
          onEditTask={openEditModal}
          onDeleteTask={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      ) : viewMode === 'timeline' ? (
        <TimelineView
          tasks={tasks}
          projects={projects}
          onEditTask={openEditModal}
          onDeleteTask={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl border border-[#E7DFD7]">
          <CheckSquare className="w-12 h-12 text-[#8A9BA8] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#2F4156]">No tasks found</h3>
          <p className="text-[#567C8D] text-xs mt-1">
            {search || statusFilter || priorityFilter
              ? 'Try relaxing search criteria'
              : 'Create a task or add one inside a project'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const isCompleted = task.status === 'COMPLETED';
            return (
              <div
                key={task.id}
                className={`glass-card rounded-2xl p-4 sm:p-5 border transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                  isCompleted
                    ? 'border-[#CCD8BF] bg-[#F0F5EA]/60'
                    : 'border-[#E7DFD7] hover:border-[#C8D9E6]'
                }`}
              >
                <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className="text-[#8A9BA8] hover:text-[#4E6738] transition mt-0.5 flex-shrink-0"
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-[#4E6738]" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#C8D9E6] hover:text-[#567C8D]" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-sm font-bold truncate ${
                          isCompleted ? 'text-[#8A9BA8] line-through' : 'text-[#2F4156]'
                        }`}
                      >
                        {task.name}
                      </span>

                      {task.project && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-[#FAF7F5] border border-[#E7DFD7] text-[11px] text-[#567C8D] font-semibold">
                          <FolderKanban className="w-3 h-3 text-[#567C8D]" />
                          <span>{task.project.name}</span>
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-[#567C8D] line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-0 border-[#E7DFD7]">
                  <div className="flex items-center space-x-2">
                    <Badge type="priority" value={task.priority} />
                    <Badge type="status" value={task.status} />
                  </div>

                  {task.dueDate && (
                    <span className="flex items-center space-x-1 text-xs text-[#567C8D]">
                      <Calendar className="w-3 h-3 text-[#8A9BA8]" />
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </span>
                  )}

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(task)}
                      className="p-1.5 rounded-lg text-[#567C8D] hover:text-[#2F4156] hover:bg-[#EBF2F5] transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
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

      {/* Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-[#F9ECEE] border border-[#E8C6CA] flex items-center space-x-2 text-[#934E55] text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#2F4156] mb-1">
              Select Project *
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#E7DFD7] text-[#2F4156] text-sm focus:outline-none focus:border-[#567C8D]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2F4156] mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="e.g. Write integration test specs"
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
              placeholder="Task details and deliverables..."
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
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-[#FAF7F5] hover:bg-[#EBF2F5] text-[#567C8D] text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#2F4156] hover:bg-[#1E2C3A] text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
