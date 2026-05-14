import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import subjectRoutes from './subject.routes';
import taskRoutes from './task.routes';
import eventRoutes from './event.routes';
import pomodoroRoutes from './pomodoro.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';

export const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/subjects', subjectRoutes);
router.use('/tasks', taskRoutes);
router.use('/events', eventRoutes);
router.use('/pomodoro', pomodoroRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
