import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/response';
import type { StartPomodoroInput } from '../schemas/pomodoro.schema';

export const pomodoroService = {
  async start(userId: string, input: StartPomodoroInput) {
    return prisma.pomodoroSession.create({
      data: {
        userId,
        taskId: input.taskId,
        durationMin: input.durationMin,
        breakMin: input.breakMin,
        type: input.type,
      },
    });
  },

  async complete(id: string, userId: string) {
    const session = await prisma.pomodoroSession.findUnique({
      where: { id },
      select: { userId: true, completedAt: true, cancelledAt: true },
    });

    if (!session) throw new NotFoundError('Pomodoro session');
    if (session.userId !== userId) throw new ForbiddenError();
    if (session.completedAt || session.cancelledAt) {
      throw new Error('Session already finished');
    }

    return prisma.pomodoroSession.update({
      where: { id },
      data: { completedAt: new Date() },
    });
  },

  async cancel(id: string, userId: string) {
    const session = await prisma.pomodoroSession.findUnique({
      where: { id },
      select: { userId: true, completedAt: true, cancelledAt: true },
    });

    if (!session) throw new NotFoundError('Pomodoro session');
    if (session.userId !== userId) throw new ForbiddenError();

    return prisma.pomodoroSession.update({
      where: { id },
      data: { cancelledAt: new Date() },
    });
  },

  async getHistory(userId: string, limit = 50) {
    return prisma.pomodoroSession.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async getStats(userId: string) {
    const [total, totalMinutes, longestStreak] = await Promise.all([
      prisma.pomodoroSession.count({
        where: { userId, type: 'work', completedAt: { not: null } },
      }),
      prisma.pomodoroSession.aggregate({
        where: { userId, type: 'work', completedAt: { not: null } },
        _sum: { durationMin: true },
      }),
      // Calculate current streak
      prisma.pomodoroSession.findMany({
        where: { userId, type: 'work', completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true },
        take: 100,
      }),
    ]);

    const streak = calculateStreak(longestStreak.map((s) => s.completedAt!));

    return {
      totalSessions: total,
      totalMinutes: totalMinutes._sum.durationMin ?? 0,
      totalHours: Math.round(((totalMinutes._sum.durationMin ?? 0) / 60) * 10) / 10,
      currentStreak: streak,
    };
  },
};

const calculateStreak = (dates: Date[]): number => {
  if (!dates.length) return 0;

  let streak = 1;
  const sorted = [...dates].sort((a, b) => b.getTime() - a.getTime());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDate = new Date(sorted[0]);
  lastDate.setHours(0, 0, 0, 0);

  // Check if there's a session today or yesterday
  const diffFromToday = (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
  if (diffFromToday > 1) return 0;

  for (let i = 1; i < sorted.length; i++) {
    const curr = new Date(sorted[i]);
    curr.setHours(0, 0, 0, 0);
    const prev = new Date(sorted[i - 1]);
    prev.setHours(0, 0, 0, 0);

    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else if (diff > 1) break;
  }

  return streak;
};
