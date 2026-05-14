import { Router } from 'express';
import {
  startPomodoro,
  completePomodoro,
  cancelPomodoro,
  getPomodoroHistory,
  getPomodoroStats,
} from '../controllers/pomodoro.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { startPomodoroSchema } from '../schemas/pomodoro.schema';

const router = Router();

router.use(authenticate);

router.post('/start', validate(startPomodoroSchema), startPomodoro);
router.patch('/:id/complete', completePomodoro);
router.patch('/:id/cancel', cancelPomodoro);
router.get('/history', getPomodoroHistory);
router.get('/stats', getPomodoroStats);

export default router;
