import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import {
  CreateTaskInput,
  UpdateTaskInput,
  TaskQueryParams,
  ErrorCode,
} from '@ismo/shared';
import { Prisma } from '@prisma/client';
import { sseService } from '../services/sse.service';
import { logActivity } from '../services/activity.service';

export const getTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      projectId,
      search,
      status,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 30,
    } = req.query as unknown as TaskQueryParams;

    // Must be scoped to user
    const whereClause: Prisma.TaskWhereInput = {
      userId,
      ...(projectId ? { projectId } : {}),
      ...(status ? { status: status as any } : {}),
      ...(priority ? { priority: priority as any } : {}),
      ...(search
        ? {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : {}),
    };

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        orderBy: {
          [sortBy as string]: sortOrder,
        },
        skip,
        take,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.task.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      data: tasks.map((t) => ({
        ...t,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        userId, // user ownership check
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      res.status(404).json({
        success: false,
        code: ErrorCode.NOT_FOUND,
        message: 'Task not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { projectId, name, description, priority, status, dueDate }: CreateTaskInput = req.body;

    // CRITICAL SECURITY CHECK: Verify the project belongs to the authenticated user!
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        code: ErrorCode.NOT_FOUND,
        message: 'Project not found or you do not have permission to add tasks to it',
      });
      return;
    }

    const task = await prisma.task.create({
      data: {
        userId,
        projectId,
        name: name.trim(),
        description: description?.trim() || null,
        priority: (priority as any) || 'MEDIUM',
        status: (status as any) || 'PENDING',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const taskDto = {
      ...task,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };

    sseService.broadcastToUser(userId, {
      type: 'TASK_CREATED',
      timestamp: new Date().toISOString(),
      data: taskDto,
    });

    logActivity({
      userId,
      projectId: task.projectId,
      action: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: task.id,
      message: `Created task "${task.name}"`,
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: taskDto,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { projectId, name, description, priority, status, dueDate }: UpdateTaskInput = req.body;

    // Check task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingTask) {
      res.status(404).json({
        success: false,
        code: ErrorCode.NOT_FOUND,
        message: 'Task not found',
      });
      return;
    }

    // If changing projectId, ensure the target project also belongs to user!
    if (projectId && projectId !== existingTask.projectId) {
      const targetProject = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId,
        },
      });

      if (!targetProject) {
        res.status(404).json({
          success: false,
          code: ErrorCode.NOT_FOUND,
          message: 'Target project not found or does not belong to you',
        });
        return;
      }
    }

    const updateData: Prisma.TaskUpdateInput = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (priority !== undefined) updateData.priority = priority as any;
    if (status !== undefined) updateData.status = status as any;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (projectId !== undefined) {
      updateData.project = {
        connect: { id: projectId },
      };
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const updatedDto = {
      ...updatedTask,
      dueDate: updatedTask.dueDate ? updatedTask.dueDate.toISOString() : null,
      createdAt: updatedTask.createdAt.toISOString(),
      updatedAt: updatedTask.updatedAt.toISOString(),
    };

    sseService.broadcastToUser(userId, {
      type: 'TASK_UPDATED',
      timestamp: new Date().toISOString(),
      data: updatedDto,
    });

    let actionMsg = `Updated task "${updatedTask.name}"`;
    if (status && status !== existingTask.status) {
      if (status === 'COMPLETED') {
        actionMsg = `Marked task "${updatedTask.name}" as Completed`;
      } else {
        actionMsg = `Moved task "${updatedTask.name}" to ${status.replace('_', ' ')}`;
      }
    }

    logActivity({
      userId,
      projectId: updatedTask.projectId,
      action: 'TASK_UPDATED',
      entityType: 'TASK',
      entityId: updatedTask.id,
      message: actionMsg,
    });

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedDto,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingTask) {
      res.status(404).json({
        success: false,
        code: ErrorCode.NOT_FOUND,
        message: 'Task not found',
      });
      return;
    }

    await prisma.task.delete({
      where: { id },
    });

    sseService.broadcastToUser(userId, {
      type: 'TASK_DELETED',
      timestamp: new Date().toISOString(),
      data: { id, projectId: existingTask.projectId },
    });

    logActivity({
      userId,
      projectId: existingTask.projectId,
      action: 'TASK_DELETED',
      entityType: 'TASK',
      entityId: id,
      message: `Deleted task "${existingTask.name}"`,
    });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
