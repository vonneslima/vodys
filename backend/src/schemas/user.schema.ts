import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().min(1).max(50).trim().optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .toLowerCase()
    .optional(),
  timezone: z.string().optional(),
  weeklyGoalHours: z.number().int().min(1).max(168).optional(),
  themePreference: z.enum(['dark', 'light', 'system']).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
