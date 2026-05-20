import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/response';
import type { CreateEventInput, UpdateEventInput, EventQuery } from '../schemas/event.schema';

export const eventService = {
  async findAll(userId: string, query: EventQuery) {
    return prisma.event.findMany({
      where: {
        userId,
        ...(query.subjectId && { subjectId: query.subjectId }),
        ...(query.startAt && { startAt: { gte: new Date(query.startAt) } }),
        ...(query.endAt && { endAt: { lte: new Date(query.endAt) } }),
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
      orderBy: { startAt: 'asc' },
    });
  },

  async create(userId: string, input: CreateEventInput) {
    if (input.subjectId) {
      const subject = await prisma.subject.findUnique({
        where: { id: input.subjectId },
        select: { userId: true },
      });

      if (!subject || subject.userId !== userId) {
        throw new ForbiddenError('Subject not found or access denied');
      }
    }

    const safeInput: any = {
      ...input,
      userId,
      startAt: new Date(input.startAt),
      endAt: new Date(input.endAt),
    };

    return prisma.event.create({
      data: safeInput,
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
    });
  },

  async update(id: string, userId: string, input: UpdateEventInput) {
    const event = await prisma.event.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!event) throw new NotFoundError('Event');
    if (event.userId !== userId) throw new ForbiddenError();

    return prisma.event.update({
      where: { id },
      data: {
        ...input,
        startAt: input.startAt ? new Date(input.startAt) : undefined,
        endAt: input.endAt ? new Date(input.endAt) : undefined,
      } as any,
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
    });
  },

  async delete(id: string, userId: string): Promise<void> {
    const event = await prisma.event.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!event) throw new NotFoundError('Event');
    if (event.userId !== userId) throw new ForbiddenError();

    await prisma.event.delete({
      where: { id },
    });
  },
};