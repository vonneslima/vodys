import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { sendSuccess } from '../utils/response';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await adminService.getUsers(page, limit);
  sendSuccess(res, result);
};

export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  const { isActive } = req.body as { isActive: boolean };
  const user = await adminService.toggleUserStatus(req.params.id, isActive);
  sendSuccess(res, user, { message: `User ${isActive ? 'activated' : 'deactivated'}` });
};

export const getPlatformStats = async (_req: Request, res: Response): Promise<void> => {
  const stats = await adminService.getPlatformStats();
  sendSuccess(res, stats);
};
