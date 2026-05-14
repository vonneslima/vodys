import { Request, Response } from 'express';
import { taskService } from '../services/task.service';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import type { CreateTaskInput, UpdateTaskInput, TaskQuery } from '../schemas/task.schema';

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  const result = await taskService.findAll(req.user!.id, req.query as unknown as TaskQuery);
  sendSuccess(res, result.tasks, { meta: result.pagination as unknown as Record<string, unknown> });
};

export const getTask = async (req: Request, res: Response): Promise<void> => {
  const task = await taskService.findById(req.params.id, req.user!.id);
  sendSuccess(res, task);
};

export const createTask = async (
  req: Request<{}, {}, CreateTaskInput>,
  res: Response
): Promise<void> => {
  const task = await taskService.create(req.user!.id, req.body);
  sendCreated(res, task, 'Task created');
};

export const updateTask = async (
  req: Request<{ id: string }, {}, UpdateTaskInput>,
  res: Response
): Promise<void> => {
  const task = await taskService.update(req.params.id, req.user!.id, req.body);
  sendSuccess(res, task, { message: 'Task updated' });
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  await taskService.delete(req.params.id, req.user!.id);
  sendNoContent(res);
};

export const getTaskStats = async (req: Request, res: Response): Promise<void> => {
  const stats = await taskService.getUserStats(req.user!.id);
  sendSuccess(res, stats);
};
