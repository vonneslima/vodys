import { z } from 'zod';

const eventBaseSchema = z.object({
  title: z.string().min(1).max(255).trim(),
  description: z.string().max(2000).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  allDay: z.boolean().default(false),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366f1'),
  subjectId: z.string().uuid().optional().nullable(),
  location: z.string().max(255).optional(),
  recurrence: z.string().optional(),
});

export const createEventSchema = eventBaseSchema.refine(
  (d) => new Date(d.endAt) > new Date(d.startAt),
  {
    message: 'End date must be after start date',
    path: ['endAt'],
  }
);

export const updateEventSchema = eventBaseSchema.partial();

export const eventQuerySchema = z.object({
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  subjectId: z.string().uuid().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventQuery = z.infer<typeof eventQuerySchema>;