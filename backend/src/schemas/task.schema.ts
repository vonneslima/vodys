import { z } from 'zod';
import { Priority, TaskStatus } from '@prisma/client';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255).trim(),
  description: z.string().max(5000).optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedMin: z.number().int().positive().optional(),
  subjectId: z.string().uuid().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).default([]),
  position: z.number().int().default(0),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).trim().optional(),
  description: z.string().max(5000).optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedMin: z.number().int().positive().optional().nullable(),
  actualMin: z.number().int().positive().optional().nullable(),
  subjectId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
  position: z.number().int().optional(),
});

export const taskQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  subjectId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  tagId: z.string().uuid().optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['dueDate', 'priority', 'createdAt', 'position']).default('position'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  includeSubtasks: z.coerce.boolean().default(false),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;
