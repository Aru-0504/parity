import { prisma } from '../db/client';
import { sseService } from './sse.service';
import { ActivityLogDto } from '@ismo/shared';

export async function logActivity({
  userId,
  projectId,
  action,
  entityType,
  entityId,
  message,
}: {
  userId: string;
  projectId?: string | null;
  action: string;
  entityType: 'TASK' | 'PROJECT';
  entityId: string;
  message: string;
}): Promise<void> {
  try {
    const activity = await prisma.activityLog.create({
      data: {
        userId,
        projectId: projectId || null,
        action,
        entityType,
        entityId,
        message,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    const dto: ActivityLogDto = {
      id: activity.id,
      userId: activity.userId,
      projectId: activity.projectId,
      action: activity.action,
      entityType: activity.entityType as 'TASK' | 'PROJECT',
      entityId: activity.entityId,
      message: activity.message,
      createdAt: activity.createdAt.toISOString(),
      project: activity.project ? { id: activity.project.id, name: activity.project.name } : undefined,
    };

    sseService.broadcastToUser(userId, {
      type: 'ACTIVITY_LOGGED',
      timestamp: new Date().toISOString(),
      data: dto,
    });
  } catch (err) {
    console.error('[ActivityLog] Failed to log activity:', err);
  }
}
