import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import { ActivityLogDto } from '@ismo/shared';

export const getActivityLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { projectId, limit } = req.query;

    const take = limit ? Math.min(parseInt(limit as string, 10) || 20, 100) : 30;

    const where: any = { userId };
    if (projectId && typeof projectId === 'string') {
      where.projectId = projectId;
    }

    const activities = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    const data: ActivityLogDto[] = activities.map((a) => ({
      id: a.id,
      userId: a.userId,
      projectId: a.projectId,
      action: a.action,
      entityType: a.entityType as 'TASK' | 'PROJECT',
      entityId: a.entityId,
      message: a.message,
      createdAt: a.createdAt.toISOString(),
      project: a.project ? { id: a.project.id, name: a.project.name } : undefined,
    }));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
