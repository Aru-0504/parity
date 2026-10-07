import { z } from 'zod';

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export type TaskPriorityType = typeof TaskPriority[keyof typeof TaskPriority];

export const TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus];

export const createTaskSchema = z.object({
  projectId: z.string().min(1, { message: 'Project ID is required' }),
  name: z
    .string()
    .trim()
    .min(1, { message: 'Task name is required' })
    .max(120, { message: 'Task name cannot exceed 120 characters' }),
  description: z
    .string()
    .trim()
    .max(1000, { message: 'Description cannot exceed 1000 characters' })
    .optional()
    .nullable(),
  priority: z
    .nativeEnum(TaskPriority, {
      errorMap: () => ({ message: 'Priority must be LOW, MEDIUM, or HIGH' }),
    })
    .default(TaskPriority.MEDIUM),
  status: z
    .nativeEnum(TaskStatus, {
      errorMap: () => ({ message: 'Status must be PENDING, IN_PROGRESS, or COMPLETED' }),
    })
    .default(TaskStatus.PENDING),
  dueDate: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      { message: 'Due date must be a valid date' }
    ),
});

export const updateTaskSchema = z.object({
  projectId: z.string().min(1, { message: 'Project ID must be valid' }).optional(),
  name: z
    .string()
    .trim()
    .min(1, { message: 'Task name cannot be empty' })
    .max(120, { message: 'Task name cannot exceed 120 characters' })
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, { message: 'Description cannot exceed 1000 characters' })
    .optional()
    .nullable(),
  priority: z
    .nativeEnum(TaskPriority, {
      errorMap: () => ({ message: 'Priority must be LOW, MEDIUM, or HIGH' }),
    })
    .optional(),
  status: z
    .nativeEnum(TaskStatus, {
      errorMap: () => ({ message: 'Status must be PENDING, IN_PROGRESS, or COMPLETED' }),
    })
    .optional(),
  dueDate: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      { message: 'Due date must be a valid date' }
    ),
});

export const taskQuerySchema = z.object({
  projectId: z.string().optional(),
  search: z.string().trim().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  sortBy: z.enum(['name', 'dueDate', 'createdAt', 'priority', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(30),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryParams = z.infer<typeof taskQuerySchema>;

export interface TaskDto {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  priority: TaskPriorityType;
  status: TaskStatusType;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
}
