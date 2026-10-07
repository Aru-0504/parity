export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressProjects: number;
  projectsByStatus: {
    notStarted: number;
    inProgress: number;
    completed: number;
  };
  tasksByPriority: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface DashboardResponse {
  stats: DashboardStats;
  recentProjects?: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
    taskCount: number;
  }>;
}
