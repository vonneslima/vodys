import { Router } from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
} from '../controllers/task.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { createTaskSchema, updateTaskSchema, taskQuerySchema } from '../schemas/task.schema';

const router = Router();

router.use(authenticate);

router.get('/', validate(taskQuerySchema, 'query'), getTasks);
router.get('/stats', getTaskStats);
router.get('/:id', getTask);
router.post('/', validate(createTaskSchema), createTask);
router.patch('/:id', validate(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);

export default router;
