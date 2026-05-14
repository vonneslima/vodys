import { z } from 'zod';

export const startPomodoroSchema = z.object({
  durationMin: z.number().int().min(1).max(120).default(25),
  breakMin: z.number().int().min(1).max(60).default(5),
  taskId: z.string().uuid().optional().nullable(),
  type: z.enum(['work', 'short_break', 'long_break']).default('work'),
});

export const completePomodoroSchema = z.object({
  id: z.string().uuid(),
});

export type StartPomodoroInput = z.infer<typeof startPomodoroSchema>;
