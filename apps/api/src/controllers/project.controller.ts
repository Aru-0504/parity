import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectQueryParams,
  ErrorCode,
  ProjectStatusType,
} from '@ismo/shared';
import { Prisma } from '@prisma/client';

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
          _count: {
            select: { tasks: true },
          },
        },
      }),
      prisma.project.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      data: projects.map((p) => ({
        ...p,
        startDate: p.startDate ? p.startDate.toISOString() : null,
        endDate: p.endDate ? p.endDate.toISOString() : null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
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

    res.status(200).json({
      success: true,
      data: {
        ...project,
        startDate: project.startDate ? project.startDate.toISOString() : null,
        endDate: project.endDate ? project.endDate.toISOString() : null,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
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

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        ...project,
        startDate: project.startDate ? project.startDate.toISOString() : null,
        endDate: project.endDate ? project.endDate.toISOString() : null,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      },
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
        _count: {
          select: { tasks: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: {
        ...updated,
        startDate: updated.startDate ? updated.startDate.toISOString() : null,
        endDate: updated.endDate ? updated.endDate.toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
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

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
