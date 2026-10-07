import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectQueryParams,
  ErrorCode,
  calculateProjectHealth,
} from '@ismo/shared';
import { Prisma } from '@prisma/client';
import { sseService } from '../services/sse.service';
import { logActivity } from '../services/activity.service';

export const getProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { search, status, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = req.query as unknown as ProjectQueryParams;

    const whereClause: Prisma.ProjectWhereInput = {
      userId,
      ...(status ? { status: status as any } : {}),
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

    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where: whereClause,
        orderBy: {
          [sortBy as string]: sortOrder,
        },
        skip,
        take,
        include: {
          tasks: {
            select: { status: true },
          },
          _count: {
            select: { tasks: true },
          },
        },
      }),
      prisma.project.count({ where: whereClause }),
    ]);

    const formattedProjects = projects.map((p) => {
      const totalTasks = p.tasks.length;
      const completedTasks = p.tasks.filter((t) => t.status === 'COMPLETED').length;
      const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const health = calculateProjectHealth({
        status: p.status as any,
        endDate: p.endDate ? p.endDate.toISOString() : null,
        completionPercentage,
      });

      return {
        id: p.id,
        userId: p.userId,
        name: p.name,
        description: p.description,
        status: p.status,
        startDate: p.startDate ? p.startDate.toISOString() : null,
        endDate: p.endDate ? p.endDate.toISOString() : null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        completionPercentage,
        health,
        _count: {
          tasks: p._count.tasks,
        },
      };
    });

    res.status(200).json({
      success: true,
      data: formattedProjects,
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

export const getProjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        code: ErrorCode.NOT_FOUND,
        message: 'Project not found',
      });
      return;
    }

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t) => t.status === 'COMPLETED').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const health = calculateProjectHealth({
      status: project.status as any,
      endDate: project.endDate ? project.endDate.toISOString() : null,
      completionPercentage,
    });

    res.status(200).json({
      success: true,
      data: {
        ...project,
        startDate: project.startDate ? project.startDate.toISOString() : null,
        endDate: project.endDate ? project.endDate.toISOString() : null,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        completionPercentage,
        health,
        tasks: project.tasks.map((t) => ({
          ...t,
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, description, status, startDate, endDate }: CreateProjectInput = req.body;

    const project = await prisma.project.create({
      data: {
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        status: (status as any) || 'NOT_STARTED',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    const projectDto = {
      ...project,
      startDate: project.startDate ? project.startDate.toISOString() : null,
      endDate: project.endDate ? project.endDate.toISOString() : null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      completionPercentage: 0,
      health: calculateProjectHealth({
        status: project.status as any,
        endDate: project.endDate ? project.endDate.toISOString() : null,
        completionPercentage: 0,
      }),
    };

    sseService.broadcastToUser(userId, {
      type: 'PROJECT_CREATED',
      timestamp: new Date().toISOString(),
      data: projectDto,
    });

    logActivity({
      userId,
      projectId: project.id,
      action: 'PROJECT_CREATED',
      entityType: 'PROJECT',
      entityId: project.id,
      message: `Created project "${project.name}"`,
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: projectDto,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, description, status, startDate, endDate }: UpdateProjectInput = req.body;

    const existingProject = await prisma.project.findFirst({
      where: { id, userId },
      include: {
        tasks: { select: { status: true } },
      },
    });

    if (!existingProject) {
      res.status(404).json({
        success: false,
        code: ErrorCode.NOT_FOUND,
        message: 'Project not found',
      });
      return;
    }

    // Prepare update data
    const updateData: Prisma.ProjectUpdateInput = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) updateData.status = status as any;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        tasks: { select: { status: true } },
        _count: {
          select: { tasks: true },
        },
      },
    });

    const totalTasks = updated.tasks.length;
    const completedTasks = updated.tasks.filter((t) => t.status === 'COMPLETED').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const health = calculateProjectHealth({
      status: updated.status as any,
      endDate: updated.endDate ? updated.endDate.toISOString() : null,
      completionPercentage,
    });

    const updatedDto = {
      ...updated,
      startDate: updated.startDate ? updated.startDate.toISOString() : null,
      endDate: updated.endDate ? updated.endDate.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      completionPercentage,
      health,
    };

    sseService.broadcastToUser(userId, {
      type: 'PROJECT_UPDATED',
      timestamp: new Date().toISOString(),
      data: updatedDto,
    });

    logActivity({
      userId,
      projectId: updated.id,
      action: 'PROJECT_UPDATED',
      entityType: 'PROJECT',
      entityId: updated.id,
      message: `Updated project "${updated.name}"`,
    });

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: updatedDto,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existingProject = await prisma.project.findFirst({
      where: { id, userId },
    });

    if (!existingProject) {
      res.status(404).json({
        success: false,
        code: ErrorCode.NOT_FOUND,
        message: 'Project not found',
      });
      return;
    }

    await prisma.project.delete({
      where: { id },
    });

    sseService.broadcastToUser(userId, {
      type: 'PROJECT_DELETED',
      timestamp: new Date().toISOString(),
      data: { id },
    });

    logActivity({
      userId,
      projectId: null,
      action: 'PROJECT_DELETED',
      entityType: 'PROJECT',
      entityId: id,
      message: `Deleted project "${existingProject.name}"`,
    });

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
