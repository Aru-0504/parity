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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2F4156] tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-[#567C8D] text-sm mt-1">
            Real-time project statistics and task progression metrics
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/projects"
            className="px-4 py-2.5 rounded-xl bg-[#2F4156] hover:bg-[#1E2C3A] text-white font-semibold text-xs shadow-sm transition flex items-center space-x-2"
          >
            <FolderKanban className="w-4 h-4 text-[#C8D9E6]" />
            <span>Manage Projects</span>
          </Link>
          <Link
            to="/tasks"
            className="px-4 py-2.5 rounded-xl bg-[#EBF2F5] hover:bg-[#C8D9E6] text-[#2F4156] font-semibold text-xs border border-[#C8D9E6] transition flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#567C8D]" />
            <span>View Tasks</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid (Explicit Requirements) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Projects */}
        <div className="glass-card rounded-2xl p-5 border border-[#E7DFD7]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#567C8D] uppercase tracking-wider">
              Total Projects
            </span>
            <div className="p-2 rounded-xl bg-[#EBF2F5] text-[#2F4156] border border-[#C8D9E6]">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-[#2F4156]">{stats?.totalProjects ?? 0}</span>
            <span className="text-xs text-[#567C8D] font-semibold">Active</span>
          </div>
        </div>

        {/* Total Tasks */}
        <div className="glass-card rounded-2xl p-5 border border-[#E7DFD7]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#567C8D] uppercase tracking-wider">
              Total Tasks
            </span>
            <div className="p-2 rounded-xl bg-[#E8F0F7] text-[#567C8D] border border-[#C8D9E6]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-[#2F4156]">{stats?.totalTasks ?? 0}</span>
            <span className="text-xs text-[#567C8D] font-semibold">Assigned</span>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="glass-card rounded-2xl p-5 border border-[#E7DFD7]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#567C8D] uppercase tracking-wider">
              Completed Tasks
            </span>
            <div className="p-2 rounded-xl bg-[#F0F5EA] text-[#4E6738] border border-[#CCD8BF]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-[#4E6738]">{stats?.completedTasks ?? 0}</span>
            <span className="text-xs text-[#4E6738] font-semibold">{completionRate}% Done</span>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="glass-card rounded-2xl p-5 border border-[#E7DFD7]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#567C8D] uppercase tracking-wider">
              Pending Tasks
            </span>
            <div className="p-2 rounded-xl bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-[#92400E]">{stats?.pendingTasks ?? 0}</span>
            <span className="text-xs text-[#92400E] font-semibold">Action Needed</span>
          </div>
        </div>

        {/* Projects In Progress */}
        <div className="glass-card rounded-2xl p-5 border border-[#E7DFD7]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#567C8D] uppercase tracking-wider">
              In Progress
            </span>
            <div className="p-2 rounded-xl bg-[#F9ECEE] text-[#934E55] border border-[#E8C6CA]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-[#934E55]">{stats?.inProgressProjects ?? 0}</span>
            <span className="text-xs text-[#934E55] font-semibold">Ongoing</span>
          </div>
        </div>
      </div>

      {/* Progress & Overview Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Bar & Breakdown */}
        <div className="glass-card rounded-2xl p-6 border border-[#E7DFD7]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#2F4156] flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#567C8D]" />
              <span>Overall Completion</span>
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F0F5EA] text-[#4E6738] border border-[#CCD8BF]">
              {completionRate}%
            </span>
          </div>

          <div className="w-full h-3 bg-[#E7DFD7] rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-gradient-to-r from-[#567C8D] to-[#2F4156] rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#567C8D] font-medium">Tasks Completed</span>
              <span className="font-bold text-[#4E6738]">{stats?.completedTasks ?? 0}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#567C8D] font-medium">Tasks In Progress</span>
              <span className="font-bold text-[#92400E]">
                {(stats as any)?.tasksByStatus?.inProgress ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#567C8D] font-medium">Tasks Pending</span>
              <span className="font-bold text-[#2F4156]">{stats?.pendingTasks ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="glass-card rounded-2xl p-6 border border-[#E7DFD7]">
          <h2 className="text-base font-bold text-[#2F4156] mb-4">Tasks by Priority</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#934E55]">High Priority</span>
                <span className="text-[#2F4156]">{stats?.tasksByPriority?.high ?? 0}</span>
              </div>
              <div className="w-full h-2 bg-[#E7DFD7] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#B46A72] rounded-full"
                  style={{
                    width: stats?.totalTasks
                      ? `${((stats.tasksByPriority.high / stats.totalTasks) * 100).toFixed(0)}%`
                      : '0%',
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#567C8D]">Medium Priority</span>
                <span className="text-[#2F4156]">{stats?.tasksByPriority?.medium ?? 0}</span>
              </div>
              <div className="w-full h-2 bg-[#E7DFD7] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#567C8D] rounded-full"
                  style={{
                    width: stats?.totalTasks
                      ? `${((stats.tasksByPriority.medium / stats.totalTasks) * 100).toFixed(0)}%`
                      : '0%',
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#8A9BA8]">Low Priority</span>
                <span className="text-[#2F4156]">{stats?.tasksByPriority?.low ?? 0}</span>
              </div>
              <div className="w-full h-2 bg-[#E7DFD7] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C8D9E6] rounded-full"
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
        <div className="glass-card rounded-2xl p-6 border border-[#E7DFD7]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#2F4156]">Recent Projects</h2>
            <Link to="/projects" className="text-xs font-semibold text-[#567C8D] hover:text-[#2F4156] flex items-center space-x-1">
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <p className="text-[#8A9BA8] text-xs py-4 text-center">No projects created yet</p>
          ) : (
            <div className="space-y-2.5">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="block p-3 rounded-xl bg-[#FAF7F5] hover:bg-[#F0F5F9] border border-[#E7DFD7] transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#2F4156] truncate max-w-[160px]">
                      {project.name}
                    </span>
                    <Badge type="status" value={project.status} />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-[#567C8D]">
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
        <div className="glass-card rounded-2xl p-6 border border-[#E7DFD7]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#2F4156]">Focus Queue</h2>
                <p className="text-xs text-[#567C8D]">Urgent tasks to complete next</p>
              </div>
            </div>
            <Link to="/tasks" className="text-xs font-semibold text-[#567C8D] hover:text-[#2F4156] flex items-center space-x-1">
              <span>All tasks</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {focusTasks.length === 0 ? (
            <div className="py-8 text-center text-[#8A9BA8] text-xs">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-[#A6B58A]" />
              All caught up! No urgent pending tasks.
            </div>
          ) : (
            <div className="space-y-2.5">
              {focusTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F5] border border-[#E7DFD7] hover:border-[#C8D9E6] transition"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      title="Mark complete"
                      className="w-5 h-5 rounded-full border-2 border-[#C8D9E6] hover:border-[#567C8D] hover:bg-[#EBF2F5] flex items-center justify-center transition flex-shrink-0"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-transparent hover:text-[#567C8D]" />
                    </button>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-[#2F4156] truncate">{task.name}</p>
                      <p className="text-[11px] text-[#567C8D] truncate">{task.projectName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Badge type="priority" value={task.priority} />
                    {task.dueDate && (
                      <span className="text-[11px] text-[#567C8D] flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-[#8A9BA8]" />
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
        <div className="glass-card rounded-2xl p-6 border border-[#E7DFD7]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#E8F0F7] text-[#567C8D] border border-[#C8D9E6]">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#2F4156]">Live Activity Feed</h2>
                <p className="text-xs text-[#567C8D]">Real-time audit log & system events</p>
              </div>
            </div>
            <span className="text-[11px] text-[#4E6738] font-bold flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-[#F0F5EA] border border-[#CCD8BF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7D8C62] animate-pulse"></span>
              <span>Live</span>
            </span>
          </div>

          {activities.length === 0 ? (
            <p className="py-8 text-center text-[#8A9BA8] text-xs">No activity recorded yet</p>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start space-x-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#567C8D] mt-1.5 flex-shrink-0"></div>
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
      </div>
    </div>
  );
};
