import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Badge } from '../components/Badge';
import { useLiveSync } from '../context/LiveSyncContext';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  Target,
  Zap,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { DashboardStats, ActivityLogDto } from '@ismo/shared';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [focusTasks, setFocusTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<ActivityLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const { subscribe } = useLiveSync();

  const fetchDashboard = useCallback(async () => {
    try {
      const [dashRes, actRes] = await Promise.all([
        apiClient.get('/dashboard'),
        apiClient.get('/activity?limit=6'),
      ]);
      if (dashRes.data.success) {
        setStats(dashRes.data.data.stats);
        setRecentProjects(dashRes.data.data.recentProjects || []);
        setFocusTasks(dashRes.data.data.focusTasks || []);
      }
      if (actRes.data.success) {
        setActivities(actRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const unsubscribe = subscribe(() => {
      fetchDashboard();
    });
    return unsubscribe;
  }, [fetchDashboard, subscribe]);

  const handleToggleTask = async (taskId: string) => {
    try {
      await apiClient.put(`/tasks/${taskId}`, { status: 'COMPLETED' });
      fetchDashboard();
    } catch (err) {
      console.error('Failed to complete task', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const completionRate =
    stats && stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time project statistics and task progression metrics
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/projects"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center space-x-2"
          >
            <FolderKanban className="w-4 h-4" />
            <span>Manage Projects</span>
          </Link>
          <Link
            to="/tasks"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>View Tasks</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid (Explicit Requirements) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Projects */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Projects
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{stats?.totalProjects ?? 0}</span>
            <span className="text-xs text-indigo-400 font-medium">Active</span>
          </div>
        </div>

        {/* Total Tasks */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Tasks
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{stats?.totalTasks ?? 0}</span>
            <span className="text-xs text-blue-400 font-medium">Assigned</span>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Completed Tasks
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-400">{stats?.completedTasks ?? 0}</span>
            <span className="text-xs text-emerald-400/80 font-medium">{completionRate}% Done</span>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Tasks
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-400">{stats?.pendingTasks ?? 0}</span>
            <span className="text-xs text-amber-400/80 font-medium">Action Needed</span>
          </div>
        </div>

        {/* Projects In Progress */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              In Progress
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-purple-400">{stats?.inProgressProjects ?? 0}</span>
            <span className="text-xs text-purple-400/80 font-medium">Ongoing</span>
          </div>
        </div>
      </div>

      {/* Progress & Overview Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Bar & Breakdown */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Overall Completion</span>
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
              {completionRate}%
            </span>
          </div>

          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Tasks Completed</span>
              <span className="font-semibold text-emerald-400">{stats?.completedTasks ?? 0}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Tasks In Progress</span>
              <span className="font-semibold text-amber-400">
                {(stats as any)?.tasksByStatus?.inProgress ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Tasks Pending</span>
              <span className="font-semibold text-slate-300">{stats?.pendingTasks ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <h2 className="text-base font-bold text-white mb-4">Tasks by Priority</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-rose-400">High Priority</span>
                <span className="text-slate-300">{stats?.tasksByPriority?.high ?? 0}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{
                    width: stats?.totalTasks
                      ? `${((stats.tasksByPriority.high / stats.totalTasks) * 100).toFixed(0)}%`
                      : '0%',
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-indigo-400">Medium Priority</span>
                <span className="text-slate-300">{stats?.tasksByPriority?.medium ?? 0}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{
                    width: stats?.totalTasks
                      ? `${((stats.tasksByPriority.medium / stats.totalTasks) * 100).toFixed(0)}%`
                      : '0%',
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-400">Low Priority</span>
                <span className="text-slate-300">{stats?.tasksByPriority?.low ?? 0}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-500 rounded-full"
                  style={{
                    width: stats?.totalTasks
                      ? `${((stats.tasksByPriority.low / stats.totalTasks) * 100).toFixed(0)}%`
                      : '0%',
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Projects List */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Recent Projects</h2>
            <Link to="/projects" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1">
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <p className="text-slate-500 text-xs py-4 text-center">No projects created yet</p>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="block p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white truncate max-w-[160px]">
                      {project.name}
                    </span>
                    <Badge type="status" value={project.status} />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                    <span>{project.taskCount} tasks</span>
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Smart Focus View & Real-time Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Focus Queue ("What should I do next?") */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Focus Queue</h2>
                <p className="text-xs text-slate-400">Urgent tasks to complete next</p>
              </div>
            </div>
            <Link to="/tasks" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1">
              <span>All tasks</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {focusTasks.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500/60" />
              All caught up! No urgent pending tasks.
            </div>
          ) : (
            <div className="space-y-2.5">
              {focusTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      title="Mark complete"
                      className="w-5 h-5 rounded-full border-2 border-slate-600 hover:border-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition flex-shrink-0"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-transparent hover:text-emerald-400" />
                    </button>
                    <div className="truncate">
                      <p className="text-sm font-medium text-slate-200 truncate">{task.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{task.projectName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Badge type="priority" value={task.priority} />
                    {task.dueDate && (
                      <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Activity Timeline */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Live Activity Feed</h2>
                <p className="text-xs text-slate-400">Real-time audit log & system events</p>
              </div>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live</span>
            </span>
          </div>

          {activities.length === 0 ? (
            <p className="py-8 text-center text-slate-500 text-xs">No activity recorded yet</p>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start space-x-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-slate-200 font-medium">{act.message}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">
                      {new Date(act.createdAt).toLocaleTimeString()} &bull; {new Date(act.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
