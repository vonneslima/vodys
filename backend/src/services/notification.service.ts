import { NotificationType } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/response';

export const notificationService = {
  async findAll(userId: string, unreadOnly = false) {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },

  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!notification) throw new NotFoundError('Notification');
    if (notification.userId !== userId) throw new ForbiddenError();

    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  },

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { count: result.count };
  },

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  },

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ) {
    return prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: data as any,
      },
    });
  },

  async delete(id: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!notification) throw new NotFoundError('Notification');
    if (notification.userId !== userId) throw new ForbiddenError();

    await prisma.notification.delete({
      where: { id },
    });
  },
};