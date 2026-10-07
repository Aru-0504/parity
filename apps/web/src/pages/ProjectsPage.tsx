import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Calendar,
  Layers,
  Trash2,
  Edit2,
  AlertCircle,
} from 'lucide-react';
import { ProjectDto, ProjectStatusType } from '@ismo/shared';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectDto | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatusType>('NOT_STARTED');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await apiClient.get('/projects', { params });
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search, statusFilter]);

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setStatus('NOT_STARTED');
    setStartDate('');
    setEndDate('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (project: ProjectDto, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || '');
    setStatus(project.status);
    setStartDate(project.startDate ? project.startDate.split('T')[0] : '');
    setEndDate(project.endDate ? project.endDate.split('T')[0] : '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this project? All associated tasks will also be deleted.')) {
      return;
    }
    try {
      await apiClient.delete(`/projects/${id}`);
      fetchProjects();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate date order if both exist
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setFormError('End date must be on or after start date');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        description: description || null,
        status,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
      };

      if (editingProject) {
        await apiClient.put(`/projects/${editingProject.id}`, payload);
      } else {
        await apiClient.post('/projects', payload);
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Projects
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Organize, monitor, and deliver all your team initiatives
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search projects by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div className="relative min-w-[180px]">
          <Filter className="w-4 h-4 absolute left-3 top-3 text-slate-500 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 appearance-none transition"
          >
            <option value="">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl border border-slate-800">
          <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No projects found</h3>
          <p className="text-slate-400 text-xs mt-1">
            {search || statusFilter ? 'Try clearing filters' : 'Create your first project to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="glass-card glass-card-hover rounded-2xl p-6 border border-slate-800/90 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition line-clamp-1">
                    {project.name}
                  </h3>
                  <Badge type="status" value={project.status} />
                </div>

                <p className="text-slate-400 text-xs line-clamp-2 min-h-[32px]">
                  {project.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{project._count?.tasks ?? 0} tasks</span>
                  </span>

                  {(project.startDate || project.endDate) && (
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {project.endDate
                          ? new Date(project.endDate).toLocaleDateString()
                          : 'Ongoing'}
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => openEditModal(project, e)}
                    title="Edit project"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(project.id, e)}
                    title="Delete project"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? 'Edit Project' : 'Create New Project'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mobile App Redesign"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of project goals..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatusType)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
