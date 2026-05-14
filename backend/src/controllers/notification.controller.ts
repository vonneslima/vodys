import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { sendSuccess, sendNoContent } from '../utils/response';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  const unreadOnly = req.query.unread === 'true';
  const notifications = await notificationService.findAll(req.user!.id, unreadOnly);
  sendSuccess(res, notifications);
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  const count = await notificationService.getUnreadCount(req.user!.id);
  sendSuccess(res, { count });
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  const notification = await notificationService.markAsRead(req.params.id, req.user!.id);
  sendSuccess(res, notification);
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  const result = await notificationService.markAllAsRead(req.user!.id);
  sendSuccess(res, result, { message: `${result.count} notifications marked as read` });
};

export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  await notificationService.delete(req.params.id, req.user!.id);
  sendNoContent(res);
};
