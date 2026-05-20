import { Prisma, TaskStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/response';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import type { CreateTaskInput, UpdateTaskInput, TaskQuery } from '../schemas/task.schema';
import type { Request } from 'express';

export const taskService = {
  async findAll(userId: string, query: TaskQuery) {
    const { page, limit, skip } = parsePagination(
      { query } as Request,
      { page: query.page, limit: query.limit }
    );

    const where: Prisma.TaskWhereInput = {
      userId,
      parentId: query.includeSubtasks ? undefined : null,
      ...(query.status && { status: query.status }),
      ...(query.priority && { priority: query.priority }),
      ...(query.subjectId && { subjectId: query.subjectId }),
      ...(query.tagId && { tags: { some: { tagId: query.tagId } } }),
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subject: { select: { id: true, name: true, color: true, icon: true } },
          tags: { include: { tag: true } },
          subtasks: true,
          _count: { select: { subtasks: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks: tasks.map(normalizeTask),
      pagination: buildPaginationMeta(total, { page, limit, skip }),
    };
  },

  async findById(id: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true, color: true, icon: true } },
        tags: { include: { tag: true } },
        subtasks: true,
        _count: { select: { subtasks: true } },
      },
    });

    if (!task) throw new NotFoundError('Task');
    if (task.userId !== userId) throw new ForbiddenError();

    return normalizeTask(task);
  },

  async create(userId: string, input: CreateTaskInput) {
    const { tagIds, ...rest } = input;

    const task = await prisma.task.create({
      data: {
        ...rest,
        userId,
        dueDate: rest.dueDate ? new Date(rest.dueDate) : undefined,
        tags: tagIds?.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      } as any,
      include: {
        subject: { select: { id: true, name: true, color: true, icon: true } },
        tags: { include: { tag: true } },
        _count: { select: { subtasks: true } },
      },
    });

    return normalizeTask(task);
  },

  async update(id: string, userId: string, input: UpdateTaskInput) {
    const task = await prisma.task.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!task) throw new NotFoundError('Task');
    if (task.userId !== userId) throw new ForbiddenError();

    const { tagIds, ...rest } = input;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...rest,
        dueDate: rest.dueDate ? new Date(rest.dueDate) : rest.dueDate,
        ...(tagIds && {
          tags: {
            deleteMany: {},
            create: tagIds.map((tagId) => ({ tagId })),
          },
        }),
      } as any,
      include: {
        subject: { select: { id: true, name: true, color: true, icon: true } },
        tags: { include: { tag: true } },
        subtasks: true,
        _count: { select: { subtasks: true } },
      },
    });

    return normalizeTask(updated);
  },

  async getUserStats(userId: string) {
    const now = new Date();
    const startOfWeek = new Date(now);

    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [tasksByStatus, overdueCount, completedThisWeek] =
      await Promise.all([
        prisma.task.groupBy({
          by: ['status'],
          where: { userId },
          _count: true,
        }),
        prisma.task.count({
          where: {
            userId,
            status: {
              notIn: [TaskStatus.DONE, TaskStatus.CANCELLED],
            },
            dueDate: { lt: now },
          },
        }),
        prisma.task.count({
          where: {
            userId,
            status: TaskStatus.DONE,
            completedAt: {
              gte: startOfWeek,
            },
          },
        }),
      ]);

    const statusMap = Object.fromEntries(
      tasksByStatus.map((s) => [s.status, s._count])
    );

    return {
      total: Object.values(statusMap).reduce(
        (a, b) => Number(a) + Number(b),
        0
      ),
      byStatus: statusMap,
      overdueCount,
      completedThisWeek,
    };
  },

  async delete(id: string, userId: string): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!task) throw new NotFoundError('Task');
    if (task.userId !== userId) throw new ForbiddenError();

    await prisma.task.delete({ where: { id } });
  },
};

const normalizeTask = (task: any) => ({
  ...task,
  tags: task.tags?.map((t: any) => t.tag) ?? [],
});