import { z } from 'zod';

export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
    .default('#6366f1'),
  icon: z.string().max(50).default('book'),
});

export const updateSubjectSchema = createSubjectSchema.partial().extend({
  isArchived: z.boolean().optional(),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
