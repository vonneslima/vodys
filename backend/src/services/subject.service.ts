import { prisma } from '../config/database';
import { cache, CACHE_KEYS } from '../config/redis';
import { NotFoundError, ForbiddenError } from '../utils/response';
import type { CreateSubjectInput, UpdateSubjectInput } from '../schemas/subject.schema';

export const subjectService = {
  async findAll(userId: string) {
    const cached = await cache.get<unknown[]>(CACHE_KEYS.userSubjects(userId));
    if (cached) return cached;

    const subjects = await prisma.subject.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            tasks: true,
            events: true,
            studySessions: true,
          },
        },
      },
      orderBy: [{ isArchived: 'asc' }, { name: 'asc' }],
    });

    await cache.set(CACHE_KEYS.userSubjects(userId), subjects, 300); // 5 min cache
    return subjects;
  },

  async findById(id: string, userId: string) {
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: { select: { tasks: true, events: true } },
        tasks: {
          where: { parentId: null },
          orderBy: { position: 'asc' },
          take: 10,
          include: { tags: { include: { tag: true } } },
        },
      },
    });

    if (!subject) throw new NotFoundError('Subject');
    if (subject.userId !== userId) throw new ForbiddenError();

    return subject;
  },

  async create(userId: string, input: CreateSubjectInput) {
    const subject = await prisma.subject.create({
      data: { ...input, userId },
      include: { _count: { select: { tasks: true } } },
    });

    await cache.del(CACHE_KEYS.userSubjects(userId));
    return subject;
  },

  async update(id: string, userId: string, input: UpdateSubjectInput) {
    const subject = await prisma.subject.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!subject) throw new NotFoundError('Subject');
    if (subject.userId !== userId) throw new ForbiddenError();

    const updated = await prisma.subject.update({
      where: { id },
      data: input,
      include: { _count: { select: { tasks: true } } },
    });

    await cache.del(CACHE_KEYS.userSubjects(userId));
    return updated;
  },

  async delete(id: string, userId: string): Promise<void> {
    const subject = await prisma.subject.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!subject) throw new NotFoundError('Subject');
    if (subject.userId !== userId) throw new ForbiddenError();

    await prisma.subject.delete({ where: { id } });
    await cache.del(CACHE_KEYS.userSubjects(userId));
  },
};
