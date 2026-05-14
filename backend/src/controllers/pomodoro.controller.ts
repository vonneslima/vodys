import { Request, Response } from 'express';
import { pomodoroService } from '../services/pomodoro.service';
import { sendSuccess, sendCreated } from '../utils/response';
import type { StartPomodoroInput } from '../schemas/pomodoro.schema';

export const startPomodoro = async (
  req: Request<{}, {}, StartPomodoroInput>,
  res: Response
): Promise<void> => {
  const session = await pomodoroService.start(req.user!.id, req.body);
  sendCreated(res, session, 'Pomodoro session started');
};

export const completePomodoro = async (req: Request, res: Response): Promise<void> => {
  const session = await pomodoroService.complete(req.params.id, req.user!.id);
  sendSuccess(res, session, { message: 'Pomodoro completed!' });
};

export const cancelPomodoro = async (req: Request, res: Response): Promise<void> => {
  const session = await pomodoroService.cancel(req.params.id, req.user!.id);
  sendSuccess(res, session, { message: 'Pomodoro cancelled' });
};

export const getPomodoroHistory = async (req: Request, res: Response): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 50;
  const history = await pomodoroService.getHistory(req.user!.id, limit);
  sendSuccess(res, history);
};

export const getPomodoroStats = async (req: Request, res: Response): Promise<void> => {
  const stats = await pomodoroService.getStats(req.user!.id);
  sendSuccess(res, stats);
};
