import { z } from 'zod';

export const ProjectStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export type ProjectStatusType = typeof ProjectStatus[keyof typeof ProjectStatus];

export const createProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { message: 'Project name is required' })
      .max(120, { message: 'Project name cannot exceed 120 characters' }),
    description: z
      .string()
      .trim()
      .max(1000, { message: 'Description cannot exceed 1000 characters' })
      .optional()
      .nullable(),
    status: z
      .nativeEnum(ProjectStatus, {
        errorMap: () => ({ message: 'Status must be NOT_STARTED, IN_PROGRESS, or COMPLETED' }),
      })
      .default(ProjectStatus.NOT_STARTED),
    startDate: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) => !val || !isNaN(Date.parse(val)),
        { message: 'Start date must be a valid date' }
      ),
    endDate: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) => !val || !isNaN(Date.parse(val)),
        { message: 'End date must be a valid date' }
      ),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate).getTime() >= new Date(data.startDate).getTime();
      }
      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { message: 'Project name is required' })
      .max(120, { message: 'Project name cannot exceed 120 characters' })
      .optional(),
    description: z
      .string()
      .trim()
      .max(1000, { message: 'Description cannot exceed 1000 characters' })
      .optional()
      .nullable(),
    status: z
      .nativeEnum(ProjectStatus, {
        errorMap: () => ({ message: 'Status must be NOT_STARTED, IN_PROGRESS, or COMPLETED' }),
      })
      .optional(),
    startDate: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) => !val || !isNaN(Date.parse(val)),
        { message: 'Start date must be a valid date' }
      ),
    endDate: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) => !val || !isNaN(Date.parse(val)),
        { message: 'End date must be a valid date' }
      ),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate).getTime() >= new Date(data.startDate).getTime();
      }
      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

export const projectQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  sortBy: z.enum(['name', 'createdAt', 'startDate', 'endDate', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectQueryParams = z.infer<typeof projectQuerySchema>;

export type ProjectHealth = 'ON_TRACK' | 'AT_RISK' | 'OVERDUE';

export function calculateProjectHealth(project: {
  status: ProjectStatusType;
  endDate?: string | null;
  completionPercentage?: number;
}): ProjectHealth {
  if (project.status === 'COMPLETED') return 'ON_TRACK';
  if (!project.endDate) return 'ON_TRACK';

  const end = new Date(project.endDate).getTime();
  const now = Date.now();
  const completion = project.completionPercentage ?? 0;

  if (now > end && completion < 100) {
    return 'OVERDUE';
  }

  const msRemaining = end - now;
  const daysRemaining = msRemaining / (1000 * 60 * 60 * 24);
  if (daysRemaining <= 3 && daysRemaining >= 0 && completion < 50) {
    return 'AT_RISK';
  }

  return 'ON_TRACK';
}

export interface ProjectDto {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: ProjectStatusType;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  completionPercentage?: number;
  health?: ProjectHealth;
  _count?: {
    tasks: number;
  };
}
