import { Request, Response } from 'express';
import { eventService } from '../services/event.service';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import type { CreateEventInput, UpdateEventInput, EventQuery } from '../schemas/event.schema';

export const getEvents = async (req: Request, res: Response): Promise<void> => {
  const events = await eventService.findAll(req.user!.id, req.query as unknown as EventQuery);
  sendSuccess(res, events);
};

export const createEvent = async (
  req: Request<{}, {}, CreateEventInput>,
  res: Response
): Promise<void> => {
  const event = await eventService.create(req.user!.id, req.body);
  sendCreated(res, event, 'Event created');
};

export const updateEvent = async (
  req: Request<{ id: string }, {}, UpdateEventInput>,
  res: Response
): Promise<void> => {
  const event = await eventService.update(req.params.id, req.user!.id, req.body);
  sendSuccess(res, event, { message: 'Event updated' });
};

export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  await eventService.delete(req.params.id, req.user!.id);
  sendNoContent(res);
};
