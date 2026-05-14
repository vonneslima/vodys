import { prisma } from '../config/database';
import { NotFoundError } from '../utils/response';

export const adminService = {
  async getUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          createdAt: true,
          _count: { select: { tasks: true, subjects: true, pomodoroSessions: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    return { users, total, page, totalPages: Math.ceil(total / limit) };
  },

  async toggleUserStatus(userId: string, isActive: boolean) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, email: true, isActive: true },
    });
  },

  async getPlatformStats() {
    const [
      totalUsers,
      activeUsers,
      totalTasks,
      completedTasks,
      totalPomodoros,
      newUsersThisMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'DONE' } }),
      prisma.pomodoroSession.count({ where: { completedAt: { not: null }, type: 'work' } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalTasks,
      completedTasks,
      totalPomodoros,
      newUsersThisMonth,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  },
};
