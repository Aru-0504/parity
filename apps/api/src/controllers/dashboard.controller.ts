import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressProjects,
      notStartedProjects,
      completedProjects,
      inProgressTasks,
      lowPriorityTasks,
      mediumPriorityTasks,
      highPriorityTasks,
      recentProjects,
    ] = await Promise.all([
      // Total Projects
      prisma.project.count({ where: { userId } }),
      // Total Tasks
      prisma.task.count({ where: { userId } }),
      // Completed Tasks
      prisma.task.count({ where: { userId, status: 'COMPLETED' } }),
      // Pending Tasks (status == PENDING)
      prisma.task.count({ where: { userId, status: 'PENDING' } }),
      // Projects In Progress
      prisma.project.count({ where: { userId, status: 'IN_PROGRESS' } }),
      // Projects Not Started
      prisma.project.count({ where: { userId, status: 'NOT_STARTED' } }),
      // Projects Completed
      prisma.project.count({ where: { userId, status: 'COMPLETED' } }),
      // Tasks In Progress
      prisma.task.count({ where: { userId, status: 'IN_PROGRESS' } }),
      // Priority counts
      prisma.task.count({ where: { userId, priority: 'LOW' } }),
      prisma.task.count({ where: { userId, priority: 'MEDIUM' } }),
      prisma.task.count({ where: { userId, priority: 'HIGH' } }),
      // Recent Projects for quick access
      prisma.project.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          _count: {
            select: { tasks: true },
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalProjects,
          totalTasks,
          completedTasks,
          pendingTasks,
          inProgressProjects,
          projectsByStatus: {
            notStarted: notStartedProjects,
            inProgress: inProgressProjects,
            completed: completedProjects,
          },
          tasksByStatus: {
            pending: pendingTasks,
            inProgress: inProgressTasks,
            completed: completedTasks,
          },
          tasksByPriority: {
            low: lowPriorityTasks,
            medium: mediumPriorityTasks,
            high: highPriorityTasks,
          },
        },
        recentProjects: recentProjects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
          taskCount: p._count.tasks,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
