import { Router } from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/event.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { createEventSchema, updateEventSchema, eventQuerySchema } from '../schemas/event.schema';

const router = Router();

router.use(authenticate);

router.get('/', validate(eventQuerySchema, 'query'), getEvents);
router.post('/', validate(createEventSchema), createEvent);
router.patch('/:id', validate(updateEventSchema), updateEvent);
router.delete('/:id', deleteEvent);

export default router;
