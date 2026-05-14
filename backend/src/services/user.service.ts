import { prisma } from '../config/database';
import { cache, CACHE_KEYS } from '../config/redis';
import { NotFoundError, ConflictError } from '../utils/response';
import type { UpdateProfileInput } from '../schemas/user.schema';

export const userService = {
  async getProfile(userId: string) {
    const cached = await cache.get(CACHE_KEYS.userProfile(userId));
    if (cached) return cached;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        timezone: true,
        weeklyGoalHours: true,
        themePreference: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundError('User');

    await cache.set(CACHE_KEYS.userProfile(userId), user, 600); // 10 min
    return user;
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    if (input.username) {
      const existing = await prisma.user.findFirst({
        where: { username: input.username, id: { not: userId } },
      });
      if (existing) throw new ConflictError('Username already taken');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        timezone: true,
        weeklyGoalHours: true,
        themePreference: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    await cache.del(CACHE_KEYS.userProfile(userId));
    return updated;
  },

  async updateAvatar(userId: string, avatarUrl: string) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { avatarUrl: true },
    });

    await cache.del(CACHE_KEYS.userProfile(userId));
    return updated;
  },

  async getDashboardStats(userId: string) {
    const cached = await cache.get(CACHE_KEYS.userStats(userId));
    if (cached) return cached;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [
      totalTasks,
      completedTasks,
      overdueCount,
      pomodoroThisWeek,
      studyMinutesThisWeek,
      subjectCount,
    ] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: 'DONE' } }),
      prisma.task.count({
        where: {
          userId,
          status: { notIn: ['DONE', 'CANCELLED'] },
          dueDate: { lt: now },
        },
      }),
      prisma.pomodoroSession.count({
        where: {
          userId,
          type: 'work',
          completedAt: { not: null, gte: startOfWeek },
        },
      }),
      prisma.pomodoroSession.aggregate({
        where: {
          userId,
          type: 'work',
          completedAt: { not: null, gte: startOfWeek },
        },
        _sum: { durationMin: true },
      }),
      prisma.subject.count({ where: { userId, isArchived: false } }),
    ]);

    const stats = {
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      overdueCount,
      pomodorosThisWeek: pomodoroThisWeek,
      studyMinutesThisWeek: studyMinutesThisWeek._sum.durationMin ?? 0,
      subjectCount,
    };

    await cache.set(CACHE_KEYS.userStats(userId), stats, 60); // 1 min
    return stats;
  },

  async getWeeklyProgress(userId: string) {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const sessions = await prisma.pomodoroSession.findMany({
      where: {
        userId,
        type: 'work',
        completedAt: {
          gte: days[0],
          lte: new Date(),
        },
      },
      select: { completedAt: true, durationMin: true },
    });

    return days.map((day) => {
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const daySessions = sessions.filter(
        (s) => s.completedAt && s.completedAt >= day && s.completedAt <= dayEnd
      );

      return {
        date: day.toISOString().split('T')[0],
        label: day.toLocaleDateString('en-US', { weekday: 'short' }),
        minutes: daySessions.reduce((sum, s) => sum + (s.durationMin ?? 0), 0),
        sessions: daySessions.length,
      };
    });
  },
};
