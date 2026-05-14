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
      parentId: query.includeSubtasks ? undefined : null, // root tasks only by default
      ...(query.status && { status: query.status }),
      ...(query.priority && { priority: query.priority }),
      ...(query.subjectId && { subjectId: query.subjectId }),
      ...(query.tagId && { tags: { some: { tagId: query.tagId } } }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...(query.dueBefore && { dueDate: { lte: new Date(query.dueBefore) } }),
      ...(query.dueAfter && { dueDate: { gte: new Date(query.dueAfter) } }),
    };

    const orderBy: Prisma.TaskOrderByWithRelationInput = {
      [query.sortBy]: query.sortOrder,
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          subject: { select: { id: true, name: true, color: true, icon: true } },
          tags: { include: { tag: true } },
          subtasks: {
            select: { id: true, title: true, status: true },
            orderBy: { position: 'asc' },
          },
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
        subtasks: {
          include: { tags: { include: { tag: true } } },
          orderBy: { position: 'asc' },
        },
        parent: { select: { id: true, title: true } },
        _count: { select: { subtasks: true } },
      },
    });

    if (!task) throw new NotFoundError('Task');
    if (task.userId !== userId) throw new ForbiddenError();

    return normalizeTask(task);
  },

  async create(userId: string, input: CreateTaskInput) {
    // Verify subject ownership
    if (input.subjectId) {
      const subject = await prisma.subject.findUnique({
        where: { id: input.subjectId },
        select: { userId: true },
      });
      if (!subject || subject.userId !== userId) {
        throw new ForbiddenError('Subject not found or access denied');
      }
    }

    // Verify parent task ownership
    if (input.parentId) {
      const parent = await prisma.task.findUnique({
        where: { id: input.parentId },
        select: { userId: true },
      });
      if (!parent || parent.userId !== userId) {
        throw new ForbiddenError('Parent task not found or access denied');
      }
    }

    const { tagIds, ...rest } = input;

    const task = await prisma.task.create({
      data: {
        ...rest,
        userId,
        dueDate: rest.dueDate ? new Date(rest.dueDate) : undefined,
        tags: tagIds.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
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
        completedAt:
          rest.status === TaskStatus.DONE && task.status !== TaskStatus.DONE
            ? new Date()
            : rest.status !== TaskStatus.DONE
            ? null
            : undefined,
        ...(tagIds !== undefined && {
          tags: {
            deleteMany: {},
            create: tagIds.map((tagId) => ({ tagId })),
          },
        }),
      },
      include: {
        subject: { select: { id: true, name: true, color: true, icon: true } },
        tags: { include: { tag: true } },
        subtasks: {
          select: { id: true, title: true, status: true },
          orderBy: { position: 'asc' },
        },
        _count: { select: { subtasks: true } },
      },
    });

    return normalizeTask(updated);
  },

  async delete(id: string, userId: string): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!task) throw new NotFoundError('Task');
    if (task.userId !== userId) throw new ForbiddenError();

    // Cascade delete subtasks via Prisma self-relation
    await prisma.task.delete({ where: { id } });
  },

  async getUserStats(userId: string) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [tasksByStatus, overdueCount, completedThisWeek, upcomingTasks] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
      prisma.task.count({
        where: {
          userId,
          status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
          dueDate: { lt: now },
        },
      }),
      prisma.task.count({
        where: {
          userId,
          status: TaskStatus.DONE,
          completedAt: { gte: startOfWeek },
        },
      }),
      prisma.task.findMany({
        where: {
          userId,
          status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
          dueDate: { gte: now },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
        include: {
          subject: { select: { name: true, color: true } },
        },
      }),
    ]);

    const statusMap = Object.fromEntries(
      tasksByStatus.map((s) => [s.status, s._count])
    );

    return {
      total: Object.values(statusMap).reduce((a, b) => a + b, 0),
      byStatus: statusMap,
      overdueCount,
      completedThisWeek,
      upcomingTasks: upcomingTasks.map(normalizeTask),
    };
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeTask = (task: any) => ({
  ...task,
  tags: task.tags?.map((t: { tag: unknown }) => t.tag) ?? [],
});
